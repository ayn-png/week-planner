import {
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  addWeeks,
  subWeeks,
  addDays,
  format,
} from 'date-fns';
import type { DayOfWeek } from '@/types/planner';

export const DAY_LABELS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Returns ISO week string: "2026-W13" */
export function getWeekId(date: Date): string {
  const week = getISOWeek(date);
  const year = getISOWeekYear(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Returns the Monday Date for a given weekId */
export function getWeekStart(weekId: string): Date {
  const [yearStr, weekStr] = weekId.split('-W');
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  // Jan 4 is always in ISO week 1
  const jan4 = new Date(year, 0, 4);
  const startOfWeek1 = startOfISOWeek(jan4);
  return addWeeks(startOfWeek1, week - 1);
}

/** Returns array of 7 Date objects Mon–Sun for a weekId */
export function getWeekDays(weekId: string): Date[] {
  const monday = getWeekStart(weekId);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Navigate to next week */
export function getNextWeekId(weekId: string): string {
  const start = getWeekStart(weekId);
  return getWeekId(addWeeks(start, 1));
}

/** Navigate to previous week */
export function getPrevWeekId(weekId: string): string {
  const start = getWeekStart(weekId);
  return getWeekId(subWeeks(start, 1));
}

/** Format a week range for display: "Mar 30 – Apr 5, 2026" */
export function formatWeekRange(weekId: string): string {
  const days = getWeekDays(weekId);
  const start = days[0];
  const end = days[6];
  if (start.getMonth() === end.getMonth()) {
    return `${format(start, 'MMM d')} – ${format(end, 'd, yyyy')}`;
  }
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
  }
  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`;
}

/** Convert minutes-from-midnight to display string "09:00" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/** Convert "09:30" → 570 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Snap minutes value to nearest 15-minute slot */
export function snapToSlot(minutes: number, slotSize = 15): number {
  return Math.round(minutes / slotSize) * slotSize;
}

/** Get current time in minutes from midnight */
export function currentTimeMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

const DAY_INDEX: Record<DayOfWeek, number> = {
  Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6,
};

/**
 * Returns true if the slot (day + endTime minutes) is entirely in the past.
 * Uses the weekDays array so it works for any week, not just the current one.
 */
export function isPastSlot(day: DayOfWeek, endTime: number, weekDays: Date[]): boolean {
  const idx = DAY_INDEX[day];
  if (idx === undefined || !weekDays[idx]) return false;
  const dayDate = new Date(weekDays[idx]);
  dayDate.setHours(Math.floor(endTime / 60), endTime % 60, 0, 0);
  return dayDate.getTime() < Date.now();
}
