import Link from "next/link";
import { prisma } from "@/lib/db";
import { toggleBusinessFlagAction } from "../actions";
import { NewBusinessForm } from "./new-business-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – företag", robots: { index: false } };

export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const businesses = await prisma.business.findMany({
    where: q
      ? { name: { contains: q, mode: "insensitive" } }
      : undefined,
    include: { primaryCategory: true, municipality: true },
    orderBy: { name: "asc" },
    take: 200,
  });
  const [categories, municipalities] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.municipality.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Företag ({businesses.length})</h2>
          <form action="/admin/foretag" method="get" role="search">
            <input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Filtrera på namn …"
              className="rounded-lg border border-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
          </form>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted">
                <th className="py-2 pr-3">Företag</th>
                <th className="py-2 pr-3">Kategori</th>
                <th className="py-2 pr-3">Kommun</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Åtgärder</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((b) => (
                <tr key={b.id} className="border-b border-border/60">
                  <td className="py-2 pr-3">
                    <Link href={`/foretag/${b.slug}`} className="font-medium text-primary hover:underline">
                      {b.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-muted">{b.primaryCategory?.name}</td>
                  <td className="py-2 pr-3 text-muted">{b.municipality?.name}</td>
                  <td className="py-2 pr-3">
                    <div className="flex flex-wrap gap-1">
                      {b.verified && <Chip label="Verifierad" tone="primary" />}
                      {b.premium && <Chip label="Premium" tone="accent" />}
                      {!b.active && <Chip label="Inaktiv" tone="muted" />}
                    </div>
                  </td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      <form action={toggleBusinessFlagAction.bind(null, b.id, "verified")}>
                        <FlagButton label={b.verified ? "Avverifiera" : "Verifiera"} />
                      </form>
                      <form action={toggleBusinessFlagAction.bind(null, b.id, "premium")}>
                        <FlagButton label={b.premium ? "Ta bort premium" : "Aktivera premium"} />
                      </form>
                      <form action={toggleBusinessFlagAction.bind(null, b.id, "active")}>
                        <FlagButton label={b.active ? "Inaktivera" : "Aktivera"} />
                      </form>
                      <Link
                        href={`/panel/foretag/${b.id}`}
                        className="rounded-md border border-border px-2 py-0.5 text-xs hover:border-primary hover:text-primary"
                      >
                        Redigera
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="max-w-xl border-t border-border pt-6">
        <h2 className="text-lg font-bold">Lägg till företag</h2>
        <NewBusinessForm
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          municipalities={municipalities.map((m) => ({ id: m.id, name: m.name }))}
        />
      </section>
    </div>
  );
}

function Chip({ label, tone }: { label: string; tone: "primary" | "accent" | "muted" }) {
  const classes = {
    primary: "bg-primary-light text-primary",
    accent: "bg-accent-light text-accent",
    muted: "bg-surface text-muted",
  };
  return <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${classes[tone]}`}>{label}</span>;
}

function FlagButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="rounded-md border border-border px-2 py-0.5 text-xs hover:border-primary hover:text-primary"
    >
      {label}
    </button>
  );
}
