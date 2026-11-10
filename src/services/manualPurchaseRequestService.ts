import { emitDataSync } from './integratedDataService';

export type ManualPurchaseStatus =
  | 'Request Created'
  | 'Sent to Customer'
  | 'Customer Confirmed'
  | 'Purchase Processing'
  | 'Purchased'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export const MANUAL_PURCHASE_STATUSES: ManualPurchaseStatus[] = [
  'Request Created',
  'Sent to Customer',
  'Customer Confirmed',
  'Purchase Processing',
  'Purchased',
  'Shipped',
  'Delivered',
  'Cancelled',
];

export const SHOPPING_PLATFORMS = [
  'Amazon India',
  'Flipkart',
  'Myntra',
  'AJIO',
  'Nykaa',
  'Tata CLiQ',
  'FabIndia',
  'FirstCry',
  'Croma',
  'Other Indian Store',
];

export interface ManualPurchaseProductItem {
  id: string;
  productName: string;
  platform: string;
  productUrl: string;
  productImage?: string;
  quantity: number;
  priceINR: number;
  shippingChargesINR: number;
  productNotes?: string;
  lineTotalINR: number;
}

export interface ManualPurchaseRequestRecord {
  requestId: string;
  orderSource: 'Manual Purchase Request';
  createdAt: string;
  updatedAt: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  country: string;
  postalCode: string;
  destinationFlag: string;
  products: ManualPurchaseProductItem[];
  subtotalINR: number;
  shippingTotalINR: number;
  grandTotalINR: number;
  customerMessage?: string;
  internalAdminNotes?: string;
  purchaseStatus: ManualPurchaseStatus;
  externalOrderId?: string;
  trackingNumber?: string;
  emailStatus: 'Sent' | 'Failed' | 'Pending';
  emailSentAt?: string;
  emailError?: string;
  emailMessageId?: string;
  emailAttemptCount: number;
}

const STORAGE_MANUAL_REQUESTS_KEY = 'i2w_manual_purchase_requests_v1';

export function generateManualRequestId(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `MPR-${num}`;
}

export function getLocalManualPurchaseRequests(): ManualPurchaseRequestRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_MANUAL_REQUESTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading manual purchase requests from localStorage:', e);
  }
  return [];
}

export function saveLocalManualPurchaseRequests(list: ManualPurchaseRequestRecord[]): void {
  try {
    localStorage.setItem(STORAGE_MANUAL_REQUESTS_KEY, JSON.stringify(list));
    emitDataSync('orders', list);
  } catch (e) {
    console.warn('Error saving manual purchase requests to localStorage:', e);
  }
}

export function upsertLocalManualPurchaseRequest(record: ManualPurchaseRequestRecord): ManualPurchaseRequestRecord[] {
  const current = getLocalManualPurchaseRequests();
  const idx = current.findIndex((r) => r.requestId === record.requestId);
  const next = idx >= 0 ? current.map((r, i) => (i === idx ? record : r)) : [record, ...current];
  saveLocalManualPurchaseRequests(next);
  return next;
}

export async function fetchServerManualPurchaseRequests(): Promise<ManualPurchaseRequestRecord[]> {
  try {
    const res = await fetch('/api/manual-purchase-requests');
    const data = await res.json();
    if (res.ok && data?.success && Array.isArray(data.requests)) {
      const local = getLocalManualPurchaseRequests();
      const map = new Map<string, ManualPurchaseRequestRecord>();
      for (const r of data.requests) {
        map.set(r.requestId, r);
      }
      for (const l of local) {
        if (!map.has(l.requestId)) {
          map.set(l.requestId, l);
        }
      }
      const merged = Array.from(map.values());
      saveLocalManualPurchaseRequests(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Could not fetch manual purchase requests from server:', err);
  }
  return getLocalManualPurchaseRequests();
}

export async function createAndSendManualPurchaseRequest(
  requestPayload: Partial<ManualPurchaseRequestRecord>,
  sendEmail: boolean = true
): Promise<{
  success: boolean;
  status: 'Sent' | 'Failed' | 'Pending';
  message: string;
  error?: string;
  record: ManualPurchaseRequestRecord;
}> {
  const res = await fetch('/api/manual-purchase-requests/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Auth': 'true',
    },
    body: JSON.stringify({
      request: requestPayload,
      sendEmail,
    }),
  });

  const data = await res.json();
  if (data?.record) {
    upsertLocalManualPurchaseRequest(data.record);
  }
  return data;
}

export async function updateManualPurchaseRequest(
  requestPayload: Partial<ManualPurchaseRequestRecord> & { requestId: string },
  sendEmail: boolean = false
): Promise<{
  success: boolean;
  status: 'Sent' | 'Failed' | 'Pending';
  message: string;
  error?: string;
  record: ManualPurchaseRequestRecord;
}> {
  const res = await fetch('/api/manual-purchase-requests/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Auth': 'true',
    },
    body: JSON.stringify({
      request: requestPayload,
      sendEmail,
    }),
  });

  const data = await res.json();
  if (data?.record) {
    upsertLocalManualPurchaseRequest(data.record);
  }
  return data;
}

export async function resendManualPurchaseRequestEmail(
  record: ManualPurchaseRequestRecord
): Promise<{
  success: boolean;
  status: 'Sent' | 'Failed';
  message: string;
  error?: string;
  record: ManualPurchaseRequestRecord;
}> {
  const res = await fetch('/api/manual-purchase-requests/resend-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Auth': 'true',
    },
    body: JSON.stringify({
      requestId: record.requestId,
      request: record,
    }),
  });

  const data = await res.json();
  if (data?.record) {
    upsertLocalManualPurchaseRequest(data.record);
  }
  return data;
}
