import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  deleteDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import type { WeeklyExtras } from '@/types/planner';
import { db } from './config';
import type { WeeklyPlan, Category } from '@/types/planner';

// ─── Week Plans ────────────────────────────────────────────────────────────────

export function subscribeToWeekPlan(
  userId: string,
  weekId: string,
  callback: (plan: WeeklyPlan | null) => void
): Unsubscribe {
  const ref = doc(db, 'users', userId, 'weeklyPlans', weekId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as WeeklyPlan);
    } else {
      callback(null);
    }
  });
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
  return onSnapshot(ref, (snap) => {
    const categories = snap.docs.map((d) => d.data() as Category);
    callback(categories);
  });
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
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as WeeklyExtras);
    } else {
      callback(null);
    }
  });
}

export async function saveWeeklyExtras(userId: string, extras: WeeklyExtras): Promise<void> {
  const ref = doc(db, 'users', userId, 'weeklyExtras', extras.weekId);
  await setDoc(ref, extras);
}
