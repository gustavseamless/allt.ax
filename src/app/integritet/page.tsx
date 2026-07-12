import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Integritet & cookies",
  description: "Så hanterar allt.ax personuppgifter, analysdata och cookies.",
  alternates: { canonical: "/integritet" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Integritet & cookies</h1>
      <div className="mt-4 space-y-6 text-[15px] leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">Vilka uppgifter samlar vi in?</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Konto:</strong> namn, e-postadress och krypterat lösenord.
              Du kan när som helst radera ditt konto från din panel – då raderas
              även dina anspråk.
            </li>
            <li>
              <strong>Anonym användningsstatistik:</strong> sökningar (sökord,
              vald kommun, antal träffar), profilvisningar, annonsvisningar och
              klick på kontaktknappar. Dessa kopplas till ett slumpmässigt
              sessions-id – inte till din identitet.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Vad vi inte gör</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Vi lagrar inte din exakta plats.</li>
            <li>Vi säljer inte personuppgifter.</li>
            <li>Vi använder inga tredjepartscookies för spårning.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Cookies</h2>
          <p className="mt-2">
            allt.ax använder två nödvändiga cookies: en anonym sessionscookie
            för statistik (<code>ax_sid</code>, 30 dagar) och en
            inloggningscookie för dig som har konto. Inga marknadsförings­cookies
            används.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Kontakt</h2>
          <p className="mt-2">
            Frågor om personuppgifter? Kontakta oss via uppgifterna på sidan{" "}
            <Link href="/om" className="text-primary hover:underline">Om allt.ax</Link>.
          </p>
        </section>
      </div>
    </div>
  );
}
