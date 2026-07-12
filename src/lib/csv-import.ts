/**
 * CSV import for businesses (admin). Pure parse/validate functions so the
 * logic is unit-testable; duplicate detection against existing names happens
 * in the calling action.
 *
 * Expected header (semicolon or comma separated):
 * name;category;municipality;address;postal_code;city;phone;email;website;short_description
 */

export const CSV_COLUMNS = [
  "name",
  "category",
  "municipality",
  "address",
  "postal_code",
  "city",
  "phone",
  "email",
  "website",
  "short_description",
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];
export type CsvRow = Record<CsvColumn, string>;

export interface ParsedCsvRow {
  line: number;
  row: CsvRow;
  errors: string[];
}

export interface CsvParseResult {
  ok: boolean;
  headerError?: string;
  rows: ParsedCsvRow[];
}

/** Splits one CSV line respecting double quotes. */
export function splitCsvLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.map((s) => s.trim());
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/;

export function parseBusinessCsv(text: string): CsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) {
    return { ok: false, headerError: "Filen är tom.", rows: [] };
  }

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const header = splitCsvLine(lines[0], delimiter).map((h) => h.toLowerCase());
  const missing = CSV_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    return {
      ok: false,
      headerError: `Saknade kolumner: ${missing.join(", ")}. Förväntad rubrikrad: ${CSV_COLUMNS.join(";")}`,
      rows: [],
    };
  }
  const index = new Map(header.map((h, i) => [h, i]));

  const rows: ParsedCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i], delimiter);
    const row = Object.fromEntries(
      CSV_COLUMNS.map((c) => [c, values[index.get(c)!] ?? ""]),
    ) as CsvRow;

    const errors: string[] = [];
    if (!row.name || row.name.length < 2) errors.push("Namn saknas");
    if (row.name.length > 150) errors.push("Namnet är för långt");
    if (!row.category) errors.push("Kategori saknas");
    if (!row.municipality) errors.push("Kommun saknas");
    if (row.email && !EMAIL_RE.test(row.email)) errors.push("Ogiltig e-postadress");
    if (row.website && !URL_RE.test(row.website)) errors.push("Webbplats måste börja med http:// eller https://");
    if (row.postal_code && !/^\d{5}$/.test(row.postal_code)) errors.push("Postnummer ska vara 5 siffror");

    rows.push({ line: i + 1, row, errors });
  }

  return { ok: true, rows };
}

/** Normalizes a name for duplicate comparison. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(ab|oy|kb|öb|ltd)\b/g, "")
    .replace(/[^a-zåäö0-9]+/g, " ")
    .trim();
}

/** True when two business names are likely the same company. */
export function isLikelyDuplicate(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}
