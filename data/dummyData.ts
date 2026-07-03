// Dummy/mock data — swap for real API calls later.

export type Product = {
  id: string;
  name: string;
  category: string;
  material: string;
  price: number;
  stock: number;
  sku: string;
  weight: string;
  image: string;
  description: string;
};

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export type Order = {
  id: string;
  customer: string;
  date: string;
  status: OrderStatus;
  items: { name: string; qty: number; price: number }[];
  total: number;
  address: string;
  payment: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
  joined: string;
  vip: boolean;
};

export const products: Product[] = [
  { id: 'p1', name: 'Antoinette Diamond Necklace', category: 'Necklace', material: '18K Gold', price: 284500, stock: 3, sku: 'AUR-NK-001', weight: '12.4g', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400', description: 'A cascading necklace set with brilliant-cut diamonds along a hand-polished 18K gold chain.' },
  { id: 'p2', name: 'Meridian Sapphire Ring', category: 'Ring', material: 'Platinum', price: 156000, stock: 7, sku: 'AUR-RG-014', weight: '5.1g', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400', description: 'A deep-blue Ceylon sapphire flanked by a pair of pavé diamond shoulders.' },
  { id: 'p3', name: 'Halcyon Pearl Drop Earrings', category: 'Earrings', material: 'Rose Gold', price: 68200, stock: 12, sku: 'AUR-ER-027', weight: '3.2g', image: 'https://images.unsplash.com/photo-1620656798579-1984d9e87df7?w=400', description: 'South Sea pearls suspended from rose gold vine work.' },
  { id: 'p4', name: 'Solstice Tennis Bracelet', category: 'Bracelet', material: '18K Gold', price: 198900, stock: 2, sku: 'AUR-BR-009', weight: '9.8g', image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400', description: 'A continuous line of round-brilliant diamonds in a classic four-prong setting.' },
  { id: 'p5', name: 'Wanderer Signet Ring', category: 'Ring', material: 'Yellow Gold', price: 42500, stock: 15, sku: 'AUR-RG-031', weight: '6.7g', image: 'https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=400', description: 'A weighty, hand-engraved signet with a matte-finished face.' },
  { id: 'p6', name: 'Vesper Emerald Pendant', category: 'Necklace', material: 'White Gold', price: 132000, stock: 0, sku: 'AUR-NK-018', weight: '4.4g', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', description: 'A Colombian emerald pendant with a delicate diamond halo.' },
  { id: 'p7', name: 'Cascade Chandelier Earrings', category: 'Earrings', material: 'Platinum', price: 221000, stock: 4, sku: 'AUR-ER-041', weight: '7.9g', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400', description: 'Tiered diamond chandeliers designed for evening wear.' },
  { id: 'p8', name: 'Aster Bangle Set', category: 'Bracelet', material: 'Rose Gold', price: 89500, stock: 9, sku: 'AUR-BR-022', weight: '14.2g', image: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400', description: 'A stackable set of three hand-hammered bangles.' },
];

export const orders: Order[] = [
  { id: 'ORD-3391', customer: 'Meera Kulkarni', date: '2 Jul 2026', status: 'Pending', items: [{ name: 'Meridian Sapphire Ring', qty: 1, price: 156000 }], total: 156000, address: '14 Shivaji Nagar, Nagpur, MH', payment: 'UPI' },
  { id: 'ORD-3390', customer: 'Rohan Deshmukh', date: '2 Jul 2026', status: 'Processing', items: [{ name: 'Wanderer Signet Ring', qty: 1, price: 42500 }, { name: 'Aster Bangle Set', qty: 1, price: 89500 }], total: 132000, address: '77 Dharampeth, Nagpur, MH', payment: 'Credit Card' },
  { id: 'ORD-3389', customer: 'Ananya Iyer', date: '1 Jul 2026', status: 'Shipped', items: [{ name: 'Halcyon Pearl Drop Earrings', qty: 1, price: 68200 }], total: 68200, address: '9 MG Road, Pune, MH', payment: 'UPI' },
  { id: 'ORD-3388', customer: 'Vikram Nair', date: '30 Jun 2026', status: 'Delivered', items: [{ name: 'Solstice Tennis Bracelet', qty: 1, price: 198900 }], total: 198900, address: '22 Koregaon Park, Pune, MH', payment: 'Net Banking' },
  { id: 'ORD-3387', customer: 'Priya Rao', date: '29 Jun 2026', status: 'Delivered', items: [{ name: 'Antoinette Diamond Necklace', qty: 1, price: 284500 }], total: 284500, address: '5 Banjara Hills, Hyderabad, TS', payment: 'Credit Card' },
  { id: 'ORD-3386', customer: 'Karan Malhotra', date: '28 Jun 2026', status: 'Cancelled', items: [{ name: 'Vesper Emerald Pendant', qty: 1, price: 132000 }], total: 132000, address: '3 Civil Lines, Nagpur, MH', payment: 'UPI' },
  { id: 'ORD-3385', customer: 'Sneha Joshi', date: '27 Jun 2026', status: 'Delivered', items: [{ name: 'Cascade Chandelier Earrings', qty: 1, price: 221000 }], total: 221000, address: '18 Sadar, Nagpur, MH', payment: 'Credit Card' },
];

export const customers: Customer[] = [
  { id: 'c1', name: 'Meera Kulkarni', email: 'meera.k@example.com', phone: '+91 98230 11234', orders: 4, totalSpent: 412000, joined: 'Jan 2025', vip: true },
  { id: 'c2', name: 'Rohan Deshmukh', email: 'rohan.d@example.com', phone: '+91 99870 44521', orders: 2, totalSpent: 132000, joined: 'Mar 2025', vip: false },
  { id: 'c3', name: 'Ananya Iyer', email: 'ananya.iyer@example.com', phone: '+91 90210 88332', orders: 6, totalSpent: 587500, joined: 'Aug 2024', vip: true },
  { id: 'c4', name: 'Vikram Nair', email: 'vikram.nair@example.com', phone: '+91 88880 12987', orders: 1, totalSpent: 198900, joined: 'Jun 2026', vip: false },
  { id: 'c5', name: 'Priya Rao', email: 'priya.rao@example.com', phone: '+91 97654 33210', orders: 3, totalSpent: 340200, joined: 'Nov 2024', vip: false },
  { id: 'c6', name: 'Karan Malhotra', email: 'karan.m@example.com', phone: '+91 96543 22109', orders: 1, totalSpent: 132000, joined: 'Jun 2026', vip: false },
];

export const dashboardStats = {
  totalSales: 1642300,
  salesChange: 12.4,
  ordersToday: 5,
  ordersChange: -2,
  totalProducts: 8,
  lowStock: 3,
};

export const admin = {
  name: 'Ishita Verma',
  role: 'Store Administrator',
  email: 'ishita@aurelia-jewels.com',
  avatarInitials: 'IV',
  store: 'Aurelia Fine Jewellery',
};
