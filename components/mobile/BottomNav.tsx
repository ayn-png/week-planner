'use client';

import { CalendarDays, LayoutDashboard, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AppView } from '@/components/layout/TopBar';

interface BottomNavProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  onGoals: () => void;
}

const tabs = [
  { id: 'calendar' as AppView, label: 'Calendar', icon: CalendarDays },
  { id: 'dashboard' as AppView, label: 'Dashboard', icon: LayoutDashboard },
];

export function BottomNav({ activeView, onViewChange, onGoals }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md safe-bottom">
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeView === id;
        return (
          <motion.button
            key={id}
            onClick={() => onViewChange(id)}
            whileTap={{ scale: 0.92 }}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label={label}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
            {isActive && (
              <motion.div
                layoutId="bottom-nav-indicator"
                className="absolute top-0 h-0.5 w-12 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}

      {/* Goals tab */}
      <motion.button
        onClick={onGoals}
        whileTap={{ scale: 0.92 }}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Goals"
      >
        <Target className="h-5 w-5" />
        <span className="text-[10px] font-medium">Goals</span>
      </motion.button>
    </nav>
  );
}
