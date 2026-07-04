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
import { Product } from './types';

const COLLECTION = 'products';

type ProductWrite = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export function useProducts() {
  return useFirestoreCollection<Product>(COLLECTION, [orderBy('name')]);
}

export function useProduct(id: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setProduct(null);
      setLoading(false);
      return undefined;
    }

    if (firebaseConfigError) {
      setProduct(null);
      setLoading(false);
      setError(new Error(firebaseConfigError));
      return undefined;
    }

    setLoading(true);
    setError(null);

    return onSnapshot(
      doc(requireDb(), COLLECTION, id),
      (snapshot) => {
        setProduct(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Product) : null);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError);
        setLoading(false);
      }
    );
  }, [id]);

  return { product, loading, error };
}

export async function createProduct(product: ProductWrite) {
  const ref = await addDoc(collection(requireDb(), COLLECTION), {
    ...product,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(id: string, changes: Partial<ProductWrite>) {
  await updateDoc(doc(requireDb(), COLLECTION, id), {
    ...changes,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string) {
  await deleteDoc(doc(requireDb(), COLLECTION, id));
}

export async function setProduct(id: string, product: ProductWrite) {
  await setDoc(
    doc(requireDb(), COLLECTION, id),
    {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
