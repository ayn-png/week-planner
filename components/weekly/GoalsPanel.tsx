'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import type { WeeklyGoal } from '@/types/planner';

interface GoalsPanelProps {
  goals: WeeklyGoal[];
  onChange: (goals: WeeklyGoal[]) => void;
}

export function GoalsPanel({ goals, onChange }: GoalsPanelProps) {
  const [newText, setNewText] = useState('');

  function addGoal() {
    const text = newText.trim();
    if (!text) return;
    onChange([...goals, { id: uuidv4(), text }]);
    setNewText('');
  }

  function updateGoal(id: string, text: string) {
    onChange(goals.map((g) => (g.id === id ? { ...g, text } : g)));
  }

  function deleteGoal(id: string) {
    onChange(goals.filter((g) => g.id !== id));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') addGoal();
  }

  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-base">🎯</span>
        <h3 className="font-semibold text-sm">Weekly Goal</h3>
      </div>

      {/* Goals list */}
      <ol className="space-y-2 list-none">
        <AnimatePresence initial={false}>
          {goals.map((goal, i) => (
            <motion.li
              key={goal.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-start gap-2 group"
            >
              <span className="text-xs font-semibold text-muted-foreground flex-shrink-0 mt-1.5 w-4 text-right">
                {i + 1}.
              </span>
              <input
                type="text"
                value={goal.text}
                onChange={(e) => updateGoal(goal.id, e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none border-b border-transparent focus:border-border/50 py-0.5 transition-colors leading-snug"
                placeholder="Write your goal…"
              />
              <button
                onClick={() => deleteGoal(goal.id)}
                className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity text-muted-foreground mt-1 flex-shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>

      {goals.length === 0 && (
        <p className="text-xs text-muted-foreground opacity-50 italic">No goals yet — add one below</p>
      )}

      {/* Add goal */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/30">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a new goal…"
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none py-0.5"
        />
        <button
          onClick={addGoal}
          disabled={!newText.trim()}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-30 flex-shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
    </div>
  );
}
