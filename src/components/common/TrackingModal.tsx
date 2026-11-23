import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  Package,
  Loader2,
  ShoppingBag,
  FileText,
  RefreshCw,
  Lock,
  UserCheck,
} from 'lucide-react';
import { getSessionToken, isUserAuthenticated, USER_CHANGED_EVENT } from '../../utils/userAuth';
import { formatINR } from '../../utils/currency';

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrackingNumber?: string;
  onRequireAuth?: () => void;
}

interface TrackingMilestone {
  stepNumber: number;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  completed: boolean;
  current: boolean;
}

interface TrackingProductItem {
  name: string;
  store: string;
  qty: number;
  priceINR: number;
  imageUrl?: string;
}

interface RealTrackingRecord {
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

interface TrackingSummaryItem {
  id: string;
  recordType: RealTrackingRecord['recordType'];
  status: string;
  date: string;
  itemsCount: number;
}

const getStatusBadgeClasses = (status: string): string => {
  const s = (status || '').toLowerCase();
  if (s.includes('deliver') || s.includes('complet')) {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
  if (s.includes('transit') || s.includes('dispatch') || s.includes('shipped')) {
    return 'bg-blue-100 text-[#0066FF] border-blue-200';
  }
  if (s.includes('quote') || s.includes('review') || s.includes('new')) {
    return 'bg-amber-100 text-amber-800 border-amber-200';
  }
  return 'bg-indigo-100 text-indigo-700 border-indigo-200';
};

export const TrackingModal: React.FC<TrackingModalProps> = ({
  isOpen,
  onClose,
  initialTrackingNumber = '',
  onRequireAuth,
}) => {
  const [searchCode, setSearchCode] = useState(initialTrackingNumber);
  const [recentRecords, setRecentRecords] = useState<TrackingSummaryItem[]>([]);
  const [activeCustomer, setActiveCustomer] = useState<{
    customerId: string;
    name: string;
    email: string;
  } | null>(null);
  const [requiresAuth, setRequiresAuth] = useState<boolean>(() => !isUserAuthenticated());
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingLookup, setLoadingLookup] = useState(false);
  const [trackedRecord, setTrackedRecord] = useState<RealTrackingRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const buildAuthHeaders = (): HeadersInit => {
    const token = getSessionToken();
    return token ? { Authorization: `Bearer ${token}`, 'x-session-token': token } : {};
  };

  const fetchTrackingLookup = useCallback(async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) {
      setErrorMsg('Please enter an Order ID, Request ID, Invoice Number, or AWB tracking number.');
      return;
    }

    setLoadingLookup(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/tracking/lookup?code=${encodeURIComponent(code)}`, {
        headers: buildAuthHeaders(),
      });
      const data = await res.json();

      if (res.status === 401 || data.requiresAuth) {
        setRequiresAuth(true);
        setTrackedRecord(null);
        setRecentRecords([]);
        setActiveCustomer(null);
        setErrorMsg('');
        return;
      }

      if (res.ok && data.found && data.record) {
        setTrackedRecord(data.record);
        setErrorMsg('');
      } else {
        setTrackedRecord(null);
        setErrorMsg(
          data.error ||
            `No order or request found under your account matching "${code.toUpperCase()}".`
        );
      }
    } catch {
      setTrackedRecord(null);
      setErrorMsg('Unable to reach the tracking backend right now. Please try again.');
    } finally {
      setLoadingLookup(false);
    }
  }, []);

  const loadRecentRecords = useCallback(async () => {
    if (!isUserAuthenticated() || !getSessionToken()) {
      setRequiresAuth(true);
      setRecentRecords([]);
      setActiveCustomer(null);
      setTrackedRecord(null);
      return;
    }

    setLoadingRecords(true);
    try {
      const res = await fetch('/api/tracking/records', {
        headers: buildAuthHeaders(),
      });
      const data = await res.json();

      if (res.status === 401 || data?.requiresAuth) {
        setRequiresAuth(true);
        setRecentRecords([]);
        setActiveCustomer(null);
        setTrackedRecord(null);
        return;
      }

      if (res.ok && data && Array.isArray(data.records)) {
        setRequiresAuth(false);
        setRecentRecords(data.records);
        setActiveCustomer(data.customer || null);
      }
    } catch {
      setRecentRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  // Reset tracking state immediately if customer logs out or switches accounts
  useEffect(() => {
    const handleUserChanged = () => {
      setTrackedRecord(null);
      setRecentRecords([]);
      setActiveCustomer(null);
      setErrorMsg('');
      setRequiresAuth(!isUserAuthenticated() || !getSessionToken());
    };
    window.addEventListener(USER_CHANGED_EVENT, handleUserChanged);
    return () => window.removeEventListener(USER_CHANGED_EVENT, handleUserChanged);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadRecentRecords();

    const cleanInitial = (initialTrackingNumber || '').trim();
    setSearchCode(cleanInitial);
    setErrorMsg('');

    if (cleanInitial && isUserAuthenticated() && getSessionToken()) {
      fetchTrackingLookup(cleanInitial);
    } else {
      setTrackedRecord(null);
    }
  }, [isOpen, initialTrackingNumber, loadRecentRecords, fetchTrackingLookup]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrackingLookup(searchCode);
  };

  const handleQuickSelect = (id: string) => {
    setSearchCode(id);
    fetchTrackingLookup(id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-100 text-[#0066FF] flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate">
                Track Your Order &amp; Shipment
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Live backend status from order confirmation to worldwide delivery
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tracking modal"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[78vh] overflow-y-auto overflow-x-hidden">
          {requiresAuth ? (
            <div className="border border-slate-200 rounded-2xl p-6 sm:p-8 text-center bg-slate-50/70 space-y-3.5">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-[#0066FF] flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">
                Login Required to Track Your Orders
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                For your privacy and security, tracking details are only shown for the customer account currently signed in. Please log in to view and track your orders and shipments.
              </p>
              <div className="pt-1 flex items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onRequireAuth) {
                      onRequireAuth();
                    } else {
                      onClose();
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-bold text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
                >
                  Login / Sign Up
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Logged-in Customer Identity Pill */}
              {activeCustomer && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <UserCheck className="w-4 h-4 text-[#0066FF] shrink-0" />
                    <span className="text-slate-700 truncate">
                      Signed in as <strong className="text-slate-900">{activeCustomer.name}</strong>{' '}
                      <span className="text-slate-500">({activeCustomer.email})</span>
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-[11px] font-mono font-bold text-[#0066FF] shrink-0">
                    {activeCustomer.customerId}
                  </span>
                </div>
              )}

              {/* Search Box */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 min-w-0">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    placeholder="Enter your Order ID, Request ID, Invoice, or AWB"
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loadingLookup}
                  className="bg-[#0066FF] hover:bg-[#0052CC] disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {loadingLookup ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>{loadingLookup ? 'Searching...' : 'Track'}</span>
                </button>
              </form>

              {/* Logged-in Customer's Own Backend Records Quick Selector */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] sm:text-xs font-bold text-slate-600">
                    Your Orders &amp; Requests:
                  </span>
                  <button
                    type="button"
                    onClick={loadRecentRecords}
                    disabled={loadingRecords}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0066FF] hover:text-blue-800 cursor-pointer"
                    title="Refresh your orders"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingRecords ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {loadingRecords && recentRecords.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0066FF]" />
                    <span>Loading your orders from backend...</span>
                  </div>
                ) : recentRecords.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {recentRecords.map((rec) => {
                      const isActive = trackedRecord?.trackingId === rec.id;
                      return (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => handleQuickSelect(rec.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-[#0066FF]'
                          }`}
                        >
                          <span className="font-bold">{rec.id}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    No orders or requests found under your account yet. Place a Buy For Me or External Purchase order to track it live here.
                  </p>
                )}
              </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-red-700 bg-red-50 p-3.5 rounded-xl border border-red-200 max-w-full overflow-hidden">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span className="min-w-0 flex-1 break-words [overflow-wrap:anywhere] leading-relaxed">
                {errorMsg}
              </span>
            </div>
          )}

          {/* Real Backend Record Result */}
          {trackedRecord ? (
            <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-gradient-to-br from-blue-50/35 via-white to-slate-50/70 space-y-4">
              {/* Top Summary Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-base sm:text-lg">
                      {trackedRecord.trackingId}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-[#0066FF]">
                      {trackedRecord.recordType}
                    </span>
                    {trackedRecord.invoiceNumber && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                        <FileText className="w-3 h-3" />
                        {trackedRecord.invoiceNumber}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5 space-y-0.5">
                    <div>
                      Destination:{' '}
                      <strong className="text-slate-700">
                        {trackedRecord.destinationCity === trackedRecord.destinationCountry
                          ? trackedRecord.destinationCountry
                          : `${trackedRecord.destinationCity}, ${trackedRecord.destinationCountry}`}
                      </strong>
                    </div>
                    <div>
                      Placed On: <strong className="text-slate-700">{trackedRecord.orderDate}</strong>
                      {trackedRecord.stores.length > 0 && (
                        <>
                          {' '}• Store(s):{' '}
                          <strong className="text-slate-700">{trackedRecord.stores.join(', ')}</strong>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClasses(
                      trackedRecord.status
                    )}`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    {trackedRecord.status}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium max-w-[240px]">
                    {trackedRecord.estimatedDelivery}
                  </div>
                </div>
              </div>

              {/* Order Stats */}
              <div className="grid grid-cols-3 gap-2 py-2.5 px-2 rounded-xl bg-white border border-slate-100 text-center text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Items Ordered</span>
                  <strong className="text-slate-800 text-xs sm:text-sm">
                    {trackedRecord.itemsCount} {trackedRecord.itemsCount === 1 ? 'item' : 'items'}
                  </strong>
                </div>
                <div className="border-x border-slate-100 px-1">
                  <span className="text-slate-400 block text-[11px]">
                    Order Total {trackedRecord.paymentStatus ? `(${trackedRecord.paymentStatus})` : ''}
                  </span>
                  <strong className="text-slate-800 text-xs sm:text-sm">
                    {trackedRecord.totalAmountINR > 0
                      ? formatINR(trackedRecord.totalAmountINR)
                      : 'Pending Quote'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Dispatch / Carrier</span>
                  <strong className="text-slate-800 text-xs sm:text-sm truncate block">
                    {trackedRecord.trackingAwb || trackedRecord.carrier}
                  </strong>
                </div>
              </div>

              {/* Actual Ordered Products */}
              {trackedRecord.products.length > 0 && (
                <div>
                  <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Actual Order Items ({trackedRecord.products.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {trackedRecord.products.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-slate-100"
                      >
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0 bg-slate-50"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-[13px] font-bold text-slate-800 line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {item.store} • Qty: <strong className="text-slate-700">{item.qty}</strong>
                          </p>
                        </div>
                        {item.priceINR > 0 && (
                          <div className="text-xs font-extrabold text-slate-900 shrink-0">
                            {formatINR(item.priceINR * item.qty)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Real Step-by-Step Order Process & Tracking History */}
              <div className="pt-1">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-400 mb-3.5">
                  Actual Order Process &amp; Tracking Milestones
                </h4>
                <div className="relative pl-7 space-y-4 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {trackedRecord.timeline.map((step) => (
                    <div key={step.stepNumber} className="relative">
                      <div
                        className={`absolute -left-7 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white text-[10px] font-extrabold ${
                          step.completed
                            ? 'bg-[#0066FF] text-white'
                            : step.current
                            ? 'bg-blue-100 text-[#0066FF] border-2 border-[#0066FF]'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {step.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <span>{step.stepNumber}</span>
                        )}
                      </div>

                      <div
                        className={`rounded-xl p-2.5 transition-colors ${
                          step.current
                            ? 'bg-blue-50/70 border border-blue-200/80'
                            : 'bg-transparent'
                        }`}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={`text-xs sm:text-sm font-bold ${
                              step.completed || step.current ? 'text-slate-900' : 'text-slate-500'
                            }`}
                          >
                            {step.title}
                          </p>
                          {step.current && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0066FF] text-white uppercase tracking-wide">
                              Current Stage
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                          {step.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{step.location}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{step.timestamp}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            !errorMsg &&
            !loadingLookup && (
              <div className="border border-dashed border-slate-200 rounded-xl p-5 sm:p-6 text-center bg-slate-50/60 space-y-2.5">
                <div className="w-11 h-11 rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                  Enter Your Real Order or Request ID
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Search any confirmed Order ID (<code className="font-semibold text-slate-700">ORD-...</code>),
                  Buy For Me Request (<code className="font-semibold text-slate-700">REQ-...</code>),
                  External Request (<code className="font-semibold text-slate-700">EPR-...</code>),
                  Invoice Number, or select one of your live backend records above to see the actual order items and step-by-step fulfillment progress.
                </p>
              </div>
            )
          )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
