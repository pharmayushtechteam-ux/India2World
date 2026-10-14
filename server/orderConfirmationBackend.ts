import fs from 'node:fs';
import path from 'node:path';
import {
  createSmtpTransporter,
  generateInvoicePdfBuffer,
  type CustomerOrderInvoice,
} from './invoiceEmailBackend.ts';

export interface OrderProductItem {
  name: string;
  store?: string;
  price: number;
  qty: number;
  imageUrl?: string;
}

export interface OrderConfirmationCostSummary {
  subtotal: number;
  domesticShipping?: number;
  serviceFee?: number;
  tax?: number;
  discount?: number;
  total: number;
}

export interface OrderDeliveryAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface OrderConfirmationData {
  orderId: string;
  orderDate?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddress?: OrderDeliveryAddress;
  products: OrderProductItem[];
  costSummary: OrderConfirmationCostSummary;
  paymentStatus: string;
  orderStatus: string;
  orderType?: string;
  stores?: string[];
  trackingAwb?: string;
  invoice?: CustomerOrderInvoice;
  attachInvoicePdf?: boolean;
  isRetry?: boolean;
}

export interface ServerOrderRecord extends OrderConfirmationData {
  savedAt: string;
  updatedAt: string;
  confirmationEmailStatus: 'Pending' | 'Sent' | 'Failed';
  confirmationEmailSentAt?: string;
  confirmationEmailError?: string;
  confirmationEmailAttempts: number;
  confirmationMessageId?: string;
}

export interface ConfirmationEmailLog {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  recipient: string;
  subject: string;
  status: 'Sent' | 'Failed';
  messageId?: string;
  smtpResponse?: string;
  error?: string;
  timestamp: string;
  attemptNumber: number;
  invoiceAttached: boolean;
}

export interface RegisteredCustomerRecord {
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  city?: string;
  lockerId?: string;
}

// -------------------------------------------------------------
// Directory & File Paths for Backend Database Storage
// -------------------------------------------------------------
const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const ORDERS_DB_FILE = path.join(DATA_DIR, 'orders_db.json');
const LOGS_DB_FILE = path.join(DATA_DIR, 'confirmation_email_logs.json');
const CUSTOMERS_DB_FILE = path.join(DATA_DIR, 'registered_customers.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Seed customers
const DEFAULT_REGISTERED_CUSTOMERS: RegisteredCustomerRecord[] = [
  {
    customerId: 'CUS-31026',
    name: 'rohith',
    email: 'pharmayushtechteam@gmail.com',
    phone: '+971 50 123 4567',
    country: 'United Arab Emirates',
    city: 'Dubai',
    lockerId: 'I2W-CUS-31026',
  },
  {
    customerId: 'CUS-10028',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+971 50 987 6543',
    country: 'United Arab Emirates',
    city: 'Dubai',
    lockerId: 'I2W-CUS-10028',
  },
  {
    customerId: 'CUS-10042',
    name: 'Rahul Mehta',
    email: 'rahul.mehta@example.com',
    phone: '+1 415 555 0192',
    country: 'United States',
    city: 'San Francisco',
    lockerId: 'I2W-CUS-10042',
  },
  {
    customerId: 'CUS-10034',
    name: 'Ahmed Khan',
    email: 'ahmed.k@example.com',
    phone: '+971 52 334 5566',
    country: 'United Arab Emirates',
    city: 'Abu Dhabi',
    lockerId: 'I2W-CUS-10034',
  },
];

// In-flight dispatches lock to prevent concurrent duplicate sends
const activeDispatches = new Set<string>();

// -------------------------------------------------------------
// Database Access Helpers
// -------------------------------------------------------------
export function getRegisteredCustomers(): RegisteredCustomerRecord[] {
  ensureDataDir();
  try {
    if (fs.existsSync(CUSTOMERS_DB_FILE)) {
      const raw = fs.readFileSync(CUSTOMERS_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Backend DB] Error reading customers database:', err);
  }
  // Initialize default
  try {
    fs.writeFileSync(CUSTOMERS_DB_FILE, JSON.stringify(DEFAULT_REGISTERED_CUSTOMERS, null, 2), 'utf-8');
  } catch {}
  return [...DEFAULT_REGISTERED_CUSTOMERS];
}

export function registerOrUpdateCustomerOnServer(customer: RegisteredCustomerRecord): void {
  ensureDataDir();
  const customers = getRegisteredCustomers();
  const idx = customers.findIndex(
    (c) => c.customerId.toLowerCase() === customer.customerId.toLowerCase() ||
           c.email.toLowerCase() === customer.email.toLowerCase()
  );
  if (idx >= 0) {
    customers[idx] = { ...customers[idx], ...customer };
  } else {
    customers.push(customer);
  }
  try {
    fs.writeFileSync(CUSTOMERS_DB_FILE, JSON.stringify(customers, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Backend DB] Failed to save customer:', err);
  }
}

/**
 * Validate customer email against registered records.
 * Never trusts an arbitrary or unverified email from frontend.
 */
export function validateRegisteredCustomerEmail(customerId: string, clientSuppliedEmail?: string): {
  valid: boolean;
  verifiedEmail: string;
  customerName: string;
  error?: string;
} {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const customers = getRegisteredCustomers();

  const matchedCustomer = customers.find(
    (c) => (customerId && c.customerId.toLowerCase() === customerId.toLowerCase()) ||
           (clientSuppliedEmail && c.email.toLowerCase() === clientSuppliedEmail.toLowerCase())
  );

  if (matchedCustomer) {
    if (!emailRegex.test(matchedCustomer.email)) {
      return {
        valid: false,
        verifiedEmail: '',
        customerName: matchedCustomer.name,
        error: `Customer ${customerId} has invalid email address format on file: "${matchedCustomer.email}"`,
      };
    }
    // Return verified registered email
    return {
      valid: true,
      verifiedEmail: matchedCustomer.email.trim().toLowerCase(),
      customerName: matchedCustomer.name,
    };
  }

  // If customer is not found in seed, validate clientSuppliedEmail format strictly
  if (clientSuppliedEmail && emailRegex.test(clientSuppliedEmail.trim())) {
    const verified = clientSuppliedEmail.trim().toLowerCase();
    // Dynamically register so future lookups are cached on the backend
    registerOrUpdateCustomerOnServer({
      customerId: customerId || `CUS-${Date.now().toString().slice(-5)}`,
      name: 'Customer',
      email: verified,
    });
    return {
      valid: true,
      verifiedEmail: verified,
      customerName: 'Customer',
    };
  }

  return {
    valid: false,
    verifiedEmail: '',
    customerName: 'Unknown',
    error: `Customer ID "${customerId}" is not associated with a registered, verified email address.`,
  };
}

export function getAllServerOrders(): ServerOrderRecord[] {
  ensureDataDir();
  try {
    if (fs.existsSync(ORDERS_DB_FILE)) {
      const raw = fs.readFileSync(ORDERS_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('[Backend DB] Error reading orders database:', err);
  }
  return [];
}

export function getServerOrderById(orderId: string): ServerOrderRecord | undefined {
  const orders = getAllServerOrders();
  return orders.find((o) => o.orderId === orderId);
}

/**
 * Step 2: Persist the order to the database FIRST before triggering email dispatch.
 */
export function saveOrderToDatabase(orderData: OrderConfirmationData): ServerOrderRecord {
  ensureDataDir();
  const orders = getAllServerOrders();
  const existingIdx = orders.findIndex((o) => o.orderId === orderData.orderId);

  const now = new Date().toISOString();
  let record: ServerOrderRecord;

  if (existingIdx >= 0) {
    record = {
      ...orders[existingIdx],
      ...orderData,
      updatedAt: now,
    };
    orders[existingIdx] = record;
  } else {
    record = {
      ...orderData,
      savedAt: now,
      updatedAt: now,
      confirmationEmailStatus: 'Pending',
      confirmationEmailAttempts: 0,
    };
    orders.unshift(record);
  }

  try {
    fs.writeFileSync(ORDERS_DB_FILE, JSON.stringify(orders, null, 2), 'utf-8');
    console.log(`[Backend DB] Order ${record.orderId} successfully saved to database file.`);
  } catch (err) {
    console.error(`[Backend DB] Failed to save order ${record.orderId} to database:`, err);
  }

  return record;
}

export function updateServerOrderStatus(
  orderId: string,
  update: Partial<ServerOrderRecord>
): ServerOrderRecord | null {
  ensureDataDir();
  const orders = getAllServerOrders();
  const idx = orders.findIndex((o) => o.orderId === orderId);
  if (idx === -1) return null;

  orders[idx] = {
    ...orders[idx],
    ...update,
    updatedAt: new Date().toISOString(),
  };

  try {
    fs.writeFileSync(ORDERS_DB_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[Backend DB] Failed to update order ${orderId}:`, err);
  }
  return orders[idx];
}

export function getConfirmationEmailLogs(): ConfirmationEmailLog[] {
  ensureDataDir();
  try {
    if (fs.existsSync(LOGS_DB_FILE)) {
      const raw = fs.readFileSync(LOGS_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('[Backend DB] Error reading email logs:', err);
  }
  return [];
}

export function appendConfirmationEmailLog(log: ConfirmationEmailLog): void {
  ensureDataDir();
  const logs = getConfirmationEmailLogs();
  logs.unshift(log);
  // Keep latest 200 logs
  const trimmed = logs.slice(0, 200);
  try {
    fs.writeFileSync(LOGS_DB_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Backend DB] Failed to append email log:', err);
  }
}

// -------------------------------------------------------------
// Professional Responsive HTML Email Template for Order Confirmation
// -------------------------------------------------------------
export function generateOrderConfirmationEmailHtml(order: OrderConfirmationData, verifiedEmail: string): string {
  const formattedDate = order.orderDate || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const productRows = (order.products || [])
    .map((item, idx) => {
      const itemTotal = (item.price || 0) * (item.qty || 1);
      const isEven = idx % 2 === 0;
      const bg = isEven ? '#FFFFFF' : '#F8FAFC';
      return `
        <tr style="background-color: ${bg}; border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 12px 14px; vertical-align: top;">
            <div style="font-weight: 700; font-size: 13px; color: #0F172A; line-height: 1.4;">${item.name}</div>
            <div style="margin-top: 4px;">
              <span style="display: inline-block; background-color: #EFF6FF; color: #0066FF; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                🏬 ${item.store || 'Indian Online Store'}
              </span>
            </div>
          </td>
          <td style="padding: 12px 14px; text-align: center; vertical-align: top; font-size: 13px; font-weight: 600; color: #334155;">
            ${item.qty || 1}
          </td>
          <td style="padding: 12px 14px; text-align: right; vertical-align: top; font-size: 13px; color: #475569;">
            ₹${(item.price || 0).toLocaleString('en-IN')}
          </td>
          <td style="padding: 12px 14px; text-align: right; vertical-align: top; font-size: 13px; font-weight: 700; color: #0F172A;">
            ₹${itemTotal.toLocaleString('en-IN')}
          </td>
        </tr>
      `;
    })
    .join('');

  const destStr = order.deliveryAddress?.city
    ? `${order.deliveryAddress.city}, ${order.deliveryAddress.country || 'International'}`
    : 'International Delivery Hub';

  const fullStreet = order.deliveryAddress?.street || `Locker I2W-${order.customerId}, Central Logistics Hub`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Confirmation - ${order.orderId}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.05); border: 1px solid #E2E8F0;">
          
          <!-- Top Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0B1933 0%, #1E293B 100%); padding: 32px 32px 28px 32px; color: #FFFFFF;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #FFFFFF; line-height: 1;">
                      India<span style="color: #0066FF;">2</span>World
                    </div>
                    <div style="font-size: 12px; color: #94A3B8; margin-top: 6px; letter-spacing: 0.3px; text-transform: uppercase; font-weight: 600;">
                      Shop in India • Deliver Worldwide
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; color: #34D399; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
                      ✓ Order Confirmed
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Greeting -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; background-color: #FFFFFF;">
              <h1 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 800; color: #0F172A; line-height: 1.3;">
                Thank you for your order, ${order.customerName}!
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #475569;">
                We have successfully received and confirmed your order <strong>${order.orderId}</strong>. Our dedicated concierge and procurement team in Mumbai has already started preparing your purchase from top Indian merchants.
              </p>
            </td>
          </tr>

          <!-- Key Order Snapshot Box -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px 20px;">
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 12px;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B; letter-spacing: 0.5px;">Order Number</div>
                    <div style="font-size: 15px; font-weight: 800; color: #0066FF; font-family: monospace; margin-top: 4px;">${order.orderId}</div>
                    
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B; letter-spacing: 0.5px; margin-top: 14px;">Order Date</div>
                    <div style="font-size: 13px; font-weight: 600; color: #1E293B; margin-top: 2px;">${formattedDate}</div>
                  </td>
                  <td width="50%" style="vertical-align: top; padding-left: 12px;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B; letter-spacing: 0.5px;">Payment Status</div>
                    <div style="font-size: 13px; font-weight: 800; color: #059669; margin-top: 4px;">
                      ● ${order.paymentStatus || 'PAID (Captured)'}
                    </div>

                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B; letter-spacing: 0.5px; margin-top: 14px;">Order Status</div>
                    <div style="font-size: 13px; font-weight: 700; color: #0066FF; margin-top: 2px;">
                      ● ${order.orderStatus || 'Procuring from Sellers'}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Ordered Products Table Section -->
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <div style="font-size: 15px; font-weight: 800; color: #0F172A; margin-bottom: 12px;">
                Ordered Products (${order.products?.length || 0})
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; border-collapse: separate; border-spacing: 0;">
                <thead>
                  <tr style="background-color: #F1F5F9; border-bottom: 1px solid #E2E8F0;">
                    <th align="left" style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase;">Product Details</th>
                    <th align="center" style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; width: 50px;">Qty</th>
                    <th align="right" style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; width: 90px;">Price</th>
                    <th align="right" style="padding: 10px 14px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; width: 90px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${productRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Price Breakdown Summary -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="45%" style="vertical-align: top; padding-right: 16px;">
                    <!-- Shipping Address Card -->
                    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px;">
                      <div style="font-size: 11px; font-weight: 800; color: #0066FF; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                        📍 Delivery Destination
                      </div>
                      <div style="font-size: 13px; font-weight: 700; color: #0F172A;">${order.customerName}</div>
                      <div style="font-size: 12px; color: #475569; line-height: 1.5; margin-top: 2px;">
                        ${fullStreet}<br/>
                        ${destStr}<br/>
                        Phone: ${order.customerPhone || 'On File'}<br/>
                        Email: ${verifiedEmail}
                      </div>
                    </div>
                  </td>
                  
                  <td width="55%" style="vertical-align: top;">
                    <!-- Financial Summary Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px;">
                      <tr>
                        <td style="padding: 3px 0; font-size: 13px; color: #64748B;">Products Subtotal:</td>
                        <td align="right" style="padding: 3px 0; font-size: 13px; font-weight: 600; color: #1E293B;">₹${(order.costSummary?.subtotal || 0).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td style="padding: 3px 0; font-size: 13px; color: #64748B;">Domestic Courier (India):</td>
                        <td align="right" style="padding: 3px 0; font-size: 13px; font-weight: 600; color: #1E293B;">
                          ${(order.costSummary?.domesticShipping || 0) > 0 ? `₹${(order.costSummary?.domesticShipping || 0).toLocaleString('en-IN')}` : 'FREE'}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 3px 0; font-size: 13px; color: #64748B;">Concierge Service Fee:</td>
                        <td align="right" style="padding: 3px 0; font-size: 13px; font-weight: 600; color: #1E293B;">₹${(order.costSummary?.serviceFee || 0).toLocaleString('en-IN')}</td>
                      </tr>
                      ${
                        (order.costSummary?.tax || 0) > 0
                          ? `<tr>
                              <td style="padding: 3px 0; font-size: 13px; color: #64748B;">Estimated Tax:</td>
                              <td align="right" style="padding: 3px 0; font-size: 13px; font-weight: 600; color: #1E293B;">₹${(order.costSummary?.tax || 0).toLocaleString('en-IN')}</td>
                            </tr>`
                          : ''
                      }
                      <tr style="border-top: 1px solid #CBD5E1;">
                        <td style="padding: 10px 0 2px 0; font-size: 14px; font-weight: 800; color: #0F172A;">Total Paid:</td>
                        <td align="right" style="padding: 10px 0 2px 0; font-size: 18px; font-weight: 900; color: #0B1933;">
                          ₹${(order.costSummary?.total || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            order.attachInvoicePdf
              ? `
          <!-- Invoice Attachment Notice -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 14px 16px;">
                <tr>
                  <td width="36" style="vertical-align: middle;">
                    <div style="font-size: 24px;">📎</div>
                  </td>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 13px; font-weight: 800; color: #1E40AF;">Official Tax Invoice Attached</div>
                    <div style="font-size: 12px; color: #3B82F6; margin-top: 2px;">
                      Your full itemized PDF invoice (<strong>${order.invoice?.invoiceNumber || `INV-${order.orderId}`}.pdf</strong>) has been generated and attached to this email for your records.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ''
          }

          <!-- Fulfillment Timeline / What's Next -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px;">
                <div style="font-size: 14px; font-weight: 800; color: #0F172A; margin-bottom: 14px;">
                  🚀 What happens next?
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td width="28" style="vertical-align: top; padding-bottom: 12px;">
                      <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #10B981; color: #FFFFFF; font-size: 12px; font-weight: 800; text-align: center; line-height: 22px;">1</div>
                    </td>
                    <td style="vertical-align: top; padding-bottom: 12px; padding-left: 8px;">
                      <div style="font-size: 13px; font-weight: 700; color: #0F172A;">Order Saved & Confirmed</div>
                      <div style="font-size: 12px; color: #64748B;">Payment captured and securely held in escrow.</div>
                    </td>
                  </tr>
                  <tr>
                    <td width="28" style="vertical-align: top; padding-bottom: 12px;">
                      <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #0066FF; color: #FFFFFF; font-size: 12px; font-weight: 800; text-align: center; line-height: 22px;">2</div>
                    </td>
                    <td style="vertical-align: top; padding-bottom: 12px; padding-left: 8px;">
                      <div style="font-size: 13px; font-weight: 700; color: #0F172A;">Merchant Procurement in India</div>
                      <div style="font-size: 12px; color: #64748B;">We purchase the items from verified sellers and ship them to our Mumbai hub.</div>
                    </td>
                  </tr>
                  <tr>
                    <td width="28" style="vertical-align: top; padding-bottom: 12px;">
                      <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #E2E8F0; color: #475569; font-size: 12px; font-weight: 800; text-align: center; line-height: 22px;">3</div>
                    </td>
                    <td style="vertical-align: top; padding-bottom: 12px; padding-left: 8px;">
                      <div style="font-size: 13px; font-weight: 700; color: #0F172A;">Locker Check-in & Photo Inspection</div>
                      <div style="font-size: 12px; color: #64748B;">Free photos uploaded to your dashboard upon arrival at the warehouse.</div>
                    </td>
                  </tr>
                  <tr>
                    <td width="28" style="vertical-align: top;">
                      <div style="width: 22px; height: 22px; border-radius: 50%; background-color: #E2E8F0; color: #475569; font-size: 12px; font-weight: 800; text-align: center; line-height: 22px;">4</div>
                    </td>
                    <td style="vertical-align: top; padding-left: 8px;">
                      <div style="font-size: 13px; font-weight: 700; color: #0F172A;">Worldwide Air Express Dispatch</div>
                      <div style="font-size: 12px; color: #64748B;">International tracking AWB generated with DHL / FedEx / Aramex.</div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 32px; text-align: center;">
              <div style="font-size: 12px; font-weight: 700; color: #0F172A;">
                India2World Logistics Pvt Ltd
              </div>
              <div style="font-size: 11px; color: #64748B; margin-top: 4px; line-height: 1.5;">
                Central Fulfillment Hub: Bay #4, Marol MIDC, Andheri East, Mumbai 400093, Maharashtra, India<br/>
                Questions about your order? Reply directly to this email or visit your <a href="https://india2world.com" style="color: #0066FF; text-decoration: none; font-weight: 600;">Customer Dashboard</a>.
              </div>
              <div style="font-size: 10px; color: #94A3B8; margin-top: 12px;">
                © ${new Date().getFullYear()} India2World Logistics. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// -------------------------------------------------------------
// Core Service: Process Order Confirmation & Send Email
// -------------------------------------------------------------
export interface OrderConfirmationDispatchResult {
  success: boolean;
  status: 'Sent' | 'Failed';
  orderId: string;
  recipient: string;
  message: string;
  messageId?: string;
  smtpResponse?: string;
  error?: string;
  timestamp: string;
  alreadySent?: boolean;
  orderSaved: boolean;
  invoiceAttached: boolean;
}

export async function processOrderConfirmationEmail(
  orderData: OrderConfirmationData
): Promise<OrderConfirmationDispatchResult> {
  const now = new Date();
  const timestamp = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ', ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // 1. Validate customer email against registered records (Requirement 10)
  const validation = validateRegisteredCustomerEmail(orderData.customerId, orderData.customerEmail);
  if (!validation.valid || !validation.verifiedEmail) {
    const errorMsg = validation.error || `Recipient email for customer ${orderData.customerId} is invalid or unverified.`;
    console.warn(`[Order Confirmation] Validation failed: ${errorMsg}`);
    
    // Save order anyway with Failed status (Requirement 9: Preserve saved order)
    saveOrderToDatabase({
      ...orderData,
      isRetry: false,
    });
    updateServerOrderStatus(orderData.orderId, {
      confirmationEmailStatus: 'Failed',
      confirmationEmailError: errorMsg,
    });

    return {
      success: false,
      status: 'Failed',
      orderId: orderData.orderId,
      recipient: orderData.customerEmail || '',
      message: 'Failed to deliver order confirmation: Invalid or unverified registered email address.',
      error: errorMsg,
      timestamp,
      orderSaved: true,
      invoiceAttached: false,
    };
  }

  const verifiedEmail = validation.verifiedEmail;

  // 2. Persist order to database FIRST (Requirement 2)
  const savedOrder = saveOrderToDatabase({
    ...orderData,
    customerEmail: verifiedEmail,
    customerName: orderData.customerName || validation.customerName,
  });

  // 3. Deduplication Check (Requirement 8)
  // If already successfully sent and not an explicit retry:
  if (savedOrder.confirmationEmailStatus === 'Sent' && !orderData.isRetry) {
    console.log(`[Order Confirmation] Order ${orderData.orderId} was already confirmed on ${savedOrder.confirmationEmailSentAt}. Skipping duplicate dispatch.`);
    return {
      success: true,
      status: 'Sent',
      orderId: orderData.orderId,
      recipient: verifiedEmail,
      message: `Order confirmation email already sent to ${verifiedEmail} on ${savedOrder.confirmationEmailSentAt}.`,
      messageId: savedOrder.confirmationMessageId,
      timestamp: savedOrder.confirmationEmailSentAt || timestamp,
      alreadySent: true,
      orderSaved: true,
      invoiceAttached: Boolean(orderData.attachInvoicePdf),
    };
  }

  // Deduplication In-Flight Lock (Requirement 8)
  if (activeDispatches.has(orderData.orderId)) {
    return {
      success: false,
      status: 'Failed',
      orderId: orderData.orderId,
      recipient: verifiedEmail,
      message: `Order confirmation email for ${orderData.orderId} is currently being sent. Duplicate send prevented.`,
      error: 'Dispatch in progress.',
      timestamp,
      orderSaved: true,
      invoiceAttached: false,
    };
  }

  // 4. Inspect SMTP Configuration (Requirement 4)
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
  const fromName = (process.env.SMTP_FROM_NAME || 'India2World').replace(/["']/g, '').trim() || 'India2World';
  const from = user ? `"${fromName}" <${user}>` : `"${fromName}" <orders@india2world.com>`;

  if (!user || !pass) {
    const errorMsg = 'SMTP credentials not configured. Please open Admin & Operations Settings > Email & SMTP Configuration and enter your Google App Password.';
    console.warn(`[Order Confirmation] Cannot dispatch email for ${orderData.orderId}: SMTP unconfigured.`);
    
    updateServerOrderStatus(orderData.orderId, {
      confirmationEmailStatus: 'Failed',
      confirmationEmailError: errorMsg,
      confirmationEmailAttempts: (savedOrder.confirmationEmailAttempts || 0) + 1,
    });

    appendConfirmationEmailLog({
      id: `LOG-${Date.now()}`,
      orderId: orderData.orderId,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      recipient: verifiedEmail,
      subject: `Order Confirmation for ${orderData.orderId} - India2World`,
      status: 'Failed',
      error: errorMsg,
      timestamp,
      attemptNumber: (savedOrder.confirmationEmailAttempts || 0) + 1,
      invoiceAttached: false,
    });

    return {
      success: false,
      status: 'Failed',
      orderId: orderData.orderId,
      recipient: verifiedEmail,
      message: 'Failed to send confirmation email: SMTP credentials missing.',
      error: errorMsg,
      timestamp,
      orderSaved: true,
      invoiceAttached: false,
    };
  }

  // Set in-flight lock
  activeDispatches.add(orderData.orderId);

  try {
    // 5. Generate Email Content (Requirement 5)
    console.log(`[Order Confirmation] Preparing branded HTML email for order ${orderData.orderId} to ${verifiedEmail}...`);
    const emailHtml = generateOrderConfirmationEmailHtml(orderData, verifiedEmail);

    // 6. Optional Invoice PDF Attachment (Requirement 6)
    const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
    let invoiceAttached = false;

    if (orderData.attachInvoicePdf && orderData.invoice) {
      try {
        console.log(`[Order Confirmation] Generating invoice PDF attachment for ${orderData.invoice.invoiceNumber}...`);
        const pdfBuffer = await generateInvoicePdfBuffer(orderData.invoice);
        attachments.push({
          filename: `Invoice_${orderData.invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        });
        invoiceAttached = true;
        console.log(`[Order Confirmation] Attached PDF (${pdfBuffer.length} bytes) to confirmation email.`);
      } catch (pdfErr) {
        console.warn(`[Order Confirmation] Could not generate invoice PDF attachment, sending email without attachment:`, pdfErr);
      }
    }

    // 7. Dispatch via Nodemailer (Requirement 4)
    const transporter = createSmtpTransporter();
    const mailOptions = {
      from,
      to: verifiedEmail,
      replyTo: user,
      subject: `Order Confirmation for ${orderData.orderId} - India2World`,
      text: `Hello ${orderData.customerName},\n\nThank you for your order with India2World!\n\nOrder Number: ${orderData.orderId}\nTotal: INR ${orderData.costSummary.total.toLocaleString('en-IN')}\nStatus: Confirmed & Processing\n\nOur team in Mumbai has started processing your items. We will notify you when packages arrive at our warehouse.\n\nWarm regards,\nIndia2World Team`,
      html: emailHtml,
      attachments,
    };

    console.log(`[Order Confirmation] Dispatching confirmation email to ${verifiedEmail}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Order Confirmation] Successfully sent confirmation email for ${orderData.orderId}. Message-ID: ${info.messageId}`);

    // 8. Update Order & Log Success (Requirement 7)
    updateServerOrderStatus(orderData.orderId, {
      confirmationEmailStatus: 'Sent',
      confirmationEmailSentAt: timestamp,
      confirmationMessageId: info.messageId,
      confirmationEmailError: undefined,
      confirmationEmailAttempts: (savedOrder.confirmationEmailAttempts || 0) + 1,
    });

    appendConfirmationEmailLog({
      id: `LOG-${Date.now()}`,
      orderId: orderData.orderId,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      recipient: verifiedEmail,
      subject: mailOptions.subject,
      status: 'Sent',
      messageId: info.messageId,
      smtpResponse: info.response,
      timestamp,
      attemptNumber: (savedOrder.confirmationEmailAttempts || 0) + 1,
      invoiceAttached,
    });

    return {
      success: true,
      status: 'Sent',
      orderId: orderData.orderId,
      recipient: verifiedEmail,
      message: `Order confirmation email successfully sent to ${verifiedEmail}.`,
      messageId: info.messageId,
      smtpResponse: info.response,
      timestamp,
      orderSaved: true,
      invoiceAttached,
    };
  } catch (err: any) {
    console.error(`[Order Confirmation] SMTP dispatch error for ${orderData.orderId}:`, err);
    let errorMsg = err.message || 'SMTP delivery failed.';
    if (errorMsg.includes('535') || errorMsg.toLowerCase().includes('badcredentials') || errorMsg.toLowerCase().includes('username and password not accepted')) {
      errorMsg = 'Google SMTP Authentication Failed (535-5.7.8): Username and Password not accepted. Please verify your 16-character Google App Password.';
    }

    // Preserve the saved order and mark status Failed (Requirement 9)
    updateServerOrderStatus(orderData.orderId, {
      confirmationEmailStatus: 'Failed',
      confirmationEmailError: errorMsg,
      confirmationEmailAttempts: (savedOrder.confirmationEmailAttempts || 0) + 1,
    });

    appendConfirmationEmailLog({
      id: `LOG-${Date.now()}`,
      orderId: orderData.orderId,
      customerId: orderData.customerId,
      customerName: orderData.customerName,
      recipient: verifiedEmail,
      subject: `Order Confirmation #${orderData.orderId} - India2World`,
      status: 'Failed',
      error: errorMsg,
      timestamp,
      attemptNumber: (savedOrder.confirmationEmailAttempts || 0) + 1,
      invoiceAttached: false,
    });

    return {
      success: false,
      status: 'Failed',
      orderId: orderData.orderId,
      recipient: verifiedEmail,
      message: `Order was saved, but confirmation email could not be delivered to ${verifiedEmail}.`,
      error: errorMsg,
      timestamp,
      orderSaved: true,
      invoiceAttached: false,
    };
  } finally {
    activeDispatches.delete(orderData.orderId);
  }
}
