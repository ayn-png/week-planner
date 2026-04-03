'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlannerStore } from '@/store/plannerStore';
import { getOnboardingStatus } from '@/lib/firebase/firestore';

/**
 * Checks Firestore on mount and starts the onboarding tour
 * if the user hasn't completed it yet.
 */
export function useOnboarding() {
  const { user } = useAuth();
  const { setOnboardingStep, blocksLoading } = usePlannerStore();
  const checked = useRef(false);

  useEffect(() => {
    if (!user || blocksLoading || checked.current) return;
    checked.current = true;

    getOnboardingStatus(user.uid).then((completed) => {
      if (!completed) {
        // Slight delay so the calendar has time to render
        setTimeout(() => setOnboardingStep(0), 800);
      }
    });
  }, [user, blocksLoading, setOnboardingStep]);
}
