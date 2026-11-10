import fs from 'node:fs';
import path from 'node:path';
import {
  createSmtpTransporter,
  ensureSmtpEnvLoaded,
} from './invoiceEmailBackend.ts';
import { registerOrUpdateCustomerOnServer } from './orderConfirmationBackend.ts';

export type ManualPurchaseStatus =
  | 'Request Created'
  | 'Sent to Customer'
  | 'Customer Confirmed'
  | 'Purchase Processing'
  | 'Purchased'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

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
  requestId: string; // e.g. MPR-2026-48102
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

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const MANUAL_REQUESTS_DB_FILE = path.join(DATA_DIR, 'manual_purchase_requests_db.json');

// In-flight deduplication lock
const activeRequestDispatches = new Set<string>();

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

export function normalizeManualPurchaseRequest(
  raw: Partial<ManualPurchaseRequestRecord>
): ManualPurchaseRequestRecord {
  const nowFormatted =
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ', ' +
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const products: ManualPurchaseProductItem[] = (raw.products || []).map((p, idx) => {
    const quantity = Math.max(1, Math.round(Number(p.quantity) || 1));
    const priceINR = Math.max(0, Math.round(Number(p.priceINR) || 0));
    const shippingChargesINR = Math.max(0, Math.round(Number(p.shippingChargesINR) || 0));
    const lineTotalINR = priceINR * quantity + shippingChargesINR;
    return {
      id: p.id || `mpr-item-${idx + 1}`,
      productName: (p.productName || '').trim() || `Product #${idx + 1}`,
      platform: (p.platform || 'Amazon India').trim(),
      productUrl: (p.productUrl || '').trim(),
      productImage: (p.productImage || '').trim() || undefined,
      quantity,
      priceINR,
      shippingChargesINR,
      productNotes: (p.productNotes || '').trim() || undefined,
      lineTotalINR,
    };
  });

  const subtotalINR = products.reduce((sum, p) => sum + p.priceINR * p.quantity, 0);
  const shippingTotalINR = products.reduce((sum, p) => sum + p.shippingChargesINR, 0);
  const grandTotalINR = subtotalINR + shippingTotalINR;

  const requestId = (raw.requestId || `MPR-${Math.floor(10000 + Math.random() * 90000)}`).trim();
  const country = (raw.country || 'United Arab Emirates').trim();

  return {
    requestId,
    orderSource: 'Manual Purchase Request',
    createdAt: raw.createdAt || nowFormatted,
    updatedAt: nowFormatted,
    customerId: raw.customerId || `CUS-${requestId.replace(/[^0-9]/g, '').slice(-5) || '10099'}`,
    customerName: (raw.customerName || '').trim(),
    customerEmail: (raw.customerEmail || '').trim().toLowerCase(),
    customerPhone: (raw.customerPhone || '').trim(),
    deliveryAddress: (raw.deliveryAddress || '').trim(),
    city: (raw.city || '').trim(),
    country,
    postalCode: (raw.postalCode || '').trim(),
    destinationFlag: raw.destinationFlag || getCountryFlag(country),
    products,
    subtotalINR,
    shippingTotalINR,
    grandTotalINR,
    customerMessage: (raw.customerMessage || '').trim() || undefined,
    internalAdminNotes: (raw.internalAdminNotes || '').trim() || undefined,
    purchaseStatus: raw.purchaseStatus || 'Request Created',
    externalOrderId: (raw.externalOrderId || '').trim() || undefined,
    trackingNumber: (raw.trackingNumber || '').trim() || undefined,
    emailStatus: raw.emailStatus || 'Pending',
    emailSentAt: raw.emailSentAt,
    emailError: raw.emailError,
    emailMessageId: raw.emailMessageId,
    emailAttemptCount: Number(raw.emailAttemptCount) || 0,
  };
}

export function getAllManualPurchaseRequests(): ManualPurchaseRequestRecord[] {
  ensureDataDir();
  try {
    if (fs.existsSync(MANUAL_REQUESTS_DB_FILE)) {
      const raw = fs.readFileSync(MANUAL_REQUESTS_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => normalizeManualPurchaseRequest(item));
      }
    }
  } catch (err) {
    console.error('[Manual Purchase DB] Error reading manual purchase requests:', err);
  }
  return [];
}

export function saveManualPurchaseRequestToDb(
  input: Partial<ManualPurchaseRequestRecord>
): ManualPurchaseRequestRecord {
  ensureDataDir();
  const all = getAllManualPurchaseRequests();
  const normalized = normalizeManualPurchaseRequest(input);
  const existingIdx = all.findIndex((r) => r.requestId === normalized.requestId);

  if (existingIdx >= 0) {
    normalized.createdAt = all[existingIdx].createdAt || normalized.createdAt;
    all[existingIdx] = normalized;
  } else {
    all.unshift(normalized);
  }

  fs.writeFileSync(MANUAL_REQUESTS_DB_FILE, JSON.stringify(all, null, 2), 'utf-8');

  if (normalized.customerEmail && normalized.customerName) {
    registerOrUpdateCustomerOnServer({
      customerId: normalized.customerId,
      name: normalized.customerName,
      email: normalized.customerEmail,
      phone: normalized.customerPhone,
      country: normalized.country,
    });
  }

  return normalized;
}

/**
 * Generate HTML Email for Manual Purchase Request
 * IMPORTANT: Never includes internalAdminNotes in customer emails.
 */
export function generateManualPurchaseRequestEmailHtml(record: ManualPurchaseRequestRecord): string {
  const productRowsHtml = record.products
    .map((item, idx) => {
      const itemSubtotal = item.priceINR * item.quantity;
      const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      const safeUrl =
        item.productUrl && (item.productUrl.startsWith('http://') || item.productUrl.startsWith('https://'))
          ? item.productUrl
          : item.productUrl
          ? `https://${item.productUrl}`
          : '';

      return `
        <tr style="background-color: ${bg}; border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 14px; vertical-align: top;">
            <div style="font-weight: 700; font-size: 13.5px; color: #0F172A; line-height: 1.4;">
              ${idx + 1}. ${item.productName}
            </div>
            <div style="margin-top: 5px;">
              <span style="display: inline-block; background-color: #EFF6FF; color: #0066FF; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">
                Store: ${item.platform}
              </span>
              ${
                safeUrl
                  ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin-left: 8px; color: #0066FF; font-size: 11.5px; font-weight: 700; text-decoration: underline;">
                      View Product Link &rarr;
                    </a>`
                  : ''
              }
            </div>
            ${
              item.productNotes
                ? `<div style="margin-top: 5px; font-size: 11.5px; color: #64748B;">Note: ${item.productNotes}</div>`
                : ''
            }
          </td>
          <td style="padding: 14px; text-align: center; vertical-align: top; font-size: 13px; font-weight: 700; color: #334155;">
            ${item.quantity}
          </td>
          <td style="padding: 14px; text-align: right; vertical-align: top; font-size: 13px; color: #475569;">
            ₹${item.priceINR.toLocaleString('en-IN')}
            ${
              item.shippingChargesINR > 0
                ? `<div style="font-size: 11px; color: #64748B;">+₹${item.shippingChargesINR.toLocaleString('en-IN')} ship</div>`
                : ''
            }
          </td>
          <td style="padding: 14px; text-align: right; vertical-align: top; font-size: 13.5px; font-weight: 800; color: #0F172A;">
            ₹${(itemSubtotal + item.shippingChargesINR).toLocaleString('en-IN')}
          </td>
        </tr>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Purchase Request ${record.requestId} - India2World</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0B1933 0%, #1E293B 100%); padding: 28px 32px; color: #FFFFFF;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size: 24px; font-weight: 900; color: #FFFFFF;">
                      India<span style="color: #0066FF;">2</span>World
                    </div>
                    <div style="font-size: 11px; color: #94A3B8; margin-top: 4px; text-transform: uppercase; font-weight: 600;">
                      Assisted Purchase Concierge &amp; International Forwarding
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(0, 102, 255, 0.25); border: 1px solid #3B82F6; color: #93C5FD; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase;">
                      Purchase Request
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 28px 32px 16px 32px;">
              <h1 style="margin: 0 0 10px 0; font-size: 20px; font-weight: 800; color: #0F172A;">
                Hello ${record.customerName},
              </h1>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Our concierge team has prepared your custom purchase request (<strong>${record.requestId}</strong>) for your selected items from Indian online stores. Please review the itemized breakdown and product links below.
              </p>
            </td>
          </tr>

          ${
            record.customerMessage
              ? `
          <tr>
            <td style="padding: 0 32px 18px 32px;">
              <div style="background-color: #EFF6FF; border-left: 4px solid #0066FF; padding: 12px 16px; border-radius: 0 8px 8px 0;">
                <div style="font-size: 11px; font-weight: 800; color: #1E40AF; text-transform: uppercase; margin-bottom: 4px;">Message from Our Concierge Team</div>
                <div style="font-size: 13px; color: #1E3A8A; line-height: 1.5;">${record.customerMessage}</div>
              </div>
            </td>
          </tr>`
              : ''
          }

          <!-- Request Summary Badge -->
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 20px;">
                <tr>
                  <td width="50%" style="vertical-align: top;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B;">Request ID</div>
                    <div style="font-size: 15px; font-weight: 800; color: #0066FF; font-family: monospace; margin-top: 2px;">${record.requestId}</div>
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B; margin-top: 10px;">Created Date</div>
                    <div style="font-size: 13px; font-weight: 600; color: #1E293B; margin-top: 2px;">${record.createdAt}</div>
                  </td>
                  <td width="50%" style="vertical-align: top;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B;">Request Status</div>
                    <div style="font-size: 13px; font-weight: 800; color: #059669; margin-top: 2px;">● ${record.purchaseStatus}</div>
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B; margin-top: 10px;">Destination</div>
                    <div style="font-size: 13px; font-weight: 600; color: #1E293B; margin-top: 2px;">${record.city ? `${record.city}, ` : ''}${record.country}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Products Table -->
          <tr>
            <td style="padding: 0 32px 20px 32px;">
              <div style="font-size: 14px; font-weight: 800; color: #0F172A; margin-bottom: 10px;">
                Requested Products (${record.products.length})
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #0B1933; color: #FFFFFF;">
                    <th align="left" style="padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Product &amp; Store</th>
                    <th align="center" style="padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; width: 50px;">Qty</th>
                    <th align="right" style="padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; width: 95px;">Unit Price</th>
                    <th align="right" style="padding: 10px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; width: 95px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${productRowsHtml}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Customer Info & Totals -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="vertical-align: top; padding-right: 14px;">
                    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px;">
                      <div style="font-size: 11px; font-weight: 800; color: #0066FF; text-transform: uppercase; margin-bottom: 6px;">
                        Customer &amp; Delivery Details
                      </div>
                      <div style="font-size: 13px; font-weight: 700; color: #0F172A;">${record.customerName}</div>
                      <div style="font-size: 12px; color: #475569; line-height: 1.5; margin-top: 4px;">
                        ${record.deliveryAddress ? `${record.deliveryAddress}<br/>` : ''}
                        ${record.city ? `${record.city}, ` : ''}${record.postalCode ? `${record.postalCode}<br/>` : ''}
                        ${record.country}<br/>
                        ${record.customerPhone ? `Phone: ${record.customerPhone}<br/>` : ''}
                        Email: ${record.customerEmail}
                      </div>
                    </div>
                  </td>
                  <td width="52%" style="vertical-align: top;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 14px;">
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748B;">Products Subtotal:</td>
                        <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: 700; color: #1E293B;">₹${record.subtotalINR.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #64748B;">Shipping &amp; Handling Charges:</td>
                        <td align="right" style="padding: 4px 0; font-size: 13px; font-weight: 700; color: #1E293B;">
                          ${record.shippingTotalINR > 0 ? `₹${record.shippingTotalINR.toLocaleString('en-IN')}` : 'FREE'}
                        </td>
                      </tr>
                      <tr style="border-top: 1px solid #CBD5E1;">
                        <td style="padding: 10px 0 2px 0; font-size: 14px; font-weight: 800; color: #0F172A;">Grand Total:</td>
                        <td align="right" style="padding: 10px 0 2px 0; font-size: 18px; font-weight: 900; color: #0066FF;">
                          ₹${record.grandTotalINR.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 18px 32px; text-align: center;">
              <p style="margin: 0; font-size: 11.5px; color: #64748B; line-height: 1.5;">
                <strong>India2World Concierge Desk</strong> &bull; Reply directly to this email to confirm or modify your purchase request.<br/>
                Bay #4, Marol MIDC, Andheri East, Mumbai 400093, India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generateManualPurchaseRequestEmailText(record: ManualPurchaseRequestRecord): string {
  const lines = record.products.map(
    (p, idx) =>
      `${idx + 1}. ${p.productName} | Store: ${p.platform} | Qty: ${p.quantity} | Price: INR ${p.priceINR.toLocaleString('en-IN')}${
        p.shippingChargesINR > 0 ? ` | Shipping: INR ${p.shippingChargesINR.toLocaleString('en-IN')}` : ''
      } | Line Total: INR ${p.lineTotalINR.toLocaleString('en-IN')}${p.productUrl ? `\n   Link: ${p.productUrl}` : ''}${
        p.productNotes ? `\n   Notes: ${p.productNotes}` : ''
      }`
  );

  return `Hello ${record.customerName},

Your custom purchase request (${record.requestId}) has been prepared by India2World.

${record.customerMessage ? `MESSAGE FROM OUR TEAM:\n${record.customerMessage}\n\n` : ''}CUSTOMER & DELIVERY DETAILS:
- Name: ${record.customerName}
- Email: ${record.customerEmail}
- Phone: ${record.customerPhone || 'N/A'}
- Address: ${[record.deliveryAddress, record.city, record.postalCode, record.country].filter(Boolean).join(', ')}

REQUESTED PRODUCTS:
${lines.join('\n')}

COST SUMMARY:
- Products Subtotal: INR ${record.subtotalINR.toLocaleString('en-IN')}
- Shipping Charges: INR ${record.shippingTotalINR.toLocaleString('en-IN')}
- Grand Total: INR ${record.grandTotalINR.toLocaleString('en-IN')}

Please reply to this email to confirm your purchase request.

Warm regards,
India2World Team`;
}

export async function dispatchManualPurchaseRequestEmail(
  rawRecord: Partial<ManualPurchaseRequestRecord>
): Promise<{
  success: boolean;
  status: 'Sent' | 'Failed';
  message: string;
  error?: string;
  record: ManualPurchaseRequestRecord;
}> {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const normalized = normalizeManualPurchaseRequest(rawRecord);

  if (!normalized.customerName) {
    return {
      success: false,
      status: 'Failed',
      message: 'Customer name is required.',
      error: 'Customer name is required.',
      record: normalized,
    };
  }

  if (!normalized.customerEmail || !emailRegex.test(normalized.customerEmail)) {
    return {
      success: false,
      status: 'Failed',
      message: 'A valid customer email address is required.',
      error: 'A valid customer email address is required.',
      record: normalized,
    };
  }

  if (!normalized.products || normalized.products.length === 0) {
    return {
      success: false,
      status: 'Failed',
      message: 'At least one product is required.',
      error: 'At least one product is required.',
      record: normalized,
    };
  }

  if (activeRequestDispatches.has(normalized.requestId)) {
    return {
      success: false,
      status: 'Failed',
      message: `Request ${normalized.requestId} is currently being processed. Please wait.`,
      error: 'Duplicate submission in flight.',
      record: normalized,
    };
  }

  activeRequestDispatches.add(normalized.requestId);

  try {
    // 1. Save to database first
    const saved = saveManualPurchaseRequestToDb(normalized);

    // 2. Check SMTP configuration
    ensureSmtpEnvLoaded();
    const user = (process.env.SMTP_USER || '').trim();
    const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
    const fromName = (process.env.SMTP_FROM_NAME || 'India2World Concierge').replace(/["']/g, '').trim();
    const from = user ? `"${fromName}" <${user}>` : `"${fromName}" <orders@india2world.com>`;

    const timestamp =
      new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }) +
      ', ' +
      new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    if (!user || !pass) {
      const errorMsg = 'SMTP credentials are not configured on the server.';
      const failedRecord = saveManualPurchaseRequestToDb({
        ...saved,
        emailStatus: 'Failed',
        emailError: errorMsg,
        emailAttemptCount: (saved.emailAttemptCount || 0) + 1,
      });
      return {
        success: false,
        status: 'Failed',
        message: `Saved request ${saved.requestId}, but email could not be sent: ${errorMsg}`,
        error: errorMsg,
        record: failedRecord,
      };
    }

    // 3. Send real email via Nodemailer (excluding internalAdminNotes)
    const transporter = createSmtpTransporter();
    const html = generateManualPurchaseRequestEmailHtml(saved);
    const text = generateManualPurchaseRequestEmailText(saved);

    const info = await transporter.sendMail({
      from,
      to: saved.customerEmail,
      replyTo: user,
      subject: `Purchase Request ${saved.requestId} for ${saved.customerName} - India2World`,
      text,
      html,
    });

    const nextStatus: ManualPurchaseStatus =
      saved.purchaseStatus === 'Request Created' ? 'Sent to Customer' : saved.purchaseStatus;

    const updatedRecord = saveManualPurchaseRequestToDb({
      ...saved,
      purchaseStatus: nextStatus,
      emailStatus: 'Sent',
      emailSentAt: timestamp,
      emailError: undefined,
      emailMessageId: info.messageId,
      emailAttemptCount: (saved.emailAttemptCount || 0) + 1,
    });

    return {
      success: true,
      status: 'Sent',
      message: `Manual Purchase Request ${updatedRecord.requestId} saved and emailed to ${updatedRecord.customerEmail}.`,
      record: updatedRecord,
    };
  } catch (err: any) {
    const errMsg = err?.message || 'SMTP transmission failed.';
    const failedRecord = saveManualPurchaseRequestToDb({
      ...normalized,
      emailStatus: 'Failed',
      emailError: errMsg,
      emailAttemptCount: (normalized.emailAttemptCount || 0) + 1,
    });
    return {
      success: false,
      status: 'Failed',
      message: `Request ${failedRecord.requestId} saved to database, but email delivery failed: ${errMsg}`,
      error: errMsg,
      record: failedRecord,
    };
  } finally {
    activeRequestDispatches.delete(normalized.requestId);
  }
}
