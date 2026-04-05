import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

// Returns current ISO week ID in format "YYYY-WNN"
function getCurrentWeekId(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((now.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

// Minutes from midnight for a given Date
function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminFirestore();
    const weekId = getCurrentWeekId();
    const nowMinutes = dateToMinutes(new Date());
    const nowHour = new Date().getUTCHours();

    // Get all users by listing all weeklyPlans for current week
    const plansSnap = await db.collectionGroup('weeklyPlans')
      .where('weekId', '==', weekId)
      .get();

    const notifications: Array<{ userId: string; title: string; body: string }> = [];

    // Daily summary at 21:00 UTC
    if (nowHour === 21) {
      for (const planDoc of plansSnap.docs) {
        const userId = planDoc.ref.parent.parent?.id;
        if (!userId) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blocks: any[] = planDoc.data().blocks ?? [];
        const remaining = blocks.filter((b) => b.status !== 'done').length;
        notifications.push({
          userId,
          title: 'Week Planner — Daily Summary',
          body: remaining > 0
            ? `You have ${remaining} block${remaining === 1 ? '' : 's'} remaining today.`
            : 'Great job! All blocks completed today. 🎉',
        });
      }
    } else {
      // Hourly check: notify for blocks starting in the next 60 minutes
      const DAY_MAP: Record<number, string> = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
      const todayLabel = DAY_MAP[new Date().getDay()];

      for (const planDoc of plansSnap.docs) {
        const userId = planDoc.ref.parent.parent?.id;
        if (!userId) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const blocks: any[] = planDoc.data().blocks ?? [];
        const upcoming = blocks.filter((b) => {
          if (b.day !== todayLabel) return false;
          if (b.status === 'done') return false;
          const diff = b.startTime - nowMinutes;
          return diff >= 0 && diff <= 60;
        });

        for (const block of upcoming) {
          const minsUntil = block.startTime - nowMinutes;
          notifications.push({
            userId,
            title: `⏰ Starting ${minsUntil <= 5 ? 'now' : `in ${minsUntil} min`}: ${block.title}`,
            body: `Scheduled for ${Math.floor(block.startTime / 60)}:${String(block.startTime % 60).padStart(2, '0')} — ${block.category}`,
          });
        }
      }
    }

    // Fire notifications
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const results = await Promise.allSettled(
      notifications.map(({ userId, title, body }) =>
        fetch(`${baseUrl}/api/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, title, body }),
        })
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    return NextResponse.json({ checked: plansSnap.size, notified: notifications.length, sent });
  } catch (err) {
    console.error('[/api/notifications/check]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
