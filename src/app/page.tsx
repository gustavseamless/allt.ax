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

/** Subtle archipelago contour-line texture for the hero (pure SVG, no images). */
function HeroTexture() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1200 600"
      fill="none"
      stroke="white"
      strokeWidth="1.2"
    >
      <path d="M-50 480 C150 430 280 520 460 470 C640 420 760 510 940 460 C1080 425 1180 470 1260 450" />
      <path d="M-50 520 C160 470 300 560 480 510 C660 460 780 550 960 500 C1100 465 1190 510 1260 490" />
      <path d="M-50 560 C170 510 320 600 500 550 C680 500 800 590 980 540 C1120 505 1200 550 1260 530" />
      <ellipse cx="180" cy="180" rx="90" ry="34" />
      <ellipse cx="205" cy="180" rx="130" ry="55" />
      <ellipse cx="640" cy="120" rx="60" ry="22" />
      <ellipse cx="660" cy="122" rx="95" ry="38" />
      <ellipse cx="1010" cy="220" rx="75" ry="28" />
      <ellipse cx="1035" cy="222" rx="115" ry="48" />
      <ellipse cx="420" cy="300" rx="40" ry="14" />
      <ellipse cx="850" cy="330" rx="50" ry="18" />
    </svg>
  );
}

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
      <section className="relative overflow-hidden bg-primary-deep">
        <div className="absolute inset-0 bg-[radial-gradient(90%_120%_at_50%_-20%,#10506b_0%,#0a2e40_55%,#081f2b_100%)]" />
        <HeroTexture />
        <div className="relative mx-auto max-w-3xl px-4 pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
          <p className="eyebrow !text-amber-400/80">Ålands lokala sökmotor</p>
          <h1 className="font-display mt-4 text-4xl font-semibold leading-[1.08] text-white sm:text-6xl">
            Vad söker du
            <br />
            på Åland?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-white/65">
            Företag, tjänster, restauranger, erbjudanden och evenemang – samlat
            på ett ställe.
          </p>
          <div className="mt-10">
            <SearchBox municipalities={municipalities} large onDark />
          </div>
          {popularSearches.length > 0 && (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-white/45">Populärt just nu</span>
              {popularSearches.slice(0, 5).map((s) => (
                <Link
                  key={s.query}
                  href={`/sok?q=${encodeURIComponent(s.query)}`}
                  className="rounded-full border border-white/15 px-3.5 py-1 text-white/80 transition-colors hover:border-white/40 hover:text-white"
                >
                  {s.query}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-24 px-4 py-20 sm:px-6">
        {/* Popular categories */}
        <section aria-labelledby="kategorier">
          <div className="flex items-end justify-between">
            <div>
              <p className="eyebrow">Utforska</p>
              <h2 id="kategorier" className="font-display mt-2 text-3xl font-semibold text-ink">
                Populära kategorier
              </h2>
            </div>
            <Link
              href="/foretag"
              className="hidden items-center gap-1.5 text-sm font-semibold text-primary hover:underline sm:inline-flex"
            >
              Visa alla kategorier <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {sortedCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/foretag/${c.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl bg-card p-6 text-center text-sm font-semibold text-ink shadow-[var(--shadow-card)] ring-1 ring-hairline transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)] hover:ring-primary/30"
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
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="eyebrow">I samarbete med lokala företag</p>
                <h2 id="sponsrat" className="font-display mt-2 text-3xl font-semibold text-ink">
                  Utvalda företag
                </h2>
              </div>
              <SponsoredBadge className="mt-6" />
            </div>
            <p className="mt-2 text-sm text-muted">
              Betald placering – tydligt märkt. Sökresultat rankas alltid separat.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {sponsoredCampaigns.map((c) => (
                <BusinessCard key={c.id} business={c.business} sponsored />
              ))}
            </div>
          </section>
        )}

        {/* Offers */}
        {offers.length > 0 && (
          <section aria-labelledby="erbjudanden">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow">Just nu</p>
                <h2 id="erbjudanden" className="font-display mt-2 text-3xl font-semibold text-ink">
                  Aktuella erbjudanden
                </h2>
              </div>
              <Link
                href="/erbjudanden"
                className="hidden items-center gap-1.5 text-sm font-semibold text-primary hover:underline sm:inline-flex"
              >
                Visa alla <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {offers.map((o) => (
                <Link
                  key={o.id}
                  href={`/foretag/${o.business.slug}`}
                  className="group rounded-2xl bg-card p-6 shadow-[var(--shadow-card)] ring-1 ring-hairline transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
                >
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-brass">
                    <Tag className="h-3 w-3" aria-hidden /> Erbjudande
                  </div>
                  <div className="font-display mt-3 text-lg font-semibold leading-snug text-ink group-hover:text-primary">
                    {o.title}
                  </div>
                  <div className="mt-2 text-sm text-muted">{o.business.name}</div>
                  <div className="mt-4 border-t border-hairline pt-3 text-xs text-muted">
                    Gäller t.o.m. {new Date(o.endDate).getDate()}{" "}
                    {MONTHS_SV[new Date(o.endDate).getMonth()]}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Events */}
        {events.length > 0 && (
          <section aria-labelledby="evenemang">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow">Kalender</p>
                <h2 id="evenemang" className="font-display mt-2 text-3xl font-semibold text-ink">
                  Kommande evenemang
                </h2>
              </div>
              <Link
                href="/evenemang"
                className="hidden items-center gap-1.5 text-sm font-semibold text-primary hover:underline sm:inline-flex"
              >
                Visa alla <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {events.map((e) => {
                const d = new Date(e.startDate);
                return (
                  <Link
                    key={e.id}
                    href={`/evenemang/${e.slug}`}
                    className="group flex items-start gap-4 rounded-2xl bg-card p-5 shadow-[var(--shadow-card)] ring-1 ring-hairline transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-card-hover)]"
                  >
                    <div className="flex w-13 shrink-0 flex-col items-center rounded-xl border border-hairline bg-surface px-3 py-2">
                      <span className="font-display text-2xl font-semibold leading-none text-ink">
                        {d.getDate()}
                      </span>
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-muted">
                        {MONTHS_SV[d.getMonth()]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold leading-snug text-ink group-hover:text-primary">
                        {e.title}
                      </div>
                      <div className="mt-1.5 text-sm text-muted">{e.location}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Municipalities */}
        <section aria-labelledby="kommuner">
          <p className="eyebrow">Nära dig</p>
          <h2 id="kommuner" className="font-display mt-2 text-3xl font-semibold text-ink">
            Hitta i din kommun
          </h2>
          <div className="mt-7 flex flex-wrap gap-2.5">
            {municipalities.map((m) => (
              <Link
                key={m.slug}
                href={`/${m.slug}`}
                className="rounded-full border border-border bg-card px-5 py-2 text-sm font-medium text-ink transition-colors hover:border-primary hover:bg-primary hover:text-white"
              >
                {m.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Business CTA */}
        <section className="relative overflow-hidden rounded-3xl bg-primary-deep px-8 py-14 text-center text-white sm:px-14">
          <div className="absolute inset-0 bg-[radial-gradient(80%_120%_at_50%_-20%,#10506b_0%,#081f2b_75%)]" />
          <div className="relative mx-auto max-w-2xl">
            <p className="eyebrow !text-amber-400/80">För företag på Åland</p>
            <h2 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">
              Syns när ålänningarna söker
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-white/65">
              Gör anspråk på din profil, uppdatera dina uppgifter och nå kunder i
              rätt ögonblick. Grundprofilen är alltid gratis.
            </p>
            <Link
              href="/for-foretag"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-ink transition-colors hover:bg-primary-light"
            >
              Läs mer för företag <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
