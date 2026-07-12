import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { searchBusinesses } from "@/lib/search";
import { getSessionId } from "@/lib/session-id";
import { SearchBox } from "@/components/search-box";
import { BusinessCard } from "@/components/business-card";
import { BusinessMap } from "@/components/business-map";

export const dynamic = "force-dynamic";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; kommun?: string; kategori?: string; oppet?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const title = q ? `Sökresultat för ”${q}”` : "Sök på Åland";
  return {
    title,
    description: `Hitta företag och tjänster på Åland${q ? ` som matchar ${q}` : ""}.`,
    robots: { index: false }, // Search result pages should not be indexed.
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params.q ?? "").slice(0, 120);
  const municipalitySlug = params.kommun || null;
  const categorySlug = params.kategori || null;
  const openNow = params.oppet === "1";
  const sessionId = await getSessionId();

  const [municipalities, results] = await Promise.all([
    prisma.municipality.findMany({ orderBy: { name: "asc" } }),
    searchBusinesses({ query, municipalitySlug, categorySlug, openNow, sessionId }),
  ]);

  const mapMarkers = [...results.sponsored.map((s) => s.business), ...results.organic]
    .filter((b) => b.latitude !== null && b.longitude !== null)
    .slice(0, 60)
    .map((b) => ({
      name: b.name,
      slug: b.slug,
      latitude: b.latitude!,
      longitude: b.longitude!,
    }));

  const hasResults = results.sponsored.length > 0 || results.organic.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <SearchBox
        municipalities={municipalities}
        defaultQuery={query}
        defaultMunicipality={municipalitySlug ?? ""}
        defaultOpenNow={openNow}
      />

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold">
            {query ? (
              <>
                {results.totalOrganic} träffar för ”{query}”
                {results.appliedMunicipality ? ` i ${results.appliedMunicipality.name}` : ""}
              </>
            ) : results.appliedMunicipality ? (
              `Företag i ${results.appliedMunicipality.name}`
            ) : (
              "Sök bland Ålands företag"
            )}
          </h1>

          {/* Active filters */}
          {(results.appliedMunicipality || results.appliedCategory || openNow) && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {results.appliedMunicipality && (
                <FilterChip
                  label={`Kommun: ${results.appliedMunicipality.name}`}
                  href={buildUrl({ q: query, kategori: categorySlug, oppet: openNow })}
                />
              )}
              {results.appliedCategory && (
                <FilterChip
                  label={`Kategori: ${results.appliedCategory.name}`}
                  href={buildUrl({ q: query, kommun: municipalitySlug, oppet: openNow })}
                />
              )}
              {openNow && (
                <FilterChip
                  label="Öppet nu"
                  href={buildUrl({ q: query, kommun: municipalitySlug, kategori: categorySlug })}
                />
              )}
            </div>
          )}

          {/* Sponsored slots – always first, always labelled */}
          {results.sponsored.length > 0 && (
            <div className="mt-4 space-y-3">
              {results.sponsored.map((s) => (
                <BusinessCard key={s.campaignId} business={s.business} sponsored />
              ))}
            </div>
          )}

          {/* Organic results */}
          {results.organic.length > 0 ? (
            <div className="mt-3 space-y-3">
              {results.organic.map((b) => (
                <BusinessCard key={b.id} business={b} />
              ))}
            </div>
          ) : (
            !hasResults && (
              <div className="mt-8 rounded-xl border border-border bg-surface p-8 text-center">
                <p className="font-semibold">Inga träffar{query ? ` för ”${query}”` : ""}.</p>
                <p className="mt-2 text-sm text-muted">
                  Prova att stava annorlunda, ta bort filter eller sök på en kategori.
                </p>
              </div>
            )
          )}

          {/* Suggestions when few results */}
          {results.suggestions.length > 0 && (
            <div className="mt-6 text-sm">
              <span className="text-muted">Menade du: </span>
              {results.suggestions.map((s, i) => (
                <span key={s}>
                  {i > 0 && ", "}
                  <Link href={`/sok?q=${encodeURIComponent(s)}`} className="text-primary hover:underline">
                    {s}
                  </Link>
                </span>
              ))}
            </div>
          )}

          {/* Related categories */}
          {results.relatedCategories.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-muted">Relaterade kategorier</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {results.relatedCategories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/foretag/${c.slug}`}
                    className="rounded-full border border-border px-3 py-1 text-sm hover:border-primary hover:text-primary"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        {mapMarkers.length > 0 && (
          <aside className="lg:w-96 lg:shrink-0">
            <h2 className="mb-2 text-sm font-semibold text-muted">Karta</h2>
            <BusinessMap markers={mapMarkers} />
          </aside>
        )}
      </div>
    </div>
  );
}

function buildUrl(params: { q?: string | null; kommun?: string | null; kategori?: string | null; oppet?: boolean }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.kommun) sp.set("kommun", params.kommun);
  if (params.kategori) sp.set("kategori", params.kategori);
  if (params.oppet) sp.set("oppet", "1");
  const qs = sp.toString();
  return `/sok${qs ? `?${qs}` : ""}`;
}

function FilterChip({ label, href }: { label: string; href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-full bg-primary-light px-3 py-1 font-medium text-primary hover:bg-primary hover:text-white"
      title="Ta bort filter"
    >
      {label} ✕
    </Link>
  );
}
