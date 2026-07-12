"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import type { DayKey, OpeningHours } from "@/lib/opening-hours";

type ActionState = { error?: string; success?: string } | undefined;

/** May the user edit this business? Owner of an approved claim, or admin/moderator. */
async function canEditBusiness(businessId: string) {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.role === "ADMIN" || user.role === "MODERATOR") return user;
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { claimedByUserId: true },
  });
  if (business?.claimedByUserId === user.id) return user;
  return null;
}

const businessSchema = z.object({
  name: z.string().min(2, "Namnet är för kort").max(150),
  shortDescription: z.string().max(200),
  description: z.string().max(5000),
  address: z.string().max(200),
  postalCode: z.string().max(10),
  city: z.string().max(100),
  municipalityId: z.string().max(64).optional().or(z.literal("")),
  phone: z.string().max(30),
  email: z.string().email("Ogiltig e-postadress").or(z.literal("")),
  website: z.string().url("Ogiltig webbadress (måste börja med https://)").or(z.literal("")),
  bookingUrl: z.string().url("Ogiltig bokningslänk").or(z.literal("")),
});

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const HOURS_RE = /^([01]?\d|2[0-3]):[0-5]\d-([01]?\d|2[0-3]):[0-5]\d$/;

/** Parses "09:00-17:00, 18:00-21:00" (or blank = closed) per day. */
function parseHoursInput(formData: FormData): { hours: OpeningHours; error?: string } {
  const hours: OpeningHours = {};
  for (const day of DAY_KEYS) {
    const value = String(formData.get(`hours_${day}`) ?? "").trim();
    if (!value) {
      hours[day] = [];
      continue;
    }
    const intervals: [string, string][] = [];
    for (const part of value.split(",").map((p) => p.trim())) {
      if (!HOURS_RE.test(part)) {
        return { hours: {}, error: `Ogiltigt tidsformat för ${day}: "${part}". Använd t.ex. 09:00-17:00` };
      }
      const [open, close] = part.split("-");
      intervals.push([open, close]);
    }
    hours[day] = intervals;
  }
  return { hours };
}

export async function updateBusinessAction(
  businessId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await canEditBusiness(businessId);
  if (!user) return { error: "Du har inte behörighet att redigera detta företag." };

  const parsed = businessSchema.safeParse({
    name: formData.get("name"),
    shortDescription: formData.get("shortDescription"),
    description: formData.get("description"),
    address: formData.get("address"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    municipalityId: formData.get("municipalityId"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    website: formData.get("website"),
    bookingUrl: formData.get("bookingUrl"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { hours, error: hoursError } = parseHoursInput(formData);
  if (hoursError) return { error: hoursError };

  const previous = await prisma.business.findUnique({ where: { id: businessId } });
  if (!previous) return { error: "Företaget finns inte." };

  const data = {
    ...parsed.data,
    municipalityId: parsed.data.municipalityId || null,
    openingHours: hours as object,
  };

  await prisma.business.update({ where: { id: businessId }, data });
  await logAudit({
    userId: user.id,
    entityType: "Business",
    entityId: businessId,
    action: "update",
    previousValue: { name: previous.name, phone: previous.phone, email: previous.email },
    newValue: { name: data.name, phone: data.phone, email: data.email },
  });

  revalidatePath(`/foretag/${previous.slug}`);
  revalidatePath("/panel");
  return { success: "Företaget har uppdaterats." };
}

const offerSchema = z.object({
  title: z.string().min(3, "Rubriken är för kort").max(120),
  description: z.string().max(1000),
  startDate: z.string().min(1, "Ange startdatum"),
  endDate: z.string().min(1, "Ange slutdatum"),
});

export async function createOfferAction(
  businessId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await canEditBusiness(businessId);
  if (!user) return { error: "Du har inte behörighet." };

  const parsed = offerSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { error: "Ogiltigt datum." };
  if (end < start) return { error: "Slutdatum måste vara efter startdatum." };

  await prisma.offer.create({
    data: {
      businessId,
      title: parsed.data.title,
      description: parsed.data.description,
      startDate: start,
      endDate: end,
      active: true,
    },
  });
  revalidatePath("/panel");
  revalidatePath("/erbjudanden");
  return { success: "Erbjudandet har skapats." };
}

export async function toggleOfferAction(offerId: string) {
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer) return;
  const user = await canEditBusiness(offer.businessId);
  if (!user) return;
  await prisma.offer.update({ where: { id: offerId }, data: { active: !offer.active } });
  revalidatePath("/panel");
  revalidatePath("/erbjudanden");
}

const claimSchema = z.object({
  evidence: z.string().min(10, "Beskriv kort hur vi kan verifiera att du representerar företaget (minst 10 tecken).").max(2000),
});

export async function createClaimAction(
  businessId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) redirect("/logga-in");

  const rl = rateLimit(`claim:${user.id}`, { limit: 5, windowMs: 3600_000 });
  if (!rl.ok) return { error: "För många anspråk – försök igen senare." };

  const parsed = claimSchema.safeParse({ evidence: formData.get("evidence") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return { error: "Företaget finns inte." };
  if (business.claimedByUserId) return { error: "Denna profil är redan verifierad av en ägare." };

  const existing = await prisma.businessClaim.findFirst({
    where: { businessId, userId: user.id, status: "PENDING" },
  });
  if (existing) return { error: "Du har redan ett väntande anspråk på denna profil." };

  await prisma.businessClaim.create({
    data: { businessId, userId: user.id, evidence: parsed.data.evidence },
  });
  revalidatePath("/panel");
  return { success: "Ditt anspråk har skickats in och granskas av vår administratör." };
}

/** Business owners can request a sponsored campaign; admin activates it. */
const campaignRequestSchema = z.object({
  name: z.string().min(3).max(120),
  keywords: z.string().min(2, "Ange minst ett sökord").max(300),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

export async function requestCampaignAction(
  businessId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await canEditBusiness(businessId);
  if (!user) return { error: "Du har inte behörighet." };

  const parsed = campaignRequestSchema.safeParse({
    name: formData.get("name"),
    keywords: formData.get("keywords"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  if (!parsed.success) return { error: "Kontrollera fälten – namn, sökord och datum krävs." };

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return { error: "Ogiltig kampanjperiod." };
  }

  await prisma.campaign.create({
    data: {
      businessId,
      name: parsed.data.name,
      campaignType: "SEARCH_SPONSORED",
      startDate: start,
      endDate: end,
      status: "DRAFT",
      targetKeywords: parsed.data.keywords
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 20),
      priority: 5,
    },
  });
  revalidatePath("/panel");
  return {
    success:
      "Din annonsförfrågan har skickats. Vår administratör aktiverar kampanjen och kontaktar dig om pris.",
  };
}
