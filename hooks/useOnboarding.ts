'use client';

import { useEffect, useRef, useCallback } from 'react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { usePlannerStore } from '@/store/plannerStore';

/**
 * Checks Firestore on mount and starts the onboarding tour
 * if the user hasn't completed it yet. Writes completion status
 * back to Firestore when the tour finishes.
 */
export function useOnboarding() {
  const { user } = useAuth();
  const { setOnboardingStep, onboardingStep, blocksLoading } = usePlannerStore();
  const checked = useRef(false);
  // Track previous step so we can detect when onboarding transitions to null (complete)
  const prevStepRef = useRef<number | null>(null);

  // Read completion status from Firestore on mount (source of truth)
  useEffect(() => {
    if (!user || blocksLoading || checked.current) return;
    checked.current = true;

    const onboardingRef = doc(db, 'users', user.uid, 'metadata', 'onboarding');

    getDoc(onboardingRef)
      .then((snap) => {
        if (!snap.exists()) {
          // No Firestore record — start the tour after the calendar renders
          setTimeout(() => setOnboardingStep(0), 800);
          return;
        }
        const data = snap.data() as { completed?: boolean; hasCompletedOnboarding?: boolean };
        const isDone = data.completed === true || data.hasCompletedOnboarding === true;
        if (!isDone) {
          setTimeout(() => setOnboardingStep(0), 800);
        }
      })
      .catch((err) => {
        console.error('[useOnboarding] failed to read status from Firestore:', err);
        // Fall back: do not start tour if we cannot verify status
      });
  }, [user, blocksLoading, setOnboardingStep]);

  // Write completion to Firestore when onboarding finishes (step transitions to null)
  const writeCompletion = useCallback(
    async (userId: string) => {
      try {
        const onboardingRef = doc(db, 'users', userId, 'metadata', 'onboarding');
        await setDoc(
          onboardingRef,
          { completed: true, completedAt: serverTimestamp() },
          { merge: true }
        );
      } catch (err) {
        console.error('[useOnboarding] failed to write completion to Firestore:', err);
      }
    },
    []
  );

  useEffect(() => {
    // Detect transition from a valid step number to null — that means the tour completed
    if (prevStepRef.current !== null && onboardingStep === null && user) {
      writeCompletion(user.uid);
    }
    prevStepRef.current = onboardingStep;
  }, [onboardingStep, user, writeCompletion]);
}
