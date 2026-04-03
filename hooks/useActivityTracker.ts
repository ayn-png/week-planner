'use client';

import { useEffect, useRef } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { useAuth } from '@/hooks/useAuth';
import { syncActivityLog } from '@/lib/services/analyticsService';

const IDLE_TIMEOUT_MS = 60000; // 1 minute without interaction = idle
const SYNC_INTERVAL_MS = 5 * 60000; // Sync to Database every 5 minutes

export function useActivityTracker() {
  const { user } = useAuth();
  const { incrementActiveMinutes, incrementIdleMinutes } = usePlannerStore();
  
  const lastActiveRef = useRef<number>(Date.now());
  const pendingActiveCount = useRef<number>(0);
  const pendingIdleCount = useRef<number>(0);
  
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
      const activeToAdd = pendingActiveCount.current;
      const idleToAdd = pendingIdleCount.current;
      
      if (activeToAdd > 0 || idleToAdd > 0) {
        // Reset local accumulators BEFORE sync to ensure we don't double count if sync fails temporarily
        pendingActiveCount.current = 0;
        pendingIdleCount.current = 0;
        
        syncActivityLog(user.uid, activeToAdd, idleToAdd).catch((err: unknown) => {
          console.error("Failed to sync activity log:", err);
          // Restore counts if failed so we can retry next tick
          pendingActiveCount.current += activeToAdd;
          pendingIdleCount.current += idleToAdd;
        });
      }
    }, SYNC_INTERVAL_MS);
    
    return () => clearInterval(syncTimer);
  }, [user]);
}
