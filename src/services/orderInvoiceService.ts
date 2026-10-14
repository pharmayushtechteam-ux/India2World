/**
 * India2World Order & Automated Invoice Service
 * 
 * Handles:
 * - Order and Invoice record creation
 * - Idempotency and de-duplication to prevent duplicate invoices / emails
 * - Automated transactional email dispatch simulation (backend-ready)
 * - Safe credential separation (no SMTP or API secrets on frontend)
 * - Branded invoice HTML/PDF generation & download
 * - Synchronized state between Customer Dashboard and Admin Orders Module
 */

import { UserProfile, getCurrentUser } from '../utils/userAuth';
import { ADMIN_CUSTOMERS } from './adminMockData';

export type InvoiceEmailStatus = 'Sent' | 'Pending' | 'Failed';

export interface InvoiceItem {
  id: string;
  title: string;
  store: string;
  price: number;
  qty: number;
  total: number;
}

export interface CustomerOrderInvoice {
  id: string; // Unique Invoice ID (e.g. INV-2026-90242)
  orderId: string; // Linked Order ID (e.g. ORD-90242)
  invoiceNumber: string; // e.g. INV-2026-90242
  createdAt: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  destinationCity: string;
  destinationCountry: string;
  destinationFlag: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress: {
    name: string;
    email: string;
    country: string;
  };
  items: InvoiceItem[];
  subtotalINR: number;
  domesticShippingINR: number;
  serviceFeeINR: number;
  estimatedTaxINR: number;
  discountINR: number;
  totalINR: number;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Pending';
  emailStatus: InvoiceEmailStatus;
  emailSentAt?: string;
  emailDeliveryLog?: string;
  emailAttemptCount: number;
}

const INVOICE_STORAGE_KEY = 'i2w_customer_invoices_v1';
const PROCESSED_ORDERS_KEY = 'i2w_processed_orders_v1';

// Seed initial invoices matching existing mock orders
const INITIAL_SEED_INVOICES: CustomerOrderInvoice[] = [
  {
    id: 'INV-2026-31026',
    orderId: 'ORD-31026',
    invoiceNumber: 'INV-2026-31026',
    createdAt: '13 Oct 2026, 01:20 PM',
    customerId: 'CUS-31026',
    customerName: 'rohith',
    customerEmail: 'pharmayushtechteam@gmail.com',
    customerPhone: '+971 50 987 6543',
    destinationCity: 'International City',
    destinationCountry: 'United Arab Emirates',
    destinationFlag: '🇦🇪',
    shippingAddress: {
      street: 'Cluster France, Building F-03, Flat 204',
      city: 'International City',
      state: 'Dubai',
      postalCode: '00000',
      country: 'United Arab Emirates',
    },
    billingAddress: {
      name: 'rohith',
      email: 'pharmayushtechteam@gmail.com',
      country: 'United Arab Emirates',
    },
    items: [
      { id: 'item-101', title: 'Puma Men Lightweight Running Sneakers', store: 'Flipkart', price: 2999, qty: 1, total: 2999 },
      { id: 'item-102', title: 'FabIndia Linen Long Kurta Set', store: 'Tata CLIQ', price: 2499, qty: 1, total: 2499 },
      { id: 'item-103', title: 'Organic India Tulsi Herbal Infusion Teas (Pack of 4)', store: 'Amazon India', price: 400, qty: 4, total: 1600 },
      { id: 'item-104', title: 'Boat Wireless Bluetooth Earbuds', store: 'amazon.in', price: 949.5, qty: 2, total: 1899 },
      { id: 'item-105', title: 'Biotique Bio Kelp Protein Shampoo 340ml', store: 'Myntra', price: 410, qty: 2, total: 820 },
      { id: 'item-106', title: 'Handcrafted Brass Incense Holder', store: 'Indian Store', price: 1250, qty: 1, total: 1250 },
      { id: 'item-107', title: 'AJIO Denim Jacket Indigo Blue', store: 'AJIO', price: 2199, qty: 1, total: 2199 },
    ],
    subtotalINR: 20166,
    domesticShippingINR: 450,
    serviceFeeINR: 950,
    estimatedTaxINR: 3845,
    discountINR: 0,
    totalINR: 25411,
    paymentMethod: 'Credit Card (Stripe International)',
    paymentStatus: 'Paid',
    emailStatus: 'Pending',
    emailSentAt: undefined,
    emailDeliveryLog: 'Invoice generated for order ORD-31026. Ready for live automated dispatch via SMTP to pharmayushtechteam@gmail.com.',
    emailAttemptCount: 0,
  },
  {
    id: 'INV-2026-90241',
    orderId: 'ORD-90241',
    invoiceNumber: 'INV-2026-90241',
    createdAt: '06 Nov 2024, 10:45 AM',
    customerId: 'CUS-10028',
    customerName: 'Priya Sharma',
    customerEmail: 'priya.sharma@example.com',
    customerPhone: '+971 50 123 4567',
    destinationCity: 'Dubai',
    destinationCountry: 'United Arab Emirates',
    destinationFlag: '🇦🇪',
    shippingAddress: {
      street: 'Villa 14, Al Safa 2, Jumeirah',
      city: 'Dubai',
      state: 'Dubai',
      postalCode: '00000',
      country: 'United Arab Emirates',
    },
    billingAddress: {
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      country: 'United Arab Emirates',
    },
    items: [
      { id: 'item-1', title: 'Nike Air Zoom Pegasus Running Shoes', store: 'Amazon India', price: 3999, qty: 1, total: 3999 },
      { id: 'item-2', title: 'Anouk Women Pink Embroidered Kurta', store: 'Myntra', price: 1299, qty: 1, total: 1299 },
      { id: 'item-3', title: 'Milton Thermosteel Flask 1000ml', store: 'Flipkart', price: 799, qty: 2, total: 1598 },
    ],
    subtotalINR: 6896,
    domesticShippingINR: 350,
    serviceFeeINR: 500,
    estimatedTaxINR: 2499,
    discountINR: 0,
    totalINR: 10245,
    paymentMethod: 'Credit Card (Stripe)',
    paymentStatus: 'Paid',
    emailStatus: 'Sent',
    emailSentAt: '06 Nov 2024, 10:46 AM',
    emailDeliveryLog: 'Delivered via Transactional Email Service (Mock Sandbox) to priya.sharma@example.com. Status: 250 OK.',
    emailAttemptCount: 1,
  },
  {
    id: 'INV-2026-90240',
    orderId: 'ORD-90240',
    invoiceNumber: 'INV-2026-90240',
    createdAt: '05 Nov 2024, 02:15 PM',
    customerId: 'CUS-10042',
    customerName: 'Rahul Mehta',
    customerEmail: 'rahul.mehta@example.com',
    customerPhone: '+1 415 555 0192',
    destinationCity: 'San Francisco',
    destinationCountry: 'United States',
    destinationFlag: '🇺🇸',
    shippingAddress: {
      street: '450 California St, Suite 1200',
      city: 'San Francisco',
      state: 'California',
      postalCode: '94104',
      country: 'United States',
    },
    billingAddress: {
      name: 'Rahul Mehta',
      email: 'rahul.mehta@example.com',
      country: 'United States',
    },
    items: [
      { id: 'item-4', title: 'FabIndia Pure Silk Kurta Set', store: 'Tata CliQ', price: 5499, qty: 1, total: 5499 },
      { id: 'item-5', title: 'Handcrafted Brass Puja Diya Set', store: 'FabIndia', price: 2501, qty: 1, total: 2501 },
    ],
    subtotalINR: 8000,
    domesticShippingINR: 450,
    serviceFeeINR: 750,
    estimatedTaxINR: 3340,
    discountINR: 0,
    totalINR: 12540,
    paymentMethod: 'PayPal International',
    paymentStatus: 'Paid',
    emailStatus: 'Sent',
    emailSentAt: '05 Nov 2024, 02:16 PM',
    emailDeliveryLog: 'Delivered via Transactional Email Service (Mock Sandbox) to rahul.mehta@example.com. Status: 250 OK.',
    emailAttemptCount: 1,
  },
  {
    id: 'INV-2026-90239',
    orderId: 'ORD-90239',
    invoiceNumber: 'INV-2026-90239',
    createdAt: '04 Nov 2024, 11:20 AM',
    customerId: 'CUS-10034',
    customerName: 'Ahmed Khan',
    customerEmail: 'ahmed.khan@example.com',
    customerPhone: '+971 52 987 6543',
    destinationCity: 'Abu Dhabi',
    destinationCountry: 'United Arab Emirates',
    destinationFlag: '🇦🇪',
    shippingAddress: {
      street: 'Corniche Road, Al Danah',
      city: 'Abu Dhabi',
      state: 'Abu Dhabi',
      postalCode: '00000',
      country: 'United Arab Emirates',
    },
    billingAddress: {
      name: 'Ahmed Khan',
      email: 'ahmed.khan@example.com',
      country: 'United Arab Emirates',
    },
    items: [
      { id: 'item-6', title: 'OnePlus Nord Buds 2 Wireless Earphones', store: 'Amazon India', price: 2999, qty: 2, total: 5998 },
      { id: 'item-7', title: 'Seiko Automatic Watch Strap Replacement', store: 'Amazon India', price: 12902, qty: 1, total: 12902 },
    ],
    subtotalINR: 18900,
    domesticShippingINR: 0,
    serviceFeeINR: 950,
    estimatedTaxINR: 0,
    discountINR: 950,
    totalINR: 18900,
    paymentMethod: 'Credit Card',
    paymentStatus: 'Paid',
    emailStatus: 'Sent',
    emailSentAt: '04 Nov 2024, 11:21 AM',
    emailDeliveryLog: 'Delivered via Transactional Email Service (Mock Sandbox) to ahmed.khan@example.com. Status: 250 OK.',
    emailAttemptCount: 1,
  },
  {
    id: 'INV-2026-90238',
    orderId: 'ORD-90238',
    invoiceNumber: 'INV-2026-90238',
    createdAt: '03 Nov 2024, 04:30 PM',
    customerId: 'CUS-10089',
    customerName: 'Suresh Reddy',
    customerEmail: 'suresh.reddy@example.com',
    customerPhone: '+1 647 555 7890',
    destinationCity: 'Toronto',
    destinationCountry: 'Canada',
    destinationFlag: '🇨🇦',
    shippingAddress: {
      street: '100 King Street West',
      city: 'Toronto',
      state: 'Ontario',
      postalCode: 'M5X 1A9',
      country: 'Canada',
    },
    billingAddress: {
      name: 'Suresh Reddy',
      email: 'suresh.reddy@example.com',
      country: 'Canada',
    },
    items: [
      { id: 'item-8', title: 'Kaveri Copper Water Dispenser 5L', store: 'Amazon India', price: 3450, qty: 1, total: 3450 },
    ],
    subtotalINR: 3450,
    domesticShippingINR: 200,
    serviceFeeINR: 350,
    estimatedTaxINR: 920,
    discountINR: 0,
    totalINR: 4920,
    paymentMethod: 'Wire Transfer',
    paymentStatus: 'Paid',
    emailStatus: 'Pending',
    emailSentAt: undefined,
    emailDeliveryLog: 'Queued for delivery. Awaiting retry acceptance from mail provider.',
    emailAttemptCount: 0,
  },
];

/**
 * Retrieve all persisted invoices
 */
export function getAllInvoices(): CustomerOrderInvoice[] {
  try {
    const raw = localStorage.getItem(INVOICE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(INITIAL_SEED_INVOICES));
      return INITIAL_SEED_INVOICES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const has31026 = parsed.some((i) => i.id === 'INV-2026-31026' || i.invoiceNumber === 'INV-2026-31026');
      if (!has31026) {
        const merged = [INITIAL_SEED_INVOICES[0], ...parsed];
        saveInvoices(merged);
        return merged;
      }
      return parsed;
    }
    return INITIAL_SEED_INVOICES;
  } catch (err) {
    console.error('Failed to load invoices:', err);
    return INITIAL_SEED_INVOICES;
  }
}

/**
 * Save invoice list to localStorage
 */
function saveInvoices(invoices: CustomerOrderInvoice[]): void {
  try {
    localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoices));
    window.dispatchEvent(new CustomEvent('i2w-invoices-updated', { detail: invoices }));
  } catch (err) {
    console.error('Failed to save invoices:', err);
  }
}

/**
 * Retrieve invoices specifically for the currently logged-in user or by customer ID/email (Strict Data Isolation)
 */
export function getInvoicesForCustomer(identifier?: string): CustomerOrderInvoice[] {
  const all = getAllInvoices();
  const user = getCurrentUser();
  const normTarget = (identifier || '').trim().toLowerCase();
  const emailNorm = (user.email || '').trim().toLowerCase();
  const idNorm = (user.customerId || '').trim().toLowerCase();

  // If specific identifier passed (e.g. CUS-XXXXX or email)
  if (normTarget) {
    return all.filter((inv) => {
      const invEmail = (inv.customerEmail || '').trim().toLowerCase();
      const invCustId = (inv.customerId || '').trim().toLowerCase();
      const invOrderId = (inv.orderId || '').trim().toLowerCase();
      return (
        invCustId === normTarget ||
        invEmail === normTarget ||
        invOrderId === normTarget
      );
    });
  }

  // Otherwise filter strictly by current logged-in customer identity
  if (!emailNorm && !idNorm) {
    return [];
  }

  return all.filter((inv) => {
    const invEmail = (inv.customerEmail || '').trim().toLowerCase();
    const invCustId = (inv.customerId || '').trim().toLowerCase();
    return (emailNorm && invEmail === emailNorm) || (idNorm && invCustId === idNorm);
  });
}

/**
 * Check if an order has already been processed (Deduplication / Idempotency guard)
 */
export function isOrderProcessed(orderId: string): boolean {
  try {
    const raw = localStorage.getItem(PROCESSED_ORDERS_KEY);
    const set: string[] = raw ? JSON.parse(raw) : [];
    return set.includes(orderId);
  } catch {
    return false;
  }
}

/**
 * Mark order as processed
 */
function markOrderProcessed(orderId: string): void {
  try {
    const raw = localStorage.getItem(PROCESSED_ORDERS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(orderId)) {
      list.push(orderId);
      localStorage.setItem(PROCESSED_ORDERS_KEY, JSON.stringify(list));
    }
  } catch {
    // ignore
  }
}

/**
 * Create a new order and automatically generate & email its invoice
 */
export interface CreateOrderParams {
  user: UserProfile;
  products: Array<{
    name: string;
    storeName?: string;
    store?: string;
    priceINR: number;
    quantity: number;
  }>;
  costSummary: {
    subtotal: number;
    domesticShipping?: number;
    serviceFee: number;
    tax?: number;
    discount?: number;
    total: number;
  };
  paymentMethod?: string;
  destinationCity?: string;
  destinationCountry?: string;
  existingOrderId?: string;
}

export function createOrderAndAutomateInvoice(params: CreateOrderParams): {
  invoice: CustomerOrderInvoice;
  isDuplicate: boolean;
} {
  const { user, products, costSummary, paymentMethod, destinationCity, destinationCountry } = params;

  // 1. Generate or use existing Order ID
  const orderId = params.existingOrderId || `ORD-${Math.floor(10000 + Math.random() * 90000)}`;

  // 2. Prevent duplicate invoice creation if already processed
  const existingInvoices = getAllInvoices();
  const existing = existingInvoices.find((i) => i.orderId === orderId);
  if (existing) {
    return { invoice: existing, isDuplicate: true };
  }

  const invoiceNum = `INV-2026-${orderId.replace('ORD-', '')}`;
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const invoiceItems: InvoiceItem[] = products.map((p, idx) => ({
    id: `item-${idx + 1}`,
    title: p.name,
    store: p.storeName || p.store || 'Indian Online Store',
    price: p.priceINR,
    qty: p.quantity,
    total: p.priceINR * p.quantity,
  }));

  const newInvoice: CustomerOrderInvoice = {
    id: invoiceNum,
    orderId,
    invoiceNumber: invoiceNum,
    createdAt: dateFormatted,
    customerId: user.customerId || 'CUS-10028',
    customerName: user.name || 'Valued Customer',
    customerEmail: user.email, // Automatically bound to registered account
    customerPhone: user.phone || '+91 98765 43210',
    destinationCity: destinationCity || 'Dubai',
    destinationCountry: destinationCountry || user.country || 'United Arab Emirates',
    destinationFlag: user.countryCode ? `📍` : '🌍',
    shippingAddress: {
      street: `${user.lockerId || 'I2W-Warehouse'}, Central Hub`,
      city: destinationCity || 'Dubai',
      state: destinationCity || 'Dubai',
      postalCode: '00000',
      country: destinationCountry || user.country || 'United Arab Emirates',
    },
    billingAddress: {
      name: user.name,
      email: user.email,
      country: user.country || 'United Arab Emirates',
    },
    items: invoiceItems,
    subtotalINR: costSummary.subtotal,
    domesticShippingINR: costSummary.domesticShipping || 0,
    serviceFeeINR: costSummary.serviceFee,
    estimatedTaxINR: costSummary.tax || 0,
    discountINR: costSummary.discount || 0,
    totalINR: costSummary.total,
    paymentMethod: paymentMethod || 'Credit / Debit Card (Online)',
    paymentStatus: 'Paid',
    emailStatus: 'Pending',
    emailSentAt: undefined,
    emailDeliveryLog: `Invoice generated for order ${orderId}. Ready for electronic email dispatch to ${user.email}.`,
    emailAttemptCount: 0,
  };

  // Prepend new invoice
  const updatedInvoices = [newInvoice, ...existingInvoices];
  saveInvoices(updatedInvoices);
  markOrderProcessed(orderId);

  return { invoice: newInvoice, isDuplicate: false };
}

/**
 * Resend or Retry Invoice Email (For Admin & Customer actions)
 * Calls the real backend /api/send-invoice-email endpoint with PDF generation & SMTP delivery.
 */
export async function resendInvoiceEmail(
  invoiceNumber: string,
  targetEmailOverride?: string
): Promise<{ success: boolean; status: InvoiceEmailStatus; message: string; timestamp: string; error?: string }> {
  const all = getAllInvoices();
  const index = all.findIndex((i) => i.invoiceNumber === invoiceNumber || i.id === invoiceNumber);

  const now = new Date();
  const timestamp = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  if (index === -1) {
    return {
      success: false,
      status: 'Failed',
      message: `Invoice ${invoiceNumber} not found in system records.`,
      error: `Invoice ${invoiceNumber} not found in system records.`,
      timestamp,
    };
  }

  const invoice = all[index];
  const recipient = (targetEmailOverride || invoice.customerEmail).trim();

  try {
    const res = await fetch('/api/send-invoice-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoice,
        targetEmail: recipient,
        forceRetry: true,
      }),
    });

    const data = await res.json();

    if (data.success && (data.status === 'Sent' || data.status === 'SMTP_Accepted')) {
      const deliveryLog = data.deliveryNote
        ? `${data.deliveryNote} | Response: ${data.response || '250 OK'} | MsgId: ${data.messageId || 'OK'}`
        : `Accepted by SMTP relay server (${data.response || '250 OK'}). Dispatched to ${recipient}. Message-ID: ${data.messageId || 'OK'}`;

      const updatedInvoice: CustomerOrderInvoice = {
        ...invoice,
        emailStatus: 'Sent',
        emailSentAt: data.timestamp || timestamp,
        emailAttemptCount: (invoice.emailAttemptCount || 0) + 1,
        emailDeliveryLog: deliveryLog,
      };
      all[index] = updatedInvoice;
      saveInvoices(all);

      return {
        success: true,
        status: 'Sent',
        message: data.message || `Official invoice ${invoiceNumber} with attached PDF successfully emailed to ${recipient}`,
        timestamp: data.timestamp || timestamp,
        deliveryNote: data.deliveryNote,
        response: data.response,
        messageId: data.messageId,
        inboxAdvice: data.inboxAdvice,
      } as any;
    } else {
      const errorMsg = data.error || data.message || 'SMTP sending failed. Check SMTP configuration in .env';
      const updatedInvoice: CustomerOrderInvoice = {
        ...invoice,
        emailStatus: 'Failed',
        emailAttemptCount: (invoice.emailAttemptCount || 0) + 1,
        emailDeliveryLog: `Email delivery attempt failed: ${errorMsg}`,
      };
      all[index] = updatedInvoice;
      saveInvoices(all);

      return {
        success: false,
        status: 'Failed',
        message: `Failed to deliver email to ${recipient}`,
        error: errorMsg,
        timestamp,
        configMissing: data.configMissing,
      } as any;
    }
  } catch (err: any) {
    const errorMsg = err.message || 'Network connection to email service failed.';
    const updatedInvoice: CustomerOrderInvoice = {
      ...invoice,
      emailStatus: 'Failed',
      emailAttemptCount: (invoice.emailAttemptCount || 0) + 1,
      emailDeliveryLog: `Email delivery failed: ${errorMsg}`,
    };
    all[index] = updatedInvoice;
    saveInvoices(all);

    return {
      success: false,
      status: 'Failed',
      message: `Failed to deliver email to ${recipient}`,
      error: errorMsg,
      timestamp,
    };
  }
}

/**
 * Update the recipient email for an existing invoice record and mark for re-dispatch
 */
export function updateInvoiceCustomerEmail(invoiceNumber: string, newEmail: string): boolean {
  const all = getAllInvoices();
  const idx = all.findIndex((i) => i.invoiceNumber === invoiceNumber || i.id === invoiceNumber);
  if (idx === -1) return false;

  all[idx].customerEmail = newEmail.trim();
  if (all[idx].billingAddress) {
    all[idx].billingAddress.email = newEmail.trim();
  }
  all[idx].emailDeliveryLog = `Recipient email updated to ${newEmail.trim()}. Ready to dispatch.`;
  all[idx].emailStatus = 'Pending';
  saveInvoices(all);
  return true;
}

/**
 * Generate high-fidelity branded HTML invoice document for preview & PDF printing
 */
export function generateInvoiceHtml(invoice: CustomerOrderInvoice): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>India2World Official Tax Invoice - ${invoice.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 36px;
      line-height: 1.5;
      font-size: 13px;
    }
    .invoice-wrapper {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 32px;
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0066FF;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .logo-badge {
      display: inline-block;
      background: #0066FF;
      color: #ffffff;
      font-weight: 800;
      font-size: 18px;
      padding: 6px 14px;
      border-radius: 8px;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h1 {
      font-size: 22px;
      color: #0b1933;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .inv-meta {
      font-size: 12px;
      color: #475569;
      margin-top: 4px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .card-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 6px;
    }
    .card-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .card-text {
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
    }
    .card-email {
      font-size: 12px;
      color: #0066FF;
      font-weight: 600;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      text-align: left;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12.5px;
      color: #1e293b;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-area {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .totals-table {
      width: 320px;
    }
    .totals-table td {
      padding: 6px 0;
      border: none;
    }
    .grand-total {
      font-size: 16px !important;
      font-weight: 800 !important;
      color: #0066FF !important;
      border-top: 2px solid #0066FF !important;
      padding-top: 8px !important;
    }
    .status-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      color: #166534;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      font-size: 11px;
      color: #64748b;
      text-align: center;
      line-height: 1.6;
    }
    @media print {
      body { padding: 0; background: none; }
      .invoice-wrapper { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-wrapper">
    <div class="header">
      <div>
        <div class="logo-badge">India2World</div>
        <div class="brand-sub">Cross-Border Assisted Purchase & Forwarding</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">GSTIN: 27AAACI1234D1Z8 &bull; CIN: U63090MH2024PTC123456</div>
      </div>
      <div class="invoice-title">
        <h1>Official Tax Invoice</h1>
        <div class="inv-meta">Invoice No: <strong>${invoice.invoiceNumber}</strong></div>
        <div class="inv-meta">Order ID: <strong>${invoice.orderId}</strong></div>
        <div class="inv-meta">Date: ${invoice.createdAt}</div>
      </div>
    </div>

    <div class="status-banner">
      <div>
        <span>Payment Status: <strong>${invoice.paymentStatus}</strong> via ${invoice.paymentMethod}</span>
      </div>
      <div>
        <span>Automated Delivery: <strong>${invoice.emailStatus} to ${invoice.customerEmail}</strong></span>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Billed To (Registered Customer)</div>
        <div class="card-name">${invoice.customerName}</div>
        <div class="card-text">Customer ID: <strong>${invoice.customerId}</strong></div>
        <div class="card-email">Account Email: ${invoice.customerEmail}</div>
        <div class="card-text">Destination: ${invoice.destinationCity}, ${invoice.destinationCountry}</div>
      </div>
      <div class="card">
        <div class="card-title">Warehouse & Fulfillment Hub</div>
        <div class="card-name">India2World Central Processing Hub</div>
        <div class="card-text">Plot 42, Udyog Vihar Phase 4</div>
        <div class="card-text">Gurugram, Haryana - 122016, India</div>
        <div class="card-text">Support: support@india2world.com | +91 98765 43210</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th style="width: 50%;">Item & Store Description</th>
          <th style="width: 10%;" class="text-center">Qty</th>
          <th style="width: 17%;" class="text-right">Unit Price</th>
          <th style="width: 18%;" class="text-right">Total (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items
          .map(
            (item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>
              <strong>${item.title}</strong>
              <div style="font-size: 11px; color: #64748b;">Merchant / Store: ${item.store}</div>
            </td>
            <td class="text-center">${item.qty}</td>
            <td class="text-right">₹${item.price.toLocaleString('en-IN')}</td>
            <td class="text-right" style="font-weight: 600;">₹${item.total.toLocaleString('en-IN')}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div class="totals-area">
      <table class="totals-table">
        <tr>
          <td style="color: #64748b;">Products Subtotal:</td>
          <td class="text-right" style="font-weight: 600;">₹${invoice.subtotalINR.toLocaleString('en-IN')}</td>
        </tr>
        ${
          invoice.domesticShippingINR > 0
            ? `<tr>
                <td style="color: #64748b;">Domestic Merchant Shipping:</td>
                <td class="text-right" style="font-weight: 600;">₹${invoice.domesticShippingINR.toLocaleString('en-IN')}</td>
              </tr>`
            : ''
        }
        <tr>
          <td style="color: #64748b;">Assisted Procurement Fee:</td>
          <td class="text-right" style="font-weight: 600;">₹${invoice.serviceFeeINR.toLocaleString('en-IN')}</td>
        </tr>
        ${
          invoice.estimatedTaxINR > 0
            ? `<tr>
                <td style="color: #64748b;">Applicable Taxes & Export Handling:</td>
                <td class="text-right" style="font-weight: 600;">₹${invoice.estimatedTaxINR.toLocaleString('en-IN')}</td>
              </tr>`
            : ''
        }
        ${
          invoice.discountINR > 0
            ? `<tr>
                <td style="color: #10b981;">Promotional Discount:</td>
                <td class="text-right" style="font-weight: 600; color: #10b981;">-₹${invoice.discountINR.toLocaleString('en-IN')}</td>
              </tr>`
            : ''
        }
        <tr>
          <td class="grand-total">Total Amount Paid:</td>
          <td class="grand-total text-right">₹${invoice.totalINR.toLocaleString('en-IN')}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <p>This is a computer-generated tax invoice for your registered purchase. No physical signature is required.</p>
      <p>India2World Global Logistics Desk &bull; Email: support@india2world.com &bull; Website: https://india2world.com</p>
      <p style="margin-top: 4px; font-size: 10px; color: #94a3b8;">Audit Log: ${invoice.emailDeliveryLog || 'Electronic copy transmitted to ' + invoice.customerEmail}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Trigger browser download of invoice as official PDF document
 */
export async function downloadInvoiceDocument(invoice: CustomerOrderInvoice): Promise<void> {
  try {
    const res = await fetch('/api/download-invoice-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `India2World_Tax_Invoice_${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
  } catch (err) {
    console.warn('PDF endpoint not available, falling back to HTML invoice download', err);
  }

  // Fallback to HTML if server endpoint is unavailable
  const htmlContent = generateInvoiceHtml(invoice);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `India2World_Invoice_${invoice.invoiceNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Print or Save as PDF using system print dialog
 */
export function printInvoiceDocument(invoice: CustomerOrderInvoice): void {
  const htmlContent = generateInvoiceHtml(invoice);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 350);
  }
}

// ==========================================
// AUTOMATED CUSTOMER QUOTATION ARCHITECTURE
// ==========================================

export const QUOTATION_STORAGE_KEY = 'i2w_customer_quotations_v1';
export const QUOTATIONS_UPDATED_EVENT = 'i2w-quotations-updated';

export interface CustomerQuotationRecord {
  id: string; // e.g. QTE-20482
  quotationNumber: string;
  requestId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  destinationCity: string;
  destinationCountry: string;
  items: InvoiceItem[];
  subtotalINR: number;
  domesticShippingINR: number;
  serviceFeeINR: number;
  taxINR: number;
  discountINR: number;
  totalINR: number;
  createdAt: string;
  validUntil: string;
  emailStatus: 'Preparing' | 'Sent' | 'Failed' | 'Pending';
  emailSentAt?: string;
  emailDeliveryLog?: string;
  emailAttemptCount: number;
}

/**
 * Validates standard RFC email syntax
 */
export function isValidCustomerEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Verify and retrieve the recipient email strictly from the customer's registered account
 */
export function lookupRegisteredCustomer(customerId: string, customerName?: string): {
  email: string | null;
  name: string;
  phone: string;
  country: string;
  city: string;
  isRegistered: boolean;
  validationError?: string;
} {
  const normId = (customerId || '').trim().toLowerCase();
  const normName = (customerName || '').trim().toLowerCase();

  // Known registered customer fast-path mapping
  if (normName === 'priya sharma' || normId === 'cus-10028') {
    return {
      email: 'priya.sharma@example.com',
      name: 'Priya Sharma',
      phone: '+971 50 123 4567',
      country: 'United Arab Emirates',
      city: 'Dubai',
      isRegistered: true,
    };
  }
  if (normName === 'rahul mehta' || normId === 'cus-10042') {
    return {
      email: 'rahul.mehta@example.com',
      name: 'Rahul Mehta',
      phone: '+1 415 555 0192',
      country: 'United States',
      city: 'San Francisco',
      isRegistered: true,
    };
  }
  if (normName === 'ahmed khan' || normId === 'cus-10034') {
    return {
      email: 'ahmed.k@example.com',
      name: 'Ahmed Khan',
      phone: '+971 52 334 5566',
      country: 'United Arab Emirates',
      city: 'Abu Dhabi',
      isRegistered: true,
    };
  }
  if (normName === 'john doe' || normId === 'cus-10001') {
    return {
      email: 'john@example.com',
      name: 'John Doe',
      phone: '+91 98765 43210',
      country: 'United Arab Emirates',
      city: 'Dubai',
      isRegistered: true,
    };
  }

  // 1. Check logged-in user profile in localStorage (only if names match or no conflict)
  const currentUser = getCurrentUser();
  const nameMismatch = normName && currentUser.name && currentUser.name.toLowerCase() !== normName;
  if (
    currentUser &&
    currentUser.email &&
    !nameMismatch &&
    ((normId && currentUser.customerId.toLowerCase() === normId) ||
      (normName && currentUser.name.toLowerCase() === normName))
  ) {
    if (isValidCustomerEmail(currentUser.email)) {
      return {
        email: currentUser.email.trim().toLowerCase(),
        name: currentUser.name,
        phone: currentUser.phone || '+971 50 123 4567',
        country: currentUser.country || 'United Arab Emirates',
        city: 'Dubai',
        isRegistered: true,
      };
    }
  }

  // 2. Check registered accounts dictionary in localStorage
  try {
    const rawReg = localStorage.getItem('i2w_registered_users');
    if (rawReg) {
      const regMap = JSON.parse(rawReg);
      for (const key of Object.keys(regMap)) {
        const u = regMap[key];
        if (
          u &&
          u.email &&
          ((normId && (u.customerId || '').toLowerCase() === normId) ||
            (normName && (u.name || '').toLowerCase() === normName))
        ) {
          if (isValidCustomerEmail(u.email)) {
            return {
              email: u.email.trim().toLowerCase(),
              name: u.name,
              phone: u.phone || '+971 50 123 4567',
              country: u.country || 'United Arab Emirates',
              city: 'Dubai',
              isRegistered: true,
            };
          }
        }
      }
    }
  } catch (err) {
    console.error('Error reading registered users registry:', err);
  }

  // 3. Check integrated customers list in localStorage (i2w_integrated_customers_v2)
  try {
    const rawCust = localStorage.getItem('i2w_integrated_customers_v2');
    if (rawCust) {
      const custList = JSON.parse(rawCust);
      if (Array.isArray(custList)) {
        const matched = custList.find(
          (c: any) =>
            (normId && (c.id || '').toLowerCase() === normId) ||
            (normName && (c.name || '').toLowerCase() === normName) ||
            (normId && (c.email || '').toLowerCase() === normId)
        );
        if (matched && matched.email) {
          if (isValidCustomerEmail(matched.email)) {
            return {
              email: matched.email.trim().toLowerCase(),
              name: matched.name || customerName || 'Valued Customer',
              phone: matched.phone || '+91 98765 43210',
              country: matched.country || 'International',
              city: matched.city || 'City',
              isRegistered: true,
            };
          }
        }
      }
    }
  } catch (err) {
    console.error('Error reading integrated customers:', err);
  }

  // 4. Check integrated purchase requests in localStorage (i2w_integrated_requests_v2)
  try {
    const rawReq = localStorage.getItem('i2w_integrated_requests_v2');
    if (rawReq) {
      const reqList = JSON.parse(rawReq);
      if (Array.isArray(reqList)) {
        const matched = reqList.find(
          (r: any) =>
            (normId && ((r.customerId || '').toLowerCase() === normId || (r.id || '').toLowerCase() === normId)) ||
            (normName && (r.customerName || '').toLowerCase() === normName)
        );
        if (matched && matched.customerEmail && isValidCustomerEmail(matched.customerEmail)) {
          return {
            email: matched.customerEmail.trim().toLowerCase(),
            name: matched.customerName || customerName || 'Valued Customer',
            phone: '+91 98765 43210',
            country: matched.destinationCountry || 'International',
            city: matched.destinationCity || 'City',
            isRegistered: true,
          };
        }
      }
    }
  } catch (err) {
    console.error('Error reading integrated requests for email:', err);
  }

  // 5. Check official admin customer registry (ADMIN_CUSTOMERS in adminMockData)
  const matchedAdminCustomer = ADMIN_CUSTOMERS.find(
    (c) =>
      (normId && c.id.toLowerCase() === normId) ||
      (normName && c.name.toLowerCase() === normName)
  );

  if (matchedAdminCustomer && matchedAdminCustomer.email) {
    if (isValidCustomerEmail(matchedAdminCustomer.email)) {
      return {
        email: matchedAdminCustomer.email.trim().toLowerCase(),
        name: matchedAdminCustomer.name,
        phone: matchedAdminCustomer.phone,
        country: matchedAdminCustomer.country,
        city: matchedAdminCustomer.city,
        isRegistered: true,
      };
    } else {
      return {
        email: matchedAdminCustomer.email,
        name: matchedAdminCustomer.name,
        phone: matchedAdminCustomer.phone,
        country: matchedAdminCustomer.country,
        city: matchedAdminCustomer.city,
        isRegistered: false,
        validationError: `Registered customer email "${matchedAdminCustomer.email}" has an invalid email format.`,
      };
    }
  }

  return {
    email: null,
    name: customerName || 'Unknown Customer',
    phone: '',
    country: '',
    city: '',
    isRegistered: false,
    validationError: `No verified registered customer account found for ID "${customerId}". Automated email delivery stopped.`,
  };
}

/**
 * Retrieve all persisted customer quotations
 */
export function getAllQuotations(): CustomerQuotationRecord[] {
  try {
    const raw = localStorage.getItem(QUOTATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Get quotation record by purchase request ID
 */
export function getQuotationByRequestId(requestId: string): CustomerQuotationRecord | null {
  const all = getAllQuotations();
  return all.find((q) => q.requestId === requestId || q.id === requestId) || null;
}

/**
 * Save quotation record to storage and synchronize with customer dashboard
 */
export function saveQuotationRecord(quotation: CustomerQuotationRecord): void {
  try {
    const all = getAllQuotations();
    const idx = all.findIndex((q) => q.id === quotation.id || q.requestId === quotation.requestId);
    if (idx >= 0) {
      all[idx] = quotation;
    } else {
      all.unshift(quotation);
    }
    localStorage.setItem(QUOTATION_STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent(QUOTATIONS_UPDATED_EVENT, { detail: quotation }));

    // Also synchronize to customer invoice feed as a Pro-Forma Quotation so customer can access & pay
    const allInvoices = getAllInvoices();
    const invIdx = allInvoices.findIndex((i) => i.id === quotation.quotationNumber || i.orderId === quotation.requestId);
    const quotationInvoice: CustomerOrderInvoice = {
      id: quotation.quotationNumber,
      orderId: quotation.requestId,
      invoiceNumber: quotation.quotationNumber,
      createdAt: quotation.createdAt,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      customerEmail: quotation.customerEmail,
      customerPhone: quotation.customerPhone,
      destinationCity: quotation.destinationCity,
      destinationCountry: quotation.destinationCountry,
      destinationFlag: '📍',
      shippingAddress: {
        street: 'Registered Locker / Delivery Address',
        city: quotation.destinationCity,
        state: quotation.destinationCity,
        postalCode: '00000',
        country: quotation.destinationCountry,
      },
      billingAddress: {
        name: quotation.customerName,
        email: quotation.customerEmail,
        country: quotation.destinationCountry,
      },
      items: quotation.items,
      subtotalINR: quotation.subtotalINR,
      domesticShippingINR: quotation.domesticShippingINR,
      serviceFeeINR: quotation.serviceFeeINR,
      estimatedTaxINR: quotation.taxINR,
      discountINR: quotation.discountINR,
      totalINR: quotation.totalINR,
      paymentMethod: 'Assisted Purchase Quotation',
      paymentStatus: 'Pending',
      emailStatus: quotation.emailStatus === 'Sent' ? 'Sent' : quotation.emailStatus === 'Failed' ? 'Failed' : 'Pending',
      emailSentAt: quotation.emailSentAt,
      emailDeliveryLog: quotation.emailDeliveryLog,
      emailAttemptCount: quotation.emailAttemptCount,
    };

    if (invIdx >= 0) {
      allInvoices[invIdx] = quotationInvoice;
    } else {
      allInvoices.unshift(quotationInvoice);
    }
    saveInvoices(allInvoices);
  } catch (err) {
    console.error('Failed to save quotation record:', err);
  }
}

/**
 * Automate the quotation creation, pricing validation, and transactional email dispatch
 */
export async function createAndAutomateQuotationEmail(params: {
  requestId: string;
  customerId: string;
  customerName: string;
  destinationCity: string;
  destinationCountry: string;
  items: Array<{
    id: number | string;
    name: string;
    store: string;
    specs?: string;
    priceINR: number;
    qty: number;
    totalINR: number;
  }>;
  costSummary: {
    productCost: number;
    domesticShipping?: number;
    serviceFee?: number;
    tax?: number;
    discount?: number;
    total?: number;
  };
  forceRetry?: boolean;
}): Promise<{
  quotation: CustomerQuotationRecord;
  isDuplicate: boolean;
  emailSuccess: boolean;
  message: string;
  deliveryLog: string;
}> {
  const { requestId, customerId, customerName, destinationCity, destinationCountry, items, costSummary, forceRetry } = params;

  // 1. Verify recipient email strictly from registered account
  const customerLookup = lookupRegisteredCustomer(customerId, customerName);
  if (!customerLookup.isRegistered || !customerLookup.email) {
    const errorMsg = customerLookup.validationError || 'Customer account has no verified email. Email delivery stopped.';
    const quotationNumber = `QTE-${requestId.replace('REQ-', '')}`;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const fallbackQuotation: CustomerQuotationRecord = {
      id: quotationNumber,
      quotationNumber,
      requestId,
      customerId,
      customerName,
      customerEmail: 'Unverified / Missing Email',
      customerPhone: customerLookup.phone,
      destinationCity: destinationCity || 'Dubai',
      destinationCountry: destinationCountry || 'UAE',
      items: items.map((p, idx) => ({
        id: String(p.id || idx + 1),
        title: p.name,
        store: p.store,
        price: p.priceINR,
        qty: p.qty,
        total: p.totalINR || p.priceINR * p.qty,
      })),
      subtotalINR: costSummary.productCost,
      domesticShippingINR: costSummary.domesticShipping || 0,
      serviceFeeINR: costSummary.serviceFee || 500,
      taxINR: costSummary.tax || 0,
      discountINR: costSummary.discount || 0,
      totalINR: (costSummary.productCost + (costSummary.domesticShipping || 0) + (costSummary.serviceFee || 500) + (costSummary.tax || 0)) - (costSummary.discount || 0),
      createdAt: dateFormatted,
      validUntil: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      emailStatus: 'Failed',
      emailDeliveryLog: errorMsg,
      emailAttemptCount: 0,
    };
    saveQuotationRecord(fallbackQuotation);
    return {
      quotation: fallbackQuotation,
      isDuplicate: false,
      emailSuccess: false,
      message: errorMsg,
      deliveryLog: errorMsg,
    };
  }

  const quotationNumber = `QTE-${requestId.replace('REQ-', '')}`;

  // 2. Prevent duplicate quotations and emails if already completed and not force retry
  const existing = getQuotationByRequestId(requestId);
  if (existing && existing.emailStatus === 'Sent' && !forceRetry) {
    return {
      quotation: existing,
      isDuplicate: true,
      emailSuccess: true,
      message: `Quotation ${quotationNumber} has already been sent to ${existing.customerEmail}.`,
      deliveryLog: existing.emailDeliveryLog || 'Delivered previously. Duplicate send prevented.',
    };
  }

  // 3. Compute verified financial figures
  const subtotal = items.reduce((acc, it) => acc + (it.priceINR * it.qty), 0);
  const domesticShipping = costSummary.domesticShipping ?? 350;
  const serviceFee = costSummary.serviceFee ?? 500;
  const tax = costSummary.tax ?? 0;
  const discount = costSummary.discount ?? 0;
  const grandTotal = subtotal + domesticShipping + serviceFee + tax - discount;

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const validUntilFormatted = new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const quotationRecord: CustomerQuotationRecord = {
    id: quotationNumber,
    quotationNumber,
    requestId,
    customerId,
    customerName: customerLookup.name || customerName,
    customerEmail: customerLookup.email,
    customerPhone: customerLookup.phone,
    destinationCity: destinationCity || customerLookup.city || 'Dubai',
    destinationCountry: destinationCountry || customerLookup.country || 'UAE',
    items: items.map((p, idx) => ({
      id: String(p.id || idx + 1),
      title: p.name,
      store: p.store,
      price: p.priceINR,
      qty: p.qty,
      total: p.totalINR || p.priceINR * p.qty,
    })),
    subtotalINR: subtotal,
    domesticShippingINR: domesticShipping,
    serviceFeeINR: serviceFee,
    taxINR: tax,
    discountINR: discount,
    totalINR: grandTotal,
    createdAt: dateFormatted,
    validUntil: validUntilFormatted,
    emailStatus: 'Preparing',
    emailAttemptCount: (existing ? existing.emailAttemptCount : 0) + 1,
  };

  // 4. Simulate Transactional Email Delivery Service Acceptance (800ms)
  await new Promise((resolve) => setTimeout(resolve, 800));

  const messageId = `<msg_qte_${requestId.toLowerCase()}_${Date.now()}@delivery.india2world.com>`;
  const deliveryLog = `Accepted by Transactional Mailer (Mock Sandbox Gateway). Subject: "Your India2World Quotation – ${quotationNumber}". Recipient: ${customerLookup.email}. Message-ID: ${messageId}. Response: 250 OK Message Queued.`;

  quotationRecord.emailStatus = 'Sent';
  quotationRecord.emailSentAt = dateFormatted;
  quotationRecord.emailDeliveryLog = deliveryLog;

  // 5. Persist record and sync to customer feed
  saveQuotationRecord(quotationRecord);

  return {
    quotation: quotationRecord,
    isDuplicate: false,
    emailSuccess: true,
    message: `Quotation PDF automatically generated & emailed to ${customerLookup.email}`,
    deliveryLog,
  };
}

/**
 * Retry email dispatch for failed quotations
 */
export async function retryQuotationEmail(requestId: string): Promise<{
  success: boolean;
  quotation: CustomerQuotationRecord | null;
  message: string;
}> {
  const quotation = getQuotationByRequestId(requestId);
  if (!quotation) {
    return { success: false, quotation: null, message: `Quotation for request ${requestId} not found.` };
  }

  // Verify recipient email
  if (!isValidCustomerEmail(quotation.customerEmail)) {
    return { success: false, quotation, message: 'Invalid customer email. Please verify customer account before retrying.' };
  }

  // Simulate network retry
  await new Promise((resolve) => setTimeout(resolve, 750));

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const messageId = `<msg_retry_${Date.now()}@delivery.india2world.com>`;
  const deliveryLog = `Successfully retried via Transactional Mailer (Mock Sandbox Gateway). Subject: "Your India2World Quotation – ${quotation.quotationNumber}". Recipient: ${quotation.customerEmail}. Message-ID: ${messageId}. Response: 250 OK.`;

  quotation.emailStatus = 'Sent';
  quotation.emailSentAt = dateFormatted;
  quotation.emailDeliveryLog = deliveryLog;
  quotation.emailAttemptCount += 1;

  saveQuotationRecord(quotation);

  return {
    success: true,
    quotation,
    message: `Quotation resent successfully to ${quotation.customerEmail}`,
  };
}

/**
 * Generate official branded HTML quotation invoice for preview, print, or download
 */
export function generateQuotationHtml(quote: CustomerQuotationRecord): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>India2World Official Customer Quotation - ${quote.quotationNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 32px;
      line-height: 1.5;
      font-size: 13px;
    }
    .wrapper {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 32px;
      background: #ffffff;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0066FF;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .logo-badge {
      display: inline-block;
      background: #0066FF;
      color: #ffffff;
      font-weight: 800;
      font-size: 18px;
      padding: 6px 14px;
      border-radius: 8px;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .title-area {
      text-align: right;
    }
    .title-area h1 {
      font-size: 20px;
      color: #0b1933;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-line {
      font-size: 12px;
      color: #475569;
      margin-top: 3px;
    }
    .email-banner {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      color: #166534;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .card-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 6px;
    }
    .card-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .card-text {
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
    }
    .card-email {
      font-size: 12px;
      color: #0066FF;
      font-weight: 600;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      text-align: left;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 12.5px;
      color: #1e293b;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals-area {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .totals-table {
      width: 340px;
    }
    .totals-table td {
      padding: 6px 0;
      border: none;
    }
    .grand-total {
      font-size: 16px !important;
      font-weight: 800 !important;
      color: #0066FF !important;
      border-top: 2px solid #0066FF !important;
      padding-top: 8px !important;
    }
    .next-step {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 12px 16px;
      font-size: 12px;
      color: #1e40af;
      margin-bottom: 24px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      font-size: 11px;
      color: #64748b;
      text-align: center;
      line-height: 1.6;
    }
    @media print {
      body { padding: 0; background: none; }
      .wrapper { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div>
        <div class="logo-badge">India2World</div>
        <div class="brand-sub">Cross-Border Assisted Purchase & Forwarding</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 4px;">GSTIN: 07AAAAA0000A1Z5 | IEC: 0510000000</div>
      </div>
      <div class="title-area">
        <h1>Customer Quotation</h1>
        <div class="meta-line">Quote Number: <strong>${quote.quotationNumber}</strong></div>
        <div class="meta-line">Purchase Request: <strong>${quote.requestId}</strong></div>
        <div class="meta-line">Date of Issue: ${quote.createdAt}</div>
        <div class="meta-line">Valid Until: <strong>${quote.validUntil}</strong></div>
      </div>
    </div>

    <div class="email-banner">
      <div>
        <span>Automated Email Delivery: <strong>${quote.emailStatus}</strong> to <strong>${quote.customerEmail}</strong></span>
      </div>
      <div>
        <span style="font-size: 11px; color: #15803d;">Status Code: 250 Accepted (Sandbox Gateway)</span>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title">Quoted For (Registered Customer)</div>
        <div class="card-name">${quote.customerName}</div>
        <div class="card-text">Customer ID: <strong>${quote.customerId}</strong></div>
        <div class="card-email">Account Email: ${quote.customerEmail}</div>
        <div class="card-text">Destination: ${quote.destinationCity}, ${quote.destinationCountry}</div>
      </div>
      <div class="card">
        <div class="card-title">Warehouse & Processing Hub</div>
        <div class="card-name">India2World Central Processing Hub</div>
        <div class="card-text">Plot 42, Udyog Vihar Phase 4</div>
        <div class="card-text">Gurugram, Haryana - 122016, India</div>
        <div class="card-text">Support: support@india2world.com | +91 98765 43210</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 5%;">#</th>
          <th style="width: 50%;">Item & Store Description</th>
          <th style="width: 10%;" class="text-center">Qty</th>
          <th style="width: 17%;" class="text-right">Unit Price</th>
          <th style="width: 18%;" class="text-right">Total (INR)</th>
        </tr>
      </thead>
      <tbody>
        ${quote.items
          .map(
            (item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>
              <strong>${item.title}</strong>
              <div style="font-size: 11px; color: #64748b;">Store: ${item.store}</div>
            </td>
            <td class="text-center">${item.qty}</td>
            <td class="text-right">₹${item.price.toLocaleString('en-IN')}</td>
            <td class="text-right" style="font-weight: 600;">₹${item.total.toLocaleString('en-IN')}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div class="totals-area">
      <table class="totals-table">
        <tr>
          <td style="color: #64748b;">Product Items (${quote.items.length}):</td>
          <td class="text-right" style="font-weight: 600;">₹${quote.subtotalINR.toLocaleString('en-IN')}</td>
        </tr>
        ${
          quote.domesticShippingINR > 0
            ? `<tr>
                <td style="color: #64748b;">Domestic Merchant Shipping:</td>
                <td class="text-right" style="font-weight: 600;">₹${quote.domesticShippingINR.toLocaleString('en-IN')}</td>
              </tr>`
            : ''
        }
        <tr>
          <td style="color: #64748b;">Handling & Service Fee:</td>
          <td class="text-right" style="font-weight: 600;">₹${quote.serviceFeeINR.toLocaleString('en-IN')}</td>
        </tr>
        ${
          quote.taxINR > 0
            ? `<tr>
                <td style="color: #64748b;">Taxes & Export Packaging:</td>
                <td class="text-right" style="font-weight: 600;">₹${quote.taxINR.toLocaleString('en-IN')}</td>
              </tr>`
            : ''
        }
        ${
          quote.discountINR > 0
            ? `<tr>
                <td style="color: #10b981;">Special Promotional Discount:</td>
                <td class="text-right" style="font-weight: 600; color: #10b981;">-₹${quote.discountINR.toLocaleString('en-IN')}</td>
              </tr>`
            : ''
        }
        <tr>
          <td class="grand-total">Total Quotation:</td>
          <td class="grand-total text-right">₹${quote.totalINR.toLocaleString('en-IN')}</td>
        </tr>
      </table>
    </div>

    <div class="next-step">
      <strong>Next Steps for Customer:</strong> Review this quotation in your India2World Customer Dashboard. Upon your approval and payment clearance, our dedicated procurement team will purchase your products within 24 business hours.
    </div>

    <div class="footer">
      <p>Thank you for choosing <strong>India2World</strong>. Fast, Secure, and Transparent Worldwide Shipping.</p>
      <p>This is a computer-generated official pro-forma quotation. No physical signature is required.</p>
      <p style="margin-top: 4px; font-size: 10px; color: #94a3b8;">${quote.emailDeliveryLog || 'Electronic copy transmitted to ' + quote.customerEmail}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Trigger download of Quotation PDF (HTML-based document)
 */
export function downloadQuotationPdf(quote: CustomerQuotationRecord): void {
  const html = generateQuotationHtml(quote);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `India2World_Quotation_${quote.quotationNumber}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Print quotation document directly
 */
export function printQuotationDocument(quote: CustomerQuotationRecord): void {
  const html = generateQuotationHtml(quote);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 350);
  }
}

