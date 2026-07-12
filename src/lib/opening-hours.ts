/**
 * Opening hours utilities.
 *
 * Opening hours are stored as JSON on Business.openingHours:
 * { "mon": [["09:00","17:00"]], "tue": [...], ..., "sun": [] }
 * An empty array (or missing key) means closed that day.
 * Multiple intervals per day are supported (e.g. lunch + dinner service).
 */

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type OpeningHours = Partial<Record<DayKey, [string, string][]>>;

export const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const DAY_LABELS: Record<DayKey, string> = {
  mon: "Måndag",
  tue: "Tisdag",
  wed: "Onsdag",
  thu: "Torsdag",
  fri: "Fredag",
  sat: "Lördag",
  sun: "Söndag",
};

/** Timezone for Åland. */
export const TIMEZONE = "Europe/Mariehamn";

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Returns current day key and minutes-since-midnight in Åland's timezone. */
export function nowInMariehamn(now: Date = new Date()): { day: DayKey; minutes: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")!.value.toLowerCase();
  const hour = Number(parts.find((p) => p.type === "hour")!.value) % 24;
  const minute = Number(parts.find((p) => p.type === "minute")!.value);
  const map: Record<string, DayKey> = {
    mon: "mon", tue: "tue", wed: "wed", thu: "thu", fri: "fri", sat: "sat", sun: "sun",
  };
  return { day: map[weekday], minutes: hour * 60 + minute };
}

export function isOpenAt(hours: OpeningHours | null | undefined, day: DayKey, minutes: number): boolean {
  if (!hours) return false;
  const intervals = hours[day];
  if (!intervals || intervals.length === 0) return false;
  return intervals.some(([open, close]) => {
    const o = toMinutes(open);
    const c = toMinutes(close);
    if (c <= o) {
      // Overnight interval, e.g. 22:00–02:00: open from `o` until midnight.
      // (The after-midnight portion belongs to the next day and is not
      // modelled in MVP – acceptable simplification.)
      return minutes >= o;
    }
    return minutes >= o && minutes < c;
  });
}

export function isOpenNow(hours: OpeningHours | null | undefined, now: Date = new Date()): boolean {
  const { day, minutes } = nowInMariehamn(now);
  return isOpenAt(hours, day, minutes);
}

/** Returns e.g. "Öppet nu · stänger 17:00" or "Stängt · öppnar mån 09:00". */
export function openStatusText(hours: OpeningHours | null | undefined, now: Date = new Date()): {
  open: boolean;
  text: string;
} {
  if (!hours || Object.keys(hours).length === 0) {
    return { open: false, text: "Öppettider saknas" };
  }
  const { day, minutes } = nowInMariehamn(now);
  const intervals = hours[day] ?? [];
  for (const [open, close] of intervals) {
    const o = toMinutes(open);
    const c = toMinutes(close);
    if (minutes >= o && (minutes < c || c <= o)) {
      return { open: true, text: `Öppet nu · stänger ${close}` };
    }
    if (minutes < o) {
      return { open: false, text: `Stängt · öppnar ${open} idag` };
    }
  }
  // Find the next day with opening hours.
  const startIdx = DAY_KEYS.indexOf(day);
  for (let i = 1; i <= 7; i++) {
    const nextDay = DAY_KEYS[(startIdx + i) % 7];
    const next = hours[nextDay];
    if (next && next.length > 0) {
      const label = DAY_LABELS[nextDay].slice(0, 3).toLowerCase();
      return { open: false, text: `Stängt · öppnar ${label} ${next[0][0]}` };
    }
  }
  return { open: false, text: "Stängt" };
}

/** Formats hours for display, one row per day. */
export function formatOpeningHours(hours: OpeningHours | null | undefined): { day: string; text: string }[] {
  if (!hours) return [];
  return DAY_KEYS.map((key) => {
    const intervals = hours[key];
    return {
      day: DAY_LABELS[key],
      text:
        !intervals || intervals.length === 0
          ? "Stängt"
          : intervals.map(([o, c]) => `${o}–${c}`).join(", "),
    };
  });
}
