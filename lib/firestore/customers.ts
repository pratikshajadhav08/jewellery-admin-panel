import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
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
 * Ensures a customer record exists for the given name, creating one if
 * needed, and bumps their order count / total spent. Called whenever a new
 * order is placed from the New Order screen, so a customer typed there
 * automatically shows up in the Customers tab without a separate manual
 * step.
 *
 * Matching is by exact (trimmed) name, since the order form only captures
 * a name - no customer id. If two different real people share an identical
 * name, they'll be treated as the same customer record; edit manually in
 * the Customers tab if that ever happens.
 */
export async function syncCustomerFromOrder(customerName: string, orderTotal: number) {
  const trimmedName = customerName.trim();
  if (!trimmedName) return;

  const snapshot = await getDocs(
    query(collection(requireDb(), COLLECTION), where('name', '==', trimmedName))
  );

  if (!snapshot.empty) {
    const existingDoc = snapshot.docs[0];
    const existing = existingDoc.data() as CustomerWrite;
    await updateDoc(doc(requireDb(), COLLECTION, existingDoc.id), {
      orders: (existing.orders ?? 0) + 1,
      totalSpent: (existing.totalSpent ?? 0) + orderTotal,
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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}