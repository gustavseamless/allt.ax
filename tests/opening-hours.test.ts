import { describe, it, expect } from "vitest";
import {
  isOpenAt,
  isOpenNow,
  openStatusText,
  formatOpeningHours,
  type OpeningHours,
} from "@/lib/opening-hours";

const officeHours: OpeningHours = {
  mon: [["09:00", "17:00"]],
  tue: [["09:00", "17:00"]],
  wed: [],
  thu: [["09:00", "12:00"], ["13:00", "17:00"]],
  fri: [["09:00", "16:00"]],
  sat: [],
  sun: [],
};

describe("isOpenAt", () => {
  it("is open during an interval", () => {
    expect(isOpenAt(officeHours, "mon", 10 * 60)).toBe(true);
  });
  it("is closed before opening", () => {
    expect(isOpenAt(officeHours, "mon", 8 * 60)).toBe(false);
  });
  it("is closed at exactly closing time", () => {
    expect(isOpenAt(officeHours, "mon", 17 * 60)).toBe(false);
  });
  it("is closed on days without hours", () => {
    expect(isOpenAt(officeHours, "wed", 12 * 60)).toBe(false);
    expect(isOpenAt(officeHours, "sun", 12 * 60)).toBe(false);
  });
  it("handles multiple intervals (lunch break)", () => {
    expect(isOpenAt(officeHours, "thu", 12 * 60 + 30)).toBe(false);
    expect(isOpenAt(officeHours, "thu", 14 * 60)).toBe(true);
  });
  it("handles overnight intervals (pub closing at 02:00)", () => {
    const pub: OpeningHours = { fri: [["15:00", "02:00"]] };
    expect(isOpenAt(pub, "fri", 23 * 60)).toBe(true);
    expect(isOpenAt(pub, "fri", 14 * 60)).toBe(false);
  });
  it("returns false for missing hours", () => {
    expect(isOpenAt(null, "mon", 600)).toBe(false);
    expect(isOpenAt({}, "mon", 600)).toBe(false);
  });
});

describe("isOpenNow", () => {
  it("respects the Åland timezone", () => {
    // 2026-07-13 is a Monday. 10:00 in Mariehamn (UTC+3 in summer) = 07:00 UTC.
    const mondayMorning = new Date("2026-07-13T07:00:00Z");
    expect(isOpenNow(officeHours, mondayMorning)).toBe(true);
    // 20:00 local = 17:00 UTC → closed.
    const mondayEvening = new Date("2026-07-13T17:30:00Z");
    expect(isOpenNow(officeHours, mondayEvening)).toBe(false);
  });
});

describe("openStatusText", () => {
  it("says open with closing time", () => {
    const monday = new Date("2026-07-13T07:00:00Z");
    const status = openStatusText(officeHours, monday);
    expect(status.open).toBe(true);
    expect(status.text).toContain("17:00");
  });
  it("says closed with next opening", () => {
    const saturday = new Date("2026-07-18T09:00:00Z");
    const status = openStatusText(officeHours, saturday);
    expect(status.open).toBe(false);
    expect(status.text).toContain("öppnar");
  });
  it("handles missing opening hours", () => {
    expect(openStatusText({}).text).toBe("Öppettider saknas");
  });
});

describe("formatOpeningHours", () => {
  it("formats one row per day in Swedish", () => {
    const rows = formatOpeningHours(officeHours);
    expect(rows).toHaveLength(7);
    expect(rows[0]).toEqual({ day: "Måndag", text: "09:00–17:00" });
    expect(rows[2].text).toBe("Stängt");
    expect(rows[3].text).toBe("09:00–12:00, 13:00–17:00");
  });
});
