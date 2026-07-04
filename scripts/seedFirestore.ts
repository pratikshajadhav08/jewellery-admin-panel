import { existsSync, readFileSync } from 'fs';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import { admin, customers, dashboardStats, orders, products } from '../data/dummyData';

function loadDotEnv() {
  if (!existsSync('.env')) return;

  const lines = readFileSync('.env', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex);
    const value = trimmed.slice(equalsIndex + 1).replace(/^"|"$/g, '');
    process.env[key] = process.env[key] ?? value;
  }
}

loadDotEnv();

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.projectId || !firebaseConfig.apiKey || !firebaseConfig.appId) {
  throw new Error('Missing Firebase config. Copy .env.example to .env before running npm run seed.');
}

// Your firestore.rules require request.auth != null on every collection
// (products, customers, orders, meta), so the seed script must sign in as
// a real admin user before writing anything - an unauthenticated client
// write will be rejected with permission-denied.
const seedEmail = process.env.SEED_ADMIN_EMAIL;
const seedPassword = process.env.SEED_ADMIN_PASSWORD;

if (!seedEmail || !seedPassword) {
  throw new Error(
    'Missing SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD in .env. Add credentials for an existing ' +
      'Firebase Auth user (e.g. the same admin account you use to log into the app) so the seed ' +
      'script can authenticate before writing to Firestore.'
  );
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function seed() {
  console.log(`Signing in as ${seedEmail}...`);
  await signInWithEmailAndPassword(auth, seedEmail!, seedPassword!);

  console.log('Seeding products...');
  for (const { id, ...product } of products) {
    await setDoc(doc(db, 'products', id), {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  console.log('Seeding orders...');
  for (const { id, ...order } of orders) {
    await setDoc(doc(db, 'orders', id), {
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  console.log('Seeding customers...');
  for (const { id, ...customer } of customers) {
    await setDoc(doc(db, 'customers', id), {
      ...customer,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  console.log('Seeding dashboard stats and admin profile...');
  await setDoc(doc(db, 'meta', 'dashboardStats'), {
    ...dashboardStats,
    updatedAt: serverTimestamp(),
  });
  await setDoc(doc(db, 'meta', 'admin'), {
    ...admin,
    updatedAt: serverTimestamp(),
  });

  console.log(
    `Done. Seeded ${products.length} products, ${orders.length} orders, and ${customers.length} customers.`
  );
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });