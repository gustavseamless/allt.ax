import Link from "next/link";
import { prisma } from "@/lib/db";
import { reviewClaimAction } from "../actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – anspråk", robots: { index: false } };

export default async function AdminClaimsPage() {
  const claims = await prisma.businessClaim.findMany({
    include: {
      business: { select: { name: true, slug: true } },
      user: { select: { name: true, email: true } },
      reviewer: { select: { name: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const pending = claims.filter((c) => c.status === "PENDING");
  const handled = claims.filter((c) => c.status !== "PENDING");

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-bold">Väntande anspråk ({pending.length})</h2>
        {pending.length === 0 && <p className="mt-2 text-sm text-muted">Inga väntande anspråk.</p>}
        <div className="mt-3 space-y-3">
          {pending.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link href={`/foretag/${c.business.slug}`} className="font-semibold text-primary hover:underline">
                    {c.business.name}
                  </Link>
                  <div className="text-sm text-muted">
                    Anspråk av {c.user.name} ({c.user.email}) · {formatDate(c.createdAt)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={reviewClaimAction.bind(null, c.id, true)}>
                    <button
                      type="submit"
                      className="rounded-lg bg-success px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Godkänn
                    </button>
                  </form>
                  <form action={reviewClaimAction.bind(null, c.id, false)}>
                    <button
                      type="submit"
                      className="rounded-lg border border-red-300 px-4 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                      Avslå
                    </button>
                  </form>
                </div>
              </div>
              <blockquote className="mt-3 rounded-lg bg-surface p-3 text-sm">{c.evidence}</blockquote>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">Hanterade anspråk</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {handled.map((c) => (
            <li key={c.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-border px-3 py-2">
              <span>
                {c.business.name} – {c.user.name}
              </span>
              <span className={c.status === "APPROVED" ? "text-success" : "text-red-700"}>
                {c.status === "APPROVED" ? "Godkänt" : "Avslaget"}
                {c.reviewer && ` av ${c.reviewer.name}`}
                {c.reviewedAt && ` · ${formatDate(c.reviewedAt)}`}
              </span>
            </li>
          ))}
          {handled.length === 0 && <li className="text-muted">Inga hanterade anspråk ännu.</li>}
        </ul>
      </section>
    </div>
  );
}
