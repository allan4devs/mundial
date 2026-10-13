"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { AvailabilityMap } from "@/lib/types/index";
import { useLanguage } from "@/lib/LanguageContext";
import { getCostaRicaDateParts, getMinBookableDateInCostaRica, toDateKey } from "@/lib/helpers/costa-rica-time";

type CalendarContextValue = {
  currentYear: number;
  currentMonth: number;
  monthLabel: string;
  availability: AvailabilityMap;
  availabilityLoading: boolean;
  availabilityError: string | null;
  refreshAvailability: () => void;
  selectedDay: number | null;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  tickets: number;
  setTickets: (count: number) => void;
  maxSlots: number;
  isPastDay: (day: number) => boolean;
  isToday: (day: number) => boolean;
  getSlotsForDay: (day: number) => number;
  selectDay: (day: number | null) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  goToToday: () => void;
  goToNextAvailableDay: () => void;
};

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function useCalendarContext() {
  const ctx = useContext(CalendarContext);
  if (!ctx) {
    throw new Error("useCalendarContext must be used within CalendarProvider");
  }
  return ctx;
}

type Props = {
  children: ReactNode;
  selectedTourSlug?: string | null;
  initialTickets?: number;
  initialDateIso?: string | null;
};

export function CalendarProvider({
  children,
  selectedTourSlug,
  initialTickets = 1,
  initialDateIso = null,
}: Props) {
  const { lang } = useLanguage();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const minBookable = getMinBookableDateInCostaRica();
    return minBookable.month - 1;
  });
  const [currentYear, setCurrentYear] = useState(() => {
    const minBookable = getMinBookableDateInCostaRica();
    return minBookable.year;
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [tickets, setTicketsState] = useState<number>(Math.max(1, initialTickets));
  const [availabilityOverrides, setAvailabilityOverrides] = useState<Partial<AvailabilityMap> | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [availabilityRequest, setAvailabilityRequest] = useState(0);

  const refreshAvailability = useCallback(() => {
    setAvailabilityRequest((request) => request + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAvailability = async () => {
      setAvailabilityOverrides(null);
      setAvailabilityLoading(true);
      setAvailabilityError(null);

      try {
        const params = new URLSearchParams({
          year: String(currentYear),
          month: String(currentMonth),
        });

        if (selectedTourSlug) {
          params.set("tourSlug", selectedTourSlug);
        }

        const res = await fetch(`/api/calendar/availability?${params.toString()}`);
        if (!res.ok) throw new Error(`Availability request failed with ${res.status}`);

        const data = (await res.json()) as { availability?: AvailabilityMap };
        if (!cancelled) {
          if (!data.availability || typeof data.availability !== "object") {
            throw new Error("Availability response is invalid");
          }
          setAvailabilityOverrides(data.availability);
        }
      } catch (error) {
        console.error("Failed to load calendar availability:", error);
        if (!cancelled) {
          setAvailabilityOverrides(null);
          setAvailabilityError(
            lang === "es"
              ? "No pudimos confirmar los cupos. Intentá de nuevo."
              : "We couldn't confirm availability. Please try again.",
          );
        }
      } finally {
        if (!cancelled) setAvailabilityLoading(false);
      }
    };

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [availabilityRequest, currentMonth, currentYear, lang, selectedTourSlug]);

  const availability: AvailabilityMap = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    return Object.fromEntries(
      Array.from({ length: daysInMonth }, (_, index) => {
        const day = index + 1;
        const value = availabilityOverrides?.[day];
        return [day, typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0];
      }),
    ) as AvailabilityMap;
  }, [availabilityOverrides, currentMonth, currentYear]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-US", {
        month: "long",
      }).format(
        new Date(currentYear, currentMonth, 1)
      ),
    [currentYear, currentMonth, lang]
  );

  const maxSlots = useMemo(() => Math.max(0, ...Object.values(availability)), [availability]);

  const costaRicaToday = useMemo(() => getCostaRicaDateParts(), []);
  const minBookableDate = useMemo(() => getMinBookableDateInCostaRica(), []);
  const costaRicaTodayKey = useMemo(
    () => toDateKey(costaRicaToday.year, costaRicaToday.month, costaRicaToday.day),
    [costaRicaToday.day, costaRicaToday.month, costaRicaToday.year]
  );
  const minBookableDateKey = useMemo(
    () => toDateKey(minBookableDate.year, minBookableDate.month, minBookableDate.day),
    [minBookableDate.day, minBookableDate.month, minBookableDate.year]
  );

  const isPastDay = useCallback(
    (day: number) => {
      const dateKey = toDateKey(currentYear, currentMonth + 1, day);
      return dateKey < minBookableDateKey;
    },
    [currentMonth, currentYear, minBookableDateKey]
  );

  const isToday = useCallback(
    (day: number) => {
      const dateKey = toDateKey(currentYear, currentMonth + 1, day);
      return dateKey === costaRicaTodayKey;
    },
    [currentMonth, currentYear, costaRicaTodayKey]
  );

  const getSlotsForDay = useCallback((day: number) => availability[day] ?? 0, [availability]);

  const selectedDate = useMemo(
    () =>
      selectedDay != null
        ? new Date(currentYear, currentMonth, selectedDay)
        : null,
    [selectedDay, currentMonth, currentYear]
  );

  const selectDay = useCallback((day: number | null) => {
    setSelectedDay(day);
  }, []);

  const setSelectedDate = useCallback((date: Date | null) => {
    if (!date) {
      selectDay(null);
      return;
    }

    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const selectedDateKey = toDateKey(
      normalizedDate.getFullYear(),
      normalizedDate.getMonth() + 1,
      normalizedDate.getDate()
    );
    if (selectedDateKey < minBookableDateKey) {
      selectDay(null);
      return;
    }

    if (normalizedDate.getFullYear() !== currentYear || normalizedDate.getMonth() !== currentMonth) {
      setCurrentYear(normalizedDate.getFullYear());
      setCurrentMonth(normalizedDate.getMonth());
    }

    selectDay(normalizedDate.getDate());
  }, [currentYear, currentMonth, minBookableDateKey, selectDay]);

  const setTickets = useCallback((count: number) => {
    setTicketsState(Math.max(1, count));
  }, []);

  useEffect(() => {
    if (availabilityLoading || availabilityError || selectedDay == null) return;

    const remaining = availability[selectedDay] ?? 0;
    if (remaining < 1) {
      setSelectedDay(null);
      setTicketsState(1);
      return;
    }

    setTicketsState((current) => Math.min(current, remaining));
  }, [availability, availabilityError, availabilityLoading, selectedDay]);

  const changeMonth = useCallback(
    (delta: number) => {
      const d = new Date(currentYear, currentMonth + delta, 1);
      d.setHours(0, 0, 0, 0);
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
      setSelectedDay(null);
    },
    [currentMonth, currentYear]
  );

  const nextMonth = useCallback(() => changeMonth(1), [changeMonth]);
  const prevMonth = useCallback(() => changeMonth(-1), [changeMonth]);

  const findFirstAvailableDay = useCallback(() => {
    return Object.keys(availability)
      .map(Number)
      .filter((d) => availability[d] > 0 && !isPastDay(d))
      .sort((a, b) => a - b)[0] ?? null;
  }, [availability, isPastDay]);

  const goToToday = useCallback(() => {
    setCurrentMonth(minBookableDate.month - 1);
    setCurrentYear(minBookableDate.year);
    const day = minBookableDate.day;
    const slots = availability[day] ?? 0;
    setSelectedDay(slots > 0 ? day : null);
  }, [availability, minBookableDate.day, minBookableDate.month, minBookableDate.year]);

  const goToNextAvailableDay = useCallback(() => {
    const nextDay = findFirstAvailableDay();
    if (nextDay != null) setSelectedDay(nextDay);
  }, [findFirstAvailableDay]);

  const appliedInitialDateRef = useRef<string | null>(null);

  useEffect(() => {
    if (!initialDateIso) return;
    const normalizedInitialDate = initialDateIso.trim();
    if (appliedInitialDateRef.current === normalizedInitialDate) return;
    const match = normalizedInitialDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return;

    const [, yearRaw, monthRaw, dayRaw] = match;
    const date = new Date(Number(yearRaw), Number(monthRaw) - 1, Number(dayRaw));
    date.setHours(0, 0, 0, 0);
    appliedInitialDateRef.current = normalizedInitialDate;
    setSelectedDate(date);
  }, [initialDateIso, setSelectedDate]);

  const value: CalendarContextValue = {
    currentYear,
    currentMonth,
    monthLabel,
    availability,
    availabilityLoading,
    availabilityError,
    refreshAvailability,
    selectedDay,
    selectedDate,
    setSelectedDate,
    tickets,
    setTickets,
    maxSlots,
    isPastDay,
    isToday,
    getSlotsForDay,
    selectDay,
    nextMonth,
    prevMonth,
    goToToday,
    goToNextAvailableDay,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}
