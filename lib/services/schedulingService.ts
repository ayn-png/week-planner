import { PlannerBlock, DayOfWeek, DAY_LABELS } from '@/types/planner';

/**
 * Finds the earliest continuous block of empty time for a given duration
 */
export function findAvailableSlot(
  blocks: PlannerBlock[],
  durationMinutes: number,
  preferredDays: DayOfWeek[] = [...DAY_LABELS],
  startHour = 9,
  endHour = 18
): { day: DayOfWeek; startTime: number; endTime: number } | null {
  for (const day of preferredDays) {
    const dayBlocks = blocks.filter((b) => b.day === day).sort((a, b) => a.startTime - b.startTime);
    let currentTime = startHour * 60; // Start of workable day in minutes
    
    for (const block of dayBlocks) {
      if (block.startTime - currentTime >= durationMinutes) {
        return { day, startTime: currentTime, endTime: currentTime + durationMinutes };
      }
      currentTime = Math.max(currentTime, block.endTime);
    }
    
    // Check space after the last block of the day
    if (endHour * 60 - currentTime >= durationMinutes) {
      return { day, startTime: currentTime, endTime: currentTime + durationMinutes };
    }

    // Edge case: all blocks start at or after endHour — no usable window on this day
    const allStartAfterEnd = dayBlocks.every((b) => b.startTime >= endHour * 60);
    if (allStartAfterEnd && dayBlocks.length > 0) {
      console.warn(
        `findAvailableSlot: all blocks on ${day} start at or after endHour (${endHour}:00) — no slot available on this day`
      );
    }
  }

  console.warn(
    `findAvailableSlot: could not find a ${durationMinutes}-minute slot across preferred days`
  );
  return null;
}
