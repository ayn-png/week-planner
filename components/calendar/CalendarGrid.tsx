'use client';

import { format, isToday } from 'date-fns';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TimeGutter } from './TimeGutter';
import { DayColumn } from './DayColumn';
import { CalendarSkeleton } from './CalendarSkeleton';
import type { PlannerBlock, DayOfWeek } from '@/types/planner';
import { DAY_LABELS } from '@/types/planner';
import { usePlannerStore } from '@/store/plannerStore';

interface CalendarGridProps {
  weekDays: Date[];
  blocks: PlannerBlock[];
  onBlockClick: (block: PlannerBlock) => void;
  onBlockCopy: (block: PlannerBlock) => void;
  dayColumnRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  visibleDayIndices?: number[];
}

const headerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};
const headerItemVariants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export function CalendarGrid({
  weekDays, blocks, onBlockClick, onBlockCopy, dayColumnRefs,
  visibleDayIndices,
}: CalendarGridProps) {
  const { blocksLoading } = usePlannerStore();

  const visibleDays = visibleDayIndices
    ? weekDays.filter((_, i) => visibleDayIndices.includes(i))
    : weekDays;
  const visibleIndices = visibleDayIndices ?? weekDays.map((_, i) => i);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Day header row */}
      <motion.div
        className="flex flex-shrink-0 border-b border-border bg-card/80 backdrop-blur-sm"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
        key={weekDays[0]?.toISOString()}
      >
        <div className="w-14 flex-shrink-0" />
        {visibleDays.map((date, idx) => {
          const day = DAY_LABELS[visibleIndices[idx]];
          const today = isToday(date);
          return (
            <motion.div
              key={day}
              variants={headerItemVariants}
              className="flex flex-1 flex-col items-center justify-center py-2 border-l border-border/40 min-w-[60px]"
            >
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                {format(date, 'EEE')}
              </span>
              <span
                className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  today
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {format(date, 'd')}
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Scrollable grid body */}
      <ScrollArea className="flex-1">
        {blocksLoading ? (
          <CalendarSkeleton />
        ) : (
          <div className="flex min-w-full calendar-body" style={{ height: 1440 }}>
            <TimeGutter />
            {visibleDays.map((date, idx) => {
              const dayIndex = visibleIndices[idx];
              const day = DAY_LABELS[dayIndex];
              const dayBlocks = blocks.filter((b) => b.day === day);
              return (
                <DayColumn
                  key={day}
                  dayIndex={dayIndex}
                  day={day as DayOfWeek}
                  blocks={dayBlocks}
                  isToday={isToday(date)}
                  onBlockClick={onBlockClick}
                  onBlockCopy={onBlockCopy}
                  columnRef={(el) => { dayColumnRefs.current[dayIndex] = el; }}
                  isMobileVisible={visibleDayIndices !== undefined}
                />
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
