"use client";

import React from "react";
import { useCalendarContext } from "@/lib/CalendarContext";
import { useLanguage } from "@/lib/LanguageContext";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/helpers/utils";

type Props = {
  day: number | null;
};

type Status = "loading" | "past" | "soldout" | "last" | "few" | "many";

const STATUS_CARD_CLASS: Record<Status, string> = {
  loading: "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700",
  past: "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700",
  soldout: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700",
  last: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700",
  few: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700",
  many: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700",
};

const STATUS_TEXT_CLASS: Record<Status, string> = {
  loading: "text-zinc-400 dark:text-zinc-500",
  past: "text-zinc-500 dark:text-zinc-400",
  soldout: "text-red-600 dark:text-red-300",
  last: "text-amber-700 dark:text-amber-200",
  few: "text-amber-700 dark:text-amber-200",
  many: "text-emerald-700 dark:text-emerald-200",
};

const STATUS_BAR_CLASS: Record<Status, string> = {
  loading: "bg-zinc-300 dark:bg-zinc-700",
  past: "bg-zinc-400",
  soldout: "bg-red-400",
  last: "bg-amber-500",
  few: "bg-amber-500",
  many: "bg-emerald-500",
};

function CalendarDayBase({ day }: Props) {
  const { lang } = useLanguage();
  const tr = translations[lang].calendar;
  const {
    selectedDay,
    selectDay,
    isPastDay,
    isToday,
    getSlotsForDay,
    maxSlots,
    availabilityLoading,
  } = useCalendarContext();

  if (day === null) {
    return <div className="h-14 rounded-lg sm:h-24 sm:rounded-xl lg:h-[104px] xl:h-28" aria-hidden="true" />;
  }

  const past = isPastDay(day);
  const today = isToday(day);
  const slots = getSlotsForDay(day);

  const hasSlots = slots > 0 && !past && !availabilityLoading;
  const selected = selectedDay === day;

  let status: Status = "soldout";
  if (availabilityLoading) status = "loading";
  else if (past) status = "past";
  else if (slots === 0) status = "soldout";
  else if (slots === 1) status = "last";
  else if (slots <= 5) status = "few";
  else status = "many";

  const labelText =
    status === "loading"
      ? " "
      : status === "past"
      ? tr.statusPast
      : status === "soldout"
        ? tr.statusSoldOut
        : status === "last"
          ? tr.statusLastSpot
          : status === "few"
            ? tr.statusFew
            : tr.statusMany.replace("{slots}", String(slots));

  const compactLabel =
    status === "loading"
      ? " "
      : status === "past"
      ? tr.statusPast
      : status === "soldout"
        ? tr.statusSoldOut
        : status === "last"
          ? tr.statusLastSpot
          : status === "few"
            ? tr.statusFew
            : `${slots} ${tr.legendAvailable}`;

  const capacityRatio =
    maxSlots > 0 && slots > 0 ? Math.min(slots / maxSlots, 1) : 0;

  const handleSelect = () => {
    if (!hasSlots) return;
    selectDay(day);
  };

  const isDisabled = availabilityLoading || !hasSlots;

  return (
    <button
      type="button"
      onClick={handleSelect}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-label={
        past
          ? tr.ariaDayPast.replace("{day}", String(day))
          : hasSlots
            ? tr.ariaDayAvailable
                .replace("{day}", String(day))
                .replace("{slots}", String(slots))
            : tr.ariaDaySoldOut.replace("{day}", String(day))
      }
      aria-pressed={selected}
      className={cn(
        "flex h-14 min-w-0 w-full flex-col overflow-hidden rounded-lg border p-1 text-left shadow-sm outline-none transition duration-150 ease-in-out select-none sm:h-24 sm:rounded-xl sm:p-2.5 lg:h-[104px] lg:p-3 xl:h-28 xl:p-3",
        hasSlots
          ? "cursor-pointer hover:scale-[1.03] hover:shadow-md active:scale-95 sm:hover:scale-105"
          : "cursor-not-allowed opacity-60",
        STATUS_CARD_CLASS[status],
        selected && "ring-2 ring-emerald-500 shadow-md shadow-emerald-900/10"
      )}
    >
      <div className="flex items-start justify-between gap-0.5">
        <span
          className={cn(
            "text-sm font-bold sm:text-xl sm:font-semibold",
            past
              ? "text-zinc-500 dark:text-zinc-400"
              : selected
                ? "text-emerald-800 dark:text-emerald-100"
                : "text-zinc-900 dark:text-zinc-50"
          )}
        >
          {day}
        </span>

        <div className="flex flex-col items-end gap-0.5">
          {today && (
            <span className="rounded-full bg-teal-600/10 px-1 py-[1px] text-[8px] font-bold text-teal-700 dark:text-teal-300 sm:px-2 sm:py-[2px] sm:text-[10px] sm:font-medium">
              {tr.legendToday}
            </span>
          )}
          {selected && (
            <span className="rounded-full bg-emerald-500 px-1 py-[1px] text-[8px] font-black text-white sm:hidden">
              ✓
            </span>
          )}
          {!hasSlots && !past && (
            <span className="rounded-full bg-red-500/10 px-1.5 py-[1px] text-[9px] font-medium text-red-600 dark:text-red-300 sm:px-2 sm:py-[2px] sm:text-[10px]">
              x
            </span>
          )}
        </div>
      </div>

      <div className="hidden flex-1 items-center justify-center sm:flex">
        <span
          className={cn(
            "text-center text-[11px] font-semibold leading-tight sm:text-xs",
            STATUS_TEXT_CLASS[status]
          )}
        >
          {labelText}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center sm:hidden">
        <span
          className={cn(
            "line-clamp-2 text-center text-[9px] font-semibold leading-tight",
            STATUS_TEXT_CLASS[status]
          )}
        >
          {availabilityLoading ? "" : hasSlots ? String(slots) : compactLabel}
        </span>
      </div>

      <div className="mt-0.5 hidden h-1 w-full overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-700/70 sm:mt-1 sm:block">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-200",
            STATUS_BAR_CLASS[status]
          )}
          style={{ width: `${capacityRatio * 100}%` }}
        />
      </div>
    </button>
  );
}

const CalendarDay = React.memo(CalendarDayBase);
export default CalendarDay;
