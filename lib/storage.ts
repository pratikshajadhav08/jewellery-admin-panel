import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { app } from './firebase';

const storage = app ? getStorage(app) : null;

/**
 * Uploads a local file URI (e.g. from expo-image-picker) to Firebase Storage
 * at the given path and returns its public download URL.
 */
export async function uploadImageAsync(uri: string, path: string): Promise<string> {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized. Check your Firebase config.');
  }

  const response = await fetch(uri);
  const blob = await response.blob();

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}