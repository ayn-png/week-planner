'use client';

import { AuthProvider } from '@/context/AuthContext';
import { PlannerProvider } from '@/context/PlannerContext';
import { TooltipProvider } from '@/components/ui/tooltip';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <PlannerProvider>
        <TooltipProvider delay={300}>
          {children}
        </TooltipProvider>
      </PlannerProvider>
    </AuthProvider>
  );
}
