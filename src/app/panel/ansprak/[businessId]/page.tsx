import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { ClaimForm } from "./claim-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gör anspråk på profil", robots: { index: false } };

export default async function ClaimPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/logga-in`);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { municipality: true, primaryCategory: true },
  });
  if (!business || !business.active) notFound();

  if (business.claimedByUserId) {
    return (
      <div className="max-w-xl">
        <h2 className="text-xl font-bold">Profilen är redan verifierad</h2>
        <p className="mt-2 text-sm text-muted">
          {business.name} har redan en verifierad ägare. Om du anser att detta
          är fel, kontakta oss via <Link href="/om" className="text-primary hover:underline">Om allt.ax</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold">Gör anspråk på {business.name}</h2>
      <p className="mt-1 text-sm text-muted">
        {business.primaryCategory?.name} · {business.municipality?.name}
      </p>
      <p className="mt-3 text-sm">
        Beskriv kort hur du är kopplad till företaget och hur vi kan verifiera
        det (t.ex. e-post från företagets domän eller telefonnumret på
        profilen). Vår administratör granskar anspråket.
      </p>
      <ClaimForm businessId={business.id} />
    </div>
  );
}
