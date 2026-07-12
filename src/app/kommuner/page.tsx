import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kommuner på Åland – hitta lokala företag",
  description:
    "Utforska företag, erbjudanden och evenemang i alla 16 åländska kommuner – från Mariehamn till skärgården.",
  alternates: { canonical: "/kommuner" },
};

export default async function MunicipalitiesPage() {
  const municipalities = await prisma.municipality.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { businesses: { where: { active: true } } } } },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Brödsmulor" className="text-sm text-muted">
        <Link href="/" className="hover:text-primary">Hem</Link> / Kommuner
      </nav>
      <h1 className="font-display mt-2 text-3xl font-semibold text-ink">Ålands kommuner</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Hitta företag och service där du bor eller dit du ska – i staden, på
        landsbygden och i skärgården.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {municipalities.map((m) => (
          <Link
            key={m.slug}
            href={`/${m.slug}`}
            className="rounded-2xl bg-card p-5 shadow-[var(--shadow-card)] ring-1 ring-hairline transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
          >
            <div className="font-semibold">{m.name}</div>
            <div className="mt-1 text-xs text-muted">{m._count.businesses} företag</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
