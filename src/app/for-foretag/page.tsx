import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "För företag – synas på allt.ax",
  description:
    "Gratis grundprofil för alla åländska företag. Premiumprofil och sponsrad synlighet för dig som vill nå fler kunder.",
  alternates: { canonical: "/for-foretag" },
};

const TIERS = [
  {
    name: "Grundprofil",
    price: "Gratis",
    features: [
      "Företagsnamn, kategori och kontaktuppgifter",
      "Adress och karta",
      "Kort beskrivning",
      "Syns i sökresultat och kategorier",
      "Gör anspråk och uppdatera själv",
    ],
  },
  {
    name: "Premiumprofil",
    price: "Kontakta oss",
    features: [
      "Allt i Grundprofil",
      "Logotyp, bilder och längre beskrivning",
      "Öppettider med ”Öppet nu”",
      "Tjänster, prislista och bokningslänk",
      "Erbjudanden och evenemang",
      "Statistik över visningar och klick",
    ],
  },
  {
    name: "Sponsrad synlighet",
    price: "Kampanjbaserat",
    features: [
      "Tydligt märkt plats överst i relevanta sökningar",
      "Rikta mot sökord, kategori eller kommun",
      "Tidsbegränsade kampanjer",
      "Full statistik: visningar, klick och CTR",
      "Påverkar aldrig den organiska rankingen",
    ],
  },
];

export default function ForBusinessPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-semibold text-ink">Syns där ålänningarna söker</h1>
      <p className="mt-3 max-w-2xl text-muted">
        allt.ax är Ålands lokala sökmotor. När någon söker efter det du erbjuder
        ska de hitta dig – med rätt uppgifter, öppettider och erbjudanden.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {TIERS.map((tier) => (
          <div key={tier.name} className="rounded-2xl border border-border bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-ink">{tier.name}</h2>
            <div className="mt-1 text-2xl font-bold text-primary">{tier.price}</div>
            <ul className="mt-4 space-y-2 text-sm">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-success">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl bg-primary-light/60 p-6 sm:p-8">
        <h2 className="text-xl font-bold">Kom igång på fem minuter</h2>
        <ol className="mt-3 max-w-2xl list-decimal space-y-2 pl-5 text-sm">
          <li>
            <Link href="/registrera" className="font-medium text-primary hover:underline">
              Skapa ett gratis konto
            </Link>
            .
          </li>
          <li>Sök upp ditt företag och klicka på ”Gör anspråk på denna profil” – eller skapa en ny profil.</li>
          <li>Vi granskar anspråket. Därefter kan du uppdatera uppgifter, skapa erbjudanden och se statistik.</li>
        </ol>
        <p className="mt-4 text-sm text-muted">
          Alla betalda placeringar märks alltid tydligt med ”Sponsrad”. Betald
          synlighet påverkar aldrig hur företag rankas i de organiska sökresultaten.
        </p>
        <Link
          href="/registrera"
          className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Skapa konto
        </Link>
      </div>
    </div>
  );
}
