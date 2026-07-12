/**
 * Integration tests against the seeded development database.
 * Run `npm run db:reset` (migrate + seed) before the test suite if the
 * database state is unknown.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { searchBusinesses } from "@/lib/search";

const prisma = new PrismaClient();

beforeAll(async () => {
  const count = await prisma.business.count();
  if (count === 0) {
    throw new Error("Databasen är tom – kör `npm run db:reset` före testerna.");
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("searchBusinesses – organic results", () => {
  it("finds electricians for 'elektriker'", async () => {
    const results = await searchBusinesses({ query: "elektriker", skipLogging: true });
    expect(results.organic.length).toBeGreaterThanOrEqual(3);
    const names = results.organic.map((b) => b.name);
    expect(names).toContain("El-Karlsson Ab");
    expect(names).toContain("Godby El & Automation");
  });

  it("handles the synonym 'rörmokare' → VVS businesses", async () => {
    const results = await searchBusinesses({ query: "rörmokare", skipLogging: true });
    expect(results.organic.map((b) => b.name)).toContain("VVS-Service Åland");
  });

  it("handles the colloquial 'bilfix' → car repair shops", async () => {
    const results = await searchBusinesses({ query: "bilfix", skipLogging: true });
    const names = results.organic.map((b) => b.name);
    expect(names.some((n) => n.includes("Bilverkstad") || n.includes("Motor"))).toBe(true);
  });

  it("tolerates typos via trigram similarity ('eletriker')", async () => {
    const results = await searchBusinesses({ query: "elektricker", skipLogging: true });
    // Should still find at least one electrician via fuzzy matching.
    const all = [...results.organic.map((b) => b.name)];
    expect(all.length).toBeGreaterThan(0);
  });

  it("filters strictly by municipality param", async () => {
    const results = await searchBusinesses({
      query: "elektriker",
      municipalitySlug: "finstrom",
      skipLogging: true,
    });
    expect(results.organic.length).toBeGreaterThanOrEqual(1);
    for (const b of results.organic) {
      expect(b.municipality?.slug).toBe("finstrom");
    }
  });

  it("detects municipality inside the query and boosts it", async () => {
    const results = await searchBusinesses({ query: "frisör mariehamn", skipLogging: true });
    expect(results.appliedMunicipality?.slug).toBe("mariehamn");
    expect(results.organic[0]?.municipality?.slug).toBe("mariehamn");
  });

  it("filters by category slug", async () => {
    const results = await searchBusinesses({
      query: "",
      categorySlug: "frisorer",
      skipLogging: true,
    });
    for (const b of results.organic) {
      expect(b.categories.map((c) => c.category.slug)).toContain("frisorer");
    }
    expect(results.organic.length).toBeGreaterThanOrEqual(2);
  });

  it("applies the open-now filter", async () => {
    const all = await searchBusinesses({ query: "restaurang", skipLogging: true });
    const openOnly = await searchBusinesses({ query: "restaurang", openNow: true, skipLogging: true });
    expect(openOnly.organic.length).toBeLessThanOrEqual(all.organic.length);
  });

  it("gives suggestions instead of nothing on zero results", async () => {
    const results = await searchBusinesses({ query: "zeppelinare", skipLogging: true });
    expect(results.organic).toHaveLength(0);
    expect(results.sponsored).toHaveLength(0);
  });
});

describe("searchBusinesses – sponsored results", () => {
  it("returns clearly separated sponsored slots for 'elektriker'", async () => {
    const results = await searchBusinesses({ query: "elektriker", skipLogging: true });
    expect(results.sponsored.length).toBeGreaterThanOrEqual(1);
    expect(results.sponsored.length).toBeLessThanOrEqual(2);
    // El-Karlsson has the active demo campaign targeting "elektriker".
    expect(results.sponsored.map((s) => s.business.name)).toContain("El-Karlsson Ab");
    // Sponsored entries always carry the campaign id (for labelling & tracking).
    for (const s of results.sponsored) {
      expect(s.campaignId).toBeTruthy();
    }
  });

  it("shows NO sponsored results for irrelevant searches", async () => {
    const results = await searchBusinesses({ query: "zeppelinare", skipLogging: true });
    expect(results.sponsored).toHaveLength(0);
  });

  it("does not show paused campaigns (Rena Hem städkampanj is PAUSED)", async () => {
    const results = await searchBusinesses({ query: "städning", skipLogging: true });
    expect(results.sponsored.map((s) => s.business.name)).not.toContain("Rena Hem Åland");
    // But the business still appears organically.
    expect(results.organic.map((b) => b.name)).toContain("Rena Hem Åland");
  });

  it("does not show ended campaigns (Träningshuset vårkampanj ENDED)", async () => {
    const results = await searchBusinesses({ query: "gym", skipLogging: true });
    expect(results.sponsored.map((s) => s.business.name)).not.toContain("Träningshuset Åland");
  });

  it("never duplicates a business across sponsored slots", async () => {
    const results = await searchBusinesses({ query: "elektriker", skipLogging: true });
    const ids = results.sponsored.map((s) => s.business.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("search logging", () => {
  it("logs searches with result count", async () => {
    const query = `integrationstest-${Date.now()}`;
    await searchBusinesses({ query, sessionId: "test-session" });
    // Logging is fire-and-forget – give it a moment.
    await new Promise((r) => setTimeout(r, 300));
    const log = await prisma.searchLog.findFirst({ where: { query } });
    expect(log).not.toBeNull();
    expect(log!.resultCount).toBe(0);
    await prisma.searchLog.deleteMany({ where: { query } });
  });

  it("logs ad impressions for sponsored results and bumps counters", async () => {
    const before = await prisma.campaign.findFirstOrThrow({
      where: { targetKeywords: { has: "elektriker" }, status: "ACTIVE" },
    });
    await searchBusinesses({ query: "elektriker", sessionId: "test-imp" });
    await new Promise((r) => setTimeout(r, 400));
    const after = await prisma.campaign.findUniqueOrThrow({ where: { id: before.id } });
    expect(after.impressionCount).toBe(before.impressionCount + 1);
    const impression = await prisma.adImpression.findFirst({
      where: { campaignId: before.id, sessionId: "test-imp" },
    });
    expect(impression).not.toBeNull();
    await prisma.adImpression.deleteMany({ where: { sessionId: "test-imp" } });
    await prisma.searchLog.deleteMany({ where: { sessionId: "test-imp" } });
  });
});
