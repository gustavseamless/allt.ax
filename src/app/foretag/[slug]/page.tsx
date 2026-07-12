import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionId } from "@/lib/session-id";
import { openStatusText, formatOpeningHours, type OpeningHours } from "@/lib/opening-hours";
import { VerifiedBadge, PremiumBadge, OpenBadge, DemoBadge } from "@/components/badges";
import { BusinessCard } from "@/components/business-card";
import { BusinessMap } from "@/components/business-map";
import { TrackedLink } from "@/components/tracked-link";
import { formatDate, formatDateShort, truncate } from "@/lib/utils";
import { businessJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * /foretag/[slug] resolves a CATEGORY first (e.g. /foretag/elektriker) and
 * falls back to a BUSINESS PROFILE (e.g. /foretag/el-karlsson).
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (category) {
    return {
      title: `${category.name} på Åland – hitta och jämför`,
      description:
        category.description ||
        `Hitta ${category.name.toLowerCase()} på Åland. Kontaktuppgifter, öppettider och erbjudanden.`,
      alternates: { canonical: `/foretag/${slug}` },
    };
  }
  const business = await prisma.business.findUnique({
    where: { slug },
    include: { municipality: true, primaryCategory: true },
  });
  if (!business || !business.active) return { title: "Sidan hittades inte" };
  return {
    title: `${business.name}${business.municipality ? ` – ${business.municipality.name}` : ""}`,
    description: truncate(
      business.shortDescription || business.description || `${business.name} på Åland.`,
      155,
    ),
    alternates: { canonical: `/foretag/${slug}` },
    openGraph: {
      title: business.name,
      description: truncate(business.shortDescription || business.description, 155),
      type: "website",
    },
  };
}

export default async function CategoryOrBusinessPage({ params }: PageProps) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({ where: { slug } });
  if (category) return <CategoryView categoryId={category.id} />;

  return <BusinessView slug={slug} />;
}

// --- Category landing page ----------------------------------------------------

async function CategoryView({ categoryId }: { categoryId: string }) {
  const category = await prisma.category.findUniqueOrThrow({ where: { id: categoryId } });
  const [links, municipalities] = await Promise.all([
    prisma.businessCategory.findMany({
      where: { categoryId, business: { active: true } },
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
    prisma.municipality.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Simple browse ranking: verified and complete profiles first. Paid
  // placements never affect this order.
  const businesses = links
    .map((l) => l.business)
    .sort((a, b) => {
      const score = (x: typeof a) =>
        (x.verified ? 2 : 0) + (x.description.length > 80 ? 1 : 0) + (x.phone ? 1 : 0);
      return score(b) - score(a) || a.name.localeCompare(b.name, "sv");
    });

  const municipalitiesWithBusinesses = municipalities.filter((m) =>
    businesses.some((b) => b.municipalityId === m.id),
  );

  const jsonLd = breadcrumbJsonLd([
    { name: "Hem", path: "/" },
    { name: "Företag", path: "/foretag" },
    { name: category.name, path: `/foretag/${category.slug}` },
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label="Brödsmulor" className="text-sm text-muted">
        <Link href="/" className="hover:text-primary">Hem</Link> /{" "}
        <Link href="/foretag" className="hover:text-primary">Företag</Link> / {category.name}
      </nav>
      <h1 className="mt-2 text-2xl font-bold">
        {category.icon} {category.name} på Åland
      </h1>
      {category.description && <p className="mt-2 max-w-2xl text-muted">{category.description}</p>}

      {municipalitiesWithBusinesses.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {municipalitiesWithBusinesses.map((m) => (
            <Link
              key={m.slug}
              href={`/sok?kategori=${category.slug}&kommun=${m.slug}`}
              className="rounded-full border border-border px-3 py-1 text-sm hover:border-primary hover:text-primary"
            >
              {category.name} i {m.name}
            </Link>
          ))}
        </div>
      )}

      {businesses.length > 0 ? (
        <div className="mt-6 space-y-3">
          {businesses.map((b) => (
            <BusinessCard key={b.id} business={b} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-border bg-surface p-8 text-center">
          <p className="font-semibold">Inga företag i denna kategori ännu.</p>
          <p className="mt-2 text-sm text-muted">
            Driver du ett företag inom {category.name.toLowerCase()}?{" "}
            <Link href="/for-foretag" className="text-primary hover:underline">
              Lägg till din profil gratis.
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

// --- Business profile -----------------------------------------------------------

async function BusinessView({ slug }: { slug: string }) {
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      primaryCategory: true,
      municipality: true,
      categories: { include: { category: true } },
      services: true,
      images: { orderBy: { sortOrder: "asc" } },
      offers: { where: { active: true, endDate: { gte: new Date() } }, orderBy: { endDate: "asc" } },
      events: { where: { active: true, endDate: { gte: new Date() } }, orderBy: { startDate: "asc" } },
    },
  });
  if (!business || !business.active) notFound();

  // Log the profile view (fire and forget).
  const sessionId = await getSessionId();
  prisma.profileView
    .create({ data: { businessId: business.id, sessionId, source: "direct" } })
    .catch(() => {});

  const hours = business.openingHours as OpeningHours;
  const hasHours = hours && Object.keys(hours).length > 0;
  const status = openStatusText(hours);
  const hourRows = formatOpeningHours(hours);
  const social = (business.socialLinks ?? {}) as Record<string, string>;

  const related = await prisma.business.findMany({
    where: {
      id: { not: business.id },
      active: true,
      primaryCategoryId: business.primaryCategoryId,
    },
    orderBy: { verified: "desc" },
    take: 3,
    include: {
      primaryCategory: true,
      municipality: true,
      categories: { include: { category: true } },
    },
  });

  const jsonLd = businessJsonLd(business);
  const crumbs = breadcrumbJsonLd([
    { name: "Hem", path: "/" },
    { name: "Företag", path: "/foretag" },
    ...(business.primaryCategory
      ? [{ name: business.primaryCategory.name, path: `/foretag/${business.primaryCategory.slug}` }]
      : []),
    { name: business.name, path: `/foretag/${business.slug}` },
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: crumbs }} />

      <nav aria-label="Brödsmulor" className="text-sm text-muted">
        <Link href="/" className="hover:text-primary">Hem</Link> /{" "}
        {business.primaryCategory ? (
          <>
            <Link href={`/foretag/${business.primaryCategory.slug}`} className="hover:text-primary">
              {business.primaryCategory.name}
            </Link>{" "}
            /{" "}
          </>
        ) : null}
        {business.name}
      </nav>

      <div className="mt-4 flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          {/* Head */}
          <div className="flex items-start gap-4">
            <div
              aria-hidden
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary-light text-3xl"
            >
              {business.primaryCategory?.icon || business.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{business.name}</h1>
                {business.verified && <VerifiedBadge />}
                {business.premium && <PremiumBadge />}
                {business.demo && <DemoBadge />}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                {business.primaryCategory && (
                  <Link href={`/foretag/${business.primaryCategory.slug}`} className="text-primary hover:underline">
                    {business.primaryCategory.name}
                  </Link>
                )}
                {business.municipality && (
                  <Link href={`/${business.municipality.slug}`} className="hover:underline">
                    📍 {business.address ? `${business.address}, ` : ""}
                    {business.municipality.name}
                  </Link>
                )}
                {hasHours ? <OpenBadge open={status.open} text={status.text} /> : null}
              </div>
            </div>
          </div>

          {/* Contact actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            {business.phone && (
              <TrackedLink
                href={`tel:${business.phone.replace(/\s/g, "")}`}
                businessId={business.id}
                action="phone"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
              >
                📞 {business.phone}
              </TrackedLink>
            )}
            {business.website && (
              <TrackedLink
                href={business.website}
                businessId={business.id}
                action="website"
                target="_blank"
                rel="noopener nofollow"
                className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-light"
              >
                🌐 Webbplats
              </TrackedLink>
            )}
            {business.email && (
              <TrackedLink
                href={`mailto:${business.email}`}
                businessId={business.id}
                action="email"
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-surface"
              >
                ✉️ E-post
              </TrackedLink>
            )}
            {business.bookingUrl && (
              <TrackedLink
                href={business.bookingUrl}
                businessId={business.id}
                action="booking"
                target="_blank"
                rel="noopener nofollow"
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                📅 Boka
              </TrackedLink>
            )}
          </div>

          {/* Description */}
          <section className="mt-6">
            <h2 className="text-lg font-bold">Om {business.name}</h2>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">
              {business.description || business.shortDescription}
            </p>
            {business.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {business.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/sok?q=${encodeURIComponent(t)}`}
                    className="rounded-full bg-surface px-2.5 py-0.5 text-xs text-muted hover:text-primary"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Services */}
          {business.services.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-bold">Tjänster och priser</h2>
              <ul className="mt-2 divide-y divide-border rounded-xl border border-border bg-white">
                {business.services.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium">{s.name}</div>
                      {s.description && <div className="text-muted">{s.description}</div>}
                    </div>
                    {s.priceText && <div className="shrink-0 font-semibold">{s.priceText}</div>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Offers */}
          {business.offers.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-bold">Aktuella erbjudanden</h2>
              <div className="mt-2 space-y-2">
                {business.offers.map((o) => (
                  <div key={o.id} className="rounded-xl border border-accent/40 bg-accent-light/30 p-4">
                    <div className="font-semibold">{o.title}</div>
                    {o.description && <p className="mt-1 text-sm">{o.description}</p>}
                    <div className="mt-1 text-xs text-muted">
                      Gäller {formatDateShort(o.startDate)} – {formatDate(o.endDate)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Events */}
          {business.events.length > 0 && (
            <section className="mt-6">
              <h2 className="text-lg font-bold">Kommande evenemang</h2>
              <div className="mt-2 space-y-2">
                {business.events.map((e) => (
                  <Link
                    key={e.id}
                    href={`/evenemang/${e.slug}`}
                    className="block rounded-xl border border-border bg-white p-4 hover:border-primary"
                  >
                    <div className="text-sm font-semibold text-primary">{formatDate(e.startDate)}</div>
                    <div className="font-semibold">{e.title}</div>
                    <div className="text-sm text-muted">{e.location}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Claim CTA */}
          {!business.claimedByUserId && (
            <div className="mt-8 rounded-xl border border-dashed border-border bg-surface p-4 text-sm">
              Är detta ditt företag?{" "}
              <Link
                href={`/panel/ansprak/${business.id}`}
                className="font-semibold text-primary hover:underline"
              >
                Gör anspråk på denna profil
              </Link>{" "}
              för att uppdatera uppgifter, svara på förfrågningar och se statistik.
            </div>
          )}

          {/* Related */}
          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-bold">Liknande företag</h2>
              <div className="mt-3 space-y-3">
                {related.map((b) => (
                  <BusinessCard key={b.id} business={b} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:w-80 lg:shrink-0">
          {business.latitude !== null && business.longitude !== null && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-muted">Karta</h2>
              <BusinessMap
                markers={[
                  {
                    name: business.name,
                    slug: business.slug,
                    latitude: business.latitude,
                    longitude: business.longitude,
                  },
                ]}
              />
              <a
                href={`https://www.openstreetmap.org/directions?to=${business.latitude}%2C${business.longitude}`}
                target="_blank"
                rel="noopener"
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                Vägbeskrivning →
              </a>
            </div>
          )}

          {hasHours && (
            <div className="rounded-xl border border-border bg-white p-4">
              <h2 className="text-sm font-semibold">Öppettider</h2>
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {hourRows.map((row) => (
                    <tr key={row.day}>
                      <td className="py-0.5 pr-4 text-muted">{row.day}</td>
                      <td className="py-0.5 text-right">{row.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-xl border border-border bg-white p-4 text-sm">
            <h2 className="font-semibold">Kontakt</h2>
            <dl className="mt-2 space-y-1 text-muted">
              {business.address && (
                <div>
                  <dt className="sr-only">Adress</dt>
                  <dd>
                    {business.address}, {business.postalCode} {business.city}
                  </dd>
                </div>
              )}
              {business.phone && <dd>{business.phone}</dd>}
              {business.email && <dd>{business.email}</dd>}
              {Object.entries(social).map(([k, v]) => (
                <dd key={k}>
                  <a href={v} rel="noopener nofollow" target="_blank" className="text-primary hover:underline">
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                  </a>
                </dd>
              ))}
            </dl>
          </div>

          {business.categories.length > 1 && (
            <div className="text-sm">
              <h2 className="font-semibold text-muted">Kategorier</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {business.categories.map((bc) => (
                  <Link
                    key={bc.categoryId}
                    href={`/foretag/${bc.category.slug}`}
                    className="rounded-full border border-border px-2.5 py-0.5 text-xs hover:border-primary hover:text-primary"
                  >
                    {bc.category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
