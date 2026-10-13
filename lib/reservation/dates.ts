import { isValid, parse } from "date-fns";
import { es } from "date-fns/locale";

export function normalizeReservationDate(date: unknown, dateIso?: unknown): string | null {
  const tryParse = (value: unknown): string | null => {
    if (typeof value !== "string" || !value.trim()) return null;

    const trimmed = value.trim();
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, yearRaw, monthRaw, dayRaw] = isoMatch;
      const year = Number(yearRaw);
      const month = Number(monthRaw);
      const day = Number(dayRaw);
      const localDate = new Date(year, month - 1, day);
      if (
        localDate.getFullYear() === year &&
        localDate.getMonth() === month - 1 &&
        localDate.getDate() === day
      ) {
        return trimmed;
      }
      return null;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return formatLocalIsoDate(parsed);

    const esParsed = parse(trimmed, "EEEE, dd 'de' MMMM 'de' yyyy", new Date(), { locale: es });
    if (isValid(esParsed)) return formatLocalIsoDate(esParsed);

    const enParsed = parse(trimmed, "EEEE, MMMM dd, yyyy", new Date());
    if (isValid(enParsed)) return formatLocalIsoDate(enParsed);

    return null;
  };

  return tryParse(dateIso) ?? tryParse(date);
}

function formatLocalIsoDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function isWeekendIsoDate(date: string): boolean {
  const dateParts = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateParts) return false;

  const [, yearRaw, monthRaw, dayRaw] = dateParts;
  const localDate = new Date(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw));
  const day = localDate.getDay();
  return day === 0 || day === 6;
}
