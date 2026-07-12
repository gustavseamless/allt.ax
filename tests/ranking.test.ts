import { describe, it, expect } from "vitest";
import {
  organicScore,
  profileCompleteness,
  freshnessBonus,
  rankBusinesses,
  type RankableBusiness,
  type RankingContext,
} from "@/lib/ranking";

const now = new Date("2026-07-12T12:00:00Z");

function makeBusiness(overrides: Partial<RankableBusiness> = {}): RankableBusiness {
  return {
    id: "b1",
    name: "Testföretag",
    description:
      "En beskrivning som är tillräckligt lång för att räknas som komplett i testet av profilens fullständighet.",
    shortDescription: "Kort beskrivning",
    phone: "+358 18 12345",
    email: "info@test.ax",
    website: "https://test.ax",
    address: "Testgatan 1",
    logoUrl: "",
    latitude: 60.1,
    longitude: 19.9,
    openingHours: { mon: [["09:00", "17:00"]] },
    verified: false,
    updatedAt: now,
    municipalityId: "m1",
    ...overrides,
  };
}

function makeCtx(overrides: Partial<RankingContext> = {}): RankingContext {
  return {
    textScore: 0.5,
    nameSimilarity: 0,
    categoryMatch: false,
    primaryCategoryMatch: false,
    municipalityMatch: false,
    municipalityRequested: false,
    now,
    ...overrides,
  };
}

describe("profileCompleteness", () => {
  it("returns 1 for a fully complete profile", () => {
    const b = makeBusiness({ logoUrl: "https://test.ax/logo.png" });
    expect(profileCompleteness(b)).toBe(1);
  });

  it("returns lower score for sparse profiles", () => {
    const sparse = makeBusiness({
      description: "",
      shortDescription: "",
      phone: "",
      email: "",
      website: "",
      address: "",
      latitude: null,
      longitude: null,
      openingHours: {},
    });
    expect(profileCompleteness(sparse)).toBeLessThan(0.2);
  });
});

describe("freshnessBonus", () => {
  it("gives max bonus for just-updated profiles", () => {
    expect(freshnessBonus(now, now)).toBeCloseTo(0.05);
  });
  it("gives no bonus after a year", () => {
    const old = new Date(now.getTime() - 400 * 86_400_000);
    expect(freshnessBonus(old, now)).toBe(0);
  });
});

describe("organicScore", () => {
  it("ranks higher text relevance higher", () => {
    const b = makeBusiness();
    const high = organicScore(b, makeCtx({ textScore: 0.9 }));
    const low = organicScore(b, makeCtx({ textScore: 0.1 }));
    expect(high).toBeGreaterThan(low);
  });

  it("gives a bonus for category match (synonym searches)", () => {
    const b = makeBusiness();
    const withMatch = organicScore(b, makeCtx({ categoryMatch: true }));
    const without = organicScore(b, makeCtx());
    expect(withMatch - without).toBeCloseTo(0.5);
  });

  it("boosts businesses in the requested municipality and penalises others", () => {
    const b = makeBusiness();
    const inMunicipality = organicScore(
      b,
      makeCtx({ municipalityRequested: true, municipalityMatch: true }),
    );
    const outside = organicScore(
      b,
      makeCtx({ municipalityRequested: true, municipalityMatch: false }),
    );
    const neutral = organicScore(b, makeCtx());
    expect(inMunicipality).toBeGreaterThan(neutral);
    expect(outside).toBeLessThan(neutral);
  });

  it("gives verified businesses a small quality bonus", () => {
    const verified = organicScore(makeBusiness({ verified: true }), makeCtx());
    const unverified = organicScore(makeBusiness({ verified: false }), makeCtx());
    expect(verified - unverified).toBeCloseTo(0.08);
  });

  it("has NO premium/payment input – paid status cannot affect organic score", () => {
    // The RankableBusiness interface deliberately has no premium field and
    // RankingContext has no campaign field. Two otherwise identical
    // businesses must score identically regardless of any paid status.
    const a = makeBusiness();
    const b = makeBusiness();
    expect(organicScore(a, makeCtx())).toBe(organicScore(b, makeCtx()));
    expect("premium" in a).toBe(false);
  });

  it("uses typo-tolerant name similarity as a signal", () => {
    const b = makeBusiness();
    const similar = organicScore(b, makeCtx({ textScore: 0, nameSimilarity: 0.8 }));
    const dissimilar = organicScore(b, makeCtx({ textScore: 0, nameSimilarity: 0 }));
    expect(similar).toBeGreaterThan(dissimilar);
  });
});

describe("rankBusinesses", () => {
  it("sorts by score descending with name as tiebreak", () => {
    const a = makeBusiness({ id: "a", name: "Alfa" });
    const b = makeBusiness({ id: "b", name: "Beta" });
    const c = makeBusiness({ id: "c", name: "Gamma" });
    const ranked = rankBusinesses([
      { business: a, ctx: makeCtx({ textScore: 0.2 }) },
      { business: b, ctx: makeCtx({ textScore: 0.9 }) },
      { business: c, ctx: makeCtx({ textScore: 0.2 }) },
    ]);
    expect(ranked.map((r) => r.business.id)).toEqual(["b", "a", "c"]);
  });
});
