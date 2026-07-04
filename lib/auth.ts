import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { useEffect, useState } from 'react';
import { requireAuth } from './firebase';

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      return onAuthStateChanged(requireAuth(), (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      });
    } catch {
      setUser(null);
      setLoading(false);
      return undefined;
    }
  }, []);

  return { user, loading };
}

export function signInAdmin(email: string, password: string) {
  return signInWithEmailAndPassword(requireAuth(), email.trim(), password);
}

export function signOutAdmin() {
  return signOut(requireAuth());
}

export function sendAdminPasswordReset(email: string) {
  return sendPasswordResetEmail(requireAuth(), email.trim());
}
