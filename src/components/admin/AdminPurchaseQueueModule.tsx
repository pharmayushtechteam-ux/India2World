import React, { useState, useEffect } from 'react';
import {
  ListOrdered,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ShoppingBag,
  User,
  X,
  CreditCard,
  Truck,
  Building,
} from 'lucide-react';
import { AdminTab } from '../../types/admin';
import {
  getAllOrders,
  DATA_SYNC_EVENT,
} from '../../services/integratedDataService';

export interface PurchaseQueueItem {
  id: string; // PQ-801
  requestId: string;
  customerId: string;
  customerName: string;
  destination: string;
  store: 'Amazon India' | 'Myntra' | 'Flipkart' | 'Tata CliQ' | 'Ajio' | 'Nykaa';
  storeUrl: string;
  itemTitle: string;
  specs: string;
  priceINR: number;
  qty: number;
  assignedBuyer: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending Purchase' | 'Ordered' | 'Shipped by Seller' | 'Delivered to Warehouse';
  sellerOrderNumber?: string;
  sellerTracking?: string;
  paymentConfirmedAt: string;
}

const INITIAL_QUEUE: PurchaseQueueItem[] = [
  {
    id: 'PQ-801',
    requestId: 'REQ-20482',
    customerId: 'CUS-10028',
    customerName: 'Priya Sharma',
    destination: 'UAE',
    store: 'Amazon India',
    storeUrl: 'https://amazon.in/dp/B08XYZ123',
    itemTitle: 'Nike Men Air Zoom Pegasus 40 Running Shoes (Size 9)',
    specs: 'Colour: Deep Royal Blue | Size: 9 UK/India',
    priceINR: 3999,
    qty: 1,
    assignedBuyer: 'Agent Amit Kumar',
    priority: 'High',
    status: 'Pending Purchase',
    paymentConfirmedAt: 'Today, 10:15 AM',
  },
  {
    id: 'PQ-802',
    requestId: 'REQ-20482',
    customerId: 'CUS-10028',
    customerName: 'Priya Sharma',
    destination: 'UAE',
    store: 'Myntra',
    storeUrl: 'https://myntra.com/kurta-set-pink',
    itemTitle: "Anouk Women Floral Embroidered Kurta with Trousers & Dupatta",
    specs: 'Colour: Rose Pink | Size: M',
    priceINR: 1299,
    qty: 1,
    assignedBuyer: 'Agent Sneha Rao',
    priority: 'High',
    status: 'Pending Purchase',
    paymentConfirmedAt: 'Today, 10:15 AM',
  },
  {
    id: 'PQ-803',
    requestId: 'REQ-20482',
    customerId: 'CUS-10028',
    customerName: 'Priya Sharma',
    destination: 'UAE',
    store: 'Flipkart',
    storeUrl: 'https://flipkart.com/milton-bottle',
    itemTitle: 'Milton Thermosteel Flip Lid Vacuum Insulated Flask 1000ml',
    specs: 'Quantity: 2 Bottles | Stainless Steel',
    priceINR: 1598,
    qty: 2,
    assignedBuyer: 'Agent Amit Kumar',
    priority: 'Medium',
    status: 'Ordered',
    sellerOrderNumber: 'OD123987123987',
    sellerTracking: 'EKART55443322',
    paymentConfirmedAt: 'Yesterday, 04:30 PM',
  },
  {
    id: 'PQ-804',
    requestId: 'REQ-30481',
    customerId: 'CUS-10042',
    customerName: 'Rahul Mehta',
    destination: 'USA',
    store: 'Tata CliQ',
    storeUrl: 'https://tatacliq.com/fabindia-kurta',
    itemTitle: 'Fabindia Silk Blend Long Kurta with Nehru Jacket Combo',
    specs: 'Colour: Mustard Gold | Size: 42',
    priceINR: 5499,
    qty: 1,
    assignedBuyer: 'Agent Vikram Singh',
    priority: 'Medium',
    status: 'Shipped by Seller',
    sellerOrderNumber: 'TC-99221144',
    sellerTracking: 'BLUEDART448899',
    paymentConfirmedAt: '10 Nov 2024',
  },
  {
    id: 'PQ-805',
    requestId: 'REQ-30480',
    customerId: 'CUS-10019',
    customerName: 'Aaylal Verma',
    destination: 'UK',
    store: 'Nykaa',
    storeUrl: 'https://nykaa.com/kama-ayurveda',
    itemTitle: 'Kama Ayurveda Pure Rosewater Facial Toner 200ml x3',
    specs: 'Pack of 3 Bottles',
    priceINR: 3750,
    qty: 3,
    assignedBuyer: 'Agent Sneha Rao',
    priority: 'Low',
    status: 'Ordered',
    sellerOrderNumber: 'NYK-4400192',
    sellerTracking: 'DELHIVERY887711',
    paymentConfirmedAt: '09 Nov 2024',
  },
];

const buildQueueList = (): PurchaseQueueItem[] => {
  const orders = getAllOrders();
  const queue: PurchaseQueueItem[] = [...INITIAL_QUEUE];
  const existingIds = new Set(queue.map((q) => q.requestId));

  orders.forEach((order) => {
    if (order.orderStatus === 'Procuring' && !existingIds.has(order.id)) {
      order.items.forEach((item, idx) => {
        queue.unshift({
          id: `PQ-${order.id.replace('ORD-', '')}-${idx + 1}`,
          requestId: order.id,
          customerId: order.customerId,
          customerName: order.customerName,
          destination: order.destination,
          store: (item.store as any) || 'Amazon India',
          storeUrl: 'https://www.amazon.in',
          itemTitle: item.title,
          specs: `Qty: ${item.qty}`,
          priceINR: item.price,
          qty: item.qty,
          assignedBuyer: 'Agent Amit Kumar',
          priority: 'High',
          status: 'Pending Purchase',
          paymentConfirmedAt: order.createdAt || 'Today',
        });
      });
      existingIds.add(order.id);
    }
  });

  return queue;
};

export const AdminPurchaseQueueModule: React.FC<{
  onNavigateTab: (tab: AdminTab, params?: any) => void;
}> = ({ onNavigateTab }) => {
  const [items, setItems] = useState<PurchaseQueueItem[]>(() => buildQueueList());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedItemForOrder, setSelectedItemForOrder] = useState<PurchaseQueueItem | null>(null);
  const [sellerOrderInput, setSellerOrderInput] = useState('');
  const [sellerTrackingInput, setSellerTrackingInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setItems(buildQueueList());
    };
    window.addEventListener(DATA_SYNC_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(DATA_SYNC_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForOrder) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedItemForOrder.id
          ? {
              ...item,
              status: 'Ordered',
              sellerOrderNumber: sellerOrderInput || 'ORD-' + Math.floor(100000 + Math.random() * 900000),
              sellerTracking: sellerTrackingInput || 'TRK-' + Math.floor(100000 + Math.random() * 900000),
            }
          : item
      )
    );

    triggerToast(`Order placed for ${selectedItemForOrder.id} (${selectedItemForOrder.store})!`);
    setSelectedItemForOrder(null);
    setSellerOrderInput('');
    setSellerTrackingInput('');
  };

  const filtered = items.filter((item) => {
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesSearch =
      !search ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.itemTitle.toLowerCase().includes(search.toLowerCase()) ||
      item.store.toLowerCase().includes(search.toLowerCase()) ||
      item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.assignedBuyer.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = items.filter((i) => i.status === 'Pending Purchase').length;
  const orderedCount = items.filter((i) => i.status === 'Ordered').length;
  const inTransitCount = items.filter((i) => i.status === 'Shipped by Seller').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0B1933] text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
              Assisted Purchase Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
            Purchase Queue (Procurement)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Customer-funded orders awaiting procurement by in-house shopping agents across Indian online stores.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Awaiting Procurement</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">{pendingCount}</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Urgent</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Payment verified & locked in escrow</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Ordered Today</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">{orderedCount}</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Placed</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Seller order IDs confirmed</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">In Domestic Transit</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">{inTransitCount}</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">To Warehouse</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Expected delivery in 1-2 days</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Procurement SLA</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">&lt; 4 hrs</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Target Met</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">98.2% purchased same-day</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {['All', 'Pending Purchase', 'Ordered', 'Shipped by Seller'].map((status) => (
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
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items, store, buyer..."
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-[#0066FF] focus:bg-white"
          />
        </div>
      </div>

      {/* Procurement Cards Grid */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:border-[#0066FF] transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            {/* Left Info */}
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold px-2.5 py-0.5 bg-blue-50 text-[#0066FF] rounded-md border border-blue-200">
                  {item.store}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">{item.id}</span>
                <span className="text-xs font-medium text-slate-500">Ref: {item.requestId}</span>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    item.priority === 'High'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {item.priority} Priority
                </span>
              </div>

              <h3 className="font-extrabold text-sm sm:text-base text-[#0B1933]">
                {item.itemTitle}
              </h3>

              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                <span>{item.specs}</span>
                <span>&bull;</span>
                <span>Qty: <strong className="text-slate-800">{item.qty}</strong></span>
                <span>&bull;</span>
                <span>Customer: <strong className="text-slate-800">{item.customerName}</strong> ({item.destination})</span>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-0.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Assigned Buyer: <strong className="text-slate-700">{item.assignedBuyer}</strong></span>
                <span>&bull;</span>
                <span>Paid: {item.paymentConfirmedAt}</span>
              </div>

              {item.sellerOrderNumber && (
                <div className="text-xs font-mono bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 inline-flex items-center gap-2 mt-1">
                  <span>Seller Order: <strong>{item.sellerOrderNumber}</strong></span>
                  {item.sellerTracking && <span>| Courier AWB: <strong>{item.sellerTracking}</strong></span>}
                </div>
              )}
            </div>

            {/* Right Price & Actions */}
            <div className="flex sm:items-center justify-between lg:justify-end gap-4 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
              <div className="text-left lg:text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Total Purchase Cost</div>
                <div className="text-xl font-extrabold text-[#0B1933]">
                  ₹{item.priceINR.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.status === 'Pending Purchase' ? (
                  <button
                    onClick={() => setSelectedItemForOrder(item)}
                    className="px-4 py-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer touch-manipulation whitespace-nowrap"
                  >
                    Mark as Ordered
                  </button>
                ) : (
                  <span className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{item.status}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mark Ordered Modal */}
      {selectedItemForOrder && (
        <div
          onClick={() => setSelectedItemForOrder(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-[#0B1933]">Log Merchant Purchase</h3>
              <button
                onClick={() => setSelectedItemForOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Confirm purchase on <strong>{selectedItemForOrder.store}</strong> for item: {selectedItemForOrder.itemTitle}
            </p>

            <form onSubmit={handleConfirmOrder} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Merchant Order ID / Invoice Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 408-1234567-8901234 (Amazon) / MYN-998811"
                  value={sellerOrderInput}
                  onChange={(e) => setSellerOrderInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Domestic Courier & Tracking ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. BlueDart / Delhivery AWB 9988771122"
                  value={sellerTrackingInput}
                  onChange={(e) => setSellerTrackingInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedItemForOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] rounded-xl cursor-pointer"
                >
                  Confirm & Move to Inbound
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
