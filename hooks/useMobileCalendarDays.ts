'use client';

import { useState, useEffect } from 'react';
import { DAY_LABELS } from '@/types/planner';

// Today's day index in Mon-Sun (0=Mon, 6=Sun)
function getTodayIndex(): number {
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon...
  return (jsDay + 6) % 7; // Convert to Mon=0...Sun=6
}

export function useMobileCalendarDays() {
  const [isMobile, setIsMobile] = useState(false);
  const [windowStart, setWindowStart] = useState(() => {
    // Start window so today is in the middle when possible
    const today = getTodayIndex();
    return Math.max(0, Math.min(today - 1, DAY_LABELS.length - 3));
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 480);
    check();
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  const WINDOW_SIZE = 3;
  const maxStart = DAY_LABELS.length - WINDOW_SIZE;

  const visibleDayIndices = isMobile
    ? Array.from({ length: WINDOW_SIZE }, (_, i) => windowStart + i)
    : Array.from({ length: 7 }, (_, i) => i);

  function goBack() {
    setWindowStart((prev) => Math.max(0, prev - 1));
  }

  function goForward() {
    setWindowStart((prev) => Math.min(maxStart, prev + 1));
  }

  return {
    isMobile,
    visibleDayIndices,
    windowStart,
    canGoBack: isMobile && windowStart > 0,
    canGoForward: isMobile && windowStart < maxStart,
    goBack,
    goForward,
  };
}
