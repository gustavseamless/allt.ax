import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseQueryIntent } from "@/lib/synonyms";
import { organicScore, type RankingContext } from "@/lib/ranking";
import { selectSponsored, type CampaignMatchContext } from "@/lib/campaign-matching";
import { isOpenNow, type OpeningHours } from "@/lib/opening-hours";

export type BusinessWithRelations = Prisma.BusinessGetPayload<{
  include: {
    primaryCategory: true;
    municipality: true;
    categories: { include: { category: true } };
  };
}>;

export interface SearchParams {
  query: string;
  municipalitySlug?: string | null;
  categorySlug?: string | null;
  openNow?: boolean;
  sessionId?: string;
  /** Skip logging (used by tests/previews). */
  skipLogging?: boolean;
  limit?: number;
}

export interface SponsoredResult {
  campaignId: string;
  business: BusinessWithRelations;
}

export interface SearchResults {
  sponsored: SponsoredResult[];
  organic: BusinessWithRelations[];
  totalOrganic: number;
  intent: ReturnType<typeof parseQueryIntent>;
  appliedMunicipality: { id: string; name: string; slug: string } | null;
  appliedCategory: { id: string; name: string; slug: string } | null;
  relatedCategories: { name: string; slug: string }[];
  suggestions: string[];
}

interface RawCandidate {
  id: string;
  text_score: number;
  name_sim: number;
}

export async function searchBusinesses(params: SearchParams): Promise<SearchResults> {
  const { query, sessionId = "", limit = 50 } = params;
  const intent = parseQueryIntent(query);
  const openNow = params.openNow || intent.openNow;
  const now = new Date();

  // Resolve explicit municipality filter, or one detected inside the query.
  const municipalitySlugOrName = params.municipalitySlug || intent.municipalityInQuery;
  const municipality = municipalitySlugOrName
    ? await prisma.municipality.findFirst({
        where: {
          OR: [
            { slug: municipalitySlugOrName.toLowerCase() },
            { name: { equals: municipalitySlugOrName, mode: "insensitive" } },
          ],
        },
      })
    : null;
  // Only an explicit filter param restricts hard; a municipality typed inside
  // the query boosts geographically but does not hide other results.
  const strictMunicipality = Boolean(params.municipalitySlug && municipality);

  const categoryFilter = params.categorySlug
    ? await prisma.category.findUnique({ where: { slug: params.categorySlug } })
    : null;

  // Categories implied by synonyms ("bilfix" → bilverkstäder).
  const impliedCategories =
    intent.categorySlugs.length > 0
      ? await prisma.category.findMany({ where: { slug: { in: intent.categorySlugs } } })
      : [];
  const impliedCategoryIds = impliedCategories.map((c) => c.id);

  // Also match categories whose *name* resembles the query ("frisör" → Frisörer).
  const q = intent.cleanedQuery;
  if (q.length >= 3) {
    const nameMatched = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Category"
      WHERE active AND (similarity(lower(name), lower(${q})) > 0.35
        OR lower(name) LIKE lower(${q + "%"})
        OR lower(${q}) LIKE lower(name) || '%')
      LIMIT 5`.catch(() => [] as { id: string }[]);
    for (const c of nameMatched) {
      if (!impliedCategoryIds.includes(c.id)) impliedCategoryIds.push(c.id);
    }
  }

  // --- Candidate collection -------------------------------------------------
  const ftsQuery = [q, ...intent.extraTerms].filter(Boolean).join(" OR ");
  let rawCandidates: RawCandidate[] = [];
  if (ftsQuery.length > 0) {
    rawCandidates = await prisma.$queryRaw<RawCandidate[]>`
      SELECT b.id,
             ts_rank(b."searchVector", websearch_to_tsquery('swedish', ${ftsQuery}))::float AS text_score,
             similarity(lower(b.name), lower(${q || query}))::float AS name_sim
      FROM "Business" b
      WHERE b.active = true
        AND (
          b."searchVector" @@ websearch_to_tsquery('swedish', ${ftsQuery})
          OR similarity(lower(b.name), lower(${q || query})) > 0.25
        )
      LIMIT 200`;
  }

  const candidateIds = new Set(rawCandidates.map((c) => c.id));
  const scores = new Map(rawCandidates.map((c) => [c.id, c]));

  // Businesses in implied categories count as candidates even without a
  // full-text hit (handles queries with no exact word overlap).
  const candidateCategoryIds = categoryFilter
    ? [categoryFilter.id]
    : impliedCategoryIds;
  if (candidateCategoryIds.length > 0) {
    const inCategory = await prisma.businessCategory.findMany({
      where: { categoryId: { in: candidateCategoryIds }, business: { active: true } },
      select: { businessId: true },
    });
    inCategory.forEach((bc) => candidateIds.add(bc.businessId));
  }

  // Browse mode: no query at all → candidates come from filters alone.
  if (!query.trim() && candidateCategoryIds.length === 0 && municipality) {
    const inMunicipality = await prisma.business.findMany({
      where: { active: true, municipalityId: municipality.id },
      select: { id: true },
    });
    inMunicipality.forEach((b) => candidateIds.add(b.id));
  }

  // --- Load, filter, rank -----------------------------------------------------
  let businesses: BusinessWithRelations[] = await prisma.business.findMany({
    where: {
      id: { in: Array.from(candidateIds) },
      active: true,
      ...(strictMunicipality ? { municipalityId: municipality!.id } : {}),
      ...(categoryFilter
        ? { categories: { some: { categoryId: categoryFilter.id } } }
        : {}),
    },
    include: {
      primaryCategory: true,
      municipality: true,
      categories: { include: { category: true } },
    },
  });

  if (openNow) {
    businesses = businesses.filter((b) => isOpenNow(b.openingHours as OpeningHours, now));
  }

  const matchCategoryIds = new Set([...impliedCategoryIds, ...(categoryFilter ? [categoryFilter.id] : [])]);

  const ranked = businesses
    .map((business) => {
      const raw = scores.get(business.id);
      const businessCategoryIds = business.categories.map((c) => c.categoryId);
      const ctx: RankingContext = {
        textScore: raw?.text_score ?? 0,
        nameSimilarity: raw?.name_sim ?? 0,
        categoryMatch: businessCategoryIds.some((id) => matchCategoryIds.has(id)),
        primaryCategoryMatch:
          !!business.primaryCategoryId && matchCategoryIds.has(business.primaryCategoryId),
        municipalityMatch: !!municipality && business.municipalityId === municipality.id,
        municipalityRequested: !!municipality,
        now,
      };
      return { business, score: organicScore(business, ctx) };
    })
    .sort((a, b) => b.score - a.score || a.business.name.localeCompare(b.business.name, "sv"));

  const organic = ranked.slice(0, limit).map((r) => r.business);

  // --- Sponsored slots --------------------------------------------------------
  const liveCampaigns = await prisma.campaign.findMany({
    where: {
      status: "ACTIVE",
      campaignType: "SEARCH_SPONSORED",
      startDate: { lte: now },
      endDate: { gte: now },
      business: { active: true },
    },
    include: {
      business: {
        include: {
          primaryCategory: true,
          municipality: true,
          categories: { include: { category: true } },
        },
      },
    },
  });

  const queryTerms = [
    ...q.split(/\s+/).filter(Boolean),
    ...intent.extraTerms.flatMap((t) => t.split(/\s+/)),
  ].map((t) => t.toLowerCase());

  const matchCtx: CampaignMatchContext = {
    queryTerms,
    categoryIds: Array.from(matchCategoryIds),
    municipalityId: municipality?.id ?? null,
    now,
  };

  const sponsoredCampaigns = query.trim()
    ? selectSponsored(liveCampaigns, matchCtx)
    : [];
  const sponsored: SponsoredResult[] = sponsoredCampaigns.map((c) => ({
    campaignId: c.id,
    business: c.business,
  }));

  // --- Logging ------------------------------------------------------------------
  if (!params.skipLogging && query.trim()) {
    prisma.searchLog
      .create({
        data: {
          query: query.trim().slice(0, 200),
          municipalityId: municipality?.id ?? null,
          resultCount: organic.length,
          sessionId,
        },
      })
      .catch(() => {});

    if (sponsored.length > 0) {
      logAdImpressions(
        sponsored.map((s) => s.campaignId),
        query.trim().slice(0, 200),
        "search",
        sessionId,
      ).catch(() => {});
    }
  }

  // --- Related categories & suggestions when results are thin -------------------
  const relatedCategories =
    impliedCategoryIds.length > 0 || categoryFilter
      ? await prisma.category.findMany({
          where: {
            id: { notIn: categoryFilter ? [categoryFilter.id] : [] },
            active: true,
            OR: [
              { id: { in: impliedCategoryIds } },
              { parentId: categoryFilter?.parentId ?? undefined },
            ],
          },
          take: 5,
          select: { name: true, slug: true },
        })
      : [];

  const suggestions: string[] = [];
  if (organic.length < 3 && query.trim()) {
    if (openNow) suggestions.push(query.replace(/öppet nu/i, "").trim() || q);
    if (strictMunicipality) suggestions.push(q || query);
    for (const c of impliedCategories.slice(0, 2)) suggestions.push(c.name.toLowerCase());
    if (suggestions.length === 0 && q.includes(" ")) suggestions.push(q.split(" ")[0]);
  }

  return {
    sponsored,
    organic,
    totalOrganic: ranked.length,
    intent,
    appliedMunicipality: municipality
      ? { id: municipality.id, name: municipality.name, slug: municipality.slug }
      : null,
    appliedCategory: categoryFilter
      ? { id: categoryFilter.id, name: categoryFilter.name, slug: categoryFilter.slug }
      : null,
    relatedCategories,
    suggestions: Array.from(new Set(suggestions)).filter((s) => s && s !== query.trim()),
  };
}

/** Logs ad impressions and bumps the campaign counters. */
export async function logAdImpressions(
  campaignIds: string[],
  searchQuery: string,
  page: string,
  sessionId: string,
) {
  if (campaignIds.length === 0) return;
  await prisma.$transaction([
    prisma.adImpression.createMany({
      data: campaignIds.map((campaignId) => ({ campaignId, searchQuery, page, sessionId })),
    }),
    prisma.campaign.updateMany({
      where: { id: { in: campaignIds } },
      data: { impressionCount: { increment: 1 } },
    }),
  ]);
}
