'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { signIn, signUp, signOut, signInWithGoogle } from '@/lib/firebase/auth';
import type { AuthContextValue } from '@/types/auth';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      try {
        setUser(firebaseUser);
        setLoading(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Authentication error';
        console.error('[AuthContext] onAuthStateChanged callback threw:', err);
        setError(message);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    setError,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
