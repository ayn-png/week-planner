'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWeeklyExtras } from '@/hooks/useWeeklyExtras';
import { DayTodoCard } from './DayTodoCard';
import { GoalsPanel } from './GoalsPanel';
import { NotesPanel } from './NotesPanel';
import type { DayOfWeek, DayTodo, WeeklyExtras, WeeklyGoal } from '@/types/planner';

interface WeeklyDashboardProps {
  weekId: string;
  weekDays: Date[];
}

// Day card configuration matching reference design
const DAY_CARDS: {
  key: DayOfWeek | 'Weekend';
  label: string;
  color: string;
}[] = [
  { key: 'Mon',     label: 'Monday',         color: '#5c5c1a' },
  { key: 'Tue',     label: 'Tuesday',        color: '#1a2d5c' },
  { key: 'Wed',     label: 'Wednesday',      color: '#5c2a0a' },
  { key: 'Thu',     label: 'Thursday',       color: '#1a4a1a' },
  { key: 'Fri',     label: 'Friday',         color: '#3a1a5c' },
  { key: 'Weekend', label: 'Sat & Sunday',   color: '#5c0a0a' },
];

type SaveStatus = 'idle' | 'saving' | 'saved';

export function WeeklyDashboard({ weekId, weekDays }: WeeklyDashboardProps) {
  const { extras, updateTodos, updateGoals, updateNotes } = useWeeklyExtras(weekId);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timers when unmounting
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const triggerSaveIndicator = useCallback(() => {
    setSaveStatus('saving');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

    debounceRef.current = setTimeout(() => {
      setSaveStatus('saved');
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  }, []);

  function handleTodosChange(day: DayOfWeek | 'Weekend', todos: DayTodo[]) {
    updateTodos(day, todos);
    triggerSaveIndicator();
  }

  function handleGoalsChange(goals: WeeklyGoal[]) {
    updateGoals(goals);
    triggerSaveIndicator();
  }

  function handleNotesChange(notes: WeeklyExtras['notes']) {
    updateNotes(notes);
    triggerSaveIndicator();
  }

  return (
    <div className="px-4 py-6 space-y-6 border-t border-border/40 flex-shrink-0">
      {/* Section title */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Weekly Dashboard</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {weekDays[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' – '}
          {weekDays[6]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>

        {/* Save status indicator */}
        {saveStatus !== 'idle' && (
          <span
            className={`text-xs transition-opacity duration-300 ${
              saveStatus === 'saving'
                ? 'text-muted-foreground'
                : 'text-green-600 dark:text-green-400'
            }`}
            aria-live="polite"
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
          </span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Day To-Do Cards Grid */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DAY_CARDS.map(({ key, label, color }) => (
              <DayTodoCard
                key={key}
                dayLabel={label}
                bgColor={color}
                todos={extras.todos[key] ?? []}
                onChange={(todos) => handleTodosChange(key, todos)}
              />
            ))}
          </div>
        </div>

        {/* Right: Goals + Notes */}
        <div className="lg:w-72 flex-shrink-0 space-y-4">
          <GoalsPanel
            goals={extras.goals}
            onChange={handleGoalsChange}
          />
          <NotesPanel
            notes={extras.notes}
            onChange={handleNotesChange}
          />
        </div>
      </div>
    </div>
  );
}
