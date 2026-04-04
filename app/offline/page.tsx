'use client';

import { WifiOff, RefreshCw, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-6 text-center max-w-sm"
      >
        {/* Icon stack */}
        <div className="relative">
          <div className="h-24 w-24 rounded-3xl bg-muted/60 border border-border/40 flex items-center justify-center">
            <Calendar className="h-12 w-12 text-muted-foreground/40" />
          </div>
          <div className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full bg-destructive/90 border-2 border-background flex items-center justify-center">
            <WifiOff className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">You&apos;re offline</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Week Planner needs a connection to sync your data. Your previously loaded
            plan may still be available — check below.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <button
            onClick={() => (window.location.href = '/planner')}
            className="flex items-center justify-center gap-2 w-full rounded-xl border border-border/50 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            <Calendar className="h-4 w-4" />
            Open Planner (cached)
          </button>
        </div>

        {/* Tips */}
        <div className="w-full rounded-xl bg-muted/30 border border-border/30 p-4 text-left space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">While offline you can still</p>
          <ul className="space-y-1.5">
            {[
              'View your cached weekly plan',
              'Read block details and notes',
              'Use the Pomodoro timer',
            ].map((tip) => (
              <li key={tip} className="flex items-center gap-2 text-xs text-foreground/80">
                <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
