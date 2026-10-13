// lib/availability.ts

import { AvailabilityMap } from "../types/types";
import { DEFAULT_AVAILABILITY } from "@/lib/constants/business";


export function generateAvailability(
  year: number,
  month: number,
  overrides: Partial<AvailabilityMap> = {} 
): AvailabilityMap {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const availability: AvailabilityMap = {};

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    availability[day] = overrides[day] ?? (isWeekend ? DEFAULT_AVAILABILITY.WEEKEND : DEFAULT_AVAILABILITY.WEEKDAY);
  }

  return availability;
}