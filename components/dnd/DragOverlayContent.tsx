'use client';

import type { DragData } from '@/types/planner';
import { minutesToTime } from '@/lib/dateHelpers';

interface DragOverlayContentProps {
  data: DragData;
}

export function DragOverlayContent({ data }: DragOverlayContentProps) {
  if (data.type === 'CATEGORY' && data.category) {
    return (
      <div
        className="flex cursor-grabbing items-center gap-2 rounded-lg border border-border/50 px-3 py-2 text-sm font-medium shadow-xl"
        style={{ backgroundColor: data.category.color + '33', borderLeftColor: data.category.color, borderLeftWidth: 3 }}
      >
        <span
          className="h-3 w-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: data.category.color }}
        />
        {data.category.label}
      </div>
    );
  }

  if (data.type === 'BLOCK' && data.block) {
    const { block } = data;
    const duration = block.endTime - block.startTime;
    return (
      <div
        className="cursor-grabbing rounded-md px-2 py-1 text-xs font-medium shadow-xl"
        style={{
          backgroundColor: block.color + '33',
          borderLeft: `3px solid ${block.color}`,
          minHeight: Math.max(duration, 30),
          width: 120,
        }}
      >
        <div className="font-semibold truncate">{block.title}</div>
        <div className="text-[10px] opacity-70">
          {minutesToTime(block.startTime)} – {minutesToTime(block.endTime)}
        </div>
      </div>
    );
  }

  return null;
}
