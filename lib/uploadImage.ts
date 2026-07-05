import { Platform } from 'react-native';

/**
 * Uploads a local image (from expo-image-picker) to Cloudinary's free tier
 * using an unsigned upload preset, and returns the public HTTPS URL.
 *
 * Why Cloudinary instead of Firebase Storage: Firebase Storage requires the
 * paid Blaze plan to provision a bucket at all - on the free Spark plan,
 * uploads silently never complete. Cloudinary's free tier needs no billing
 * details and works the same way from web and native.
 *
 * Setup (one-time):
 * 1. Create a free account at https://cloudinary.com
 * 2. Dashboard shows your "Cloud name" - copy it.
 * 3. Settings -> Upload -> Upload presets -> Add upload preset.
 *    Set "Signing Mode" to "Unsigned", save, and copy the preset name.
 * 4. Add to your .env:
 *      EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
 *      EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset-name
 */
export async function uploadImageAsync(uri: string, folder = 'products'): Promise<string> {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Missing Cloudinary config. Add EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and ' +
        'EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your .env (see lib/uploadImage.ts for setup steps).'
    );
  }


  const formData = new FormData();

  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    formData.append('file', blob, 'upload.jpg');
  } else {
    // React Native's fetch/FormData accepts this shape directly on iOS/Android.
    formData.append('file', { uri, type: 'image/jpeg', name: 'upload.jpg' } as unknown as Blob);
  }

  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.secure_url as string;
}