import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  collection,
  deleteDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import type { WeeklyExtras, FcmToken } from '@/types/planner';
import { db } from './config';
import type { WeeklyPlan, Category } from '@/types/planner';

// ─── Week Plans ────────────────────────────────────────────────────────────────

export function subscribeToWeekPlan(
  userId: string,
  weekId: string,
  callback: (plan: WeeklyPlan | null) => void
): Unsubscribe {
  const ref = doc(db, 'users', userId, 'weeklyPlans', weekId);
  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      const data = snap.data();
      if (
        data &&
        typeof data.weekId === 'string' &&
        Array.isArray(data.blocks)
      ) {
        callback(data as WeeklyPlan);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.error(`[Firestore] weeklyPlans listener error for ${userId}/${weekId}:`, err.code, err.message);
      callback(null);
    }
  );
}

export async function saveWeekPlan(userId: string, plan: WeeklyPlan): Promise<void> {
  const ref = doc(db, 'users', userId, 'weeklyPlans', plan.weekId);
  await setDoc(ref, plan);
}

// ─── Categories ────────────────────────────────────────────────────────────────

export function subscribeToCategories(
  userId: string,
  callback: (categories: Category[]) => void
): Unsubscribe {
  const ref = collection(db, 'users', userId, 'categories');
  return onSnapshot(
    ref,
    (snap) => {
      const categories = snap.docs.map((d) => d.data() as Category);
      callback(categories);
    },
    (err) => {
      console.error(`[Firestore] categories listener error for ${userId}:`, err.code, err.message);
    }
  );
}

export async function saveCategory(userId: string, category: Category): Promise<void> {
  const ref = doc(db, 'users', userId, 'categories', category.id);
  await setDoc(ref, category);
}

export async function deleteCategory(userId: string, categoryId: string): Promise<void> {
  const ref = doc(db, 'users', userId, 'categories', categoryId);
  await deleteDoc(ref);
}

// ─── Onboarding Metadata ───────────────────────────────────────────────────────

export async function getOnboardingStatus(userId: string): Promise<boolean> {
  try {
    const ref = doc(db, 'users', userId, 'metadata', 'onboarding');
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    return (snap.data() as { hasCompletedOnboarding?: boolean }).hasCompletedOnboarding ?? false;
  } catch {
    return false;
  }
}

export async function completeOnboarding(userId: string): Promise<void> {
  try {
    const ref = doc(db, 'users', userId, 'metadata', 'onboarding');
    await setDoc(ref, { hasCompletedOnboarding: true }, { merge: true });
  } catch {
    // Silently ignore — Firestore rules may not include the metadata collection yet.
  }
}

// ─── Weekly Extras (Dashboard: todos, goals, notes) ────────────────────────────

export function subscribeToWeeklyExtras(
  userId: string,
  weekId: string,
  callback: (extras: WeeklyExtras | null) => void
): Unsubscribe {
  const ref = doc(db, 'users', userId, 'weeklyExtras', weekId);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as WeeklyExtras);
      } else {
        callback(null);
      }
    },
    (err) => {
      console.error(`[Firestore] weeklyExtras listener error for ${userId}/${weekId}:`, err.code, err.message);
      callback(null);
    }
  );
}

export async function saveWeeklyExtras(userId: string, extras: WeeklyExtras): Promise<void> {
  const ref = doc(db, 'users', userId, 'weeklyExtras', extras.weekId);
  await setDoc(ref, extras);
}

// ─── FCM Tokens ────────────────────────────────────────────────────────────────

export async function saveFcmToken(userId: string, token: string, device: string): Promise<void> {
  // Use a hash of the token as the document ID to deduplicate
  const tokenId = btoa(token).slice(0, 32).replace(/[^a-zA-Z0-9]/g, '_');
  const ref = doc(db, 'users', userId, 'fcmTokens', tokenId);
  await setDoc(ref, {
    token,
    device,
    createdAt: Date.now(),
    lastUsed: Date.now(),
  } satisfies FcmToken, { merge: true });
}

export async function removeFcmToken(userId: string, token: string): Promise<void> {
  const tokenId = btoa(token).slice(0, 32).replace(/[^a-zA-Z0-9]/g, '_');
  const ref = doc(db, 'users', userId, 'fcmTokens', tokenId);
  await deleteDoc(ref);
}

export async function getFcmTokens(userId: string): Promise<FcmToken[]> {
  const ref = collection(db, 'users', userId, 'fcmTokens');
  const snap = await getDocs(ref);
  return snap.docs.map((d) => d.data() as FcmToken);
}
