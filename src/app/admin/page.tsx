import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – översikt", robots: { index: false } };

export default async function AdminOverviewPage() {
  const now = new Date();
  const since = new Date(now.getTime() - 30 * 86_400_000);

  const [
    businessCount,
    verifiedCount,
    premiumCount,
    userCount,
    pendingClaims,
    activeCampaigns,
    searchCount,
    profileViewCount,
    impressionCount,
    clickCount,
    popularSearches,
    zeroResultSearches,
    recentAudit,
  ] = await Promise.all([
    prisma.business.count({ where: { active: true } }),
    prisma.business.count({ where: { verified: true } }),
    prisma.business.count({ where: { premium: true } }),
    prisma.user.count(),
    prisma.businessClaim.count({ where: { status: "PENDING" } }),
    prisma.campaign.count({ where: { status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } } }),
    prisma.searchLog.count({ where: { createdAt: { gte: since } } }),
    prisma.profileView.count({ where: { createdAt: { gte: since } } }),
    prisma.adImpression.count({ where: { createdAt: { gte: since } } }),
    prisma.adClick.count({ where: { createdAt: { gte: since } } }),
    prisma.searchLog.groupBy({
      by: ["query"],
      _count: { query: true },
      where: { createdAt: { gte: since } },
      orderBy: { _count: { query: "desc" } },
      take: 10,
    }),
    prisma.searchLog.groupBy({
      by: ["query"],
      _count: { query: true },
      where: { createdAt: { gte: since }, resultCount: 0 },
      orderBy: { _count: { query: "desc" } },
      take: 10,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { user: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold">Senaste 30 dagarna</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Sökningar" value={searchCount} />
          <Stat label="Profilvisningar" value={profileViewCount} />
          <Stat label="Annonsvisningar" value={impressionCount} />
          <Stat label="Klick" value={clickCount} />
          <Stat label="Aktiva kampanjer" value={activeCampaigns} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Företag" value={businessCount} />
          <Stat label="Verifierade" value={verifiedCount} />
          <Stat label="Premium" value={premiumCount} />
          <Stat label="Användare" value={userCount} />
          <Stat label="Väntande anspråk" value={pendingClaims} highlight={pendingClaims > 0} />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-lg font-bold">Populära sökningar</h2>
          <ol className="mt-3 space-y-1 text-sm">
            {popularSearches.map((s) => (
              <li key={s.query} className="flex justify-between rounded-lg bg-surface px-3 py-1.5">
                <Link href={`/sok?q=${encodeURIComponent(s.query)}`} className="hover:text-primary">
                  {s.query}
                </Link>
                <span className="text-muted">{s._count.query}</span>
              </li>
            ))}
            {popularSearches.length === 0 && <li className="text-muted">Inga sökningar loggade ännu.</li>}
          </ol>
        </section>

        <section>
          <h2 className="text-lg font-bold">Sökningar utan resultat</h2>
          <p className="text-xs text-muted">Luckor i utbudet – kandidater för nya kategorier eller företag.</p>
          <ol className="mt-3 space-y-1 text-sm">
            {zeroResultSearches.map((s) => (
              <li key={s.query} className="flex justify-between rounded-lg bg-red-50 px-3 py-1.5">
                <span>{s.query}</span>
                <span className="text-muted">{s._count.query}</span>
              </li>
            ))}
            {zeroResultSearches.length === 0 && <li className="text-muted">Inga nollresultat – bra!</li>}
          </ol>
        </section>
      </div>

      <section>
        <h2 className="text-lg font-bold">Senaste administrativa ändringar</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {recentAudit.map((a) => (
            <li key={a.id} className="rounded-lg border border-border px-3 py-2">
              <span className="font-medium">{a.user?.name ?? "System"}</span>{" "}
              <span className="text-muted">
                {a.action} · {a.entityType} · {a.createdAt.toLocaleString("sv-FI")}
              </span>
            </li>
          ))}
          {recentAudit.length === 0 && <li className="text-muted">Inga ändringar loggade.</li>}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 ${highlight ? "bg-accent-light" : "bg-surface"}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
