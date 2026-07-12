import Link from "next/link";
import type { BusinessWithRelations } from "@/lib/search";
import { openStatusText, type OpeningHours } from "@/lib/opening-hours";
import { SponsoredBadge, VerifiedBadge, OpenBadge } from "@/components/badges";
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
      className={`rounded-xl border bg-white p-4 transition-shadow hover:shadow-md ${
        sponsored ? "border-accent/40 bg-accent-light/20" : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-light text-lg font-bold text-primary"
        >
          {business.primaryCategory?.icon || business.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {sponsored && <SponsoredBadge />}
            <h3 className="text-base font-semibold">
              <Link href={`/foretag/${business.slug}`} className="hover:text-primary hover:underline">
                {business.name}
              </Link>
            </h3>
            {business.verified && <VerifiedBadge />}
          </div>
          <p className="mt-1 text-sm text-muted">
            {truncate(business.shortDescription || business.description, 140)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {business.primaryCategory && (
              <Link
                href={`/foretag/${business.primaryCategory.slug}`}
                className="font-medium text-primary hover:underline"
              >
                {business.primaryCategory.name}
              </Link>
            )}
            {business.municipality && (
              <Link href={`/${business.municipality.slug}`} className="hover:underline">
                📍 {business.municipality.name}
              </Link>
            )}
            {hasHours ? <OpenBadge open={status.open} text={status.text} /> : null}
            {business.phone && <span>{business.phone}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
