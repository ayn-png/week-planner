'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlannerStore } from '@/store/plannerStore';
import { X, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WebsiteBlockerSuggest() {
  const { focusMode, blockerSuggestedOffered, setBlockerSuggestedOffered } = usePlannerStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (focusMode && !blockerSuggestedOffered) {
      setOpen(true);
      setBlockerSuggestedOffered(true);
    }
  }, [focusMode, blockerSuggestedOffered, setBlockerSuggestedOffered]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, pointerEvents: 'none' }}
          className="fixed bottom-6 right-6 z-[99999] w-[320px] rounded-xl border border-destructive/20 bg-card p-4 shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Distraction Free</h4>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You&apos;ve entered Focus Mode! We recommend installing a free blocker extension like <strong>Cold Turkey</strong> or <strong>BlockSite</strong> to prevent visits to distracting sites.
              </p>
              <div className="pt-2">
                <Button size="sm" variant="outline" className="w-full text-xs h-7" onClick={() => setOpen(false)}>
                  Got it
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
