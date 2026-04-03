'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { usePlannerStore } from '@/store/plannerStore';
import { useAuth } from '@/hooks/useAuth';
import { completeOnboarding } from '@/lib/firebase/firestore';

interface Step {
  target: string;        // data-tour attribute value
  title: string;
  message: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: Step[] = [
  {
    target: 'categories',
    title: 'Your Categories',
    message: 'Drag any category card onto the calendar to create a time block. Try dragging "Work" onto Monday!',
    placement: 'right',
  },
  {
    target: 'calendar-col',
    title: 'The Calendar Grid',
    message: 'Drop blocks here at any time. The grid snaps to 15-minute slots for precise scheduling.',
    placement: 'right',
  },
  {
    target: 'undo-btn',
    title: 'Undo & Redo',
    message: 'Made a mistake? Ctrl+Z undoes it. Ctrl+Y (or Ctrl+Shift+Z) redoes. Up to 50 levels of history.',
    placement: 'bottom',
  },
  {
    target: 'snap-btn',
    title: 'Snap Grid',
    message: 'Toggle between 15-minute and 30-minute snap resolution for coarser or finer control.',
    placement: 'bottom',
  },
  {
    target: 'ai-btn',
    title: 'AI Week Generator',
    message: 'Describe your ideal week in plain English and let AI fill your calendar automatically.',
    placement: 'bottom',
  },
  {
    target: 'analytics-btn',
    title: 'Analytics Dashboard',
    message: 'See time breakdowns by category, daily patterns, and your productivity score.',
    placement: 'bottom',
  },
  {
    target: 'focus-btn',
    title: 'Focus Mode',
    message: 'Enable Focus Mode to blur everything except the block currently in progress — great for deep work.',
    placement: 'bottom',
  },
  {
    target: 'pomodoro-btn',
    title: 'Pomodoro Timer',
    message: 'Launch a floating Pomodoro timer. 25-min focus, 5-min break. Drag it anywhere on screen.',
    placement: 'bottom',
  },
  {
    target: 'week-nav',
    title: "You're All Set! 🎉",
    message: 'Use the arrows to navigate weeks. Your schedule auto-saves to the cloud in real time. Enjoy planning!',
    placement: 'bottom',
  },
];

interface Rect { top: number; left: number; width: number; height: number }

const PADDING = 8;

export function OnboardingTour() {
  const { onboardingStep, setOnboardingStep, advanceOnboarding } = usePlannerStore();
  const { user } = useAuth();
  const [targetRect, setTargetRect] = useState<Rect | null>(null);

  const updateTargetRect = useCallback(() => {
    if (onboardingStep === null) return;
    const step = STEPS[onboardingStep];
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) { setTargetRect(null); return; }
    const r = el.getBoundingClientRect();
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [onboardingStep]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    return () => window.removeEventListener('resize', updateTargetRect);
  }, [updateTargetRect]);

  async function handleDone() {
    setOnboardingStep(null);
    if (user) await completeOnboarding(user.uid);
  }

  function handleSkip() {
    handleDone();
  }

  function handlePrev() {
    if (onboardingStep !== null && onboardingStep > 0) {
      setOnboardingStep(onboardingStep - 1);
    }
  }

  function handleNext() {
    if (onboardingStep !== null) {
      if (onboardingStep >= STEPS.length - 1) {
        handleDone();
      } else {
        advanceOnboarding();
      }
    }
  }

  if (onboardingStep === null) return null;

  const step = STEPS[onboardingStep];

  // Tooltip position calculation
  function getTooltipStyle(): React.CSSProperties {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    const TW = 300, TH = 180;
    const vw = window.innerWidth, vh = window.innerHeight;

    let top = 0, left = 0;
    switch (step.placement) {
      case 'bottom':
        top = Math.min(targetRect.top + targetRect.height + PADDING + 8, vh - TH - 16);
        left = Math.max(8, Math.min(targetRect.left + targetRect.width / 2 - TW / 2, vw - TW - 8));
        break;
      case 'top':
        top = Math.max(8, targetRect.top - TH - PADDING - 8);
        left = Math.max(8, Math.min(targetRect.left + targetRect.width / 2 - TW / 2, vw - TW - 8));
        break;
      case 'right':
        top = Math.max(8, Math.min(targetRect.top + targetRect.height / 2 - TH / 2, vh - TH - 8));
        left = Math.min(targetRect.left + targetRect.width + PADDING + 8, vw - TW - 8);
        break;
      case 'left':
        top = Math.max(8, Math.min(targetRect.top + targetRect.height / 2 - TH / 2, vh - TH - 8));
        left = Math.max(8, targetRect.left - TW - PADDING - 8);
        break;
    }
    return { position: 'fixed', top, left, width: TW, zIndex: 10001 };
  }

  // Spotlight: two separate fixed layers — overlay behind (z-10000), tooltip above (z-10001)
  const spotlightStyle: React.CSSProperties = targetRect
    ? {
        position: 'fixed',
        top: targetRect.top - PADDING,
        left: targetRect.left - PADDING,
        width: targetRect.width + PADDING * 2,
        height: targetRect.height + PADDING * 2,
        borderRadius: 10,
        boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
        pointerEvents: 'none',
        zIndex: 10000,
      }
    : {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        pointerEvents: 'none',
        zIndex: 10000,
      };

  // Render as two INDEPENDENT fixed elements at root level — no shared parent container.
  // Spotlight at z-10000, tooltip at z-10001 — tooltip always renders above the overlay.
  return (
    <AnimatePresence>
      {/* Layer 1: Spotlight overlay — stays below tooltip */}
      <motion.div
        key={`spotlight-${onboardingStep}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        style={spotlightStyle}
      />

      {/* Layer 2: Tooltip card — always above the overlay */}
      <motion.div
        key={`tooltip-${onboardingStep}`}
        initial={{ opacity: 0, scale: 0.92, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 6 }}
        transition={{ type: 'spring', stiffness: 420, damping: 26, delay: 0.08 }}
        style={getTooltipStyle()}
        className="pointer-events-auto"
      >
        <div className="rounded-xl border border-border/80 bg-card shadow-2xl p-4 flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  {onboardingStep + 1} / {STEPS.length}
                </span>
              </div>
              <h3 className="text-sm font-semibold">{step.title}</h3>
            </div>
            <button
              onClick={handleSkip}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground flex-shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Message */}
          <p className="text-xs text-muted-foreground leading-relaxed">{step.message}</p>

          {/* Progress dots */}
          <div className="flex items-center gap-1 justify-center">
            {STEPS.map((_, i) => (
              <motion.div
                key={i}
                animate={{ width: i === onboardingStep ? 16 : 6, opacity: i === onboardingStep ? 1 : 0.35 }}
                transition={{ duration: 0.2 }}
                className="h-1.5 rounded-full bg-primary"
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              {onboardingStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                {onboardingStep >= STEPS.length - 1 ? 'Done 🎉' : 'Next'}
                {onboardingStep < STEPS.length - 1 && <ChevronRight className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
