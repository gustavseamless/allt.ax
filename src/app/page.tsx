import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { prisma } from "@/lib/db";
import { SearchBox } from "@/components/search-box";
import { BusinessCard } from "@/components/business-card";
import { SponsoredBadge } from "@/components/badges";
import { CategoryIconBadge } from "@/components/icons";
import { getSessionId } from "@/lib/session-id";
import { logAdImpressions } from "@/lib/search";

export const dynamic = "force-dynamic";

const POPULAR_CATEGORY_SLUGS = [
  "restauranger", "cafeer", "hotell-och-boende", "elektriker", "vvs", "bilverkstader",
  "frisorer", "stadning", "bygg-och-renovering", "redovisning", "traning", "batar-och-marina-tjanster",
];

const MONTHS_SV = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

export default async function HomePage() {
  const now = new Date();
  const sessionId = await getSessionId();

  const [municipalities, categories, sponsoredCampaigns, offers, events, popularSearches] =
    await Promise.all([
      prisma.municipality.findMany({ orderBy: { name: "asc" } }),
      prisma.category.findMany({
        where: { slug: { in: POPULAR_CATEGORY_SLUGS }, active: true },
      }),
      prisma.campaign.findMany({
        where: {
          status: "ACTIVE",
          startDate: { lte: now },
          endDate: { gte: now },
          business: { active: true },
        },
        orderBy: { priority: "desc" },
        take: 3,
        include: {
          business: {
            include: {
              primaryCategory: true,
              municipality: true,
              categories: { include: { category: true } },
            },
          },
        },
      }),
      prisma.offer.findMany({
        where: { active: true, startDate: { lte: now }, endDate: { gte: now }, business: { active: true } },
        include: { business: { select: { name: true, slug: true } } },
        orderBy: { endDate: "asc" },
        take: 4,
      }),
      prisma.event.findMany({
        where: { active: true, endDate: { gte: now } },
        orderBy: { startDate: "asc" },
        take: 4,
      }),
      prisma.searchLog.groupBy({
        by: ["query"],
        _count: { query: true },
        where: { resultCount: { gt: 0 }, createdAt: { gte: new Date(now.getTime() - 30 * 86_400_000) } },
        orderBy: { _count: { query: "desc" } },
        take: 8,
      }),
    ]);

  // Homepage placements are paid exposure → log impressions.
  if (sponsoredCampaigns.length > 0) {
    logAdImpressions(sponsoredCampaigns.map((c) => c.id), "", "home", sessionId).catch(() => {});
  }

  const sortedCategories = POPULAR_CATEGORY_SLUGS
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-primary-deep via-primary-dark to-primary">
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-14 text-center sm:pb-20 sm:pt-20">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-[2.75rem] sm:leading-tight">
            Vad söker du på Åland?
          </h1>
          <p className="mt-3 text-lg text-white/75">
            Företag, tjänster, restauranger, erbjudanden och evenemang – samlat på ett ställe.
          </p>
          <div className="mt-8">
            <SearchBox municipalities={municipalities} large onDark />
          </div>
          {popularSearches.length > 0 && (
            <p className="mt-5 text-sm text-white/70">
              Populärt just nu:{" "}
              {popularSearches.slice(0, 5).map((s, i) => (
                <span key={s.query}>
                  {i > 0 && <span className="text-white/40"> · </span>}
                  <Link
                    href={`/sok?q=${encodeURIComponent(s.query)}`}
                    className="font-medium text-white underline-offset-4 hover:underline"
                  >
                    {s.query}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-14 px-4 py-12">
        {/* Popular categories */}
        <section aria-labelledby="kategorier">
          <div className="flex items-baseline justify-between">
            <h2 id="kategorier" className="text-xl font-bold tracking-tight">Populära kategorier</h2>
            <Link
              href="/foretag"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              Visa alla <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {sortedCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/foretag/${c.slug}`}
                className="group flex flex-col items-center gap-2.5 rounded-xl border border-border bg-white p-5 text-center text-sm font-semibold shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]"
              >
                <CategoryIconBadge slug={c.slug} />
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Sponsored businesses */}
        {sponsoredCampaigns.length > 0 && (
          <section aria-labelledby="sponsrat">
            <div className="flex items-center gap-2.5">
              <h2 id="sponsrat" className="text-xl font-bold tracking-tight">Utvalda företag</h2>
              <SponsoredBadge />
            </div>
            <p className="mt-1 text-sm text-muted">
              Betald placering – tydligt märkt. Sökresultat rankas alltid separat.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {sponsoredCampaigns.map((c) => (
                <BusinessCard key={c.id} business={c.business} sponsored />
              ))}
            </div>
          </section>
        )}

        {/* Offers */}
        {offers.length > 0 && (
          <section aria-labelledby="erbjudanden">
            <div className="flex items-baseline justify-between">
              <h2 id="erbjudanden" className="text-xl font-bold tracking-tight">Aktuella erbjudanden</h2>
              <Link
                href="/erbjudanden"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Visa alla <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {offers.map((o) => (
                <Link
                  key={o.id}
                  href={`/foretag/${o.business.slug}`}
                  className="group rounded-xl border border-border bg-white p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-accent-light px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-accent">
                    <Tag className="h-3 w-3" aria-hidden /> Erbjudande
                  </div>
                  <div className="mt-2.5 font-semibold leading-snug group-hover:text-primary">
                    {o.title}
                  </div>
                  <div className="mt-1.5 text-sm text-muted">{o.business.name}</div>
                  <div className="mt-2 text-xs text-muted">
                    Gäller t.o.m. {new Date(o.endDate).getDate()} {MONTHS_SV[new Date(o.endDate).getMonth()]}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Events */}
        {events.length > 0 && (
          <section aria-labelledby="evenemang">
            <div className="flex items-baseline justify-between">
              <h2 id="evenemang" className="text-xl font-bold tracking-tight">Kommande evenemang</h2>
              <Link
                href="/evenemang"
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Visa alla <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {events.map((e) => {
                const d = new Date(e.startDate);
                return (
                  <Link
                    key={e.id}
                    href={`/evenemang/${e.slug}`}
                    className="group flex items-start gap-3.5 rounded-xl border border-border bg-white p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
                  >
                    <div className="flex h-13 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary-light py-1.5">
                      <span className="text-lg font-bold leading-none text-primary">{d.getDate()}</span>
                      <span className="mt-0.5 text-[11px] font-semibold uppercase text-primary/70">
                        {MONTHS_SV[d.getMonth()]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold leading-snug group-hover:text-primary">{e.title}</div>
                      <div className="mt-1 text-sm text-muted">{e.location}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Municipalities */}
        <section aria-labelledby="kommuner">
          <h2 id="kommuner" className="text-xl font-bold tracking-tight">Hitta i din kommun</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {municipalities.map((m) => (
              <Link
                key={m.slug}
                href={`/${m.slug}`}
                className="rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:bg-primary-light hover:text-primary"
              >
                {m.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Business CTA */}
        <section className="overflow-hidden rounded-2xl bg-primary-deep p-8 text-white sm:p-10">
          <h2 className="text-2xl font-bold tracking-tight">För företag på Åland</h2>
          <p className="mt-2 max-w-2xl leading-relaxed text-white/75">
            Har du ett företag? Gör anspråk på din profil, uppdatera dina uppgifter
            och nå kunder när de söker. Grundprofilen är alltid gratis.
          </p>
          <Link
            href="/for-foretag"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary-dark transition-colors hover:bg-primary-light"
          >
            Läs mer för företag <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </section>
      </div>
    </div>
  );
}
