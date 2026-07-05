import {
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
import { Order, OrderStatus, PaymentStatus } from './types';

const COLLECTION = 'orders';
const ID_PREFIX = 'ORD-';

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

/**
 * Finds the highest existing "ORD-####" number across all orders and
 * returns the next one in sequence (e.g. ORD-3385, ORD-3386 -> ORD-3387).
 * Falls back to ORD-1001 if no orders with this pattern exist yet.
 */
async function generateOrderId(): Promise<string> {
  const snapshot = await getDocs(collection(requireDb(), COLLECTION));
  let maxNumber = 1000;

  snapshot.forEach((docSnap) => {
    const match = new RegExp(`^${ID_PREFIX}(\\d+)$`).exec(docSnap.id);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  });

  return `${ID_PREFIX}${maxNumber + 1}`;
}

export async function createOrder(order: OrderWrite) {
  const id = await generateOrderId();
  await setDoc(doc(requireDb(), COLLECTION, id), {
    ...order,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return id;
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

/**
 * The gross item total minus any old gold exchange value is what the
 * customer actually owes. Payment tracking (amountPaid/paymentStatus/
 * balance due) is based on this net figure, not the gross total - GST
 * stays calculated on the gross sale value regardless of any exchange.
 */
export function computeNetPayable(total: number, exchangeValue: number | undefined): number {
  return Math.max(total - (exchangeValue ?? 0), 0);
}

/**
 * Derives a payment status from how much has been paid vs. the order total.
 * Used both when creating an order (with an initial advance) and whenever a
 * new payment is recorded against an existing order.
 */
export function computePaymentStatus(amountPaid: number, total: number): PaymentStatus {
  if (amountPaid <= 0) return 'Unpaid';
  if (amountPaid >= total) return 'Paid';
  return 'Partially Paid';
}

/**
 * Records a new total amount paid against an order (e.g. after the customer
 * pays another installment) and recomputes its payment status accordingly.
 */
export async function recordPayment(id: string, newAmountPaid: number, total: number) {
  const paymentStatus = computePaymentStatus(newAmountPaid, total);
  await updateOrder(id, { amountPaid: newAmountPaid, paymentStatus });
}