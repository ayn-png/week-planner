'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import type { PlannerBlock as PlannerBlockType, DragData } from '@/types/planner';
import { minutesToTime } from '@/lib/dateHelpers';
import { usePlannerStore } from '@/store/plannerStore';
import { usePlannerContext } from '@/context/PlannerContext';
import { CheckCircle2, Circle } from 'lucide-react';
import { currentTimeMinutes } from '@/lib/dateHelpers';
import { ResizeHandle } from './ResizeHandle';
import { toast } from 'sonner';

interface PlannerBlockProps {
  block: PlannerBlockType;
  isConflicting?: boolean;
  onClick: (block: PlannerBlockType) => void;
  onCopy: (block: PlannerBlockType) => void;
}

export function PlannerBlock({ block, isConflicting = false, onClick, onCopy }: PlannerBlockProps) {
  const { focusMode, setClipboard } = usePlannerStore();
  const { dispatch } = usePlannerContext();
  const duration = block.endTime - block.startTime;
  const now = currentTimeMinutes();
  const isCurrentBlock = block.startTime <= now && now < block.endTime;
  const isFocusBlurred = focusMode && !isCurrentBlock;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    data: { type: 'BLOCK', block } satisfies DragData,
  });

  const style = {
    position: 'absolute' as const,
    top: block.startTime,
    height: Math.max(duration, 30),
    left: 3,
    right: 3,
    zIndex: isDragging ? 0 : isCurrentBlock ? 20 : 10,
    transform: CSS.Translate.toString(transform),
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scaleY: 0.8 }}
      animate={{
        opacity: isDragging ? 0 : isFocusBlurred ? 0.25 : 1,
        scaleY: 1,
        filter: isFocusBlurred ? 'blur(1px)' : 'none',
      }}
      exit={{ opacity: 0, scaleY: 0.8 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      whileHover={!isFocusBlurred ? { scale: 1.01 } : {}}
      layout
      tabIndex={0}
      role="button"
      className="rounded-md overflow-visible cursor-grab active:cursor-grabbing group select-none"
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        if (!isFocusBlurred) onClick(block);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onCopy(block);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!isFocusBlurred) onClick(block);
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          e.preventDefault();
          setClipboard(block);
          toast.success('Block copied');
        }
      }}
    >
      {/* Main block body */}
      <div
        className="h-full rounded-md overflow-hidden flex flex-col"
        style={{
          backgroundColor: block.color + (isCurrentBlock ? '33' : '1a'),
          borderLeft: `3px solid ${block.color}`,
          outline: isConflicting ? `2px solid #ef4444` : isCurrentBlock ? `1px solid ${block.color}66` : 'none',
          boxShadow: isCurrentBlock ? `0 0 0 1px ${block.color}44` : undefined,
        }}
      >
        <div className="px-2 py-1 flex flex-col gap-0.5 overflow-hidden flex-1">
          {/* Focus mode badge */}
          {focusMode && isCurrentBlock && (
            <span
              className="text-[9px] font-bold uppercase tracking-wider mb-0.5"
              style={{ color: block.color }}
            >
              ▶ NOW
            </span>
          )}
          <span
            className={`text-[11px] font-semibold leading-tight truncate flex items-center gap-1 ${block.status === 'done' ? 'line-through opacity-60' : ''}`}
            style={{ color: block.color }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({
                  type: 'UPDATE_BLOCK',
                  block: { ...block, status: block.status === 'done' ? 'todo' : 'done' },
                });
              }}
              className="hover:opacity-80 transition-opacity focus:outline-none"
            >
              {block.status === 'done' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <Circle className="w-3.5 h-3.5" />
              )}
            </button>
            {block.title}
            {block.isFocus && <span className="flex-shrink-0" title="Focus Block">🎯</span>}
            {block.energyLevel === 'High' && <span className="flex-shrink-0" title="High Energy">⚡</span>}
            {block.energyLevel === 'Medium' && <span className="flex-shrink-0" title="Medium Energy">🔋</span>}
            {block.energyLevel === 'Low' && <span className="flex-shrink-0" title="Low Energy">🪫</span>}
          </span>
          {duration >= 30 && (
            <span className="text-[10px] text-muted-foreground leading-tight">
              {minutesToTime(block.startTime)} – {minutesToTime(block.endTime)}
            </span>
          )}
          {block.notes && duration >= 48 && (
            <span className="text-[10px] opacity-60 leading-tight truncate overflow-hidden whitespace-nowrap">
              {block.notes}
            </span>
          )}
        </div>

        {/* Copy hint on hover */}
        {duration >= 45 && (
          <div className="hidden group-hover:flex items-center justify-end px-1.5 pb-0.5">
            <span className="text-[9px] text-muted-foreground opacity-60">Ctrl+C copy</span>
          </div>
        )}
      </div>

      {/* Resize handle at bottom — only show when not blurred */}
      {!isFocusBlurred && <ResizeHandle blockId={block.id} block={block} />}
    </motion.div>
  );
}
