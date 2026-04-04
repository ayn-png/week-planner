'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useWeekNavigation } from '@/hooks/useWeekNavigation';
import { usePlanner } from '@/hooks/usePlanner';
import { usePlannerContext } from '@/context/PlannerContext';
import { usePlannerStore } from '@/store/plannerStore';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { DragOverlayContent } from '@/components/dnd/DragOverlayContent';
import { BlockEditModal } from '@/components/blocks/BlockEditModal';
import { VoicePlanner } from '@/components/ai/VoicePlanner';
import { AIWeekGenerator } from '@/components/ai/AIWeekGenerator';
import { SmartSuggestions } from '@/components/ai/SmartSuggestions';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { GoalsDashboard } from '@/components/goals/GoalsDashboard';
import { PomodoroTimer } from '@/components/pomodoro/PomodoroTimer';
import { ReschedulePrompt } from '@/components/planner/ReschedulePrompt';
import { WebsiteBlockerSuggest } from '@/components/pomodoro/WebsiteBlockerSuggest';
import { WeeklyDashboard } from '@/components/weekly/WeeklyDashboard';
import type { DragData, PlannerBlock, DayOfWeek } from '@/types/planner';
import { DAY_LABELS } from '@/types/planner';
import { snapToSlot } from '@/lib/dateHelpers';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlannerPage() {
  const { weekId, weekDays, weekRangeLabel, isCurrentWeek, goToNextWeek, goToPrevWeek, goToCurrentWeek } =
    useWeekNavigation();

  const { state } = usePlannerContext();
  const {
    blocks, isSaving,
    addBlock, moveBlock, resizeBlock, updateBlock, deleteBlock,
    pasteBlock, handleUndo, handleRedo,
    duplicateWeekToNext, addBulkBlocks,
  } = usePlanner(weekId);

  const {
    snapMinutes, canUndo, canRedo,
    clipboard, setClipboard,
    aiGeneratorOpen, setAiGeneratorOpen,
    analyticsOpen, setAnalyticsOpen,
    focusMode,
    pomodoroVisible, togglePomodoro,
  } = usePlannerStore();

  // Trigger onboarding tour for new users
  useOnboarding();
  useActivityTracker();

  const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<PlannerBlock | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);
  const [pasteDay, setPasteDay] = useState<DayOfWeek | null>(null);
  const [duplicateSuccess, setDuplicateSuccess] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const dayColumnRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null, null, null, null]);
  const resizeStartEndTimeRef = useRef<number>(0);
  const touchStartXRef = useRef<number | null>(null);

  // ─── Sensors ───────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  // ─── Drag handlers ─────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragData;
    setActiveDragData(data);
    setDropError(null);
    if (data.type === 'RESIZE' && data.block) {
      resizeStartEndTimeRef.current = data.block.endTime;
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over, delta, activatorEvent } = event;
    setActiveDragData(null);

    const dragData = active.data.current as DragData;

    // ── Resize ──
    if (dragData.type === 'RESIZE' && dragData.block) {
      const block = dragData.block;
      const snappedMinutes = Math.round(delta.y / snapMinutes) * snapMinutes;
      const newEndTime = resizeStartEndTimeRef.current + snappedMinutes;
      const clamped = Math.max(block.startTime + snapMinutes, Math.min(1440, newEndTime));
      const snapped = snapToSlot(clamped, snapMinutes);
      resizeBlock(block.id, snapped);
      return;
    }

    if (!over) return;
    const overId = over.id.toString();
    if (!overId.startsWith('day-column-')) return;

    const dayIndex = parseInt(overId.replace('day-column-', ''));
    if (isNaN(dayIndex) || dayIndex < 0 || dayIndex > 6) return;

    const colEl = dayColumnRefs.current[dayIndex];
    if (!colEl) return;

    const rect = colEl.getBoundingClientRect();
    const pointerEvent = activatorEvent as PointerEvent;
    const pointerY = pointerEvent.clientY + delta.y;
    const scrollContainer = colEl.closest('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    const scrollTop = scrollContainer?.scrollTop ?? 0;
    const relativeY = pointerY - rect.top + scrollTop;
    const rawMinutes = Math.max(0, Math.min(1439, relativeY));
    const snappedMinutes = snapToSlot(rawMinutes, snapMinutes);

    const day = DAY_LABELS[dayIndex] as DayOfWeek;

    if (dragData.type === 'CATEGORY' && dragData.category) {
      const result = addBlock(dragData.category, day, snappedMinutes);
      if (!result.success) showError(result.error!);
    } else if (dragData.type === 'BLOCK' && dragData.block) {
      const result = moveBlock(dragData.block.id, day, snappedMinutes);
      if (!result.success) showError(result.error!);
    }
  }

  function handleDragCancel() {
    setActiveDragData(null);
  }

  function showError(msg: string) {
    setDropError(msg);
    setTimeout(() => setDropError(null), 3000);
  }

  // ─── Copy/Paste ─────────────────────────────────────────────────────────────

  function handleCopyBlock(block: PlannerBlock) {
    setClipboard(block);
    showToast('Block copied — press Ctrl+V to paste');
  }

  function handlePaste(targetDay?: DayOfWeek) {
    if (!clipboard) return;
    const day = targetDay ?? clipboard.day;
    const result = pasteBlock(clipboard, day);
    if (!result.success) showError(result.error!);
    setPasteDay(null);
  }

  const [toast, setToast] = useState<string | null>(null);
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  // ─── Duplicate week ─────────────────────────────────────────────────────────

  async function handleDuplicateWeek() {
    await duplicateWeekToNext();
    setDuplicateSuccess(true);
    setTimeout(() => setDuplicateSuccess(false), 2500);
  }

  // ─── AI bulk add ────────────────────────────────────────────────────────────

  function handleAIGenerated(newBlocks: PlannerBlock[]) {
    addBulkBlocks(newBlocks);
  }

  // ─── Keyboard shortcuts ─────────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const ctrl = e.ctrlKey || e.metaKey;
    if (!ctrl) return;

    if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
    if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); handleRedo(); }
    if (e.key === 'v') { e.preventDefault(); handlePaste(); }
    if (e.key === 'd') { e.preventDefault(); handleDuplicateWeek(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipboard, handleUndo, handleRedo, handleDuplicateWeek]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // ─── Auto-Schedule Focus Block ─────────────────────────────────────────────
  const handleScheduleFocus = useCallback(() => {
    const todayIndex = (new Date().getDay() + 6) % 7;
    const dayLabel = DAY_LABELS[todayIndex] ?? 'Mon';
    
    // Find gaps in today's blocks
    const todayBlocks = blocks
      .filter((b) => b.day === dayLabel)
      .sort((a, b) => a.startTime - b.startTime);

    let start = 9 * 60; // 9 AM start search
    let foundSlot: number | null = null;
    
    for (const b of todayBlocks) {
      if (b.startTime - start >= 60) {
        foundSlot = start;
        break;
      }
      start = Math.max(start, b.endTime);
    }
    if (foundSlot === null && 1440 - start >= 60) {
      foundSlot = start;
    }
    
    if (foundSlot !== null && state.categories.length > 0) {
      const workCat = state.categories.find(c => c.id === 'work' || c.label.toLowerCase() === 'work') || state.categories[0];
      const newBlock: PlannerBlock = {
        id: uuidv4(),
        title: 'Deep Work Session',
        category: workCat.id,
        color: workCat.color,
        day: dayLabel as DayOfWeek,
        startTime: foundSlot,
        endTime: foundSlot + 60,
        createdAt: Date.now(),
        isFocus: true,
      };
      addBulkBlocks([newBlock]);
    }
  }, [blocks, state.categories, addBulkBlocks]);

  // ─── Swipe gesture for mobile week navigation ───────────────────────────────

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      touchStartXRef.current = e.touches[0].clientX;
    }
    function onTouchEnd(e: TouchEvent) {
      if (touchStartXRef.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartXRef.current;
      touchStartXRef.current = null;
      if (Math.abs(dx) < 60) return;
      const y = e.changedTouches[0].clientY;
      if (y < 60) return;
      if (dx < 0) goToNextWeek();
      else goToPrevWeek();
    }
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [goToNextWeek, goToPrevWeek]);

  const visibleDayIndices = Array.from({ length: 7 }, (_, i) => i);

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex h-screen flex-col overflow-hidden">
          <TopBar
            weekRangeLabel={weekRangeLabel}
            isCurrentWeek={isCurrentWeek}
            isSaving={isSaving}
            canUndo={canUndo()}
            canRedo={canRedo()}
            hasClipboard={!!clipboard}
            onPrevWeek={goToPrevWeek}
            onNextWeek={goToNextWeek}
            onCurrentWeek={goToCurrentWeek}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onDuplicateWeek={handleDuplicateWeek}
            onPaste={() => handlePaste()}
            onToggleSidebar={() => setSidebarOpen((o) => !o)}
          />

          {/* Focus mode banner */}
          <AnimatePresence>
            {focusMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="flex items-center justify-center gap-2 bg-primary/10 border-b border-primary/20 py-1.5 text-xs text-primary font-medium overflow-hidden"
              >
                <span>🎯 Focus Mode — only your current block is highlighted</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-1 overflow-hidden">
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />

            {/* Main content area — scrollable so dashboard appears below calendar */}
            <div className="relative flex flex-1 flex-col overflow-y-auto scrollbar-thin">
              <div className="px-6 pt-4">
                <ReschedulePrompt />
              </div>
              <SmartSuggestions blocks={blocks} categories={state.categories} onScheduleFocus={handleScheduleFocus} />

              {/* Calendar — fixed viewport height so it fills the screen */}
              <div className="flex-shrink-0" style={{ height: 'calc(100vh - 120px)' }}>
                <CalendarGrid
                  weekDays={weekDays}
                  blocks={blocks}
                  onBlockClick={setSelectedBlock}
                  onBlockCopy={handleCopyBlock}
                  dayColumnRefs={dayColumnRefs}
                  visibleDayIndices={visibleDayIndices}
                />
              </div>

              {/* Weekly Dashboard — scroll down to see it */}
              <WeeklyDashboard weekId={weekId} weekDays={weekDays} />

              {/* Mobile day nav hint */}
              <div className="flex md:hidden items-center justify-center gap-3 py-2 border-t border-border/40 bg-background/80 backdrop-blur-sm">
                <span className="text-xs text-muted-foreground">Swipe to navigate weeks</span>
              </div>

              {/* Error / feedback toasts */}
              <AnimatePresence>
                {(dropError || toast || duplicateSuccess || pasteDay !== null) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className={`fixed bottom-12 left-1/2 -translate-x-1/2 rounded-lg px-4 py-2 text-sm shadow-lg z-50 ${
                      dropError
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-foreground text-background'
                    }`}
                  >
                    {dropError || toast || (duplicateSuccess ? '✓ Week duplicated to next week' : '')}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Drag overlay ghost */}
        <DragOverlay>
          {activeDragData && activeDragData.type !== 'RESIZE'
            ? <DragOverlayContent data={activeDragData} />
            : null}
        </DragOverlay>

        {/* Block edit modal — pass weekDays for past-slot guard */}
        <BlockEditModal
          block={selectedBlock}
          categories={state.categories}
          weekDays={weekDays}
          blocks={blocks}
          onSave={(block) => {
            const result = updateBlock(block);
            return result;
          }}
          onDelete={(id) => { deleteBlock(id); setSelectedBlock(null); }}
          onClose={() => setSelectedBlock(null)}
        />

        {/* AI Week Generator */}
        <AIWeekGenerator
          open={aiGeneratorOpen}
          onClose={() => setAiGeneratorOpen(false)}
          categories={state.categories}
          existingBlocks={blocks}
          onGenerated={handleAIGenerated}
        />

        {/* Analytics */}
        <AnalyticsDashboard
          open={analyticsOpen}
          onClose={() => setAnalyticsOpen(false)}
          blocks={blocks}
          categories={state.categories}
          weekRangeLabel={weekRangeLabel}
        />
      </DndContext>

      {/* Onboarding tour — outside DndContext so it layers above everything */}
      <OnboardingTour />

      {/* Pomodoro timer — outside DndContext, fixed floating */}
      <AnimatePresence>
        {pomodoroVisible && (
          <PomodoroTimer onClose={togglePomodoro} />
        )}
      </AnimatePresence>

      {/* Website Blocker Suggestion Dialog for Focus Mode */}
      <WebsiteBlockerSuggest />

      {/* Goals Dashboard */}
      <GoalsDashboard />

      {/* Voice Planner FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <VoicePlanner />
      </div>
    </>
  );
}
