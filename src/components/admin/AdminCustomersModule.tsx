import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Eye,
  X,
  Building,
  ShieldCheck,
  Package,
  RefreshCw,
  Trash2,
  ShoppingBag,
  FileText,
  Clock,
  Truck,
  ArrowRight,
  Copy,
  Check,
  Tag,
  CreditCard,
  DollarSign,
  AlertCircle,
  Layers,
} from 'lucide-react';
import {
  getAllCustomers,
  saveCustomers,
  deduplicateCustomers,
  getAllOrders,
  getAllPurchaseRequests,
  IntegratedOrderRecord,
  DATA_SYNC_EVENT,
} from '../../services/integratedDataService';
import {
  getAllInvoices,
  CustomerOrderInvoice,
} from '../../services/orderInvoiceService';
import { AdminCustomer, AdminTab, AdminPurchaseRequest } from '../../types/admin';
import { TablePaginationBar } from './TablePaginationBar';

export const AdminCustomersModule: React.FC<{
  onNavigateTab: (tab: AdminTab, params?: any) => void;
}> = ({ onNavigateTab }) => {
  const [customers, setCustomers] = useState<AdminCustomer[]>(() => getAllCustomers());
  const [orders, setOrders] = useState<IntegratedOrderRecord[]>(() => getAllOrders());
  const [invoices, setInvoices] = useState<CustomerOrderInvoice[]>(() => getAllInvoices());
  const [requests, setRequests] = useState<AdminPurchaseRequest[]>(() => getAllPurchaseRequests());
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [modalTab, setModalTab] = useState<'products' | 'requests' | 'locker'>('products');
  const [copiedLocker, setCopiedLocker] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination states (5 to 8 items per page, default 6)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(6);

  useEffect(() => {
    const handleSync = () => {
      setCustomers(getAllCustomers());
      setOrders(getAllOrders());
      setInvoices(getAllInvoices());
      setRequests(getAllPurchaseRequests());
    };
    window.addEventListener(DATA_SYNC_EVENT, handleSync);
    window.addEventListener('i2w-invoices-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(DATA_SYNC_EVENT, handleSync);
      window.removeEventListener('i2w-invoices-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleDeduplicate = () => {
    const initialLen = customers.length;
    const cleaned = deduplicateCustomers(customers);
    const removed = initialLen - cleaned.length;
    saveCustomers(cleaned);
    setCustomers(cleaned);
    if (removed > 0) {
      triggerToast(`✅ Successfully removed ${removed} duplicate customer registration${removed > 1 ? 's' : ''}!`);
    } else {
      triggerToast('✅ All customer registrations are unique and verified. Zero duplicates found.');
    }
  };

  const handleDeleteCustomer = (customerId: string, customerName: string) => {
    if (confirm(`Remove customer registration for ${customerName} (Locker #${customerId})?`)) {
      const updated = customers.filter((c) => c.id !== customerId);
      saveCustomers(updated);
      setCustomers(updated);
      triggerToast(`Removed customer ${customerName} from registry.`);
    }
  };

  const handleCopyLocker = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLocker(true);
    setTimeout(() => setCopiedLocker(false), 2000);
    triggerToast('Indian Locker Address copied to clipboard!');
  };

  // Helper to resolve an image for a product item if imageUrl is empty
  const getItemImage = (item: { title: string; store: string; imageUrl?: string }) => {
    if (item.imageUrl && item.imageUrl.startsWith('http')) return item.imageUrl;
    const t = (item.title || '').toLowerCase();
    if (t.includes('shoe') || t.includes('sneaker') || t.includes('puma') || t.includes('nike') || t.includes('sparx')) {
      return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&auto=format&fit=crop&q=80';
    }
    if (t.includes('kurta') || t.includes('linen') || t.includes('saree') || t.includes('silk') || t.includes('ethnic')) {
      return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=160&auto=format&fit=crop&q=80';
    }
    if (t.includes('tea') || t.includes('herbal') || t.includes('spice') || t.includes('organic') || t.includes('food')) {
      return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=160&auto=format&fit=crop&q=80';
    }
    if (t.includes('earbud') || t.includes('headphone') || t.includes('boat') || t.includes('oneplus') || t.includes('audio')) {
      return 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=160&auto=format&fit=crop&q=80';
    }
    if (t.includes('shampoo') || t.includes('cream') || t.includes('biotique') || t.includes('beauty') || t.includes('serum')) {
      return 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=160&auto=format&fit=crop&q=80';
    }
    if (t.includes('brass') || t.includes('holder') || t.includes('diya') || t.includes('incense') || t.includes('decor')) {
      return 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=160&auto=format&fit=crop&q=80';
    }
    if (t.includes('jacket') || t.includes('denim') || t.includes('shirt') || t.includes('pants') || t.includes('wear')) {
      return 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=160&auto=format&fit=crop&q=80';
    }
    if (t.includes('trolley') || t.includes('bag') || t.includes('suitcase') || t.includes('luggage') || t.includes('aristocrat')) {
      return 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=160&auto=format&fit=crop&q=80';
    }
    if (t.includes('watch') || t.includes('strap') || t.includes('seiko')) {
      return 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=160&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=160&auto=format&fit=crop&q=80';
  };

  // Helper to dynamically calculate orders, spend, and items taken by any customer
  const getCustomerProfileData = (c: AdminCustomer) => {
    const cId = (c.id || '').trim().toLowerCase();
    const cEmail = (c.email || '').trim().toLowerCase();
    const cName = (c.name || '').trim().toLowerCase();

    // Match orders
    const cOrders = orders.filter((o) => {
      const idMatch = cId && o.customerId && o.customerId.toLowerCase() === cId;
      const emailMatch = cEmail && o.customerEmail && o.customerEmail.toLowerCase() === cEmail;
      const nameMatch = cName && o.customerName && o.customerName.toLowerCase() === cName;
      return idMatch || emailMatch || nameMatch;
    });

    // Match invoices
    const cInvoices = invoices.filter((inv) => {
      const idMatch = cId && inv.customerId && inv.customerId.toLowerCase() === cId;
      const emailMatch = cEmail && inv.customerEmail && inv.customerEmail.toLowerCase() === cEmail;
      const nameMatch = cName && inv.customerName && inv.customerName.toLowerCase() === cName;
      return idMatch || emailMatch || nameMatch;
    });

    // Match purchase requests
    const cRequests = requests.filter((r) => {
      const idMatch = cId && r.customerId && r.customerId.toLowerCase() === cId;
      const emailMatch = cEmail && (r as any).customerEmail && (r as any).customerEmail.toLowerCase() === cEmail;
      const nameMatch = cName && r.customerName && r.customerName.toLowerCase() === cName;
      return idMatch || emailMatch || nameMatch;
    });

    // Merge any invoices whose orderId isn't already present in cOrders
    const orderIds = new Set(cOrders.map((o) => o.id));
    const extraInvoiceOrders: IntegratedOrderRecord[] = cInvoices
      .filter((inv) => !orderIds.has(inv.orderId))
      .map((inv) => ({
        id: inv.orderId || inv.invoiceNumber,
        customerId: inv.customerId,
        customerName: inv.customerName,
        customerEmail: inv.customerEmail,
        customerAvatar: c.avatar,
        destination: `${c.city}, ${c.country}`,
        destinationFlag: '🌐',
        orderType: 'Assisted Purchase (Buy For Me)',
        stores: Array.from(new Set((inv.items || []).map((it) => it.store || 'Online Store'))),
        itemCount: (inv.items || []).reduce((acc, it) => acc + (it.qty || 1), 0),
        totalINR: inv.totalINR || 0,
        paymentStatus: 'Paid',
        orderStatus: 'Procuring',
        createdAt: inv.createdAt || 'Recent',
        items: (inv.items || []).map((it: any) => ({
          title: it.title || it.description || 'Product Item',
          store: it.store || 'Online Store',
          price: it.price || it.unitPriceINR || 0,
          qty: it.qty || 1,
          imageUrl: it.imageUrl,
        })),
      }));

    const allCustomerOrders = [...cOrders, ...extraInvoiceOrders];

    // Compute live order counts and total spent accurately
    const totalOrdersCount = Math.max(c.totalOrders || 0, allCustomerOrders.length);
    const computedTotalSpent = Math.max(
      c.totalSpentINR || 0,
      allCustomerOrders.reduce((sum, o) => sum + (o.totalINR || 0), 0)
    );

    // Compute total product items count taken
    const totalProductsCount = allCustomerOrders.reduce(
      (sum, o) =>
        sum + (o.items && o.items.length > 0 ? o.items.reduce((s, it) => s + (it.qty || 1), 0) : (o.itemCount || 0)),
      0
    );

    return {
      orders: allCustomerOrders,
      requests: cRequests,
      invoices: cInvoices,
      totalOrdersCount,
      totalSpentINR: computedTotalSpent,
      totalProductsCount,
    };
  };

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  const paginatedCustomers = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Global aggregate metrics across all orders and customers
  const totalAllOrdersCount = orders.length;
  const totalAllRevenue = orders.reduce((sum, o) => sum + (o.totalINR || 0), 0);
  const totalAllProductsTaken = orders.reduce(
    (sum, o) => sum + (o.items && o.items.length > 0 ? o.items.reduce((s, it) => s + (it.qty || 1), 0) : (o.itemCount || 0)),
    0
  );

  const selectedStats = selectedCustomer ? getCustomerProfileData(selectedCustomer) : null;

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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
            Registered Global Customers & Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Full visibility into customer profiles, total orders, spent amounts, and exact products purchased.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDeduplicate}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            title="Clean up and remove duplicate registrations"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Remove Duplicate Registrations</span>
          </button>
          <button
            onClick={() => onNavigateTab('purchase-requests')}
            className="px-4 py-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            <span>View Purchase Queue</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Active Locker Accounts</span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0B1933]">{customers.length.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">Across {new Set(customers.map((c) => c.country)).size} countries (Live)</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Total Customer Orders</span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0066FF]">{totalAllOrdersCount.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-blue-600 font-bold mt-1">Confirmed customer orders placed</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Total Orders Value</span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600">₹{totalAllRevenue.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-700 font-bold mt-1">Lifetime customer spend captured</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500">Total Products Taken</span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0B1933]">{totalAllProductsTaken.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">Items ordered from Indian stores</div>
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
            placeholder="Search Customer Name, Locker ID, Country..."
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-[#0066FF] focus:bg-white"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing <strong>{filtered.length}</strong> customer{filtered.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Customer & Locker</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Destination</th>
                <th className="py-3.5 px-4 text-center">Total Orders</th>
                <th className="py-3.5 px-4">Total Amount Spent</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedCustomers.map((c) => {
                const stats = getCustomerProfileData(c);
                return (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.avatar}
                          alt={c.name}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 bg-slate-100"
                        />
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                          <div className="text-xs font-mono text-[#0066FF] font-bold">Locker #{c.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-slate-700 font-medium">{c.email}</div>
                      <div className="text-[11px] text-slate-400">{c.phone}</div>
                    </td>

                    <td className="py-4 px-4 font-bold text-slate-700">
                      {c.country} ({c.city})
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="font-extrabold text-sm text-[#0B1933]">{stats.totalOrdersCount}</div>
                      {stats.totalProductsCount > 0 ? (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {stats.totalProductsCount} item{stats.totalProductsCount > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">0 items</span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-extrabold text-sm text-[#0066FF]">
                        ₹{stats.totalSpentINR.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">INR Verified</span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {c.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedCustomer(c);
                            setModalTab('products');
                          }}
                          className="px-3 py-1.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl cursor-pointer shadow-2xs transition-all flex items-center gap-1"
                          title="View complete customer profile, order history, and products taken"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Profile & Products</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c.id, c.name)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl cursor-pointer transition-colors"
                          title="Remove Duplicate Registration"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <TablePaginationBar
          totalItems={filtered.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="customers"
        />
      </div>

      {/* Comprehensive Customer Profile & Products Taken Modal */}
      {selectedCustomer && selectedStats && (
        <div
          onClick={() => setSelectedCustomer(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start sm:items-center justify-between gap-4 bg-slate-50/60">
              <div className="flex items-center gap-3 sm:gap-4">
                <img
                  src={selectedCustomer.avatar}
                  alt={selectedCustomer.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-white shadow-xs bg-white"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-extrabold text-[#0B1933]">{selectedCustomer.name}</h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active Account
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                    <span className="font-mono font-bold text-[#0066FF]">Locker #{selectedCustomer.id}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {selectedCustomer.email}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedCustomer.city}, {selectedCustomer.country}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-9 h-9 rounded-full bg-white hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer shadow-xs transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* 4 Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 text-center">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">TOTAL ORDERS</span>
                  <span className="font-extrabold text-xl sm:text-2xl text-[#0B1933] mt-0.5 block">
                    {selectedStats.totalOrdersCount}
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium">Confirmed Orders</span>
                </div>

                <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-100 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">TOTAL SPENT</span>
                  <span className="font-extrabold text-xl sm:text-2xl text-emerald-700 mt-0.5 block">
                    ₹{selectedStats.totalSpentINR.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-medium">Captured INR Total</span>
                </div>

                <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-center">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">PRODUCTS TAKEN</span>
                  <span className="font-extrabold text-xl sm:text-2xl text-indigo-900 mt-0.5 block">
                    {selectedStats.totalProductsCount}
                  </span>
                  <span className="text-[10px] text-indigo-600 font-medium">Total Items Ordered</span>
                </div>

                <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-100 text-center">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">PURCHASE REQUESTS</span>
                  <span className="font-extrabold text-xl sm:text-2xl text-purple-900 mt-0.5 block">
                    {selectedStats.requests.length}
                  </span>
                  <span className="text-[10px] text-purple-600 font-medium">Assisted Quotations</span>
                </div>
              </div>

              {/* Locker Address Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-[#0066FF]" />
                    <span className="font-bold text-[#0066FF] uppercase text-[11px] tracking-wider">
                      Assigned Indian Delivery Locker Address
                    </span>
                  </div>
                  <div className="font-mono text-slate-700 leading-relaxed text-xs">
                    <strong>{selectedCustomer.name} (Locker #{selectedCustomer.id})</strong>, India2World Logistics Hub, Bay 4, Marol MIDC, Andheri East, Mumbai, Maharashtra 400093, INDIA (Phone: +91 98765 43210)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyLocker(
                      `${selectedCustomer.name} (Locker #${selectedCustomer.id})\nIndia2World Logistics Hub, Bay 4\nMarol MIDC, Andheri East\nMumbai, Maharashtra 400093, INDIA\nPhone: +91 98765 43210`
                    )
                  }
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer shadow-2xs flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  {copiedLocker ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedLocker ? 'Copied' : 'Copy Locker'}</span>
                </button>
              </div>

              {/* Navigation Tabs inside modal */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  type="button"
                  onClick={() => setModalTab('products')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    modalTab === 'products'
                      ? 'bg-[#0066FF] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Products Taken & Orders ({selectedStats.orders.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('requests')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    modalTab === 'requests'
                      ? 'bg-[#0066FF] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Assisted Purchase Requests ({selectedStats.requests.length})</span>
                </button>
              </div>

              {/* TAB 1: ALL PRODUCTS CUSTOMER HAS TAKEN / ORDERED */}
              {modalTab === 'products' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-[#0B1933] flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#0066FF]" />
                      <span>All Products Taken & Confirmed Customer Orders</span>
                    </h4>
                    <span className="text-xs text-slate-500">
                      Total: <strong>{selectedStats.totalProductsCount}</strong> product item{selectedStats.totalProductsCount === 1 ? '' : 's'} across {selectedStats.orders.length} order{selectedStats.orders.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {selectedStats.orders.length > 0 ? (
                    <div className="space-y-4">
                      {selectedStats.orders.map((order) => (
                        <div
                          key={order.id}
                          className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all hover:border-slate-300"
                        >
                          {/* Order Card Header */}
                          <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {order.id}
                              </span>
                              <span className="text-slate-500">• {order.createdAt}</span>
                              <span className="px-2 py-0.5 font-bold rounded-md bg-blue-100 text-blue-800 text-[10px]">
                                {order.orderStatus}
                              </span>
                              <span className="px-2 py-0.5 font-bold rounded-md bg-emerald-100 text-emerald-800 text-[10px]">
                                {order.paymentStatus}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block uppercase font-bold">Order Total</span>
                                <span className="font-extrabold text-[#0B1933] text-sm">
                                  ₹{order.totalINR.toLocaleString('en-IN')}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(null);
                                  onNavigateTab('orders', { search: order.id });
                                }}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#0066FF] border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <span>Manage Order</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* List of Products inside this Order */}
                          <div className="p-4 space-y-3">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Products Customer Purchased ({order.items?.length || 0} unique lines):
                            </div>
                            <div className="divide-y divide-slate-100">
                              {(order.items || []).map((item, idx) => {
                                const imgSrc = getItemImage(item);
                                const lineTotal = (item.price || 0) * (item.qty || 1);
                                return (
                                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-white shrink-0 flex items-center justify-center p-1">
                                        <img
                                          src={imgSrc}
                                          alt={item.title}
                                          referrerPolicy="no-referrer"
                                          loading="lazy"
                                          className="w-full h-full object-contain"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                              'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=120&auto=format&fit=crop&q=80';
                                          }}
                                        />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-xs font-bold text-slate-800 line-clamp-1">{item.title}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                            {item.store || 'Indian Store'}
                                          </span>
                                          <span className="text-[11px] text-slate-500 font-medium">
                                            Qty: <strong className="text-slate-800">{item.qty || 1}</strong>
                                          </span>
                                          <span className="text-[11px] text-slate-400">
                                            @ ₹{(item.price || 0).toLocaleString('en-IN')} each
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <div className="font-extrabold text-xs text-[#0B1933]">
                                        ₹{lineTotal.toLocaleString('en-IN')}
                                      </div>
                                      <span className="text-[10px] text-emerald-600 font-medium">Paid</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50/80 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">No Orders Placed Yet</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                          Customer {selectedCustomer.name} has an active Locker account (#
                          {selectedCustomer.id}). As soon as items are ordered via "Buy For Me" or forwarded to Mumbai hub, all product details, images, and prices will appear here automatically.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(null);
                          onNavigateTab('purchase-requests');
                        }}
                        className="px-4 py-2 bg-[#0066FF] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#0052cc] transition-colors"
                      >
                        Create Assisted Order for Customer
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ASSISTED PURCHASE REQUESTS */}
              {modalTab === 'requests' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-[#0B1933] flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#0066FF]" />
                      <span>Assisted Purchase Requests & Submitted Links</span>
                    </h4>
                    <span className="text-xs text-slate-500">
                      Total: <strong>{selectedStats.requests.length}</strong> request{selectedStats.requests.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {selectedStats.requests.length > 0 ? (
                    <div className="space-y-4">
                      {selectedStats.requests.map((req) => (
                        <div
                          key={req.id}
                          className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden"
                        >
                          <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#0066FF] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                {req.id}
                              </span>
                              <span className="text-slate-500">• {req.submittedAt}</span>
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800">
                                {req.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-slate-900">
                                Est. ₹{req.totalAmountINR.toLocaleString('en-IN')}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(null);
                                  onNavigateTab('purchase-requests');
                                }}
                                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#0066FF] border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <span>Open Queue</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="p-4 space-y-2.5">
                            {(req.products || []).map((p: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-xs gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-10 h-10 rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                                    <img
                                      src={p.imageUrl || getItemImage({ title: p.name, store: p.store })}
                                      alt={p.name}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-slate-800 line-clamp-1">{p.name}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                      Store: <strong className="text-slate-600">{p.store}</strong> • Qty:{' '}
                                      <strong className="text-slate-600">{p.qty || 1}</strong>
                                      {p.specs ? ` • ${p.specs}` : ''}
                                    </div>
                                  </div>
                                </div>
                                <div className="font-extrabold text-slate-800 shrink-0">
                                  ₹{(p.totalINR || p.priceINR || 0).toLocaleString('en-IN')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-50/80 rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
                      No active purchase requests submitted yet by {selectedCustomer.name}.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="text-xs text-slate-500">
                Registered on <strong>{selectedCustomer.joinedDate || 'Active'}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const cId = selectedCustomer.id;
                    setSelectedCustomer(null);
                    onNavigateTab('orders', { search: cId });
                  }}
                  className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View in Orders Tab</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
