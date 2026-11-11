import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  ExternalLink,
  Search,
  Eye,
  Edit3,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Truck,
  XCircle,
  Plus,
  Trash2,
  X,
  Mail,
  Clock,
  FileText,
  Package,
  ShieldCheck,
  History,
  DollarSign,
  User,
  MapPin,
  Phone,
  Sparkles,
} from 'lucide-react';
import {
  ExternalPurchaseRequestRecord,
  ExternalPurchaseRequestStatus,
  ExternalPurchaseDashboardStats,
  AdminProcessedProductItem,
  CustomerRequestedProductItem,
  ExternalEmailStage,
  fetchAllExternalPurchaseRequests,
  sendExternalRequestQuotation,
  updateExternalPurchaseRequestByAdmin,
  resendExternalRequestEmailByAdmin,
  getCachedExternalPurchaseRequests,
  getCachedExternalPurchaseStats,
} from '../../services/externalPurchaseRequestService';
import { DATA_SYNC_EVENT } from '../../services/integratedDataService';
import { TablePaginationBar } from './TablePaginationBar';

const FILTER_STATUSES: Array<'All Requests' | ExternalPurchaseRequestStatus> = [
  'All Requests',
  'New Requests',
  'Under Review',
  'Waiting for Customer',
  'Quotation Sent',
  'Customer Approved',
  'Purchase Processing',
  'Purchased',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const STATUS_PROGRESSION_OPTIONS: ExternalPurchaseRequestStatus[] = [
  'New Requests',
  'Under Review',
  'Waiting for Customer',
  'Quotation Sent',
  'Customer Approved',
  'Purchase Processing',
  'Purchased',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const SHOPPING_PLATFORMS = [
  'Amazon India',
  'Flipkart',
  'Myntra',
  'Nykaa',
  'AJIO',
  'Tata CLiQ',
  'Meisho',
  'Croma',
  'Reliance Digital',
  'FirstCry',
  'Other External Platform',
];

function getStatusBadgeStyle(status: ExternalPurchaseRequestStatus): string {
  switch (status) {
    case 'New Requests':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Under Review':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Waiting for Customer':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Quotation Sent':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Customer Approved':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Customer Rejected':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Purchase Processing':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'Purchased':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'Shipped':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Delivered':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'Cancelled':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

export const AdminExternalPurchaseRequestsModule: React.FC = () => {
  const [requests, setRequests] = useState<ExternalPurchaseRequestRecord[]>(() =>
    getCachedExternalPurchaseRequests()
  );
  const [stats, setStats] = useState<ExternalPurchaseDashboardStats>(() =>
    getCachedExternalPurchaseStats()
  );
  const [loading, setLoading] = useState<boolean>(false);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<
    'All Requests' | ExternalPurchaseRequestStatus
  >('All Requests');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Active Modals
  const [detailsModalRecord, setDetailsModalRecord] =
    useState<ExternalPurchaseRequestRecord | null>(null);
  const [detailsActiveTab, setDetailsActiveTab] = useState<
    'overview' | 'activity' | 'emails'
  >('overview');

  const [processModalRecord, setProcessModalRecord] =
    useState<ExternalPurchaseRequestRecord | null>(null);
  const [processedItemsDraft, setProcessedItemsDraft] = useState<
    AdminProcessedProductItem[]
  >([]);
  const [quotationRefDraft, setQuotationRefDraft] = useState('');
  const [customerMessageDraft, setCustomerMessageDraft] = useState('');
  const [internalAdminNotesDraft, setInternalAdminNotesDraft] = useState('');

  const [editModalRecord, setEditModalRecord] =
    useState<ExternalPurchaseRequestRecord | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerEmail, setEditCustomerEmail] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editDeliveryAddress, setEditDeliveryAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editPostalCode, setEditPostalCode] = useState('');
  const [editRequestedItems, setEditRequestedItems] = useState<
    CustomerRequestedProductItem[]
  >([]);

  const [purchaseModalRecord, setPurchaseModalRecord] =
    useState<ExternalPurchaseRequestRecord | null>(null);
  const [purchaseStatusDraft, setPurchaseStatusDraft] =
    useState<ExternalPurchaseRequestStatus>('Purchased');
  const [externalOrderIdDraft, setExternalOrderIdDraft] = useState('');
  const [actualPurchaseDateDraft, setActualPurchaseDateDraft] = useState('');
  const [actualPurchaseAmountDraft, setActualPurchaseAmountDraft] =
    useState<number>(0);
  const [confirmationDetailsDraft, setConfirmationDetailsDraft] = useState('');
  const [trackingNumberDraft, setTrackingNumberDraft] = useState('');
  const [shippingCarrierDraft, setShippingCarrierDraft] = useState('');
  const [estimatedDeliveryDateDraft, setEstimatedDeliveryDateDraft] =
    useState('');
  const [sendEmailOnStatusUpdate, setSendEmailOnStatusUpdate] = useState(true);

  const [emailHistoryModalRecord, setEmailHistoryModalRecord] =
    useState<ExternalPurchaseRequestRecord | null>(null);

  const [submittingAction, setSubmittingAction] = useState(false);
  const [resendingRequestId, setResendingRequestId] = useState<string | null>(
    null
  );

  // Toast Notification
  const [bannerAlert, setBannerAlert] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  const showBanner = (
    type: 'success' | 'error' | 'info',
    title: string,
    message: string
  ) => {
    setBannerAlert({ type, title, message });
    setTimeout(() => {
      setBannerAlert((prev) => (prev?.title === title ? null : prev));
    }, 7000);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const res = await fetchAllExternalPurchaseRequests();
      setRequests(res.requests);
      setStats(res.stats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    const handleSync = () => {
      setRequests(getCachedExternalPurchaseRequests());
      setStats(getCachedExternalPurchaseStats());
    };
    window.addEventListener(DATA_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(DATA_SYNC_EVENT, handleSync);
  }, []);

  // Keep open modal records synced if updated
  useEffect(() => {
    if (detailsModalRecord) {
      const updated = requests.find(
        (r) => r.requestId === detailsModalRecord.requestId
      );
      if (updated) setDetailsModalRecord(updated);
    }
    if (emailHistoryModalRecord) {
      const updated = requests.find(
        (r) => r.requestId === emailHistoryModalRecord.requestId
      );
      if (updated) setEmailHistoryModalRecord(updated);
    }
  }, [requests]);

  // Filtered & searched list
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter !== 'All Requests' && req.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = req.requestId.toLowerCase().includes(q);
        const matchesName = req.customerName.toLowerCase().includes(q);
        const matchesEmail = req.customerEmail.toLowerCase().includes(q);
        const matchesPhone = (req.customerPhone || '').toLowerCase().includes(q);
        const matchesProduct =
          req.requestedProducts.some(
            (p) =>
              p.productName.toLowerCase().includes(q) ||
              p.platform.toLowerCase().includes(q)
          ) ||
          req.processedProducts.some(
            (p) =>
              p.actualProductName.toLowerCase().includes(q) ||
              p.platform.toLowerCase().includes(q)
          );
        return (
          matchesId ||
          matchesName ||
          matchesEmail ||
          matchesPhone ||
          matchesProduct
        );
      }
      return true;
    });
  }, [requests, statusFilter, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRequests.slice(start, start + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  // Open View Details
  const handleOpenViewDetails = async (
    record: ExternalPurchaseRequestRecord,
    tab: 'overview' | 'activity' | 'emails' = 'overview'
  ) => {
    setDetailsModalRecord(record);
    setDetailsActiveTab(tab);
    if (record.unreadAdminAlert) {
      await updateExternalPurchaseRequestByAdmin(record.requestId, {
        markAlertRead: true,
        sendNotificationEmail: false,
        actionNote: 'Admin viewed purchase request details',
      });
    }
  };

  // Open Process Purchase Request / Send Quotation Modal
  const handleOpenProcessRequest = (record: ExternalPurchaseRequestRecord) => {
    setProcessModalRecord(record);
    const items: AdminProcessedProductItem[] =
      record.processedProducts && record.processedProducts.length > 0
        ? record.processedProducts.map((p) => ({ ...p }))
        : record.requestedProducts.map((rp, idx) => ({
            id: `proc-${idx + 1}-${Date.now()}`,
            actualProductName: rp.productName,
            platform: rp.platform,
            verifiedProductUrl: rp.productUrl || '',
            productImage: rp.productImage || '',
            quantity: rp.quantity,
            actualPriceINR: rp.expectedBudgetINR || 0,
            shippingChargesINR: 0,
            additionalChargesINR: 0,
            estimatedDeliveryTime: '5-7 Business Days',
            productNotes: rp.description || '',
            subtotalINR: (rp.expectedBudgetINR || 0) * rp.quantity,
          }));
    setProcessedItemsDraft(items);
    setQuotationRefDraft(
      record.quotation?.quotationReference ||
        `QTN-${record.requestId.replace('EPR-', '')}`
    );
    setCustomerMessageDraft(record.quotation?.customerFacingMessage || '');
    setInternalAdminNotesDraft(record.quotation?.internalAdminNotes || '');
  };

  const updateProcessedItemField = (
    idx: number,
    field: keyof AdminProcessedProductItem,
    value: any
  ) => {
    setProcessedItemsDraft((prev) => {
      const copy = [...prev];
      const item = { ...copy[idx], [field]: value };
      const qty = Math.max(1, Number(item.quantity) || 1);
      const price = Math.max(0, Number(item.actualPriceINR) || 0);
      const ship = Math.max(0, Number(item.shippingChargesINR) || 0);
      const extra = Math.max(0, Number(item.additionalChargesINR) || 0);
      item.subtotalINR = price * qty + ship + extra;
      copy[idx] = item;
      return copy;
    });
  };

  const addProcessedItemRow = () => {
    setProcessedItemsDraft((prev) => [
      ...prev,
      {
        id: `proc-${prev.length + 1}-${Date.now()}`,
        actualProductName: '',
        platform: 'Amazon India',
        verifiedProductUrl: '',
        productImage: '',
        quantity: 1,
        actualPriceINR: 0,
        shippingChargesINR: 0,
        additionalChargesINR: 0,
        estimatedDeliveryTime: '5-7 Business Days',
        productNotes: '',
        subtotalINR: 0,
      },
    ]);
  };

  const removeProcessedItemRow = (idx: number) => {
    setProcessedItemsDraft((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
    );
  };

  const quotationDraftTotals = useMemo(() => {
    const productsTotalINR = processedItemsDraft.reduce(
      (sum, p) =>
        sum +
        (Number(p.actualPriceINR) || 0) * Math.max(1, Number(p.quantity) || 1),
      0
    );
    const shippingTotalINR = processedItemsDraft.reduce(
      (sum, p) => sum + (Number(p.shippingChargesINR) || 0),
      0
    );
    const additionalChargesTotalINR = processedItemsDraft.reduce(
      (sum, p) => sum + (Number(p.additionalChargesINR) || 0),
      0
    );
    const grandTotalINR =
      productsTotalINR + shippingTotalINR + additionalChargesTotalINR;
    return {
      productsTotalINR,
      shippingTotalINR,
      additionalChargesTotalINR,
      grandTotalINR,
    };
  }, [processedItemsDraft]);

  const handleSaveProcessedWithoutEmail = async () => {
    if (!processModalRecord) return;
    const invalid = processedItemsDraft.some(
      (p) => !p.actualProductName.trim()
    );
    if (invalid) {
      showBanner(
        'error',
        'Validation Error',
        'Every product row must have an actual product name.'
      );
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await updateExternalPurchaseRequestByAdmin(
        processModalRecord.requestId,
        {
          processedProducts: processedItemsDraft,
          quotationReference: quotationRefDraft,
          customerFacingMessage: customerMessageDraft,
          internalAdminNotes: internalAdminNotesDraft,
          status:
            processModalRecord.status === 'New Requests'
              ? 'Under Review'
              : processModalRecord.status,
          markAlertRead: true,
          sendNotificationEmail: false,
          actionNote:
            'Saved processed product & pricing details (draft quotation)',
        }
      );
      if (res.success) {
        showBanner(
          'info',
          'Processed Details Saved',
          `Draft quotation details saved for ${processModalRecord.requestId}.`
        );
        setProcessModalRecord(null);
      } else {
        showBanner(
          'error',
          'Save Failed',
          res.error || 'Could not save processed details.'
        );
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSendQuotationToCustomer = async () => {
    if (!processModalRecord) return;
    const invalid = processedItemsDraft.some(
      (p) => !p.actualProductName.trim() || Number(p.actualPriceINR) <= 0
    );
    if (invalid) {
      showBanner(
        'error',
        'Validation Error',
        'Please enter a valid product name and actual price (> ₹0) for all items before sending the quotation.'
      );
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await sendExternalRequestQuotation({
        requestId: processModalRecord.requestId,
        processedProducts: processedItemsDraft,
        quotationReference: quotationRefDraft,
        customerFacingMessage: customerMessageDraft,
        internalAdminNotes: internalAdminNotesDraft,
      });

      if (res.success && res.emailSent) {
        showBanner(
          'success',
          'Quotation Sent to Customer',
          `Quotation ${quotationRefDraft} (₹${quotationDraftTotals.grandTotalINR.toLocaleString(
            'en-IN'
          )}) was emailed to ${processModalRecord.customerEmail} with secure approval links.`
        );
        setProcessModalRecord(null);
      } else if (res.success && !res.emailSent) {
        showBanner(
          'error',
          'Quotation Saved, Email Failed',
          `Quotation was saved, but SMTP delivery failed: ${
            res.emailError || 'Check SMTP configuration.'
          }`
        );
        setProcessModalRecord(null);
      } else {
        showBanner(
          'error',
          'Error Sending Quotation',
          res.error || 'Failed to send quotation.'
        );
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  // Open Edit Request Modal
  const handleOpenEditRequest = (record: ExternalPurchaseRequestRecord) => {
    setEditModalRecord(record);
    setEditCustomerName(record.customerName);
    setEditCustomerEmail(record.customerEmail);
    setEditCustomerPhone(record.customerPhone);
    setEditDeliveryAddress(record.deliveryAddress);
    setEditCity(record.city);
    setEditState(record.state);
    setEditCountry(record.country);
    setEditPostalCode(record.postalCode);
    setEditRequestedItems(record.requestedProducts.map((p) => ({ ...p })));
  };

  const handleSaveEditRequest = async () => {
    if (!editModalRecord) return;
    if (!editCustomerName.trim() || !editCustomerEmail.trim()) {
      showBanner(
        'error',
        'Validation Error',
        'Customer Name and Email Address are required.'
      );
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await updateExternalPurchaseRequestByAdmin(
        editModalRecord.requestId,
        {
          customerName: editCustomerName,
          customerEmail: editCustomerEmail,
          customerPhone: editCustomerPhone,
          deliveryAddress: editDeliveryAddress,
          city: editCity,
          state: editState,
          country: editCountry,
          postalCode: editPostalCode,
          requestedProducts: editRequestedItems,
          sendNotificationEmail: false,
          actionNote: 'Admin edited customer & requested product details',
        }
      );
      if (res.success) {
        showBanner(
          'success',
          'Request Updated',
          `Successfully updated details for ${editModalRecord.requestId}.`
        );
        setEditModalRecord(null);
      } else {
        showBanner(
          'error',
          'Update Failed',
          res.error || 'Could not update request.'
        );
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  // Open Purchase Status / Tracking / External Order ID Modal
  const handleOpenPurchaseAndTrackingModal = (
    record: ExternalPurchaseRequestRecord,
    defaultNextStatus?: ExternalPurchaseRequestStatus
  ) => {
    setPurchaseModalRecord(record);
    setPurchaseStatusDraft(defaultNextStatus || record.status);
    setExternalOrderIdDraft(record.purchaseRecord?.externalOrderId || '');
    setActualPurchaseDateDraft(
      record.purchaseRecord?.actualPurchaseDate ||
        new Date().toISOString().slice(0, 10)
    );
    setActualPurchaseAmountDraft(
      record.purchaseRecord?.actualPurchaseAmountINR ??
        record.quotation?.grandTotalINR ??
        0
    );
    setConfirmationDetailsDraft(
      record.purchaseRecord?.confirmationDetails || ''
    );
    setTrackingNumberDraft(record.purchaseRecord?.trackingNumber || '');
    setShippingCarrierDraft(
      record.purchaseRecord?.shippingCarrier || 'DHL Express / BlueDart'
    );
    setEstimatedDeliveryDateDraft(
      record.purchaseRecord?.estimatedDeliveryDate || ''
    );
    setSendEmailOnStatusUpdate(true);
  };

  const handleSavePurchaseAndTracking = async () => {
    if (!purchaseModalRecord) return;
    if (
      (purchaseStatusDraft === 'Purchased' ||
        purchaseStatusDraft === 'Shipped' ||
        purchaseStatusDraft === 'Delivered') &&
      !externalOrderIdDraft.trim()
    ) {
      showBanner(
        'error',
        'External Retailer Order ID Required',
        'Please enter the External Retailer Order ID before marking the purchase as Purchased, Shipped, or Delivered.'
      );
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await updateExternalPurchaseRequestByAdmin(
        purchaseModalRecord.requestId,
        {
          status: purchaseStatusDraft,
          purchaseRecord: {
            externalOrderId: externalOrderIdDraft.trim(),
            actualPurchaseDate: actualPurchaseDateDraft.trim(),
            actualPurchaseAmountINR: Number(actualPurchaseAmountDraft) || 0,
            confirmationDetails: confirmationDetailsDraft.trim(),
            trackingNumber: trackingNumberDraft.trim() || undefined,
            shippingCarrier: shippingCarrierDraft.trim() || undefined,
            estimatedDeliveryDate:
              estimatedDeliveryDateDraft.trim() || undefined,
          },
          markAlertRead: true,
          sendNotificationEmail: sendEmailOnStatusUpdate,
        }
      );

      if (res.success) {
        const emailNote =
          res.emailSent === true
            ? `Confirmation email sent to ${purchaseModalRecord.customerEmail}.`
            : res.emailSent === false
            ? `Warning: Email failed to send (${res.emailError}).`
            : 'Saved to database.';
        showBanner(
          res.emailSent === false ? 'error' : 'success',
          `Request ${purchaseModalRecord.requestId} Updated (${purchaseStatusDraft})`,
          emailNote
        );
        setPurchaseModalRecord(null);
      } else {
        showBanner(
          'error',
          'Update Failed',
          res.error || 'Could not update purchase status.'
        );
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  // Resend Email
  const handleResendEmail = async (
    record: ExternalPurchaseRequestRecord,
    stage?: ExternalEmailStage
  ) => {
    setResendingRequestId(record.requestId);
    try {
      const res = await resendExternalRequestEmailByAdmin(
        record.requestId,
        stage
      );
      if (res.emailSent) {
        showBanner(
          'success',
          'Email Sent Successfully',
          `Dispatched live email to ${record.customerEmail} for Request ${record.requestId}.`
        );
      } else {
        showBanner(
          'error',
          'Email Delivery Failed',
          res.emailError ||
            res.error ||
            `Could not send email to ${record.customerEmail}.`
        );
      }
    } finally {
      setResendingRequestId(null);
    }
  };

  // Cancel Request
  const handleCancelRequest = async (record: ExternalPurchaseRequestRecord) => {
    if (record.status === 'Cancelled') return;
    setSubmittingAction(true);
    try {
      const res = await updateExternalPurchaseRequestByAdmin(record.requestId, {
        status: 'Cancelled',
        markAlertRead: true,
        sendNotificationEmail: true,
        actionNote: 'Admin cancelled external purchase request',
      });
      if (res.success) {
        showBanner(
          'info',
          `Request ${record.requestId} Cancelled`,
          res.emailSent
            ? `Cancellation notification sent to ${record.customerEmail}.`
            : 'Request marked as Cancelled in database.'
        );
      }
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <ShoppingBag className="w-3.5 h-3.5" />
            EXTERNAL PLATFORM PROCUREMENT WORKFLOW
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            External Purchase Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review customer product requests from Amazon, Flipkart, Myntra &amp;
            external retailers, send verified quotations, record purchases, and
            dispatch real-time email confirmations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="/request-external-purchase"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Open Customer Submission Form
          </a>
          <button
            type="button"
            onClick={() => {
              const publicUrl = `${window.location.origin}/request-external-purchase`;
              if (navigator.clipboard) {
                navigator.clipboard.writeText(publicUrl);
              }
              showBanner(
                'info',
                'Public Customer Form URL Copied!',
                `Copied ${publicUrl} to clipboard. You can now paste and share it via WhatsApp, Email, or SMS.`
              );
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition cursor-pointer"
            title="Copy public /request-external-purchase link to share with customers"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Copy Public Form URL
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Submit your external platform product purchase request with PHARMAYUSH / India2World here: ${
                typeof window !== 'undefined'
                  ? window.location.origin
                  : 'http://localhost:5173'
              }/request-external-purchase`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-bold shadow-xs transition cursor-pointer"
            title="Share public form link via WhatsApp"
          >
            Share via WhatsApp
          </a>
          <button
            onClick={refreshData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh Live Requests
          </button>
        </div>
      </div>

      {/* Live Delivery / Status Alert Banner */}
      {bannerAlert && (
        <div
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-xs ${
            bannerAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : bannerAlert.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {bannerAlert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : bannerAlert.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-sm font-bold">{bannerAlert.title}</h4>
              <p className="text-xs mt-0.5 opacity-90">{bannerAlert.message}</p>
            </div>
          </div>
          <button
            onClick={() => setBannerAlert(null)}
            className="p-1 rounded-lg hover:bg-black/5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 6 Real-Time Database Summary Cards (Zero Dummy Statistics) */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <div
          onClick={() => setStatusFilter('All Requests')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-blue-300 transition cursor-pointer"
        >
          <div className="text-xs font-semibold text-slate-500">
            Total Requests
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {stats.totalRequests}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              All Time
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Live database records
          </p>
        </div>

        <div
          onClick={() => setStatusFilter('New Requests')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-blue-300 transition cursor-pointer"
        >
          <div className="text-xs font-semibold text-slate-500">
            New Requests
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-600">
              {stats.newRequests}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Needs Review
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Awaiting admin review
          </p>
        </div>

        <div
          onClick={() => setStatusFilter('Quotation Sent')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-purple-300 transition cursor-pointer"
        >
          <div className="text-xs font-semibold text-slate-500">
            Pending Quotations
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-600">
              {stats.pendingQuotations}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              Pre-Approval
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            In review or awaiting approval
          </p>
        </div>

        <div
          onClick={() => setStatusFilter('Customer Approved')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition cursor-pointer"
        >
          <div className="text-xs font-semibold text-slate-500">
            Customer Approved
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">
              {stats.customerApproved}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              Ready to Buy
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Approved via customer link
          </p>
        </div>

        <div
          onClick={() => setStatusFilter('Purchase Processing')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-cyan-300 transition cursor-pointer"
        >
          <div className="text-xs font-semibold text-slate-500">
            Purchases Processing
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-cyan-600">
              {stats.purchasesProcessing}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700">
              Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Processing, purchased &amp; shipped
          </p>
        </div>

        <div
          onClick={() => setStatusFilter('Delivered')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-green-300 transition cursor-pointer"
        >
          <div className="text-xs font-semibold text-slate-500">
            Completed Purchases
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-green-600">
              {stats.completedPurchases}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
              Delivered
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Fulfilled &amp; delivered orders
          </p>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {FILTER_STATUSES.map((st) => {
              const active = statusFilter === st;
              const count =
                st === 'All Requests'
                  ? requests.length
                  : requests.filter((r) => r.status === st).length;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{st}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[280px] sm:min-w-[340px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Request ID, customer name, email, product..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main External Purchase Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No External Purchase Requests Found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              {requests.length === 0
                ? 'When customers submit requests via "Request a Product from Another Platform", they will automatically appear here in real time.'
                : 'No requests match your current status filter or search query.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 whitespace-nowrap">Request ID</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Customer</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Requested Products</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Platform</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Quotation / Total</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Request Date</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-center w-28 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedRequests.map((req) => {
                    const platforms = Array.from(
                      new Set(
                        (req.processedProducts?.length
                          ? req.processedProducts
                          : req.requestedProducts
                        ).map((p) => p.platform)
                      )
                    );

                    return (
                      <tr
                        key={req.requestId}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          req.unreadAdminAlert ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        {/* Request ID */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-[#0066FF] text-xs sm:text-sm">
                              {req.requestId}
                            </span>
                            {req.unreadAdminAlert && (
                              <span
                                title="New / Unread Customer Activity"
                                className="px-1.5 py-0.5 text-[9px] font-extrabold bg-rose-500 text-white rounded-full"
                              >
                                NEW
                              </span>
                            )}
                          </div>
                          {req.purchaseRecord?.externalOrderId && (
                            <div className="mt-1 text-[10px] font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200/70 rounded px-1.5 py-0.5 inline-block">
                              Ext ID: {req.purchaseRecord.externalOrderId}
                            </div>
                          )}
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {req.customerName}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {req.customerEmail}
                          </div>
                          <div className="text-[11px] text-slate-600 font-semibold flex items-center gap-1 mt-0.5">
                            <span>{req.destinationFlag}</span>
                            <span className="truncate">
                              {req.city}
                              {req.city && req.country ? ', ' : ''}
                              {req.country}
                            </span>
                          </div>
                        </td>

                        {/* Requested Products */}
                        <td className="py-3.5 px-4 align-middle max-w-[220px]">
                          <div className="space-y-1">
                            {req.requestedProducts.slice(0, 2).map((prod) => (
                              <div
                                key={prod.id}
                                className="flex items-center justify-between gap-2 text-xs"
                              >
                                <span className="font-semibold text-slate-800 truncate" title={prod.productName}>
                                  {prod.productName}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200/60 px-1 py-0.2 rounded-md shrink-0">
                                  x{prod.quantity}
                                </span>
                              </div>
                            ))}
                            {req.requestedProducts.length > 2 && (
                              <div className="text-[10px] font-bold text-[#0066FF]">
                                +{req.requestedProducts.length - 2} more item(s)
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Shopping Platform */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="flex items-center gap-1 flex-wrap max-w-[140px]">
                            {platforms.slice(0, 2).map((pf) => (
                              <span
                                key={pf}
                                className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-[10px]"
                              >
                                {pf}
                              </span>
                            ))}
                            {platforms.length > 2 && (
                              <span
                                className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 py-0.5 rounded-md"
                                title={platforms.join(', ')}
                              >
                                +{platforms.length - 2}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Quotation / Total */}
                        <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                          <div className="font-extrabold text-[#0B1933] text-sm">
                            ₹
                            {Number(
                              req.quotation?.grandTotalINR || 0
                            ).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Ref: {req.quotation?.quotationReference || 'N/A'}
                          </div>
                          {req.purchaseRecord?.trackingNumber && (
                            <div className="text-[10px] font-bold text-sky-700 mt-0.5">
                              AWB: {req.purchaseRecord.trackingNumber}
                            </div>
                          )}
                        </td>

                        {/* Request Date */}
                        <td className="py-3.5 px-4 align-middle text-slate-600 whitespace-nowrap text-xs">
                          <div>{req.createdAt.split(',')[0]}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {req.createdAt.split(',')[1] || ''}
                          </div>
                        </td>

                        {/* Request Status */}
                        <td className="py-3.5 px-4 align-middle text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadgeStyle(
                              req.status
                            )}`}
                          >
                            {req.status}
                          </span>
                        </td>

                        {/* Actions (Neat 2x2 Square Grid) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50/90 shadow-[-6px_0_10px_rgba(0,0,0,0.06)] z-10 align-middle">
                          <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
                            {/* Top Tier: View Details & Process Quote */}
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenViewDetails(req, 'overview')
                                }
                                title="View Request Details, Items & Logs"
                                aria-label="View Request Details"
                                className="w-7.5 h-7.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-200/80 flex items-center justify-center cursor-pointer shadow-2xs hover:shadow-xs transition-all active:scale-95"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenProcessRequest(req)}
                                title="Process Request & Send Quotation"
                                aria-label="Process Request"
                                className="w-7.5 h-7.5 rounded-lg bg-blue-50 hover:bg-[#0066FF] text-[#0066FF] hover:text-white border border-blue-200/80 flex items-center justify-center cursor-pointer shadow-2xs hover:shadow-xs transition-all active:scale-95"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Bottom Tier: Status / Track & Edit Request */}
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenPurchaseAndTrackingModal(req)
                                }
                                title="Purchase Status, External Order ID & Tracking"
                                aria-label="Status & Tracking"
                                className="w-7.5 h-7.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200/80 flex items-center justify-center cursor-pointer shadow-2xs hover:shadow-xs transition-all active:scale-95"
                              >
                                <Truck className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditRequest(req)}
                                title="Edit Request"
                                aria-label="Edit Request"
                                className="w-7.5 h-7.5 rounded-lg bg-slate-50 hover:bg-slate-800 text-slate-600 hover:text-white border border-slate-200/80 flex items-center justify-center cursor-pointer shadow-2xs hover:shadow-xs transition-all active:scale-95"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <TablePaginationBar
              currentPage={currentPage}
              totalItems={filteredRequests.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="external purchase requests"
            />
          </>
        )}
      </div>

      {/* =====================================================================
          MODAL 1: VIEW DETAILS (Overview + Activity Log + Email History)
         ===================================================================== */}
      {detailsModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    EXTERNAL PURCHASE REQUEST DETAILS
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadgeStyle(
                      detailsModalRecord.status
                    )}`}
                  >
                    {detailsModalRecord.status}
                  </span>
                </div>
                <h2 className="text-xl font-black mt-0.5">
                  {detailsModalRecord.requestId} —{' '}
                  {detailsModalRecord.customerName}
                </h2>
              </div>
              <button
                onClick={() => setDetailsModalRecord(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDetailsActiveTab('overview')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
                    detailsActiveTab === 'overview'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Request &amp; Quotation Overview
                </button>
                <button
                  onClick={() => setDetailsActiveTab('activity')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
                    detailsActiveTab === 'activity'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Activity History (
                  {detailsModalRecord.activityHistory?.length || 0})
                </button>
                <button
                  onClick={() => setDetailsActiveTab('emails')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
                    detailsActiveTab === 'emails'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Email History ({detailsModalRecord.emailHistory?.length || 0})
                </button>
              </div>

              <div className="flex items-center gap-2 pb-2">
                <button
                  onClick={() => {
                    const rec = detailsModalRecord;
                    setDetailsModalRecord(null);
                    handleOpenProcessRequest(rec);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Process / Send Quotation
                </button>
                <button
                  onClick={() => {
                    const rec = detailsModalRecord;
                    setDetailsModalRecord(null);
                    handleOpenPurchaseAndTrackingModal(rec);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  Record Purchase / Tracking
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {detailsActiveTab === 'overview' && (
                <>
                  {/* Customer & Delivery Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        Customer Information
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        {detailsModalRecord.customerName}
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {detailsModalRecord.customerEmail}
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {detailsModalRecord.customerPhone}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Submitted on: {detailsModalRecord.createdAt}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                      <div className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        Customer Delivery Address
                      </div>
                      <div className="text-xs text-slate-800 font-medium leading-relaxed">
                        {detailsModalRecord.deliveryAddress}
                        <br />
                        {detailsModalRecord.city}, {detailsModalRecord.state}
                        <br />
                        {detailsModalRecord.destinationFlag}{' '}
                        {detailsModalRecord.country} —{' '}
                        {detailsModalRecord.postalCode}
                      </div>
                    </div>
                  </div>

                  {/* Customer's Original Requested Products */}
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-3">
                      1. Customer Submitted Product Requirements (
                      {detailsModalRecord.requestedProducts.length})
                    </h3>
                    <div className="space-y-3">
                      {detailsModalRecord.requestedProducts.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px]">
                                {item.platform}
                              </span>
                              <span className="font-bold text-slate-900 text-sm">
                                {item.productName}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-slate-600">
                                <strong>Specs / Description:</strong>{' '}
                                {item.description}
                              </p>
                            )}
                            {item.additionalRequirements && (
                              <p className="text-xs text-slate-500">
                                <strong>Additional Requirements:</strong>{' '}
                                {item.additionalRequirements}
                              </p>
                            )}
                            {item.productUrl && (
                              <a
                                href={item.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline mt-1"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Open Customer Provided Link
                              </a>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-slate-700">
                              Requested Qty: {item.quantity}
                            </div>
                            {item.expectedBudgetINR ? (
                              <div className="text-xs text-slate-500">
                                Expected Budget: ₹
                                {item.expectedBudgetINR.toLocaleString('en-IN')}
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400">
                                No budget specified
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Admin Processed Quotation Details */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        2. Admin Verified Products &amp; Quotation Breakdown (
                        {detailsModalRecord.quotation?.quotationReference})
                      </h3>
                      {detailsModalRecord.quotation?.approvalToken && (
                        <a
                          href={`/request-external-purchase?externalRequestId=${encodeURIComponent(
                            detailsModalRecord.requestId
                          )}&token=${encodeURIComponent(
                            detailsModalRecord.quotation.approvalToken
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Preview Customer Quotation Approval Link
                        </a>
                      )}
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600 font-bold">
                            <th className="p-3">Verified Product</th>
                            <th className="p-3">Platform</th>
                            <th className="p-3 text-center">Qty</th>
                            <th className="p-3 text-right">Actual Price</th>
                            <th className="p-3 text-right">Shipping + Extra</th>
                            <th className="p-3 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {detailsModalRecord.processedProducts.map((p) => (
                            <tr key={p.id}>
                              <td className="p-3">
                                <div className="font-bold text-slate-900">
                                  {p.actualProductName}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  ETA: {p.estimatedDeliveryTime}
                                </div>
                                {p.verifiedProductUrl && (
                                  <a
                                    href={p.verifiedProductUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] text-blue-600 font-semibold hover:underline"
                                  >
                                    Verified Link &rarr;
                                  </a>
                                )}
                              </td>
                              <td className="p-3 font-medium">{p.platform}</td>
                              <td className="p-3 text-center font-bold">
                                {p.quantity}
                              </td>
                              <td className="p-3 text-right">
                                ₹{p.actualPriceINR.toLocaleString('en-IN')}
                              </td>
                              <td className="p-3 text-right">
                                ₹
                                {(
                                  p.shippingChargesINR + p.additionalChargesINR
                                ).toLocaleString('en-IN')}
                              </td>
                              <td className="p-3 text-right font-bold text-slate-900">
                                ₹{p.subtotalINR.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 text-xs">
                          {detailsModalRecord.quotation
                            ?.customerFacingMessage && (
                            <div>
                              <span className="font-bold text-slate-700">
                                Customer Message:{' '}
                              </span>
                              <span className="text-slate-600">
                                {
                                  detailsModalRecord.quotation
                                    .customerFacingMessage
                                }
                              </span>
                            </div>
                          )}
                          {detailsModalRecord.quotation?.internalAdminNotes && (
                            <div className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg inline-block">
                              <strong>
                                Internal Admin Note (Hidden from Customer):
                              </strong>{' '}
                              {detailsModalRecord.quotation.internalAdminNotes}
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-1 shrink-0">
                          <div className="text-xs text-slate-500">
                            Products: ₹
                            {detailsModalRecord.quotation.productsTotalINR.toLocaleString(
                              'en-IN'
                            )}{' '}
                            | Shipping: ₹
                            {detailsModalRecord.quotation.shippingTotalINR.toLocaleString(
                              'en-IN'
                            )}{' '}
                            | Extra: ₹
                            {detailsModalRecord.quotation.additionalChargesTotalINR.toLocaleString(
                              'en-IN'
                            )}
                          </div>
                          <div className="text-base font-black text-blue-600">
                            Grand Total: ₹
                            {detailsModalRecord.quotation.grandTotalINR.toLocaleString(
                              'en-IN'
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* External Purchase & Tracking Record */}
                  {detailsModalRecord.purchaseRecord && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                      <div className="text-xs font-extrabold uppercase text-emerald-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        3. Recorded External Platform Purchase &amp; Shipping
                        Details
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-emerald-950">
                        <div>
                          <span className="text-emerald-700 font-semibold">
                            External Order ID:
                          </span>
                          <div className="font-bold">
                            {detailsModalRecord.purchaseRecord.externalOrderId}
                          </div>
                        </div>
                        <div>
                          <span className="text-emerald-700 font-semibold">
                            Purchase Date:
                          </span>
                          <div className="font-bold">
                            {
                              detailsModalRecord.purchaseRecord
                                .actualPurchaseDate
                            }
                          </div>
                        </div>
                        <div>
                          <span className="text-emerald-700 font-semibold">
                            Actual Purchase Amount:
                          </span>
                          <div className="font-bold">
                            ₹
                            {Number(
                              detailsModalRecord.purchaseRecord
                                .actualPurchaseAmountINR || 0
                            ).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div>
                          <span className="text-emerald-700 font-semibold">
                            Shipping Carrier:
                          </span>
                          <div className="font-bold">
                            {detailsModalRecord.purchaseRecord
                              .shippingCarrier || 'Pending'}
                          </div>
                        </div>
                        <div>
                          <span className="text-emerald-700 font-semibold">
                            Tracking Number:
                          </span>
                          <div className="font-bold">
                            {detailsModalRecord.purchaseRecord.trackingNumber ||
                              'Pending'}
                          </div>
                        </div>
                        <div>
                          <span className="text-emerald-700 font-semibold">
                            Estimated Delivery:
                          </span>
                          <div className="font-bold">
                            {detailsModalRecord.purchaseRecord
                              .estimatedDeliveryDate || 'TBD'}
                          </div>
                        </div>
                      </div>
                      {detailsModalRecord.purchaseRecord
                        .confirmationDetails && (
                        <div className="text-xs text-emerald-900 pt-1">
                          <strong>Confirmation Details:</strong>{' '}
                          {
                            detailsModalRecord.purchaseRecord
                              .confirmationDetails
                          }
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {detailsActiveTab === 'activity' && (
                <div className="space-y-3">
                  {detailsModalRecord.activityHistory?.map((act) => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {act.action}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {act.details}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Actor: <strong>{act.actor}</strong>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">
                        {act.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {detailsActiveTab === 'emails' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Complete SMTP Email Delivery Log for{' '}
                      {detailsModalRecord.customerEmail}
                    </span>
                    <button
                      onClick={() => handleResendEmail(detailsModalRecord)}
                      disabled={
                        resendingRequestId === detailsModalRecord.requestId
                      }
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Resend Latest Stage Email
                    </button>
                  </div>
                  {(detailsModalRecord.emailHistory || []).map((em) => (
                    <div
                      key={em.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              em.status === 'Sent'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {em.status}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            Stage: {em.stage}
                          </span>
                        </div>
                        <div className="text-xs text-slate-700 mt-1">
                          {em.subject}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Recipient: {em.recipient}{' '}
                          {em.messageId ? `• Msg ID: ${em.messageId}` : ''}
                        </div>
                        {em.error && (
                          <div className="text-[11px] text-rose-600 font-semibold mt-1">
                            SMTP Error: {em.error}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">
                        {em.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: PROCESS PURCHASE REQUEST & SEND QUOTATION TO CUSTOMER
         ===================================================================== */}
      {processModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                  STEP 5 &amp; 6 • PROCESS PURCHASE REQUEST &amp; PREPARE
                  QUOTATION
                </span>
                <h2 className="text-xl font-black">
                  Process Request {processModalRecord.requestId} (
                  {processModalRecord.customerName})
                </h2>
              </div>
              <button
                onClick={() => setProcessModalRecord(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Quotation Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Quotation / Purchase Reference
                  </label>
                  <input
                    type="text"
                    value={quotationRefDraft}
                    onChange={(e) => setQuotationRefDraft(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Customer Registered Email
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={processModalRecord.customerEmail}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                    Current Request Status
                  </label>
                  <div className="pt-1">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeStyle(
                        processModalRecord.status
                      )}`}
                    >
                      {processModalRecord.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Product Rows */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    Verified Products &amp; Pricing ({processedItemsDraft.length}
                    )
                  </h3>
                  <button
                    type="button"
                    onClick={addProcessedItemRow}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Product Row
                  </button>
                </div>

                {processedItemsDraft.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-blue-700">
                        Product #{idx + 1}
                      </span>
                      {processedItemsDraft.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeProcessedItemRow(idx)}
                          className="text-xs font-bold text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Actual Product Name *
                        </label>
                        <input
                          type="text"
                          value={item.actualProductName}
                          onChange={(e) =>
                            updateProcessedItemField(
                              idx,
                              'actualProductName',
                              e.target.value
                            )
                          }
                          placeholder="Verified product title"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Retailer / Shopping Platform
                        </label>
                        <select
                          value={item.platform}
                          onChange={(e) =>
                            updateProcessedItemField(
                              idx,
                              'platform',
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                        >
                          {SHOPPING_PLATFORMS.map((pf) => (
                            <option key={pf} value={pf}>
                              {pf}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Estimated Delivery Time
                        </label>
                        <input
                          type="text"
                          value={item.estimatedDeliveryTime}
                          onChange={(e) =>
                            updateProcessedItemField(
                              idx,
                              'estimatedDeliveryTime',
                              e.target.value
                            )
                          }
                          placeholder="e.g. 5-7 Business Days"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Verified Product Shopping URL
                        </label>
                        <input
                          type="url"
                          value={item.verifiedProductUrl}
                          onChange={(e) =>
                            updateProcessedItemField(
                              idx,
                              'verifiedProductUrl',
                              e.target.value
                            )
                          }
                          placeholder="https://www.amazon.in/..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Product Image URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={item.productImage || ''}
                          onChange={(e) =>
                            updateProcessedItemField(
                              idx,
                              'productImage',
                              e.target.value
                            )
                          }
                          placeholder="https://..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateProcessedItemField(
                              idx,
                              'quantity',
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Actual Unit Price (₹ INR) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={item.actualPriceINR}
                          onChange={(e) =>
                            updateProcessedItemField(
                              idx,
                              'actualPriceINR',
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Shipping Charges (₹ INR)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={item.shippingChargesINR}
                          onChange={(e) =>
                            updateProcessedItemField(
                              idx,
                              'shippingChargesINR',
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Additional Charges (₹ INR)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={item.additionalChargesINR}
                          onChange={(e) =>
                            updateProcessedItemField(
                              idx,
                              'additionalChargesINR',
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                      <input
                        type="text"
                        value={item.productNotes || ''}
                        onChange={(e) =>
                          updateProcessedItemField(
                            idx,
                            'productNotes',
                            e.target.value
                          )
                        }
                        placeholder="Product notes (size, color, seller verification notes)..."
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                      <div className="text-right text-xs font-extrabold text-slate-900">
                        Item Subtotal: ₹
                        {Number(item.subtotalINR || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Messages & Auto-Calculated Totals */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Customer-Facing Message (Included in Quotation Email)
                    </label>
                    <textarea
                      rows={2}
                      value={customerMessageDraft}
                      onChange={(e) => setCustomerMessageDraft(e.target.value)}
                      placeholder="e.g., All items are in stock on Amazon India & Flipkart. Please approve the quotation so we can purchase immediately."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-800 mb-1">
                      Internal Admin Notes (Strictly Hidden from Customer
                      Emails)
                    </label>
                    <textarea
                      rows={2}
                      value={internalAdminNotesDraft}
                      onChange={(e) =>
                        setInternalAdminNotesDraft(e.target.value)
                      }
                      placeholder="Internal procurement notes, seller margin, warehouse instructions..."
                      className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50/40 text-xs"
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-2.5 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                      Automatic Quotation Summary
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Total Product Amount:</span>
                      <span className="font-bold text-white">
                        ₹
                        {quotationDraftTotals.productsTotalINR.toLocaleString(
                          'en-IN'
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Shipping Charges:</span>
                      <span className="font-bold text-white">
                        ₹
                        {quotationDraftTotals.shippingTotalINR.toLocaleString(
                          'en-IN'
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300 pb-2 border-b border-slate-700">
                      <span>Additional Charges:</span>
                      <span className="font-bold text-white">
                        ₹
                        {quotationDraftTotals.additionalChargesTotalINR.toLocaleString(
                          'en-IN'
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-sm font-bold">Final Grand Total:</span>
                    <span className="text-2xl font-black text-emerald-400">
                      ₹
                      {quotationDraftTotals.grandTotalINR.toLocaleString(
                        'en-IN'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setProcessModalRecord(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={handleSaveProcessedWithoutEmail}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  Save Draft Without Sending
                </button>
                <button
                  type="button"
                  disabled={submittingAction}
                  onClick={handleSendQuotationToCustomer}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submittingAction
                    ? 'Sending Quotation Email...'
                    : 'Send Quotation to Customer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: UPDATE PURCHASE STATUS, RECORD EXTERNAL ORDER ID & TRACKING
         ===================================================================== */}
      {purchaseModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 to-teal-800 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  STEP 7 &amp; 8 • PURCHASE CONFIRMATION &amp; TRACKING
                </span>
                <h2 className="text-lg font-black">
                  Update Status &amp; Purchase Record —{' '}
                  {purchaseModalRecord.requestId}
                </h2>
              </div>
              <button
                onClick={() => setPurchaseModalRecord(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Request Lifecycle Status
                </label>
                <select
                  value={purchaseStatusDraft}
                  onChange={(e) =>
                    setPurchaseStatusDraft(
                      e.target.value as ExternalPurchaseRequestStatus
                    )
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900"
                >
                  {STATUS_PROGRESSION_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    External Retailer Order ID * (for Purchased/Shipped)
                  </label>
                  <input
                    type="text"
                    value={externalOrderIdDraft}
                    onChange={(e) => setExternalOrderIdDraft(e.target.value)}
                    placeholder="e.g. AMZ-404-8912341-9921"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Actual Purchase Date
                  </label>
                  <input
                    type="date"
                    value={actualPurchaseDateDraft}
                    onChange={(e) => setActualPurchaseDateDraft(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Actual Purchase Amount (₹ INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={actualPurchaseAmountDraft}
                    onChange={(e) =>
                      setActualPurchaseAmountDraft(Number(e.target.value))
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Shipping Carrier
                  </label>
                  <input
                    type="text"
                    value={shippingCarrierDraft}
                    onChange={(e) => setShippingCarrierDraft(e.target.value)}
                    placeholder="e.g. DHL Express / BlueDart / Delhivery"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tracking Number (When Available)
                  </label>
                  <input
                    type="text"
                    value={trackingNumberDraft}
                    onChange={(e) => setTrackingNumberDraft(e.target.value)}
                    placeholder="e.g. AWB-982347192"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Estimated Delivery Date
                  </label>
                  <input
                    type="text"
                    value={estimatedDeliveryDateDraft}
                    onChange={(e) =>
                      setEstimatedDeliveryDateDraft(e.target.value)
                    }
                    placeholder="e.g. 20 Nov 2026"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Purchase Confirmation Details
                </label>
                <textarea
                  rows={2}
                  value={confirmationDetailsDraft}
                  onChange={(e) => setConfirmationDetailsDraft(e.target.value)}
                  placeholder="Order purchased directly from official seller on Amazon/Flipkart. Invoice verified."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmailOnStatusUpdate}
                  onChange={(e) => setSendEmailOnStatusUpdate(e.target.checked)}
                  className="rounded text-blue-600"
                />
                Automatically send real-time stage notification email to{' '}
                <strong>{purchaseModalRecord.customerEmail}</strong>
              </label>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setPurchaseModalRecord(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={handleSavePurchaseAndTracking}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {submittingAction
                  ? 'Saving & Dispatching Email...'
                  : 'Save Purchase & Notify Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: EDIT CUSTOMER & REQUESTED PRODUCTS
         ===================================================================== */}
      {editModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-lg font-black">
                Edit Request {editModalRecord.requestId}
              </h2>
              <button
                onClick={() => setEditModalRecord(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Customer Email *
                  </label>
                  <input
                    type="email"
                    value={editCustomerEmail}
                    onChange={(e) => setEditCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editCustomerPhone}
                    onChange={(e) => setEditCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Delivery Address
                  </label>
                  <input
                    type="text"
                    value={editDeliveryAddress}
                    onChange={(e) => setEditDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={editCountry}
                    onChange={(e) => setEditCountry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={editPostalCode}
                    onChange={(e) => setEditPostalCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-xs font-extrabold uppercase text-slate-700">
                  Requested Products ({editRequestedItems.length})
                </div>
                {editRequestedItems.map((item, i) => (
                  <div
                    key={item.id || i}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 grid grid-cols-1 sm:grid-cols-4 gap-2.5"
                  >
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => {
                        const next = [...editRequestedItems];
                        next[i] = { ...next[i], productName: e.target.value };
                        setEditRequestedItems(next);
                      }}
                      placeholder="Product Name"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                    <input
                      type="text"
                      value={item.platform}
                      onChange={(e) => {
                        const next = [...editRequestedItems];
                        next[i] = { ...next[i], platform: e.target.value };
                        setEditRequestedItems(next);
                      }}
                      placeholder="Platform"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                    <input
                      type="url"
                      value={item.productUrl || ''}
                      onChange={(e) => {
                        const next = [...editRequestedItems];
                        next[i] = { ...next[i], productUrl: e.target.value };
                        setEditRequestedItems(next);
                      }}
                      placeholder="Shopping URL"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const next = [...editRequestedItems];
                        next[i] = {
                          ...next[i],
                          quantity: Number(e.target.value) || 1,
                        };
                        setEditRequestedItems(next);
                      }}
                      placeholder="Quantity"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditModalRecord(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={submittingAction}
                onClick={handleSaveEditRequest}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 5: VIEW EMAIL HISTORY & RESEND SPECIFIC STAGE EMAIL
         ===================================================================== */}
      {emailHistoryModalRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-purple-300">
                  SMTP EMAIL DELIVERY LOG
                </span>
                <h2 className="text-lg font-black">
                  Email History — {emailHistoryModalRecord.requestId}
                </h2>
              </div>
              <button
                onClick={() => setEmailHistoryModalRecord(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="text-xs">
                  <span className="text-slate-500">Customer Email: </span>
                  <strong className="text-slate-900">
                    {emailHistoryModalRecord.customerEmail}
                  </strong>
                </div>
                <button
                  onClick={() => handleResendEmail(emailHistoryModalRecord)}
                  disabled={
                    resendingRequestId === emailHistoryModalRecord.requestId
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      resendingRequestId === emailHistoryModalRecord.requestId
                        ? 'animate-spin'
                        : ''
                    }`}
                  />
                  Resend Current Stage Email
                </button>
              </div>

              {(emailHistoryModalRecord.emailHistory || []).length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No emails recorded yet for this request.
                </div>
              ) : (
                <div className="space-y-3">
                  {emailHistoryModalRecord.emailHistory.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'Sent'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {item.status}
                          </span>
                          <span className="text-xs font-extrabold text-slate-900">
                            {item.stage}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {item.timestamp}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-slate-700">
                        {item.subject}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        To: {item.recipient}{' '}
                        {item.messageId ? `• Message ID: ${item.messageId}` : ''}
                      </div>
                      {item.error && (
                        <div className="text-[11px] text-rose-600 font-semibold">
                          Error: {item.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
