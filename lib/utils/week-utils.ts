/**
 * Week Utilities for Canvas Planning Integration
 */

import { DayOfWeek } from "@/types/task-os";

/**
 * Generate weekId string in format "YYYY-MM-DD_to_YYYY-MM-DD"
 * Week starts on Sunday
 */
export function generateWeekId(date: Date = new Date()): string {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  
  return `${formatDate(weekStart)}_to_${formatDate(weekEnd)}`;
}

/**
 * Get current day of week as DayOfWeek type
 */
export function getCurrentDayOfWeek(): DayOfWeek {
  const days: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return days[new Date().getDay()];
}

/**
 * Get day name from DayOfWeek
 */
export function getDayName(day: DayOfWeek): string {
  const names: Record<DayOfWeek, string> = {
    sun: "Sunday",
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
  };
  return names[day];
}

/**
 * Parse weekId to get start and end dates
 */
export function parseWeekId(weekId: string): { start: Date; end: Date } | null {
  const match = weekId.match(/^(\d{4}-\d{2}-\d{2})_to_(\d{4}-\d{2}-\d{2})$/);
  if (!match) return null;

  return {
    start: new Date(match[1]),
    end: new Date(match[2]),
  };
}

/**
 * Check if a weekId is the current week
 */
export function isCurrentWeek(weekId: string): boolean {
  const currentWeekId = generateWeekId();
  return weekId === currentWeekId;
}
