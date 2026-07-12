import { describe, it, expect } from "vitest";
import { parseQueryIntent } from "@/lib/synonyms";

describe("parseQueryIntent", () => {
  it("maps 'bilfix' to car repair categories", () => {
    const intent = parseQueryIntent("bilfix");
    expect(intent.categorySlugs).toContain("bilverkstader");
  });

  it("maps 'rörmokare' to VVS", () => {
    const intent = parseQueryIntent("rörmokare");
    expect(intent.categorySlugs).toContain("vvs");
  });

  it("maps 'klippa mig' to hairdressers", () => {
    const intent = parseQueryIntent("klippa mig");
    expect(intent.categorySlugs).toContain("frisorer");
  });

  it("maps 'mat ikväll' to restaurants with open-now intent", () => {
    const intent = parseQueryIntent("mat ikväll");
    expect(intent.categorySlugs).toContain("restauranger");
    expect(intent.openNow).toBe(true);
  });

  it("detects 'öppet nu' intent and strips it from the query", () => {
    const intent = parseQueryIntent("restaurang öppet nu");
    expect(intent.openNow).toBe(true);
    expect(intent.cleanedQuery).not.toContain("öppet");
  });

  it("detects 'nära mig' intent", () => {
    const intent = parseQueryIntent("frisör nära mig");
    expect(intent.nearMe).toBe(true);
  });

  it("extracts municipality from the query", () => {
    const intent = parseQueryIntent("frisör mariehamn");
    expect(intent.municipalityInQuery).toBe("mariehamn");
    expect(intent.cleanedQuery).toBe("frisör");
  });

  it("normalizes municipality aliases without Swedish characters", () => {
    const intent = parseQueryIntent("elektriker finstrom");
    expect(intent.municipalityInQuery).toBe("finström");
  });

  it("strips stop words like 'på Åland'", () => {
    const intent = parseQueryIntent("elektriker på åland");
    expect(intent.cleanedQuery).toBe("elektriker");
  });

  it("returns empty category list for unknown terms", () => {
    const intent = parseQueryIntent("zeppelinare");
    expect(intent.categorySlugs).toHaveLength(0);
    expect(intent.cleanedQuery).toBe("zeppelinare");
  });
});
