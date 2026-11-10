import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  createSmtpTransporter,
  ensureSmtpEnvLoaded,
} from './invoiceEmailBackend.ts';
import { registerOrUpdateCustomerOnServer } from './orderConfirmationBackend.ts';

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
  requestId: string; // e.g. EPR-2026-84102
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

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const EXTERNAL_REQUESTS_DB_FILE = path.join(DATA_DIR, 'external_purchase_requests_db.json');

const activeSubmissions = new Set<string>();

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getCountryFlag(country: string): string {
  const norm = (country || '').trim().toLowerCase();
  if (norm.includes('united arab emirates') || norm === 'uae' || norm.includes('dubai')) return '🇦🇪';
  if (norm.includes('united states') || norm === 'usa' || norm === 'us') return '🇺🇸';
  if (norm.includes('united kingdom') || norm === 'uk' || norm.includes('england')) return '🇬🇧';
  if (norm.includes('canada')) return '🇨🇦';
  if (norm.includes('australia')) return '🇦🇺';
  if (norm.includes('singapore')) return '🇸🇬';
  if (norm.includes('germany')) return '🇩🇪';
  if (norm.includes('saudi')) return '🇸🇦';
  if (norm.includes('qatar')) return '🇶🇦';
  if (norm.includes('india')) return '🇮🇳';
  return '🌍';
}

function formatNowTimestamp(): string {
  return (
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ', ' +
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  );
}

export function loadExternalPurchaseRequestsFromDisk(): ExternalPurchaseRequestRecord[] {
  ensureDataDir();
  if (!fs.existsSync(EXTERNAL_REQUESTS_DB_FILE)) {
    fs.writeFileSync(EXTERNAL_REQUESTS_DB_FILE, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }
  try {
    const raw = fs.readFileSync(EXTERNAL_REQUESTS_DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[ExternalPurchaseRequestsDB] Error loading DB:', err);
    return [];
  }
}

export function saveExternalPurchaseRequestsToDisk(records: ExternalPurchaseRequestRecord[]): void {
  ensureDataDir();
  try {
    fs.writeFileSync(EXTERNAL_REQUESTS_DB_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ExternalPurchaseRequestsDB] Error saving DB:', err);
  }
}

export function computeExternalPurchaseStats(
  records?: ExternalPurchaseRequestRecord[]
): ExternalPurchaseDashboardStats {
  const list = records || loadExternalPurchaseRequestsFromDisk();
  const totalRequests = list.length;
  const newRequests = list.filter((r) => r.status === 'New Requests').length;
  const pendingQuotations = list.filter(
    (r) =>
      r.status === 'New Requests' ||
      r.status === 'Under Review' ||
      r.status === 'Waiting for Customer' ||
      r.status === 'Quotation Sent'
  ).length;
  const customerApproved = list.filter((r) => r.status === 'Customer Approved').length;
  const purchasesProcessing = list.filter(
    (r) =>
      r.status === 'Purchase Processing' ||
      r.status === 'Purchased' ||
      r.status === 'Shipped'
  ).length;
  const completedPurchases = list.filter((r) => r.status === 'Delivered').length;
  const unreadBadgeCount = list.filter(
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

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateSecureApprovalToken(): { token: string; expiresAt: string } {
  const token = crypto.randomBytes(24).toString('hex');
  // 7 days expiration
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return { token, expiresAt };
}

function buildStageEmailContent(
  record: ExternalPurchaseRequestRecord,
  stage: ExternalEmailStage,
  baseUrl = 'http://localhost:5173'
): { subject: string; html: string; text: string } {
  const itemsToRender =
    record.processedProducts && record.processedProducts.length > 0
      ? record.processedProducts.map((p) => ({
          name: p.actualProductName,
          platform: p.platform,
          url: p.verifiedProductUrl,
          qty: p.quantity,
          unitPrice: p.actualPriceINR,
          shipping: p.shippingChargesINR,
          additional: p.additionalChargesINR,
          eta: p.estimatedDeliveryTime,
          subtotal: p.subtotalINR,
        }))
      : record.requestedProducts.map((p) => ({
          name: p.productName,
          platform: p.platform,
          url: p.productUrl || '',
          qty: p.quantity,
          unitPrice: p.expectedBudgetINR || 0,
          shipping: 0,
          additional: 0,
          eta: 'Pending Verification',
          subtotal: (p.expectedBudgetINR || 0) * p.quantity,
        }));

  let stageBadge = 'EXTERNAL PURCHASE REQUEST';
  let stageHeadline = `Update for Request ${record.requestId}`;
  let stageLeadText = `Here is the latest update regarding your external platform purchase request (${record.requestId}).`;
  let headerBg = 'linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%)';

  switch (stage) {
    case 'Request Received':
      stageBadge = 'REQUEST RECEIVED';
      stageHeadline = `We Have Received Your Purchase Request (${record.requestId})`;
      stageLeadText =
        'Thank you for submitting your external platform product request with PHARMAYUSH / India2World. Our procurement specialists are reviewing your items and preparing an official quotation.';
      break;
    case 'Quotation Sent':
      stageBadge = 'OFFICIAL QUOTATION READY';
      stageHeadline = `Purchase Quotation Ready for Approval (${record.requestId})`;
      stageLeadText =
        'Our procurement team has verified your requested products, pricing, and shipping details. Please review the quotation below and approve or reject it using the secure links provided.';
      headerBg = 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)';
      break;
    case 'Quotation Approved':
      stageBadge = 'QUOTATION APPROVED';
      stageHeadline = `Quotation Approved – Ready for Procurement (${record.requestId})`;
      stageLeadText =
        'We have recorded your approval of the purchase quotation. Our buying desk will now proceed with purchasing your items from the external shopping platforms.';
      headerBg = 'linear-gradient(135deg,#065f46 0%,#059669 100%)';
      break;
    case 'Quotation Rejected':
      stageBadge = 'QUOTATION REJECTED';
      stageHeadline = `Quotation Decision Recorded (${record.requestId})`;
      stageLeadText =
        'We have recorded that you declined the current quotation. Our procurement team has been notified and will review your feedback.';
      headerBg = 'linear-gradient(135deg,#7c2d12 0%,#ea580c 100%)';
      break;
    case 'Purchase Completed':
      stageBadge = 'PURCHASE COMPLETED';
      stageHeadline = `Your Requested Products Have Been Purchased (${record.requestId})`;
      stageLeadText =
        'Great news! Our procurement team has completed the purchase of your requested products from the external retailer(s). See the official purchase confirmation details below.';
      headerBg = 'linear-gradient(135deg,#065f46 0%,#10b981 100%)';
      break;
    case 'Product Shipped':
      stageBadge = 'ORDER SHIPPED';
      stageHeadline = `Your External Purchase Order Has Shipped (${record.requestId})`;
      stageLeadText =
        'Your purchased items are now in transit! Please find the carrier and tracking details below.';
      headerBg = 'linear-gradient(135deg,#1e40af 0%,#3b82f6 100%)';
      break;
    case 'Tracking Updated':
      stageBadge = 'TRACKING INFORMATION UPDATED';
      stageHeadline = `Updated Tracking Details for ${record.requestId}`;
      stageLeadText =
        'The shipping and tracking details for your external platform purchase have been updated.';
      break;
    case 'Product Delivered':
      stageBadge = 'ORDER DELIVERED';
      stageHeadline = `Your External Purchase Order Has Been Delivered (${record.requestId})`;
      stageLeadText =
        'Your external platform purchase order has been marked as delivered. Thank you for shopping globally with PHARMAYUSH / India2World!';
      headerBg = 'linear-gradient(135deg,#065f46 0%,#059669 100%)';
      break;
    case 'Request Cancelled':
      stageBadge = 'REQUEST CANCELLED';
      stageHeadline = `External Purchase Request Cancelled (${record.requestId})`;
      stageLeadText =
        'Your external platform purchase request has been cancelled. If you have any questions, please reply to this email.';
      headerBg = 'linear-gradient(135deg,#7f1d1d 0%,#dc2626 100%)';
      break;
  }

  const subject = `[PHARMAYUSH / India2World] ${stageHeadline}`;

  const rowsHtml = itemsToRender
    .map(
      (item, idx) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;font-weight:600;">${idx + 1}</td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;">
          <div style="font-weight:700;margin-bottom:3px;">${escapeHtml(item.name)}</div>
          <div style="font-size:11px;color:#64748b;">Platform: <strong>${escapeHtml(item.platform)}</strong> | Est. Delivery: ${escapeHtml(item.eta || 'Standard')}</div>
          ${
            item.url
              ? `<div style="margin-top:5px;"><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-size:12px;font-weight:600;text-decoration:underline;">View Verified Shopping Link &rarr;</a></div>`
              : ''
          }
        </td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;text-align:center;font-weight:600;">${item.qty}</td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;text-align:right;">&#8377;${item.unitPrice.toLocaleString('en-IN')}</td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;text-align:right;">&#8377;${(item.shipping + item.additional).toLocaleString('en-IN')}</td>
        <td style="padding:12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;text-align:right;font-weight:700;">&#8377;${item.subtotal.toLocaleString('en-IN')}</td>
      </tr>`
    )
    .join('');

  const approveUrl = record.quotation?.approvalToken
    ? `${baseUrl}/request-external-purchase?externalRequestId=${encodeURIComponent(record.requestId)}&token=${encodeURIComponent(record.quotation.approvalToken)}&decision=approve`
    : '';
  const rejectUrl = record.quotation?.approvalToken
    ? `${baseUrl}/request-external-purchase?externalRequestId=${encodeURIComponent(record.requestId)}&token=${encodeURIComponent(record.quotation.approvalToken)}&decision=reject`
    : '';

  const approvalCtaHtml =
    stage === 'Quotation Sent' && approveUrl
      ? `
      <div style="margin:24px 0;padding:20px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;text-align:center;">
        <div style="font-size:14px;font-weight:800;color:#1e3a8a;margin-bottom:8px;">Action Required: Approve or Reject Quotation</div>
        <div style="font-size:13px;color:#334155;margin-bottom:16px;">Click one of the secure buttons below to confirm your decision for Request <strong>${escapeHtml(record.requestId)}</strong> (Ref: ${escapeHtml(record.quotation.quotationReference)}):</div>
        <div>
          <a href="${approveUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#ffffff;font-weight:700;font-size:13px;text-decoration:none;border-radius:8px;margin-right:10px;">&#10003; Approve Quotation (&#8377;${record.quotation.grandTotalINR.toLocaleString('en-IN')})</a>
          <a href="${rejectUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;background:#dc2626;color:#ffffff;font-weight:700;font-size:13px;text-decoration:none;border-radius:8px;">&#10005; Reject Quotation</a>
        </div>
      </div>`
      : '';

  const purchaseDetailsHtml = record.purchaseRecord
    ? `
      <div style="margin:20px 0;padding:18px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;">
        <div style="font-size:12px;font-weight:800;color:#065f46;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:10px;">Official External Purchase &amp; Shipping Confirmation</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;color:#064e3b;">
          <tr>
            <td style="padding:4px 0;"><strong>External Retailer Order ID:</strong> ${escapeHtml(record.purchaseRecord.externalOrderId)}</td>
            <td style="padding:4px 0;"><strong>Actual Purchase Date:</strong> ${escapeHtml(record.purchaseRecord.actualPurchaseDate)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;"><strong>Actual Purchase Amount:</strong> &#8377;${Number(record.purchaseRecord.actualPurchaseAmountINR || 0).toLocaleString('en-IN')}</td>
            <td style="padding:4px 0;"><strong>Shipping Carrier:</strong> ${escapeHtml(record.purchaseRecord.shippingCarrier || 'Standard Courier')}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;"><strong>Tracking Number:</strong> ${escapeHtml(record.purchaseRecord.trackingNumber || 'Pending assignment')}</td>
            <td style="padding:4px 0;"><strong>Estimated Delivery Date:</strong> ${escapeHtml(record.purchaseRecord.estimatedDeliveryDate || 'To be updated')}</td>
          </tr>
          ${
            record.purchaseRecord.confirmationDetails
              ? `<tr><td colspan="2" style="padding-top:8px;"><strong>Confirmation Details:</strong> ${escapeHtml(record.purchaseRecord.confirmationDetails)}</td></tr>`
              : ''
          }
        </table>
      </div>`
    : '';

  // Note: Never expose internalAdminNotes to customer emails!
  const customerMessageHtml = record.quotation?.customerFacingMessage
    ? `
      <div style="margin:18px 0;padding:14px 16px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:6px;font-size:13px;color:#78350f;">
        <strong>Message from PHARMAYUSH / India2World Procurement Desk:</strong><br/>
        ${escapeHtml(record.quotation.customerFacingMessage)}
      </div>`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:24px;background-color:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;color:#0f172a;">
  <div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 4px 20px rgba(15,23,42,0.06);">
    <div style="background:${headerBg};padding:28px 32px;color:#ffffff;">
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#93c5fd;font-weight:700;margin-bottom:6px;">PHARMAYUSH &bull; INDIA2WORLD &bull; ${escapeHtml(stageBadge)}</div>
      <h1 style="margin:0;font-size:21px;font-weight:800;">${escapeHtml(stageHeadline)}</h1>
      <p style="margin:6px 0 0;font-size:13px;color:#e2e8f0;">Request Reference: <strong>${escapeHtml(record.requestId)}</strong> &bull; Status: <strong>${escapeHtml(record.status)}</strong></p>
    </div>

    <div style="padding:28px 32px;">
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
        Dear <strong>${escapeHtml(record.customerName)}</strong>,
      </p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
        ${escapeHtml(stageLeadText)}
      </p>

      ${customerMessageHtml}
      ${approvalCtaHtml}
      ${purchaseDetailsHtml}

      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:24px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:0.8px;margin-bottom:8px;">Customer &amp; Delivery Information</div>
        <div style="font-size:13px;color:#1e293b;line-height:1.6;">
          <strong>Name:</strong> ${escapeHtml(record.customerName)}<br/>
          <strong>Email:</strong> ${escapeHtml(record.customerEmail)}<br/>
          <strong>Phone:</strong> ${escapeHtml(record.customerPhone)}<br/>
          <strong>Delivery Address:</strong> ${escapeHtml(record.deliveryAddress)}, ${escapeHtml(record.city)}, ${escapeHtml(record.state)}, ${escapeHtml(record.country)} - ${escapeHtml(record.postalCode)}
        </div>
      </div>

      <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:#475569;letter-spacing:0.8px;margin-bottom:10px;">Product &amp; Pricing Breakdown</div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
        <thead>
          <tr style="background:#0f172a;color:#ffffff;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;">
            <th style="padding:10px 12px;text-align:left;">#</th>
            <th style="padding:10px 12px;text-align:left;">Product &amp; Shopping Link</th>
            <th style="padding:10px 12px;text-align:center;">Qty</th>
            <th style="padding:10px 12px;text-align:right;">Unit Price</th>
            <th style="padding:10px 12px;text-align:right;">Shipping/Extra</th>
            <th style="padding:10px 12px;text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="margin-left:auto;max-width:300px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#475569;margin-bottom:6px;">
          <span>Products Amount:</span>
          <strong>&#8377;${Number(record.quotation?.productsTotalINR || 0).toLocaleString('en-IN')}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#475569;margin-bottom:6px;">
          <span>Shipping Charges:</span>
          <strong>&#8377;${Number(record.quotation?.shippingTotalINR || 0).toLocaleString('en-IN')}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px;color:#475569;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #cbd5e1;">
          <span>Additional Charges:</span>
          <strong>&#8377;${Number(record.quotation?.additionalChargesTotalINR || 0).toLocaleString('en-IN')}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:16px;color:#0f172a;font-weight:800;">
          <span>Grand Total:</span>
          <span style="color:#2563eb;">&#8377;${Number(record.quotation?.grandTotalINR || 0).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <p style="margin:24px 0 0;font-size:12px;color:#64748b;line-height:1.5;text-align:center;">
        Need assistance with your external platform purchase request? Reply directly to this email or quote Reference ID <strong>${escapeHtml(record.requestId)}</strong>.
      </p>
    </div>
  </div>
</body>
</html>`;

  const textLines = itemsToRender
    .map(
      (item, i) =>
        `${i + 1}. ${item.name} (${item.platform}) - Qty: ${item.qty} | Unit: INR ${item.unitPrice} | Subtotal: INR ${item.subtotal}${
          item.url ? ` | Link: ${item.url}` : ''
        }`
    )
    .join('\n');

  const text = `${stageHeadline}
Request ID: ${record.requestId}
Status: ${record.status}

Dear ${record.customerName},

${stageLeadText}

${record.quotation?.customerFacingMessage ? `Admin Message: ${record.quotation.customerFacingMessage}\n\n` : ''}${
    stage === 'Quotation Sent' && approveUrl
      ? `Approve Quotation: ${approveUrl}\nReject Quotation: ${rejectUrl}\n\n`
      : ''
  }Products:
${textLines}

Products Total: INR ${record.quotation?.productsTotalINR || 0}
Shipping Total: INR ${record.quotation?.shippingTotalINR || 0}
Additional Charges: INR ${record.quotation?.additionalChargesTotalINR || 0}
Grand Total: INR ${record.quotation?.grandTotalINR || 0}
`;

  return { subject, html, text };
}

export async function sendExternalRequestStageEmail(
  record: ExternalPurchaseRequestRecord,
  stage: ExternalEmailStage,
  baseUrl = 'http://localhost:5173'
): Promise<{
  success: boolean;
  emailEntry: ExternalRequestEmailLogEntry;
  error?: string;
}> {
  ensureSmtpEnvLoaded();
  const recipient = (record.customerEmail || '').trim();
  const { subject, html, text } = buildStageEmailContent(record, stage, baseUrl);
  const timestamp = formatNowTimestamp();

  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    const failedEntry: ExternalRequestEmailLogEntry = {
      id: `eml-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      stage,
      recipient: recipient || 'Invalid Email',
      subject,
      status: 'Failed',
      error: 'Valid customer email address is required.',
    };
    return { success: false, emailEntry: failedEntry, error: failedEntry.error };
  }

  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  if (!smtpUser || !smtpPass) {
    const failedEntry: ExternalRequestEmailLogEntry = {
      id: `eml-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      stage,
      recipient,
      subject,
      status: 'Failed',
      error: 'SMTP credentials are not configured on the server.',
    };
    return { success: false, emailEntry: failedEntry, error: failedEntry.error };
  }

  try {
    const transporter = createSmtpTransporter();
    await transporter.verify();
    const senderAddress =
      process.env.SMTP_FROM || `"PHARMAYUSH / India2World" <${smtpUser}>`;

    const info = await transporter.sendMail({
      from: senderAddress,
      to: recipient,
      subject,
      text,
      html,
    });

    const accepted = Array.isArray(info.accepted) ? info.accepted : [];
    if (accepted.length === 0) {
      throw new Error('SMTP server did not accept the recipient address.');
    }

    const sentEntry: ExternalRequestEmailLogEntry = {
      id: `eml-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      stage,
      recipient,
      subject,
      status: 'Sent',
      messageId: info.messageId,
    };
    return { success: true, emailEntry: sentEntry };
  } catch (err: any) {
    const failedEntry: ExternalRequestEmailLogEntry = {
      id: `eml-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      stage,
      recipient,
      subject,
      status: 'Failed',
      error: err?.message || 'SMTP transmission failed.',
    };
    return { success: false, emailEntry: failedEntry, error: failedEntry.error };
  }
}

export async function createCustomerExternalPurchaseRequest(
  payload: {
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
  },
  baseUrl = 'http://localhost:5173'
): Promise<{
  success: boolean;
  record?: ExternalPurchaseRequestRecord;
  emailSent: boolean;
  emailError?: string;
  error?: string;
}> {
  const customerName = (payload.customerName || '').trim();
  const customerEmail = (payload.customerEmail || '').trim();
  const customerPhone = (payload.customerPhone || '').trim();

  if (!customerName) {
    return { success: false, emailSent: false, error: 'Customer full name is required.' };
  }
  if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return { success: false, emailSent: false, error: 'A valid customer email address is required.' };
  }
  if (!customerPhone) {
    return { success: false, emailSent: false, error: 'Customer phone number is required.' };
  }
  if (!(payload.deliveryAddress || '').trim()) {
    return { success: false, emailSent: false, error: 'Customer delivery address is required.' };
  }
  if (!Array.isArray(payload.products) || payload.products.length === 0) {
    return { success: false, emailSent: false, error: 'At least one requested product is required.' };
  }
  for (let i = 0; i < payload.products.length; i++) {
    const prod = payload.products[i];
    if (!(prod?.productName || '').trim()) {
      return { success: false, emailSent: false, error: `Product name is required for Product #${i + 1}.` };
    }
    if (prod?.productUrl && prod.productUrl.trim()) {
      try {
        const parsed = new URL(prod.productUrl.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return { success: false, emailSent: false, error: `Invalid product URL for "${prod.productName}".` };
        }
      } catch {
        return { success: false, emailSent: false, error: `Invalid product URL for "${prod.productName}".` };
      }
    }
  }

  const dedupeKey = `${customerEmail.toLowerCase()}-${payload.products.length}-${payload.products[0]?.productName || ''}`;
  if (activeSubmissions.has(dedupeKey)) {
    return {
      success: false,
      emailSent: false,
      error: 'Your purchase request is already being submitted. Please wait.',
    };
  }

  activeSubmissions.add(dedupeKey);
  try {
    const now = formatNowTimestamp();
    const requestId = `EPR-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const customerId =
      payload.customerId || `CUST-${Math.floor(1000 + Math.random() * 9000)}`;

    const requestedProducts: CustomerRequestedProductItem[] = payload.products.map((p, idx) => ({
      id: p.id || `req-prod-${idx + 1}-${Date.now()}`,
      productName: (p.productName || '').trim() || `Requested Product #${idx + 1}`,
      platform: (p.platform || 'Amazon').trim(),
      productUrl: (p.productUrl || '').trim() || undefined,
      productImage: (p.productImage || '').trim() || undefined,
      quantity: Math.max(1, Math.round(Number(p.quantity) || 1)),
      expectedBudgetINR:
        p.expectedBudgetINR !== undefined && p.expectedBudgetINR !== null && Number(p.expectedBudgetINR) > 0
          ? Math.round(Number(p.expectedBudgetINR))
          : undefined,
      description: (p.description || '').trim() || undefined,
      additionalRequirements: (p.additionalRequirements || '').trim() || undefined,
    }));

    // Initialize processedProducts from requestedProducts so admin has a pre-filled starting point
    const processedProducts: AdminProcessedProductItem[] = requestedProducts.map((rp, idx) => {
      const unitPrice = rp.expectedBudgetINR || 0;
      const subtotalINR = unitPrice * rp.quantity;
      return {
        id: `proc-prod-${idx + 1}-${Date.now()}`,
        actualProductName: rp.productName,
        platform: rp.platform,
        verifiedProductUrl: rp.productUrl || '',
        productImage: rp.productImage,
        quantity: rp.quantity,
        actualPriceINR: unitPrice,
        shippingChargesINR: 0,
        additionalChargesINR: 0,
        estimatedDeliveryTime: '5-7 Business Days',
        productNotes: rp.description || '',
        subtotalINR,
      };
    });

    const productsTotalINR = processedProducts.reduce(
      (sum, item) => sum + item.actualPriceINR * item.quantity,
      0
    );

    const newRecord: ExternalPurchaseRequestRecord = {
      requestId,
      customerId,
      customerName,
      customerEmail,
      customerPhone: customerPhone || '+91 98765 43210',
      deliveryAddress: (payload.deliveryAddress || '').trim(),
      city: (payload.city || '').trim(),
      state: (payload.state || '').trim(),
      country: (payload.country || 'India').trim(),
      postalCode: (payload.postalCode || '').trim(),
      destinationFlag: getCountryFlag(payload.country || 'India'),
      requestedProducts,
      processedProducts,
      quotation: {
        quotationReference: `QTN-${requestId.replace('EPR-', '')}`,
        productsTotalINR,
        shippingTotalINR: 0,
        additionalChargesTotalINR: 0,
        grandTotalINR: productsTotalINR,
      },
      status: 'New Requests',
      unreadAdminAlert: true,
      createdAt: now,
      updatedAt: now,
      activityHistory: [
        {
          id: `act-${Date.now()}`,
          timestamp: now,
          action: 'Customer Submitted External Purchase Request',
          toStatus: 'New Requests',
          actor: `${customerName} (Customer)`,
          details: `Submitted ${requestedProducts.length} product(s) from ${Array.from(
            new Set(requestedProducts.map((p) => p.platform))
          ).join(', ')}.`,
        },
      ],
      emailHistory: [],
    };

    // Register or update customer profile in server DB
    registerOrUpdateCustomerOnServer({
      customerId: newRecord.customerId,
      name: newRecord.customerName,
      email: newRecord.customerEmail,
      phone: newRecord.customerPhone,
      country: newRecord.country,
    });

    // Send Stage 1 Email: Request Received
    const emailResult = await sendExternalRequestStageEmail(
      newRecord,
      'Request Received',
      baseUrl
    );
    newRecord.emailHistory.unshift(emailResult.emailEntry);

    const existing = loadExternalPurchaseRequestsFromDisk();
    existing.unshift(newRecord);
    saveExternalPurchaseRequestsToDisk(existing);

    return {
      success: true,
      record: newRecord,
      emailSent: emailResult.success,
      emailError: emailResult.error,
    };
  } finally {
    activeSubmissions.delete(dedupeKey);
  }
}

function recalculateQuotationTotals(
  processedProducts: AdminProcessedProductItem[],
  existingQuotation: ExternalRequestQuotation
): {
  items: AdminProcessedProductItem[];
  quotation: ExternalRequestQuotation;
} {
  const items = processedProducts.map((item, idx) => {
    const quantity = Math.max(1, Math.round(Number(item.quantity) || 1));
    const actualPriceINR = Math.max(0, Math.round(Number(item.actualPriceINR) || 0));
    const shippingChargesINR = Math.max(0, Math.round(Number(item.shippingChargesINR) || 0));
    const additionalChargesINR = Math.max(0, Math.round(Number(item.additionalChargesINR) || 0));
    const subtotalINR =
      actualPriceINR * quantity + shippingChargesINR + additionalChargesINR;
    return {
      ...item,
      id: item.id || `proc-prod-${idx + 1}`,
      actualProductName: (item.actualProductName || '').trim() || `Product #${idx + 1}`,
      platform: (item.platform || 'Amazon').trim(),
      verifiedProductUrl: (item.verifiedProductUrl || '').trim(),
      productImage: (item.productImage || '').trim() || undefined,
      quantity,
      actualPriceINR,
      shippingChargesINR,
      additionalChargesINR,
      estimatedDeliveryTime: (item.estimatedDeliveryTime || '5-7 Business Days').trim(),
      productNotes: (item.productNotes || '').trim() || undefined,
      subtotalINR,
    };
  });

  const productsTotalINR = items.reduce(
    (sum, p) => sum + p.actualPriceINR * p.quantity,
    0
  );
  const shippingTotalINR = items.reduce((sum, p) => sum + p.shippingChargesINR, 0);
  const additionalChargesTotalINR = items.reduce(
    (sum, p) => sum + p.additionalChargesINR,
    0
  );
  const grandTotalINR =
    productsTotalINR + shippingTotalINR + additionalChargesTotalINR;

  return {
    items,
    quotation: {
      ...existingQuotation,
      productsTotalINR,
      shippingTotalINR,
      additionalChargesTotalINR,
      grandTotalINR,
    },
  };
}

export async function sendAdminQuotationForExternalRequest(
  requestId: string,
  payload: {
    processedProducts: AdminProcessedProductItem[];
    customerFacingMessage?: string;
    internalAdminNotes?: string;
    quotationReference?: string;
    adminActor?: string;
  },
  baseUrl = 'http://localhost:5173'
): Promise<{
  success: boolean;
  record?: ExternalPurchaseRequestRecord;
  emailSent: boolean;
  emailError?: string;
  error?: string;
}> {
  const all = loadExternalPurchaseRequestsFromDisk();
  const idx = all.findIndex((r) => r.requestId === requestId);
  if (idx === -1) {
    return { success: false, emailSent: false, error: `Request ${requestId} not found.` };
  }

  const current = all[idx];
  const now = formatNowTimestamp();
  const prevStatus = current.status;

  const { items, quotation } = recalculateQuotationTotals(
    payload.processedProducts || current.processedProducts,
    current.quotation
  );

  const { token, expiresAt } = generateSecureApprovalToken();

  const updatedQuotation: ExternalRequestQuotation = {
    ...quotation,
    quotationReference:
      (payload.quotationReference || '').trim() ||
      current.quotation.quotationReference ||
      `QTN-${current.requestId.replace('EPR-', '')}`,
    customerFacingMessage: (payload.customerFacingMessage || '').trim() || undefined,
    internalAdminNotes: (payload.internalAdminNotes || '').trim() || undefined,
    approvalToken: token,
    approvalTokenExpiresAt: expiresAt,
    sentAt: now,
  };

  const updatedRecord: ExternalPurchaseRequestRecord = {
    ...current,
    processedProducts: items,
    quotation: updatedQuotation,
    status: 'Quotation Sent',
    unreadAdminAlert: false,
    updatedAt: now,
  };

  const emailResult = await sendExternalRequestStageEmail(
    updatedRecord,
    'Quotation Sent',
    baseUrl
  );

  updatedRecord.emailHistory = [emailResult.emailEntry, ...(current.emailHistory || [])];
  updatedRecord.activityHistory = [
    {
      id: `act-${Date.now()}`,
      timestamp: now,
      action: emailResult.success
        ? 'Quotation Prepared & Sent to Customer'
        : 'Quotation Saved (Email Delivery Failed)',
      fromStatus: prevStatus,
      toStatus: 'Quotation Sent',
      actor: payload.adminActor || 'Super Admin',
      details: `Quotation ${updatedQuotation.quotationReference} for ₹${updatedQuotation.grandTotalINR.toLocaleString(
        'en-IN'
      )} (${items.length} item(s)) ${
        emailResult.success
          ? `dispatched to ${updatedRecord.customerEmail}`
          : `failed to send: ${emailResult.error}`
      }.`,
    },
    ...(current.activityHistory || []),
  ];

  all[idx] = updatedRecord;
  saveExternalPurchaseRequestsToDisk(all);

  return {
    success: true,
    record: updatedRecord,
    emailSent: emailResult.success,
    emailError: emailResult.error,
  };
}

export async function processCustomerQuotationDecision(
  payload: {
    requestId: string;
    token: string;
    decision: 'approve' | 'reject';
    customerNote?: string;
  },
  baseUrl = 'http://localhost:5173'
): Promise<{
  success: boolean;
  record?: ExternalPurchaseRequestRecord;
  emailSent?: boolean;
  error?: string;
}> {
  const all = loadExternalPurchaseRequestsFromDisk();
  const idx = all.findIndex((r) => r.requestId === payload.requestId);
  if (idx === -1) {
    return { success: false, error: 'External purchase request not found.' };
  }

  const current = all[idx];
  const savedToken = current.quotation?.approvalToken;
  if (!savedToken || savedToken !== payload.token) {
    return {
      success: false,
      error: 'Invalid or unauthorized quotation approval token.',
    };
  }

  if (current.quotation?.approvalTokenExpiresAt) {
    const exp = new Date(current.quotation.approvalTokenExpiresAt).getTime();
    if (!Number.isNaN(exp) && Date.now() > exp) {
      return {
        success: false,
        error: 'This quotation approval link has expired. Please ask the admin to resend the quotation.',
      };
    }
  }

  const now = formatNowTimestamp();
  const prevStatus = current.status;
  const isApproved = payload.decision === 'approve';
  // Per Requirement 7 & 11: When customer approves, update status to 'Customer Approved', notify admin, and DO NOT automatically mark as Purchased!
  const nextStatus: ExternalPurchaseRequestStatus = isApproved
    ? 'Customer Approved'
    : 'Waiting for Customer';

  const updatedRecord: ExternalPurchaseRequestRecord = {
    ...current,
    status: nextStatus,
    unreadAdminAlert: true, // Alert admin in sidebar badge!
    updatedAt: now,
    quotation: {
      ...current.quotation,
      customerDecision: isApproved ? 'Approved' : 'Rejected',
      customerDecisionAt: now,
      customerDecisionNote: (payload.customerNote || '').trim() || undefined,
    },
  };

  const stage: ExternalEmailStage = isApproved
    ? 'Quotation Approved'
    : 'Quotation Rejected';
  const emailResult = await sendExternalRequestStageEmail(
    updatedRecord,
    stage,
    baseUrl
  );

  updatedRecord.emailHistory = [emailResult.emailEntry, ...(current.emailHistory || [])];
  updatedRecord.activityHistory = [
    {
      id: `act-${Date.now()}`,
      timestamp: now,
      action: isApproved
        ? 'Customer Approved Quotation'
        : 'Customer Rejected Quotation',
      fromStatus: prevStatus,
      toStatus: nextStatus,
      actor: `${current.customerName} (Customer)`,
      details: isApproved
        ? `Customer approved quotation ${current.quotation.quotationReference} (₹${current.quotation.grandTotalINR.toLocaleString(
            'en-IN'
          )}). Ready for admin to purchase items.`
        : `Customer declined quotation ${current.quotation.quotationReference}.${
            payload.customerNote ? ` Note: ${payload.customerNote}` : ''
          }`,
    },
    ...(current.activityHistory || []),
  ];

  all[idx] = updatedRecord;
  saveExternalPurchaseRequestsToDisk(all);

  return {
    success: true,
    record: updatedRecord,
    emailSent: emailResult.success,
  };
}

export async function updateAdminExternalPurchaseRequest(
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
    adminActor?: string;
    actionNote?: string;
  },
  baseUrl = 'http://localhost:5173'
): Promise<{
  success: boolean;
  record?: ExternalPurchaseRequestRecord;
  emailSent?: boolean;
  emailError?: string;
  error?: string;
}> {
  const all = loadExternalPurchaseRequestsFromDisk();
  const idx = all.findIndex((r) => r.requestId === requestId);
  if (idx === -1) {
    return { success: false, error: `Request ${requestId} not found.` };
  }

  const current = all[idx];
  const now = formatNowTimestamp();
  const prevStatus = current.status;
  const nextStatus = updates.status || current.status;

  // Enforce Requirement 11: Only admin can confirm actual purchase completion, and if marking as 'Purchased', require externalOrderId
  if (
    nextStatus === 'Purchased' &&
    !updates.purchaseRecord?.externalOrderId &&
    !current.purchaseRecord?.externalOrderId
  ) {
    return {
      success: false,
      error:
        'Cannot mark request as Purchased without recording the External Retailer Order ID.',
    };
  }

  const { items: recalculatedProcessed, quotation: recalculatedQuotation } =
    recalculateQuotationTotals(
      updates.processedProducts || current.processedProducts,
      {
        ...current.quotation,
        quotationReference:
          updates.quotationReference !== undefined
            ? updates.quotationReference
            : current.quotation.quotationReference,
        customerFacingMessage:
          updates.customerFacingMessage !== undefined
            ? updates.customerFacingMessage
            : current.quotation.customerFacingMessage,
        internalAdminNotes:
          updates.internalAdminNotes !== undefined
            ? updates.internalAdminNotes
            : current.quotation.internalAdminNotes,
      }
    );

  let mergedPurchaseRecord = current.purchaseRecord;
  if (updates.purchaseRecord) {
    mergedPurchaseRecord = {
      externalOrderId:
        (updates.purchaseRecord.externalOrderId ??
          current.purchaseRecord?.externalOrderId ??
          '').trim(),
      actualPurchaseDate:
        (updates.purchaseRecord.actualPurchaseDate ??
          current.purchaseRecord?.actualPurchaseDate ??
          new Date().toISOString().slice(0, 10)).trim(),
      actualPurchaseAmountINR: Number(
        updates.purchaseRecord.actualPurchaseAmountINR ??
          current.purchaseRecord?.actualPurchaseAmountINR ??
          recalculatedQuotation.grandTotalINR
      ),
      confirmationDetails:
        (updates.purchaseRecord.confirmationDetails ??
          current.purchaseRecord?.confirmationDetails ??
          '').trim(),
      trackingNumber:
        (updates.purchaseRecord.trackingNumber ??
          current.purchaseRecord?.trackingNumber ??
          '').trim() || undefined,
      shippingCarrier:
        (updates.purchaseRecord.shippingCarrier ??
          current.purchaseRecord?.shippingCarrier ??
          '').trim() || undefined,
      estimatedDeliveryDate:
        (updates.purchaseRecord.estimatedDeliveryDate ??
          current.purchaseRecord?.estimatedDeliveryDate ??
          '').trim() || undefined,
      recordedByAdminAt: now,
    };
  }

  const nextCountry =
    updates.country !== undefined ? updates.country.trim() : current.country;

  const updatedRecord: ExternalPurchaseRequestRecord = {
    ...current,
    customerName:
      updates.customerName !== undefined
        ? updates.customerName.trim()
        : current.customerName,
    customerEmail:
      updates.customerEmail !== undefined
        ? updates.customerEmail.trim()
        : current.customerEmail,
    customerPhone:
      updates.customerPhone !== undefined
        ? updates.customerPhone.trim()
        : current.customerPhone,
    deliveryAddress:
      updates.deliveryAddress !== undefined
        ? updates.deliveryAddress.trim()
        : current.deliveryAddress,
    city: updates.city !== undefined ? updates.city.trim() : current.city,
    state: updates.state !== undefined ? updates.state.trim() : current.state,
    country: nextCountry,
    postalCode:
      updates.postalCode !== undefined
        ? updates.postalCode.trim()
        : current.postalCode,
    destinationFlag: getCountryFlag(nextCountry),
    requestedProducts: updates.requestedProducts || current.requestedProducts,
    processedProducts: recalculatedProcessed,
    quotation: recalculatedQuotation,
    purchaseRecord: mergedPurchaseRecord,
    status: nextStatus,
    unreadAdminAlert:
      updates.markAlertRead === true ? false : current.unreadAdminAlert,
    updatedAt: now,
  };

  let emailSent: boolean | undefined;
  let emailError: string | undefined;

  // Determine if a stage email should be dispatched
  let emailStageToTrigger: ExternalEmailStage | null = null;
  if (updates.sendNotificationEmail !== false) {
    if (nextStatus !== prevStatus) {
      if (nextStatus === 'Purchased') emailStageToTrigger = 'Purchase Completed';
      else if (nextStatus === 'Shipped') emailStageToTrigger = 'Product Shipped';
      else if (nextStatus === 'Delivered') emailStageToTrigger = 'Product Delivered';
      else if (nextStatus === 'Cancelled') emailStageToTrigger = 'Request Cancelled';
      else if (nextStatus === 'Quotation Sent') emailStageToTrigger = 'Quotation Sent';
    } else if (
      updates.purchaseRecord?.trackingNumber &&
      updates.purchaseRecord.trackingNumber !== current.purchaseRecord?.trackingNumber
    ) {
      emailStageToTrigger = 'Tracking Updated';
    }
  }

  if (emailStageToTrigger) {
    const emailRes = await sendExternalRequestStageEmail(
      updatedRecord,
      emailStageToTrigger,
      baseUrl
    );
    emailSent = emailRes.success;
    emailError = emailRes.error;
    updatedRecord.emailHistory = [
      emailRes.emailEntry,
      ...(current.emailHistory || []),
    ];
  }

  const actionDescription =
    updates.actionNote ||
    (nextStatus !== prevStatus
      ? `Status updated from "${prevStatus}" to "${nextStatus}"`
      : updates.purchaseRecord
      ? `Updated purchase & tracking details (Order ID: ${mergedPurchaseRecord?.externalOrderId || 'N/A'})`
      : 'Updated external purchase request details');

  updatedRecord.activityHistory = [
    {
      id: `act-${Date.now()}`,
      timestamp: now,
      action: actionDescription,
      fromStatus: prevStatus,
      toStatus: nextStatus,
      actor: updates.adminActor || 'Super Admin',
      details: `${actionDescription}${
        emailStageToTrigger
          ? emailSent
            ? ` • Notification email (${emailStageToTrigger}) sent to ${updatedRecord.customerEmail}`
            : ` • Notification email (${emailStageToTrigger}) failed: ${emailError}`
          : ''
      }`,
    },
    ...(current.activityHistory || []),
  ];

  all[idx] = updatedRecord;
  saveExternalPurchaseRequestsToDisk(all);

  return {
    success: true,
    record: updatedRecord,
    emailSent,
    emailError,
  };
}

export async function resendExternalPurchaseRequestEmail(
  requestId: string,
  stageOverride?: ExternalEmailStage,
  baseUrl = 'http://localhost:5173'
): Promise<{
  success: boolean;
  record?: ExternalPurchaseRequestRecord;
  emailSent: boolean;
  emailError?: string;
  error?: string;
}> {
  const all = loadExternalPurchaseRequestsFromDisk();
  const idx = all.findIndex((r) => r.requestId === requestId);
  if (idx === -1) {
    return { success: false, emailSent: false, error: `Request ${requestId} not found.` };
  }

  const current = all[idx];
  const now = formatNowTimestamp();

  // Determine appropriate stage to resend based on current status if not explicitly passed
  let stage: ExternalEmailStage = stageOverride || 'Request Received';
  if (!stageOverride) {
    if (current.status === 'Quotation Sent') stage = 'Quotation Sent';
    else if (current.status === 'Customer Approved') stage = 'Quotation Approved';
    else if (current.status === 'Purchased') stage = 'Purchase Completed';
    else if (current.status === 'Shipped') stage = 'Product Shipped';
    else if (current.status === 'Delivered') stage = 'Product Delivered';
    else if (current.status === 'Cancelled') stage = 'Request Cancelled';
    else if (current.emailHistory && current.emailHistory.length > 0) {
      stage = current.emailHistory[0].stage;
    }
  }

  // Ensure token exists if resending Quotation Sent
  if (stage === 'Quotation Sent' && !current.quotation.approvalToken) {
    const { token, expiresAt } = generateSecureApprovalToken();
    current.quotation.approvalToken = token;
    current.quotation.approvalTokenExpiresAt = expiresAt;
  }

  const emailRes = await sendExternalRequestStageEmail(current, stage, baseUrl);
  current.emailHistory = [emailRes.emailEntry, ...(current.emailHistory || [])];
  current.updatedAt = now;
  current.activityHistory = [
    {
      id: `act-${Date.now()}`,
      timestamp: now,
      action: emailRes.success
        ? `Resent "${stage}" Email to Customer`
        : `Failed to Resend "${stage}" Email`,
      fromStatus: current.status,
      toStatus: current.status,
      actor: 'Super Admin',
      details: emailRes.success
        ? `Successfully dispatched "${stage}" email to ${current.customerEmail}.`
        : `Email dispatch to ${current.customerEmail} failed: ${emailRes.error}`,
    },
    ...(current.activityHistory || []),
  ];

  all[idx] = current;
  saveExternalPurchaseRequestsToDisk(all);

  return {
    success: emailRes.success,
    record: current,
    emailSent: emailRes.success,
    emailError: emailRes.error,
    error: emailRes.error,
  };
}
