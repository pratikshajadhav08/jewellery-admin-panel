// lib/firestore/types.ts
// Same shapes your components already expect from data/dummyData, so
// screens/components need minimal changes when switching to Firestore.

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export type FirestoreAuditFields = {
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type OrderItem = {
  name: string;
  qty: number;
  price: number;
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
