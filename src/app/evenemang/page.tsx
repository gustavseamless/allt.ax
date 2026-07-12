import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Evenemang på Åland – vad händer?",
  description: "Kommande evenemang på Åland: musik, marknader, familjeaktiviteter och mer.",
  alternates: { canonical: "/evenemang" },
};

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    where: { active: true, endDate: { gte: new Date() } },
    include: { business: { select: { name: true, slug: true } } },
    orderBy: { startDate: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav aria-label="Brödsmulor" className="text-sm text-muted">
        <Link href="/" className="hover:text-primary">Hem</Link> / Evenemang
      </nav>
      <h1 className="mt-2 text-2xl font-bold">Vad händer på Åland?</h1>
      <p className="mt-2 max-w-2xl text-muted">Kommande evenemang från lokala arrangörer.</p>
      {events.length > 0 ? (
        <div className="mt-6 space-y-3">
          {events.map((e) => (
            <Link
              key={e.id}
              href={`/evenemang/${e.slug}`}
              className="flex flex-col gap-1 rounded-xl border border-border bg-white p-5 hover:border-primary hover:shadow-sm sm:flex-row sm:items-center sm:gap-6"
            >
              <div className="w-40 shrink-0 text-sm font-semibold text-primary">
                {formatDate(e.startDate)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{e.title}</h2>
                <div className="text-sm text-muted">{e.location}</div>
              </div>
              {e.business && <div className="text-sm text-muted">{e.business.name}</div>}
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-border bg-surface p-8 text-center text-muted">
          Inga kommande evenemang inlagda just nu.
        </div>
      )}
    </div>
  );
}
