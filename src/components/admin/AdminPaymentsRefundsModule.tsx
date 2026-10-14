import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  RotateCcw,
  Search,
  Filter,
  Download,
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
  processRefund,
  DATA_SYNC_EVENT,
  PaymentTransaction,
  RefundRequest,
} from '../../services/integratedDataService';
import { TablePaginationBar } from './TablePaginationBar';

export const AdminPaymentsRefundsModule: React.FC<{
  tab: 'payments' | 'refunds';
  onNavigateTab: (tab: AdminTab, params?: any) => void;
}> = ({ tab, onNavigateTab }) => {
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => getAllPayments());
  const [refunds, setRefunds] = useState<RefundRequest[]>(() => getAllRefunds());
  const [search, setSearch] = useState('');
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
                  <th className="py-3.5 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-[#0066FF] font-mono">{p.id}</div>
                      <div className="text-[11px] text-slate-400">{p.paymentDate}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-800">{p.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">Ref: {p.referenceId}</div>
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-700">
                      {p.purpose}
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        {p.gateway}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-extrabold text-[#0B1933]">₹{p.amountINR.toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-slate-500 font-semibold">{p.amountForeign}</div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {p.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => triggerToast(`Downloaded receipt for ${p.id}`)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                        title="Download Tax Receipt"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
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
                <th className="py-3.5 px-4">Refund ID</th>
                <th className="py-3.5 px-4">Customer & Order</th>
                <th className="py-3.5 px-4">Item & Reason</th>
                <th className="py-3.5 px-4">Refund Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedRefunds.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-[#0066FF]">{r.id}</td>

                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-800">{r.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">Ref: {r.orderId}</div>
                  </td>

                  <td className="py-4 px-4 max-w-sm">
                    <div className="font-bold text-slate-800">{r.itemTitle}</div>
                    <div className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-0.5 inline-block">
                      {r.reason}
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="font-extrabold text-[#0B1933]">₹{r.amountINR.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-slate-400">{r.refundMethod}</div>
                  </td>

                  <td className="py-4 px-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                        r.status === 'Approved & Credited'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-right">
                    {r.status === 'Under Review' ? (
                      <button
                        onClick={() => handleApproveRefund(r.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Approve Refund
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold">Processed</span>
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
