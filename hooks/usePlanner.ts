'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { usePlannerContext } from '@/context/PlannerContext';
import { usePlannerStore } from '@/store/plannerStore';
import { subscribeToWeekPlan, saveWeekPlan } from '@/lib/firebase/firestore';
import { wouldOverlap } from '@/lib/overlapDetection';
import { getNextWeekId, snapToSlot, getWeekDays, isPastSlot } from '@/lib/dateHelpers';
import type { PlannerBlock, DayOfWeek } from '@/types/planner';
import { v4 as uuidv4 } from 'uuid';

export function usePlanner(weekId: string) {
  const { user } = useAuth();
  const { state, dispatch } = usePlannerContext();
  const { pushHistory, undo, redo, setBlocksLoading, snapMinutes } = usePlannerStore();
  const saveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  // Track last locally-written timestamp to prevent infinite Firestore loop
  const localLastModifiedRef = useRef<number>(0);

  // Subscribe to Firestore for the current week
  useEffect(() => {
    if (!user || !weekId) return;
    dispatch({ type: 'SET_WEEK', weekId });
    setBlocksLoading(true);

    const unsub = subscribeToWeekPlan(user.uid, weekId, (plan) => {
      setBlocksLoading(false);
      if (!plan) {
        dispatch({ type: 'SET_BLOCKS', blocks: [] });
        return;
      }
      if (plan.lastModified === localLastModifiedRef.current) return;
      dispatch({ type: 'SET_BLOCKS', blocks: plan.blocks });
    });

    return unsub;
  }, [user, weekId, dispatch, setBlocksLoading]);

  const scheduleSave = useCallback(
    (blocks: PlannerBlock[]) => {
      if (!user) return;
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        dispatch({ type: 'SET_SAVING', saving: true });
        const lastModified = Date.now();
        localLastModifiedRef.current = lastModified;
        await saveWeekPlan(user.uid, { weekId, blocks, lastModified });
        dispatch({ type: 'SET_SAVING', saving: false });
      }, 600);
    },
    [user, weekId, dispatch]
  );

  // ─── Mutation helpers ─────────────────────────────────────────────────────

  function addBlock(
    category: { id: string; label: string; color: string },
    day: DayOfWeek,
    startTime: number
  ): { success: boolean; error?: string } {
    const snapped = snapToSlot(startTime, snapMinutes);
    const endTime = Math.min(snapped + 60, 1440);

    if (wouldOverlap({ day, startTime: snapped, endTime }, state.blocks)) {
      return { success: false, error: 'Time slot is already occupied' };
    }

    if (isPastSlot(day, endTime, getWeekDays(weekId))) {
      return { success: false, error: 'Cannot schedule blocks in the past' };
    }

    const newBlock: PlannerBlock = {
      id: uuidv4(),
      title: category.label,
      category: category.id,
      color: category.color,
      day,
      startTime: snapped,
      endTime,
      createdAt: Date.now(),
    };

    pushHistory(state.blocks);
    const updated = [...state.blocks, newBlock];
    dispatch({ type: 'ADD_BLOCK', block: newBlock });
    scheduleSave(updated);
    return { success: true };
  }

  function moveBlock(
    blockId: string,
    newDay: DayOfWeek,
    newStartTime: number
  ): { success: boolean; error?: string } {
    const block = state.blocks.find((b) => b.id === blockId);
    if (!block) return { success: false, error: 'Block not found' };

    const snapped = snapToSlot(newStartTime, snapMinutes);
    const duration = block.endTime - block.startTime;
    const newEndTime = Math.min(snapped + duration, 1440);

    if (wouldOverlap({ day: newDay, startTime: snapped, endTime: newEndTime }, state.blocks, blockId)) {
      return { success: false, error: 'Time slot is already occupied' };
    }

    if (isPastSlot(newDay, newEndTime, getWeekDays(weekId))) {
      return { success: false, error: 'Cannot move blocks to the past' };
    }

    const updatedBlock = { ...block, day: newDay, startTime: snapped, endTime: newEndTime };
    pushHistory(state.blocks);
    const updated = state.blocks.map((b) => (b.id === blockId ? updatedBlock : b));
    dispatch({ type: 'UPDATE_BLOCK', block: updatedBlock });
    scheduleSave(updated);
    return { success: true };
  }

  function resizeBlock(
    blockId: string,
    newEndTime: number
  ): { success: boolean; error?: string } {
    const block = state.blocks.find((b) => b.id === blockId);
    if (!block) return { success: false, error: 'Block not found' };

    const snapped = snapToSlot(newEndTime, snapMinutes);
    const clamped = Math.max(block.startTime + snapMinutes, Math.min(1440, snapped));

    if (wouldOverlap({ day: block.day, startTime: block.startTime, endTime: clamped }, state.blocks, blockId)) {
      return { success: false, error: 'Cannot resize — overlaps another block' };
    }

    const updatedBlock = { ...block, endTime: clamped };
    // Don't push history for every resize tick — only on drag end
    const updated = state.blocks.map((b) => (b.id === blockId ? updatedBlock : b));
    dispatch({ type: 'UPDATE_BLOCK', block: updatedBlock });
    scheduleSave(updated);
    return { success: true };
  }

  function updateBlock(block: PlannerBlock): { success: boolean; error?: string } {
    if (wouldOverlap(
      { day: block.day, startTime: block.startTime, endTime: block.endTime },
      state.blocks,
      block.id
    )) {
      return { success: false, error: 'Time slot is already occupied' };
    }

    pushHistory(state.blocks);
    const updated = state.blocks.map((b) => (b.id === block.id ? block : b));
    dispatch({ type: 'UPDATE_BLOCK', block });
    scheduleSave(updated);
    return { success: true };
  }

  function deleteBlock(blockId: string) {
    pushHistory(state.blocks);
    const updated = state.blocks.filter((b) => b.id !== blockId);
    dispatch({ type: 'DELETE_BLOCK', id: blockId });
    scheduleSave(updated);
  }

  // ─── Copy / Paste ─────────────────────────────────────────────────────────

  function pasteBlock(clipboard: PlannerBlock, targetDay: DayOfWeek): { success: boolean; error?: string } {
    if (wouldOverlap(
      { day: targetDay, startTime: clipboard.startTime, endTime: clipboard.endTime },
      state.blocks
    )) {
      return { success: false, error: 'Paste conflict — time slot occupied' };
    }

    const newBlock: PlannerBlock = {
      ...clipboard,
      id: uuidv4(),
      day: targetDay,
      createdAt: Date.now(),
    };
    pushHistory(state.blocks);
    const updated = [...state.blocks, newBlock];
    dispatch({ type: 'ADD_BLOCK', block: newBlock });
    scheduleSave(updated);
    return { success: true };
  }

  // ─── Undo / Redo ─────────────────────────────────────────────────────────

  function handleUndo() {
    const prev = undo();
    if (!prev) return;
    dispatch({ type: 'SET_BLOCKS', blocks: prev });
    scheduleSave(prev);
  }

  function handleRedo() {
    const next = redo();
    if (!next) return;
    dispatch({ type: 'SET_BLOCKS', blocks: next });
    scheduleSave(next);
  }

  // ─── Duplicate Week ──────────────────────────────────────────────────────

  async function duplicateWeekToNext(): Promise<void> {
    if (!user) return;
    const nextWeekId = getNextWeekId(weekId);
    const nextBlocks = state.blocks.map((b) => ({
      ...b,
      id: uuidv4(),
      createdAt: Date.now(),
    }));
    const lastModified = Date.now();
    await saveWeekPlan(user.uid, {
      weekId: nextWeekId,
      blocks: nextBlocks,
      lastModified,
    });
  }

  // ─── Bulk Add (AI) ───────────────────────────────────────────────────────

  function addBulkBlocks(newBlocks: PlannerBlock[]): void {
    pushHistory(state.blocks);
    const allBlocks = [...state.blocks, ...newBlocks];
    dispatch({ type: 'ADD_BLOCKS', blocks: newBlocks });
    scheduleSave(allBlocks);
  }

  return {
    blocks: state.blocks,
    isSaving: state.isSaving,
    addBlock,
    moveBlock,
    resizeBlock,
    updateBlock,
    deleteBlock,
    pasteBlock,
    handleUndo,
    handleRedo,
    duplicateWeekToNext,
    addBulkBlocks,
  };
}
