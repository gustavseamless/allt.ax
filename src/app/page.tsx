import Link from "next/link";
import { prisma } from "@/lib/db";
import { SearchBox } from "@/components/search-box";
import { BusinessCard } from "@/components/business-card";
import { SponsoredBadge } from "@/components/badges";
import { formatDateShort } from "@/lib/utils";
import { getSessionId } from "@/lib/session-id";
import { logAdImpressions } from "@/lib/search";

export const dynamic = "force-dynamic";

const POPULAR_CATEGORY_SLUGS = [
  "restauranger", "cafeer", "hotell-och-boende", "elektriker", "vvs", "bilverkstader",
  "frisorer", "stadning", "bygg-och-renovering", "redovisning", "traning", "batar-och-marina-tjanster",
];

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
      <section className="bg-primary-light/60">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:py-20">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Vad söker du på Åland?
          </h1>
          <p className="mt-3 text-muted">
            Företag, tjänster, restauranger, erbjudanden och evenemang – samlat på ett ställe.
          </p>
          <div className="mt-6">
            <SearchBox municipalities={municipalities} large />
          </div>
          {popularSearches.length > 0 && (
            <p className="mt-4 text-sm text-muted">
              Populärt just nu:{" "}
              {popularSearches.slice(0, 5).map((s, i) => (
                <span key={s.query}>
                  {i > 0 && " · "}
                  <Link
                    href={`/sok?q=${encodeURIComponent(s.query)}`}
                    className="text-primary hover:underline"
                  >
                    {s.query}
                  </Link>
                </span>
              ))}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        {/* Popular categories */}
        <section aria-labelledby="kategorier">
          <div className="flex items-baseline justify-between">
            <h2 id="kategorier" className="text-xl font-bold">Populära kategorier</h2>
            <Link href="/foretag" className="text-sm font-medium text-primary hover:underline">
              Visa alla →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {sortedCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/foretag/${c.slug}`}
                className="flex flex-col items-center gap-1 rounded-xl border border-border bg-white p-4 text-center text-sm font-medium hover:border-primary hover:shadow-sm"
              >
                <span aria-hidden className="text-2xl">{c.icon}</span>
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Sponsored businesses */}
        {sponsoredCampaigns.length > 0 && (
          <section aria-labelledby="sponsrat">
            <div className="flex items-center gap-2">
              <h2 id="sponsrat" className="text-xl font-bold">Utvalda företag</h2>
              <SponsoredBadge />
            </div>
            <p className="mt-1 text-sm text-muted">
              Betald placering – tydligt märkt. Sökresultat rankas alltid separat.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
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
              <h2 id="erbjudanden" className="text-xl font-bold">Aktuella erbjudanden</h2>
              <Link href="/erbjudanden" className="text-sm font-medium text-primary hover:underline">
                Visa alla →
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {offers.map((o) => (
                <Link
                  key={o.id}
                  href={`/foretag/${o.business.slug}`}
                  className="rounded-xl border border-border bg-white p-4 hover:border-primary hover:shadow-sm"
                >
                  <div className="text-sm font-semibold text-accent">Erbjudande</div>
                  <div className="mt-1 font-semibold">{o.title}</div>
                  <div className="mt-1 text-sm text-muted">{o.business.name}</div>
                  <div className="mt-2 text-xs text-muted">
                    Gäller t.o.m. {formatDateShort(o.endDate)}
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
              <h2 id="evenemang" className="text-xl font-bold">Kommande evenemang</h2>
              <Link href="/evenemang" className="text-sm font-medium text-primary hover:underline">
                Visa alla →
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {events.map((e) => (
                <Link
                  key={e.id}
                  href={`/evenemang/${e.slug}`}
                  className="rounded-xl border border-border bg-white p-4 hover:border-primary hover:shadow-sm"
                >
                  <div className="text-sm font-semibold text-primary">
                    {formatDateShort(e.startDate)}
                  </div>
                  <div className="mt-1 font-semibold">{e.title}</div>
                  <div className="mt-1 text-sm text-muted">{e.location}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Municipalities */}
        <section aria-labelledby="kommuner">
          <h2 id="kommuner" className="text-xl font-bold">Hitta i din kommun</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {municipalities.map((m) => (
              <Link
                key={m.slug}
                href={`/${m.slug}`}
                className="rounded-full border border-border bg-white px-4 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
              >
                {m.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Business CTA */}
        <section className="rounded-2xl bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-bold">För företag på Åland</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Har du ett företag? Gör anspråk på din profil, uppdatera dina uppgifter
            och nå kunder när de söker. Grundprofilen är alltid gratis.
          </p>
          <Link
            href="/for-foretag"
            className="mt-4 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Läs mer för företag
          </Link>
        </section>
      </div>
    </div>
  );
}
