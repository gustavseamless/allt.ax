import { describe, it, expect } from "vitest";
import {
  parseBusinessCsv,
  splitCsvLine,
  isLikelyDuplicate,
  normalizeName,
  CSV_COLUMNS,
} from "@/lib/csv-import";

const HEADER = CSV_COLUMNS.join(";");

describe("splitCsvLine", () => {
  it("splits on the delimiter", () => {
    expect(splitCsvLine("a;b;c", ";")).toEqual(["a", "b", "c"]);
  });
  it("respects quoted fields containing the delimiter", () => {
    expect(splitCsvLine('"Bygg; Ab";jomala', ";")).toEqual(["Bygg; Ab", "jomala"]);
  });
  it("unescapes doubled quotes", () => {
    expect(splitCsvLine('"Say ""hi""";x', ";")).toEqual(['Say "hi"', "x"]);
  });
});

describe("parseBusinessCsv", () => {
  it("rejects missing columns", () => {
    const result = parseBusinessCsv("name;category\nFoo;bygg");
    expect(result.ok).toBe(false);
    expect(result.headerError).toContain("Saknade kolumner");
  });

  it("rejects empty input", () => {
    const result = parseBusinessCsv("");
    expect(result.ok).toBe(false);
  });

  it("parses valid rows", () => {
    const csv = `${HEADER}\nTest Bygg Ab;bygg-och-renovering;jomala;Byggvägen 1;22150;Jomala;+358 18 123;info@test.ax;https://test.ax;Byggfirma`;
    const result = parseBusinessCsv(csv);
    expect(result.ok).toBe(true);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].errors).toHaveLength(0);
    expect(result.rows[0].row.name).toBe("Test Bygg Ab");
  });

  it("flags rows with validation errors", () => {
    const csv = `${HEADER}\nX;;;;abc12;;;not-an-email;ftp://x;`;
    const result = parseBusinessCsv(csv);
    expect(result.ok).toBe(true);
    const errors = result.rows[0].errors.join(" ");
    expect(errors).toContain("Namn");
    expect(errors).toContain("Kategori saknas");
    expect(errors).toContain("Kommun saknas");
    expect(errors).toContain("e-post");
    expect(errors).toContain("Postnummer");
    expect(errors).toContain("Webbplats");
  });

  it("supports comma as delimiter", () => {
    const csv = `${CSV_COLUMNS.join(",")}\nTest Ab,bygg,jomala,,,,,,,`;
    const result = parseBusinessCsv(csv);
    expect(result.ok).toBe(true);
    expect(result.rows[0].row.name).toBe("Test Ab");
  });
});

describe("duplicate detection", () => {
  it("normalizes company suffixes", () => {
    expect(normalizeName("El-Karlsson Ab")).toBe(normalizeName("El Karlsson"));
  });
  it("detects exact duplicates regardless of case", () => {
    expect(isLikelyDuplicate("EL-KARLSSON AB", "El-Karlsson Ab")).toBe(true);
  });
  it("detects containment duplicates", () => {
    expect(isLikelyDuplicate("Salong Vågen", "Salong Vågen Mariehamn")).toBe(true);
  });
  it("does not flag unrelated names", () => {
    expect(isLikelyDuplicate("Salong Vågen", "Mariehamns Bilverkstad")).toBe(false);
  });
});
