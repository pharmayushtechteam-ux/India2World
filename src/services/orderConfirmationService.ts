import { emitDataSync, getAllOrders, saveOrders, type IntegratedOrderRecord } from './integratedDataService';
import type { CustomerOrderInvoice } from './orderInvoiceService';

export interface OrderConfirmationDispatchResponse {
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
  orderSaved?: boolean;
  invoiceAttached?: boolean;
}

export interface BackendConfirmationLog {
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

/**
 * Dispatch automatic order confirmation email to customer's registered email via backend SMTP
 */
export async function triggerOrderConfirmationEmail(
  order: IntegratedOrderRecord,
  invoice?: CustomerOrderInvoice,
  isRetry: boolean = false
): Promise<OrderConfirmationDispatchResponse> {
  // Prevent duplicate sending if already sent and not an explicit retry
  if (order.confirmationEmailStatus === 'Sent' && !isRetry) {
    return {
      success: true,
      status: 'Sent',
      orderId: order.id,
      recipient: order.customerEmail,
      message: `Order confirmation email already delivered on ${order.confirmationEmailSentAt}.`,
      timestamp: order.confirmationEmailSentAt || new Date().toLocaleString('en-IN'),
      alreadySent: true,
      orderSaved: true,
      invoiceAttached: Boolean(invoice),
    };
  }

  // Cost summary normalization
  const costSummary = order.costSummary || {
    subtotal: order.items?.reduce((acc, i) => acc + (i.price || 0) * (i.qty || 1), 0) || order.totalINR,
    domesticShipping: 0,
    serviceFee: 350,
    tax: 0,
    discount: 0,
    total: order.totalINR,
  };

  const payload = {
    order: {
      orderId: order.id,
      orderDate: order.createdAt,
      customerId: order.customerId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: (invoice as any)?.customerPhone || '+971 50 123 4567',
      deliveryAddress: {
        street: invoice?.shippingAddress?.street || `Locker I2W-${order.customerId}`,
        city: invoice?.destinationCity || order.destination.split(',')[0]?.trim() || 'Dubai',
        country: invoice?.destinationCountry || order.destination.split(',').pop()?.trim() || 'United Arab Emirates',
      },
      products: (order.items || []).map((item) => ({
        name: item.title,
        store: item.store,
        price: item.price,
        qty: item.qty || 1,
        imageUrl: item.imageUrl,
      })),
      costSummary: {
        subtotal: costSummary.subtotal,
        domesticShipping: costSummary.domesticShipping || 0,
        serviceFee: costSummary.serviceFee || 0,
        tax: costSummary.tax || 0,
        discount: costSummary.discount || 0,
        total: costSummary.total,
      },
      paymentStatus: order.paymentStatus || 'Paid',
      orderStatus: order.orderStatus || 'Procuring',
      orderType: order.orderType,
      stores: order.stores,
      trackingAwb: order.trackingAwb,
      invoice: invoice || undefined,
      attachInvoicePdf: Boolean(invoice),
      isRetry,
    },
  };

  try {
    const res = await fetch('/api/send-order-confirmation-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: OrderConfirmationDispatchResponse = await res.json();

    // Update local order state with the backend delivery result
    const allOrders = getAllOrders();
    const idx = allOrders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      if (data.success && data.status === 'Sent') {
        allOrders[idx].confirmationEmailStatus = 'Sent';
        allOrders[idx].confirmationEmailSentAt = data.timestamp;
        allOrders[idx].confirmationEmailError = undefined;
        allOrders[idx].confirmationEmailAttempts = (allOrders[idx].confirmationEmailAttempts || 0) + 1;
      } else {
        allOrders[idx].confirmationEmailStatus = 'Failed';
        allOrders[idx].confirmationEmailError = data.error || data.message || 'SMTP delivery failed.';
        allOrders[idx].confirmationEmailAttempts = (allOrders[idx].confirmationEmailAttempts || 0) + 1;
      }
      saveOrders([...allOrders]);
      emitDataSync('order-confirmation-updated', { orderId: order.id, status: allOrders[idx].confirmationEmailStatus });
    }

    return data;
  } catch (err: any) {
    const errorMsg = err.message || 'Network error connecting to email service.';
    const allOrders = getAllOrders();
    const idx = allOrders.findIndex((o) => o.id === order.id);
    if (idx >= 0) {
      allOrders[idx].confirmationEmailStatus = 'Failed';
      allOrders[idx].confirmationEmailError = errorMsg;
      allOrders[idx].confirmationEmailAttempts = (allOrders[idx].confirmationEmailAttempts || 0) + 1;
      saveOrders([...allOrders]);
    }

    return {
      success: false,
      status: 'Failed',
      orderId: order.id,
      recipient: order.customerEmail,
      message: 'Failed to deliver confirmation email: ' + errorMsg,
      error: errorMsg,
      timestamp: new Date().toLocaleString('en-IN'),
      orderSaved: true,
      invoiceAttached: false,
    };
  }
}

/**
 * Fetch confirmation email audit logs from backend server
 */
export async function fetchConfirmationEmailLogs(): Promise<BackendConfirmationLog[]> {
  try {
    const res = await fetch('/api/order-confirmation-logs');
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  } catch {
    return [];
  }
}
