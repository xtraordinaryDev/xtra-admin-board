/** All dates are handled as YYYY-MM-DD strings in the business's timezone. */

export const TZ = "America/Chicago";

export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** Monday of the week containing `iso`. */
export function mondayOf(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  const back = dow === 0 ? 6 : dow - 1;
  return addDays(iso, -back);
}

export function weekDays(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function dayLabel(iso: string, style: "short" | "long" = "short"): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: style === "short" ? "short" : "long",
    month: "short",
    day: "numeric",
  }).format(dt);
}

export function weekLabel(monday: string): string {
  const [y, m, d] = monday.split("-").map(Number);
  const a = new Date(Date.UTC(y, m - 1, d, 12));
  const b = new Date(Date.UTC(y, m - 1, d + 6, 12));
  const f = (dt: Date) =>
    new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric" }).format(dt);
  return `${f(a)} to ${f(b)}`;
}
