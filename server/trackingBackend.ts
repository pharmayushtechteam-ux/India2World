import fs from 'node:fs';
import path from 'node:path';

export interface TrackingMilestone {
  stepNumber: number;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
}

export interface TrackingProductItem {
  name: string;
  store: string;
  qty: number;
  priceINR: number;
  imageUrl?: string;
}

export interface RealTrackingRecord {
  trackingId: string;
  recordType: 'Order' | 'Buy For Me Request' | 'External Request' | 'Manual Request';
  status: string;
  paymentStatus?: string;
  orderDate: string;
  updatedAt?: string;
  customerName: string;
  destinationCity: string;
  destinationCountry: string;
  itemsCount: number;
  totalAmountINR: number;
  carrier: string;
  trackingAwb?: string;
  invoiceNumber?: string;
  stores: string[];
  estimatedDelivery: string;
  products: TrackingProductItem[];
  timeline: TrackingMilestone[];
}

export interface TrackingSummaryItem {
  id: string;
  recordType: RealTrackingRecord['recordType'];
  status: string;
  date: string;
  itemsCount: number;
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');

function readJsonSafe<T>(filename: string, fallback: T): T {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf-8').trim();
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function formatReadableDate(val?: string): string {
  if (!val) return '';
  if (!val.includes('T')) return val;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getOrderStageIndex(orderStatus: string): number {
  const s = (orderStatus || '').toLowerCase();
  if (s.includes('deliver')) return 5;
  if (s.includes('transit') || s.includes('dispatch') || s.includes('shipped')) return 4;
  if (s.includes('consolidat') || s.includes('customs') || s.includes('ready')) return 3;
  if (s.includes('warehouse') || s.includes('received') || s.includes('purchased') || s.includes('inspected')) return 2;
  // Default for confirmed orders: Procuring / Confirmed / Processing
  return 1;
}

function buildOrderTrackingRecord(order: any): RealTrackingRecord {
  const orderId = order.orderId || order.id || 'ORD-UNKNOWN';
  const rawProducts: any[] = Array.isArray(order.products)
    ? order.products
    : Array.isArray(order.invoice?.items)
    ? order.invoice.items
    : [];

  const products: TrackingProductItem[] = rawProducts.map((p) => ({
    name: p.name || p.title || 'Ordered Item',
    store: p.store || p.storeName || 'Indian Store',
    qty: Number(p.qty || p.quantity || 1),
    priceINR: Number(p.price || p.priceINR || 0),
    imageUrl: p.imageUrl,
  }));

  const itemsCount = products.reduce((sum, p) => sum + p.qty, 0) || Number(order.itemCount || 1);
  const stores: string[] = Array.isArray(order.stores) && order.stores.length > 0
    ? order.stores
    : Array.from(new Set(products.map((p) => p.store).filter(Boolean)));

  const city =
    order.deliveryAddress?.city ||
    order.invoice?.destinationCity ||
    'Destination City';
  const country =
    order.deliveryAddress?.country ||
    order.invoice?.destinationCountry ||
    order.destination ||
    'International';

  const orderStatus = order.orderStatus || 'Procuring';
  const paymentStatus = order.paymentStatus || order.invoice?.paymentStatus || 'Paid';
  const stageIdx = getOrderStageIndex(orderStatus);
  const orderDate = order.orderDate || formatReadableDate(order.savedAt) || 'Recorded';
  const updatedAt = formatReadableDate(order.updatedAt || order.confirmationEmailSentAt);
  const storeListLabel = stores.length > 0 ? stores.join(', ') : 'Indian Store(s)';
  const carrier = order.carrier || (stageIdx >= 4 ? 'International Air Express' : 'Assigned at Dispatch');

  const estimatedDelivery =
    stageIdx >= 5
      ? 'Delivered to recipient'
      : stageIdx === 4
      ? '3 – 5 business days (In international transit)'
      : stageIdx === 3
      ? 'Ready for international air dispatch'
      : stageIdx === 2
      ? 'Arrived at Mumbai Hub — preparing export consolidation'
      : `Procuring from ${storeListLabel} — ships after Mumbai Hub inspection`;

  const timeline: TrackingMilestone[] = [
    {
      stepNumber: 1,
      title: `Order Confirmed & Payment ${paymentStatus}`,
      description: `Order ${orderId} confirmed${order.invoice?.invoiceNumber ? ` (Invoice ${order.invoice.invoiceNumber})` : ''}.`,
      location: 'Mumbai Operations Desk, India',
      timestamp: orderDate,
      completed: true,
      current: stageIdx === 0,
    },
    {
      stepNumber: 2,
      title: `Purchasing from ${storeListLabel}`,
      description:
        stageIdx === 1
          ? `Our Indian buying team is purchasing your ${itemsCount} item(s) from ${storeListLabel}.`
          : `Purchased ${itemsCount} item(s) from ${storeListLabel}.`,
      location: `${storeListLabel} (India)`,
      timestamp: stageIdx === 1 ? (updatedAt || 'In Progress') : 'Completed',
      completed: stageIdx > 1,
      current: stageIdx === 1,
    },
    {
      stepNumber: 3,
      title: 'Received & Quality Checked at Mumbai Hub',
      description:
        stageIdx >= 2
          ? 'Items arrived at our Mumbai warehouse, verified for quality and weight.'
          : 'Awaiting domestic delivery to Mumbai warehouse for inspection.',
      location: 'Mumbai Warehouse Hub, India',
      timestamp: stageIdx > 2 ? 'Completed' : stageIdx === 2 ? (updatedAt || 'In Progress') : 'Pending',
      completed: stageIdx > 2,
      current: stageIdx === 2,
    },
    {
      stepNumber: 4,
      title: 'Consolidated & Export Customs Cleared',
      description:
        stageIdx >= 3
          ? 'Parcel consolidated, packed for export, and cleared through Indian customs.'
          : 'Will be consolidated and export-manifested once warehouse inspection completes.',
      location: 'Mumbai International Airport (BOM)',
      timestamp: stageIdx > 3 ? 'Completed' : stageIdx === 3 ? (updatedAt || 'In Progress') : 'Pending',
      completed: stageIdx > 3,
      current: stageIdx === 3,
    },
    {
      stepNumber: 5,
      title: `International Delivery to ${city}, ${country}`,
      description:
        stageIdx >= 5
          ? `Delivered to ${city}, ${country}.`
          : stageIdx === 4
          ? `In transit via ${carrier} to ${city}, ${country}.`
          : `Scheduled for international delivery to ${city}, ${country}.`,
      location: `${city}, ${country}`,
      timestamp: stageIdx >= 5 ? (updatedAt || 'Delivered') : stageIdx === 4 ? 'In Transit' : 'Pending',
      completed: stageIdx >= 5,
      current: stageIdx === 4,
    },
  ];

  return {
    trackingId: orderId,
    recordType: 'Order',
    status: orderStatus,
    paymentStatus,
    orderDate,
    updatedAt,
    customerName: order.customerName || 'Customer',
    destinationCity: city,
    destinationCountry: country,
    itemsCount,
    totalAmountINR: Number(order.costSummary?.total || order.invoice?.totalINR || 0),
    carrier,
    trackingAwb: order.trackingAwb || order.trackingNumber || undefined,
    invoiceNumber: order.invoice?.invoiceNumber || undefined,
    stores,
    estimatedDelivery,
    products,
    timeline,
  };
}

function buildBuyForMeRequestRecord(req: any): RealTrackingRecord {
  const reqId = req.requestNumber || req.id || 'REQ-UNKNOWN';
  const rawProducts: any[] = Array.isArray(req.products) ? req.products : [];
  const products: TrackingProductItem[] = rawProducts.map((p) => ({
    name: p.name || 'Requested Item',
    store: p.storeName || p.store || 'Indian Store',
    qty: Number(p.quantity || p.qty || 1),
    priceINR: Number(p.priceINR || p.price || 0),
    imageUrl: p.imageUrl,
  }));
  const itemsCount = products.reduce((s, p) => s + p.qty, 0) || Number(req.totalItems || 1);
  const stores = Array.from(new Set(products.map((p) => p.store).filter(Boolean)));
  const status = req.status || 'Under Review';
  const s = status.toLowerCase();

  let stageIdx = 1; // Under Review / Admin Review
  if (s.includes('deliver') || s.includes('complet')) stageIdx = 5;
  else if (s.includes('ship') || s.includes('dispatch') || s.includes('transit')) stageIdx = 4;
  else if (s.includes('purchas') || s.includes('procur') || s.includes('paid')) stageIdx = 3;
  else if (s.includes('quote') || s.includes('approv')) stageIdx = 2;

  const destinationCountry = req.destinationCountry || 'International';
  const timeline: TrackingMilestone[] = [
    {
      stepNumber: 1,
      title: 'Buy For Me Request Submitted',
      description: `Submitted ${itemsCount} item(s) for assisted purchase from ${stores.join(', ') || 'Indian stores'}.`,
      location: 'Online Customer Portal',
      timestamp: req.date || 'Submitted',
      completed: true,
      current: false,
    },
    {
      stepNumber: 2,
      title: 'Admin Review & Price Verification',
      description:
        stageIdx === 1
          ? 'Our team is verifying product availability, Indian store pricing, and shipping weight.'
          : 'Product links and pricing verified by our Mumbai buying desk.',
      location: 'Mumbai Buying Desk, India',
      timestamp: stageIdx === 1 ? 'In Progress' : 'Completed',
      completed: stageIdx > 1,
      current: stageIdx === 1,
    },
    {
      stepNumber: 3,
      title: 'Quotation Ready & Customer Approval',
      description:
        stageIdx === 2
          ? 'Your quotation is ready for review and payment confirmation.'
          : stageIdx > 2
          ? 'Quotation approved and payment confirmed.'
          : 'Quotation will be sent once admin review finishes.',
      location: 'Billing & Quotations Desk',
      timestamp: stageIdx > 2 ? 'Completed' : stageIdx === 2 ? 'Awaiting Approval' : 'Pending',
      completed: stageIdx > 2,
      current: stageIdx === 2,
    },
    {
      stepNumber: 4,
      title: 'Store Procurement & Mumbai Warehouse Receipt',
      description:
        stageIdx >= 3
          ? 'Order placed with Indian store(s) and processed at Mumbai warehouse.'
          : 'Procurement starts immediately after quotation payment.',
      location: 'Mumbai Warehouse Hub, India',
      timestamp: stageIdx > 3 ? 'Completed' : stageIdx === 3 ? 'In Progress' : 'Pending',
      completed: stageIdx > 3,
      current: stageIdx === 3,
    },
    {
      stepNumber: 5,
      title: `International Dispatch to ${destinationCountry}`,
      description:
        stageIdx >= 5
          ? `Delivered to ${destinationCountry}.`
          : stageIdx === 4
          ? `Dispatched for international delivery to ${destinationCountry}.`
          : `International shipping to ${destinationCountry} after consolidation.`,
      location: destinationCountry,
      timestamp: stageIdx >= 5 ? 'Delivered' : stageIdx === 4 ? 'In Transit' : 'Pending',
      completed: stageIdx >= 5,
      current: stageIdx === 4,
    },
  ];

  return {
    trackingId: reqId,
    recordType: 'Buy For Me Request',
    status,
    orderDate: req.date || 'Submitted',
    customerName: req.customerName || 'Customer',
    destinationCity: req.destinationCity || destinationCountry,
    destinationCountry,
    itemsCount,
    totalAmountINR: Number(req.totalAmountINR || 0),
    carrier: stageIdx >= 4 ? 'International Air Express' : 'Pending Quotation & Purchase',
    stores,
    estimatedDelivery:
      stageIdx === 1
        ? 'Under admin review — quote typically ready within 2–4 hours'
        : stageIdx === 2
        ? 'Quote ready — approve & pay to start procurement'
        : 'In active fulfillment',
    products,
    timeline,
  };
}

function buildExternalRequestRecord(rec: any): RealTrackingRecord {
  const reqId = rec.requestId || rec.id || 'EPR-UNKNOWN';
  const rawProducts: any[] =
    Array.isArray(rec.processedProducts) && rec.processedProducts.length > 0
      ? rec.processedProducts
      : Array.isArray(rec.requestedProducts)
      ? rec.requestedProducts
      : [];

  const products: TrackingProductItem[] = rawProducts.map((p) => ({
    name: p.actualProductName || p.productName || 'Requested Product',
    store: p.platform || 'External Platform',
    qty: Number(p.quantity || 1),
    priceINR: Number(p.actualPriceINR || p.expectedBudgetINR || 0),
  }));

  const itemsCount = products.reduce((s, p) => s + p.qty, 0) || 1;
  const stores = Array.from(new Set(products.map((p) => p.store).filter(Boolean)));
  const status = rec.status || 'New Requests';
  const s = status.toLowerCase();

  let stageIdx = 1;
  if (s.includes('deliver') || s.includes('complet')) stageIdx = 5;
  else if (s.includes('ship') || s.includes('transit') || s.includes('dispatch')) stageIdx = 4;
  else if (s.includes('purchas') || s.includes('ordered') || s.includes('warehouse')) stageIdx = 3;
  else if (s.includes('quot') || s.includes('approv')) stageIdx = 2;

  const city = rec.city || 'Destination';
  const country = rec.country || 'International';
  const carrier = rec.trackingInfo?.carrier || (stageIdx >= 4 ? 'International Courier' : 'Assigned at Dispatch');
  const awb = rec.trackingInfo?.trackingNumber || undefined;

  const timeline: TrackingMilestone[] = [
    {
      stepNumber: 1,
      title: 'External Purchase Request Received',
      description: `Submitted ${itemsCount} item(s) from ${stores.join(', ') || 'external platform'}.`,
      location: 'External Purchase Portal',
      timestamp: rec.createdAt || 'Submitted',
      completed: true,
      current: false,
    },
    {
      stepNumber: 2,
      title: 'Admin Review & Sourcing Verification',
      description:
        stageIdx === 1
          ? 'Admin team is reviewing product URLs and preparing an official quotation.'
          : 'Request reviewed and verified by admin team.',
      location: 'Mumbai Operations Hub, India',
      timestamp: stageIdx === 1 ? (rec.updatedAt || 'In Progress') : 'Completed',
      completed: stageIdx > 1,
      current: stageIdx === 1,
    },
    {
      stepNumber: 3,
      title: `Quotation${rec.quotation?.quotationReference ? ` (${rec.quotation.quotationReference})` : ''} & Approval`,
      description:
        stageIdx === 2
          ? 'Quotation sent to customer — awaiting approval & payment.'
          : stageIdx > 2
          ? 'Quotation approved by customer.'
          : 'Quotation will be emailed once review completes.',
      location: 'Quotation Desk',
      timestamp: stageIdx > 2 ? 'Approved' : stageIdx === 2 ? 'Sent' : 'Pending',
      completed: stageIdx > 2,
      current: stageIdx === 2,
    },
    {
      stepNumber: 4,
      title: 'Purchased & Received at Mumbai Warehouse',
      description:
        stageIdx >= 3
          ? 'Items procured from seller and received at warehouse.'
          : 'Items will be purchased after quotation approval.',
      location: 'Mumbai Warehouse Hub, India',
      timestamp: stageIdx > 3 ? 'Completed' : stageIdx === 3 ? 'In Progress' : 'Pending',
      completed: stageIdx > 3,
      current: stageIdx === 3,
    },
    {
      stepNumber: 5,
      title: `International Delivery to ${city}, ${country}`,
      description:
        stageIdx >= 5
          ? `Delivered to ${city}, ${country}.`
          : stageIdx === 4
          ? `Shipped via ${carrier}${awb ? ` (AWB: ${awb})` : ''}.`
          : `Scheduled for delivery to ${city}, ${country} after dispatch.`,
      location: `${city}, ${country}`,
      timestamp: stageIdx >= 5 ? 'Delivered' : stageIdx === 4 ? 'In Transit' : 'Pending',
      completed: stageIdx >= 5,
      current: stageIdx === 4,
    },
  ];

  return {
    trackingId: reqId,
    recordType: 'External Request',
    status,
    orderDate: rec.createdAt || 'Submitted',
    updatedAt: rec.updatedAt,
    customerName: rec.customerName || 'Customer',
    destinationCity: city,
    destinationCountry: country,
    itemsCount,
    totalAmountINR: Number(rec.quotation?.grandTotalINR || 0),
    carrier,
    trackingAwb: awb,
    invoiceNumber: rec.quotation?.quotationReference || undefined,
    stores,
    estimatedDelivery:
      stageIdx === 1
        ? 'Awaiting admin review & quotation'
        : stageIdx === 2
        ? 'Quotation sent — awaiting approval'
        : stageIdx >= 5
        ? 'Delivered'
        : '5 – 7 business days',
    products,
    timeline,
  };
}

export type TrackingLookupResult =
  | { status: 'found'; record: RealTrackingRecord }
  | { status: 'forbidden' }
  | { status: 'not_found' };

function isRecordOwnedByCustomer(
  rec: any,
  ownerCustomerId?: string,
  ownerEmail?: string
): boolean {
  const emailLower = (ownerEmail || '').trim().toLowerCase();
  const idClean = (ownerCustomerId || '').trim().toUpperCase();
  if (!idClean && !emailLower) return false;

  const recId = String(rec?.customerId || '').trim().toUpperCase();
  const recEmail = String(rec?.customerEmail || rec?.invoice?.customerEmail || '')
    .trim()
    .toLowerCase();

  if (idClean && recId && recId === idClean) return true;
  if (emailLower && recEmail && recEmail === emailLower) return true;
  return false;
}

export function lookupRealTrackingRecord(
  rawCode: string,
  ownerCustomerId?: string,
  ownerEmail?: string
): TrackingLookupResult {
  const trimmed = (rawCode || '').trim();
  const code = trimmed.toUpperCase();
  if (!code) return { status: 'not_found' };

  const isUrlQuery = /^https?:\/\//i.test(trimmed);
  const normalizeUrlBase = (u: string) => u.trim().toLowerCase().split('?')[0].replace(/\/+$/, '');
  const queryUrlBase = isUrlQuery ? normalizeUrlBase(trimmed) : '';

  // 1. Search real confirmed orders (orders_db.json)
  const orders = readJsonSafe<any[]>('orders_db.json', []);
  const matchedOrder = orders.find(
    (o) =>
      String(o.orderId || o.id || '').toUpperCase() === code ||
      String(o.invoice?.invoiceNumber || '').toUpperCase() === code ||
      String(o.trackingAwb || o.trackingNumber || '').toUpperCase() === code ||
      (isUrlQuery &&
        Array.isArray(o.products) &&
        o.products.some((p: any) => p.url && normalizeUrlBase(String(p.url)) === queryUrlBase))
  );
  if (matchedOrder) {
    if (!isRecordOwnedByCustomer(matchedOrder, ownerCustomerId, ownerEmail)) {
      return { status: 'forbidden' };
    }
    return { status: 'found', record: buildOrderTrackingRecord(matchedOrder) };
  }

  // 2. Search real external purchase requests (external_purchase_requests_db.json)
  const externalReqs = readJsonSafe<any[]>('external_purchase_requests_db.json', []);
  const matchedExternal = externalReqs.find(
    (r) =>
      String(r.requestId || r.id || '').toUpperCase() === code ||
      String(r.quotation?.quotationReference || '').toUpperCase() === code ||
      String(r.trackingInfo?.trackingNumber || '').toUpperCase() === code ||
      (isUrlQuery &&
        Array.isArray(r.requestedProducts) &&
        r.requestedProducts.some((p: any) => p.productUrl && normalizeUrlBase(String(p.productUrl)) === queryUrlBase))
  );
  if (matchedExternal) {
    if (!isRecordOwnedByCustomer(matchedExternal, ownerCustomerId, ownerEmail)) {
      return { status: 'forbidden' };
    }
    return { status: 'found', record: buildExternalRequestRecord(matchedExternal) };
  }

  // 3. Search real customer Buy For Me requests (customer_requests.json)
  const customerReqsMap = readJsonSafe<Record<string, any[]>>('customer_requests.json', {});
  for (const [custId, list] of Object.entries(customerReqsMap)) {
    if (!Array.isArray(list)) continue;
    const matchedReq = list.find(
      (r) =>
        String(r.requestNumber || r.id || '').toUpperCase() === code ||
        (isUrlQuery &&
          Array.isArray(r.products) &&
          r.products.some((p: any) => p.url && normalizeUrlBase(String(p.url)) === queryUrlBase))
    );
    if (matchedReq) {
      if (!isRecordOwnedByCustomer({ ...matchedReq, customerId: matchedReq.customerId || custId }, ownerCustomerId, ownerEmail)) {
        return { status: 'forbidden' };
      }
      return { status: 'found', record: buildBuyForMeRequestRecord(matchedReq) };
    }
  }

  // 4. Search manual purchase requests (manual_purchase_requests_db.json)
  const manualReqs = readJsonSafe<any[]>('manual_purchase_requests_db.json', []);
  if (Array.isArray(manualReqs)) {
    const matchedManual = manualReqs.find(
      (r) =>
        String(r.requestId || r.id || '').toUpperCase() === code ||
        String(r.trackingNumber || '').toUpperCase() === code
    );
    if (matchedManual) {
      if (!isRecordOwnedByCustomer(matchedManual, ownerCustomerId, ownerEmail)) {
        return { status: 'forbidden' };
      }
      return {
        status: 'found',
        record: buildExternalRequestRecord({
          ...matchedManual,
          requestId: matchedManual.requestId || matchedManual.id,
        }),
      };
    }
  }

  return { status: 'not_found' };
}

export function listRecentTrackingRecords(filterCustomerId?: string, filterCustomerEmail?: string): TrackingSummaryItem[] {
  // Strict customer isolation: never return records without an authenticated customer identity
  if (!filterCustomerId && !filterCustomerEmail) {
    return [];
  }

  const results: TrackingSummaryItem[] = [];
  const seen = new Set<string>();

  const matchesCustomer = (rec: any): boolean =>
    isRecordOwnedByCustomer(rec, filterCustomerId, filterCustomerEmail);

  // 1. Confirmed Orders (up to 4 latest valid orders)
  const orders = readJsonSafe<any[]>('orders_db.json', []);
  let orderCount = 0;
  for (const o of orders) {
    if (orderCount >= 4) break;
    if (!matchesCustomer(o)) continue;
    const id = String(o.orderId || o.id || '').trim();
    const upperId = id.toUpperCase();
    if (!id || upperId.includes('INVALID') || upperId.includes('TEST-FORGE') || upperId.startsWith('ORD-TEST') || seen.has(upperId)) continue;
    seen.add(upperId);
    const products = Array.isArray(o.products) ? o.products : [];
    const itemsCount = products.reduce((s: number, p: any) => s + Number(p.qty || p.quantity || 1), 0) || 1;
    results.push({
      id,
      recordType: 'Order',
      status: o.orderStatus || 'Procuring',
      date: o.orderDate || formatReadableDate(o.savedAt) || '',
      itemsCount,
    });
    orderCount++;
  }

  // 2. External Purchase Requests (up to 2)
  const externalReqs = readJsonSafe<any[]>('external_purchase_requests_db.json', []);
  let extCount = 0;
  for (const r of externalReqs) {
    if (extCount >= 2) break;
    if (!matchesCustomer(r)) continue;
    const id = String(r.requestId || r.id || '').trim();
    if (!id || seen.has(id.toUpperCase())) continue;
    seen.add(id.toUpperCase());
    const products = Array.isArray(r.requestedProducts) ? r.requestedProducts : [];
    const itemsCount = products.reduce((s: number, p: any) => s + Number(p.quantity || 1), 0) || 1;
    results.push({
      id,
      recordType: 'External Request',
      status: r.status || 'New Requests',
      date: r.createdAt || '',
      itemsCount,
    });
    extCount++;
  }

  // 3. Buy For Me Requests (up to 2)
  const customerReqsMap = readJsonSafe<Record<string, any[]>>('customer_requests.json', {});
  let reqCount = 0;
  for (const [custId, list] of Object.entries(customerReqsMap)) {
    if (reqCount >= 2) break;
    if (!Array.isArray(list)) continue;
    for (const r of list) {
      if (reqCount >= 2) break;
      if (!matchesCustomer({ ...r, customerId: r.customerId || custId })) continue;
      const id = String(r.requestNumber || r.id || '').trim();
      if (!id || seen.has(id.toUpperCase())) continue;
      seen.add(id.toUpperCase());
      results.push({
        id,
        recordType: 'Buy For Me Request',
        status: r.status || 'Under Review',
        date: r.date || '',
        itemsCount: Number(r.totalItems || (Array.isArray(r.products) ? r.products.length : 1)),
      });
      reqCount++;
    }
  }

  return results.slice(0, 8);
}
