'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { usePlannerStore } from '@/store/plannerStore';
import { useAuth } from '@/hooks/useAuth';
import { syncActivityLog } from '@/lib/services/analyticsService';

const IDLE_TIMEOUT_MS = 60000; // 1 minute without interaction = idle
const SYNC_INTERVAL_MS = 5 * 60000; // Sync to Database every 5 minutes
const MAX_SYNC_RETRIES = 3;

export function useActivityTracker() {
  const { user } = useAuth();
  const { incrementActiveMinutes, incrementIdleMinutes } = usePlannerStore();

  const lastActiveRef = useRef<number>(Date.now());
  const pendingActiveCount = useRef<number>(0);
  const pendingIdleCount = useRef<number>(0);
  // Retry tracking
  const syncRetryCount = useRef<number>(0);
  const syncToastedRef = useRef<boolean>(false);
  
  // Track interactions
  useEffect(() => {
    const handleActivity = () => {
      lastActiveRef.current = Date.now();
    };

    // Attach to document to cover the whole page safely
    document.addEventListener('mousemove', handleActivity, { passive: true });
    document.addEventListener('keydown', handleActivity, { passive: true });
    document.addEventListener('click', handleActivity, { passive: true });
    document.addEventListener('scroll', handleActivity, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('scroll', handleActivity);
    };
  }, []);

  // Minute-by-minute tick
  useEffect(() => {
    const timer = setInterval(() => {
      const timeSinceLastActive = Date.now() - lastActiveRef.current;
      if (timeSinceLastActive < IDLE_TIMEOUT_MS) {
        incrementActiveMinutes();
        pendingActiveCount.current += 1;
      } else {
        incrementIdleMinutes();
        pendingIdleCount.current += 1;
      }
    }, 60000); // Check every minute

    return () => clearInterval(timer);
  }, [incrementActiveMinutes, incrementIdleMinutes]);

  // Periodic Firestore sync
  useEffect(() => {
    if (!user) return;

    const syncTimer = setInterval(() => {
      // Stop retrying after MAX_SYNC_RETRIES consecutive failures
      if (syncRetryCount.current >= MAX_SYNC_RETRIES) return;

      const activeToAdd = pendingActiveCount.current;
      const idleToAdd = pendingIdleCount.current;

      if (activeToAdd > 0 || idleToAdd > 0) {
        // Reset local accumulators BEFORE sync to ensure we don't double-count
        // if sync fails temporarily — counts are restored in catch.
        pendingActiveCount.current = 0;
        pendingIdleCount.current = 0;

        syncActivityLog(user.uid, activeToAdd, idleToAdd)
          .then(() => {
            // Successful sync — reset retry counter
            syncRetryCount.current = 0;
            syncToastedRef.current = false;
          })
          .catch((err: unknown) => {
            console.error('[useActivityTracker] sync failed:', err);
            // Restore counts so next tick can retry
            pendingActiveCount.current += activeToAdd;
            pendingIdleCount.current += idleToAdd;

            syncRetryCount.current += 1;
            // Show the toast exactly once when we hit the retry limit
            if (syncRetryCount.current >= MAX_SYNC_RETRIES && !syncToastedRef.current) {
              syncToastedRef.current = true;
              toast.error('Activity sync failed');
            }
          });
      }
    }, SYNC_INTERVAL_MS);

    return () => clearInterval(syncTimer);
  }, [user]);
}
