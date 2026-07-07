import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { firebaseConfigError, requireDb } from '../firebase';
import { Order, OrderStatus, PaymentStatus } from './types';

const COLLECTION = 'orders';
const ID_PREFIX = 'ORD-';
const META_COLLECTION = 'meta';
const ORDER_COUNTER_DOC = 'orderCounter';

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
 * One-time bootstrap: if `meta/orderCounter` doesn't exist yet (e.g. right
 * after this feature ships, or on a freshly seeded database), scans
 * existing orders once to find the highest ORD-#### number and initializes
 * the counter from it, so numbering continues where seeded/legacy data
 * left off instead of restarting at 1001.
 *
 * This scan-then-init step is NOT itself protected by a transaction (a
 * Firestore transaction can't run a collection query, only reads on known
 * document paths), so if two orders are created in the exact same instant
 * before the counter doc exists, both could seed from the same historical
 * max. That narrow window only matters once - the very first order ever
 * created after this counter is introduced. Every order after that goes
 * through the atomic counter transaction inside createOrder, which is race
 * free.
 */
async function ensureOrderCounterInitialized(db: Firestore) {
  const counterRef = doc(db, META_COLLECTION, ORDER_COUNTER_DOC);
  const counterSnap = await getDoc(counterRef);
  if (counterSnap.exists()) return;

  const snapshot = await getDocs(collection(db, COLLECTION));
  let maxNumber = 1000;
  snapshot.forEach((docSnap) => {
    const match = new RegExp(`^${ID_PREFIX}(\\d+)$`).exec(docSnap.id);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  });

  await setDoc(counterRef, { lastNumber: maxNumber }, { merge: true });
}

/**
 * Creates the order with a race-free, atomically-assigned ORD-#### id, and
 * in the same transaction decrements stock for every line item that came
 * from the catalog (i.e. has a productId - custom/one-off items without
 * one are skipped, since they have no stock count to begin with).
 *
 * Both the ID assignment and the stock check live inside one Firestore
 * transaction:
 * 1. ID assignment - reads meta/orderCounter, computes lastNumber + 1, and
 *    writes the new lastNumber back before committing. Two concurrent
 *    createOrder calls can no longer land on the same ORD-#### id, because
 *    Firestore retries a transaction if the documents it read changed
 *    before it committed.
 * 2. Stock check - re-reads live stock right before committing and, if any
 *    item's requested qty exceeds what's available, rejects the whole
 *    order (nothing is written) with a message naming the item and
 *    remaining stock. Jewellery pieces are frequently unique/low-count, so
 *    overselling isn't just a cosmetic inventory error - it can mean
 *    promising a customer a physical item that doesn't exist.
 */
export async function createOrder(order: OrderWrite) {
  const db = requireDb();
  await ensureOrderCounterInitialized(db);

  const counterRef = doc(db, META_COLLECTION, ORDER_COUNTER_DOC);
  const stockedItems = order.items.filter(
    (item): item is typeof item & { productId: string } => Boolean(item.productId)
  );
  const productRefs = stockedItems.map((item) => doc(db, 'products', item.productId));

  let newId = '';

  await runTransaction(db, async (transaction) => {
    // All reads must happen before any writes in a Firestore transaction.
    const counterSnap = await transaction.get(counterRef);
    const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)));

    const currentNumber = counterSnap.exists() ? ((counterSnap.data().lastNumber as number) ?? 1000) : 1000;
    const nextNumber = currentNumber + 1;
    newId = `${ID_PREFIX}${nextNumber}`;
    const orderRef = doc(db, COLLECTION, newId);

    // Validate every item before writing anything, so a shortage on the
    // second item doesn't leave the first item's stock already
    // decremented. This also computes each item's new stock value once,
    // for the write pass below.
    const newStockByIndex = productSnaps.map((snap, index) => {
      const item = stockedItems[index];
      if (!snap.exists()) {
        throw new Error(`"${item.name}" no longer exists in the catalog - remove it from the order.`);
      }
      const currentStock = (snap.data().stock as number) ?? 0;
      if (currentStock < item.qty) {
        throw new Error(
          `Not enough stock for "${item.name}" - only ${currentStock} left, but ${item.qty} requested.`
        );
      }
      return currentStock - item.qty;
    });

    transaction.set(counterRef, { lastNumber: nextNumber }, { merge: true });

    newStockByIndex.forEach((newStock, index) => {
      transaction.update(productRefs[index], {
        stock: newStock,
        updatedAt: serverTimestamp(),
      });
    });

    transaction.set(orderRef, {
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  return newId;
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