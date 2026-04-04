import type { User } from 'firebase/auth';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}
