const TAIPEI_TIME_ZONE = "Asia/Taipei";

export function normalizePhone(value: string): string {
  return value.replace(/[^0-9+]/g, "").replace(/^886/, "0");
}

export function ageOn(birthday: string, now = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return null;
  const [year, month, day] = birthday.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  const today = dateParts(now);
  const currentYear = Number(today.year);
  const currentMonth = Number(today.month);
  const currentDay = Number(today.day);
  if (year > currentYear || (year === currentYear && (month > currentMonth || (month === currentMonth && day > currentDay)))) return null;
  return currentYear - year - (month > currentMonth || (month === currentMonth && day > currentDay) ? 1 : 0);
}

function dateParts(date: Date): Record<string, string> {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TAIPEI_TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date).reduce<Record<string, string>>((parts, part) => {
    if (part.type !== "literal") parts[part.type] = part.value;
    return parts;
  }, {});
}

export function taipeiNow(): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TAIPEI_TIME_ZONE,
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(new Date()).reduce<Record<string, string>>((result, part) => {
    if (part.type !== "literal") result[part.type] = part.value;
    return result;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+08:00`;
}

export function asTaipeiDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10);
  const parts = dateParts(parsed);
  return `${parts.year}-${parts.month}-${parts.day}`;
}