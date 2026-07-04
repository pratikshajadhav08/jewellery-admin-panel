import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { firebaseConfigError, requireDb } from '../firebase';
import { useAuthUser } from '../auth';
import { AdminProfile, DashboardStats } from './types';
import type { User } from 'firebase/auth';

function useMetaDoc<T>(id: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (firebaseConfigError) {
      setData(null);
      setLoading(false);
      setError(new Error(firebaseConfigError));
      return undefined;
    }

    setLoading(true);
    setError(null);

    return onSnapshot(
      doc(requireDb(), 'meta', id),
      (snapshot) => {
        setData(snapshot.exists() ? (snapshot.data() as T) : null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      }
    );
  }, [id]);

  return { data, loading, error };
}

export function useDashboardStats() {
  const { data: stats, loading, error } = useMetaDoc<DashboardStats>('dashboardStats');
  return { stats, loading, error };
}

function initialsFromName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Used whenever the signed-in user doesn't have an `admins/{uid}` profile
// document yet, so the UI always reflects *whoever is actually logged in*
// instead of silently falling back to stale/shared data.
function fallbackProfile(user: User): AdminProfile {
  const name = user.displayName || user.email?.split('@')[0] || 'Admin';
  return {
    name,
    role: 'Administrator',
    email: user.email ?? '',
    avatarInitials: initialsFromName(name) || 'A',
    store: 'Aurelia Fine Jewellery',
  };
}

// Admin profile is keyed by the signed-in user's uid (admins/{uid}), not a
// single shared document, so switching Firebase Auth accounts actually
// changes what's shown.
export function useAdmin() {
  const { user, loading: userLoading } = useAuthUser();
  const uid = user?.uid;

  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (userLoading) return undefined;

    if (!user || !uid) {
      setAdmin(null);
      setLoading(false);
      return undefined;
    }

    if (firebaseConfigError) {
      setAdmin(fallbackProfile(user));
      setLoading(false);
      setError(new Error(firebaseConfigError));
      return undefined;
    }

    setLoading(true);
    setError(null);

    return onSnapshot(
      doc(requireDb(), 'admins', uid),
      (snapshot) => {
        setAdmin(snapshot.exists() ? (snapshot.data() as AdminProfile) : fallbackProfile(user));
        setLoading(false);
      },
      (snapshotError) => {
        // Even if the profile doc read fails (e.g. rules not deployed yet),
        // still show something correct rather than nothing.
        setAdmin(fallbackProfile(user));
        setError(snapshotError);
        setLoading(false);
      }
    );
  }, [uid, userLoading]);

  return { admin, loading: loading || userLoading, error };
}

export async function updateDashboardStats(changes: Partial<DashboardStats>) {
  await setDoc(
    doc(requireDb(), 'meta', 'dashboardStats'),
    { ...changes, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function updateAdmin(uid: string, changes: Partial<AdminProfile>) {
  await setDoc(
    doc(requireDb(), 'admins', uid),
    { ...changes, updatedAt: serverTimestamp() },
    { merge: true }
  );
}