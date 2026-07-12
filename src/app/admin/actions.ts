"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { parseBusinessCsv, isLikelyDuplicate, type ParsedCsvRow } from "@/lib/csv-import";

type ActionState = { error?: string; success?: string } | undefined;

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) return null;
  return user;
}

// --- Business moderation -----------------------------------------------------

export async function toggleBusinessFlagAction(
  businessId: string,
  flag: "verified" | "premium" | "active",
) {
  const admin = await requireAdmin();
  if (!admin) return;
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return;
  const newValue = !business[flag];
  await prisma.business.update({ where: { id: businessId }, data: { [flag]: newValue } });
  await logAudit({
    userId: admin.id,
    entityType: "Business",
    entityId: businessId,
    action: `set-${flag}`,
    previousValue: { [flag]: business[flag] },
    newValue: { [flag]: newValue },
  });
  revalidatePath("/admin/foretag");
  revalidatePath(`/foretag/${business.slug}`);
}

const newBusinessSchema = z.object({
  name: z.string().min(2, "Namnet är för kort").max(150),
  primaryCategoryId: z.string().min(1, "Välj kategori"),
  municipalityId: z.string().min(1, "Välj kommun"),
  phone: z.string().max(30).optional().default(""),
  email: z.string().email().or(z.literal("")).optional().default(""),
  shortDescription: z.string().max(200).optional().default(""),
});

export async function createBusinessAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Behörighet saknas." };

  const parsed = newBusinessSchema.safeParse({
    name: formData.get("name"),
    primaryCategoryId: formData.get("primaryCategoryId"),
    municipalityId: formData.get("municipalityId"),
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    shortDescription: formData.get("shortDescription") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let slug = slugify(parsed.data.name);
  const existing = await prisma.business.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const municipality = await prisma.municipality.findUnique({
    where: { id: parsed.data.municipalityId },
  });

  const business = await prisma.business.create({
    data: {
      name: parsed.data.name,
      slug,
      shortDescription: parsed.data.shortDescription,
      phone: parsed.data.phone,
      email: parsed.data.email,
      primaryCategoryId: parsed.data.primaryCategoryId,
      municipalityId: parsed.data.municipalityId,
      city: municipality?.name ?? "",
      categories: { create: [{ categoryId: parsed.data.primaryCategoryId, primary: true }] },
    },
  });
  await logAudit({
    userId: admin.id,
    entityType: "Business",
    entityId: business.id,
    action: "create",
    newValue: { name: business.name },
  });
  revalidatePath("/admin/foretag");
  return { success: `${business.name} har skapats.` };
}

// --- Claims ----------------------------------------------------------------------

export async function reviewClaimAction(claimId: string, approve: boolean) {
  const admin = await requireAdmin();
  if (!admin) return;

  const claim = await prisma.businessClaim.findUnique({
    where: { id: claimId },
    include: { business: true, user: true },
  });
  if (!claim || claim.status !== "PENDING") return;

  if (approve) {
    await prisma.$transaction([
      prisma.businessClaim.update({
        where: { id: claimId },
        data: { status: "APPROVED", reviewedBy: admin.id, reviewedAt: new Date() },
      }),
      prisma.business.update({
        where: { id: claim.businessId },
        data: { claimedByUserId: claim.userId },
      }),
      // Promote plain users to business owners when their first claim is approved.
      ...(claim.user.role === "USER"
        ? [prisma.user.update({ where: { id: claim.userId }, data: { role: "BUSINESS_OWNER" } })]
        : []),
    ]);
  } else {
    await prisma.businessClaim.update({
      where: { id: claimId },
      data: { status: "REJECTED", reviewedBy: admin.id, reviewedAt: new Date() },
    });
  }

  await logAudit({
    userId: admin.id,
    entityType: "BusinessClaim",
    entityId: claimId,
    action: approve ? "approve" : "reject",
    newValue: { businessId: claim.businessId, userId: claim.userId },
  });
  revalidatePath("/admin/ansprak");
  revalidatePath("/panel");
}

// --- Campaigns ---------------------------------------------------------------------

const campaignSchema = z.object({
  businessId: z.string().min(1, "Välj företag"),
  name: z.string().min(3, "Ange kampanjnamn").max(120),
  keywords: z.string().max(300).optional().default(""),
  categoryIds: z.array(z.string()).optional().default([]),
  municipalityIds: z.array(z.string()).optional().default([]),
  startDate: z.string().min(1, "Ange startdatum"),
  endDate: z.string().min(1, "Ange slutdatum"),
  priority: z.coerce.number().int().min(0).max(100),
  budget: z.coerce.number().min(0).max(1_000_000),
  price: z.coerce.number().min(0).max(1_000_000),
});

export async function createCampaignAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Behörighet saknas." };

  const parsed = campaignSchema.safeParse({
    businessId: formData.get("businessId"),
    name: formData.get("name"),
    keywords: formData.get("keywords") ?? "",
    categoryIds: formData.getAll("categoryIds").map(String),
    municipalityIds: formData.getAll("municipalityIds").map(String),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    priority: formData.get("priority") ?? 5,
    budget: formData.get("budget") ?? 0,
    price: formData.get("price") ?? 0,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return { error: "Ogiltig kampanjperiod – slutdatum måste vara efter startdatum." };
  }

  const keywords = parsed.data.keywords
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 20);
  if (keywords.length === 0 && parsed.data.categoryIds.length === 0) {
    return { error: "Ange minst ett sökord eller en kategori som kampanjen riktas mot." };
  }

  const campaign = await prisma.campaign.create({
    data: {
      businessId: parsed.data.businessId,
      name: parsed.data.name,
      campaignType: "SEARCH_SPONSORED",
      startDate: start,
      endDate: end,
      status: "ACTIVE",
      targetKeywords: keywords,
      targetCategoryIds: parsed.data.categoryIds,
      targetMunicipalityIds: parsed.data.municipalityIds,
      priority: parsed.data.priority,
      budget: parsed.data.budget,
      price: parsed.data.price,
    },
  });
  await logAudit({
    userId: admin.id,
    entityType: "Campaign",
    entityId: campaign.id,
    action: "create",
    newValue: { name: campaign.name, keywords },
  });
  revalidatePath("/admin/kampanjer");
  return { success: `Kampanjen ”${campaign.name}” är skapad och aktiv.` };
}

export async function setCampaignStatusAction(
  campaignId: string,
  status: "ACTIVE" | "PAUSED" | "ENDED",
) {
  const admin = await requireAdmin();
  if (!admin) return;
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return;
  await prisma.campaign.update({ where: { id: campaignId }, data: { status } });
  await logAudit({
    userId: admin.id,
    entityType: "Campaign",
    entityId: campaignId,
    action: "set-status",
    previousValue: { status: campaign.status },
    newValue: { status },
  });
  revalidatePath("/admin/kampanjer");
}

// --- Categories --------------------------------------------------------------------

const categorySchema = z.object({
  name: z.string().min(2, "Namnet är för kort").max(80),
  description: z.string().max(500).optional().default(""),
  icon: z.string().max(8).optional().default(""),
});

export async function createCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Behörighet saknas." };

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    icon: formData.get("icon") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const slug = slugify(parsed.data.name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return { error: "Det finns redan en kategori med det namnet." };

  await prisma.category.create({
    data: { name: parsed.data.name, slug, description: parsed.data.description, icon: parsed.data.icon },
  });
  revalidatePath("/admin/kategorier");
  revalidatePath("/foretag");
  return { success: `Kategorin ${parsed.data.name} har skapats.` };
}

export async function toggleCategoryAction(categoryId: string) {
  const admin = await requireAdmin();
  if (!admin) return;
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return;
  await prisma.category.update({ where: { id: categoryId }, data: { active: !category.active } });
  revalidatePath("/admin/kategorier");
}

// --- CSV import -----------------------------------------------------------------------

export interface CsvPreviewState {
  error?: string;
  preview?: {
    rows: (ParsedCsvRow & { duplicateOf: string | null })[];
    validCount: number;
    csvText: string;
  };
  imported?: number;
  skipped?: number;
}

export async function previewCsvAction(
  _prev: CsvPreviewState | undefined,
  formData: FormData,
): Promise<CsvPreviewState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Behörighet saknas." };

  const csvText = String(formData.get("csv") ?? "").slice(0, 500_000);
  const result = parseBusinessCsv(csvText);
  if (!result.ok) return { error: result.headerError };
  if (result.rows.length === 0) return { error: "Inga datarader hittades." };
  if (result.rows.length > 500) return { error: "Max 500 rader per import." };

  const existingNames = await prisma.business.findMany({ select: { name: true } });
  const [categories, municipalities] = await Promise.all([
    prisma.category.findMany({ select: { slug: true, name: true } }),
    prisma.municipality.findMany({ select: { slug: true, name: true } }),
  ]);
  const categorySet = new Set([...categories.map((c) => c.slug), ...categories.map((c) => c.name.toLowerCase())]);
  const municipalitySet = new Set([...municipalities.map((m) => m.slug), ...municipalities.map((m) => m.name.toLowerCase())]);

  const seenInFile: string[] = [];
  const rows = result.rows.map((r) => {
    const errors = [...r.errors];
    if (r.row.category && !categorySet.has(r.row.category.toLowerCase())) {
      errors.push(`Okänd kategori: ${r.row.category}`);
    }
    if (r.row.municipality && !municipalitySet.has(r.row.municipality.toLowerCase())) {
      errors.push(`Okänd kommun: ${r.row.municipality}`);
    }
    const dupDb = existingNames.find((e) => isLikelyDuplicate(e.name, r.row.name));
    const dupFile = seenInFile.find((n) => isLikelyDuplicate(n, r.row.name));
    seenInFile.push(r.row.name);
    return {
      ...r,
      errors,
      duplicateOf: dupDb?.name ?? (dupFile ? `${dupFile} (i filen)` : null),
    };
  });

  return {
    preview: {
      rows,
      validCount: rows.filter((r) => r.errors.length === 0 && !r.duplicateOf).length,
      csvText,
    },
  };
}

export async function importCsvAction(
  _prev: CsvPreviewState | undefined,
  formData: FormData,
): Promise<CsvPreviewState> {
  const admin = await requireAdmin();
  if (!admin) return { error: "Behörighet saknas." };

  // Re-parse and re-validate server-side; never trust the preview round-trip.
  const preview = await previewCsvAction(undefined, formData);
  if (!preview.preview) return preview;

  const [categories, municipalities] = await Promise.all([
    prisma.category.findMany(),
    prisma.municipality.findMany(),
  ]);
  const findCategory = (v: string) =>
    categories.find((c) => c.slug === v.toLowerCase() || c.name.toLowerCase() === v.toLowerCase());
  const findMunicipality = (v: string) =>
    municipalities.find((m) => m.slug === v.toLowerCase() || m.name.toLowerCase() === v.toLowerCase());

  let imported = 0;
  let skipped = 0;
  for (const r of preview.preview.rows) {
    if (r.errors.length > 0 || r.duplicateOf) {
      skipped++;
      continue;
    }
    const category = findCategory(r.row.category)!;
    const municipality = findMunicipality(r.row.municipality)!;
    let slug = slugify(r.row.name);
    const slugTaken = await prisma.business.findUnique({ where: { slug } });
    if (slugTaken) slug = `${slug}-${Date.now().toString(36)}${imported}`;

    const business = await prisma.business.create({
      data: {
        name: r.row.name,
        slug,
        shortDescription: r.row.short_description,
        address: r.row.address,
        postalCode: r.row.postal_code,
        city: r.row.city || municipality.name,
        municipalityId: municipality.id,
        phone: r.row.phone,
        email: r.row.email,
        website: r.row.website,
        primaryCategoryId: category.id,
        categories: { create: [{ categoryId: category.id, primary: true }] },
      },
    });
    await logAudit({
      userId: admin.id,
      entityType: "Business",
      entityId: business.id,
      action: "csv-import",
      newValue: { name: business.name },
    });
    imported++;
  }

  revalidatePath("/admin/foretag");
  return { imported, skipped };
}
