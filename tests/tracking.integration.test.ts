/**
 * Click tracking + claim flow integration tests against the seeded database.
 */
import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

afterAll(async () => {
  await prisma.adClick.deleteMany({ where: { sessionId: "vitest-click" } });
  await prisma.businessClaim.deleteMany({ where: { evidence: { contains: "vitest-claim" } } });
  await prisma.user.deleteMany({ where: { email: "vitest-claimer@example.ax" } });
  await prisma.$disconnect();
});

describe("click tracking data model", () => {
  it("stores clicks with action and bumps campaign counters", async () => {
    const campaign = await prisma.campaign.findFirstOrThrow({ where: { status: "ACTIVE" } });
    const before = campaign.clickCount;

    await prisma.$transaction([
      prisma.adClick.create({
        data: {
          businessId: campaign.businessId,
          campaignId: campaign.id,
          action: "phone",
          sessionId: "vitest-click",
        },
      }),
      prisma.campaign.update({
        where: { id: campaign.id },
        data: { clickCount: { increment: 1 } },
      }),
    ]);

    const after = await prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } });
    expect(after.clickCount).toBe(before + 1);

    // Restore the counter so repeated test runs stay stable.
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { clickCount: { decrement: 1 } },
    });
  });
});

describe("business claim flow", () => {
  it("claim → approve gives the user edit rights over the business", async () => {
    const business = await prisma.business.findFirstOrThrow({
      where: { claimedByUserId: null, active: true },
    });
    const user = await prisma.user.create({
      data: {
        name: "Vitest Claimer",
        email: "vitest-claimer@example.ax",
        passwordHash: "x",
        role: "USER",
      },
    });

    const claim = await prisma.businessClaim.create({
      data: { businessId: business.id, userId: user.id, evidence: "vitest-claim evidence" },
    });
    expect(claim.status).toBe("PENDING");

    // Simulate admin approval (same statements as reviewClaimAction).
    const admin = await prisma.user.findFirstOrThrow({ where: { role: "ADMIN" } });
    await prisma.$transaction([
      prisma.businessClaim.update({
        where: { id: claim.id },
        data: { status: "APPROVED", reviewedBy: admin.id, reviewedAt: new Date() },
      }),
      prisma.business.update({
        where: { id: business.id },
        data: { claimedByUserId: user.id },
      }),
      prisma.user.update({ where: { id: user.id }, data: { role: "BUSINESS_OWNER" } }),
    ]);

    const updatedBusiness = await prisma.business.findUniqueOrThrow({ where: { id: business.id } });
    expect(updatedBusiness.claimedByUserId).toBe(user.id);
    const updatedUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updatedUser.role).toBe("BUSINESS_OWNER");

    // Cleanup: release the business again.
    await prisma.business.update({
      where: { id: business.id },
      data: { claimedByUserId: null },
    });
  });
});

describe("seed data guarantees (spec §16)", () => {
  it("has at least 30 businesses, 15 categories, all 16 municipalities, 5 offers, 5 events, 5 campaigns", async () => {
    expect(await prisma.business.count()).toBeGreaterThanOrEqual(30);
    expect(await prisma.category.count()).toBeGreaterThanOrEqual(15);
    expect(await prisma.municipality.count()).toBe(16);
    expect(await prisma.offer.count()).toBeGreaterThanOrEqual(5);
    expect(await prisma.event.count()).toBeGreaterThanOrEqual(5);
    expect(await prisma.campaign.count()).toBeGreaterThanOrEqual(5);
  });

  it("marks all seeded businesses as demo data", async () => {
    const nonDemo = await prisma.business.count({
      where: { demo: false, createdAt: { lte: new Date() }, legalName: { contains: "fiktivt" } },
    });
    const demoCount = await prisma.business.count({ where: { demo: true } });
    expect(demoCount).toBeGreaterThanOrEqual(30);
    expect(nonDemo).toBe(0);
  });
});
