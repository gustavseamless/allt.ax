import { prisma } from "@/lib/db";
import { setCampaignStatusAction } from "../actions";
import { NewCampaignForm } from "./new-campaign-form";
import { formatDateShort } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – kampanjer", robots: { index: false } };

export default async function AdminCampaignsPage() {
  const [campaigns, businesses, categories, municipalities] = await Promise.all([
    prisma.campaign.findMany({
      include: { business: { select: { name: true } } },
      orderBy: [{ status: "asc" }, { endDate: "desc" }],
    }),
    prisma.business.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.municipality.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold">Sponsrade kampanjer ({campaigns.length})</h2>
        <p className="text-xs text-muted">
          Alla sponsrade placeringar märks alltid ”Sponsrad” i gränssnittet och
          påverkar aldrig organisk ranking.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted">
                <th className="py-2 pr-3">Kampanj</th>
                <th className="py-2 pr-3">Företag</th>
                <th className="py-2 pr-3">Period</th>
                <th className="py-2 pr-3">Sökord</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3 text-right">Visn.</th>
                <th className="py-2 pr-3 text-right">Klick</th>
                <th className="py-2 pr-3 text-right">CTR</th>
                <th className="py-2">Åtgärd</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-border/60 align-top">
                  <td className="py-2 pr-3 font-medium">{c.name}</td>
                  <td className="py-2 pr-3">{c.business.name}</td>
                  <td className="py-2 pr-3 whitespace-nowrap text-muted">
                    {formatDateShort(c.startDate)} – {formatDateShort(c.endDate)}
                  </td>
                  <td className="py-2 pr-3 text-muted">{c.targetKeywords.join(", ") || "–"}</td>
                  <td className="py-2 pr-3">
                    <StatusChip status={c.status} />
                  </td>
                  <td className="py-2 pr-3 text-right">{c.impressionCount}</td>
                  <td className="py-2 pr-3 text-right">{c.clickCount}</td>
                  <td className="py-2 pr-3 text-right">
                    {c.impressionCount > 0
                      ? `${((c.clickCount / c.impressionCount) * 100).toFixed(1)} %`
                      : "–"}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      {c.status !== "ACTIVE" && c.status !== "ENDED" && (
                        <form action={setCampaignStatusAction.bind(null, c.id, "ACTIVE")}>
                          <ActionButton label="Aktivera" />
                        </form>
                      )}
                      {c.status === "ACTIVE" && (
                        <form action={setCampaignStatusAction.bind(null, c.id, "PAUSED")}>
                          <ActionButton label="Pausa" />
                        </form>
                      )}
                      {c.status !== "ENDED" && (
                        <form action={setCampaignStatusAction.bind(null, c.id, "ENDED")}>
                          <ActionButton label="Avsluta" />
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="max-w-2xl border-t border-border pt-6">
        <h2 className="text-lg font-bold">Skapa sponsrad kampanj</h2>
        <NewCampaignForm businesses={businesses} categories={categories} municipalities={municipalities} />
      </section>
    </div>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    ACTIVE: ["Aktiv", "bg-success-light text-success"],
    DRAFT: ["Utkast/förfrågan", "bg-accent-light text-accent"],
    PAUSED: ["Pausad", "bg-surface text-muted"],
    ENDED: ["Avslutad", "bg-surface text-muted"],
  };
  const [label, classes] = map[status] ?? [status, ""];
  return <span className={`whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ${classes}`}>{label}</span>;
}

function ActionButton({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="rounded-md border border-border px-2 py-0.5 text-xs hover:border-primary hover:text-primary"
    >
      {label}
    </button>
  );
}
