'use client';

import { useState } from 'react';
import {
  getWeekId,
  getWeekStart,
  getNextWeekId,
  getPrevWeekId,
  getWeekDays,
  formatWeekRange,
} from '@/lib/dateHelpers';

export function useWeekNavigation() {
  const [weekId, setWeekId] = useState(() => getWeekId(new Date()));

  function goToNextWeek() {
    setWeekId(getNextWeekId(weekId));
  }

  function goToPrevWeek() {
    setWeekId(getPrevWeekId(weekId));
  }

  function goToCurrentWeek() {
    setWeekId(getWeekId(new Date()));
  }

  const weekDays = getWeekDays(weekId);
  const weekStart = getWeekStart(weekId);
  const weekRangeLabel = formatWeekRange(weekId);
  const isCurrentWeek = weekId === getWeekId(new Date());

  return {
    weekId,
    weekDays,
    weekStart,
    weekRangeLabel,
    isCurrentWeek,
    goToNextWeek,
    goToPrevWeek,
    goToCurrentWeek,
  };
}
