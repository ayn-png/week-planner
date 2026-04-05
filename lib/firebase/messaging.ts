'use client';

import { getApp } from 'firebase/app';
import { getMessaging as getFirebaseMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { saveFcmToken } from './firestore';

let messagingInstance: Messaging | null = null;

export function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (messagingInstance) return messagingInstance;
  try {
    messagingInstance = getFirebaseMessaging(getApp());
    return messagingInstance;
  } catch {
    return null;
  }
}

export async function requestAndSaveToken(userId: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn('[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY not set');
    return null;
  }

  const messaging = getMessagingInstance();
  if (!messaging) return null;

  try {
    // Ensure service worker is registered
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });

    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (token) {
      const device = navigator.userAgent.includes('Mobile') ? 'mobile-web' : 'desktop-web';
      await saveFcmToken(userId, token, device);
      return token;
    }
    return null;
  } catch (err) {
    console.error('[FCM] Failed to get token:', err);
    return null;
  }
}

export function onForegroundMessage(
  callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void
): () => void {
  const messaging = getMessagingInstance();
  if (!messaging) return () => {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return onMessage(messaging, callback as any);
}
