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
  
  useEffect(() => {
    if (dismissed) return;
    
    const todayIndex = (new Date().getDay() + 6) % 7; // Monday=0 ... Sunday=6
    
    // Find past blocks that are incomplete (not strictly 'done')
    // and aren't notes implicitly if we wanted, but we'll flag any 'todo' or undefined
    const pastIncompletes = state.blocks.filter(b => {
      const blockDayIndex = DAY_LABELS.indexOf(b.day);
      const isPast = blockDayIndex < todayIndex;
      return isPast && b.status !== 'done';
    });
    
    setIncompleteBlocks(pastIncompletes);
  }, [state.blocks, dismissed]);

  if (incompleteBlocks.length === 0 || dismissed) return null;

  const handleRescheduleAll = () => {
    const todayIndex = (new Date().getDay() + 6) % 7;
    const currentDay = DAY_LABELS[todayIndex] as DayOfWeek;
    
    incompleteBlocks.forEach(b => {
      dispatch({
        type: 'UPDATE_BLOCK',
        block: {
          ...b,
          day: currentDay,
        }
      });
    });
    setDismissed(true);
  };

  return (
    <div className="mb-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 text-yellow-600 dark:text-yellow-400 relative">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 stroke-yellow-600 dark:stroke-yellow-400" />
        <div className="flex-1">
            <h4 className="font-semibold text-sm">You have {incompleteBlocks.length} incomplete task{incompleteBlocks.length > 1 ? 's' : ''} from past days.</h4>
            <p className="mt-1 text-xs">
                Would you like to move {incompleteBlocks.length > 1 ? 'them' : 'it'} to today's column?
            </p>
        </div>
        <div className="flex gap-2 isolate">
            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)} className="text-yellow-700 dark:text-yellow-500 hover:text-yellow-800">
              Dismiss
            </Button>
            <Button variant="outline" size="sm" onClick={handleRescheduleAll} className="bg-background text-foreground shrink-0 border-yellow-500/50 hover:bg-yellow-500/20">
              Move to Today <ArrowRight className="w-3 h-3 ml-2" />
            </Button>
        </div>
      </div>
    </div>
  );
}
