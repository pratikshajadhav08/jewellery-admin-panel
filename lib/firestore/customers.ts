import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { firebaseConfigError, requireDb } from '../firebase';
import { Customer } from './types';

const COLLECTION = 'customers';

type CustomerWrite = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;

export function useCustomers() {
  return useFirestoreCollection<Customer>(COLLECTION, [orderBy('name')]);
}

export function useCustomer(id: string | undefined) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setCustomer(null);
      setLoading(false);
      return undefined;
    }

    if (firebaseConfigError) {
      setCustomer(null);
      setLoading(false);
      setError(new Error(firebaseConfigError));
      return undefined;
    }

    setLoading(true);
    setError(null);

    return onSnapshot(
      doc(requireDb(), COLLECTION, id),
      (snapshot) => {
        setCustomer(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Customer) : null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      }
    );
  }, [id]);

  return { customer, loading, error };
}

export async function createCustomer(customer: CustomerWrite) {
  const ref = await addDoc(collection(requireDb(), COLLECTION), {
    ...customer,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCustomer(id: string, changes: Partial<CustomerWrite>) {
  await updateDoc(doc(requireDb(), COLLECTION, id), {
    ...changes,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCustomer(id: string) {
  await deleteDoc(doc(requireDb(), COLLECTION, id));
}

export async function setCustomer(id: string, customer: CustomerWrite) {
  await setDoc(
    doc(requireDb(), COLLECTION, id),
    {
      ...customer,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

function currentJoinedLabel() {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'short' });
  return `${month} ${now.getFullYear()}`;
}

/**
 * Normalizes a phone number down to just digits, dropping a leading Indian
 * country code (91) if present, so "+91 98230 11234", "91-98230-11234",
 * and "9823011234" are all recognized as the same number. Returns null if
 * what's left doesn't look like a real phone number (too short), so
 * callers can safely fall back to name-based matching for blank/garbage
 * input instead of keying a customer record off something meaningless.
 */
export function normalizePhone(phone: string | undefined | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  return digits.length >= 7 ? digits : null;
}

/**
 * Ensures a customer record exists for this order, creating one if needed,
 * and bumps their order count / total spent. Called whenever a new order
 * is placed from the New Order screen, so a customer typed there
 * automatically shows up in the Customers tab without a separate manual
 * step.
 *
 * Matching prefers phone number over name whenever a phone is given, since
 * two different customers can easily share a name (common with Indian
 * names) but essentially never share a phone number:
 *
 * - Phone provided: looks the customer up with an exact-match Firestore
 *   query on the `phone` field (a real indexed query, unlike name matching
 *   - it works regardless of how that customer's document was originally
 *   created/keyed). Existing customers get their orders/totalSpent bumped
 *   via atomic `increment()` writes, which Firestore applies server-side,
 *   so there's no read-modify-write race even without a transaction. If no
 *   existing customer has this phone, a NEW customer record is created
 *   inside a transaction keyed by the normalized phone number itself
 *   (instead of an auto ID) specifically so that two orders placed for the
 *   same brand-new phone number in the same instant can't each slip past
 *   the "not found" check and create a duplicate customer - the
 *   transaction serializes concurrent attempts to write that same
 *   document ID.
 * - No phone provided: falls back to the original case-insensitive
 *   name-match scan (Firestore can't query case-insensitively, so this
 *   fetches all customers and compares in JS). This path is NOT race-free
 *   - two concurrent orders for the same brand-new, phone-less customer
 *   could still create duplicates - but that's an accepted, narrower
 *   limitation for walk-in customers with no phone on file; most real
 *   orders will have one to key off.
 */
export async function syncCustomerFromOrder(
  customerName: string,
  orderTotal: number,
  address?: string,
  phone?: string
) {
  const trimmedName = customerName.trim();
  if (!trimmedName) return;

  const db = requireDb();
  const normalizedPhone = normalizePhone(phone);

  if (normalizedPhone) {
    const existingQuery = query(collection(db, COLLECTION), where('phone', '==', normalizedPhone), limit(1));
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      const existingDoc = existingSnapshot.docs[0];
      const existing = existingDoc.data() as CustomerWrite;
      await updateDoc(doc(db, COLLECTION, existingDoc.id), {
        orders: increment(1),
        totalSpent: increment(orderTotal),
        // Don't clobber an already-saved address with a possibly one-off
        // delivery address from this particular order.
        ...(!existing.address && address ? { address } : {}),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    const phoneDocRef = doc(db, COLLECTION, normalizedPhone);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(phoneDocRef);
      if (snap.exists()) {
        // Someone else's order for this same new phone number won the
        // race and created the doc a moment ago - just bump it instead.
        transaction.update(phoneDocRef, {
          orders: increment(1),
          totalSpent: increment(orderTotal),
          updatedAt: serverTimestamp(),
        });
        return;
      }
      transaction.set(phoneDocRef, {
        name: trimmedName,
        email: '',
        phone: normalizedPhone,
        orders: 1,
        totalSpent: orderTotal,
        joined: currentJoinedLabel(),
        vip: false,
        ...(address ? { address } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    return;
  }

  // No phone given - fall back to the original case-insensitive name scan.
  const targetLower = trimmedName.toLowerCase();
  const snapshot = await getDocs(collection(db, COLLECTION));
  const existingDoc = snapshot.docs.find((d) => (d.data().name as string)?.trim().toLowerCase() === targetLower);

  if (existingDoc) {
    const existing = existingDoc.data() as CustomerWrite;
    await updateDoc(doc(db, COLLECTION, existingDoc.id), {
      orders: increment(1),
      totalSpent: increment(orderTotal),
      ...(!existing.address && address ? { address } : {}),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await addDoc(collection(db, COLLECTION), {
    name: trimmedName,
    email: '',
    phone: '',
    orders: 1,
    totalSpent: orderTotal,
    joined: currentJoinedLabel(),
    vip: false,
    ...(address ? { address } : {}),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Finds a customer by exact case-insensitive name match, for the New Order
 * screen's "existing customer" autocomplete/autofill.
 */
export function findCustomerByName(customers: Customer[], name: string): Customer | undefined {
  const target = name.trim().toLowerCase();
  if (!target) return undefined;
  return customers.find((c) => c.name.trim().toLowerCase() === target);
}