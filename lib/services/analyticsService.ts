import { db } from '@/lib/firebase/config';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';

/**
 * Weekly/Daily analytics computation
 */

interface ActivityLog {
  userId: string;
  date: string; // "YYYY-MM-DD"
  activeMinutes: number;
  idleMinutes: number;
  tasksCompleted: number;
  flowSessions: number;
}

export interface Insights {
  totalActiveMinutes: number;
  avgDailyMinutes: number;
  mostProductiveDay: string | null;
  weeklyTrend: { date: string; activeMinutes: number }[];
}

export async function syncActivityLog(
  userId: string,
  activeMinutes: number,
  idleMinutes: number
): Promise<void> {
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

export async function fetchActivityLogs(userId: string): Promise<ActivityLog[]> {
  const logsRef = collection(db, 'users', userId, 'activity_logs');
  const q = query(logsRef, orderBy('date', 'desc'), limit(500));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as ActivityLog);
}

export async function getInsights(userId: string): Promise<Insights> {
  const logs = await fetchActivityLogs(userId);

  if (logs.length === 0) {
    return {
      totalActiveMinutes: 0,
      avgDailyMinutes: 0,
      mostProductiveDay: null,
      weeklyTrend: [],
    };
  }

  const totalActiveMinutes = logs.reduce((sum, l) => sum + (l.activeMinutes ?? 0), 0);
  const avgDailyMinutes = Math.round(totalActiveMinutes / logs.length);

  // Most productive day: the single date with highest activeMinutes
  const mostProductiveLog = logs.reduce<ActivityLog | null>((best, l) => {
    if (!best || l.activeMinutes > best.activeMinutes) return l;
    return best;
  }, null);
  const mostProductiveDay = mostProductiveLog?.date ?? null;

  // Weekly trend: last 7 calendar days (oldest → newest)
  const today = new Date();
  const weeklyTrend: { date: string; activeMinutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const logForDay = logs.find((l) => l.date === dateStr);
    weeklyTrend.push({ date: dateStr, activeMinutes: logForDay?.activeMinutes ?? 0 });
  }

  return {
    totalActiveMinutes,
    avgDailyMinutes,
    mostProductiveDay,
    weeklyTrend,
  };
}
