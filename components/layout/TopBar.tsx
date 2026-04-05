'use client';

import { useAuth } from '@/hooks/useAuth';
import { usePlannerStore } from '@/store/plannerStore';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Calendar, LogOut, Loader2,
  Undo2, Redo2, Focus, Sparkles, BarChart2, Copy, Grid2x2,
  Menu, Timer, LayoutDashboard,
} from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { InstallButton } from '@/components/pwa/InstallButton';

export type AppView = 'calendar' | 'dashboard';

interface TopBarProps {
  weekRangeLabel: string;
  isCurrentWeek: boolean;
  isSaving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasClipboard: boolean;
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicateWeek: () => void;
  onPaste: () => void;
  onToggleSidebar?: () => void;
}

const IconBtn = ({ children, ...props }: React.ComponentProps<typeof Button>) => (
  <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}>
    <Button
      size="icon"
      className="h-9 w-9 min-h-[44px] min-w-[44px] md:h-7 md:w-7 md:min-h-0 md:min-w-0"
      {...props}
    >
      {children}
    </Button>
  </motion.div>
);

export function TopBar({
  weekRangeLabel, isCurrentWeek, isSaving,
  canUndo, canRedo, hasClipboard,
  activeView, onViewChange,
  onPrevWeek, onNextWeek, onCurrentWeek,
  onUndo, onRedo, onDuplicateWeek, onPaste,
  onToggleSidebar,
}: TopBarProps) {
  const { user, signOut } = useAuth();
  const {
    focusMode, toggleFocusMode,
    snapMinutes, setSnapMinutes,
    setAiGeneratorOpen,
    setAnalyticsOpen,
    togglePomodoro,
  } = usePlannerStore();

  return (
    <header className="sticky top-0 z-50 flex h-14 flex-shrink-0 items-center gap-2 border-b border-border/50 bg-background/80 px-3 backdrop-blur-md">

      {/* ── Brand + hamburger (mobile) ── */}
      <div className="flex items-center gap-2 min-w-[40px] md:min-w-[120px]">
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Menu className="h-5 w-5" />
        </motion.button>
        <Calendar className="h-4 w-4 text-primary flex-shrink-0 hidden md:block" />
        <span className="text-sm font-semibold hidden sm:block">Week Planner</span>
      </div>

      {/* ── View toggle: Calendar | Dashboard ── */}
      <div className="hidden sm:flex items-center gap-0.5 bg-muted/60 rounded-lg p-0.5 border border-border/30">
        <button
          onClick={() => onViewChange('calendar')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            activeView === 'calendar'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="Calendar view"
        >
          <Calendar className="h-3 w-3" />
          Calendar
        </button>
        <button
          onClick={() => onViewChange('dashboard')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            activeView === 'dashboard'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label="Dashboard view"
        >
          <LayoutDashboard className="h-3 w-3" />
          Dashboard
        </button>
      </div>

      {/* ── Left actions: undo/redo, snap (calendar-only) ── */}
      {activeView === 'calendar' && (
        <div className="hidden sm:flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <span>
                <IconBtn variant="ghost" onClick={onUndo} disabled={!canUndo} data-tour="undo-btn" aria-label="Undo (Ctrl+Z)">
                  <Undo2 className="h-3.5 w-3.5" />
                </IconBtn>
              </span>
            </TooltipTrigger>
            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={<span />}>
              <span>
                <IconBtn variant="ghost" onClick={onRedo} disabled={!canRedo} aria-label="Redo (Ctrl+Y)">
                  <Redo2 className="h-3.5 w-3.5" />
                </IconBtn>
              </span>
            </TooltipTrigger>
            <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger render={<span />}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSnapMinutes(snapMinutes === 15 ? 30 : 15)}
                  className="h-7 gap-1 text-xs px-2"
                  data-tour="snap-btn"
                  aria-label={`Snap grid: ${snapMinutes} min. Click to switch`}
                >
                  <Grid2x2 className="h-3 w-3" />
                  {snapMinutes}m
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>Snap to {snapMinutes === 15 ? '30' : '15'} min</TooltipContent>
          </Tooltip>

          {hasClipboard && (
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <span>
                  <IconBtn variant="ghost" onClick={onPaste} aria-label="Paste block (Ctrl+V)">
                    <Copy className="h-3.5 w-3.5" />
                  </IconBtn>
                </span>
              </TooltipTrigger>
              <TooltipContent>Paste block (Ctrl+V)</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}

      {/* ── Center: week nav ── */}
      <div className="flex flex-1 items-center justify-center gap-1" data-tour="week-nav">
        <Tooltip>
          <TooltipTrigger render={<span />}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="icon" onClick={onPrevWeek} aria-label="Previous week"
                className="h-8 w-8 min-h-[44px] min-w-[44px] md:h-7 md:w-7 md:min-h-0 md:min-w-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>Previous week</TooltipContent>
        </Tooltip>

        <AnimatePresence mode="wait">
          <motion.span
            key={weekRangeLabel}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="min-w-[90px] sm:min-w-[130px] text-center text-xs sm:text-sm font-medium select-none"
          >
            {weekRangeLabel}
          </motion.span>
        </AnimatePresence>

        <Tooltip>
          <TooltipTrigger render={<span />}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="ghost" size="icon" onClick={onNextWeek} aria-label="Next week"
                className="h-8 w-8 min-h-[44px] min-w-[44px] md:h-7 md:w-7 md:min-h-0 md:min-w-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>Next week</TooltipContent>
        </Tooltip>

        <Button
          variant={isCurrentWeek ? 'secondary' : 'outline'}
          size="sm"
          onClick={onCurrentWeek}
          disabled={isCurrentWeek}
          className="hidden sm:flex ml-1 h-7 text-xs px-2"
        >
          Today
        </Button>

        {activeView === 'calendar' && (
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Button variant="ghost" size="sm" onClick={onDuplicateWeek}
                  aria-label="Duplicate this week to next week"
                  className="hidden lg:flex h-7 text-xs px-2">
                  Copy Week →
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>Duplicate this week to next week</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* ── Right actions ── */}
      <div className="flex items-center gap-1">
        {/* AI Generator */}
        <Tooltip>
          <TooltipTrigger render={<span />}>
            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAiGeneratorOpen(true)}
                className="h-9 gap-1 text-xs px-2 text-primary hover:text-primary min-h-[44px] md:h-7 md:min-h-0"
                data-tour="ai-btn"
                aria-label="Open AI Week Generator"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:block">AI</span>
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>AI Week Generator</TooltipContent>
        </Tooltip>

        {/* Analytics */}
        <Tooltip>
          <TooltipTrigger render={<span />}>
            <span>
              <IconBtn variant="ghost" onClick={() => setAnalyticsOpen(true)} data-tour="analytics-btn" aria-label="Open Analytics">
                <BarChart2 className="h-3.5 w-3.5" />
              </IconBtn>
            </span>
          </TooltipTrigger>
          <TooltipContent>Analytics</TooltipContent>
        </Tooltip>

        {/* Focus Mode */}
        <Tooltip>
          <TooltipTrigger render={<span />}>
            <span>
              <IconBtn
                variant={focusMode ? 'secondary' : 'ghost'}
                onClick={toggleFocusMode}
                data-tour="focus-btn"
                aria-label={focusMode ? 'Exit focus mode' : 'Enable focus mode'}
              >
                <Focus className="h-3.5 w-3.5" />
              </IconBtn>
            </span>
          </TooltipTrigger>
          <TooltipContent>{focusMode ? 'Exit focus mode' : 'Focus mode'}</TooltipContent>
        </Tooltip>

        {/* Pomodoro Timer */}
        <Tooltip>
          <TooltipTrigger render={<span />}>
            <span>
              <IconBtn variant="ghost" onClick={togglePomodoro} data-tour="pomodoro-btn" aria-label="Open Pomodoro Timer">
                <Timer className="h-3.5 w-3.5" />
              </IconBtn>
            </span>
          </TooltipTrigger>
          <TooltipContent>Pomodoro Timer</TooltipContent>
        </Tooltip>

        {/* Install App */}
        <InstallButton />

        {/* Notification Bell */}
        <NotificationBell />

        {/* Saving indicator */}
        <AnimatePresence>
          {isSaving && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 text-xs text-muted-foreground px-1"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* User email */}
        <span className="hidden lg:block text-xs text-muted-foreground max-w-[120px] truncate">
          {user?.email}
        </span>

        <Tooltip>
          <TooltipTrigger render={<span />}>
            <span>
              <IconBtn variant="ghost" onClick={() => signOut()} aria-label="Sign out">
                <LogOut className="h-3.5 w-3.5" />
              </IconBtn>
            </span>
          </TooltipTrigger>
          <TooltipContent>Sign out</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
