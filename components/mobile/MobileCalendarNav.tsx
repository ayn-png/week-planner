'use client';

import { ChevronLeft, ChevronRight, Undo2, Redo2, CalendarCheck } from 'lucide-react';
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
  canUndo?: boolean;
  canRedo?: boolean;
  isCurrentWeek?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onToday?: () => void;
}

export function MobileCalendarNav({
  weekDays, visibleDayIndices, canGoBack, canGoForward, isMobile,
  onBack, onForward,
  canUndo, canRedo, isCurrentWeek, onUndo, onRedo, onToday,
}: MobileCalendarNavProps) {
  if (!isMobile) return null;

  const firstDay = weekDays[visibleDayIndices[0]];
  const lastDay = weekDays[visibleDayIndices[visibleDayIndices.length - 1]];

  const label = firstDay && lastDay
    ? `${DAY_LABELS[visibleDayIndices[0]]} ${format(firstDay, 'd')} – ${DAY_LABELS[visibleDayIndices[visibleDayIndices.length - 1]]} ${format(lastDay, 'd')}`
    : '';

  return (
    <div className="flex items-center border-b border-border/30 bg-background/60">
      {/* Day window navigation */}
      <button
        onClick={onBack}
        disabled={!canGoBack}
        className="p-1.5 disabled:opacity-30 hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Previous days"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <span className="flex-1 text-center text-xs font-medium text-muted-foreground">{label}</span>

      <button
        onClick={onForward}
        disabled={!canGoForward}
        className="p-1.5 disabled:opacity-30 hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Next days"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-border/40 mx-0.5" />

      {/* Undo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="p-1.5 disabled:opacity-30 hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground"
        aria-label="Undo"
      >
        <Undo2 className="h-3.5 w-3.5" />
      </button>

      {/* Redo */}
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="p-1.5 disabled:opacity-30 hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground"
        aria-label="Redo"
      >
        <Redo2 className="h-3.5 w-3.5" />
      </button>

      {/* Today */}
      <button
        onClick={onToday}
        disabled={isCurrentWeek}
        className="p-1.5 disabled:opacity-30 hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground"
        aria-label="Go to today"
      >
        <CalendarCheck className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
