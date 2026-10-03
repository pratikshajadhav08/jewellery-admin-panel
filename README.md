# 💎 Aurelia Fine Jewellery — Admin App

An internal admin panel for running a jewellery store: catalogue, orders, customers, payments, and GST invoices. Built with **Expo / React Native** and **Firebase**, one codebase for **iOS, Android, and Web** (deployed on Vercel).

> Staff-only tool. This is not a customer-facing storefront.

**🌐 Live app:** [jewellery-admin-panel.vercel.app](https://jewellery-admin-panel.vercel.app/) (sign-in required)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Firebase Setup](#firebase-setup)
- [Firestore Data Model](#firestore-data-model)
- [How Key Flows Work](#how-key-flows-work)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Maintenance Notes](#maintenance-notes)

---

## Features

### Dashboard
- "Store pulse for today" greeting the signed-in admin by name
- Monthly sales, today's orders, catalogue size, and low-stock count, each with a period-over-period % change
- Low-stock warning banner and a recent orders list with status and amount
- Stats are computed live from orders and products

### Products
- Catalogue grid with search, category filter (Necklace, Ring, Earrings, Bracelet), and stock filter (In Stock / Low Stock / Out of Stock)
- Product cards show photo, material/category, price, and stock
- Detail page with material, weight, stock, description, plus Edit and Delete
- Images uploaded to **Cloudinary** (unsigned preset) and stored as public URLs, so no paid Firebase Storage plan is needed

### Orders
- Filter by status: Pending, Processing, Shipped, Delivered, Cancelled
- Each row shows customer, items, date, total, and status
- Sequential IDs (`ORD-3394`, ...) assigned atomically with a Firestore transaction, so concurrent orders never collide
- Creating an order decrements stock for catalogue items, and rejects the order if stock is insufficient

### Old Gold Exchange
- Orders can include an exchange value, deducted from the total to give the net amount owed
- Tracked separately from GST, which is still calculated on the gross value of the new items

### Payments
- Tracks amount paid vs. total and derives status: **Paid / Partially Paid / Unpaid**

### Customers
- Searchable list with VIP badges, order count, joined date, and total spend
- Created/updated automatically on every order, matched by phone number (falls back to name for walk-ins without a phone)

### GST Invoices
- Print-ready PDF per order via `expo-print`
- Tax breakdown follows Indian jewellery rules: **3% GST on gold value**, **5% on making/wastage charges**
- Shares or prints via the native share sheet (browser print dialog on web)

### Profile & Accounts
- Firebase Auth (email/password), with a profile document per admin (`admins/{uid}`) for name, role, and avatar initials
- Edit profile, Light/Dark mode and push notification toggles, links to Store Settings and Payment Methods

### Theming
- Light/dark mode, defaulting to system preference
- Toggle from the login screen or Profile; persisted with Zustand

---

## Tech Stack

| Layer | Choice |
|---|---|
| App framework | Expo + Expo Router (iOS / Android / Web) |
| Language | TypeScript |
| Auth | Firebase Authentication (email/password) |
| Database | Cloud Firestore |
| Image hosting | Cloudinary (unsigned upload preset) |
| State (theme) | Zustand |
| PDF generation | expo-print, expo-sharing |
| Icons | @expo/vector-icons (Feather) |
| Web hosting | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project (Auth + Firestore enabled)
- A Cloudinary account with an **unsigned** upload preset

### Install and run

```bash
git clone <your-repo-url>
cd <your-repo-folder>
npm install

cp .env.example .env     # then fill in the values below

npx expo start           # press w for web, i for iOS, a for Android
```

### Seed sample data (optional)

```bash
npx ts-node scripts/seedFirestore.ts
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

> `EXPO_PUBLIC_*` values are bundled into the client. That is expected for Firebase config and an unsigned Cloudinary preset, but it means **Firestore Security Rules are your real protection**. Never put secrets here.

---

## Firebase Setup

1. **Authentication**: enable Email/Password and create at least one admin user.
2. **Firestore**: create the database, then add Security Rules. A starting point:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /admins/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    match /{collection}/{doc} {
      allow read, write: if request.auth != null
        && collection in ['products', 'orders', 'customers', 'meta'];
    }
  }
}
```

3. **Admin profile**: each admin needs an `admins/{uid}` document (name, role, avatar initials) matching their Firebase Auth UID.

> Since any signed-in user passes these rules, keep sign-ups closed and only create accounts for real staff.

---

## Firestore Data Model

| Collection | Purpose |
|---|---|
| `products/{id}` | Catalogue items: name, category, material, price, stock, weight, SKU, image URL, description |
| `orders/{id}` | Orders with IDs like `ORD-1001`: customer, items, pricing and GST breakdown, exchange details, payment status |
| `customers/{id}` | Name, phone, email, orders count, total spent, VIP flag |
| `admins/{uid}` | One profile per admin, keyed by Firebase Auth UID |
| `meta/orderCounter` | Internal counter used to generate sequential order IDs |

---

## How Key Flows Work

**Placing an order**
1. A Firestore transaction reads `meta/orderCounter`, increments it, and uses the new value as the order ID.
2. Stock is checked for each catalogue item; if any is short, the order is rejected.
3. Stock is decremented, the order is saved, and the customer record is created or updated (phone match, else name match).

**Pricing an order**
```
GST        = 3% × gold value  +  5% × (making + wastage)     // on gross value of new items
Net owed   = gross total + GST − old-gold exchange value
Payment    = Paid | Partially Paid | Unpaid                   // from amount paid vs. total
```

**Generating an invoice**: `lib/invoice.ts` builds an HTML template, renders it to PDF with `expo-print`, then opens the share sheet (or print dialog on web).

---

## Project Structure

```
├── app/                    # Expo Router screens (dashboard, products, orders, customers, profile)
├── components/             # Shared UI components
├── lib/
│   ├── firestore/          # Firestore helpers (products, orders, customers, meta)
│   ├── invoice.ts          # GST invoice generation (rates + shop details live here)
│   └── ...                 # Firebase init, Cloudinary upload, etc.
├── scripts/
│   └── seedFirestore.ts    # Sample data seeding
├── .env.example
└── README.md
```

> Only `lib/firestore/meta.ts`, `lib/invoice.ts`, and `scripts/seedFirestore.ts` are confirmed paths; adjust the rest to match the repo.

---

## Scripts

| Command | Description |
|---|---|
| `npx expo start` | Start the dev server |
| `npx expo start --web` | Run in the browser |
| `npx expo export -p web` | Build the static web bundle to `dist/` |
| `npx ts-node scripts/seedFirestore.ts` | Seed Firestore with sample data |

---

## Deployment

**Web (Vercel)**
- Build command: `npx expo export -p web`
- Output directory: `dist`
- Add all `EXPO_PUBLIC_*` variables in the Vercel project settings.

**Mobile**: build with EAS (`eas build`) or run via Expo Go during development.

Pre-launch checklist:
- [ ] Firestore Security Rules published
- [ ] Sign-ups restricted to real staff accounts
- [ ] Shop name, address, and GSTIN updated in `lib/invoice.ts`
- [ ] GST rates confirmed with your accountant
- [ ] Cloudinary upload preset restricted (allowed formats, folder, size limits)

---

## Maintenance Notes

- **`updateDashboardStats()`** in `lib/firestore/meta.ts` is deprecated. The dashboard now computes stats live from orders and products. It stays only because `scripts/seedFirestore.ts` still writes to it, and is safe to remove once the seed script is cleaned up.
- **GST rates and shop details** (3% gold, 5% making/wastage, GSTIN, address) are hardcoded in `lib/invoice.ts`. Verify them with your accountant before relying on invoices for compliance, and update the shop details before going live.
