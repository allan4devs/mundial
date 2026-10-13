export type CostaRicaDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
};

const COSTA_RICA_TIME_ZONE = "America/Costa_Rica";
const MIDDAY_HOUR = 12;

export function getCostaRicaDateParts(referenceDate: Date = new Date()): CostaRicaDateParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: COSTA_RICA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(referenceDate);

  const valueByType = new Map(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(valueByType.get("year") ?? 0),
    month: Number(valueByType.get("month") ?? 1),
    day: Number(valueByType.get("day") ?? 1),
    hour: Number(valueByType.get("hour") ?? 0),
  };
}

export function getMinBookableDateInCostaRica(referenceDate: Date = new Date()): { year: number; month: number; day: number } {
  const { year, month, day, hour } = getCostaRicaDateParts(referenceDate);
  const minDate = new Date(Date.UTC(year, month - 1, day + (hour >= MIDDAY_HOUR ? 1 : 0)));

  return {
    year: minDate.getUTCFullYear(),
    month: minDate.getUTCMonth() + 1,
    day: minDate.getUTCDate(),
  };
}

export function toDateKey(year: number, month: number, day: number): number {
  return year * 10000 + month * 100 + day;
}

export function toIsoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getMinBookableIsoDateInCostaRica(referenceDate: Date = new Date()): string {
  const minDate = getMinBookableDateInCostaRica(referenceDate);
  return toIsoDate(minDate.year, minDate.month, minDate.day);
}

export function isDateOnOrAfterMinBookableInCostaRica(isoDate: string, referenceDate: Date = new Date()): boolean {
  const isoDayMatch = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!isoDayMatch) return false;

  const selectedYear = Number(isoDayMatch[1]);
  const selectedMonth = Number(isoDayMatch[2]);
  const selectedDay = Number(isoDayMatch[3]);

  if (!selectedYear || selectedMonth < 1 || selectedMonth > 12 || selectedDay < 1 || selectedDay > 31) {
    return false;
  }

  const normalizedDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, selectedDay));
  if (
    normalizedDate.getUTCFullYear() !== selectedYear ||
    normalizedDate.getUTCMonth() + 1 !== selectedMonth ||
    normalizedDate.getUTCDate() !== selectedDay
  ) {
    return false;
  }

  const minDate = getMinBookableDateInCostaRica(referenceDate);
  const selectedDateKey = toDateKey(selectedYear, selectedMonth, selectedDay);
  const minDateKey = toDateKey(minDate.year, minDate.month, minDate.day);

  return selectedDateKey >= minDateKey;
}
