'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { requestAndSaveToken, onForegroundMessage } from '@/lib/firebase/messaging';

export type NotificationPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Sync permission state with browser
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as NotificationPermission);
  }, []);

  // Auto-register token if already granted
  useEffect(() => {
    if (!user || permission !== 'granted') return;
    requestAndSaveToken(user.uid).catch((err) =>
      console.error('[useNotifications] token refresh failed:', err)
    );
  }, [user, permission]);

  // Listen for foreground messages
  useEffect(() => {
    if (!user || permission !== 'granted') return;
    unsubscribeRef.current = onForegroundMessage((payload) => {
      const title = payload.notification?.title ?? 'Week Planner';
      const body = payload.notification?.body ?? '';
      toast(title, {
        description: body,
        duration: 6000,
        action: {
          label: 'View',
          onClick: () => window.focus(),
        },
      });
    });
    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [user, permission]);

  const requestPermission = useCallback(async () => {
    if (!user) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      if (result === 'granted') {
        const token = await requestAndSaveToken(user.uid);
        if (token) {
          toast.success('Reminders enabled! You\'ll get notified before your blocks start.');
        }
      } else if (result === 'denied') {
        toast.error('Notifications blocked. Enable them in your browser settings.');
      }
    } catch (err) {
      console.error('[useNotifications] requestPermission failed:', err);
    }
  }, [user]);

  return { permission, requestPermission };
}
