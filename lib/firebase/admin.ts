import * as admin from 'firebase-admin';

// Initialize Admin SDK once (singleton pattern for Next.js serverless)
function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!privateKey) throw new Error('FIREBASE_ADMIN_PRIVATE_KEY is not set');

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // Replace literal \n with actual newlines (Vercel stores them as \n)
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

export function getAdminMessaging(): admin.messaging.Messaging {
  return getAdminApp().messaging();
}

export function getAdminFirestore(): admin.firestore.Firestore {
  return getAdminApp().firestore();
}
