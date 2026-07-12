"use client";

import { useActionState, useState } from "react";
import { previewCsvAction, importCsvAction, type CsvPreviewState } from "../actions";

export function ImportForm() {
  const [csv, setCsv] = useState("");
  const [previewState, previewAction, previewPending] = useActionState<CsvPreviewState | undefined, FormData>(
    previewCsvAction,
    undefined,
  );
  const [importState, importAction, importPending] = useActionState<CsvPreviewState | undefined, FormData>(
    importCsvAction,
    undefined,
  );

  const preview = previewState?.preview;

  return (
    <div className="mt-4 space-y-6">
      <form action={previewAction} className="space-y-3">
        <label htmlFor="csv" className="block text-sm font-medium">CSV-data</label>
        <textarea
          id="csv"
          name="csv"
          rows={8}
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={`name;category;municipality;address;postal_code;city;phone;email;website;short_description\nExempel Bygg Ab;bygg-och-renovering;jomala;Byggvägen 1;22150;Jomala;+358 18 12345;info@exempel.ax;;Byggfirma i Jomala`}
          className="w-full rounded-lg border border-border px-3 py-2 font-mono text-xs focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={previewPending || csv.trim().length === 0}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {previewPending ? "Validerar …" : "Förhandsgranska"}
        </button>
        {previewState?.error && (
          <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {previewState.error}
          </div>
        )}
      </form>

      {preview && (
        <div>
          <h3 className="font-semibold">
            Förhandsgranskning – {preview.validCount} av {preview.rows.length} rader kan importeras
          </h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left uppercase text-muted">
                  <th className="py-1 pr-2">Rad</th>
                  <th className="py-1 pr-2">Namn</th>
                  <th className="py-1 pr-2">Kategori</th>
                  <th className="py-1 pr-2">Kommun</th>
                  <th className="py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.line} className="border-b border-border/60">
                    <td className="py-1 pr-2 text-muted">{r.line}</td>
                    <td className="py-1 pr-2 font-medium">{r.row.name}</td>
                    <td className="py-1 pr-2">{r.row.category}</td>
                    <td className="py-1 pr-2">{r.row.municipality}</td>
                    <td className="py-1">
                      {r.errors.length > 0 ? (
                        <span className="text-red-700">{r.errors.join("; ")}</span>
                      ) : r.duplicateOf ? (
                        <span className="text-accent">Möjlig dubblett av: {r.duplicateOf}</span>
                      ) : (
                        <span className="text-success">OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form action={importAction} className="mt-4">
            <input type="hidden" name="csv" value={preview.csvText} />
            <button
              type="submit"
              disabled={importPending || preview.validCount === 0}
              className="rounded-lg bg-success px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {importPending
                ? "Importerar …"
                : `Importera ${preview.validCount} godkända rader (dubbletter och fel hoppas över)`}
            </button>
          </form>
        </div>
      )}

      {importState && (importState.imported !== undefined || importState.error) && (
        <div
          role="status"
          className={`rounded-lg px-4 py-3 text-sm ${
            importState.error ? "bg-red-50 text-red-700" : "bg-success-light text-success"
          }`}
        >
          {importState.error ??
            `Import klar: ${importState.imported} företag importerade, ${importState.skipped} rader hoppades över.`}
        </div>
      )}
    </div>
  );
}
