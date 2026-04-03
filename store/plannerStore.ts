'use client';

import { create } from 'zustand';
import type { PlannerBlock } from '@/types/planner';
import type { Goal, TaskGoalMapping } from '@/types/deepwork';

const MAX_HISTORY = 50;

interface PlannerStore {
  // ─── Undo / Redo ───────────────────────────────────────────────────────────
  history: PlannerBlock[][];
  historyIndex: number;
  pushHistory: (blocks: PlannerBlock[]) => void;
  undo: () => PlannerBlock[] | null;
  redo: () => PlannerBlock[] | null;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // ─── Clipboard ─────────────────────────────────────────────────────────────
  clipboard: PlannerBlock | null;
  setClipboard: (block: PlannerBlock) => void;
  clearClipboard: () => void;

  // ─── Focus Mode ────────────────────────────────────────────────────────────
  focusMode: boolean;
  toggleFocusMode: () => void;
  setFocusMode: (value: boolean) => void;

  // ─── Snap Grid ─────────────────────────────────────────────────────────────
  snapMinutes: 15 | 30;
  setSnapMinutes: (snap: 15 | 30) => void;

  // ─── AI Generator ──────────────────────────────────────────────────────────
  aiGeneratorOpen: boolean;
  setAiGeneratorOpen: (open: boolean) => void;

  // ─── Analytics ─────────────────────────────────────────────────────────────
  analyticsOpen: boolean;
  setAnalyticsOpen: (open: boolean) => void;

  // ─── Loading ───────────────────────────────────────────────────────────────
  blocksLoading: boolean;
  setBlocksLoading: (loading: boolean) => void;

  // ─── Onboarding ────────────────────────────────────────────────────────────
  onboardingStep: number | null;
  setOnboardingStep: (step: number | null) => void;
  advanceOnboarding: () => void;

  // ─── Pomodoro ──────────────────────────────────────────────────────────────
  pomodoroVisible: boolean;
  togglePomodoro: () => void;
  flowSessions: number;
  incrementFlowSessions: () => void;
  blockerSuggestedOffered: boolean;
  setBlockerSuggestedOffered: (val: boolean) => void;

  // ─── Activity Tracker ──────────────────────────────────────────────────────
  activeMinutes: number;
  incrementActiveMinutes: () => void;
  idleMinutes: number;
  incrementIdleMinutes: () => void;

  // ─── Goals ─────────────────────────────────────────────────────────────────
  goals: Goal[];
  taskMappings: TaskGoalMapping[];
  goalsOpen: boolean;
  setGoalsOpen: (val: boolean) => void;
  setGoals: (goals: Goal[]) => void;
  setTaskMappings: (mappings: TaskGoalMapping[]) => void;
}

export const usePlannerStore = create<PlannerStore>((set, get) => ({
  // ─── Undo / Redo ───────────────────────────────────────────────────────────
  history: [],
  historyIndex: -1,

  pushHistory: (blocks) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(blocks.map(b => ({ ...b })));
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return null;
    const newIndex = historyIndex - 1;
    set({ historyIndex: newIndex });
    return history[newIndex];
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return null;
    const newIndex = historyIndex + 1;
    set({ historyIndex: newIndex });
    return history[newIndex];
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  // ─── Clipboard ─────────────────────────────────────────────────────────────
  clipboard: null,
  setClipboard: (block) => set({ clipboard: { ...block } }),
  clearClipboard: () => set({ clipboard: null }),

  // ─── Focus Mode ────────────────────────────────────────────────────────────
  focusMode: false,
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  setFocusMode: (value) => set({ focusMode: value }),

  // ─── Snap Grid ─────────────────────────────────────────────────────────────
  snapMinutes: 15,
  setSnapMinutes: (snap) => set({ snapMinutes: snap }),

  // ─── AI Generator ──────────────────────────────────────────────────────────
  aiGeneratorOpen: false,
  setAiGeneratorOpen: (open) => set({ aiGeneratorOpen: open }),

  // ─── Analytics ─────────────────────────────────────────────────────────────
  analyticsOpen: false,
  setAnalyticsOpen: (open) => set({ analyticsOpen: open }),

  // ─── Loading ───────────────────────────────────────────────────────────────
  blocksLoading: true,
  setBlocksLoading: (loading) => set({ blocksLoading: loading }),

  // ─── Onboarding ────────────────────────────────────────────────────────────
  onboardingStep: null,
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  advanceOnboarding: () => {
    const { onboardingStep } = get();
    if (onboardingStep === null) return;
    const TOTAL_STEPS = 9;
    if (onboardingStep >= TOTAL_STEPS - 1) {
      set({ onboardingStep: null });
    } else {
      set({ onboardingStep: onboardingStep + 1 });
    }
  },

  // ─── Pomodoro ──────────────────────────────────────────────────────────────
  pomodoroVisible: false,
  togglePomodoro: () => set((s) => ({ pomodoroVisible: !s.pomodoroVisible })),
  flowSessions: 0,
  incrementFlowSessions: () => set((s) => ({ flowSessions: s.flowSessions + 1 })),
  blockerSuggestedOffered: false,
  setBlockerSuggestedOffered: (val) => set({ blockerSuggestedOffered: val }),

  // ─── Activity Tracker ──────────────────────────────────────────────────────
  activeMinutes: 0,
  incrementActiveMinutes: () => set((s) => ({ activeMinutes: s.activeMinutes + 1 })),
  idleMinutes: 0,
  incrementIdleMinutes: () => set((s) => ({ idleMinutes: s.idleMinutes + 1 })),

  // ─── Goals ─────────────────────────────────────────────────────────────────
  goals: [],
  taskMappings: [],
  goalsOpen: false,
  setGoalsOpen: (val) => set({ goalsOpen: val }),
  setGoals: (goals) => set({ goals }),
  setTaskMappings: (mappings) => set({ taskMappings: mappings }),
}));
