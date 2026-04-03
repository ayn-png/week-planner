'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { subscribeToWeeklyExtras, saveWeeklyExtras } from '@/lib/firebase/firestore';
import type { WeeklyExtras, DayTodo, WeeklyGoal, DayOfWeek } from '@/types/planner';

function emptyExtras(weekId: string): WeeklyExtras {
  return {
    weekId,
    todos: {},
    goals: [],
    notes: { mantra: '', grateful: '', nightOut: '', reachOut: '' },
  };
}

export function useWeeklyExtras(weekId: string) {
  const { user } = useAuth();
  const [extras, setExtras] = useState<WeeklyExtras>(() => emptyExtras(weekId));
  const saveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    setExtras(emptyExtras(weekId));
  }, [weekId]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToWeeklyExtras(user.uid, weekId, (data) => {
      setExtras(data ?? emptyExtras(weekId));
    });
    return unsub;
  }, [user, weekId]);

  function scheduleSave(data: WeeklyExtras) {
    if (!user) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveWeeklyExtras(user.uid, data).catch(() => {});
    }, 500);
  }

  function updateTodos(day: DayOfWeek | 'Weekend', todos: DayTodo[]) {
    const updated: WeeklyExtras = {
      ...extras,
      todos: { ...extras.todos, [day]: todos },
    };
    setExtras(updated);
    scheduleSave(updated);
  }

  function updateGoals(goals: WeeklyGoal[]) {
    const updated: WeeklyExtras = { ...extras, goals };
    setExtras(updated);
    scheduleSave(updated);
  }

  function updateNotes(notes: WeeklyExtras['notes']) {
    const updated: WeeklyExtras = { ...extras, notes };
    setExtras(updated);
    scheduleSave(updated);
  }

  return { extras, updateTodos, updateGoals, updateNotes };
}
