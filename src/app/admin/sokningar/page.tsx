import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – sökningar", robots: { index: false } };

export default async function AdminSearchesPage() {
  const since = new Date(Date.now() - 30 * 86_400_000);

  const [popular, zero, recent] = await Promise.all([
    prisma.searchLog.groupBy({
      by: ["query"],
      _count: { query: true },
      _avg: { resultCount: true },
      where: { createdAt: { gte: since } },
      orderBy: { _count: { query: "desc" } },
      take: 30,
    }),
    prisma.searchLog.groupBy({
      by: ["query"],
      _count: { query: true },
      where: { createdAt: { gte: since }, resultCount: 0 },
      orderBy: { _count: { query: "desc" } },
      take: 30,
    }),
    prisma.searchLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { municipality: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <section>
        <h2 className="text-lg font-bold">Populära sökningar (30 d)</h2>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted">
              <th className="py-1 pr-2">Sökord</th>
              <th className="py-1 pr-2 text-right">Antal</th>
              <th className="py-1 text-right">Ø träffar</th>
            </tr>
          </thead>
          <tbody>
            {popular.map((s) => (
              <tr key={s.query} className="border-b border-border/60">
                <td className="py-1 pr-2">
                  <Link href={`/sok?q=${encodeURIComponent(s.query)}`} className="hover:text-primary">
                    {s.query}
                  </Link>
                </td>
                <td className="py-1 pr-2 text-right">{s._count.query}</td>
                <td className="py-1 text-right">{s._avg.resultCount?.toFixed(1) ?? "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="text-lg font-bold">Utan resultat (30 d)</h2>
        <p className="text-xs text-muted">Här saknas utbud – lägg till företag eller synonymer.</p>
        <ul className="mt-3 space-y-1 text-sm">
          {zero.map((s) => (
            <li key={s.query} className="flex justify-between rounded-lg bg-red-50 px-3 py-1.5">
              <span>{s.query}</span>
              <span className="text-muted">{s._count.query}</span>
            </li>
          ))}
          {zero.length === 0 && <li className="text-muted">Inga nollresultat.</li>}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold">Senaste sökningar</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {recent.map((s) => (
            <li key={s.id} className="rounded-lg border border-border px-3 py-1.5">
              <span className="font-medium">{s.query}</span>{" "}
              <span className="text-xs text-muted">
                {s.municipality ? `· ${s.municipality.name} ` : ""}· {s.resultCount} träffar ·{" "}
                {s.createdAt.toLocaleString("sv-FI")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
