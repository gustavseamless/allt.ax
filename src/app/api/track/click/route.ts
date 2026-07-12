import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  businessId: z.string().min(1).max(64),
  action: z.enum(["phone", "website", "email", "profile", "booking"]),
  campaignId: z.string().min(1).max(64).optional(),
});

/** Logs a contact/click action. Called from the client with sendBeacon/fetch. */
export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get("ax_sid")?.value ?? "";
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`click:${sessionId || ip}`, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "För många förfrågningar" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ogiltig förfrågan" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ogiltiga fält" }, { status: 400 });
  }
  const { businessId, action, campaignId } = parsed.data;

  const business = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } });
  if (!business) {
    return NextResponse.json({ error: "Företaget finns inte" }, { status: 404 });
  }

  let validCampaignId: string | null = null;
  if (campaignId) {
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { id: true, businessId: true } });
    if (campaign && campaign.businessId === businessId) validCampaignId = campaign.id;
  }

  await prisma.$transaction([
    prisma.adClick.create({
      data: { businessId, campaignId: validCampaignId, action, sessionId },
    }),
    ...(validCampaignId
      ? [prisma.campaign.update({ where: { id: validCampaignId }, data: { clickCount: { increment: 1 } } })]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
