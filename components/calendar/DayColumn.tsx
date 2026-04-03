'use client';

import { useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import type { PlannerBlock, DayOfWeek } from '@/types/planner';
import { PlannerBlock as PlannerBlockComponent } from '@/components/blocks/PlannerBlock';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { usePlannerStore } from '@/store/plannerStore';

interface DayColumnProps {
  dayIndex: number;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  day: DayOfWeek;
  blocks: PlannerBlock[];
  isToday: boolean;
  onBlockClick: (block: PlannerBlock) => void;
  onBlockCopy: (block: PlannerBlock) => void;
  columnRef: (el: HTMLDivElement | null) => void;
  isMobileVisible?: boolean;
}

export function DayColumn({ dayIndex, blocks, isToday, onBlockClick, onBlockCopy, columnRef, isMobileVisible }: DayColumnProps) {
  const { snapMinutes } = usePlannerStore();

  const { setNodeRef, isOver } = useDroppable({
    id: `day-column-${dayIndex}`,
  });

  function setRefs(el: HTMLDivElement | null) {
    setNodeRef(el);
    columnRef(el);
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const snapLinesPerHour = 60 / snapMinutes - 1;
  const snapOffsets = Array.from({ length: snapLinesPerHour }, (_, i) => (i + 1) * snapMinutes);

  // Conflict detection
  const conflictingIds = new Set<string>();
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i], b = blocks[j];
      if (a.day === b.day && a.startTime < b.endTime && b.startTime < a.endTime) {
        conflictingIds.add(a.id);
        conflictingIds.add(b.id);
      }
    }
  }

  return (
    <div
      ref={setRefs}
      className={`relative border-l border-border/40 transition-colors calendar-day-col ${isMobileVisible ? 'flex-1' : 'flex-1'}`}
      style={{
        height: 1440,
        minWidth: 80,
        backgroundColor: isOver ? 'hsl(var(--primary) / 0.04)' : undefined,
      }}
      data-tour={dayIndex === 0 ? 'calendar-col' : undefined}
    >
      {/* Hour grid lines */}
      {hours.map((h) => (
        <div key={h} className="absolute inset-x-0 border-t border-border/25" style={{ top: h * 60 }} />
      ))}

      {/* Half-hour dashed lines */}
      {hours.map((h) => (
        <div key={`half-${h}`} className="absolute inset-x-0 border-t border-border/10 border-dashed" style={{ top: h * 60 + 30 }} />
      ))}

      {/* Snap grid lines on hover */}
      {isOver && snapMinutes === 15 && hours.map((h) =>
        snapOffsets.filter(o => o !== 30).map((offset) => (
          <div
            key={`snap-${h}-${offset}`}
            className="absolute inset-x-0 border-t border-primary/20"
            style={{ top: h * 60 + offset }}
          />
        ))
      )}

      {/* Today background */}
      {isToday && (
        <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />
      )}

      {/* Drop highlight animation */}
      {isOver && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-sm border border-primary/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Current time indicator */}
      {isToday && <CurrentTimeIndicator />}

      {/* Blocks */}
      {blocks.map((block) => (
        <PlannerBlockComponent
          key={block.id}
          block={block}
          isConflicting={conflictingIds.has(block.id)}
          onClick={onBlockClick}
          onCopy={onBlockCopy}
        />
      ))}
    </div>
  );
}
