'use client';

import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import type { Category, DragData } from '@/types/planner';

interface CategoryCardProps {
  category: Category;
  onDelete?: (id: string) => void;
  onTap?: () => void;
  index?: number;
}

export function CategoryCard({ category, onDelete, onTap, index = 0 }: CategoryCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `category-${category.id}`,
    data: { type: 'CATEGORY', category } satisfies DragData,
  });

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: isDragging ? 0.5 : 1, x: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04, ease: 'easeOut' }}
      whileHover={{ x: 3, scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5 cursor-grab active:cursor-grabbing select-none hover:border-border transition-colors"
      style={{ backgroundColor: category.color + '18' }}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="h-3 w-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: category.color }}
        />
        <span className="text-sm font-medium truncate">{category.label}</span>
      </div>

      {onDelete && !category.isDefault && (
        <button
          className="ml-2 text-muted-foreground hover:text-destructive transition-colors text-xs flex-shrink-0"
          onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Delete category"
        >
          ✕
        </button>
      )}

      {onTap && (
        <button
          className="ml-2 flex md:hidden items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium flex-shrink-0"
          onClick={(e) => { e.stopPropagation(); onTap(); }}
          onPointerDown={(e) => e.stopPropagation()}
          title="Add block at current time"
          aria-label={`Add ${category.label} block at current time`}
        >
          +
        </button>
      )}
    </motion.div>
  );
}
