import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  serverTimestamp,
  setDoc,
  updateDoc,
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
 * Ensures a customer record exists for the given name, creating one if
 * needed, and bumps their order count / total spent. Called whenever a new
 * order is placed from the New Order screen, so a customer typed there
 * automatically shows up in the Customers tab without a separate manual
 * step.
 *
 * Matching is case-insensitive on the trimmed name (e.g. "pratiksha" and
 * "Pratiksha" are treated as the same person) - Firestore has no built-in
 * case-insensitive query, so this fetches all customers and compares in
 * JS. Fine for a shop-sized customer list; if that list ever grows very
 * large, switch to a stored lowercase-name field with an indexed query.
 */
export async function syncCustomerFromOrder(customerName: string, orderTotal: number, address?: string) {
  const trimmedName = customerName.trim();
  if (!trimmedName) return;

  const targetLower = trimmedName.toLowerCase();
  const snapshot = await getDocs(collection(requireDb(), COLLECTION));
  const existingDoc = snapshot.docs.find((d) => (d.data().name as string)?.trim().toLowerCase() === targetLower);

  if (existingDoc) {
    const existing = existingDoc.data() as CustomerWrite;
    await updateDoc(doc(requireDb(), COLLECTION, existingDoc.id), {
      orders: (existing.orders ?? 0) + 1,
      totalSpent: (existing.totalSpent ?? 0) + orderTotal,
      // Don't clobber an already-saved address with a possibly one-off
      // delivery address from this particular order.
      ...(!existing.address && address ? { address } : {}),
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await addDoc(collection(requireDb(), COLLECTION), {
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