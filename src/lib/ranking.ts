/**
 * Organic ranking model – pure functions, unit-testable without a database.
 *
 * The final organic score is composed of:
 *  - text relevance (ts_rank from PostgreSQL, 0..~1)
 *  - trigram name similarity (typo tolerance, 0..1)
 *  - category match bonus (query implied one of the business's categories)
 *  - geographic relevance (municipality matches the filter/query)
 *  - profile completeness (0..1, scaled)
 *  - verified bonus
 *  - freshness bonus (recently updated info)
 *
 * IMPORTANT: `premium` and paid campaigns NEVER affect the organic score.
 * Paid visibility only exists in clearly labelled sponsored slots.
 */

export interface RankableBusiness {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  logoUrl: string;
  latitude: number | null;
  longitude: number | null;
  openingHours: unknown;
  verified: boolean;
  updatedAt: Date;
  municipalityId: string | null;
}

export interface RankingContext {
  /** ts_rank text relevance from the database (already weighted A/B/C). */
  textScore: number;
  /** Trigram similarity of query vs business name (0..1). */
  nameSimilarity: number;
  /** Whether the query's implied categories include one of the business's. */
  categoryMatch: boolean;
  /** Whether the business's primary category matched. */
  primaryCategoryMatch: boolean;
  /** Municipality filter/query matches the business's municipality. */
  municipalityMatch: boolean;
  /** A municipality filter or in-query municipality was requested at all. */
  municipalityRequested: boolean;
  now?: Date;
}

/** 0..1 – how complete the profile is. Complete profiles rank slightly higher. */
export function profileCompleteness(b: RankableBusiness): number {
  const checks: boolean[] = [
    b.description.length >= 80,
    b.shortDescription.length > 0,
    b.phone.length > 0,
    b.email.length > 0,
    b.website.length > 0,
    b.address.length > 0,
    b.logoUrl.length > 0,
    b.latitude !== null && b.longitude !== null,
    !!b.openingHours && Object.keys(b.openingHours as object).length > 0,
  ];
  return checks.filter(Boolean).length / checks.length;
}

/** Bonus for recently updated profiles (max 0.05, decays over a year). */
export function freshnessBonus(updatedAt: Date, now: Date = new Date()): number {
  const days = Math.max(0, (now.getTime() - updatedAt.getTime()) / 86_400_000);
  const factor = Math.max(0, 1 - days / 365);
  return 0.05 * factor;
}

export function organicScore(b: RankableBusiness, ctx: RankingContext): number {
  let score = 0;

  // Text relevance is the dominant factor.
  score += Math.min(ctx.textScore, 1) * 1.0;

  // Typo tolerance: name similarity contributes when full-text misses.
  score += ctx.nameSimilarity * 0.6;

  // Category understanding ("bilfix" → bilverkstäder).
  if (ctx.categoryMatch) score += 0.5;
  if (ctx.primaryCategoryMatch) score += 0.15;

  // Geographic relevance.
  if (ctx.municipalityRequested) {
    score += ctx.municipalityMatch ? 0.3 : -0.15;
  }

  // Quality signals – small, so they refine rather than dominate.
  score += profileCompleteness(b) * 0.15;
  if (b.verified) score += 0.08;
  score += freshnessBonus(b.updatedAt, ctx.now);

  return score;
}

export interface ScoredBusiness<T extends RankableBusiness = RankableBusiness> {
  business: T;
  score: number;
}

export function rankBusinesses<T extends RankableBusiness>(
  items: { business: T; ctx: RankingContext }[],
): ScoredBusiness<T>[] {
  return items
    .map(({ business, ctx }) => ({ business, score: organicScore(business, ctx) }))
    .sort((a, b) => b.score - a.score || a.business.name.localeCompare(b.business.name, "sv"));
}
