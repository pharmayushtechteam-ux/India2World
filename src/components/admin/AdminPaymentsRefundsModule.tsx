import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  RotateCcw,
  Search,
  Filter,
  Download,
  Printer,
  FileText,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Eye,
  X,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { AdminTab } from '../../types/admin';
import {
  getAllPayments,
  getAllRefunds,
  getAllCustomers,
  getAllOrders,
  processRefund,
  DATA_SYNC_EVENT,
  PaymentTransaction,
  RefundRequest,
} from '../../services/integratedDataService';
import { TablePaginationBar } from './TablePaginationBar';
import {
  CustomerOrderInvoice,
  getAllInvoices,
  downloadInvoiceDocument,
  printInvoiceDocument,
} from '../../services/orderInvoiceService';

export const AdminPaymentsRefundsModule: React.FC<{
  tab: 'payments' | 'refunds';
  onNavigateTab: (tab: AdminTab, params?: any) => void;
}> = ({ tab, onNavigateTab }) => {
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => getAllPayments());
  const [refunds, setRefunds] = useState<RefundRequest[]>(() => getAllRefunds());
  const [search, setSearch] = useState('');
  const [selectedReceiptModal, setSelectedReceiptModal] = useState<CustomerOrderInvoice | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const buildReceiptFromPayment = (payment: PaymentTransaction): CustomerOrderInvoice => {
    const allInvoices = getAllInvoices();
    const existing = allInvoices.find(
      (inv) =>
        inv.id === payment.referenceId ||
        inv.orderId === payment.referenceId ||
        inv.invoiceNumber === payment.referenceId ||
        inv.id === payment.id ||
        inv.orderId === payment.id ||
        inv.invoiceNumber === `REC-${payment.id.replace('PAY-', '')}`
    );
    if (existing) {
      return existing;
    }

    const allCustomers = getAllCustomers();
    const customer = allCustomers.find(
      (c) => c.id === payment.customerId || c.name.toLowerCase() === payment.customerName.toLowerCase()
    );

    const allOrders = getAllOrders();
    const order = allOrders.find(
      (o) => o.id === payment.referenceId || (o as any).orderId === payment.referenceId
    );

    const customerEmail = customer?.email || order?.customerEmail || 'customer@india2world.com';
    const customerPhone = customer?.phone || '+971 50 123 4567';
    const city = customer?.city || 'Dubai';
    const country = customer?.country || 'United Arab Emirates';
    const isUae = country.toLowerCase().includes('emirates') || country.toLowerCase().includes('uae');
    const flag = isUae ? '🇦🇪' : country.toLowerCase().includes('states') || country.toLowerCase().includes('usa') ? '🇺🇸' : '🌍';

    const items = order && order.items && order.items.length > 0
      ? order.items.map((item: any, idx: number) => ({
          id: item.id || `item-${idx + 1}`,
          title: item.title || item.name || payment.purpose,
          store: item.store || item.storeName || payment.gateway,
          price: item.priceINR || item.price || Math.round(payment.amountINR / order.items.length),
          qty: item.quantity || item.qty || 1,
          total: (item.priceINR || item.price || Math.round(payment.amountINR / order.items.length)) * (item.quantity || item.qty || 1),
        }))
      : [
          {
            id: `item-${payment.id}`,
            title: payment.purpose,
            store: payment.gateway,
            price: payment.amountINR,
            qty: 1,
            total: payment.amountINR,
          },
        ];

    const subtotal = items.reduce((sum: number, it: any) => sum + it.total, 0);

    return {
      id: `REC-${payment.id.replace('PAY-', '')}`,
      orderId: payment.referenceId || `ORD-${payment.id.replace('PAY-', '')}`,
      invoiceNumber: `REC-${payment.id.replace('PAY-', '')}`,
      createdAt: payment.paymentDate,
      customerId: payment.customerId,
      customerName: payment.customerName,
      customerEmail,
      customerPhone,
      destinationCity: city,
      destinationCountry: country,
      destinationFlag: flag,
      shippingAddress: {
        street: 'Registered Delivery Destination',
        city,
        state: city,
        postalCode: '00000',
        country,
      },
      billingAddress: {
        name: payment.customerName,
        email: customerEmail,
        country,
      },
      items,
      subtotalINR: subtotal,
      domesticShippingINR: 0,
      serviceFeeINR: 0,
      estimatedTaxINR: 0,
      discountINR: 0,
      totalINR: payment.amountINR,
      paymentMethod: payment.gateway,
      paymentStatus: payment.status === 'Captured' ? 'Paid' : 'Pending',
      emailStatus: 'Sent',
      emailAttemptCount: 1,
    };
  };

  const handleViewReceipt = (payment: PaymentTransaction) => {
    const receipt = buildReceiptFromPayment(payment);
    setSelectedReceiptModal(receipt);
  };

  const handleDownloadReceipt = async (payment: PaymentTransaction | CustomerOrderInvoice) => {
    const receipt = 'paymentDate' in payment ? buildReceiptFromPayment(payment as PaymentTransaction) : payment as CustomerOrderInvoice;
    setDownloadingId(receipt.id);
    try {
      await downloadInvoiceDocument(receipt);
      triggerToast(`Downloaded tax receipt PDF for ${receipt.invoiceNumber}!`);
    } catch (err) {
      printInvoiceDocument(receipt);
      triggerToast(`Opened print/download window for ${receipt.invoiceNumber}!`);
    } finally {
      setDownloadingId(null);
    }
  };
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination states (5 to 8 concepts/items per page, default 6)
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsPageSize, setPaymentsPageSize] = useState<number>(6);
  const [refundsPage, setRefundsPage] = useState(1);
  const [refundsPageSize, setRefundsPageSize] = useState<number>(6);

  useEffect(() => {
    const handleUpdate = () => {
      setPayments(getAllPayments());
      setRefunds(getAllRefunds());
    };
    window.addEventListener(DATA_SYNC_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(DATA_SYNC_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Reset payments page when search query changes
  useEffect(() => {
    setPaymentsPage(1);
  }, [search]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApproveRefund = (id: string) => {
    processRefund(id, 'Approved & Credited');
    setRefunds(getAllRefunds());
    triggerToast(`Refund ${id} approved and credited to customer!`);
  };

  if (tab === 'payments') {
    const filteredPayments = payments.filter((p) => {
      const q = search.toLowerCase();
      return (
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.referenceId.toLowerCase().includes(q) ||
        p.gateway.toLowerCase().includes(q)
      );
    });

    const paginatedPayments = filteredPayments.slice(
      (paymentsPage - 1) * paymentsPageSize,
      paymentsPage * paymentsPageSize
    );

    return (
      <div className="space-y-6 max-w-7xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-[#0B1933] text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
              Payments & Financial Ledger
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live transaction records, multi-currency conversion, and Stripe/Razorpay merchant reconciliations.
            </p>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <div className="text-xs font-semibold text-slate-500">Gross Captured Today</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">₹52,890</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">100% Success</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Stripe & Razorpay webhook synced</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <div className="text-xs font-semibold text-slate-500">Buy For Me Escrow</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">₹1.42 L</span>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Locked</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Held until merchant dispatch</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <div className="text-xs font-semibold text-slate-500">International Courier Fees</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">₹86,400</span>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Collected</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Paid before DHL/FedEx dispatch</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <div className="text-xs font-semibold text-slate-500">Payment Gateway Fee</div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">2.8%</span>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">Blended</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Cross-border interchange rate</div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Payment ID, Customer, Reference..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-[#0066FF] focus:bg-white"
            />
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Transaction ID</th>
                  <th className="py-3.5 px-4">Customer & Reference</th>
                  <th className="py-3.5 px-4">Purpose</th>
                  <th className="py-3.5 px-4">Gateway</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center w-28 whitespace-nowrap">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 align-middle">
                      <div className="font-bold text-[#0066FF] font-mono">{p.id}</div>
                      <div className="text-[11px] text-slate-400">{p.paymentDate}</div>
                    </td>

                    <td className="py-3 px-4 align-middle">
                      <div className="font-bold text-slate-800">{p.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">Ref: {p.referenceId}</div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-700 align-middle">
                      {p.purpose}
                    </td>

                    <td className="py-3 px-4 align-middle">
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {p.gateway}
                      </span>
                    </td>

                    <td className="py-3 px-4 align-middle">
                      <div className="font-extrabold text-[#0B1933]">₹{p.amountINR.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-slate-500 font-semibold">{p.amountForeign}</div>
                    </td>

                    <td className="py-3 px-4 align-middle whitespace-nowrap">
                      <span className="inline-flex items-center whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center align-middle whitespace-nowrap">
                      <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
                        <button
                          type="button"
                          onClick={() => handleViewReceipt(p)}
                          className="w-full max-w-[96px] px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200/80 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 font-bold text-xs shadow-2xs active:scale-95"
                          title="View Tax Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(p)}
                          disabled={downloadingId === `REC-${p.id.replace('PAY-', '')}` || downloadingId === p.id}
                          className="w-full max-w-[96px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5 font-bold text-xs disabled:opacity-50 active:scale-95 shadow-2xs"
                          title="Download Tax Receipt PDF"
                        >
                          {downloadingId === `REC-${p.id.replace('PAY-', '')}` || downloadingId === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0066FF]" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-slate-600" />
                          )}
                          <span>Download</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePaginationBar
            totalItems={filteredPayments.length}
            currentPage={paymentsPage}
            pageSize={paymentsPageSize}
            onPageChange={setPaymentsPage}
            onPageSizeChange={setPaymentsPageSize}
            itemLabel="payments & ledger records"
          />
        </div>

        {/* Payment Receipt / Tax Invoice Modal */}
        {selectedReceiptModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="px-6 py-4 bg-[#0B1933] text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0066FF] flex items-center justify-center font-bold text-white shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                        Official Payment Receipt & Tax Invoice
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                        {selectedReceiptModal.paymentStatus === 'Paid' ? 'Captured & Verified' : selectedReceiptModal.paymentStatus}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white mt-0.5">
                      {selectedReceiptModal.invoiceNumber}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReceiptModal(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
                {/* Reference & Transaction Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Transaction ID</div>
                    <div className="font-extrabold text-slate-900 mt-0.5">{selectedReceiptModal.id}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Order / Reference</div>
                    <div className="font-extrabold text-[#0066FF] mt-0.5">{selectedReceiptModal.orderId}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Payment Gateway</div>
                    <div className="font-bold text-slate-800 mt-0.5">{selectedReceiptModal.paymentMethod}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Date & Time</div>
                    <div className="font-medium text-slate-700 mt-0.5">{selectedReceiptModal.createdAt}</div>
                  </div>
                </div>

                {/* Customer & Processing Hub Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Billed Customer</div>
                    <div className="font-bold text-slate-900 text-sm">{selectedReceiptModal.customerName}</div>
                    <div className="text-slate-600">Customer ID: {selectedReceiptModal.customerId}</div>
                    <div className="text-[#0066FF] font-semibold">{selectedReceiptModal.customerEmail}</div>
                    <div className="text-slate-500">
                      Destination: {selectedReceiptModal.destinationFlag} {selectedReceiptModal.destinationCity}, {selectedReceiptModal.destinationCountry}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Merchant & Hub</div>
                    <div className="font-bold text-slate-900 text-sm">India2World Logistics Hub</div>
                    <div className="text-slate-600">Cross-Border E-Commerce & Invoicing</div>
                    <div className="text-slate-500">GSTIN / Tax ID: 07AABCU9603R1ZM</div>
                    <div className="text-slate-500">New Delhi / Dubai Gateway</div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Item / Service Description</th>
                        <th className="p-3">Store / Gateway</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedReceiptModal.items.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-900">{item.title}</td>
                          <td className="p-3 text-slate-600">{item.store}</td>
                          <td className="p-3 text-center font-bold">{item.qty}</td>
                          <td className="p-3 text-right font-medium">?{item.price.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right font-bold text-slate-900">?{item.total.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 max-w-xs ml-auto space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Products Subtotal:</span>
                    <span className="font-semibold text-slate-800">?{selectedReceiptModal.subtotalINR.toLocaleString('en-IN')}</span>
                  </div>
                  {selectedReceiptModal.domesticShippingINR > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Domestic Freight:</span>
                      <span className="font-semibold text-slate-800">?{selectedReceiptModal.domesticShippingINR.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {selectedReceiptModal.serviceFeeINR > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Procurement Fee:</span>
                      <span className="font-semibold text-slate-800">?{selectedReceiptModal.serviceFeeINR.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                    <span>Total Amount Paid:</span>
                    <span className="text-[#0066FF]">?{selectedReceiptModal.totalINR.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedReceiptModal(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => printInvoiceDocument(selectedReceiptModal)}
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Receipt</span>
                  </button>
                  <button
                    type="button"
                    disabled={downloadingId === selectedReceiptModal.id}
                    onClick={() => handleDownloadReceipt(selectedReceiptModal)}
                    className="px-5 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {downloadingId === selectedReceiptModal.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download Receipt (PDF)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Refunds View
  const paginatedRefunds = refunds.slice(
    (refundsPage - 1) * refundsPageSize,
    refundsPage * refundsPageSize
  );
  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0B1933] text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
            Customer Refunds & Adjustments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Process item returns, out-of-stock cancellations, and package weight difference reimbursements.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">Refund ID</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Customer & Order</th>
                <th className="py-3.5 px-4">Item & Reason</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Refund Amount</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedRefunds.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#0066FF] align-middle whitespace-nowrap">{r.id}</td>

                  <td className="py-3.5 px-4 align-middle">
                    <div className="font-bold text-slate-800">{r.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">Ref: {r.orderId}</div>
                  </td>

                  <td className="py-3.5 px-4 max-w-sm align-middle">
                    <div className="font-bold text-slate-800">{r.itemTitle}</div>
                    <div className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-0.5 inline-block">
                      {r.reason}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                    <div className="font-extrabold text-[#0B1933]">₹{r.amountINR.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{r.refundMethod}</div>
                  </td>

                  <td className="py-3.5 px-4 align-middle whitespace-nowrap">
                    <span
                      className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 text-xs font-bold rounded-lg border ${
                        r.status === 'Approved & Credited'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap">
                    {r.status === 'Under Review' ? (
                      <button
                        type="button"
                        onClick={() => handleApproveRefund(r.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-2xs transition-colors active:scale-95"
                      >
                        Approve Refund
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs text-slate-500 font-semibold bg-slate-100 border border-slate-200">
                        Processed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePaginationBar
          totalItems={refunds.length}
          currentPage={refundsPage}
          pageSize={refundsPageSize}
          onPageChange={setRefundsPage}
          onPageSizeChange={setRefundsPageSize}
          itemLabel="refund requests"
        />
      </div>
    </div>
  );
};
