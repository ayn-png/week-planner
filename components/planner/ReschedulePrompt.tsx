'use client';

import { useState, useEffect } from 'react';
import { usePlannerContext } from '@/context/PlannerContext';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DAY_LABELS, DayOfWeek, PlannerBlock } from '@/types/planner';

export function ReschedulePrompt() {
  const { state, dispatch } = usePlannerContext();
  const [incompleteBlocks, setIncompleteBlocks] = useState<PlannerBlock[]>([]);
  const [dismissed, setDismissed] = useState(false);

  // Default target day is today
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday=0 ... Sunday=6
  const [targetDay, setTargetDay] = useState<DayOfWeek>(DAY_LABELS[todayIndex]);

  useEffect(() => {
    if (dismissed) return;

    // Find past blocks that are incomplete (not strictly 'done')
    const pastIncompletes = state.blocks.filter(b => {
      const blockDayIndex = DAY_LABELS.indexOf(b.day);
      const isPast = blockDayIndex < todayIndex;
      return isPast && b.status !== 'done';
    });

    setIncompleteBlocks(pastIncompletes);
  }, [state.blocks, dismissed, todayIndex]);

  if (incompleteBlocks.length === 0 || dismissed) return null;

  const handleRescheduleAll = () => {
    incompleteBlocks.forEach(b => {
      dispatch({
        type: 'UPDATE_BLOCK',
        block: {
          ...b,
          day: targetDay,
        }
      });
    });
    setDismissed(true);
  };

  return (
    <div className="mb-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 text-yellow-600 dark:text-yellow-400 relative">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 stroke-yellow-600 dark:stroke-yellow-400 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">
              You have {incompleteBlocks.length} incomplete task{incompleteBlocks.length > 1 ? 's' : ''} from past days.
            </h4>
            <p className="mt-1 text-xs">
              Choose a day to move {incompleteBlocks.length > 1 ? 'them' : 'it'} to:
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-yellow-700 dark:text-yellow-500 hover:text-yellow-800 -mt-1 -mr-1 flex-shrink-0"
          >
            Dismiss
          </Button>
        </div>

        {/* Day picker */}
        <div className="flex items-center gap-1.5 flex-wrap pl-8">
          {DAY_LABELS.map((day) => (
            <button
              key={day}
              onClick={() => setTargetDay(day)}
              className={[
                'rounded-md px-2.5 py-1 text-xs font-medium border transition-colors',
                targetDay === day
                  ? 'bg-yellow-500 border-yellow-500 text-white dark:bg-yellow-400 dark:border-yellow-400 dark:text-yellow-900'
                  : 'border-yellow-500/40 bg-transparent hover:bg-yellow-500/10',
              ].join(' ')}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="flex justify-end pl-8">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRescheduleAll}
            className="bg-background text-foreground shrink-0 border-yellow-500/50 hover:bg-yellow-500/20"
          >
            Move to {targetDay} <ArrowRight className="w-3 h-3 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
