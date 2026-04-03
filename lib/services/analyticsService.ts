/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

/**
 * Weekly/Daily analytics computation
 */

export async function syncActivityLog(userId: string, activeMinutes: number, idleMinutes: number) {
  // Sync to a daily document
  const today = new Date().toISOString().split('T')[0];
  const docRef = doc(db, 'users', userId, 'activity_logs', today);
  
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    await setDoc(docRef, {
      userId,
      date: today,
      activeMinutes,
      idleMinutes,
      tasksCompleted: 0,
      flowSessions: 0,
    });
  } else {
    await updateDoc(docRef, {
      activeMinutes: increment(activeMinutes),
      idleMinutes: increment(idleMinutes),
    });
  }
}

export async function fetchActivityLogs(userId: string) {
  // Can be expanded to fetch 7 days
  return [];
}

export async function getInsights(userId: string) {
  // TODO: Synthesize chart data
  return {
    mostProductiveHours: [],
    timeWasted: 0,
    taskCompletionRate: 0,
  };
}
