import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { formatDateShort } from "@/lib/utils";
import { toggleOfferAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Min panel", robots: { index: false } };

export default async function PanelPage() {
  const user = await getSessionUser();
  if (!user) redirect("/logga-in");

  const now = new Date();
  const since = new Date(now.getTime() - 30 * 86_400_000);

  const [businesses, claims] = await Promise.all([
    prisma.business.findMany({
      where: { claimedByUserId: user.id },
      include: {
        primaryCategory: true,
        municipality: true,
        offers: { orderBy: { endDate: "desc" }, take: 10 },
        campaigns: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.businessClaim.findMany({
      where: { userId: user.id },
      include: { business: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // 30-day stats per business.
  const stats = await Promise.all(
    businesses.map(async (b) => {
      const [views, clicks] = await Promise.all([
        prisma.profileView.count({ where: { businessId: b.id, createdAt: { gte: since } } }),
        prisma.adClick.groupBy({
          by: ["action"],
          _count: { action: true },
          where: { businessId: b.id, createdAt: { gte: since } },
        }),
      ]);
      return { businessId: b.id, views, clicks };
    }),
  );
  const statsFor = (id: string) => stats.find((s) => s.businessId === id);

  return (
    <div className="space-y-8">
      {businesses.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-6">
          <h2 className="font-bold">Du har inga företagsprofiler ännu</h2>
          <p className="mt-1 text-sm text-muted">
            Sök upp ditt företag och gör anspråk på profilen, så granskar vi
            anspråket – oftast inom en arbetsdag.
          </p>
          <Link
            href="/foretag"
            className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Hitta ditt företag
          </Link>
        </div>
      )}

      {businesses.map((b) => {
        const s = statsFor(b.id);
        const clickCount = (action: string) =>
          s?.clicks.find((c) => c.action === action)?._count.action ?? 0;
        return (
          <section key={b.id} className="rounded-2xl border border-border bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{b.name}</h2>
                <p className="text-sm text-muted">
                  {b.primaryCategory?.name} · {b.municipality?.name}
                  {b.premium && " · Premium"}
                  {b.verified && " · Verifierad"}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                <Link
                  href={`/foretag/${b.slug}`}
                  className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface"
                >
                  Visa profil
                </Link>
                <Link
                  href={`/panel/foretag/${b.id}`}
                  className="rounded-lg bg-primary px-3 py-1.5 font-semibold text-white hover:bg-primary-dark"
                >
                  Redigera
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatCard label="Profilvisningar (30 d)" value={s?.views ?? 0} />
              <StatCard label="Klick telefon" value={clickCount("phone")} />
              <StatCard label="Klick webbplats" value={clickCount("website")} />
              <StatCard label="Klick e-post" value={clickCount("email")} />
              <StatCard label="Klick bokning" value={clickCount("booking")} />
            </div>

            {/* Campaigns */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Sponsrade kampanjer</h3>
                <Link
                  href={`/panel/foretag/${b.id}#annonsering`}
                  className="text-sm text-primary hover:underline"
                >
                  Begär ny kampanj
                </Link>
              </div>
              {b.campaigns.length > 0 ? (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase text-muted">
                        <th className="py-2 pr-3">Kampanj</th>
                        <th className="py-2 pr-3">Status</th>
                        <th className="py-2 pr-3">Period</th>
                        <th className="py-2 pr-3 text-right">Visningar</th>
                        <th className="py-2 pr-3 text-right">Klick</th>
                        <th className="py-2 text-right">CTR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {b.campaigns.map((c) => (
                        <tr key={c.id} className="border-b border-border/60">
                          <td className="py-2 pr-3">{c.name}</td>
                          <td className="py-2 pr-3">
                            <CampaignStatusBadge status={c.status} />
                          </td>
                          <td className="py-2 pr-3 text-muted">
                            {formatDateShort(c.startDate)} – {formatDateShort(c.endDate)}
                          </td>
                          <td className="py-2 pr-3 text-right">{c.impressionCount}</td>
                          <td className="py-2 pr-3 text-right">{c.clickCount}</td>
                          <td className="py-2 text-right">
                            {c.impressionCount > 0
                              ? `${((c.clickCount / c.impressionCount) * 100).toFixed(1)} %`
                              : "–"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted">Inga kampanjer ännu.</p>
              )}
            </div>

            {/* Offers */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Erbjudanden</h3>
                <Link
                  href={`/panel/foretag/${b.id}#erbjudanden`}
                  className="text-sm text-primary hover:underline"
                >
                  Skapa erbjudande
                </Link>
              </div>
              {b.offers.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {b.offers.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                      <span>
                        {o.title}{" "}
                        <span className="text-xs text-muted">
                          ({formatDateShort(o.startDate)} – {formatDateShort(o.endDate)})
                        </span>
                      </span>
                      <form action={toggleOfferAction.bind(null, o.id)}>
                        <button
                          type="submit"
                          className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                            o.active ? "bg-success-light text-success" : "bg-surface text-muted"
                          }`}
                        >
                          {o.active ? "Aktiv – klicka för att pausa" : "Pausad – klicka för att aktivera"}
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-muted">Inga erbjudanden ännu.</p>
              )}
            </div>
          </section>
        );
      })}

      {/* Claims */}
      {claims.length > 0 && (
        <section>
          <h2 className="text-lg font-bold">Mina anspråk</h2>
          <ul className="mt-2 space-y-2">
            {claims.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm"
              >
                <Link href={`/foretag/${c.business.slug}`} className="font-medium text-primary hover:underline">
                  {c.business.name}
                </Link>
                <span
                  className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                    c.status === "APPROVED"
                      ? "bg-success-light text-success"
                      : c.status === "REJECTED"
                        ? "bg-red-50 text-red-700"
                        : "bg-accent-light text-accent"
                  }`}
                >
                  {c.status === "APPROVED" ? "Godkänt" : c.status === "REJECTED" ? "Avslaget" : "Väntar på granskning"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface p-3">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-success-light text-success",
    DRAFT: "bg-accent-light text-accent",
    PAUSED: "bg-surface text-muted",
    ENDED: "bg-surface text-muted",
  };
  const labels: Record<string, string> = {
    ACTIVE: "Aktiv",
    DRAFT: "Väntar på aktivering",
    PAUSED: "Pausad",
    ENDED: "Avslutad",
  };
  return (
    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  );
}
