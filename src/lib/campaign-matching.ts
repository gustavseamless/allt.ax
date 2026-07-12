/**
 * Sponsored campaign matching – pure functions, unit-testable.
 *
 * Rules (see spec §9):
 *  - Sponsored results are only shown for RELEVANT searches: the campaign
 *    must match the query via keywords, categories, or municipality targeting.
 *  - A campaign is only eligible while ACTIVE and within its date range.
 *  - At most MAX_SPONSORED_RESULTS sponsored slots before organic results.
 *  - The same business may only occupy one sponsored slot per result list.
 */

export const MAX_SPONSORED_RESULTS = 2;

export interface MatchableCampaign {
  id: string;
  businessId: string;
  status: string; // CampaignStatus
  campaignType: string;
  startDate: Date;
  endDate: Date;
  targetKeywords: string[];
  targetCategoryIds: string[];
  targetMunicipalityIds: string[];
  priority: number;
}

export interface CampaignMatchContext {
  /** Normalized lowercase query words (cleaned + synonym extra terms). */
  queryTerms: string[];
  /** Category ids implied by the query/synonyms or an explicit category filter. */
  categoryIds: string[];
  /** Explicit municipality filter (or municipality found in query), if any. */
  municipalityId: string | null;
  now: Date;
}

export function isCampaignLive(c: MatchableCampaign, now: Date): boolean {
  return c.status === "ACTIVE" && c.startDate <= now && c.endDate >= now;
}

/**
 * Does the campaign target this search?
 * Keyword match: any target keyword appears in the query terms (or vice versa
 * for multi-word keywords). Category match: overlap with implied categories.
 * If the campaign targets specific municipalities, a conflicting explicit
 * municipality filter disqualifies it.
 */
export function campaignMatchesSearch(c: MatchableCampaign, ctx: CampaignMatchContext): boolean {
  if (!isCampaignLive(c, ctx.now)) return false;

  // Municipality targeting acts as a constraint when the user filtered.
  if (c.targetMunicipalityIds.length > 0 && ctx.municipalityId) {
    if (!c.targetMunicipalityIds.includes(ctx.municipalityId)) return false;
  }

  const keywordHit = c.targetKeywords.some((kw) => {
    const k = kw.toLowerCase().trim();
    if (!k) return false;
    if (ctx.queryTerms.includes(k)) return true;
    // Multi-word keyword: all its words must be present in query terms.
    const kwWords = k.split(/\s+/);
    if (kwWords.length > 1 && kwWords.every((w) => ctx.queryTerms.includes(w))) return true;
    // Prefix match for Swedish compounds ("elektrik" matches "elektriker").
    return ctx.queryTerms.some((t) => t.length >= 4 && (t.startsWith(k) || k.startsWith(t)));
  });

  const categoryHit = c.targetCategoryIds.some((id) => ctx.categoryIds.includes(id));

  return keywordHit || categoryHit;
}

/**
 * Selects sponsored slots: filter to matching campaigns, sort by priority
 * (then earliest end date as tiebreak so shorter campaigns get exposure),
 * dedupe per business, cap at MAX_SPONSORED_RESULTS.
 */
export function selectSponsored<T extends MatchableCampaign>(
  campaigns: T[],
  ctx: CampaignMatchContext,
  max: number = MAX_SPONSORED_RESULTS,
): T[] {
  const matching = campaigns
    .filter((c) => campaignMatchesSearch(c, ctx))
    .sort((a, b) => b.priority - a.priority || a.endDate.getTime() - b.endDate.getTime());

  const seen = new Set<string>();
  const selected: T[] = [];
  for (const c of matching) {
    if (seen.has(c.businessId)) continue;
    seen.add(c.businessId);
    selected.push(c);
    if (selected.length >= max) break;
  }
  return selected;
}
