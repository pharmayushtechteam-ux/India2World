/**
 * India2World Integrated Data Service
 * 
 * Unifies the Customer-Facing Website and Admin Panel into one cohesive system:
 * - Shared, persistent data store (localStorage + reactive CustomEvents + StorageEvent for cross-tab sync)
 * - Customer registration and profile management with locker IDs
 * - Automatic purchase request intake, status tracking, and admin alerts
 * - Order lifecycle management (Requests -> Quotations -> Payments -> Orders -> Procurement)
 * - Warehouse package intake and real-time reflection in customer lockers
 * - Consolidation, dispatch, carrier tracking, and delivery updates
 * - Customer data isolation (customers only see their own records)
 * - Dynamic metrics & analytics calculation for Admin & Customer dashboards
 * - Support ticket exchange and notification center
 */

import {
  AdminCustomer,
  AdminPurchaseRequest,
  AdminProductItem,
  CostSummary,
  AdminIncomingPackage,
  AdminShipment,
} from '../types/admin';
export type IntegratedPurchaseRequest = AdminPurchaseRequest;
export type { AdminIncomingPackage, AdminShipment };
import { ProductItem, WarehousePackage, ShipmentItem, PurchaseRequest } from '../types';
import {
  ADMIN_CUSTOMERS as SEED_ADMIN_CUSTOMERS,
  INITIAL_PURCHASE_REQUESTS as SEED_PURCHASE_REQUESTS,
  INITIAL_INCOMING_PACKAGES as SEED_INCOMING_PACKAGES,
  INITIAL_SHIPMENTS as SEED_SHIPMENTS,
} from './adminMockData';
import {
  samplePurchaseRequests as SEED_CUSTOMER_REQUESTS,
  sampleWarehousePackages as SEED_CUSTOMER_PACKAGES,
  sampleShipments as SEED_CUSTOMER_SHIPMENTS,
} from '../data/mockData';
import { UserProfile, getCurrentUser, deriveCustomerIdFromEmail } from '../utils/userAuth';
import {
  getAllInvoices,
  getInvoicesForCustomer,
  CustomerOrderInvoice,
  createOrderAndAutomateInvoice,
  lookupRegisteredCustomer,
} from './orderInvoiceService';
import { triggerOrderConfirmationEmail } from './orderConfirmationService';


// Storage keys
export const STORAGE_CUSTOMERS_KEY = 'i2w_integrated_customers_v2';
export const STORAGE_REQUESTS_KEY = 'i2w_integrated_requests_v2';
export const STORAGE_ORDERS_KEY = 'i2w_integrated_orders_v2';
export const STORAGE_PACKAGES_KEY = 'i2w_integrated_packages_v2';
export const STORAGE_SHIPMENTS_KEY = 'i2w_integrated_shipments_v2';
export const STORAGE_PAYMENTS_KEY = 'i2w_integrated_payments_v2';
export const STORAGE_REFUNDS_KEY = 'i2w_integrated_refunds_v2';
export const STORAGE_NOTIFICATIONS_KEY = 'i2w_integrated_notifications_v2';
export const STORAGE_SUPPORT_KEY = 'i2w_integrated_support_v2';
export const STORAGE_AUDIT_LOG_KEY = 'i2w_integrated_audit_v2';

// Global reactive event name
export const DATA_SYNC_EVENT = 'i2w-data-synchronized';

export interface AdminNotification {
  id: string;
  type: 'customer' | 'request' | 'order' | 'package' | 'shipment' | 'support' | 'payment';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  linkTab?: string;
  referenceId?: string;
}

export interface IntegratedOrderRecord {
  id: string; // ORD-XXXXX
  requestId?: string; // Linked REQ-XXXXX
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAvatar: string;
  destination: string;
  destinationFlag: string;
  orderType: 'Assisted Purchase (Buy For Me)' | 'Self-Ship Forwarding';
  stores: string[];
  itemCount: number;
  totalINR: number;
  paymentStatus: 'Paid' | 'Pending Balance' | 'Refunded';
  orderStatus: 'Procuring' | 'In Warehouse' | 'Consolidating' | 'Dispatched' | 'Delivered';
  createdAt: string;
  trackingAwb?: string;
  items: Array<{ title: string; store: string; price: number; qty: number; imageUrl?: string }>;
  costSummary?: {
    subtotal: number;
    domesticShipping: number;
    serviceFee: number;
    tax: number;
    discount: number;
    total: number;
  };
  confirmationEmailStatus?: 'Sent' | 'Failed' | 'Pending';
  confirmationEmailSentAt?: string;
  confirmationEmailError?: string;
  confirmationEmailAttempts?: number;
}

export interface SupportTicketRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  subject: string;
  category: string;
  referenceId?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
  lastReply: string;
  messages: Array<{
    id: string;
    sender: 'user' | 'support';
    name: string;
    text: string;
    time: string;
  }>;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  targetId: string;
  details: string;
}

// -------------------------------------------------------------
// Helper to emit sync event across windows and listeners
// -------------------------------------------------------------
export function emitDataSync(entityType: string, payload?: any): void {
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(DATA_SYNC_EVENT, {
          detail: { entityType, payload, timestamp: Date.now() },
        })
      );
    }
  } catch (err) {
    console.warn('Could not dispatch data sync event', err);
  }
}

// -------------------------------------------------------------
// 1. CUSTOMERS MANAGEMENT
// -------------------------------------------------------------
export function deduplicateCustomers(customers: AdminCustomer[]): AdminCustomer[] {
  const seenIds = new Set<string>();
  const seenEmails = new Set<string>();
  const cleaned: AdminCustomer[] = [];

  for (const c of customers) {
    if (!c || !c.id) continue;
    let emailNorm = (c.email || '').trim().toLowerCase();
    let idNorm = (c.id || '').trim();

    // Fix legacy collision: Priya Sharma is CUS-10028 with priya.sharma@example.com
    if (c.name?.toLowerCase() === 'priya sharma') {
      emailNorm = 'priya.sharma@example.com';
      idNorm = 'CUS-10028';
      c.email = 'priya.sharma@example.com';
      c.id = 'CUS-10028';
    }

    // Fix legacy collision: John Doe is CUS-10001 with john@example.com
    if (c.name?.toLowerCase() === 'john doe' && (idNorm === 'CUS-10028' || emailNorm === 'john@example.com')) {
      emailNorm = 'john@example.com';
      idNorm = 'CUS-10001';
      c.email = 'john@example.com';
      c.id = 'CUS-10001';
    }

    // Deduplicate: If ID or Email already registered, skip duplicate registration
    if (seenIds.has(idNorm) || (emailNorm && seenEmails.has(emailNorm))) {
      continue;
    }

    seenIds.add(idNorm);
    if (emailNorm) seenEmails.add(emailNorm);
    cleaned.push(c);
  }

  return cleaned;
}

function syncRegisteredUsersToCustomers(customers: AdminCustomer[]): AdminCustomer[] {
  try {
    const regUsersRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('i2w_registered_users') : null;
    const currentUserRaw = typeof localStorage !== 'undefined' ? localStorage.getItem('i2w_current_user') : null;
    const existingIds = new Set(customers.map((c) => c.id));
    const existingEmails = new Set(customers.map((c) => (c.email || '').toLowerCase()));
    let modified = false;
    const result = [...customers];

    const processProfile = (profile: any) => {
      if (!profile || !profile.email) return;
      const emailLower = profile.email.toLowerCase();
      const customerId = profile.customerId || deriveCustomerIdFromEmail(profile.email);

      // Do not duplicate if email or ID already exists
      if (!existingEmails.has(emailLower) && !existingIds.has(customerId)) {
        result.unshift({
          id: customerId,
          name: profile.name || 'Customer',
          email: profile.email,
          phone: profile.phone || '+91 98765 43210',
          country: profile.country || 'United Arab Emirates',
          city: profile.countryCode === 'AE' ? 'Dubai' : 'International City',
          totalOrders: 0,
          totalSpentINR: 0,
          status: 'Active',
          avatar: profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name || 'Customer')}`,
          joinedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        });
        existingIds.add(customerId);
        existingEmails.add(emailLower);
        modified = true;
      }
    };

    if (currentUserRaw) {
      try {
        processProfile(JSON.parse(currentUserRaw));
      } catch {}
    }

    if (regUsersRaw) {
      try {
        const parsed = JSON.parse(regUsersRaw);
        Object.values(parsed).forEach(processProfile);
      } catch {}
    }

    if (modified && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(result));
    }
    return result;
  } catch {
    return customers;
  }
}

export function getAllCustomers(): AdminCustomer[] {
  let list: AdminCustomer[] = [];
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_CUSTOMERS_KEY) : null;
    if (raw) {
      const parsed: AdminCustomer[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch (e) {
    console.error('Error reading customers from localStorage', e);
  }

  if (list.length === 0) {
    list = [...SEED_ADMIN_CUSTOMERS];
    saveCustomers(list);
  }

  const synced = syncRegisteredUsersToCustomers(list);
  const deduped = deduplicateCustomers(synced);

  // Sync back cleaned deduplicated customers to localStorage if changes occurred
  if (typeof localStorage !== 'undefined' && JSON.stringify(deduped) !== JSON.stringify(list)) {
    try {
      localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(deduped));
    } catch {}
  }

  return deduped;
}

export function saveCustomers(customers: AdminCustomer[]): void {
  try {
    const deduped = deduplicateCustomers(customers);
    localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(deduped));
    emitDataSync('customers', deduped);
  } catch (e) {
    console.error('Error saving customers', e);
  }
}

export function addOrUpdateCustomerFromProfile(profile: UserProfile): AdminCustomer {
  const customers = getAllCustomers();
  const existingIdx = customers.findIndex(
    (c) => c.id === profile.customerId || c.email.toLowerCase() === profile.email.toLowerCase()
  );

  const customerRecord: AdminCustomer = {
    id: profile.customerId,
    name: profile.name,
    email: profile.email,
    phone: profile.phone || '+91 98765 43210',
    country: profile.country || 'United Arab Emirates',
    city: profile.countryCode === 'AE' ? 'Dubai' : 'International City',
    totalOrders: existingIdx >= 0 ? customers[existingIdx].totalOrders : 0,
    totalSpentINR: existingIdx >= 0 ? customers[existingIdx].totalSpentINR : 0,
    status: 'Active',
    avatar: profile.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`,
    joinedDate: existingIdx >= 0 ? customers[existingIdx].joinedDate : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  };

  let updatedList: AdminCustomer[];
  if (existingIdx >= 0) {
    updatedList = [...customers];
    updatedList[existingIdx] = { ...customers[existingIdx], ...customerRecord };
  } else {
    updatedList = [customerRecord, ...customers];
    addAdminNotification({
      type: 'customer',
      title: 'New Customer Registered',
      message: `${profile.name} (${profile.email}) registered from ${profile.country}. Assigned Locker ${profile.lockerId || 'I2W-' + profile.customerId}.`,
      linkTab: 'customers',
      referenceId: profile.customerId,
    });
  }

  saveCustomers(updatedList);
  return customerRecord;
}

export function getCustomerById(customerId: string): AdminCustomer | undefined {
  const all = getAllCustomers();
  return all.find((c) => c.id === customerId);
}

// -------------------------------------------------------------
// 2. PURCHASE REQUESTS MANAGEMENT
// -------------------------------------------------------------
export function getAllPurchaseRequests(): AdminPurchaseRequest[] {
  let list: AdminPurchaseRequest[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_REQUESTS_KEY);
    if (raw) {
      const parsed: AdminPurchaseRequest[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }
  } catch (e) {
    console.error('Error reading purchase requests', e);
  }

  if (list.length === 0) {
    list = [...SEED_PURCHASE_REQUESTS];
  }

  // Deduplicate and filter out obsolete duplicate REQ-30482
  const seenIds = new Set<string>();
  const cleaned: AdminPurchaseRequest[] = [];
  let hadDuplicates = false;

  for (const req of list) {
    if (!req || !req.id) continue;
    if (req.id === 'REQ-30482') {
      hadDuplicates = true;
      continue;
    }
    if (seenIds.has(req.id)) {
      hadDuplicates = true;
      continue;
    }
    seenIds.add(req.id);
    cleaned.push(req);
  }

  if (hadDuplicates) {
    try {
      localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(cleaned));
    } catch {}
  }

  return cleaned;
}

export function savePurchaseRequests(requests: AdminPurchaseRequest[]): void {
  try {
    const seenIds = new Set<string>();
    const cleaned = requests.filter((r) => {
      if (!r || !r.id || r.id === 'REQ-30482' || seenIds.has(r.id)) return false;
      seenIds.add(r.id);
      return true;
    });
    localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(cleaned));
    emitDataSync('requests', cleaned);
  } catch (e) {
    console.error('Error saving purchase requests', e);
  }
}

export function getPurchaseRequestsByCustomerId(customerId: string, email?: string): AdminPurchaseRequest[] {
  const all = getAllPurchaseRequests();
  const idNorm = (customerId || '').trim().toLowerCase();
  const emailNorm = (email || '').trim().toLowerCase();
  if (!idNorm && !emailNorm) return [];
  return all.filter(
    (r) =>
      (idNorm && r.customerId && r.customerId.toLowerCase() === idNorm) ||
      (emailNorm && (r as any).customerEmail && (r as any).customerEmail.toLowerCase() === emailNorm)
  );
}

export function getPurchaseRequestById(requestId: string): AdminPurchaseRequest | undefined {
  const all = getAllPurchaseRequests();
  return all.find((r) => r.id === requestId);
}

export interface CreatePurchaseRequestInput {
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  destinationCountry?: string;
  destinationCity?: string;
  products: Array<{
    name: string;
    url?: string;
    store: string;
    specs?: string;
    priceINR: number;
    qty: number;
    imageUrl?: string;
  }>;
}

export function createPurchaseRequest(input: CreatePurchaseRequestInput): AdminPurchaseRequest {
  const user = getCurrentUser();
  const customerId = input.customerId || user.customerId || 'CUS-10028';
  const customerName = input.customerName || user.name || 'John Doe';
  const destinationCountry = input.destinationCountry || user.country || 'United Arab Emirates';
  const destinationCity = input.destinationCity || 'Dubai';

  // Generate unique request ID
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const requestId = `REQ-${randomSuffix}`;

  const adminProducts: AdminProductItem[] = input.products.map((p, index) => {
    const itemTotal = (p.priceINR || 0) * (p.qty || 1);
    return {
      id: index + 1,
      name: p.name,
      store: p.store || 'amazon.in',
      specs: p.specs || 'Standard Packaging',
      priceINR: p.priceINR || 0,
      qty: p.qty || 1,
      totalINR: itemTotal,
      status: 'Pending Review',
      imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&auto=format&fit=crop&q=80',
    };
  });

  const productCost = adminProducts.reduce((acc, p) => acc + p.totalINR, 0);
  const domesticShipping = productCost > 2000 ? 0 : 350;
  const serviceFee = Math.max(350, Math.round(productCost * 0.08));
  const totalAmountINR = productCost + domesticShipping + serviceFee;

  const newRequest: AdminPurchaseRequest = {
    id: requestId,
    customerId,
    customerName,
    customerAvatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customerName)}`,
    destinationCountry,
    destinationCity,
    countryCode: (user.countryCode || 'ae').toLowerCase(),
    submittedAt: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    submittedAgo: 'Just now',
    status: 'Under Review',
    itemsCount: adminProducts.length,
    totalAmountINR,
    products: adminProducts,
    costSummary: {
      productCost,
      domesticShipping,
      serviceFee,
      tax: 0,
      discount: 0,
      total: totalAmountINR,
    },
  };

  const allRequests = getAllPurchaseRequests();
  const updatedRequests = [newRequest, ...allRequests];
  savePurchaseRequests(updatedRequests);

  // Notify Admin Panel
  addAdminNotification({
    type: 'request',
    title: 'New Purchase Request Submitted',
    message: `${customerName} submitted ${adminProducts.length} product(s) for quotation (${requestId}). Est: ₹${totalAmountINR.toLocaleString('en-IN')}.`,
    linkTab: 'purchase-requests',
    referenceId: requestId,
  });

  addAuditLogEntry({
    adminName: 'Customer Action',
    action: 'CREATE_PURCHASE_REQUEST',
    targetId: requestId,
    details: `Customer ${customerName} (${customerId}) submitted request with ${adminProducts.length} items.`,
  });

  return newRequest;
}

export function updatePurchaseRequestStatus(
  requestId: string,
  newStatus: AdminPurchaseRequest['status']
): boolean {
  const requests = getAllPurchaseRequests();
  const idx = requests.findIndex((r) => r.id === requestId);
  if (idx === -1) return false;

  requests[idx].status = newStatus;
  savePurchaseRequests([...requests]);

  addAuditLogEntry({
    adminName: 'Operations Staff',
    action: 'UPDATE_REQUEST_STATUS',
    targetId: requestId,
    details: `Status updated to "${newStatus}".`,
  });

  return true;
}

// -------------------------------------------------------------
// 3. ORDERS MANAGEMENT
// -------------------------------------------------------------
const INITIAL_SEED_ORDERS: IntegratedOrderRecord[] = [
  {
    id: 'ORD-31026',
    requestId: 'REQ-31026',
    customerId: 'CUS-31026',
    customerName: 'rohith',
    customerEmail: 'pharmayushtechteam@gmail.com',
    customerAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=rohith&backgroundColor=0066FF',
    destination: 'International City, UAE',
    destinationFlag: '🇦🇪',
    orderType: 'Assisted Purchase (Buy For Me)',
    stores: ['Flipkart', 'Tata CLIQ', 'Amazon India', 'Myntra', 'Indian Store', 'AJIO'],
    itemCount: 12,
    totalINR: 25411,
    paymentStatus: 'Paid',
    orderStatus: 'Procuring',
    createdAt: '13 Oct 2026',
    items: [
      { title: 'Puma Men Lightweight Running Sneakers', store: 'Flipkart', price: 2999, qty: 1 },
      { title: 'FabIndia Linen Long Kurta Set', store: 'Tata CLIQ', price: 2499, qty: 1 },
      { title: 'Organic India Tulsi Herbal Infusion Teas (Pack of 4)', store: 'Amazon India', price: 400, qty: 4 },
      { title: 'Boat Wireless Bluetooth Earbuds', store: 'amazon.in', price: 949.5, qty: 2 },
      { title: 'Biotique Bio Kelp Protein Shampoo 340ml', store: 'Myntra', price: 410, qty: 2 },
      { title: 'Handcrafted Brass Incense Holder', store: 'Indian Store', price: 1250, qty: 1 },
      { title: 'AJIO Denim Jacket Indigo Blue', store: 'AJIO', price: 2199, qty: 1 },
    ],
  },
  {
    id: 'ORD-90241',
    requestId: 'REQ-20482',
    customerId: 'CUS-10028',
    customerName: 'Priya Sharma',
    customerEmail: 'priya.sharma@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    destination: 'Dubai, UAE',
    destinationFlag: '🇦🇪',
    orderType: 'Assisted Purchase (Buy For Me)',
    stores: ['Amazon India', 'Myntra', 'Flipkart'],
    itemCount: 4,
    totalINR: 8245,
    paymentStatus: 'Paid',
    orderStatus: 'Procuring',
    createdAt: '06 Nov 2024',
    items: [
      { title: 'Nike Air Zoom Pegasus Running Shoes', store: 'Amazon India', price: 3999, qty: 1 },
      { title: 'Anouk Women Pink Embroidered Kurta', store: 'Myntra', price: 1299, qty: 1 },
      { title: 'Milton Thermosteel Flask 1000ml', store: 'Flipkart', price: 1598, qty: 2 },
    ],
  },
  {
    id: 'ORD-90240',
    customerId: 'CUS-10042',
    customerName: 'Rahul Mehta',
    customerEmail: 'rahul.mehta@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    destination: 'San Francisco, USA',
    destinationFlag: '🇺🇸',
    orderType: 'Assisted Purchase (Buy For Me)',
    stores: ['Tata CliQ', 'FabIndia'],
    itemCount: 2,
    totalINR: 12540,
    paymentStatus: 'Paid',
    orderStatus: 'Dispatched',
    createdAt: '05 Nov 2024',
    trackingAwb: 'FDX4433221100',
    items: [
      { title: 'FabIndia Pure Silk Kurta Set', store: 'Tata CliQ', price: 5499, qty: 1 },
      { title: 'Handcrafted Brass Puja Diya Set', store: 'FabIndia', price: 2501, qty: 1 },
    ],
  },
  {
    id: 'ORD-90239',
    customerId: 'CUS-10034',
    customerName: 'Ahmed Khan',
    customerEmail: 'ahmed.k@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    destination: 'Abu Dhabi, UAE',
    destinationFlag: '🇦🇪',
    orderType: 'Assisted Purchase (Buy For Me)',
    stores: ['Amazon India'],
    itemCount: 3,
    totalINR: 18900,
    paymentStatus: 'Paid',
    orderStatus: 'Dispatched',
    createdAt: '04 Nov 2024',
    trackingAwb: 'DHL9876543210',
    items: [
      { title: 'OnePlus Nord Buds 2 Wireless Earphones', store: 'Amazon India', price: 2999, qty: 2 },
      { title: 'Seiko Automatic Watch Strap Replacement', store: 'Amazon India', price: 12902, qty: 1 },
    ],
  },
];

export function getAllOrders(): IntegratedOrderRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    if (raw) {
      const parsed: IntegratedOrderRecord[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const has31026 = parsed.some((o) => o.id === 'ORD-31026');
        if (!has31026) {
          const merged = [INITIAL_SEED_ORDERS[0], ...parsed];
          saveOrders(merged);
          return merged;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading orders from localStorage', e);
  }

  // Seed if empty
  saveOrders(INITIAL_SEED_ORDERS);
  return INITIAL_SEED_ORDERS;
}

export function saveOrders(orders: IntegratedOrderRecord[]): void {
  try {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
    emitDataSync('orders', orders);
  } catch (e) {
    console.error('Error saving orders', e);
  }
}

export function getOrdersByCustomerId(customerId: string, email?: string): IntegratedOrderRecord[] {
  const all = getAllOrders();
  const idNorm = (customerId || '').trim().toLowerCase();
  const emailNorm = (email || '').trim().toLowerCase();
  if (!idNorm && !emailNorm) return [];
  return all.filter(
    (o) =>
      (idNorm && o.customerId && o.customerId.toLowerCase() === idNorm) ||
      (emailNorm && o.customerEmail && o.customerEmail.toLowerCase() === emailNorm)
  );
}

export function createOrderRecord(order: IntegratedOrderRecord): IntegratedOrderRecord {
  const existing = getAllOrders();
  // Deduplicate
  const duplicate = existing.find((o) => o.id === order.id);
  if (duplicate) return duplicate;

  const updated = [order, ...existing];
  saveOrders(updated);

  // Update customer total orders & spend
  const customers = getAllCustomers();
  const cIdx = customers.findIndex((c) =>
    c.id === order.customerId ||
    (order.customerEmail && c.email.toLowerCase() === order.customerEmail.toLowerCase()) ||
    (order.customerName && c.name.toLowerCase() === order.customerName.toLowerCase())
  );
  if (cIdx >= 0) {
    customers[cIdx].totalOrders = (customers[cIdx].totalOrders || 0) + 1;
    customers[cIdx].totalSpentINR = (customers[cIdx].totalSpentINR || 0) + order.totalINR;
    saveCustomers([...customers]);
  }

  // Notify admin
  addAdminNotification({
    type: 'order',
    title: 'New Confirmed Customer Order',
    message: `${order.customerName} placed order ${order.id} for ₹${order.totalINR.toLocaleString('en-IN')}. Payment captured.`,
    linkTab: 'orders',
    referenceId: order.id,
  });

  addAuditLogEntry({
    adminName: 'Checkout Gateway',
    action: 'CREATE_ORDER',
    targetId: order.id,
    details: `Order created for ${order.customerName} (${order.customerId}), total: ₹${order.totalINR}.`,
  });

  // Record Payment
  recordPayment({
    referenceId: order.id,
    customerId: order.customerId,
    customerName: order.customerName,
    purpose: 'Assisted Purchase (Buy For Me)',
    amountINR: order.totalINR,
    amountForeign: `$${Math.round(order.totalINR / 85)} USD`,
    gateway: 'Stripe International',
    paymentDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    status: 'Captured',
  });

  // Automatically trigger backend order confirmation email if not already sent
  if (order.confirmationEmailStatus !== 'Sent') {
    triggerOrderConfirmationEmail(order).catch((err) => {
      console.warn('[Confirmation Email] Automated dispatch error:', err);
    });
  }

  return order;
}

/**
 * Confirm a customer purchase order and automatically generate & dispatch invoice to customer email
 */
export function confirmPurchaseOrderAndEmailInvoice(requestId: string): {
  success: boolean;
  order?: IntegratedOrderRecord;
  invoice?: CustomerOrderInvoice;
  customerEmail: string;
  message: string;
} {
  const requests = getAllPurchaseRequests();
  const req = requests.find((r) => r.id === requestId);
  if (!req) {
    return { success: false, customerEmail: '', message: `Purchase request ${requestId} not found.` };
  }

  // Retrieve customer info and registered email
  const customerLookup = lookupRegisteredCustomer(req.customerId, req.customerName);
  const customers = getAllCustomers();
  const customerRecord = customers.find(
    (c) => c.id === req.customerId || (c.name && c.name.toLowerCase() === req.customerName.toLowerCase())
  );
  const recipientEmail = (
    customerLookup.email ||
    customerRecord?.email ||
    (req as any).customerEmail ||
    'customer@example.com'
  ).trim().toLowerCase();

  const orderId = `ORD-${req.id.replace('REQ-', '')}`;
  const cost = req.costSummary || {
    productCost: req.totalAmountINR || 0,
    domesticShipping: 350,
    serviceFee: 500,
    tax: 0,
    discount: 0,
    total: req.totalAmountINR || 0,
  };

  const orderRecord: IntegratedOrderRecord = {
    id: orderId,
    requestId: req.id,
    customerId: req.customerId,
    customerName: req.customerName,
    customerEmail: recipientEmail,
    customerAvatar: req.customerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.customerName)}`,
    destination: req.destinationCity ? `${req.destinationCity}, ${req.destinationCountry}` : req.destinationCountry,
    destinationFlag: (req as any).destinationFlag || '🌍',
    orderType: 'Assisted Purchase (Buy For Me)',
    stores: Array.from(new Set(req.products.map((p) => p.store))),
    itemCount: req.products.reduce((acc, p) => acc + (p.qty || 1), 0),
    totalINR: cost.total,
    paymentStatus: 'Paid',
    orderStatus: 'Procuring',
    createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    items: req.products.map((p) => ({
      title: p.name,
      store: p.store,
      price: p.priceINR,
      qty: p.qty,
      imageUrl: p.imageUrl,
    })),
    costSummary: {
      subtotal: cost.productCost,
      domesticShipping: cost.domesticShipping || 0,
      serviceFee: cost.serviceFee || 500,
      tax: cost.tax || 0,
      discount: cost.discount || 0,
      total: cost.total,
    },
  };

  // 1. Save order into orders repository (and update customer totalOrders & totalSpentINR)
  createOrderRecord(orderRecord);

  // 2. Generate official invoice & automatically simulate transactional email delivery
  const { invoice } = createOrderAndAutomateInvoice({
    user: {
      customerId: req.customerId,
      name: req.customerName,
      email: recipientEmail,
      phone: customerLookup.phone || customerRecord?.phone || '+91 98765 43210',
      country: req.destinationCountry,
      countryCode: req.countryCode,
      lockerId: `I2W-${req.customerId}`,
      avatar: req.customerAvatar || '',
      notificationsCount: 0,
    },
    products: req.products.map((p) => ({
      name: p.name,
      storeName: p.store,
      priceINR: p.priceINR,
      quantity: p.qty,
    })),
    costSummary: {
      subtotal: cost.productCost,
      domesticShipping: cost.domesticShipping || 0,
      serviceFee: cost.serviceFee || 500,
      tax: cost.tax || 0,
      discount: cost.discount || 0,
      total: cost.total,
    },
    paymentMethod: 'Pre-Approved Account / Instant Wire',
    destinationCity: req.destinationCity,
    destinationCountry: req.destinationCountry,
    existingOrderId: orderId,
  });

  // 3. Update request status to 'Purchasing'
  updatePurchaseRequestStatus(req.id, 'Purchasing');

  // 4. Automatically trigger real order confirmation email with attached invoice via backend SMTP
  triggerOrderConfirmationEmail(orderRecord, invoice).catch((err) => {
    console.warn('[Confirmation Email] Background dispatch failed:', err);
  });

  // 5. Emit sync events for all open views
  emitDataSync('order-confirmed', { order: orderRecord, invoice });

  return {
    success: true,
    order: orderRecord,
    invoice,
    customerEmail: recipientEmail,
    message: `Order ${orderId} confirmed! Official confirmation and invoice ${invoice.invoiceNumber} automatically sent to ${recipientEmail}.`,
  };
}

export function updateOrderStatus(orderId: string, status: IntegratedOrderRecord['orderStatus'], trackingAwb?: string): boolean {
  const orders = getAllOrders();
  const idx = orders.findIndex((o) => o.id === orderId);
  if (idx === -1) return false;

  orders[idx].orderStatus = status;
  if (trackingAwb) {
    orders[idx].trackingAwb = trackingAwb;
  }
  saveOrders([...orders]);

  addAuditLogEntry({
    adminName: 'Fulfillment Operations',
    action: 'UPDATE_ORDER_STATUS',
    targetId: orderId,
    details: `Order status set to "${status}".`,
  });

  return true;
}

// -------------------------------------------------------------
// 4. WAREHOUSE PACKAGES MANAGEMENT
// -------------------------------------------------------------
export function getAllPackages(): AdminIncomingPackage[] {
  try {
    const raw = localStorage.getItem(STORAGE_PACKAGES_KEY);
    if (raw) {
      const parsed: AdminIncomingPackage[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading packages from localStorage', e);
  }

  savePackages(SEED_INCOMING_PACKAGES);
  return SEED_INCOMING_PACKAGES;
}

export function savePackages(packages: AdminIncomingPackage[]): void {
  try {
    localStorage.setItem(STORAGE_PACKAGES_KEY, JSON.stringify(packages));
    emitDataSync('packages', packages);
  } catch (e) {
    console.error('Error saving packages', e);
  }
}

export function getPackagesByCustomerId(customerId: string): AdminIncomingPackage[] {
  const all = getAllPackages();
  return all.filter((p) => p.customerId === customerId);
}

export function receiveNewPackage(packageData: Omit<AdminIncomingPackage, 'id'> & { id?: string }): AdminIncomingPackage {
  const newId = packageData.id || `PKG-${Math.floor(30000 + Math.random() * 90000)}`;
  const pkg: AdminIncomingPackage = {
    ...packageData,
    id: newId,
  };

  const existing = getAllPackages();
  const updated = [pkg, ...existing];
  savePackages(updated);

  addAdminNotification({
    type: 'package',
    title: 'New Package Received at Warehouse',
    message: `${pkg.seller} package received for ${pkg.customerName} (${pkg.customerId}) at bin ${pkg.warehouseLocation}. Weight: ${pkg.actualWeightKg} kg.`,
    linkTab: 'warehouse',
    referenceId: pkg.id,
  });

  addAuditLogEntry({
    adminName: 'Warehouse Inbound Desk',
    action: 'RECEIVE_PACKAGE',
    targetId: pkg.id,
    details: `Received parcel from ${pkg.seller}, tracked as ${pkg.trackingNumber}.`,
  });

  return pkg;
}

export function updatePackageStatus(packageId: string, status: AdminIncomingPackage['status']): boolean {
  const packages = getAllPackages();
  const idx = packages.findIndex((p) => p.id === packageId);
  if (idx === -1) return false;

  packages[idx].status = status;
  savePackages([...packages]);
  return true;
}

// -------------------------------------------------------------
// 5. SHIPMENTS & TRACKING MANAGEMENT
// -------------------------------------------------------------
export function getAllShipments(): AdminShipment[] {
  try {
    const raw = localStorage.getItem(STORAGE_SHIPMENTS_KEY);
    if (raw) {
      const parsed: AdminShipment[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading shipments from localStorage', e);
  }

  saveShipments(SEED_SHIPMENTS);
  return SEED_SHIPMENTS;
}

export function saveShipments(shipments: AdminShipment[]): void {
  try {
    localStorage.setItem(STORAGE_SHIPMENTS_KEY, JSON.stringify(shipments));
    emitDataSync('shipments', shipments);
  } catch (e) {
    console.error('Error saving shipments', e);
  }
}

export function getShipmentsByCustomerId(customerId: string): AdminShipment[] {
  const all = getAllShipments();
  return all.filter((s) => s.customerId === customerId);
}

export function createShipmentRecord(shipment: AdminShipment): AdminShipment {
  const existing = getAllShipments();
  const updated = [shipment, ...existing];
  saveShipments(updated);

  addAdminNotification({
    type: 'shipment',
    title: 'New Air Shipment Created',
    message: `Shipment ${shipment.id} created for ${shipment.customerName} to ${shipment.destination}. Carrier: ${shipment.carrier || 'DHL Express'}.`,
    linkTab: 'shipping',
    referenceId: shipment.id,
  });

  addAuditLogEntry({
    adminName: 'Shipping Operations',
    action: 'CREATE_SHIPMENT',
    targetId: shipment.id,
    details: `Dispatched to ${shipment.destination} via ${shipment.carrier || 'DHL'}. Tracking AWB: ${shipment.trackingNumber || 'Pending'}.`,
  });

  return shipment;
}

export function updateShipmentStatus(shipmentId: string, status: AdminShipment['status']): boolean {
  const shipments = getAllShipments();
  const idx = shipments.findIndex((s) => s.id === shipmentId);
  if (idx === -1) return false;

  shipments[idx].status = status;
  saveShipments([...shipments]);
  return true;
}

export function createConsolidatedShipment(params: {
  customerId: string;
  customerName: string;
  destination: string;
  carrier: string;
  packageIds: string[];
  dimensions?: { lengthCm: number; widthCm: number; heightCm: number };
  chargeableWeightKg: number;
}): AdminShipment {
  const carrierPrefix = params.carrier.includes('FedEx') ? 'FDX' : params.carrier.includes('Aramex') ? 'ARX' : 'DHL';
  const shipmentId = `SHP-${Math.floor(500000 + Math.random() * 90000)}`;
  const awbNumber = `${carrierPrefix}${Math.floor(1000000000 + Math.random() * 9000000000)}`;

  const newShipment: AdminShipment = {
    id: shipmentId,
    customerId: params.customerId,
    customerName: params.customerName,
    destination: params.destination,
    carrier: params.carrier,
    trackingNumber: awbNumber,
    status: 'In Transit',
    departureDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    estimatedArrival: 'In 3-5 business days',
    packageCount: params.packageIds.length,
    chargeableWeightKg: params.chargeableWeightKg,
  };

  createShipmentRecord(newShipment);

  // Update status of packages to Consolidated
  params.packageIds.forEach((pkgId) => {
    updatePackageStatus(pkgId, 'Consolidated' as any);
  });

  // Record air freight payment
  const freightINR = Math.round(params.chargeableWeightKg * 950 + 1200);
  recordPayment({
    referenceId: shipmentId,
    customerId: params.customerId,
    customerName: params.customerName,
    purpose: 'International Air Freight',
    amountINR: freightINR,
    amountForeign: `$${Math.round(freightINR / 85)} USD`,
    gateway: 'Stripe International',
    paymentDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    status: 'Captured',
  });

  return newShipment;
}

// -------------------------------------------------------------
// 6. PAYMENTS & REFUNDS MANAGEMENT
// -------------------------------------------------------------
export interface PaymentTransaction {
  id: string; // PAY-77210
  referenceId: string; // SHP-500012 / ORD-90241
  customerId: string;
  customerName: string;
  purpose: 'Assisted Purchase (Buy For Me)' | 'International Air Freight' | 'Storage Overage Fee';
  amountINR: number;
  amountForeign: string;
  gateway: 'Stripe International' | 'Razorpay' | 'PayPal' | 'Apple Pay';
  paymentDate: string;
  status: 'Captured' | 'Pending' | 'Failed' | 'Refunded';
}

export interface RefundRequest {
  id: string; // REF-4019
  orderId: string;
  customerId: string;
  customerName: string;
  itemTitle: string;
  reason: string;
  amountINR: number;
  refundMethod: 'Original Payment Method' | 'India2World Wallet';
  status: 'Under Review' | 'Approved & Credited' | 'Rejected';
  requestedDate: string;
}

export const INITIAL_PAYMENTS: PaymentTransaction[] = [
  {
    id: 'PAY-77210',
    referenceId: 'SHP-500012',
    customerId: 'CUS-10034',
    customerName: 'Ahmed Khan',
    purpose: 'International Air Freight',
    amountINR: 8245,
    amountForeign: '365 AED',
    gateway: 'Stripe International',
    paymentDate: '12 Nov 2024, 11:20 AM',
    status: 'Captured',
  },
  {
    id: 'PAY-77209',
    referenceId: 'ORD-90241',
    customerId: 'CUS-10028',
    customerName: 'Priya Sharma',
    purpose: 'Assisted Purchase (Buy For Me)',
    amountINR: 10245,
    amountForeign: '455 AED',
    gateway: 'Stripe International',
    paymentDate: '11 Nov 2024, 03:45 PM',
    status: 'Captured',
  },
  {
    id: 'PAY-77208',
    referenceId: 'ORD-90240',
    customerId: 'CUS-10042',
    customerName: 'Rahul Mehta',
    purpose: 'Assisted Purchase (Buy For Me)',
    amountINR: 12540,
    amountForeign: '$150 USD',
    gateway: 'Apple Pay',
    paymentDate: '10 Nov 2024, 09:15 AM',
    status: 'Captured',
  },
  {
    id: 'PAY-77207',
    referenceId: 'SHP-500011',
    customerId: 'CUS-10067',
    customerName: 'Neha Patel',
    purpose: 'International Air Freight',
    amountINR: 4200,
    amountForeign: '$50.50 USD',
    gateway: 'PayPal',
    paymentDate: '09 Nov 2024, 02:00 PM',
    status: 'Captured',
  },
  {
    id: 'PAY-77206',
    referenceId: 'PKG-30415',
    customerId: 'CUS-10089',
    customerName: 'Suresh Reddy',
    purpose: 'Storage Overage Fee',
    amountINR: 650,
    amountForeign: '$7.80 USD',
    gateway: 'Stripe International',
    paymentDate: '08 Nov 2024, 04:10 PM',
    status: 'Captured',
  },
  {
    id: 'PAY-77205',
    referenceId: 'SHP-500010',
    customerId: 'CUS-10015',
    customerName: 'Meena Nair',
    purpose: 'International Air Freight',
    amountINR: 6850,
    amountForeign: '£65.00 GBP',
    gateway: 'Razorpay',
    paymentDate: '07 Nov 2024, 01:25 PM',
    status: 'Captured',
  },
  {
    id: 'PAY-77204',
    referenceId: 'ORD-90238',
    customerId: 'CUS-10092',
    customerName: 'Arjun Iyer',
    purpose: 'Assisted Purchase (Buy For Me)',
    amountINR: 18450,
    amountForeign: '$335 AUD',
    gateway: 'Stripe International',
    paymentDate: '06 Nov 2024, 10:40 AM',
    status: 'Captured',
  },
  {
    id: 'PAY-77203',
    referenceId: 'SHP-500009',
    customerId: 'CUS-10048',
    customerName: 'Fatima Al-Mansoor',
    purpose: 'International Air Freight',
    amountINR: 9150,
    amountForeign: '400 AED',
    gateway: 'Apple Pay',
    paymentDate: '05 Nov 2024, 05:15 PM',
    status: 'Captured',
  },
  {
    id: 'PAY-77202',
    referenceId: 'ORD-90235',
    customerId: 'CUS-10055',
    customerName: 'Karan Singh',
    purpose: 'Assisted Purchase (Buy For Me)',
    amountINR: 4990,
    amountForeign: '$80 SGD',
    gateway: 'Razorpay',
    paymentDate: '04 Nov 2024, 11:05 AM',
    status: 'Captured',
  },
  {
    id: 'PAY-77201',
    referenceId: 'SHP-500008',
    customerId: 'CUS-10061',
    customerName: 'Sunita Rao',
    purpose: 'International Air Freight',
    amountINR: 5400,
    amountForeign: '€60 EUR',
    gateway: 'Stripe International',
    paymentDate: '03 Nov 2024, 03:50 PM',
    status: 'Captured',
  },
  {
    id: 'PAY-77200',
    referenceId: 'ORD-90230',
    customerId: 'CUS-10072',
    customerName: 'Vikram Joshi',
    purpose: 'Storage Overage Fee',
    amountINR: 850,
    amountForeign: '$10.20 USD',
    gateway: 'PayPal',
    paymentDate: '02 Nov 2024, 09:30 AM',
    status: 'Captured',
  },
];

export const INITIAL_REFUNDS: RefundRequest[] = [
  {
    id: 'REF-4019',
    orderId: 'ORD-90231',
    customerId: 'CUS-10034',
    customerName: 'Ahmed Khan',
    itemTitle: 'Zara Tailored Suit Jacket (Out of Stock at Seller)',
    reason: 'Seller cancelled item due to size inventory shortage',
    amountINR: 6490,
    refundMethod: 'Original Payment Method',
    status: 'Under Review',
    requestedDate: '11 Nov 2024',
  },
  {
    id: 'REF-4018',
    orderId: 'ORD-90224',
    customerId: 'CUS-10067',
    customerName: 'Neha Patel',
    itemTitle: 'Organic Tea Hamper (Partial Damage at Courier)',
    reason: 'Glass jar cracked during domestic merchant courier delivery',
    amountINR: 1200,
    refundMethod: 'India2World Wallet',
    status: 'Approved & Credited',
    requestedDate: '08 Nov 2024',
  },
  {
    id: 'REF-4017',
    orderId: 'ORD-90215',
    customerId: 'CUS-10092',
    customerName: 'Arjun Iyer',
    itemTitle: 'Stainless Steel Water Filter',
    reason: 'Weight adjustment refund after consolidation repackaging',
    amountINR: 450,
    refundMethod: 'India2World Wallet',
    status: 'Approved & Credited',
    requestedDate: '05 Nov 2024',
  },
  {
    id: 'REF-4016',
    orderId: 'ORD-90210',
    customerId: 'CUS-10015',
    customerName: 'Meena Nair',
    itemTitle: 'Handcrafted Wooden Spice Box',
    reason: 'Incorrect variant dispatched by vendor, returned and refunded',
    amountINR: 1850,
    refundMethod: 'Original Payment Method',
    status: 'Approved & Credited',
    requestedDate: '03 Nov 2024',
  },
  {
    id: 'REF-4015',
    orderId: 'ORD-90204',
    customerId: 'CUS-10048',
    customerName: 'Fatima Al-Mansoor',
    reason: 'Duplicate courier shipping charge auto-refunded',
    itemTitle: 'Shipping Fee Differential',
    amountINR: 950,
    refundMethod: 'India2World Wallet',
    status: 'Approved & Credited',
    requestedDate: '01 Nov 2024',
  },
  {
    id: 'REF-4014',
    orderId: 'ORD-90199',
    customerId: 'CUS-10061',
    customerName: 'Sunita Rao',
    reason: 'Courier volumetric discount credit applied',
    itemTitle: 'Volumetric Freight Adjustment',
    amountINR: 620,
    refundMethod: 'India2World Wallet',
    status: 'Under Review',
    requestedDate: '30 Oct 2024',
  },
  {
    id: 'REF-4013',
    orderId: 'ORD-90192',
    customerId: 'CUS-10072',
    customerName: 'Vikram Joshi',
    reason: 'Seller unfulfilled item after 7 days non-response',
    itemTitle: 'Ayurvedic Wellness Pack',
    amountINR: 2100,
    refundMethod: 'Original Payment Method',
    status: 'Approved & Credited',
    requestedDate: '28 Oct 2024',
  },
  {
    id: 'REF-4012',
    orderId: 'ORD-90185',
    customerId: 'CUS-10080',
    customerName: 'Kavita Menon',
    reason: 'Damaged item return credit processed by warehouse',
    itemTitle: 'Brass Diya Decorative Lamp',
    amountINR: 890,
    refundMethod: 'India2World Wallet',
    status: 'Approved & Credited',
    requestedDate: '25 Oct 2024',
  },
];

export function getAllPayments(): PaymentTransaction[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_PAYMENTS_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading payments', e);
  }
  savePayments(INITIAL_PAYMENTS);
  return INITIAL_PAYMENTS;
}

export function savePayments(payments: PaymentTransaction[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(payments));
      emitDataSync('payments', payments);
    }
  } catch (e) {
    console.error('Error saving payments', e);
  }
}

export function recordPayment(payment: Omit<PaymentTransaction, 'id'> & { id?: string }): PaymentTransaction {
  const newId = payment.id || `PAY-${Math.floor(70000 + Math.random() * 29000)}`;
  const record: PaymentTransaction = {
    ...payment,
    id: newId,
  };
  const existing = getAllPayments();
  const duplicate = existing.find((p) => p.referenceId === payment.referenceId && p.amountINR === payment.amountINR);
  if (duplicate) return duplicate;

  const updated = [record, ...existing];
  savePayments(updated);

  addAdminNotification({
    type: 'payment',
    title: `Payment Received ₹${payment.amountINR.toLocaleString('en-IN')}`,
    message: `${payment.customerName} completed payment for ${payment.referenceId} via ${payment.gateway}.`,
    linkTab: 'payments',
    referenceId: newId,
  });

  addAuditLogEntry({
    adminName: 'Payment Gateway',
    action: 'CAPTURE_PAYMENT',
    targetId: newId,
    details: `Captured ₹${payment.amountINR} (${payment.amountForeign}) for ${payment.referenceId}.`,
  });

  return record;
}

export function getAllRefunds(): RefundRequest[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_REFUNDS_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading refunds', e);
  }
  saveRefunds(INITIAL_REFUNDS);
  return INITIAL_REFUNDS;
}

export function saveRefunds(refunds: RefundRequest[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_REFUNDS_KEY, JSON.stringify(refunds));
      emitDataSync('refunds', refunds);
    }
  } catch (e) {
    console.error('Error saving refunds', e);
  }
}

export function processRefund(refundId: string, status: RefundRequest['status']): boolean {
  const refunds = getAllRefunds();
  const idx = refunds.findIndex((r) => r.id === refundId);
  if (idx === -1) return false;
  refunds[idx].status = status;
  saveRefunds([...refunds]);

  addAuditLogEntry({
    adminName: 'Finance Desk',
    action: 'PROCESS_REFUND',
    targetId: refundId,
    details: `Refund status changed to "${status}" for order ${refunds[idx].orderId}.`,
  });
  return true;
}

// -------------------------------------------------------------
// 6. SUPPORT TICKETS MANAGEMENT
// -------------------------------------------------------------
const INITIAL_SUPPORT_TICKETS: SupportTicketRecord[] = [
  {
    id: 'TKT-1082',
    customerId: 'CUS-10028',
    customerName: 'Priya Sharma',
    subject: 'Customs clearance documentation for SHP-50012',
    category: 'Customs Clearance',
    referenceId: 'SHP-50012',
    priority: 'High',
    status: 'In Progress',
    createdAt: 'Today, 09:15 AM',
    lastReply: 'Support desk verified KYC documents',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        name: 'Priya Sharma',
        text: 'Hi, I received a notification about Customs KYC requirement for Dubai delivery. Can you confirm if my uploaded passport copy is sufficient?',
        time: 'Today, 09:15 AM',
      },
      {
        id: 'msg-2',
        sender: 'support',
        name: 'Rajesh K. (India2World Support)',
        text: 'Hello! Yes, your passport copy has been verified by our customs clearance desk in Mumbai. The shipment SHP-50012 has cleared export checks and is scheduled for air cargo.',
        time: 'Today, 10:45 AM',
      },
    ],
  },
  {
    id: 'TKT-1049',
    customerId: 'CUS-10028',
    customerName: 'Priya Sharma',
    subject: 'Fragile repackaging request for FabIndia glassware',
    category: 'Consolidation & Repackaging',
    referenceId: 'PKG-30421',
    priority: 'Medium',
    status: 'Resolved',
    createdAt: 'Yesterday, 03:20 PM',
    lastReply: 'Double bubble-wrap and fragile tags added',
    messages: [
      {
        id: 'msg-3',
        sender: 'user',
        name: 'Priya Sharma',
        text: 'Please ensure extra protective bubble wrap is used for the ceramic tea set before consolidation.',
        time: 'Yesterday, 03:20 PM',
      },
      {
        id: 'msg-4',
        sender: 'support',
        name: 'Warehouse Team (Bengaluru Hub)',
        text: 'Confirmed! Extra 5-layer shock bubble wrap and Fragile warning tags have been added to your parcel PKG-30421.',
        time: 'Yesterday, 05:10 PM',
      },
    ],
  },
  {
    id: 'TKT-1048',
    customerId: 'CUS-10034',
    customerName: 'Ahmed Khan',
    subject: 'Locker storage extension request for 10 days',
    category: 'Locker Storage Extension',
    referenceId: 'CUS-10034',
    priority: 'Normal' as any,
    status: 'Open',
    createdAt: 'Yesterday, 11:30 AM',
    lastReply: 'Awaiting warehouse manager approval',
    messages: [
      {
        id: 'msg-5',
        sender: 'user',
        name: 'Ahmed Khan',
        text: 'Can I extend my locker free storage period by 10 days while I wait for Myntra festive delivery?',
        time: 'Yesterday, 11:30 AM',
      },
    ],
  },
  {
    id: 'TKT-1047',
    customerId: 'CUS-10042',
    customerName: 'Rahul Mehta',
    subject: 'Carrier transit SLA inquiry for New York consignment',
    category: 'Courier Delay',
    referenceId: 'SHP-500011',
    priority: 'High',
    status: 'In Progress',
    createdAt: '2 days ago',
    lastReply: 'Flight connection update provided',
    messages: [
      {
        id: 'msg-6',
        sender: 'user',
        name: 'Rahul Mehta',
        text: 'Tracking indicates cargo departed Mumbai. What is expected JFK arrival date?',
        time: '2 days ago',
      },
    ],
  },
  {
    id: 'TKT-1046',
    customerId: 'CUS-10067',
    customerName: 'Neha Patel',
    subject: 'GST Tax invoice breakdown clarification',
    category: 'Customs Duty Inquiry',
    referenceId: 'INV-88201',
    priority: 'Normal' as any,
    status: 'Resolved',
    createdAt: '3 days ago',
    lastReply: 'Tax invoice PDF re-emailed',
    messages: [
      {
        id: 'msg-7',
        sender: 'user',
        name: 'Neha Patel',
        text: 'Could you please re-send the GST invoice PDF with export SAC code?',
        time: '3 days ago',
      },
    ],
  },
  {
    id: 'TKT-1045',
    customerId: 'CUS-10089',
    customerName: 'Suresh Reddy',
    subject: 'Volumetric weight re-measurement request',
    category: 'Repackaging Request',
    referenceId: 'PKG-30415',
    priority: 'Medium',
    status: 'Resolved',
    createdAt: '4 days ago',
    lastReply: 'Warehouse physical dimensions re-verified',
    messages: [
      {
        id: 'msg-8',
        sender: 'user',
        name: 'Suresh Reddy',
        text: 'Please re-measure parcel dimensions with outer cardboard discarded.',
        time: '4 days ago',
      },
    ],
  },
  {
    id: 'TKT-1044',
    customerId: 'CUS-10015',
    customerName: 'Meena Nair',
    subject: 'Urgent address update before DHL dispatch',
    category: 'Customs Duty Inquiry',
    referenceId: 'SHP-500010',
    priority: 'Urgent',
    status: 'Resolved',
    createdAt: '5 days ago',
    lastReply: 'London delivery address updated on DHL AWB',
    messages: [
      {
        id: 'msg-9',
        sender: 'user',
        name: 'Meena Nair',
        text: 'I moved flat in London. Please update delivery postcode to W2 1NY.',
        time: '5 days ago',
      },
    ],
  },
  {
    id: 'TKT-1043',
    customerId: 'CUS-10092',
    customerName: 'Arjun Iyer',
    subject: 'Assisted purchase payment receipt not received',
    category: 'Customs Duty Inquiry',
    referenceId: 'PAY-77204',
    priority: 'Normal' as any,
    status: 'Resolved',
    createdAt: '6 days ago',
    lastReply: 'Stripe transaction receipt resent',
    messages: [
      {
        id: 'msg-10',
        sender: 'user',
        name: 'Arjun Iyer',
        text: 'Card was charged for Buy For Me request REQ-30477. Where can I find the receipt?',
        time: '6 days ago',
      },
    ],
  },
];

export function getAllSupportTickets(): SupportTicketRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_SUPPORT_KEY);
    if (raw) {
      const parsed: SupportTicketRecord[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading support tickets', e);
  }

  saveSupportTickets(INITIAL_SUPPORT_TICKETS);
  return INITIAL_SUPPORT_TICKETS;
}

export function saveSupportTickets(tickets: SupportTicketRecord[]): void {
  try {
    localStorage.setItem(STORAGE_SUPPORT_KEY, JSON.stringify(tickets));
    emitDataSync('support', tickets);
  } catch (e) {
    console.error('Error saving support tickets', e);
  }
}

export function getSupportTicketsByCustomerId(customerId: string): SupportTicketRecord[] {
  const all = getAllSupportTickets();
  return all.filter((t) => t.customerId === customerId);
}

export function addSupportMessage(
  ticketId: string,
  message: { sender: 'user' | 'support'; name: string; text: string }
): boolean {
  const tickets = getAllSupportTickets();
  const idx = tickets.findIndex((t) => t.id === ticketId);
  if (idx === -1) return false;

  const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const msgObj = {
    id: `msg-${Date.now()}`,
    sender: message.sender,
    name: message.name,
    text: message.text,
    time: `Today, ${now}`,
  };

  tickets[idx].messages.push(msgObj);
  tickets[idx].lastReply = message.text.slice(0, 45) + '...';
  if (message.sender === 'user') {
    tickets[idx].status = 'Open';
    addAdminNotification({
      type: 'support',
      title: `New Reply on Ticket ${ticketId}`,
      message: `${message.name}: "${message.text.slice(0, 60)}..."`,
      linkTab: 'support',
      referenceId: ticketId,
    });
  }

  saveSupportTickets([...tickets]);
  return true;
}

// -------------------------------------------------------------
// 7. NOTIFICATIONS & AUDIT LOGS
// -------------------------------------------------------------
export function getAllAdminNotifications(): AdminNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_NOTIFICATIONS_KEY);
    if (raw) {
      const parsed: AdminNotification[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading admin notifications', e);
  }

  const initial: AdminNotification[] = [
    {
      id: 'notif-1',
      type: 'request',
      title: 'New Purchase Request REQ-20482',
      message: 'Priya Sharma submitted 4 product items for quotation review.',
      timestamp: '10 mins ago',
      read: false,
      linkTab: 'purchase-requests',
      referenceId: 'REQ-20482',
    },
    {
      id: 'notif-2',
      type: 'payment',
      title: 'Payment Received ₹8,245',
      message: 'Ahmed Khan completed card payment for order ORD-90239.',
      timestamp: '1 hour ago',
      read: false,
      linkTab: 'payments',
      referenceId: 'PAY-77210',
    },
    {
      id: 'notif-3',
      type: 'package',
      title: 'Package Received at Hub',
      message: 'Amazon India package PKG-30421 checked into bin A-12-B.',
      timestamp: '2 hours ago',
      read: true,
      linkTab: 'warehouse',
      referenceId: 'PKG-30421',
    },
    {
      id: 'notif-4',
      type: 'shipment',
      title: 'Air Consignment Dispatched',
      message: 'Master consolidation CS-101 handed over to DHL Express with AWB #DHL9876543210.',
      timestamp: '3 hours ago',
      read: false,
      linkTab: 'consolidation',
      referenceId: 'CS-101',
    },
    {
      id: 'notif-5',
      type: 'support',
      title: 'Customs KYC Document Approved',
      message: 'UAE export clearance approved for CUS-10034 passport verification.',
      timestamp: '4 hours ago',
      read: false,
      linkTab: 'support',
      referenceId: 'TKT-1082',
    },
    {
      id: 'notif-6',
      type: 'order',
      title: 'Refund Request Submitted',
      message: 'Ahmed Khan requested ₹6,490 refund for out-of-stock Zara item.',
      timestamp: '5 hours ago',
      read: false,
      linkTab: 'refunds',
      referenceId: 'REF-4019',
    },
    {
      id: 'notif-7',
      type: 'package',
      title: 'Flipkart Delivery Received',
      message: 'Package PKG-30419 checked in with unboxing verification photos.',
      timestamp: '6 hours ago',
      read: true,
      linkTab: 'incoming-packages',
      referenceId: 'PKG-30419',
    },
    {
      id: 'notif-8',
      type: 'order',
      title: 'High-Value Assisted Order Approved',
      message: 'Order ORD-90240 (₹12,540) cleared finance threshold review.',
      timestamp: '7 hours ago',
      read: true,
      linkTab: 'purchase-queue',
      referenceId: 'ORD-90240',
    },
    {
      id: 'notif-9',
      type: 'shipment',
      title: 'FedEx Flight Departure',
      message: 'Consignment CS-102 boarded Emirates Cargo flight EK501 to London Heathrow.',
      timestamp: '8 hours ago',
      read: true,
      linkTab: 'shipping',
      referenceId: 'CS-102',
    },
    {
      id: 'notif-10',
      type: 'payment',
      title: 'International Wire Captured',
      message: 'Bank wire ₹18,450 reconciled for customer Arjun Iyer (Australia).',
      timestamp: '9 hours ago',
      read: true,
      linkTab: 'payments',
      referenceId: 'PAY-77204',
    },
  ];

  saveAdminNotifications(initial);
  return initial;
}

export function saveAdminNotifications(notifs: AdminNotification[]): void {
  try {
    localStorage.setItem(STORAGE_NOTIFICATIONS_KEY, JSON.stringify(notifs));
    emitDataSync('notifications', notifs);
  } catch (e) {
    console.error('Error saving notifications', e);
  }
}

export function addAdminNotification(notif: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>): AdminNotification {
  const current = getAllAdminNotifications();
  const newNotif: AdminNotification = {
    ...notif,
    id: `notif-${Date.now()}`,
    timestamp: 'Just now',
    read: false,
  };
  const updated = [newNotif, ...current.slice(0, 49)];
  saveAdminNotifications(updated);
  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  const current = getAllAdminNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveAdminNotifications(updated);
}

export function markAllNotificationsAsRead(): void {
  const current = getAllAdminNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveAdminNotifications(updated);
}

export function getAllAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_AUDIT_LOG_KEY);
    if (raw) {
      const parsed: AuditLogEntry[] = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading audit logs', e);
  }
  return [];
}

export function addAuditLogEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
  try {
    const logs = getAllAuditLogs();
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_AUDIT_LOG_KEY, JSON.stringify([newEntry, ...logs.slice(0, 100)]));
  } catch (e) {
    console.error('Error saving audit log', e);
  }
}

// -------------------------------------------------------------
// 8. DYNAMIC DASHBOARD STATS CALCULATION
// -------------------------------------------------------------
export function getDynamicAdminStats() {
  const requests = getAllPurchaseRequests();
  const orders = getAllOrders();
  const packages = getAllPackages();
  const shipments = getAllShipments();
  const customers = getAllCustomers();

  const newPurchaseRequests = requests.filter((r) => r.status === 'Under Review').length;
  const quotesPending = requests.filter((r) => r.status === 'Quote Ready' || r.status === 'Under Review').length;
  const awaitingPayment = requests.filter((r) => r.status === 'Awaiting Payment').length;
  const purchasesPending = orders.filter((o) => o.orderStatus === 'Procuring').length;
  const packagesReceivedToday = packages.filter((p) => p.status === 'Received').length;
  const readyForConsolidation = packages.filter((p) => p.status === 'Received' || p.status === 'Inspected').length;
  const shipmentsInTransit = shipments.filter((s) => s.status === 'In Transit').length;

  return {
    newPurchaseRequests: Math.max(newPurchaseRequests, 1),
    quotesPending,
    awaitingPayment,
    purchasesPending,
    packagesReceivedToday: Math.max(packagesReceivedToday, 3),
    readyForConsolidation: Math.max(readyForConsolidation, 2),
    shippingPaymentsPending: 5,
    shipmentsInTransit: Math.max(shipmentsInTransit, 2),
    totalCustomers: customers.length,
    totalOrdersCount: orders.length,
  };
}

export function getDynamicCustomerStats(customerId: string) {
  const requests = getPurchaseRequestsByCustomerId(customerId);
  const orders = getOrdersByCustomerId(customerId);
  const packages = getPackagesByCustomerId(customerId);
  const shipments = getShipmentsByCustomerId(customerId);

  return {
    activeRequestsCount: requests.filter((r) => r.status !== 'Submitted').length,
    confirmedOrdersCount: orders.length,
    warehousePackagesCount: packages.filter((p) => p.status === 'Received' || p.status === 'Inspected').length,
    activeShipmentsCount: shipments.filter((s) => s.status === 'In Transit').length,
    deliveredShipmentsCount: shipments.filter((s) => s.status === 'Delivered').length,
  };
}

export function getDynamicSidebarBadges(): Record<string, number | undefined> {
  const requests = getAllPurchaseRequests();
  const orders = getAllOrders();
  const packages = getAllPackages();
  const shipments = getAllShipments();
  const notifications = getAllAdminNotifications();
  const tickets = getAllSupportTickets();
  const payments = getAllPayments();
  const refunds = getAllRefunds();

  const pendingRequests = requests.filter((r) => r.status === 'Under Review' || r.status === 'Submitted').length;
  const quotesPending = requests.filter((r) => r.status === 'Quote Ready' || r.status === 'Awaiting Payment').length;
  const purchaseQueue = orders.filter((o) => o.orderStatus === 'Procuring').length;
  const incomingPkgs = packages.filter((p) => p.status === 'Received').length;
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const openTickets = tickets.filter((t) => t.status === 'Open' || t.status === 'In Progress').length;
  const activeShipments = shipments.filter((s) => s.status === 'In Transit').length;
  const readyConsolidation = packages.filter((p) => p.status === 'Received' || p.status === 'Inspected').length;
  const pendingPayments = payments.filter((p) => p.status === 'Pending').length;
  const pendingRefunds = refunds.filter((r) => r.status === 'Under Review').length;

  return {
    'purchase-requests': pendingRequests > 0 ? pendingRequests : undefined,
    'quotations': quotesPending > 0 ? quotesPending : undefined,
    'purchase-queue': purchaseQueue > 0 ? purchaseQueue : undefined,
    'incoming-packages': incomingPkgs > 0 ? incomingPkgs : undefined,
    'consolidation': readyConsolidation > 0 ? readyConsolidation : undefined,
    'shipping': activeShipments > 0 ? activeShipments : undefined,
    'payments': pendingPayments > 0 ? pendingPayments : undefined,
    'refunds': pendingRefunds > 0 ? pendingRefunds : undefined,
    'support': openTickets > 0 ? openTickets : undefined,
    'notifications': unreadNotifs > 0 ? unreadNotifs : undefined,
  };
}

// -------------------------------------------------------------
// 9. AUTOMATIC REACTIVE LISTENERS & BOOTSTRAP
// -------------------------------------------------------------
if (typeof window !== 'undefined') {
  // Sync when current user profile changes
  window.addEventListener('i2w-user-changed', (e: any) => {
    if (e.detail && e.detail.customerId && e.detail.email) {
      addOrUpdateCustomerFromProfile(e.detail);
    }
  });

  // Sync when an invoice or quotation is generated
  window.addEventListener('i2w-invoices-updated', () => {
    try {
      const allInvoices = getAllInvoices();
      const existingOrders = getAllOrders();
      const orderMap = new Map(existingOrders.map((o) => [o.id, o]));
      let hasNewOrder = false;

      allInvoices.forEach((inv) => {
        if (!orderMap.has(inv.orderId)) {
          const newOrder: IntegratedOrderRecord = {
            id: inv.orderId,
            customerId: inv.customerId,
            customerName: inv.customerName,
            customerEmail: inv.customerEmail,
            customerAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(inv.customerName)}&backgroundColor=0066FF`,
            destination: `${inv.destinationCity}, ${inv.destinationCountry}`,
            destinationFlag: inv.destinationFlag || '🌍',
            orderType: 'Assisted Purchase (Buy For Me)',
            stores: Array.from(new Set(inv.items.map((i) => i.store))),
            itemCount: inv.items.reduce((acc, curr) => acc + curr.qty, 0),
            totalINR: inv.totalINR,
            paymentStatus: inv.paymentStatus === 'Paid' ? 'Paid' : 'Pending Balance',
            orderStatus: 'Procuring',
            createdAt: inv.createdAt.split(',')[0],
            items: inv.items.map((i) => ({
              title: i.title,
              store: i.store,
              price: i.price,
              qty: i.qty,
            })),
          };
          orderMap.set(newOrder.id, newOrder);
          hasNewOrder = true;
        }
      });

      if (hasNewOrder) {
        saveOrders(Array.from(orderMap.values()));
      }
    } catch (err) {
      console.error('Error synchronizing invoices to orders:', err);
    }
  });

  // Cross-tab synchronization
  window.addEventListener('storage', (e: StorageEvent) => {
    if (
      e.key === STORAGE_CUSTOMERS_KEY ||
      e.key === STORAGE_REQUESTS_KEY ||
      e.key === STORAGE_ORDERS_KEY ||
      e.key === STORAGE_PACKAGES_KEY ||
      e.key === STORAGE_SHIPMENTS_KEY ||
      e.key === STORAGE_PAYMENTS_KEY ||
      e.key === STORAGE_REFUNDS_KEY ||
      e.key === STORAGE_SUPPORT_KEY ||
      e.key === STORAGE_NOTIFICATIONS_KEY
    ) {
      emitDataSync('cross-tab-storage', { key: e.key });
    }
  });

  // Ensure initial registered customers are populated
  try {
    const regUsersRaw = localStorage.getItem('i2w_registered_users');
    if (regUsersRaw) {
      const parsedReg = JSON.parse(regUsersRaw);
      Object.values(parsedReg).forEach((userProfile: any) => {
        if (userProfile && userProfile.email) {
          addOrUpdateCustomerFromProfile(userProfile);
        }
      });
    }
  } catch (err) {
    console.warn('Could not sync pre-existing registered users on init:', err);
  }
}

