'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb } from 'lucide-react';
import type { PlannerBlock, Category } from '@/types/planner';
import { DAY_LABELS } from '@/types/planner';

interface SmartSuggestionsProps {
  blocks: PlannerBlock[];
  categories: Category[];
  onScheduleFocus?: () => void;
}

function computeSuggestions(blocks: PlannerBlock[], categories: Category[]): string[] {
  const suggestions: string[] = [];

  const workCatIds = categories
    .filter((c) => ['work', 'study'].includes(c.id) || c.label.toLowerCase().match(/work|study|code/))
    .map((c) => c.id);

  const gymCatIds = categories
    .filter((c) => c.id === 'gym' || c.label.toLowerCase().match(/gym|exercise|sport/))
    .map((c) => c.id);

  for (const day of DAY_LABELS) {
    const dayBlocks = blocks
      .filter((b) => b.day === day)
      .sort((a, b) => a.startTime - b.startTime);

    let consecutiveWork = 0;
    let lastWorkEnd = -1;

    for (const block of dayBlocks) {
      if (workCatIds.includes(block.category)) {
        if (lastWorkEnd === -1 || block.startTime - lastWorkEnd <= 15) {
          consecutiveWork += block.endTime - block.startTime;
        } else {
          consecutiveWork = block.endTime - block.startTime;
        }
        lastWorkEnd = block.endTime;

        if (consecutiveWork >= 120 && consecutiveWork < 125) {
          suggestions.push(`💡 ${day}: Consider a 15-min break after 2h of work — improves focus.`);
        }
        if (consecutiveWork >= 240) {
          suggestions.push(`⚠ ${day}: 4+ hours continuous work detected. Take a proper break!`);
        }
      }
    }
  }

  const gymDays = blocks.filter((b) => gymCatIds.includes(b.category));
  if (gymDays.length === 0 && blocks.length > 5) {
    suggestions.push('🏋 No gym/exercise blocks this week. Try adding at least 2–3 sessions.');
  } else if (gymDays.length === 1) {
    suggestions.push('🏋 Only 1 workout this week — aim for 3 for best results.');
  }

  const sleepCatIds = categories
    .filter((c) => c.id === 'sleep' || c.label.toLowerCase().includes('sleep'))
    .map((c) => c.id);
  const sleepBlocks = blocks.filter((b) => sleepCatIds.includes(b.category));
  if (sleepBlocks.length === 0 && blocks.length > 5) {
    suggestions.push('😴 No sleep blocks scheduled. Add sleep blocks for a realistic week view.');
  } else {
    const avgSleep =
      sleepBlocks.reduce((sum, b) => sum + (b.endTime - b.startTime), 0) / Math.max(sleepBlocks.length, 1);
    if (avgSleep < 420 && sleepBlocks.length > 0) {
      suggestions.push('😴 Average sleep under 7h detected. Consider scheduling more rest.');
    }
  }

  const weekendBlocks = blocks.filter((b) => b.day === 'Sat' || b.day === 'Sun');
  const weekdayBlocks = blocks.filter((b) => !['Sat', 'Sun'].includes(b.day));
  if (weekdayBlocks.length > 10 && weekendBlocks.length === 0) {
    suggestions.push('🌅 No weekend blocks — ensure you plan downtime or personal activities.');
  }

  return suggestions.slice(0, 4);
}

export function SmartSuggestions({ blocks, categories, onScheduleFocus }: SmartSuggestionsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const suggestions = useMemo(
    () => computeSuggestions(blocks, categories),
    [blocks, categories]
  );

  const visible = suggestions.filter((s) => !dismissed.has(s));

  if (visible.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="flex flex-col gap-1.5 px-3 pb-2 overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Lightbulb className="h-3 w-3" />
        <span>Smart Suggestions</span>
      </motion.div>

      <AnimatePresence initial={false}>
        {visible.map((tip, i) => (
          <motion.div
            key={tip}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto', transition: { delay: i * 0.06 } }}
            exit={{ opacity: 0, x: 24, height: 0 }}
            transition={{ duration: 0.22 }}
            className="flex items-start justify-between gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-xs"
          >
            <span className="flex-1 leading-relaxed">{tip}</span>
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => setDismissed((prev) => { const s = new Set(prev); s.add(tip); return s; })}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
            >
              <X className="h-3 w-3" />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>

      {onScheduleFocus && visible.length > 0 && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{ delay: 0.3 }} className="pt-1 flex justify-end">
          <button 
            onClick={onScheduleFocus} 
            className="text-[11px] bg-primary/10 text-primary px-3 py-1.5 rounded-md hover:bg-primary/20 transition-colors flex items-center gap-1.5 font-medium border border-primary/20"
          >
            <Lightbulb className="h-3 w-3" /> Auto-Schedule Focus Block
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
