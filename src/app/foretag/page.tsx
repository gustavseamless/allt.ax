import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { CategoryIconBadge } from "@/components/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alla kategorier – hitta företag på Åland",
  description:
    "Bläddra bland alla företagskategorier på Åland: restauranger, hantverkare, butiker, tjänster och mycket mer.",
  alternates: { canonical: "/foretag" },
};

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { businessCategories: true } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Brödsmulor" className="text-sm text-muted">
        <Link href="/" className="hover:text-primary">Hem</Link> / Företag
      </nav>
      <h1 className="font-display mt-2 text-3xl font-semibold text-ink">Företag på Åland – alla kategorier</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Hitta rätt företag i rätt kategori. Alla åländska företag kan ha en
        gratis grundprofil på allt.ax.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/foretag/${c.slug}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-white p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card-hover)]"
          >
            <CategoryIconBadge slug={c.slug} size="sm" />
            <span className="flex-1">
              <span className="block font-semibold">{c.name}</span>
              <span className="block text-xs text-muted">
                {c._count.businessCategories} företag
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
