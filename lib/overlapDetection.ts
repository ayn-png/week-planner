import type { PlannerBlock, DayOfWeek } from '@/types/planner';

/** Returns true if two blocks overlap in time on the same day */
export function blocksOverlap(a: PlannerBlock, b: PlannerBlock): boolean {
  if (a.day !== b.day) return false;
  // Standard interval overlap: a.start < b.end && b.start < a.end
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

/** Check if a candidate position overlaps any existing block */
export function wouldOverlap(
  candidate: { day: DayOfWeek; startTime: number; endTime: number },
  existingBlocks: PlannerBlock[],
  excludeId?: string
): boolean {
  const mock = {
    ...candidate,
    id: '__candidate__',
    title: '',
    category: '',
    color: '',
    createdAt: 0,
  } as PlannerBlock;

  return existingBlocks
    .filter((b) => b.id !== excludeId)
    .some((b) => blocksOverlap(mock, b));
}
