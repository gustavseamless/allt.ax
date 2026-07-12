import { describe, it, expect } from "vitest";
import {
  isCampaignLive,
  campaignMatchesSearch,
  selectSponsored,
  MAX_SPONSORED_RESULTS,
  type MatchableCampaign,
  type CampaignMatchContext,
} from "@/lib/campaign-matching";

const now = new Date("2026-07-12T12:00:00Z");
const yesterday = new Date(now.getTime() - 86_400_000);
const nextWeek = new Date(now.getTime() + 7 * 86_400_000);

function makeCampaign(overrides: Partial<MatchableCampaign> = {}): MatchableCampaign {
  return {
    id: "c1",
    businessId: "b1",
    status: "ACTIVE",
    campaignType: "SEARCH_SPONSORED",
    startDate: yesterday,
    endDate: nextWeek,
    targetKeywords: ["elektriker"],
    targetCategoryIds: [],
    targetMunicipalityIds: [],
    priority: 5,
    ...overrides,
  };
}

function makeCtx(overrides: Partial<CampaignMatchContext> = {}): CampaignMatchContext {
  return {
    queryTerms: ["elektriker"],
    categoryIds: [],
    municipalityId: null,
    now,
    ...overrides,
  };
}

describe("isCampaignLive", () => {
  it("is live within the date window when ACTIVE", () => {
    expect(isCampaignLive(makeCampaign(), now)).toBe(true);
  });
  it("is not live before startDate", () => {
    const c = makeCampaign({ startDate: new Date(now.getTime() + 86_400_000) });
    expect(isCampaignLive(c, now)).toBe(false);
  });
  it("is not live after endDate", () => {
    const c = makeCampaign({ endDate: yesterday });
    expect(isCampaignLive(c, now)).toBe(false);
  });
  it("is not live when PAUSED, DRAFT or ENDED", () => {
    for (const status of ["PAUSED", "DRAFT", "ENDED"]) {
      expect(isCampaignLive(makeCampaign({ status }), now)).toBe(false);
    }
  });
});

describe("campaignMatchesSearch", () => {
  it("matches on exact keyword", () => {
    expect(campaignMatchesSearch(makeCampaign(), makeCtx())).toBe(true);
  });

  it("does NOT match an unrelated search – ads only on relevant queries", () => {
    const ctx = makeCtx({ queryTerms: ["frisör"] });
    expect(campaignMatchesSearch(makeCampaign(), ctx)).toBe(false);
  });

  it("matches on category targeting", () => {
    const c = makeCampaign({ targetKeywords: [], targetCategoryIds: ["cat-el"] });
    const ctx = makeCtx({ queryTerms: ["strömavbrott"], categoryIds: ["cat-el"] });
    expect(campaignMatchesSearch(c, ctx)).toBe(true);
  });

  it("respects municipality targeting when the user filters", () => {
    const c = makeCampaign({ targetMunicipalityIds: ["mariehamn-id"] });
    expect(campaignMatchesSearch(c, makeCtx({ municipalityId: "mariehamn-id" }))).toBe(true);
    expect(campaignMatchesSearch(c, makeCtx({ municipalityId: "jomala-id" }))).toBe(false);
    // No municipality filter → campaign may still show.
    expect(campaignMatchesSearch(c, makeCtx({ municipalityId: null }))).toBe(true);
  });

  it("matches Swedish compound prefixes", () => {
    const c = makeCampaign({ targetKeywords: ["elektriker"] });
    expect(campaignMatchesSearch(c, makeCtx({ queryTerms: ["elektrikern"] }))).toBe(true);
  });

  it("matches multi-word keywords when all words are present", () => {
    const c = makeCampaign({ targetKeywords: ["dagens lunch"] });
    expect(campaignMatchesSearch(c, makeCtx({ queryTerms: ["dagens", "lunch", "mariehamn"] }))).toBe(true);
  });
});

describe("selectSponsored", () => {
  it("caps sponsored slots at MAX_SPONSORED_RESULTS", () => {
    const campaigns = [
      makeCampaign({ id: "c1", businessId: "b1", priority: 3 }),
      makeCampaign({ id: "c2", businessId: "b2", priority: 2 }),
      makeCampaign({ id: "c3", businessId: "b3", priority: 1 }),
    ];
    const selected = selectSponsored(campaigns, makeCtx());
    expect(selected.length).toBe(MAX_SPONSORED_RESULTS);
    expect(MAX_SPONSORED_RESULTS).toBeLessThanOrEqual(2);
  });

  it("orders by priority descending", () => {
    const campaigns = [
      makeCampaign({ id: "low", businessId: "b1", priority: 1 }),
      makeCampaign({ id: "high", businessId: "b2", priority: 10 }),
    ];
    const selected = selectSponsored(campaigns, makeCtx());
    expect(selected[0].id).toBe("high");
  });

  it("never shows the same business in more than one sponsored slot", () => {
    const campaigns = [
      makeCampaign({ id: "c1", businessId: "same", priority: 10 }),
      makeCampaign({ id: "c2", businessId: "same", priority: 9 }),
      makeCampaign({ id: "c3", businessId: "other", priority: 1 }),
    ];
    const selected = selectSponsored(campaigns, makeCtx());
    expect(selected.map((c) => c.businessId)).toEqual(["same", "other"]);
  });

  it("excludes campaigns outside their date range", () => {
    const expired = makeCampaign({ id: "expired", endDate: yesterday });
    expect(selectSponsored([expired], makeCtx())).toHaveLength(0);
  });

  it("excludes paused campaigns", () => {
    const paused = makeCampaign({ id: "paused", status: "PAUSED" });
    expect(selectSponsored([paused], makeCtx())).toHaveLength(0);
  });
});
