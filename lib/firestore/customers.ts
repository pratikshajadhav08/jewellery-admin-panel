import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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