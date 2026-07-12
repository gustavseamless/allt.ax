import type { Metadata } from "next";
import { organizationJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Om allt.ax",
  description: "allt.ax är Ålands lokala sökmotor för företag, tjänster, erbjudanden och evenemang.",
  alternates: { canonical: "/om" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: organizationJsonLd() }}
      />
      <h1 className="text-2xl font-bold">Om allt.ax</h1>
      <div className="mt-4 space-y-4 leading-relaxed">
        <p>
          allt.ax är Ålands lokala sökmotor och startsida för att hitta företag,
          tjänster, restauranger, evenemang och erbjudanden i alla 16 åländska
          kommuner.
        </p>
        <p>
          Alla seriösa åländska företag kan ha en gratis grundprofil. Tjänsten
          finansieras av företag som väljer att betala för utökade profiler och
          tydligt märkt sponsrad synlighet.
        </p>
        <p className="font-medium">Våra principer:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Betalda placeringar märks alltid med ”Sponsrad”.</li>
          <li>Betalning påverkar aldrig den organiska rankingen.</li>
          <li>Vi skapar aldrig falska recensioner eller påhittade betyg.</li>
          <li>Vi samlar bara in de uppgifter som behövs för tjänsten.</li>
        </ul>
        <p className="rounded-lg bg-surface p-4 text-sm text-muted">
          Observera: denna version är en demonstration. Alla företag, kampanjer
          och erbjudanden är fiktiva exempel.
        </p>
      </div>
    </div>
  );
}
