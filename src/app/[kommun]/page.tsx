import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BusinessCard } from "@/components/business-card";
import { BusinessMap } from "@/components/business-map";
import { formatDateShort } from "@/lib/utils";
import { breadcrumbJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ kommun: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { kommun } = await params;
  const municipality = await prisma.municipality.findUnique({ where: { slug: kommun } });
  if (!municipality) return { title: "Sidan hittades inte" };
  return {
    title: `${municipality.name} – företag, erbjudanden och evenemang`,
    description: `Hitta lokala företag, aktuella erbjudanden och evenemang i ${municipality.name} på Åland.`,
    alternates: { canonical: `/${kommun}` },
  };
}

export default async function MunicipalityPage({ params }: PageProps) {
  const { kommun } = await params;
  const municipality = await prisma.municipality.findUnique({ where: { slug: kommun } });
  if (!municipality) notFound();

  const now = new Date();
  const [businesses, offers, events] = await Promise.all([
    prisma.business.findMany({
      where: { active: true, municipalityId: municipality.id },
      include: {
        primaryCategory: true,
        municipality: true,
        categories: { include: { category: true } },
      },
      orderBy: [{ verified: "desc" }, { name: "asc" }],
    }),
    prisma.offer.findMany({
      where: {
        active: true,
        startDate: { lte: now },
        endDate: { gte: now },
        business: { active: true, municipalityId: municipality.id },
      },
      include: { business: { select: { name: true, slug: true } } },
      take: 4,
    }),
    prisma.event.findMany({
      where: {
        active: true,
        endDate: { gte: now },
        business: { municipalityId: municipality.id },
      },
      orderBy: { startDate: "asc" },
      take: 4,
    }),
  ]);

  // Popular categories in this municipality.
  const categoryCounts = new Map<string, { name: string; slug: string; icon: string; count: number }>();
  for (const b of businesses) {
    for (const bc of b.categories) {
      const existing = categoryCounts.get(bc.category.slug);
      if (existing) existing.count++;
      else
        categoryCounts.set(bc.category.slug, {
          name: bc.category.name,
          slug: bc.category.slug,
          icon: bc.category.icon,
          count: 1,
        });
    }
  }
  const topCategories = Array.from(categoryCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const markers = businesses
    .filter((b) => b.latitude !== null && b.longitude !== null)
    .map((b) => ({ name: b.name, slug: b.slug, latitude: b.latitude!, longitude: b.longitude! }));

  const jsonLd = breadcrumbJsonLd([
    { name: "Hem", path: "/" },
    { name: "Kommuner", path: "/kommuner" },
    { name: municipality.name, path: `/${municipality.slug}` },
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <nav aria-label="Brödsmulor" className="text-sm text-muted">
        <Link href="/" className="hover:text-primary">Hem</Link> /{" "}
        <Link href="/kommuner" className="hover:text-primary">Kommuner</Link> / {municipality.name}
      </nav>
      <h1 className="font-display mt-2 text-3xl font-semibold text-ink">{municipality.name}</h1>
      {municipality.description && (
        <p className="mt-2 max-w-2xl text-muted">{municipality.description}</p>
      )}

      {topCategories.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-xl font-semibold text-ink">Populära kategorier i {municipality.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {topCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/sok?kategori=${c.slug}&kommun=${municipality.slug}`}
                className="rounded-full border border-border px-3 py-1 text-sm hover:border-primary hover:text-primary"
              >
                {c.name} ({c.count})
              </Link>
            ))}
          </div>
        </section>
      )}

      {offers.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-ink">Erbjudanden i {municipality.name}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {offers.map((o) => (
              <Link
                key={o.id}
                href={`/foretag/${o.business.slug}`}
                className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)] ring-1 ring-hairline transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="text-sm font-semibold text-accent">Erbjudande</div>
                <div className="mt-1 font-semibold">{o.title}</div>
                <div className="mt-1 text-sm text-muted">{o.business.name}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-ink">Evenemang i {municipality.name}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/evenemang/${e.slug}`}
                className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)] ring-1 ring-hairline transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
              >
                <div className="text-sm font-semibold text-primary">{formatDateShort(e.startDate)}</div>
                <div className="mt-1 font-semibold">{e.title}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <section className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold text-ink">
            Företag i {municipality.name} ({businesses.length})
          </h2>
          {businesses.length > 0 ? (
            <div className="mt-3 space-y-3">
              {businesses.map((b) => (
                <BusinessCard key={b.id} business={b} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
              Inga företag registrerade i {municipality.name} ännu.
            </div>
          )}
        </section>
        {markers.length > 0 && (
          <aside className="lg:w-96 lg:shrink-0">
            <h2 className="mb-2 text-sm font-semibold text-muted">Karta</h2>
            <BusinessMap markers={markers} />
          </aside>
        )}
      </div>
    </div>
  );
}
