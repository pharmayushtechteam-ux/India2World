import { DATA_SYNC_EVENT } from './integratedDataService';

export type ExternalPurchaseRequestStatus =
  | 'New Requests'
  | 'Under Review'
  | 'Waiting for Customer'
  | 'Quotation Sent'
  | 'Customer Approved'
  | 'Customer Rejected'
  | 'Purchase Processing'
  | 'Purchased'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type ExternalEmailStage =
  | 'Request Received'
  | 'Quotation Sent'
  | 'Quotation Approved'
  | 'Quotation Rejected'
  | 'Purchase Completed'
  | 'Product Shipped'
  | 'Tracking Updated'
  | 'Product Delivered'
  | 'Request Cancelled';

export interface CustomerRequestedProductItem {
  id: string;
  productName: string;
  platform: string;
  productUrl?: string;
  productImage?: string;
  quantity: number;
  expectedBudgetINR?: number;
  description?: string;
  additionalRequirements?: string;
}

export interface AdminProcessedProductItem {
  id: string;
  actualProductName: string;
  platform: string;
  verifiedProductUrl: string;
  productImage?: string;
  quantity: number;
  actualPriceINR: number;
  shippingChargesINR: number;
  additionalChargesINR: number;
  estimatedDeliveryTime: string;
  productNotes?: string;
  subtotalINR: number;
}

export interface ExternalRequestQuotation {
  quotationReference: string;
  productsTotalINR: number;
  shippingTotalINR: number;
  additionalChargesTotalINR: number;
  grandTotalINR: number;
  customerFacingMessage?: string;
  internalAdminNotes?: string;
  approvalToken?: string;
  approvalTokenExpiresAt?: string;
  sentAt?: string;
  customerDecision?: 'Approved' | 'Rejected';
  customerDecisionAt?: string;
  customerDecisionNote?: string;
}

export interface ExternalPurchaseCompletionRecord {
  externalOrderId: string;
  actualPurchaseDate: string;
  actualPurchaseAmountINR: number;
  confirmationDetails: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  estimatedDeliveryDate?: string;
  recordedByAdminAt: string;
}

export interface ExternalRequestActivityLogEntry {
  id: string;
  timestamp: string;
  action: string;
  fromStatus?: ExternalPurchaseRequestStatus;
  toStatus?: ExternalPurchaseRequestStatus;
  actor: string;
  details: string;
}

export interface ExternalRequestEmailLogEntry {
  id: string;
  timestamp: string;
  stage: ExternalEmailStage;
  recipient: string;
  subject: string;
  status: 'Sent' | 'Failed';
  messageId?: string;
  error?: string;
}

export interface ExternalPurchaseRequestRecord {
  requestId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  destinationFlag: string;
  requestedProducts: CustomerRequestedProductItem[];
  processedProducts: AdminProcessedProductItem[];
  quotation: ExternalRequestQuotation;
  purchaseRecord?: ExternalPurchaseCompletionRecord;
  status: ExternalPurchaseRequestStatus;
  unreadAdminAlert: boolean;
  createdAt: string;
  updatedAt: string;
  activityHistory: ExternalRequestActivityLogEntry[];
  emailHistory: ExternalRequestEmailLogEntry[];
}

export interface ExternalPurchaseDashboardStats {
  totalRequests: number;
  newRequests: number;
  pendingQuotations: number;
  customerApproved: number;
  purchasesProcessing: number;
  completedPurchases: number;
  unreadBadgeCount: number;
}

const LOCAL_CACHE_KEY = 'i2w_external_purchase_requests_v1';
const LOCAL_STATS_KEY = 'i2w_external_purchase_stats_v1';

function emitSync(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATA_SYNC_EVENT));
  }
}

export function getCachedExternalPurchaseRequests(): ExternalPurchaseRequestRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function computeLocalExternalStats(
  records: ExternalPurchaseRequestRecord[]
): ExternalPurchaseDashboardStats {
  const totalRequests = records.length;
  const newRequests = records.filter((r) => r.status === 'New Requests').length;
  const pendingQuotations = records.filter(
    (r) =>
      r.status === 'New Requests' ||
      r.status === 'Under Review' ||
      r.status === 'Waiting for Customer' ||
      r.status === 'Quotation Sent'
  ).length;
  const customerApproved = records.filter(
    (r) => r.status === 'Customer Approved'
  ).length;
  const purchasesProcessing = records.filter(
    (r) =>
      r.status === 'Purchase Processing' ||
      r.status === 'Purchased' ||
      r.status === 'Shipped'
  ).length;
  const completedPurchases = records.filter(
    (r) => r.status === 'Delivered'
  ).length;
  const unreadBadgeCount = records.filter(
    (r) =>
      r.unreadAdminAlert ||
      r.status === 'New Requests' ||
      r.status === 'Customer Approved'
  ).length;

  return {
    totalRequests,
    newRequests,
    pendingQuotations,
    customerApproved,
    purchasesProcessing,
    completedPurchases,
    unreadBadgeCount,
  };
}

export function getCachedExternalPurchaseStats(): ExternalPurchaseDashboardStats {
  if (typeof window === 'undefined') {
    return {
      totalRequests: 0,
      newRequests: 0,
      pendingQuotations: 0,
      customerApproved: 0,
      purchasesProcessing: 0,
      completedPurchases: 0,
      unreadBadgeCount: 0,
    };
  }
  try {
    const raw = localStorage.getItem(LOCAL_STATS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return computeLocalExternalStats(getCachedExternalPurchaseRequests());
}

function saveToLocalCache(
  requests: ExternalPurchaseRequestRecord[],
  stats?: ExternalPurchaseDashboardStats
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(requests));
    const computed = stats || computeLocalExternalStats(requests);
    localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(computed));
    emitSync();
  } catch {
    // ignore
  }
}

export async function fetchAllExternalPurchaseRequests(): Promise<{
  requests: ExternalPurchaseRequestRecord[];
  stats: ExternalPurchaseDashboardStats;
}> {
  try {
    const res = await fetch('/api/external-purchase-requests', {
      headers: { 'x-admin-auth': 'true' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        const stats =
          data.stats || computeLocalExternalStats(data.requests);
        saveToLocalCache(data.requests, stats);
        return { requests: data.requests, stats };
      }
    }
  } catch {
    // fallback to local cache
  }
  const cached = getCachedExternalPurchaseRequests();
  return {
    requests: cached,
    stats: computeLocalExternalStats(cached),
  };
}

export function clearAllExternalPurchaseAlerts(): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getCachedExternalPurchaseRequests();
    let changed = false;
    const updated = list.map((item) => {
      if (item.unreadAdminAlert) {
        changed = true;
        return { ...item, unreadAdminAlert: false };
      }
      return item;
    });
    if (changed) {
      saveToLocalCache(updated);
    }
  } catch (err) {
    console.error('Failed to clear external purchase alerts', err);
  }
}

export async function fetchCustomerExternalPurchaseRequests(params: {
  email?: string;
  customerId?: string;
}): Promise<ExternalPurchaseRequestRecord[]> {
  try {
    const qs = new URLSearchParams();
    if (params.email) qs.set('email', params.email);
    if (params.customerId) qs.set('customerId', params.customerId);
    const res = await fetch(
      `/api/external-purchase-requests/customer?${qs.toString()}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.requests)) {
        return data.requests;
      }
    }
  } catch {
    // fallback
  }
  return [];
}

export async function submitCustomerExternalPurchaseRequest(payload: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  customerId?: string;
  products: Partial<CustomerRequestedProductItem>[];
}): Promise<{
  success: boolean;
  record?: ExternalPurchaseRequestRecord;
  emailSent: boolean;
  emailError?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/external-purchase-requests/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success && data.record) {
      await fetchAllExternalPurchaseRequests();
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      emailSent: false,
      error: err?.message || 'Network error while submitting purchase request.',
    };
  }
}

export async function sendExternalRequestQuotation(payload: {
  requestId: string;
  processedProducts: AdminProcessedProductItem[];
  customerFacingMessage?: string;
  internalAdminNotes?: string;
  quotationReference?: string;
}): Promise<{
  success: boolean;
  record?: ExternalPurchaseRequestRecord;
  emailSent: boolean;
  emailError?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/external-purchase-requests/send-quotation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-auth': 'true',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      await fetchAllExternalPurchaseRequests();
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      emailSent: false,
      error: err?.message || 'Network error while sending quotation.',
    };
  }
}

export async function updateExternalPurchaseRequestByAdmin(
  requestId: string,
  updates: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    requestedProducts?: CustomerRequestedProductItem[];
    processedProducts?: AdminProcessedProductItem[];
    customerFacingMessage?: string;
    internalAdminNotes?: string;
    quotationReference?: string;
    status?: ExternalPurchaseRequestStatus;
    purchaseRecord?: Partial<ExternalPurchaseCompletionRecord>;
    markAlertRead?: boolean;
    sendNotificationEmail?: boolean;
    actionNote?: string;
  }
): Promise<{
  success: boolean;
  record?: ExternalPurchaseRequestRecord;
  emailSent?: boolean;
  emailError?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/external-purchase-requests/admin-update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-auth': 'true',
      },
      body: JSON.stringify({ requestId, updates }),
    });
    const data = await res.json();
    if (data.success) {
      await fetchAllExternalPurchaseRequests();
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error while updating purchase request.',
    };
  }
}

export async function resendExternalRequestEmailByAdmin(
  requestId: string,
  stage?: ExternalEmailStage
): Promise<{
  success: boolean;
  record?: ExternalPurchaseRequestRecord;
  emailSent: boolean;
  emailError?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/external-purchase-requests/resend-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-auth': 'true',
      },
      body: JSON.stringify({ requestId, stage }),
    });
    const data = await res.json();
    await fetchAllExternalPurchaseRequests();
    return data;
  } catch (err: any) {
    return {
      success: false,
      emailSent: false,
      error: err?.message || 'Network error while resending email.',
    };
  }
}

export async function verifyExternalQuotationToken(
  requestId: string,
  token: string
): Promise<{
  success: boolean;
  request?: ExternalPurchaseRequestRecord;
  error?: string;
}> {
  try {
    const qs = new URLSearchParams({ requestId, token });
    const res = await fetch(
      `/api/external-purchase-requests/verify-token?${qs.toString()}`
    );
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to verify quotation token.',
    };
  }
}

export async function submitCustomerQuotationDecision(payload: {
  requestId: string;
  token: string;
  decision: 'approve' | 'reject';
  customerNote?: string;
}): Promise<{
  success: boolean;
  record?: ExternalPurchaseRequestRecord;
  emailSent?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch(
      '/api/external-purchase-requests/customer-decision',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    await fetchAllExternalPurchaseRequests();
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to submit quotation decision.',
    };
  }
}
