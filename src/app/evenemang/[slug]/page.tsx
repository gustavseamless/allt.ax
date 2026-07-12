import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { eventJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event || !event.active) return { title: "Sidan hittades inte" };
  return {
    title: event.title,
    description: event.description.slice(0, 155) || `${event.title} – evenemang på Åland.`,
    alternates: { canonical: `/evenemang/${slug}` },
  };
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    include: { business: { select: { name: true, slug: true } } },
  });
  if (!event || !event.active) notFound();

  const jsonLd = eventJsonLd(event, event.business?.name);
  const crumbs = breadcrumbJsonLd([
    { name: "Hem", path: "/" },
    { name: "Evenemang", path: "/evenemang" },
    { name: event.title, path: `/evenemang/${event.slug}` },
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: crumbs }} />
      <nav aria-label="Brödsmulor" className="text-sm text-muted">
        <Link href="/" className="hover:text-primary">Hem</Link> /{" "}
        <Link href="/evenemang" className="hover:text-primary">Evenemang</Link> / {event.title}
      </nav>
      <h1 className="font-display mt-2 text-3xl font-semibold text-ink">{event.title}</h1>
      <div className="mt-2 text-sm font-semibold text-primary">
        {formatDate(event.startDate)}
        {event.endDate.getTime() !== event.startDate.getTime() && ` – ${formatDate(event.endDate)}`}
      </div>
      <div className="mt-1 text-sm text-muted">📍 {event.location}</div>
      <p className="mt-4 whitespace-pre-line leading-relaxed">{event.description}</p>
      {event.business && (
        <div className="mt-6 rounded-xl border border-border bg-surface p-4 text-sm">
          Arrangör:{" "}
          <Link href={`/foretag/${event.business.slug}`} className="font-semibold text-primary hover:underline">
            {event.business.name}
          </Link>
        </div>
      )}
    </div>
  );
}
