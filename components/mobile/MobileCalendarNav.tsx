'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { DAY_LABELS } from '@/types/planner';

interface MobileCalendarNavProps {
  weekDays: Date[];
  visibleDayIndices: number[];
  canGoBack: boolean;
  canGoForward: boolean;
  isMobile: boolean;
  onBack: () => void;
  onForward: () => void;
}

export function MobileCalendarNav({
  weekDays, visibleDayIndices, canGoBack, canGoForward, isMobile, onBack, onForward,
}: MobileCalendarNavProps) {
  if (!isMobile) return null;

  const firstDay = weekDays[visibleDayIndices[0]];
  const lastDay = weekDays[visibleDayIndices[visibleDayIndices.length - 1]];

  const label = firstDay && lastDay
    ? `${DAY_LABELS[visibleDayIndices[0]]} ${format(firstDay, 'd')} – ${DAY_LABELS[visibleDayIndices[visibleDayIndices.length - 1]]} ${format(lastDay, 'd')}`
    : '';

  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30 bg-background/60">
      <button
        onClick={onBack}
        disabled={!canGoBack}
        className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Previous days"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <button
        onClick={onForward}
        disabled={!canGoForward}
        className="p-1.5 rounded-lg disabled:opacity-30 hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Next days"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
