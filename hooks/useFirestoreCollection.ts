import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, QueryConstraint } from 'firebase/firestore';
import { firebaseConfigError, requireDb } from '../lib/firebase';

export type FirestoreLoadState<T> = {
  data: T[];
  loading: boolean;
  error: Error | null;
};

export function useFirestoreCollection<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): FirestoreLoadState<T> {
  const [state, setState] = useState<FirestoreLoadState<T>>({
    data: [],
    loading: true,
    error: null,
  });
  const constraintKey = useMemo(
    () => constraints.map((constraint) => constraint.type).join('|'),
    [constraints]
  );

  useEffect(() => {
    if (firebaseConfigError) {
      setState({ data: [], loading: false, error: new Error(firebaseConfigError) });
      return undefined;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const collectionQuery = query(collection(requireDb(), collectionName), ...constraints);
      return onSnapshot(
        collectionQuery,
        (snapshot) => {
          const data = snapshot.docs.map((snapshotDoc) => ({
            id: snapshotDoc.id,
            ...snapshotDoc.data(),
          })) as T[];
          setState({ data, loading: false, error: null });
        },
        (error) => {
          setState((current) => ({ ...current, loading: false, error }));
        }
      );
    } catch (error) {
      setState({
        data: [],
        loading: false,
        error: error instanceof Error ? error : new Error('Could not subscribe to Firestore.'),
      });
      return undefined;
    }
    // constraintKey keeps static query constraints stable without re-subscribing on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, constraintKey]);

  return state;
}
