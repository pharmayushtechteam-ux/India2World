import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Download,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  X,
  Mail,
  Building,
  User,
  ArrowRight,
  Printer,
  ChevronRight,
  Check,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Key,
  Edit2,
  Info,
  Trash2,
} from 'lucide-react';
import { AdminTab } from '../../types/admin';
import {
  getAllPurchaseRequests,
  getAllCustomers,
  confirmPurchaseOrderAndEmailInvoice,
  savePurchaseRequests,
  saveCustomers,
  DATA_SYNC_EVENT,
} from '../../services/integratedDataService';
import {
  getAllInvoices,
  lookupRegisteredCustomer,
  downloadInvoiceDocument,
  printInvoiceDocument,
  resendInvoiceEmail,
  updateInvoiceCustomerEmail,
  CustomerOrderInvoice,
} from '../../services/orderInvoiceService';

export interface QuotationRecord {
  id: string; // QTE-XXXXX
  requestId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAvatar: string;
  destination: string;
  destinationFlag: string;
  productCount: number;
  productCostINR: number;
  serviceFeeINR: number;
  shippingEstINR: number;
  totalINR: number;
  createdAt: string;
  validUntil: string;
  status: 'Pending Quotation' | 'Pending Approval' | 'Accepted' | 'Expired';
  rawRequestStatus: string;
  itemsSummary: string;
  invoiceId?: string;
  invoiceSentTo?: string;
  emailStatus?: 'Sent' | 'Failed' | 'Pending';
  emailSentAt?: string;
  emailDeliveryLog?: string;
  products?: Array<{
    id: number | string;
    name: string;
    store: string;
    specs?: string;
    imageUrl?: string;
    priceINR: number;
    qty: number;
    totalINR: number;
  }>;
}

const INITIAL_QUOTATIONS: QuotationRecord[] = [
  {
    id: 'QTE-10492',
    requestId: 'REQ-20482',
    customerId: 'CUS-10028',
    customerName: 'Priya Sharma',
    customerEmail: 'priya.sharma@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    destination: 'Dubai, UAE',
    destinationFlag: '🇦🇪',
    productCount: 4,
    productCostINR: 7395,
    serviceFeeINR: 500,
    shippingEstINR: 2350,
    totalINR: 10245,
    createdAt: '12 Nov 2024',
    validUntil: '15 Nov 2024',
    status: 'Pending Approval',
    rawRequestStatus: 'Under Review',
    itemsSummary: 'Nike Shoes (Size 9) + Myntra Kurta Set + Flipkart Water Bottle',
  },
  {
    id: 'QTE-10491',
    requestId: 'REQ-30481',
    customerId: 'CUS-10042',
    customerName: 'Rahul Mehta',
    customerEmail: 'rahul.mehta@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    destination: 'San Francisco, USA',
    destinationFlag: '🇺🇸',
    productCount: 2,
    productCostINR: 8000,
    serviceFeeINR: 740,
    shippingEstINR: 3800,
    totalINR: 12540,
    createdAt: '11 Nov 2024',
    validUntil: '14 Nov 2024',
    status: 'Accepted',
    rawRequestStatus: 'Quote Ready',
    itemsSummary: 'FabIndia Silk Kurta + Traditional Brass Diya Set',
    invoiceId: 'INV-2026-90240',
    invoiceSentTo: 'rahul.mehta@example.com',
  },
  {
    id: 'QTE-10490',
    requestId: 'REQ-30480',
    customerId: 'CUS-10019',
    customerName: 'Aaylal Verma',
    customerEmail: 'aaylal.v@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    destination: 'London, UK',
    destinationFlag: '🇬🇧',
    productCount: 3,
    productCostINR: 7800,
    serviceFeeINR: 700,
    shippingEstINR: 2950,
    totalINR: 11450,
    createdAt: '10 Nov 2024',
    validUntil: '13 Nov 2024',
    status: 'Pending Approval',
    rawRequestStatus: 'Awaiting Payment',
    itemsSummary: 'Ayurvedic Skincare Hamper x3 (Kama Ayurveda)',
  },
  {
    id: 'QTE-10489',
    requestId: 'REQ-30478',
    customerId: 'CUS-10012',
    customerName: 'Sneha Patel',
    customerEmail: 'sneha.p@example.com',
    customerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    destination: 'Toronto, Canada',
    destinationFlag: '🇨🇦',
    productCount: 5,
    productCostINR: 22000,
    serviceFeeINR: 2000,
    shippingEstINR: 5200,
    totalINR: 29200,
    createdAt: '08 Nov 2024',
    validUntil: '11 Nov 2024',
    status: 'Expired',
    rawRequestStatus: 'Submitted',
    itemsSummary: 'Designer Bridal Lehenga Set + Artificial Kundan Jewellery',
  },
];

const buildQuotationsList = (): QuotationRecord[] => {
  const requests = getAllPurchaseRequests();
  const invoices = getAllInvoices();
  const customers = getAllCustomers();

  const list: QuotationRecord[] = [];
  const processedRequestIds = new Set<string>();

  // Process all live customer purchase requests (includes all newly created orders/requests)
  requests.forEach((req) => {
    if (!req || !req.id || req.id === 'REQ-30482') return;
    const quoteId = `QTE-${req.id.replace('REQ-', '')}`;
    if (processedRequestIds.has(req.id) || list.some((existing) => existing.id === quoteId)) {
      return;
    }
    processedRequestIds.add(req.id);

    const orderId = `ORD-${req.id.replace('REQ-', '')}`;
    const linkedInvoice = invoices.find(
      (inv) => inv.orderId === orderId || inv.orderId === req.id || (inv as any).requestId === req.id
    );

    // Look up customer email strictly and reliably from registered database
    const customerLookup = lookupRegisteredCustomer(req.customerId, req.customerName);
    const matchedCustomer = customers.find(
      (c) =>
        (c.name && c.name.toLowerCase() === req.customerName.toLowerCase()) ||
        c.id === req.customerId ||
        (c.email && (req as any).customerEmail && c.email.toLowerCase() === (req as any).customerEmail.toLowerCase())
    );
    let resolvedEmail = (
      customerLookup.email ||
      matchedCustomer?.email ||
      (req as any).customerEmail ||
      linkedInvoice?.customerEmail ||
      'customer@example.com'
    ).trim().toLowerCase();

    if (req.customerName.toLowerCase() === 'priya sharma' && resolvedEmail === 'john@example.com') {
      resolvedEmail = 'priya.sharma@example.com';
    }

    // Map status:
    // 1. If invoice exists OR request is Purchasing / Purchased -> Accepted & Invoiced
    // 2. If status is Quote Ready or Awaiting Payment -> Pending Approval
    // 3. If Under Review or Submitted -> Pending Quotation (needs quote creation/confirmation)
    const isAccepted =
      Boolean(linkedInvoice) ||
      (req.status as string) === 'Purchasing' ||
      (req.status as string) === 'Purchased';
    const isPendingApproval = req.status === 'Quote Ready' || req.status === 'Awaiting Payment';
    const finalStatus: QuotationRecord['status'] = isAccepted
      ? 'Accepted'
      : isPendingApproval
      ? 'Pending Approval'
      : 'Pending Quotation';

    const dest =
      (req as any).destination ||
      (req.destinationCity ? `${req.destinationCity}, ${req.destinationCountry}` : req.destinationCountry) ||
      'Global';
    const prodCost = req.costSummary?.productCost ?? req.totalAmountINR ?? 0;
    const srvFee = req.costSummary?.serviceFee ?? 500;
    const shipEst = 2350;
    const tot = req.costSummary?.total ?? (prodCost + srvFee + shipEst);

    list.push({
      id: `QTE-${req.id.replace('REQ-', '')}`,
      requestId: req.id,
      customerId: req.customerId,
      customerName: req.customerName,
      customerEmail: resolvedEmail,
      customerAvatar:
        req.customerAvatar ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(req.customerName)}&backgroundColor=0066FF`,
      destination: dest,
      destinationFlag: (req as any).destinationFlag || '🌍',
      productCount: req.itemsCount || req.products?.length || 1,
      productCostINR: prodCost,
      serviceFeeINR: srvFee,
      shippingEstINR: shipEst,
      totalINR: tot,
      createdAt: req.submittedAt || (req as any).date || 'Today',
      validUntil: 'In 3 days',
      status: finalStatus,
      rawRequestStatus: req.status,
      itemsSummary: req.products && req.products.length > 0 ? req.products.map((p) => p.name).join(' + ') : 'Assisted Purchase Items',
      invoiceId: linkedInvoice?.invoiceNumber || (isAccepted ? `INV-2026-${req.id.replace('REQ-', '')}` : undefined),
      invoiceSentTo: linkedInvoice?.customerEmail || (isAccepted ? resolvedEmail : undefined),
      emailStatus: linkedInvoice?.emailStatus || (isAccepted ? 'Pending' : 'Pending'),
      emailSentAt: linkedInvoice?.emailSentAt,
      emailDeliveryLog: linkedInvoice?.emailDeliveryLog,
      products: req.products?.map((p, idx) => ({
        id: p.id || idx + 1,
        name: p.name,
        store: p.store,
        specs: p.specs,
        priceINR: p.priceINR,
        qty: p.qty,
        totalINR: p.totalINR || p.priceINR * p.qty,
        imageUrl: p.imageUrl,
      })),
    });
  });

  // Include any seed initial quotations that weren't represented in live requests
  INITIAL_QUOTATIONS.forEach((initQ) => {
    if (!processedRequestIds.has(initQ.requestId)) {
      list.push(initQ);
    }
  });

  return list;
};

export const AdminQuotationsModule: React.FC<{
  onNavigateTab: (tab: AdminTab, params?: any) => void;
}> = ({ onNavigateTab }) => {
  const [quotations, setQuotations] = useState<QuotationRecord[]>(() => buildQuotationsList());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedQuote, setSelectedQuote] = useState<QuotationRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Email correction & live dispatch state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // SMTP Settings modal state
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);
  const [smtpUser, setSmtpUser] = useState('pharmayushtechteam@gmail.com');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpError, setSmtpError] = useState<string | null>(null);
  const [smtpSuccess, setSmtpSuccess] = useState<string | null>(null);
  const [isSmtpConfigured, setIsSmtpConfigured] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/smtp-status')
      .then((r) => r.json())
      .then((data) => {
        setIsSmtpConfigured(Boolean(data.configured));
        if (data.user) setSmtpUser(data.user);
        if (data.host) setSmtpHost(data.host);
        if (data.port) setSmtpPort(data.port);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setQuotations(buildQuotationsList());
    };
    window.addEventListener(DATA_SYNC_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('i2w-invoices-updated', handleUpdate);
    return () => {
      window.removeEventListener(DATA_SYNC_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('i2w-invoices-updated', handleUpdate);
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenQuoteModal = (quote: QuotationRecord) => {
    setSelectedQuote(quote);
    setEditedEmail(quote.customerEmail);
    setIsEditingEmail(false);
  };

  // Handler: Save corrected recipient email
  const handleSaveCorrectedEmail = () => {
    if (!selectedQuote) return;
    const trimmed = editedEmail.trim();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      triggerToast('⚠️ Please enter a valid recipient email address.');
      return;
    }

    // 1. Update invoice if it exists
    if (selectedQuote.invoiceId) {
      updateInvoiceCustomerEmail(selectedQuote.invoiceId, trimmed);
    }

    // 2. Update purchase request in storage
    const requests = getAllPurchaseRequests();
    const rIdx = requests.findIndex((r) => r.id === selectedQuote.requestId);
    if (rIdx >= 0) {
      (requests[rIdx] as any).customerEmail = trimmed;
      savePurchaseRequests([...requests]);
    }

    // 3. Update customer record in storage
    const customers = getAllCustomers();
    const cIdx = customers.findIndex((c) => c.id === selectedQuote.customerId);
    if (cIdx >= 0) {
      customers[cIdx].email = trimmed;
      saveCustomers([...customers]);
    }

    // 4. Update current quote state
    const updatedQuote: QuotationRecord = {
      ...selectedQuote,
      customerEmail: trimmed,
      invoiceSentTo: trimmed,
      emailStatus: 'Pending',
      emailDeliveryLog: `Recipient email updated to ${trimmed}. Ready to dispatch.`,
    };
    setSelectedQuote(updatedQuote);
    setIsEditingEmail(false);
    setQuotations(buildQuotationsList());

    triggerToast(`✅ Recipient email corrected to ${trimmed}! Ready to send.`);
  };

  // Handler: Confirm Order and Automatically Email Invoice to Customer
  const handleConfirmOrder = async (quote: QuotationRecord) => {
    setConfirmingId(quote.id);
    setIsSendingEmail(true);
    try {
      const res = confirmPurchaseOrderAndEmailInvoice(quote.requestId);
      if (res.success && res.invoice) {
        // Also dispatch real email via SMTP
        const targetEmail = isEditingEmail && editedEmail ? editedEmail.trim() : res.customerEmail;
        const sendRes = await resendInvoiceEmail(res.invoice.invoiceNumber, targetEmail);
        if (sendRes.success) {
          triggerToast(
            `✅ Order confirmed! Official invoice ${res.invoice.invoiceNumber} emailed to ${targetEmail}.`
          );
          setIsSmtpConfigured(true);
        } else {
          triggerToast(
            `⚠️ Order confirmed (${res.invoice.invoiceNumber}), but email delivery failed: ${sendRes.error || sendRes.message}.`
          );
          if ((sendRes as any).configMissing) {
            setIsSmtpModalOpen(true);
          }
        }

        const updated = buildQuotationsList();
        setQuotations(updated);
        if (selectedQuote && selectedQuote.id === quote.id) {
          const fresh = updated.find((q) => q.id === quote.id);
          if (fresh) setSelectedQuote({ ...fresh, customerEmail: targetEmail });
        }
      } else {
        triggerToast(res.message || 'Failed to confirm order.');
      }
    } catch (err: any) {
      triggerToast(`Error confirming order: ${err?.message || 'Unknown error'}`);
    } finally {
      setConfirmingId(null);
      setIsSendingEmail(false);
    }
  };

  // Handler: Resend Invoice Email with live SMTP
  const handleResendInvoiceEmail = async (quote: QuotationRecord) => {
    setIsSendingEmail(true);
    const targetEmail = (isEditingEmail && editedEmail ? editedEmail : quote.customerEmail).trim();

    try {
      let invId = quote.invoiceId;
      if (!invId) {
        await handleConfirmOrder(quote);
        return;
      }

      const res = await resendInvoiceEmail(invId, targetEmail);
      if (res.success) {
        triggerToast(`✉️ Official invoice ${invId} successfully emailed to ${targetEmail}!`);
        setIsSmtpConfigured(true);
      } else {
        triggerToast(`❌ Delivery failed: ${res.error || res.message}`);
        if ((res as any).configMissing) {
          setIsSmtpModalOpen(true);
        }
      }

      const freshList = buildQuotationsList();
      setQuotations(freshList);
      const freshQuote = freshList.find((q) => q.id === quote.id);
      if (freshQuote) {
        setSelectedQuote({ ...freshQuote, customerEmail: targetEmail });
      }
    } catch (err: any) {
      triggerToast(`❌ Error sending invoice: ${err.message || 'SMTP delivery failed'}`);
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handler: Save & Test SMTP Configuration
  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpSaving(true);
    setSmtpError(null);
    setSmtpSuccess(null);

    try {
      const res = await fetch('/api/save-smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: smtpUser.trim(),
          pass: smtpPass.trim(),
          host: smtpHost,
          port: smtpPort,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSmtpSuccess(data.message);
        setIsSmtpConfigured(true);
        triggerToast('✅ Gmail SMTP connected and verified successfully!');

        // If a quote was open, automatically trigger live invoice dispatch to customer!
        if (selectedQuote && selectedQuote.invoiceId) {
          setTimeout(() => {
            handleResendInvoiceEmail(selectedQuote);
          }, 600);
        }
        setTimeout(() => {
          setIsSmtpModalOpen(false);
          setSmtpSuccess(null);
        }, 1200);
      } else {
        setSmtpError(data.error || 'Failed to authenticate with Gmail SMTP server.');
      }
    } catch (err: any) {
      setSmtpError(err.message || 'Network error connecting to mail server.');
    } finally {
      setSmtpSaving(false);
    }
  };

  // Handler: Download Invoice Document
  const handleDownloadInvoice = (quote: QuotationRecord) => {
    const invoices = getAllInvoices();
    const inv = invoices.find(
      (i) =>
        i.invoiceNumber === quote.invoiceId ||
        i.id === quote.invoiceId ||
        i.orderId === `ORD-${quote.requestId.replace('REQ-', '')}`
    );
    if (inv) {
      downloadInvoiceDocument(inv);
      triggerToast(`📥 Downloading official invoice ${inv.invoiceNumber} (HTML/PDF)...`);
    } else {
      // Trigger order confirmation to create and download invoice
      handleConfirmOrder(quote);
    }
  };

  // Handler: Print Invoice
  const handlePrintInvoice = (quote: QuotationRecord) => {
    const invoices = getAllInvoices();
    const inv = invoices.find(
      (i) =>
        i.invoiceNumber === quote.invoiceId ||
        i.id === quote.invoiceId ||
        i.orderId === `ORD-${quote.requestId.replace('REQ-', '')}`
    );
    if (inv) {
      printInvoiceDocument(inv);
    } else {
      window.print();
    }
  };

  // Handler: Delete / Purge duplicate or obsolete quotation
  const handleDeleteQuote = (quote: QuotationRecord) => {
    if (confirm(`Remove quotation ${quote.id} (${quote.customerName})?`)) {
      const allReqs = getAllPurchaseRequests().filter((r) => r.id !== quote.requestId);
      savePurchaseRequests(allReqs);
      setQuotations(buildQuotationsList());
      triggerToast(`Removed quotation ${quote.id}.`);
    }
  };

  const filtered = quotations.filter((q) => {
    let matchesStatus = true;
    if (statusFilter === 'Pending Quotation') {
      matchesStatus = q.status === 'Pending Quotation';
    } else if (statusFilter === 'Pending Approval') {
      matchesStatus = q.status === 'Pending Approval';
    } else if (statusFilter === 'Confirmed & Invoiced') {
      matchesStatus = q.status === 'Accepted';
    } else if (statusFilter === 'Expired') {
      matchesStatus = q.status === 'Expired';
    }

    const matchesSearch =
      !search ||
      q.id.toLowerCase().includes(search.toLowerCase()) ||
      q.customerName.toLowerCase().includes(search.toLowerCase()) ||
      q.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      q.requestId.toLowerCase().includes(search.toLowerCase()) ||
      q.destination.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const pendingQuotesCount = quotations.filter((q) => q.status === 'Pending Quotation').length;
  const awaitingPaymentCount = quotations.filter((q) => q.status === 'Pending Approval').length;
  const confirmedCount = quotations.filter((q) => q.status === 'Accepted').length;
  const totalInvoicedINR = quotations
    .filter((q) => q.status === 'Accepted')
    .reduce((sum, q) => sum + q.totalINR, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0B1933] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
              Customer Purchase Orders & Quotations
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-extrabold bg-blue-100 text-[#0066FF] rounded-full">
              Live Sync
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review customer Buy For Me shopping requests, issue formal quotations, and automatically email invoices upon confirmation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const cleaned = buildQuotationsList();
              setQuotations(cleaned);
              triggerToast('Quotations synchronized: All duplicate entries filtered.');
            }}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="Clean and deduplicate quotations"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Deduplicate</span>
          </button>
          <button
            onClick={() => onNavigateTab('purchase-requests')}
            className="px-4 py-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            <span>View All Purchase Requests</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">New Purchase Orders (Needs Quote)</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">{pendingQuotesCount}</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Under Review</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Submitted by registered customers</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Awaiting Customer Approval</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">{awaitingPaymentCount}</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Quote Sent</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Pending payment or confirmation</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Confirmed & Invoiced</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">
              ₹{totalInvoicedINR.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {confirmedCount} Orders
            </span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Invoices automatically emailed to customers</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Total Purchase Orders</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">{quotations.length}</span>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Cross-synchronized with user lockers</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {['All', 'Pending Quotation', 'Pending Approval', 'Confirmed & Invoiced', 'Expired'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation ${
                statusFilter === status
                  ? 'bg-[#0066FF] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {status}
              {status === 'Pending Quotation' && pendingQuotesCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-blue-200 text-blue-900 text-[10px]">
                  {pendingQuotesCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Quote ID, Customer Name, Email, Request..."
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-[#0066FF] focus:bg-white"
          />
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Table helper banner */}
        <div className="px-4 py-2.5 bg-blue-50/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-800">Live Customer Purchase Orders & Quotations</span>
            <span className="text-slate-400">&bull; {filtered.length} requests displayed</span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium">Scrollable table &bull; Action buttons pinned</span>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[900px]">
            <thead className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 min-w-[130px] whitespace-nowrap">Quote & Request</th>
                <th className="py-3 px-4 min-w-[180px]">Customer & Email</th>
                <th className="py-3 px-4 min-w-[120px] whitespace-nowrap">Destination</th>
                <th className="py-3 px-4 min-w-[170px]">Items Summary</th>
                <th className="py-3 px-4 min-w-[100px] whitespace-nowrap">Total Amount</th>
                <th className="py-3 px-4 min-w-[160px] whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-right min-w-[160px] sticky right-0 bg-slate-50 shadow-[-6px_0_10px_rgba(0,0,0,0.05)] z-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No purchase orders found matching this filter.</p>
                    <p className="text-xs text-slate-400 mt-1">All customer purchase requests will automatically appear here.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-extrabold text-[#0066FF] text-xs sm:text-sm">{q.id}</div>
                      <div className="text-[11px] text-slate-500 font-mono">Ref: {q.requestId}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{q.createdAt}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={q.customerAvatar}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 text-xs sm:text-sm truncate">{q.customerName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">Locker #{q.customerId}</div>
                          <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5 truncate">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[150px]">{q.customerEmail}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700 text-xs">
                        <span>{q.destinationFlag}</span>
                        <span>{q.destination}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-xs text-slate-700 font-medium truncate max-w-[190px]" title={q.itemsSummary}>
                        {q.itemsSummary}
                      </div>
                      <div className="text-[11px] text-slate-400 font-semibold">{q.productCount} items</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-extrabold text-[#0B1933] text-sm">
                      ₹{q.totalINR.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {q.status === 'Accepted' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border bg-emerald-100 text-emerald-800 border-emerald-200">
                            <Check className="w-3 h-3" />
                            <span>Confirmed & Invoiced</span>
                          </span>
                          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[140px]">{q.customerEmail}</span>
                          </div>
                        </div>
                      ) : q.status === 'Pending Approval' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border bg-amber-100 text-amber-800 border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>Awaiting Payment</span>
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">Quote Dispatched</div>
                        </div>
                      ) : q.status === 'Pending Quotation' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border bg-blue-100 text-blue-800 border-blue-200">
                            <Clock className="w-3 h-3" />
                            <span>Pending Quotation</span>
                          </span>
                          <div className="text-[10px] text-blue-600 font-medium mt-0.5">Review Required</div>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-slate-100 text-slate-600 border-slate-200">
                          {q.status}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50/90 shadow-[-6px_0_10px_rgba(0,0,0,0.06)] z-10">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Primary Confirm Button if not yet accepted */}
                        {q.status !== 'Accepted' ? (
                          <button
                            onClick={() => handleConfirmOrder(q)}
                            disabled={confirmingId === q.id}
                            title="Confirm Customer Order & Automatically Email Invoice"
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Confirm & Invoice</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleResendInvoiceEmail(q)}
                              title={`Resend Invoice Email to ${q.customerEmail}`}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#0066FF] rounded-lg border border-blue-200 cursor-pointer"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDownloadInvoice(q)}
                              title="Download Official Invoice PDF"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handlePrintInvoice(q)}
                              title="Print Invoice Document"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {/* View Details Button */}
                        <button
                          onClick={() => handleOpenQuoteModal(q)}
                          title="View Full Quote & Product Breakdown"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Remove duplicate quotation button */}
                        <button
                          onClick={() => handleDeleteQuote(q)}
                          title="Remove Quotation"
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quote Preview / Confirmation Modal */}
      {selectedQuote && (
        <div
          onClick={() => setSelectedQuote(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 font-['Plus_Jakarta_Sans',sans-serif]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#0066FF] uppercase tracking-wider">
                  India2World Customer Quotation & Invoice Dispatch
                </span>
                <h3 className="text-lg font-extrabold text-[#0B1933]">
                  {selectedQuote.id} &bull; {selectedQuote.customerName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Customer & Email Information Card with Inline Editing */}
            <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedQuote.customerAvatar}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-blue-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="font-extrabold text-sm text-[#0B1933]">{selectedQuote.customerName}</div>
                  <div className="text-xs text-slate-500 font-mono">Locker #{selectedQuote.customerId}</div>
                  
                  {isEditingEmail ? (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <input
                        type="email"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        placeholder="customer@gmail.com"
                        className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-white border border-[#0066FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066FF] shadow-xs"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleSaveCorrectedEmail}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] rounded-lg cursor-pointer transition-colors"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditedEmail(selectedQuote.customerEmail);
                          setIsEditingEmail(false);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <div className="text-xs font-bold text-[#0066FF] flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{selectedQuote.customerEmail}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditedEmail(selectedQuote.customerEmail);
                          setIsEditingEmail(true);
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 rounded-md cursor-pointer transition-colors inline-flex items-center gap-1"
                        title="Click to edit or correct destination email address"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit / Change Email</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Target Recipient Email
                </span>
              </div>
            </div>

            {/* Live Email Delivery Status Banner */}
            {isSendingEmail ? (
              <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-200 flex items-start gap-2.5 animate-pulse">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900">
                  <strong className="block font-bold">Connecting to SMTP Mail Server...</strong>
                  Generating official PDF invoice and transmitting to <u>{selectedQuote.customerEmail}</u> via SMTP.
                </div>
              </div>
            ) : selectedQuote.emailStatus === 'Sent' ? (
              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950 space-y-1 w-full">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <strong className="font-extrabold text-blue-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                      SMTP Relay Accepted (Queued for Inbox Delivery)
                    </strong>
                    {selectedQuote.emailSentAt && (
                      <span className="text-[11px] text-blue-700 font-medium">Relayed: {selectedQuote.emailSentAt}</span>
                    )}
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    Official invoice <span className="font-mono font-bold text-slate-900">{selectedQuote.invoiceId || 'INV-GENERATED'}</span> with attached PDF was accepted by the Google SMTP mail relay and dispatched to <u className="font-semibold text-blue-900">{selectedQuote.customerEmail}</u>.
                  </p>
                  <div className="p-2.5 bg-white/90 rounded-xl border border-blue-100 text-[11px] text-slate-600 flex items-start gap-2 mt-1">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-800">Inbox Deliverability Advisory:</strong> The mail provider accepted transmission (250 2.0.0 OK). If the email is not visible in the Primary inbox within 1–2 minutes, please verify the recipient's <strong>Spam / Junk</strong> folder or <strong>Promotions / Updates</strong> category tabs, or click <strong>Resend to Email</strong> below.
                    </div>
                  </div>
                  {selectedQuote.emailDeliveryLog && (
                    <div className="text-[10px] text-slate-500 font-mono bg-blue-100/50 p-1.5 rounded-lg break-all">
                      {selectedQuote.emailDeliveryLog}
                    </div>
                  )}
                </div>
              </div>
            ) : selectedQuote.status === 'Accepted' ? (
              <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-900">
                  <strong className="block font-bold">Email Not Yet Delivered to Inbox</strong>
                  Invoice <span className="font-mono font-bold">{selectedQuote.invoiceId}</span> is created, but the email has not been delivered to <u>{selectedQuote.customerEmail}</u>.
                  <div className="text-[11px] text-red-700 mt-1 font-mono bg-red-100/70 p-2 rounded-lg">
                    {selectedQuote.emailDeliveryLog || (isSmtpConfigured ? 'Ready to send. Click "Resend to Email" below.' : 'SMTP credentials (SMTP_PASS) not configured in .env. Click "Configure SMTP" below to enter Gmail App Password.')}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <strong className="block font-bold">Action Required: Confirmation Pending</strong>
                  Confirming this customer order will immediately generate the official invoice and email it to <u>{selectedQuote.customerEmail}</u>.
                </div>
              </div>
            )}

            {/* Itemized Products */}
            {selectedQuote.products && selectedQuote.products.length > 0 && (
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Customer Purchase Items ({selectedQuote.products.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedQuote.products.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#0066FF] flex items-center justify-center font-bold shrink-0">
                            P
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 truncate">{item.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Store: <strong className="text-slate-600">{item.store}</strong> &bull; Qty: {item.qty}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-extrabold text-slate-900">
                        ₹{item.totalINR.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Breakdown */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between text-slate-600">
                <span>Destination Country:</span>
                <strong className="text-slate-800">
                  {selectedQuote.destinationFlag} {selectedQuote.destination}
                </strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Product Cost (Indian eCommerce):</span>
                <strong className="text-slate-800">₹{selectedQuote.productCostINR.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Assisted Purchase & Handling Fee:</span>
                <strong className="text-slate-800">₹{selectedQuote.serviceFeeINR.toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Express International Air Freight:</span>
                <strong className="text-slate-800">₹{selectedQuote.shippingEstINR.toLocaleString('en-IN')}</strong>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-extrabold text-[#0B1933]">
                <span>Total Customer Amount:</span>
                <span className="text-[#0066FF]">₹{selectedQuote.totalINR.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedQuote(null)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                {selectedQuote.status !== 'Accepted' ? (
                  <button
                    onClick={() => handleConfirmOrder(selectedQuote)}
                    disabled={confirmingId === selectedQuote.id || isSendingEmail}
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    {isSendingEmail ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>{isSendingEmail ? 'Sending...' : `Confirm Order & Automatically Send Invoice to ${selectedQuote.customerEmail}`}</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsSmtpModalOpen(true)}
                      className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                      title="Setup Gmail App Password or SMTP credentials"
                    >
                      <Key className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isSmtpConfigured ? 'SMTP Settings' : 'Configure SMTP'}</span>
                    </button>

                    <button
                      disabled={isSendingEmail}
                      onClick={() => handleResendInvoiceEmail(selectedQuote)}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                      title={`Send invoice email to ${selectedQuote.customerEmail}`}
                    >
                      {isSendingEmail ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Mail className="w-3.5 h-3.5" />
                      )}
                      <span>{isSendingEmail ? 'Sending...' : 'Resend to Email'}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadInvoice(selectedQuote)}
                      className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Invoice PDF</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMTP Credentials Setup Modal */}
      {isSmtpModalOpen && (
        <div
          onClick={() => setIsSmtpModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150 font-['Plus_Jakarta_Sans',sans-serif]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0066FF] flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0B1933]">Live SMTP Email Delivery Setup</h3>
                  <p className="text-xs text-slate-500">Connect Gmail SMTP to deliver official PDF invoices to customer inboxes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSmtpModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSmtp} className="space-y-3.5 text-xs">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-slate-700 space-y-1">
                <div className="font-bold text-blue-900 text-xs">How to get your Gmail App Password:</div>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-600">
                  <li>Open your <strong>Google Account</strong> &gt; <strong>Security</strong></li>
                  <li>Ensure <strong>2-Step Verification</strong> is turned ON</li>
                  <li>Search for <strong>"App passwords"</strong></li>
                  <li>Create a password for <strong>"India2World"</strong> (16 characters)</li>
                  <li>Paste the 16 characters below</li>
                </ol>
              </div>

              {smtpError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-medium">
                  <strong>Verification Error:</strong> {smtpError}
                </div>
              )}

              {smtpSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium">
                  <strong>Success:</strong> {smtpSuccess}
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Sender Email (Gmail Address):</label>
                <input
                  type="email"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                  required
                  placeholder="pharmayushtechteam@gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Gmail 16-Character App Password:</label>
                <input
                  type="password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                  required
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
                />
                <span className="text-[10px] text-slate-400">Do not use your regular Gmail password. Use a Google App Password.</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">SMTP Host:</label>
                  <input
                    type="text"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">SMTP Port:</label>
                  <input
                    type="number"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSmtpModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={smtpSaving}
                  className="px-5 py-2 font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-xs"
                >
                  {smtpSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{smtpSaving ? 'Verifying with Google...' : 'Verify & Save Credentials'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
