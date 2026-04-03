'use client';

import React, { createContext, useContext, useReducer } from 'react';
import type { PlannerBlock, Category } from '@/types/planner';

// ─── State ────────────────────────────────────────────────────────────────────

interface PlannerState {
  blocks: PlannerBlock[];
  categories: Category[];
  weekId: string;
  isSaving: boolean;
}

const initialState: PlannerState = {
  blocks: [],
  categories: [],
  weekId: '',
  isSaving: false,
};

// ─── Actions ─────────────────────────────────────────────────────────────────

export type PlannerAction =
  | { type: 'SET_BLOCKS'; blocks: PlannerBlock[] }
  | { type: 'ADD_BLOCK'; block: PlannerBlock }
  | { type: 'ADD_BLOCKS'; blocks: PlannerBlock[] }      // bulk add (AI / duplicate)
  | { type: 'UPDATE_BLOCK'; block: PlannerBlock }
  | { type: 'DELETE_BLOCK'; id: string }
  | { type: 'SET_CATEGORIES'; categories: Category[] }
  | { type: 'ADD_CATEGORY'; category: Category }
  | { type: 'DELETE_CATEGORY'; id: string }
  | { type: 'SET_WEEK'; weekId: string }
  | { type: 'SET_SAVING'; saving: boolean };

function plannerReducer(state: PlannerState, action: PlannerAction): PlannerState {
  switch (action.type) {
    case 'SET_BLOCKS':
      return { ...state, blocks: action.blocks };
    case 'ADD_BLOCK':
      return { ...state, blocks: [...state.blocks, action.block] };
    case 'ADD_BLOCKS':
      return { ...state, blocks: [...state.blocks, ...action.blocks] };
    case 'UPDATE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.map((b) => (b.id === action.block.id ? action.block : b)),
      };
    case 'DELETE_BLOCK':
      return { ...state, blocks: state.blocks.filter((b) => b.id !== action.id) };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.categories };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.category] };
    case 'DELETE_CATEGORY':
      return { ...state, categories: state.categories.filter((c) => c.id !== action.id) };
    case 'SET_WEEK':
      return { ...state, weekId: action.weekId, blocks: [] };
    case 'SET_SAVING':
      return { ...state, isSaving: action.saving };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface PlannerContextValue {
  state: PlannerState;
  dispatch: React.Dispatch<PlannerAction>;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(plannerReducer, initialState);
  return (
    <PlannerContext.Provider value={{ state, dispatch }}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlannerContext(): PlannerContextValue {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error('usePlannerContext must be used within PlannerProvider');
  return ctx;
}
