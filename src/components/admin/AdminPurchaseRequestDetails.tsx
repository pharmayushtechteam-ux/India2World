import React, { useState, useEffect } from 'react';
import { AdminPurchaseRequest, AdminProductItem } from '../../types/admin';
import { INITIAL_PURCHASE_REQUESTS, ADMIN_CUSTOMERS } from '../../services/adminMockData';
import {
  ArrowLeft,
  Calendar,
  FileCheck,
  Ban,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  Layers,
  Check,
  Edit2,
  Trash2,
  Download,
  Printer,
  FileText,
  X,
  ExternalLink,
  Share2,
  Mail,
  Phone,
  Send,
  RotateCw,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import {
  lookupRegisteredCustomer,
  createAndAutomateQuotationEmail,
  retryQuotationEmail,
  downloadQuotationPdf,
  printQuotationDocument,
  getQuotationByRequestId,
  CustomerQuotationRecord,
} from '../../services/orderInvoiceService';
import {
  getAllPurchaseRequests,
  confirmPurchaseOrderAndEmailInvoice,
} from '../../services/integratedDataService';

interface AdminPurchaseRequestDetailsProps {
  requestId?: string;
  onBack: () => void;
  onNavigateConsolidation?: () => void;
}

export const AdminPurchaseRequestDetails: React.FC<AdminPurchaseRequestDetailsProps> = ({
  requestId = 'REQ-20482',
  onBack,
  onNavigateConsolidation,
}) => {
  const allReqs = getAllPurchaseRequests();
  const request: AdminPurchaseRequest =
    allReqs.find((r) => r.id === requestId) ||
    INITIAL_PURCHASE_REQUESTS.find((r) => r.id === requestId) ||
    allReqs[0] ||
    INITIAL_PURCHASE_REQUESTS[0];

  // Strictly verify customer against authenticated registered accounts (never use unverified fallbacks)
  const customerLookup = lookupRegisteredCustomer(request.customerId, request.customerName);

  const [customerEmail, setCustomerEmail] = useState(customerLookup.email || '');
  const [customerPhone, setCustomerPhone] = useState(customerLookup.phone || '+971 50 123 4567');
  const [isCustomerRegistered, setIsCustomerRegistered] = useState(customerLookup.isRegistered);
  const [customerValidationError, setCustomerValidationError] = useState(customerLookup.validationError || '');

  const [activeTab, setActiveTab] = useState<'products' | 'quotation' | 'payments' | 'packages' | 'timeline' | 'notes'>('products');
  const [products, setProducts] = useState<AdminProductItem[]>(request.products);
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialOpenModal = searchParams?.get('openModal');
  const [quotationModalOpen, setQuotationModalOpen] = useState(initialOpenModal === 'quotation');
  const [quotationCreated, setQuotationCreated] = useState(initialOpenModal === 'invoice');
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(initialOpenModal === 'invoice');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [restrictedModalOpen, setRestrictedModalOpen] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);

  // Automated Quotation State & History
  const [currentQuotation, setCurrentQuotation] = useState<CustomerQuotationRecord | null>(() =>
    getQuotationByRequestId(request.id)
  );
  const [quotationDeliveryStatus, setQuotationDeliveryStatus] = useState<'idle' | 'preparing' | 'sent' | 'failed' | 'invalid'>(() => {
    const existing = getQuotationByRequestId(request.id);
    if (existing) {
      return existing.emailStatus === 'Sent' ? 'sent' : existing.emailStatus === 'Failed' ? 'failed' : 'preparing';
    }
    return 'idle';
  });
  const [deliveryLog, setDeliveryLog] = useState<string>(() => {
    const existing = getQuotationByRequestId(request.id);
    return existing?.emailDeliveryLog || '';
  });

  // Calculate pricing breakdown
  const productSubtotal = products.reduce((acc, p) => acc + p.priceINR * p.qty, 0);
  const domesticShippingCost = request.costSummary?.domesticShipping ?? 350;
  const serviceFeeCost = request.costSummary?.serviceFee ?? 500;
  const taxCost = request.costSummary?.tax ?? 0;
  const discountCost = request.costSummary?.discount ?? 0;
  const totalQuotationAmount = productSubtotal + domesticShippingCost + serviceFeeCost + taxCost - discountCost;
  const quotationNumber = `QTE-${request.id.replace('REQ-', '')}`;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenCreateQuotation = async () => {
    setQuotationModalOpen(true);

    // If quotation already exists and was successfully emailed, keep status as sent (idempotent / no duplicate emails)
    const existing = getQuotationByRequestId(request.id);
    if (existing && existing.emailStatus === 'Sent') {
      setCurrentQuotation(existing);
      setQuotationDeliveryStatus('sent');
      setDeliveryLog(existing.emailDeliveryLog || '');
      setQuotationCreated(true);
      return;
    }

    // Step 1: Verify customer email
    const lookup = lookupRegisteredCustomer(request.customerId, request.customerName);
    if (!lookup.isRegistered || !lookup.email) {
      setQuotationDeliveryStatus('invalid');
      setCustomerValidationError(lookup.validationError || 'Customer account has no verified registered email address.');
      return;
    }

    setCustomerEmail(lookup.email);
    setIsCustomerRegistered(true);
    setQuotationDeliveryStatus('preparing');

    // Step 2: Trigger automated quotation creation, PDF generation & email transmission
    try {
      const result = await createAndAutomateQuotationEmail({
        requestId: request.id,
        customerId: request.customerId,
        customerName: request.customerName,
        destinationCity: request.destinationCity,
        destinationCountry: request.destinationCountry,
        items: products.map((p) => ({
          id: p.id,
          name: p.name,
          store: p.store,
          specs: p.specs,
          priceINR: p.priceINR,
          qty: p.qty,
          totalINR: p.totalINR || p.priceINR * p.qty,
        })),
        costSummary: {
          productCost: productSubtotal,
          domesticShipping: domesticShippingCost,
          serviceFee: serviceFeeCost,
          tax: taxCost,
          discount: discountCost,
          total: totalQuotationAmount,
        },
      });

      setCurrentQuotation(result.quotation);
      if (result.emailSuccess) {
        setQuotationDeliveryStatus('sent');
        setDeliveryLog(result.deliveryLog);
        setQuotationCreated(true);
        triggerToast(`Quotation ${quotationNumber} generated & automatically emailed to ${lookup.email}!`);
      } else {
        setQuotationDeliveryStatus('failed');
        setDeliveryLog(result.message);
      }
    } catch (err: any) {
      setQuotationDeliveryStatus('failed');
      setDeliveryLog(err?.message || 'Email delivery failed. Please retry.');
    }
  };

  const handleRetryQuotationEmail = async () => {
    setQuotationDeliveryStatus('preparing');
    try {
      const result = await retryQuotationEmail(request.id);
      if (result.success && result.quotation) {
        setCurrentQuotation(result.quotation);
        setQuotationDeliveryStatus('sent');
        setDeliveryLog(result.quotation.emailDeliveryLog || '');
        setQuotationCreated(true);
        triggerToast(`Quotation email delivered to ${result.quotation.customerEmail}!`);
      } else {
        setQuotationDeliveryStatus('failed');
        setDeliveryLog(result.message);
      }
    } catch (err: any) {
      setQuotationDeliveryStatus('failed');
      setDeliveryLog(err?.message || 'Email retry failed.');
    }
  };

  useEffect(() => {
    if (initialOpenModal === 'quotation') {
      handleOpenCreateQuotation();
    }
  }, []);

  const handleDownloadQuotationPDF = () => {
    if (currentQuotation) {
      downloadQuotationPdf(currentQuotation);
      triggerToast(`Quotation PDF (${currentQuotation.quotationNumber}) downloaded successfully!`);
      return;
    }

    const tempQuote: CustomerQuotationRecord = {
      id: quotationNumber,
      quotationNumber,
      requestId: request.id,
      customerId: request.customerId,
      customerName: request.customerName,
      customerEmail: customerEmail || 'customer@example.com',
      customerPhone: customerPhone,
      destinationCity: request.destinationCity,
      destinationCountry: request.destinationCountry,
      items: products.map((p) => ({
        id: String(p.id),
        title: p.name,
        store: p.store,
        price: p.priceINR,
        qty: p.qty,
        total: p.totalINR || p.priceINR * p.qty,
      })),
      subtotalINR: productSubtotal,
      domesticShippingINR: domesticShippingCost,
      serviceFeeINR: serviceFeeCost,
      taxINR: taxCost,
      discountINR: discountCost,
      totalINR: totalQuotationAmount,
      createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      validUntil: new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      emailStatus: quotationDeliveryStatus === 'sent' ? 'Sent' : 'Pending',
      emailDeliveryLog: deliveryLog,
      emailAttemptCount: 1,
    };
    downloadQuotationPdf(tempQuote);
    triggerToast(`Quotation PDF (${quotationNumber}) downloaded successfully!`);
  };

  const generateInvoiceHtml = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>India2World Quotation Invoice - ${request.id}</title>
  <style>
    @media print {
      @page { size: A4; margin: 15mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 24px; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #0066FF; }
    .logo-badge { background: #0066FF; color: white; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 20px; display: inline-block; }
    .invoice-title { font-size: 22px; font-weight: 800; color: #0B1933; text-align: right; }
    .inv-meta { font-size: 13px; color: #64748b; margin-top: 4px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; }
    .info-title { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px; margin-bottom: 8px; }
    .info-value { font-size: 14px; font-weight: 600; color: #0f172a; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    th { background: #0B1933; color: white; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #334155; }
    tr:nth-child(even) { background: #f8fafc; }
    .totals-area { display: flex; justify-content: flex-end; margin-top: 20px; }
    .totals-table { width: 320px; border: none; }
    .totals-table td { padding: 6px 12px; border: none; }
    .totals-table .grand-total { font-size: 16px; font-weight: 800; color: #0066FF; border-top: 2px solid #0066FF; padding-top: 10px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #e0f2fe; color: #0369a1; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo-badge">INDIA 2 WORLD</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Global Assisted Purchase & Package Forwarding</div>
      <div style="font-size: 11px; color: #94a3b8;">GSTIN: 07AAAAA0000A1Z5 | IEC: 0510000000</div>
    </div>
    <div>
      <div class="invoice-title">OFFICIAL QUOTATION INVOICE</div>
      <div class="inv-meta"><strong>Quote Ref:</strong> QTE-${request.id}</div>
      <div class="inv-meta"><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
      <div class="inv-meta"><strong>Valid Until:</strong> ${new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-card">
      <div class="info-title">Bill To (Customer)</div>
      <div class="info-value">${request.customerName}</div>
      <div style="font-size: 13px; color: #64748b;">Customer ID: ${request.customerId}</div>
      <div style="font-size: 13px; color: #64748b;">Destination: ${request.destinationCity || 'Dubai'}, ${request.destinationCountry}</div>
      <div style="font-size: 13px; color: #1e293b; margin-top: 4px;">Email: <strong>${customerEmail}</strong></div>
      <div style="font-size: 13px; color: #1e293b;">Phone: <strong>${customerPhone}</strong></div>
      <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">Source Request: ${request.id}</div>
    </div>
    <div class="info-card">
      <div class="info-title">Warehouse & Dispatch Hub</div>
      <div class="info-value">India2World Central Processing Hub</div>
      <div style="font-size: 13px; color: #64748b;">Plot 42, Udyog Vihar Phase 4</div>
      <div style="font-size: 13px; color: #64748b;">Gurugram, Haryana - 122016, India</div>
      <div style="font-size: 13px; color: #64748b;">support@india2world.com | +91 98765 43210</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 45%;">Item Description</th>
        <th style="width: 15%;">Store / Seller</th>
        <th style="width: 10%; text-align: center;">Qty</th>
        <th style="width: 12%; text-align: right;">Unit Price</th>
        <th style="width: 13%; text-align: right;">Total (INR)</th>
      </tr>
    </thead>
    <tbody>
      ${products
        .map(
          (p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>
            <strong>${p.name}</strong>
            <div style="font-size: 11px; color: #64748b;">Specs: ${p.specs || 'Standard'} | Status: ${p.status}</div>
          </td>
          <td><span class="badge">${p.store}</span></td>
          <td style="text-align: center;">${p.qty}</td>
          <td style="text-align: right;">₹${p.priceINR.toLocaleString('en-IN')}</td>
          <td style="text-align: right; font-weight: 600;">₹${p.totalINR.toLocaleString('en-IN')}</td>
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
        <td style="text-align: right; font-weight: 600;">₹${request.costSummary.productCost.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td style="color: #64748b;">Domestic Shipping:</td>
        <td style="text-align: right; font-weight: 600;">₹${request.costSummary.domesticShipping.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td style="color: #64748b;">Procurement & Service Fee:</td>
        <td style="text-align: right; font-weight: 600;">₹${request.costSummary.serviceFee.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td style="color: #64748b;">Estimated Customs & Tax:</td>
        <td style="text-align: right; font-weight: 600;">₹${request.costSummary.tax.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td class="grand-total">Total Quotation:</td>
        <td class="grand-total" style="text-align: right;">₹${request.costSummary.total.toLocaleString('en-IN')}</td>
      </tr>
    </table>
  </div>

  <div style="margin-top: 24px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #166534; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
    <span>Customer Notification Channel: Email: <strong>${customerEmail}</strong></span>
    <span>Status: <strong>Quotation Generated & Dispatched</strong></span>
  </div>

  <div style="margin-top: 20px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #1e40af;">
    <strong>Next Step for Customer:</strong> Once approved, proceed to pay ₹${request.costSummary.total.toLocaleString('en-IN')} securely via Payment Gateway or International Wire Transfer. Our warehouse team will procure items within 24 hours of payment clearance.
  </div>

  <div class="footer">
    <p>Thank you for choosing <strong>India2World</strong>. Fast, Secure, and Reliable International Parcel Delivery.</p>
    <p>This is a computer-generated quotation document. No signature required.</p>
  </div>
</body>
</html>`;
  };

  const handleDownloadInvoicePDF = () => {
    const invoiceHtml = generateInvoiceHtml();
    const blob = new Blob([invoiceHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `India2World_Quotation_Invoice_${request.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    triggerToast(`Quotation Invoice downloaded! Ready to share with ${customerEmail}`);
  };

  const handlePrintInvoice = () => {
    const invoiceHtml = generateInvoiceHtml();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 350);
    }
  };

  const handleShareEmail = () => {
    const subject = `Official Quotation & Invoice: QTE-${request.id} — India2World`;
    const body =
      `Dear ${request.customerName},\n\n` +
      `Thank you for using India2World Global Assisted Purchase & Package Forwarding.\n\n` +
      `Your purchase request #${request.id} has been processed and verified by our operations team. Below is your detailed quotation breakdown:\n\n` +
      `==================================================\n` +
      `OFFICIAL PRO-FORMA QUOTATION INVOICE\n` +
      `Quote Reference: QTE-${request.id}\n` +
      `Customer ID: ${request.customerId}\n` +
      `Destination: ${request.destinationCity || 'Dubai'}, ${request.destinationCountry}\n` +
      `Validity: 7 Days from issue date\n` +
      `==================================================\n\n` +
      `ITEMIZED PRODUCTS (${products.length} Items):\n` +
      products
        .map(
          (p, i) =>
            `${i + 1}. ${p.name} [${p.store}] - ${p.specs || 'Standard'} | Qty: ${p.qty} | Unit: INR ${p.priceINR.toLocaleString('en-IN')} | Total: INR ${p.totalINR.toLocaleString('en-IN')}`
        )
        .join('\n') +
      `\n\n` +
      `FINANCIAL SUMMARY:\n` +
      `- Product Cost: INR ${request.costSummary.productCost.toLocaleString('en-IN')}\n` +
      `- Domestic Shipping: INR ${request.costSummary.domesticShipping.toLocaleString('en-IN')}\n` +
      `- Warehouse Inspection & Service Fee: INR ${request.costSummary.serviceFee.toLocaleString('en-IN')}\n` +
      `- Estimated International Customs/Tax: INR ${request.costSummary.tax.toLocaleString('en-IN')}\n` +
      `--------------------------------------------------\n` +
      `TOTAL PAYABLE: INR ${request.costSummary.total.toLocaleString('en-IN')}\n` +
      `--------------------------------------------------\n\n` +
      `NEXT STEPS:\n` +
      `You can review the invoice and complete payment via international card or wire transfer at:\n` +
      `https://india2world.com/#/dashboard\n\n` +
      `Upon receipt of payment, our procurement team will purchase your products within 24 hours.\n\n` +
      `Need assistance? Reply directly to this email or contact support@india2world.com.\n\n` +
      `Best regards,\n` +
      `India2World Operations Desk\n` +
      `Plot 42, Udyog Vihar Phase 4, Gurugram, India`;

    const mailtoUrl = `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    triggerToast(`Email draft opened for ${customerEmail} with invoice details!`);
  };

  const handleUpdateProductStatus = (id: number, newStatus: AdminProductItem['status']) => {
    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const getProductStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Pending Review':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Price Changed':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Restricted':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Plus_Jakarta_Sans',sans-serif] overflow-x-hidden">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#0066FF] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Purchase Requests</span>
        </button>
      </div>

      {/* Main Container Card matching screenshot 2 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-8 space-y-6 overflow-hidden">
        {/* Title & Status Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3.5">
            <h1 className="text-xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
              Purchase Request
            </h1>
            <span className="text-xl sm:text-3xl font-extrabold text-slate-400">
              {request.id}
            </span>
          </div>

          <span
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-xl border ${
              isRestricted
                ? 'bg-red-100 text-red-800 border-red-200'
                : 'bg-amber-100/90 text-amber-800 border-amber-200'
            }`}
          >
            {isRestricted ? 'Restricted Item Flagged' : request.status}
          </span>
        </div>

        {/* Top Meta Details Box (Customer, Destination, Submitted On) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
          {/* Customer */}
          <div className="flex items-center gap-3.5">
            <img
              src={request.customerAvatar}
              alt={request.customerName}
              className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Customer
              </span>
              <span className="text-sm font-bold text-[#0B1933] block">
                {request.customerName}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {request.customerId}
              </span>
            </div>
          </div>

          {/* Destination */}
          <div className="flex items-center gap-3.5 md:border-l md:border-slate-200/80 md:pl-6">
            <div className="w-10 h-7 rounded-sm overflow-hidden shadow-2xs border border-slate-200 flex items-center justify-center shrink-0 bg-white">
              {/* UAE Flag representation */}
              <div className="flex h-full w-full">
                <div className="w-1/3 bg-red-600 h-full" />
                <div className="w-2/3 flex flex-col h-full">
                  <div className="h-1/3 bg-emerald-600" />
                  <div className="h-1/3 bg-white" />
                  <div className="h-1/3 bg-black" />
                </div>
              </div>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Destination
              </span>
              <span className="text-sm font-bold text-[#0B1933] block">
                {request.destinationCountry}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {request.destinationCity}
              </span>
            </div>
          </div>

          {/* Submitted On */}
          <div className="flex items-center gap-3.5 md:border-l md:border-slate-200/80 md:pl-6">
            <div className="w-10 h-10 rounded-xl bg-slate-200/70 flex items-center justify-center shrink-0 text-slate-600">
              <Calendar className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Submitted On
              </span>
              <span className="text-sm font-bold text-[#0B1933] block">
                {request.submittedAt}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                ({request.submittedAgo})
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs matching screenshot 2 */}
        <div className="border-b border-slate-200 flex gap-6 sm:gap-8 overflow-x-auto text-sm font-bold">
          {[
            { id: 'products', label: `Products (${products.length})` },
            { id: 'quotation', label: 'Quotation' },
            { id: 'payments', label: 'Payments' },
            { id: 'packages', label: 'Packages' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'notes', label: 'Notes' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3.5 cursor-pointer transition-colors relative whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-[#0066FF] border-b-2 border-[#0066FF]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Products Table */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="overflow-x-auto w-full max-w-full">
              <table className="w-full text-left text-xs sm:text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                    <th className="pb-3 w-8">#</th>
                    <th className="pb-3 w-16">Product</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Price (INR)</th>
                    <th className="pb-3 text-center">Qty</th>
                    <th className="pb-3">Total (INR)</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 w-10 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 text-slate-400 font-bold">{item.id}</td>
                      <td className="py-4">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200"
                        />
                      </td>
                      <td className="py-4 pr-4">
                        <div className="font-bold text-slate-800 text-sm">{item.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700">
                            {item.store}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{item.specs}</span>
                        </div>
                      </td>
                      <td className="py-4 font-bold text-slate-800">
                        ₹{item.priceINR.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 text-center font-bold text-slate-700">
                        {item.qty}
                      </td>
                      <td className="py-4 font-bold text-[#0B1933]">
                        ₹{item.totalINR.toLocaleString('en-IN')}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg border ${getProductStatusBadge(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="relative group inline-block">
                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <div className="hidden group-hover:block absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-10 text-xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateProductStatus(item.id, 'Approved')}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-emerald-700 font-semibold cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateProductStatus(item.id, 'Price Changed')}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-amber-700 font-semibold cursor-pointer"
                            >
                              Price Changed
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateProductStatus(item.id, 'Restricted')}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-red-600 font-semibold cursor-pointer"
                            >
                              Mark Restricted
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total (INR) Cost Summary Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <h3 className="text-sm font-extrabold text-[#0B1933] uppercase tracking-wider mb-4">
                Total (INR)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Left breakdown */}
                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Product Cost</span>
                    <span className="font-bold text-slate-800">
                      ₹{request.costSummary.productCost.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Domestic Shipping</span>
                    <span className="font-bold text-slate-800">
                      ₹{request.costSummary.domesticShipping.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Service Fee</span>
                    <span className="font-bold text-slate-800">
                      ₹{request.costSummary.serviceFee.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Right breakdown + Highlighted Total */}
                <div className="space-y-2.5 text-xs sm:text-sm md:border-l md:border-slate-200 md:pl-8">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tax (if applicable)</span>
                    <span className="font-bold text-slate-800">
                      ₹{request.costSummary.tax.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Discount</span>
                    <span className="font-bold text-slate-800">
                      - ₹{request.costSummary.discount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Total Highlight Pill */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/80 border border-blue-100 text-[#0B1933]">
                      <span className="text-base font-extrabold text-[#0B1933]">Total</span>
                      <span className="text-xl sm:text-2xl font-black text-[#0066FF]">
                        ₹{request.costSummary.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button
                type="button"
                onClick={() => {
                  const res = confirmPurchaseOrderAndEmailInvoice(request.id);
                  if (res.success && res.invoice) {
                    triggerToast(`✅ Order confirmed! Official invoice ${res.invoice.invoiceNumber} automatically sent to ${res.customerEmail}.`);
                    setQuotationCreated(true);
                    setInvoiceModalOpen(true);
                  } else {
                    triggerToast(res.message || 'Failed to confirm order.');
                  }
                }}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Order & Send Invoice</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreateQuotation}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <FileCheck className="w-4 h-4" />
                <span>Create Quotation</span>
              </button>

              <button
                type="button"
                onClick={() => setRestrictedModalOpen(true)}
                className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-white hover:bg-red-50 text-red-600 font-bold text-sm border-2 border-red-500/80 transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <Ban className="w-4 h-4" />
                <span>Mark as Restricted</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Quotation */}
        {activeTab === 'quotation' && (
          <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-slate-200">
            <FileCheck className="w-12 h-12 text-[#0066FF] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#0B1933]">
              {quotationCreated ? 'Quotation Issued & Active' : 'Quotation Management'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              {quotationCreated
                ? `Official pro-forma quotation QTE-${request.id} has been generated and dispatched to ${request.customerName} (${customerEmail}).`
                : 'Formal quotation with domestic transport, inspection fee, and international air shipping breakdown.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleOpenCreateQuotation}
                className="px-5 py-2.5 bg-[#0066FF] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#0052cc] cursor-pointer flex items-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>{quotationCreated ? 'View / Manage Quotation' : 'Create Quotation'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInvoiceModalOpen(true);
                }}
                className="px-5 py-2.5 bg-white text-slate-700 font-bold text-xs rounded-xl border border-slate-300 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-[#0066FF]" />
                <span>Preview Invoice</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadQuotationPDF}
                className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-700 cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Invoice (PDF)</span>
              </button>
            </div>
          </div>
        )}

        {/* Other Tabs */}
        {activeTab === 'payments' && (
          <div className="p-6 bg-slate-50/60 rounded-2xl border border-slate-200 text-xs">
            <h4 className="font-bold text-slate-800 text-sm mb-2">Payment Status</h4>
            <p className="text-slate-500">Status: Awaiting customer authorization via Card / Bank Transfer for ₹8,245.</p>
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="p-6 bg-slate-50/60 rounded-2xl border border-slate-200 text-xs">
            <h4 className="font-bold text-slate-800 text-sm mb-2">Associated Warehouse Packages</h4>
            <p className="text-slate-500">3 packages scheduled to arrive from Amazon, Myntra, and Flipkart.</p>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="p-6 bg-slate-50/60 rounded-2xl border border-slate-200 text-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-[#0066FF]" />
              <span className="font-bold">5 Nov 2024, 10:30 AM:</span> Customer submitted purchase request.
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-bold">5 Nov 2024, 11:00 AM:</span> Assigned to Operations Desk (Under Review).
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="p-6 bg-slate-50/60 rounded-2xl border border-slate-200 text-xs">
            <textarea
              placeholder="Internal staff notes regarding seller stock, customs clearance, or customer preferences..."
              rows={4}
              className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF]"
              defaultValue="Customer requested double bubble wrap on Kurta set and checked that books have no water damage."
            />
            <button className="mt-2 px-4 py-2 bg-slate-800 text-white font-bold rounded-lg cursor-pointer">
              Save Staff Note
            </button>
          </div>
        )}
      </div>

      {/* Create Quotation Modal */}
      {quotationModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative bg-white rounded-2xl sm:rounded-3xl w-full max-w-[calc(100vw-1.5rem)] sm:max-w-lg p-5 sm:p-8 shadow-2xl border border-slate-100 min-w-0 my-auto">
            <div className="flex items-start justify-between mb-1.5">
              <h3 className="text-lg sm:text-xl font-bold text-[#0B1933]">Create Customer Quotation</h3>
              <button
                type="button"
                onClick={() => setQuotationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Review and finalize the pricing breakdown for {request.customerName} ({request.id}).
            </p>

            {/* Pricing Breakdown Card matching Screenshot */}
            <div className="space-y-3 text-xs sm:text-sm mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Product Items ({products.length})</span>
                <span className="font-bold text-slate-800">₹{productSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Domestic Shipping</span>
                <span className="font-bold text-slate-800">₹{domesticShippingCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Handling & Service Fee</span>
                <span className="font-bold text-slate-800">₹{serviceFeeCost.toLocaleString('en-IN')}</span>
              </div>
              {taxCost > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Applicable Taxes</span>
                  <span className="font-bold text-slate-800">₹{taxCost.toLocaleString('en-IN')}</span>
                </div>
              )}
              {discountCost > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="font-bold">-₹{discountCost.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-base text-[#0B1933]">
                <span>Total Quotation</span>
                <span className="text-[#0066FF]">₹{totalQuotationAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Registered Customer Email & Delivery Status */}
            <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-xl border border-slate-200 mb-5 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Customer Email & Dispatch Status</span>
                </span>
                {isCustomerRegistered ? (
                  <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified Registered Account</span>
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-[11px] font-semibold text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Unregistered Account</span>
                  </span>
                )}
              </div>

              {/* Email channel & Live Delivery Status */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Registered Customer Email</div>
                      <div className="font-semibold text-slate-800 text-xs sm:text-sm truncate">
                        {customerEmail || (
                          <span className="text-red-500 italic font-normal">No registered email address found</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delivery Status Badge / Retry Action */}
                  <div className="shrink-0">
                    {quotationDeliveryStatus === 'preparing' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                        <span>Preparing Email...</span>
                      </span>
                    )}

                    {quotationDeliveryStatus === 'sent' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Email Sent</span>
                      </span>
                    )}

                    {quotationDeliveryStatus === 'failed' && (
                      <button
                        type="button"
                        onClick={handleRetryQuotationEmail}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 cursor-pointer transition-colors"
                        title="Retry sending quotation email"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-red-600" />
                        <span>Email Failed — Retry</span>
                      </button>
                    )}

                    {quotationDeliveryStatus === 'invalid' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>Invalid Email</span>
                      </span>
                    )}

                    {quotationDeliveryStatus === 'idle' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Preparing Email...</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Subtext Details */}
                {quotationDeliveryStatus === 'sent' && (
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-emerald-800 bg-emerald-50/50 rounded-md p-2 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold">Quotation PDF automatically emailed to recipient.</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Subject: Your India2World Quotation – {currentQuotation?.quotationNumber || quotationNumber} • Gateway: Sandbox SMTP (250 OK)
                      </div>
                    </div>
                  </div>
                )}

                {quotationDeliveryStatus === 'failed' && (
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-red-800 bg-red-50/50 rounded-md p-2 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold">Email dispatch failed:</div>
                      <div className="text-[10px] text-red-600 mt-0.5">
                        {deliveryLog || 'SMTP delivery timed out. Click "Email Failed — Retry" to resend.'}
                      </div>
                    </div>
                  </div>
                )}

                {quotationDeliveryStatus === 'invalid' && (
                  <div className="pt-2 border-t border-slate-100 text-[11px] text-red-800 bg-red-50/50 rounded-md p-2 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold">Automatic email sending halted:</div>
                      <div className="text-[10px] text-red-600 mt-0.5">
                        {customerValidationError || 'Customer does not have a verified registered email address. Automatic dispatch cannot proceed without authenticated recipient verification.'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Controls: Cancel, Download PDF, and Retry (if failed) */}
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setQuotationModalOpen(false)}
                className="w-full sm:w-auto py-2.5 sm:py-3 px-5 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleDownloadQuotationPDF}
                className="w-full sm:flex-1 py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-[0.99]"
                title="Download Quotation PDF"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Download Invoice (PDF)</span>
              </button>

              {quotationDeliveryStatus === 'failed' && (
                <button
                  type="button"
                  onClick={handleRetryQuotationEmail}
                  className="w-full sm:w-auto py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs active:scale-[0.99]"
                  title="Retry sending email to customer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Retry Email</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quotation Invoice Preview & PDF Modal */}
      {invoiceModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative bg-white rounded-2xl sm:rounded-3xl w-full max-w-[calc(100vw-1.5rem)] sm:max-w-2xl p-4 sm:p-8 shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto min-w-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200 shrink-0 gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-100 text-[#0066FF] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-base font-bold text-[#0B1933] truncate">
                    Quotation QTE-{request.id}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                    Pro-Forma Quotation • {request.customerName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleShareEmail}
                  className="hidden md:flex px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl items-center gap-1 shadow-xs cursor-pointer transition-colors shrink-0"
                  title={`Share via Email (${customerEmail})`}
                >
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>Email</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="hidden md:flex px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl items-center gap-1.5 cursor-pointer transition-colors"
                  title="Print or Save as PDF"
                >
                  <Printer className="w-4 h-4 shrink-0" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadInvoicePDF}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] rounded-xl flex items-center gap-1 shadow-xs cursor-pointer transition-colors shrink-0"
                  title="Download Invoice PDF"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="hidden sm:inline">Download Invoice (PDF)</span>
                  <span className="sm:hidden text-[11px]">PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceModalOpen(false)}
                  className="p-1 sm:p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Sheet Body (Scrollable A4 preview) */}
            <div
              style={{ minWidth: 0, maxWidth: '100%' }}
              className="overflow-y-auto py-4 sm:py-6 px-0.5 sm:px-1 space-y-4 sm:space-y-6 text-slate-800 min-w-0 w-full"
            >
              {/* Paper Card */}
              <div className="bg-slate-50/60 p-3 sm:p-8 rounded-2xl border border-slate-200/90 shadow-inner min-w-0 w-full overflow-hidden">
                {/* Invoice Top Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-[#0066FF] gap-4">
                  <div>
                    <div className="inline-block bg-[#0066FF] text-white px-3.5 py-1.5 rounded-lg font-black text-lg tracking-wide">
                      INDIA 2 WORLD
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 font-medium">
                      Global Assisted Purchase & Package Forwarding
                    </p>
                    <p className="text-[11px] text-slate-400">
                      GSTIN: 07AAAAA0000A1Z5 | IEC: 0510000000
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="inline-block px-2.5 py-1 text-[11px] font-bold bg-blue-100 text-blue-800 rounded-md uppercase tracking-wider mb-1">
                      Official Quotation
                    </span>
                    <div className="text-xs font-bold text-slate-800">
                      Quote Ref: QTE-{request.id}
                    </div>
                    <div className="text-xs text-slate-500">
                      Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-slate-500">
                      Valid Until: {new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Bill To & Dispatch Hub info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
                  <div className="p-4 bg-white rounded-xl border border-slate-200/80">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Bill To (Customer)
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{request.customerName}</div>
                    <div className="text-xs text-slate-500">Customer ID: {request.customerId}</div>
                    <div className="text-xs text-slate-500">
                      Destination: {request.destinationCity || 'Dubai'}, {request.destinationCountry}
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                      <span className="font-medium truncate">{customerEmail}</span>
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-medium">{customerPhone}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">Source Request: {request.id}</div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200/80">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                      Warehouse & Dispatch Hub
                    </div>
                    <div className="font-bold text-slate-900 text-sm">
                      India2World Central Processing Hub
                    </div>
                    <div className="text-xs text-slate-500">Plot 42, Udyog Vihar Phase 4</div>
                    <div className="text-xs text-slate-500">Gurugram, Haryana - 122016, India</div>
                    <div className="text-xs text-slate-500">support@india2world.com | +91 98765 43210</div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white w-full min-w-0 max-w-full">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="bg-[#0B1933] text-white uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Item Description</th>
                        <th className="p-3">Seller</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p, i) => (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="p-3 text-slate-400">{i + 1}</td>
                          <td className="p-3 font-semibold text-slate-800">
                            {p.name}
                            <div className="text-[10px] text-slate-400 font-normal">
                              Specs: {p.specs || 'Standard'} • {p.status}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-md">
                              {p.store}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-700">{p.qty}</td>
                          <td className="p-3 text-right text-slate-600">₹{p.priceINR.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            ₹{p.totalINR.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals Breakdown */}
                <div className="flex justify-end mt-4">
                  <div className="w-full sm:w-80 space-y-2 text-xs bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between text-slate-600">
                      <span>Products Subtotal:</span>
                      <span className="font-semibold text-slate-800">
                        ₹{request.costSummary.productCost.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Domestic Shipping:</span>
                      <span className="font-semibold text-slate-800">
                        ₹{request.costSummary.domesticShipping.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Procurement & Service Fee:</span>
                      <span className="font-semibold text-slate-800">
                        ₹{request.costSummary.serviceFee.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Estimated Customs & Tax:</span>
                      <span className="font-semibold text-slate-800">
                        ₹{request.costSummary.tax.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-[#0B1933]">
                      <span>Total Quotation:</span>
                      <span className="text-[#0066FF] font-extrabold text-base">
                        ₹{request.costSummary.total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footnote */}
                <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-[11px] text-blue-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0066FF] shrink-0" />
                  <span>
                    Quotation officially generated and notified to customer dashboard. Customer can complete payment via international card or wire transfer.
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Bottom Footer Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 min-w-0">
              <div className="text-[11px] sm:text-xs text-slate-500 truncate min-w-0">
                Customer: <span className="font-semibold text-slate-700">{customerEmail}</span> • <span className="font-semibold text-slate-700">{customerPhone}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleShareEmail}
                  className="flex-1 sm:flex-initial px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  title={`Share via Email (${customerEmail})`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadInvoicePDF}
                  className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Invoice (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceModalOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark Restricted Modal */}
      {restrictedModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="relative bg-white rounded-2xl sm:rounded-3xl w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md p-6 shadow-2xl border border-slate-100 min-w-0 my-auto">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#0B1933] mb-2">Flag Request as Restricted?</h3>
            <p className="text-xs text-slate-500 mb-6">
              This will notify the customer that one or more products violate international air customs guidelines (e.g. hazardous materials, perfumes, lithium batteries).
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRestrictedModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRestricted(true);
                  setRestrictedModalOpen(false);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl cursor-pointer"
              >
                Confirm Restricted
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
