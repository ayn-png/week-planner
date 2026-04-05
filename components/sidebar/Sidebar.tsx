'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { usePlannerStore } from '@/store/plannerStore';
import { CategoryList } from './CategoryList';
import type { Category } from '@/types/planner';
import { AddCategoryModal } from './AddCategoryModal';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onCategoryTap?: (category: Category) => void;
}

export function Sidebar({ isOpen = true, onClose, onCategoryTap }: SidebarProps) {
  const { categories, addCategory, removeCategory } = useCategories();
  const { setGoalsOpen } = usePlannerStore();
  const [showModal, setShowModal] = useState(false);

  const content = (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r border-border bg-card">
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Categories
          </h2>
          {/* Close button — mobile only */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="mb-3 text-xs text-muted-foreground">
          <span className="hidden md:block">Drag a category onto the calendar</span>
          <span className="md:hidden">Tap + to add a block at current time</span>
        </p>

        <CategoryList categories={categories} onDelete={removeCategory} onTap={(cat) => onCategoryTap?.(cat)} />

        <Separator className="my-4" />

        <div className="space-y-2">
          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => {
                setGoalsOpen(true);
                if (onClose) onClose();
              }}
            >
              <Target className="w-3.5 h-3.5" /> Goals Dashboard
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setShowModal(true)}
          >
              + Add Category
            </Button>
          </motion.div>
        </div>
      </div>

      <AddCategoryModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onAdd={addCategory}
      />
    </aside>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden md:block h-full">{content}</div>

      {/* Mobile: slide-in drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={onClose}
            />
            {/* Drawer */}
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="fixed left-0 top-0 z-50 h-full md:hidden"
            >
              {content}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
