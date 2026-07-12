import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import type { BusinessWithRelations } from "@/lib/search";
import { openStatusText, type OpeningHours } from "@/lib/opening-hours";
import { SponsoredBadge, VerifiedBadge, OpenBadge } from "@/components/badges";
import { CategoryIconBadge } from "@/components/icons";
import { truncate } from "@/lib/utils";

interface BusinessCardProps {
  business: BusinessWithRelations;
  /** Set when the card is a paid placement – renders the mandatory label. */
  sponsored?: boolean;
}

export function BusinessCard({ business, sponsored = false }: BusinessCardProps) {
  const status = openStatusText(business.openingHours as OpeningHours);
  const hasHours =
    business.openingHours && Object.keys(business.openingHours as object).length > 0;

  return (
    <article
      className={`group rounded-xl border bg-white p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] ${
        sponsored ? "border-accent/30" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3.5">
        <CategoryIconBadge slug={business.primaryCategory?.slug} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {sponsored && <SponsoredBadge />}
            <h3 className="text-[15px] font-semibold leading-snug">
              <Link
                href={`/foretag/${business.slug}`}
                className="transition-colors group-hover:text-primary"
              >
                {business.name}
              </Link>
            </h3>
            {business.verified && <VerifiedBadge />}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {truncate(business.shortDescription || business.description, 140)}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-muted">
            {business.primaryCategory && (
              <Link
                href={`/foretag/${business.primaryCategory.slug}`}
                className="font-semibold text-primary hover:underline"
              >
                {business.primaryCategory.name}
              </Link>
            )}
            {business.municipality && (
              <Link
                href={`/${business.municipality.slug}`}
                className="inline-flex items-center gap-1 hover:text-primary"
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {business.municipality.name}
              </Link>
            )}
            {hasHours ? <OpenBadge open={status.open} text={status.text} /> : null}
            {business.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" aria-hidden />
                {business.phone}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
