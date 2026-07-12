import { ImportForm } from "./import-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin – CSV-import", robots: { index: false } };

export default function AdminImportPage() {
  return (
    <div className="max-w-4xl">
      <h2 className="text-lg font-bold">Importera företag via CSV</h2>
      <p className="mt-2 text-sm text-muted">
        Klistra in CSV-data med semikolon eller komma som avgränsare. Första
        raden måste vara rubrikraden. Systemet validerar kolumner, flaggar
        möjliga dubbletter och visar en förhandsgranskning innan importen körs.
      </p>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-surface p-3 text-xs">
        name;category;municipality;address;postal_code;city;phone;email;website;short_description
      </pre>
      <ImportForm />
    </div>
  );
}
