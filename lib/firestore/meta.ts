import { doc, serverTimestamp, setDoc, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { firebaseConfigError, requireDb } from '../firebase';
import { useAuthUser } from '../auth';
import { useOrders } from './orders';
import { useProducts } from './products';
import { AdminProfile, DashboardStats } from './types';
import type { User } from 'firebase/auth';

function toDate(value: unknown): Date | null {
  // Firestore Timestamp objects expose toDate(). A brand-new order's
  // createdAt can briefly be null/undefined client-side too, right after
  // serverTimestamp() is written but before the server-resolved value
  // syncs back down - skip those until they resolve rather than crashing.
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as any).toDate === 'function') {
    return (value as any).toDate();
  }
  return null;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Computes dashboard stats live from the same `orders`/`products` data the
 * rest of the app already streams via onSnapshot, rather than reading a
 * separate `meta/dashboardStats` document that someone has to remember to
 * update by hand. That old approach meant the dashboard silently went
 * stale the moment anyone forgot to call updateDashboardStats after a sale
 * - deriving it from live data removes that entire class of bug.
 *
 * - totalSales / salesChange: sum of this calendar month's order totals
 *   vs. last month's so far, excluding Cancelled orders. Comparing a
 *   partial current month against a (likely fuller) previous month isn't
 *   perfectly apples-to-apples, but it's the same tradeoff any "month to
 *   date" figure makes and is clearly labeled as such on the dashboard.
 * - ordersToday / ordersChange: count of non-cancelled orders placed today
 *   vs. yesterday.
 * - totalProducts / lowStock: pulled directly from live product data. Note
 *   the Dashboard screen (app/(tabs)/index.tsx) currently computes these
 *   two itself from `products` rather than reading them off this object -
 *   they're included here anyway so the returned stats are fully
 *   self-consistent for any other screen that wants a single source of
 *   truth.
 */
export function useDashboardStats() {
  const { data: orders, loading: ordersLoading, error: ordersError } = useOrders();
  const { data: products, loading: productsLoading, error: productsError } = useProducts();

  const loading = ordersLoading || productsLoading;
  const error = ordersError ?? productsError;

  const stats = useMemo<DashboardStats | null>(() => {
    if (loading) return null;

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let totalSalesThisMonth = 0;
    let totalSalesPrevMonth = 0;
    let ordersToday = 0;
    let ordersYesterday = 0;

    for (const order of orders) {
      const createdAt = toDate(order.createdAt);
      if (!createdAt) continue;
      if (order.status === 'Cancelled') continue;

      const amount = order.grandTotal ?? order.total;

      if (createdAt >= monthStart) {
        totalSalesThisMonth += amount;
      } else if (createdAt >= prevMonthStart) {
        totalSalesPrevMonth += amount;
      }

      if (isSameDay(createdAt, now)) {
        ordersToday += 1;
      } else if (isSameDay(createdAt, yesterday)) {
        ordersYesterday += 1;
      }
    }

    return {
      totalSales: totalSalesThisMonth,
      salesChange: percentChange(totalSalesThisMonth, totalSalesPrevMonth),
      ordersToday,
      ordersChange: percentChange(ordersToday, ordersYesterday),
      totalProducts: products.length,
      lowStock: products.filter((product) => product.stock <= 3).length,
    };
  }, [orders, products, loading]);

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

/**
 * @deprecated useDashboardStats() no longer reads this document - it now
 * computes stats live from orders/products (see above). This function is
 * kept only in case something outside this app still writes to
 * meta/dashboardStats; it has no effect on what the Dashboard screen
 * shows. Safe to delete once you've confirmed nothing else calls it -
 * note scripts/seedFirestore.ts still seeds this doc directly and can
 * likely have that step removed too.
 */
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