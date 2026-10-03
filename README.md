# Aurelia Fine Jewellery — Admin App

A mobile + web admin panel for managing a jewellery store's catalogue, orders, and customers, built with **Expo / React Native** and **Firebase**.

## What it does

This is an internal tool for store staff (not a customer-facing app) to run day-to-day operations. It's deployed as a web app (Vercel) and also runs on mobile via Expo, sharing the same codebase.

- **Dashboard** — a "Store pulse for today" summary greeting the signed-in admin by name, with monthly sales, today's order count, total catalogue size, and a low-stock count, each with a period-over-period % change. Flags a low-stock warning banner when items are running out, and lists recent orders with status and amount.
- **Products** — catalogue grid with search and filters by category (Necklace, Ring, Earrings, Bracelet) and stock status (In Stock / Low Stock / Out of Stock). Each product card shows a photo, material/category, price, and stock count. A product detail page shows material, weight, stock, and description, with Edit and Delete actions. Product images are uploaded to Cloudinary (not Firebase Storage, since Storage requires a paid plan) and stored as public URLs.
- **Orders** — list view filterable by status (Pending / Processing / Shipped / Delivered / Cancelled), each row showing customer, items, date, total, and status. New orders get auto-generated sequential IDs (`ORD-3394`, ...), assigned atomically via a Firestore transaction so concurrent orders never collide. Creating an order also decrements stock for any catalogue items included, with a stock check that rejects the order if there isn't enough left.
- **Old gold exchange** — orders can include an old-gold exchange value that's deducted from the total to get the net amount the customer actually owes, tracked separately from GST (which is still calculated on the gross value of new items).
- **Payments** — tracks amount paid vs. total and derives a payment status (Paid / Partially Paid / Unpaid).
- **Customers** — list of customers with VIP badges, order count, "joined" date, and total spend, searchable by name. Records are automatically created/updated whenever an order is placed, matched by phone number when available (falling back to name matching for walk-ins with no phone).
- **GST invoices** — generates a print-ready PDF invoice per order via `expo-print`, with a proper tax breakdown that splits gold value (3% GST) from making/wastage charges (5% GST), matching how jewellery is actually taxed in India. Shares or prints the PDF via the native share sheet (or the browser print dialog on web).
- **Profile** — shows the signed-in admin's name, role, and email, with an Edit Profile option, Light/Dark mode and Push Notification toggles, and links out to Store Settings and Payment Methods.
- **Admin accounts** — sign-in via Firebase Auth (email/password), with per-admin profile documents (`admins/{uid}`) for name, role, and avatar initials.
- **Theming** — light/dark mode with a system-preference default, togglable from the login screen or Profile, and persisted via Zustand.

## Tech stack

| Layer | Choice |
|---|---|
| App framework | Expo + Expo Router (React Native, runs on iOS/Android/Web) |
| Language | TypeScript |
| Auth | Firebase Authentication (email/password) |
| Database | Cloud Firestore (`products`, `orders`, `customers`, `admins`, `meta`) |
| Image hosting | Cloudinary (unsigned upload preset) |
| State (theme) | Zustand |
| PDF generation | expo-print / expo-sharing |
| Icons | @expo/vector-icons (Feather) |

## Firestore data model

- `products/{id}` — catalogue items (name, category, material, price, stock, weight, SKU, image, description)
- `orders/{id}` — order records (customer, items, pricing/GST breakdown, exchange details, payment status), IDs like `ORD-1001`
- `customers/{id}` — customer profiles (name, phone, email, orders count, total spent, VIP flag)
- `admins/{uid}` — one profile document per signed-in admin, keyed by their Firebase Auth UID
- `meta/orderCounter` — internal counter document used to atomically generate sequential order IDs

## Setup

1. Copy `.env.example` to `.env` and fill in:
   - `EXPO_PUBLIC_FIREBASE_API_KEY`
   - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
   - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `EXPO_PUBLIC_FIREBASE_APP_ID`
   - `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
2. In the Firebase Console, set up Firestore Security Rules requiring a signed-in admin (`request.auth != null`) for `products`, `orders`, `customers`, and `meta`, and scope `admins/{uid}` to its own uid.
3. Create at least one admin user in Firebase Authentication to sign in with.
4. Run the app with your usual Expo commands (`npx expo start`).

## Notes for future maintenance

- `updateDashboardStats()` in `lib/firestore/meta.ts` is deprecated — the dashboard now computes stats live from orders/products. It's kept only because `scripts/seedFirestore.ts` still writes to it; safe to remove once that's cleaned up.
- GST rates (3% on gold value, 5% on making/wastage) and the shop's GSTIN/address are hardcoded in `lib/invoice.ts` — verify these with your accountant before relying on them for compliance, and update the shop details before going live.
