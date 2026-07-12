import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import type { OpeningHours, DayKey } from "@/lib/opening-hours";
import { BusinessEditForm, OfferForm, CampaignRequestForm } from "./forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Redigera företag", robots: { index: false } };

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export default async function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/logga-in");

  const business = await prisma.business.findUnique({
    where: { id },
    include: { municipality: true },
  });
  if (!business) notFound();

  const mayEdit =
    user.role === "ADMIN" || user.role === "MODERATOR" || business.claimedByUserId === user.id;
  if (!mayEdit) redirect("/panel");

  const municipalities = await prisma.municipality.findMany({ orderBy: { name: "asc" } });

  const hours = (business.openingHours ?? {}) as OpeningHours;
  const hoursDefaults = Object.fromEntries(
    DAY_KEYS.map((d) => [d, (hours[d] ?? []).map(([o, c]) => `${o}-${c}`).join(", ")]),
  ) as Record<DayKey, string>;

  return (
    <div className="max-w-3xl">
      <Link href="/panel" className="text-sm text-primary hover:underline">
        ← Tillbaka till översikten
      </Link>
      <h2 className="mt-2 text-xl font-bold">Redigera {business.name}</h2>
      <BusinessEditForm
        businessId={business.id}
        defaults={{
          name: business.name,
          shortDescription: business.shortDescription,
          description: business.description,
          address: business.address,
          postalCode: business.postalCode,
          city: business.city,
          municipalityId: business.municipalityId ?? "",
          phone: business.phone,
          email: business.email,
          website: business.website,
          bookingUrl: business.bookingUrl,
          hours: hoursDefaults,
        }}
        municipalities={municipalities.map((m) => ({ id: m.id, name: m.name }))}
      />

      <section id="erbjudanden" className="mt-10 border-t border-border pt-8">
        <h2 className="text-xl font-bold">Skapa erbjudande</h2>
        <p className="mt-1 text-sm text-muted">
          Erbjudandet visas på din profil, på startsidan och under Erbjudanden under den valda perioden.
        </p>
        <OfferForm businessId={business.id} />
      </section>

      <section id="annonsering" className="mt-10 border-t border-border pt-8">
        <h2 className="text-xl font-bold">Begär sponsrad kampanj</h2>
        <p className="mt-1 text-sm text-muted">
          Sponsrade placeringar visas överst i relevanta sökningar och märks
          alltid tydligt med ”Sponsrad”. Vår administratör aktiverar kampanjen
          och återkommer med pris.
        </p>
        <CampaignRequestForm businessId={business.id} />
      </section>
    </div>
  );
}
