import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export interface CustomerSession {
  token: string;
  customerId: string;
  email: string;
  name: string;
  createdAt: string;
  expiresAt: number;
}

export interface CustomerAccount {
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  city?: string;
  lockerId?: string;
  avatar?: string;
}

export interface BuyForMeProduct {
  id: string;
  name: string;
  url: string;
  storeName: string;
  store?: string;
  priceINR: number;
  quantity: number;
  size?: string;
  colour?: string;
  imageUrl?: string;
  notes?: string;
  status?: string;
  addedAt?: string;
}

export interface CustomerPurchaseRequest {
  id: string;
  requestNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  date: string;
  status: 'Under Review' | 'Admin Review' | 'Quote Ready' | 'Awaiting Payment' | 'Purchased' | 'Procuring' | 'Cancelled';
  totalItems: number;
  totalAmountINR: number;
  products: BuyForMeProduct[];
  quotedDomesticShipping?: number;
  serviceFee?: number;
  notes?: string;
  destinationCountry?: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const SESSIONS_FILE = path.join(DATA_DIR, 'customer_sessions.json');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'registered_customers.json');
const DRAFTS_FILE = path.join(DATA_DIR, 'customer_drafts.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'customer_requests.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders_db.json');

function ensureFileExists(filePath: string, defaultContent: any) {
  try {
    if (!fs.existsSync(filePath)) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), 'utf-8');
    }
  } catch (e) {
    console.error(`Failed to ensure file exists: ${filePath}`, e);
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error reading JSON from ${filePath}:`, e);
    return fallback;
  }
}

function writeJsonFile(filePath: string, data: any): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempFile = `${filePath}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, filePath);
  } catch (e) {
    console.error(`Error writing JSON to ${filePath}:`, e);
  }
}

// Initialize storage files if missing
ensureFileExists(SESSIONS_FILE, []);
ensureFileExists(CUSTOMERS_FILE, []);
ensureFileExists(DRAFTS_FILE, {});
ensureFileExists(REQUESTS_FILE, {});
ensureFileExists(ORDERS_FILE, []);

/**
 * Deterministically generates a Customer ID from an email address
 */
export function deriveCustomerId(email: string): string {
  const normalized = (email || '').trim().toLowerCase();
  if (normalized === 'john@example.com' || !normalized) {
    return 'CUS-10001';
  }
  if (normalized === 'priya.sharma@example.com') {
    return 'CUS-10028';
  }
  if (normalized === 'rahul.mehta@example.com') {
    return 'CUS-10042';
  }
  if (normalized === 'ahmed.k@example.com' || normalized === 'ahmed.khan@example.com') {
    return 'CUS-10034';
  }
  if (normalized === 'pharmayushonline@gmail.com') {
    return 'CUS-49006';
  }
  if (normalized === 'pharmayushtechteam@gmail.com') {
    return 'CUS-31026';
  }

  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  const digits = 10000 + (Math.abs(hash) % 90000);
  return `CUS-${digits}`;
}

export function deriveNameFromEmail(email: string): string {
  if (!email || !email.includes('@')) return 'Customer';
  const localPart = email.split('@')[0].trim().toLowerCase();
  if (localPart === 'pharmayushonline') return 'riya';
  if (localPart === 'pharmayushtechteam') return 'rohith';
  if (localPart === 'john') return 'John Doe';

  const withoutNumbers = localPart.replace(/[0-9]+/g, ' ');
  const cleaned = withoutNumbers.replace(/[._\-+]+/g, ' ').trim();
  if (!cleaned) return `User ${localPart.slice(0, 5)}`;
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// -------------------------------------------------------------
// SESSIONS & AUTHENTICATION
// -------------------------------------------------------------

export function getActiveSessions(): CustomerSession[] {
  const sessions = readJsonFile<CustomerSession[]>(SESSIONS_FILE, []);
  const now = Date.now();
  // Filter expired sessions
  return sessions.filter((s) => s.expiresAt > now);
}

export function createCustomerSession(account: CustomerAccount): CustomerSession {
  const token = `i2w_tok_${crypto.randomBytes(24).toString('hex')}`;
  const now = Date.now();
  const session: CustomerSession = {
    token,
    customerId: account.customerId,
    email: account.email,
    name: account.name,
    createdAt: new Date().toISOString(),
    expiresAt: now + 14 * 24 * 60 * 60 * 1000, // 14 days validity
  };

  const sessions = getActiveSessions();
  sessions.push(session);
  writeJsonFile(SESSIONS_FILE, sessions);
  return session;
}

export function revokeCustomerSession(token: string): boolean {
  if (!token) return false;
  const sessions = getActiveSessions();
  const filtered = sessions.filter((s) => s.token !== token);
  writeJsonFile(SESSIONS_FILE, filtered);
  return true;
}

export function verifyCustomerSession(tokenOrHeader?: string): CustomerSession | null {
  if (!tokenOrHeader) return null;
  let token = tokenOrHeader.trim();
  if (token.startsWith('Bearer ')) {
    token = token.slice(7).trim();
  }
  if (!token) return null;

  const sessions = getActiveSessions();
  const found = sessions.find((s) => s.token === token);
  if (!found) return null;
  if (found.expiresAt < Date.now()) {
    revokeCustomerSession(token);
    return null;
  }
  return found;
}

export function getRegisteredCustomers(): CustomerAccount[] {
  return readJsonFile<CustomerAccount[]>(CUSTOMERS_FILE, []);
}

export function findCustomerByEmail(email: string): CustomerAccount | null {
  const normalized = (email || '').trim().toLowerCase();
  const customers = getRegisteredCustomers();
  return customers.find((c) => (c.email || '').toLowerCase() === normalized) || null;
}

export function findCustomerById(customerId: string): CustomerAccount | null {
  const customers = getRegisteredCustomers();
  return customers.find((c) => c.customerId === customerId) || null;
}

export function registerOrGetCustomer(details: {
  email: string;
  fullName?: string;
  phone?: string;
  country?: string;
  city?: string;
}): CustomerAccount {
  const normalizedEmail = (details.email || '').trim().toLowerCase();
  const existing = findCustomerByEmail(normalizedEmail);
  const customerId = existing?.customerId || deriveCustomerId(normalizedEmail);
  const name = details.fullName?.trim() || existing?.name || deriveNameFromEmail(normalizedEmail);
  const lockerId = existing?.lockerId || `I2W-${customerId.replace('CUS-', '')}`;

  const updated: CustomerAccount = {
    customerId,
    name,
    email: normalizedEmail,
    phone: details.phone || existing?.phone || '+91 98765 43210',
    country: details.country || existing?.country || 'United Arab Emirates',
    city: details.city || existing?.city || 'Dubai',
    lockerId,
    avatar: existing?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0066FF`,
  };

  const customers = getRegisteredCustomers();
  const index = customers.findIndex((c) => (c.email || '').toLowerCase() === normalizedEmail || c.customerId === customerId);
  if (index >= 0) {
    customers[index] = { ...customers[index], ...updated };
  } else {
    customers.push(updated);
  }
  writeJsonFile(CUSTOMERS_FILE, customers);
  return updated;
}

// -------------------------------------------------------------
// CUSTOMER BUY-FOR-ME DRAFTS & REQUESTS (ISOLATED)
// -------------------------------------------------------------

export function getCustomerDraftProducts(customerId: string): BuyForMeProduct[] {
  if (!customerId) return [];
  const allDrafts = readJsonFile<Record<string, BuyForMeProduct[]>>(DRAFTS_FILE, {});
  return allDrafts[customerId] || [];
}

export function saveCustomerDraftProducts(customerId: string, products: BuyForMeProduct[]): void {
  if (!customerId) return;
  const allDrafts = readJsonFile<Record<string, BuyForMeProduct[]>>(DRAFTS_FILE, {});
  allDrafts[customerId] = products;
  writeJsonFile(DRAFTS_FILE, allDrafts);
}

export function clearCustomerDraftProducts(customerId: string): void {
  if (!customerId) return;
  const allDrafts = readJsonFile<Record<string, BuyForMeProduct[]>>(DRAFTS_FILE, {});
  allDrafts[customerId] = [];
  writeJsonFile(DRAFTS_FILE, allDrafts);
}

export function getCustomerPurchaseRequests(customerId: string): CustomerPurchaseRequest[] {
  if (!customerId) return [];
  const allRequests = readJsonFile<Record<string, CustomerPurchaseRequest[]>>(REQUESTS_FILE, {});
  return allRequests[customerId] || [];
}

export function saveCustomerPurchaseRequest(customerId: string, request: CustomerPurchaseRequest): void {
  if (!customerId) return;
  const allRequests = readJsonFile<Record<string, CustomerPurchaseRequest[]>>(REQUESTS_FILE, {});
  const list = allRequests[customerId] || [];
  // Prepend new request
  allRequests[customerId] = [request, ...list.filter((r) => r.id !== request.id)];
  writeJsonFile(REQUESTS_FILE, allRequests);
}

export function getCustomerOrders(customerId: string, customerEmail: string): any[] {
  const allOrders = readJsonFile<any[]>(ORDERS_FILE, []);
  const normEmail = (customerEmail || '').toLowerCase();
  return allOrders.filter(
    (o) => o.customerId === customerId || (o.customerEmail && o.customerEmail.toLowerCase() === normEmail)
  );
}

// Seed initial purchase requests and drafts for known test users if empty
export function seedCustomerDataIfEmpty() {
  const drafts = readJsonFile<Record<string, BuyForMeProduct[]>>(DRAFTS_FILE, {});
  const requests = readJsonFile<Record<string, CustomerPurchaseRequest[]>>(REQUESTS_FILE, {});

  // Seed riya (CUS-49006, pharmayushonline@gmail.com)
  if (!drafts['CUS-49006'] && !requests['CUS-49006']) {
    requests['CUS-49006'] = [
      {
        id: 'REQ-49011',
        requestNumber: 'REQ-49011',
        customerId: 'CUS-49006',
        customerName: 'riya',
        customerEmail: 'pharmayushonline@gmail.com',
        date: '13 Oct 2026, 04:30 PM',
        status: 'Quote Ready',
        totalItems: 2,
        totalAmountINR: 4296,
        destinationCountry: 'United Arab Emirates',
        products: [
          {
            id: 'riya-prod-1',
            name: 'Kuchipoo Boys Typographic Print Regular Fit Sweatshirt',
            storeName: 'AJIO',
            priceINR: 1299,
            quantity: 1,
            imageUrl: 'https://kuchipoo.in/cdn/shop/files/KUC-HOD-227FRONT.jpg?v=1759291947',
            url: 'https://www.ajio.com/kuchipoo-boys-typographic-print-regular-fit-sweatshirt/p/466887570_white',
          },
          {
            id: 'riya-prod-2',
            name: 'IRTH by House of Titan Black Logo Satchel Handbag',
            storeName: 'Tata CLiQ',
            priceINR: 2997,
            quantity: 1,
            imageUrl: 'https://img.tatacliq.com/images/i30//437Wx649H/MP000000025091217_437Wx649H_202502281858541.jpeg',
            url: 'https://www.tatacliq.com/irth-by-house-of-titan-black-logo-satchel-handbag/p-mp000000025091217',
          },
        ],
      },
    ];
    writeJsonFile(REQUESTS_FILE, requests);
  }

  // Seed rohith (CUS-31026, pharmayushtechteam@gmail.com)
  if (!drafts['CUS-31026'] && !requests['CUS-31026']) {
    requests['CUS-31026'] = [
      {
        id: 'REQ-31088',
        requestNumber: 'REQ-31088',
        customerId: 'CUS-31026',
        customerName: 'rohith',
        customerEmail: 'pharmayushtechteam@gmail.com',
        date: '12 Oct 2026, 02:15 PM',
        status: 'Admin Review',
        totalItems: 1,
        totalAmountINR: 1782,
        destinationCountry: 'United Arab Emirates',
        products: [
          {
            id: 'rohith-prod-1',
            name: 'Bacca Bucci Obsidian Black Chunky High-Top Streetwear Sneakers',
            storeName: 'Flipkart',
            priceINR: 1782,
            quantity: 1,
            imageUrl: 'https://rukminim2.flixcart.com/image/300/300/xif0q/shoe/i/5/v/8-bbmg8267-8-bacca-bucci-obsidian-black-watermarked-original-imahf8fhezk5bctg.jpeg',
            url: 'https://www.flipkart.com/bacca-bucci-obsidian-black-sneakers/p/itmf8fgurjk4mys',
          },
        ],
      },
    ];
    writeJsonFile(REQUESTS_FILE, requests);
  }
}

// Run initial seed once on startup
seedCustomerDataIfEmpty();
