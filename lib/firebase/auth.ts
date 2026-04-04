import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { writeBatch, doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { DEFAULT_CATEGORIES } from '@/types/planner';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

async function seedDefaultCategories(userId: string): Promise<void> {
  // Skip if user already has categories (returning Google user)
  const firstCatRef = doc(db, 'users', userId, 'categories', DEFAULT_CATEGORIES[0].id);
  const exists = await getDoc(firstCatRef);
  if (exists.exists()) return;

  const batch = writeBatch(db);
  for (const category of DEFAULT_CATEGORIES) {
    batch.set(doc(db, 'users', userId, 'categories', category.id), category);
  }
  try {
    await batch.commit();
  } catch (err) {
    // Non-fatal: user is created successfully; categories can be seeded later
    console.error('seedDefaultCategories: failed to write default categories:', err);
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(email: string, password: string): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await seedDefaultCategories(credential.user.uid);
}

export async function signInWithGoogle(): Promise<void> {
  const credential = await signInWithPopup(auth, googleProvider);
  await seedDefaultCategories(credential.user.uid);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
