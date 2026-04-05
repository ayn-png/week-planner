import { NextRequest, NextResponse } from 'next/server';
import { getAdminMessaging, getAdminFirestore } from '@/lib/firebase/admin';
import type { FcmToken } from '@/types/planner';

export const runtime = 'nodejs';

interface SendBody {
  userId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { userId, title, body, url = '/planner', tag = 'week-planner' }: SendBody = await req.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch all FCM tokens for this user
    const db = getAdminFirestore();
    const tokensSnap = await db.collection('users').doc(userId).collection('fcmTokens').get();
    const tokens: string[] = tokensSnap.docs.map((d) => (d.data() as FcmToken).token);

    if (tokens.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No tokens registered' });
    }

    const messaging = getAdminMessaging();
    const result = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: {
        notification: {
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-72.png',
          tag,
          renotify: true,
          requireInteraction: false,
        },
        fcmOptions: { link: url },
      },
      data: { click_action: url, tag },
    });

    // Clean up invalid tokens
    const removals: Promise<void>[] = [];
    result.responses.forEach((resp, idx) => {
      if (
        !resp.success &&
        resp.error?.code === 'messaging/registration-token-not-registered'
      ) {
        const token = tokens[idx];
        // Delete invalid token doc
        const tokenId = Buffer.from(token).toString('base64').slice(0, 32).replace(/[^a-zA-Z0-9]/g, '_');
        removals.push(
          db.collection('users').doc(userId).collection('fcmTokens').doc(tokenId).delete() as Promise<unknown> as Promise<void>
        );
      }
    });
    await Promise.allSettled(removals);

    return NextResponse.json({
      sent: result.successCount,
      failed: result.failureCount,
      removed: removals.length,
    });
  } catch (err) {
    console.error('[/api/notifications/send]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
