import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aktuella erbjudanden på Åland",
  description: "Lokala erbjudanden och kampanjer från åländska företag – uppdateras löpande.",
  alternates: { canonical: "/erbjudanden" },
};

export default async function OffersPage() {
  const now = new Date();
  const offers = await prisma.offer.findMany({
    where: { active: true, startDate: { lte: now }, endDate: { gte: now }, business: { active: true } },
    include: { business: { include: { municipality: true, primaryCategory: true } } },
    orderBy: { endDate: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Brödsmulor" className="text-sm text-muted">
        <Link href="/" className="hover:text-primary">Hem</Link> / Erbjudanden
      </nav>
      <h1 className="mt-2 text-2xl font-bold">Aktuella erbjudanden på Åland</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Rabatter och kampanjer från lokala företag just nu.
      </p>
      {offers.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <Link
              key={o.id}
              href={`/foretag/${o.business.slug}`}
              className="rounded-xl border border-border bg-white p-5 hover:border-primary hover:shadow-sm"
            >
              <div className="text-sm font-semibold text-accent">Erbjudande</div>
              <h2 className="mt-1 font-semibold">{o.title}</h2>
              {o.description && <p className="mt-1 text-sm text-muted">{o.description}</p>}
              <div className="mt-3 text-sm font-medium text-primary">{o.business.name}</div>
              <div className="text-xs text-muted">
                {o.business.municipality?.name} · Gäller t.o.m. {formatDate(o.endDate)}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-border bg-surface p-8 text-center text-muted">
          Inga aktiva erbjudanden just nu – titta in snart igen!
        </div>
      )}
    </div>
  );
}
