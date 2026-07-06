// lib/firestore/types.ts
// Same shapes your components already expect from data/dummyData, so
// screens/components need minimal changes when switching to Firestore.

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Unpaid';

export type FirestoreAuditFields = {
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type OrderItem = {
  name: string;
  qty: number;
  price: number;
  // Optional jewellery pricing breakdown - when present, the invoice shows
  // how `price` was derived instead of just the flat number. `price` itself
  // remains the source of truth for order totals either way.
  weightGrams?: number;
  ratePerGram?: number;
  makingChargePercent?: number;
  wastagePercent?: number;
};

export type Product = FirestoreAuditFields & {
  id: string;
  name: string;
  category: 'Necklace' | 'Ring' | 'Earrings' | 'Bracelet' | string;
  material: string;
  price: number;
  stock: number;
  weight: string;
  sku: string;
  image: string;
  description: string;
};

export type Order = FirestoreAuditFields & {
  id: string;
  date: string;
  customer: string;
  address: string;
  payment: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  // Optional so existing orders (e.g. seeded before this feature existed)
  // don't break - screens fall back to sensible defaults when reading these.
  amountPaid?: number;
  paymentStatus?: PaymentStatus;
  // Old gold exchange / buyback: deducted from the gross item total to
  // produce the actual amount payable by the customer. Payment tracking
  // (amountPaid/paymentStatus/balance due) is based on the net payable
  // amount, not the gross total - GST, however, is calculated on the gross
  // sale value of the new items, unaffected by the exchange.
  exchangeDescription?: string;
  exchangeWeightGrams?: number;
  exchangeRatePerGram?: number;
  exchangeValue?: number;
  // GST added on top of the item total at creation time (metal value taxed
  // at 3%, making/wastage charges taxed at 5% - see computeOrderGst).
  // Payment tracking is based on grandTotal (total + gstAmount), not the
  // raw pre-tax total. Optional so orders created before this existed still
  // work (they fall back to treating total as the full amount owed).
  gstAmount?: number;
  grandTotal?: number;
};

export type Customer = FirestoreAuditFields & {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  joined: string;
  totalSpent: number;
  vip: boolean;
  address?: string;
};

export type DashboardStats = {
  totalSales: number;
  salesChange: number;
  ordersToday: number;
  ordersChange: number;
  totalProducts: number;
  lowStock: number;
};

export type AdminProfile = {
  name: string;
  role: string;
  email: string;
  avatarInitials: string;
  store: string;
};