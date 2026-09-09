import type { Calendar, Country } from "../types/preferences";

export function localDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseLocalDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return localDateValue(date) === value ? date : null;
}
export function shiftDay(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + count, 12);
}
export function firstWeekday(country: Country) { return country === "IR" ? 6 : country === "US" || country === "JP" ? 0 : 1; }
export function calendarMonth(anchor: Date, calendar: Calendar) {
  const formatter = new Intl.DateTimeFormat("en", { calendar, numberingSystem: "latn", year: "numeric", month: "numeric", day: "numeric" });
  const parts = formatter.formatToParts(anchor);
  const day = Number(parts.find((part) => part.type === "day")!.value);
  const first = shiftDay(anchor, 1 - day);
  const key = (date: Date) => formatter.formatToParts(date).filter((part) => part.type === "year" || part.type === "month").map((part) => part.value).join("-");
  const monthKey = key(first);
  const days: Date[] = [];
  for (let index = 0; index < 32; index++) {
    const date = shiftDay(first, index);
    if (key(date) !== monthKey) break;
    days.push(date);
  }
  return { first, days, previous: shiftDay(first, -1), next: shiftDay(first, days.length) };
}
