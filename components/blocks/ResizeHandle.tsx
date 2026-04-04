'use client';

import { useDraggable } from '@dnd-kit/core';
import type { PlannerBlock, DragData } from '@/types/planner';

interface ResizeHandleProps {
  blockId: string;
  block: PlannerBlock;
}

export function ResizeHandle({ blockId, block }: ResizeHandleProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `resize-${blockId}`,
    data: { type: 'RESIZE', block } satisfies DragData,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="separator"
      aria-label="Resize block"
      className="absolute bottom-0 inset-x-0 h-3 cursor-ns-resize flex items-center justify-center group/resize z-30"
      style={{ touchAction: 'none' }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Visual indicator */}
      <div
        className={`h-1 w-6 rounded-full transition-all duration-150 ${
          isDragging
            ? 'bg-white/70 w-10'
            : 'bg-white/20 group-hover/resize:bg-white/50 group-hover/resize:w-8'
        }`}
      />
    </div>
  );
}
