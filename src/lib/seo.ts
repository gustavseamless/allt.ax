import type { Business, Category, Municipality, Event } from "@prisma/client";
import { DAY_KEYS, type OpeningHours } from "@/lib/opening-hours";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type BusinessForJsonLd = Business & {
  primaryCategory: Category | null;
  municipality: Municipality | null;
};

const SCHEMA_DAY: Record<string, string> = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday",
};

/** Maps our category slugs to more specific schema.org types when available. */
function schemaTypeFor(business: BusinessForJsonLd): string {
  switch (business.primaryCategory?.slug) {
    case "restauranger":
      return "Restaurant";
    case "cafeer":
      return "CafeOrCoffeeShop";
    case "barer":
      return "BarOrPub";
    case "hotell-och-boende":
      return "LodgingBusiness";
    case "frisorer":
      return "HairSalon";
    case "bilverkstader":
    case "dack-och-bilservice":
      return "AutoRepair";
    case "elektriker":
      return "Electrician";
    case "vvs":
      return "Plumber";
    default:
      return "LocalBusiness";
  }
}

export function businessJsonLd(business: BusinessForJsonLd): string {
  const hours = (business.openingHours ?? {}) as OpeningHours;
  const openingHoursSpecification = DAY_KEYS.flatMap((day) =>
    (hours[day] ?? []).map(([opens, closes]) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SCHEMA_DAY[day],
      opens,
      closes,
    })),
  );

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaTypeFor(business),
    name: business.name,
    description: business.shortDescription || business.description || undefined,
    url: `${SITE_URL}/foretag/${business.slug}`,
    telephone: business.phone || undefined,
    email: business.email || undefined,
    address: business.address
      ? {
          "@type": "PostalAddress",
          streetAddress: business.address,
          postalCode: business.postalCode || undefined,
          addressLocality: business.city || business.municipality?.name,
          addressRegion: "Åland",
          addressCountry: "AX",
        }
      : undefined,
    geo:
      business.latitude !== null && business.longitude !== null
        ? { "@type": "GeoCoordinates", latitude: business.latitude, longitude: business.longitude }
        : undefined,
    openingHoursSpecification:
      openingHoursSpecification.length > 0 ? openingHoursSpecification : undefined,
    sameAs: Object.values((business.socialLinks ?? {}) as Record<string, string>),
  };

  return JSON.stringify(data);
}

export function eventJsonLd(event: Event, businessName?: string): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description || undefined,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    location: {
      "@type": "Place",
      name: event.location || "Åland",
      address: { "@type": "PostalAddress", addressRegion: "Åland", addressCountry: "AX" },
    },
    organizer: businessName ? { "@type": "Organization", name: businessName } : undefined,
    url: `${SITE_URL}/evenemang/${event.slug}`,
  });
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  });
}

export function organizationJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "allt.ax",
    url: SITE_URL,
    description: "Ålands lokala sökmotor för företag, tjänster, erbjudanden och evenemang.",
  });
}
