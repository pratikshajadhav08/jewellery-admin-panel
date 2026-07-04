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
import { Order, OrderStatus } from './types';

const COLLECTION = 'orders';

type OrderWrite = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;

export function useOrders() {
  return useFirestoreCollection<Order>(COLLECTION, [orderBy('createdAt', 'desc')]);
}

export function useOrder(id: string | undefined) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setOrder(null);
      setLoading(false);
      return undefined;
    }

    if (firebaseConfigError) {
      setOrder(null);
      setLoading(false);
      setError(new Error(firebaseConfigError));
      return undefined;
    }

    setLoading(true);
    setError(null);

    return onSnapshot(
      doc(requireDb(), COLLECTION, id),
      (snapshot) => {
        setOrder(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Order) : null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      }
    );
  }, [id]);

  return { order, loading, error };
}

export async function createOrder(order: OrderWrite) {
  const ref = await addDoc(collection(requireDb(), COLLECTION), {
    ...order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  await updateDoc(doc(requireDb(), COLLECTION, id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function updateOrder(id: string, changes: Partial<OrderWrite>) {
  await updateDoc(doc(requireDb(), COLLECTION, id), {
    ...changes,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteOrder(id: string) {
  await deleteDoc(doc(requireDb(), COLLECTION, id));
}

export async function setOrder(id: string, order: OrderWrite) {
  await setDoc(
    doc(requireDb(), COLLECTION, id),
    {
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
