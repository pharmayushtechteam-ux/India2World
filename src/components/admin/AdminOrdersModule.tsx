import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  Box,
  ExternalLink,
  X,
  CreditCard,
  User,
  ShoppingBag,
  Download,
  Mail,
  Send,
  Printer,
  FileText,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Key,
  Edit2,
  Settings,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { AdminTab } from '../../types/admin';
import {
  CustomerOrderInvoice,
  getAllInvoices,
  downloadInvoiceDocument,
  printInvoiceDocument,
  resendInvoiceEmail,
  createOrderAndAutomateInvoice,
  lookupRegisteredCustomer,
  updateInvoiceCustomerEmail,
} from '../../services/orderInvoiceService';
import { UserProfile } from '../../utils/userAuth';
import {
  getAllOrders,
  updateOrderStatus,
  DATA_SYNC_EVENT,
  getAllCustomers,
  saveCustomers,
} from '../../services/integratedDataService';
import { triggerOrderConfirmationEmail } from '../../services/orderConfirmationService';
import { TablePaginationBar } from './TablePaginationBar';

export interface AdminOrderRecord {
  id: string; // ORD-90241
  customerId: string;
  customerName: string;
  customerAvatar: string;
  destination: string;
  destinationFlag: string;
  orderType: 'Assisted Purchase (Buy For Me)' | 'Self-Ship Forwarding';
  stores: string[];
  itemCount: number;
  totalINR: number;
  paymentStatus: 'Paid' | 'Pending Balance' | 'Refunded';
  orderStatus: 'Procuring' | 'In Warehouse' | 'Consolidating' | 'Dispatched' | 'Delivered';
  createdAt: string;
  trackingAwb?: string;
  items: Array<{ title: string; store: string; price: number; qty: number }>;
  customerEmail?: string;
  confirmationEmailStatus?: 'Sent' | 'Failed' | 'Pending';
  confirmationEmailSentAt?: string;
  confirmationEmailError?: string;
}

const INITIAL_ORDERS: AdminOrderRecord[] = [
  {
    id: 'ORD-31026',
    customerId: 'CUS-31026',
    customerName: 'rohith',
    customerAvatar: 'https://api.dicebear.com/7.x/initials/svg?seed=rohith&backgroundColor=0066FF',
    destination: 'International City, UAE',
    destinationFlag: '🇦🇪',
    orderType: 'Assisted Purchase (Buy For Me)',
    stores: ['Flipkart', 'Tata CLIQ', 'Amazon India', 'Myntra', 'Indian Store', 'AJIO'],
    itemCount: 12,
    totalINR: 25411,
    paymentStatus: 'Paid',
    orderStatus: 'Procuring',
    createdAt: '13 Oct 2026',
    items: [
      { title: 'Puma Men Lightweight Running Sneakers', store: 'Flipkart', price: 2999, qty: 1 },
      { title: 'FabIndia Linen Long Kurta Set', store: 'Tata CLIQ', price: 2499, qty: 1 },
      { title: 'Organic India Tulsi Herbal Infusion Teas (Pack of 4)', store: 'Amazon India', price: 400, qty: 4 },
      { title: 'Boat Wireless Bluetooth Earbuds', store: 'amazon.in', price: 949.5, qty: 2 },
      { title: 'Biotique Bio Kelp Protein Shampoo 340ml', store: 'Myntra', price: 410, qty: 2 },
      { title: 'Handcrafted Brass Incense Holder', store: 'Indian Store', price: 1250, qty: 1 },
      { title: 'AJIO Denim Jacket Indigo Blue', store: 'AJIO', price: 2199, qty: 1 },
    ],
  },
  {
    id: 'ORD-90241',
    customerId: 'CUS-10028',
    customerName: 'Priya Sharma',
    customerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    destination: 'Dubai, UAE',
    destinationFlag: '🇦🇪',
    orderType: 'Assisted Purchase (Buy For Me)',
    stores: ['Amazon India', 'Myntra', 'Flipkart'],
    itemCount: 4,
    totalINR: 10245,
    paymentStatus: 'Paid',
    orderStatus: 'In Warehouse',
    createdAt: '06 Nov 2024',
    items: [
      { title: 'Nike Air Zoom Pegasus Running Shoes', store: 'Amazon India', price: 3999, qty: 1 },
      { title: 'Anouk Women Pink Embroidered Kurta', store: 'Myntra', price: 1299, qty: 1 },
      { title: 'Milton Thermosteel Flask 1000ml', store: 'Flipkart', price: 1598, qty: 2 },
    ],
  },
  {
    id: 'ORD-90240',
    customerId: 'CUS-10042',
    customerName: 'Rahul Mehta',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    destination: 'San Francisco, USA',
    destinationFlag: '🇺🇸',
    orderType: 'Assisted Purchase (Buy For Me)',
    stores: ['Tata CliQ', 'FabIndia'],
    itemCount: 2,
    totalINR: 12540,
    paymentStatus: 'Paid',
    orderStatus: 'Dispatched',
    createdAt: '05 Nov 2024',
    trackingAwb: 'FDX4433221100',
    items: [
      { title: 'FabIndia Pure Silk Kurta Set', store: 'Tata CliQ', price: 5499, qty: 1 },
      { title: 'Handcrafted Brass Puja Diya Set', store: 'FabIndia', price: 2501, qty: 1 },
    ],
  },
  {
    id: 'ORD-90239',
    customerId: 'CUS-10034',
    customerName: 'Ahmed Khan',
    customerAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    destination: 'Abu Dhabi, UAE',
    destinationFlag: '🇦🇪',
    orderType: 'Assisted Purchase (Buy For Me)',
    stores: ['Amazon India'],
    itemCount: 3,
    totalINR: 18900,
    paymentStatus: 'Paid',
    orderStatus: 'Dispatched',
    createdAt: '04 Nov 2024',
    trackingAwb: 'DHL9876543210',
    items: [
      { title: 'OnePlus Nord Buds 2 Wireless Earphones', store: 'Amazon India', price: 2999, qty: 2 },
      { title: 'Seiko Automatic Watch Strap Replacement', store: 'Amazon India', price: 12902, qty: 1 },
    ],
  },
  {
    id: 'ORD-90238',
    customerId: 'CUS-10089',
    customerName: 'Suresh Reddy',
    customerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    destination: 'Toronto, Canada',
    destinationFlag: '🇨🇦',
    orderType: 'Self-Ship Forwarding',
    stores: ['Flipkart', 'Ajio'],
    itemCount: 5,
    totalINR: 16400,
    paymentStatus: 'Paid',
    orderStatus: 'Consolidating',
    createdAt: '02 Nov 2024',
    items: [
      { title: 'Wildcraft 45L Rucksack Backpack', store: 'Flipkart', price: 3499, qty: 1 },
      { title: 'Puma Men Cotton Track Pants x2', store: 'Ajio', price: 2899, qty: 2 },
    ],
  },
  {
    id: 'ORD-90237',
    customerId: 'CUS-10015',
    customerName: 'Meena Nair',
    customerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    destination: 'London, UK',
    destinationFlag: '🇬🇧',
    orderType: 'Assisted Purchase (Buy For Me)',
    stores: ['Nykaa'],
    itemCount: 2,
    totalINR: 6500,
    paymentStatus: 'Paid',
    orderStatus: 'Delivered',
    createdAt: '28 Oct 2024',
    trackingAwb: 'DHL5566778899',
    items: [
      { title: 'Forest Essentials Soundarya Face Cream', store: 'Nykaa', price: 5900, qty: 1 },
    ],
  },
];

export const AdminOrdersModule: React.FC<{
  onNavigateTab: (tab: AdminTab, params?: any) => void;
}> = ({ onNavigateTab }) => {
  const [orders, setOrders] = useState<AdminOrderRecord[]>(() => getAllOrders());
  const [invoices, setInvoices] = useState<CustomerOrderInvoice[]>(() => getAllInvoices());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderRecord | null>(null);
  const [selectedInvoiceModal, setSelectedInvoiceModal] = useState<CustomerOrderInvoice | null>(null);
  const [resendingInvoiceNum, setResendingInvoiceNum] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  // Pagination states (5 to 8 items per page, default 6)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(6);

  // Email editing state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');

  // SMTP Configuration Modal State
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('pharmayushtechteam@gmail.com');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpSaving, setSmtpSaving] = useState(false);
  const [smtpError, setSmtpError] = useState<string | null>(null);
  const [smtpSuccess, setSmtpSuccess] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setOrders(getAllOrders());
      setInvoices(getAllInvoices());
    };
    window.addEventListener('i2w-invoices-updated', handleUpdate);
    window.addEventListener(DATA_SYNC_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('i2w-invoices-updated', handleUpdate);
      window.removeEventListener(DATA_SYNC_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const handleOpenInvoiceModal = (inv: CustomerOrderInvoice) => {
    setSelectedInvoiceModal(inv);
    setEditedEmail(inv.customerEmail);
    setIsEditingEmail(false);
  };

  const handleSaveCorrectedEmail = () => {
    if (!selectedInvoiceModal) return;
    const trimmed = editedEmail.trim();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      triggerToast('⚠️ Please enter a valid recipient email address.');
      return;
    }

    updateInvoiceCustomerEmail(selectedInvoiceModal.invoiceNumber, trimmed);

    const customers = getAllCustomers();
    const cIdx = customers.findIndex((c) => c.id === selectedInvoiceModal.customerId);
    if (cIdx >= 0) {
      customers[cIdx].email = trimmed;
      saveCustomers([...customers]);
    }

    const updatedInv: CustomerOrderInvoice = {
      ...selectedInvoiceModal,
      customerEmail: trimmed,
      emailStatus: 'Pending',
      emailDeliveryLog: `Recipient email updated to ${trimmed}. Ready to dispatch.`,
    };
    setSelectedInvoiceModal(updatedInv);
    setIsEditingEmail(false);
    setInvoices(getAllInvoices());
    setOrders(getAllOrders());

    triggerToast(`✅ Recipient email corrected to ${trimmed}! Ready to send.`);
  };

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
          host: smtpHost.trim(),
          port: Number(smtpPort),
          security: 'STARTTLS',
          user: smtpUser.trim(),
          pass: smtpPass.trim(),
          senderName: 'India2World Invoicing',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'SMTP credentials verification failed with mail server.');
      }
      setSmtpSuccess('✅ Credentials verified and saved! Live SMTP delivery active.');
      triggerToast('🎉 SMTP verified successfully! Ready to dispatch invoices.');
      setTimeout(() => {
        setIsSmtpModalOpen(false);
        setSmtpSuccess(null);
      }, 1500);
    } catch (err: any) {
      setSmtpError(err.message || 'Unable to authenticate with SMTP server.');
    } finally {
      setSmtpSaving(false);
    }
  };

  const handleStatusChange = (newStatus: AdminOrderRecord['orderStatus']) => {
    if (!selectedOrder) return;
    updateOrderStatus(selectedOrder.id, newStatus);
    setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
    setOrders(getAllOrders());
    triggerToast(`Order ${selectedOrder.id} status updated to ${newStatus}`);
  };

  const handleSendInvoice = async (ord: AdminOrderRecord, existingInv?: CustomerOrderInvoice) => {
    let invoice = existingInv;
    const trackingKey = invoice ? invoice.invoiceNumber : ord.id;
    setResendingInvoiceNum(trackingKey);

    try {
      if (!invoice) {
        // Resolve customer registered email from registered users / store
        const regInfo = lookupRegisteredCustomer(ord.customerId, ord.customerName);
        const customerEmail =
          regInfo.email ||
          (ord as any).customerEmail ||
          `${ord.customerName.toLowerCase().replace(/\s+/g, '')}@gmail.com`;

        const userProfile: UserProfile = {
          name: ord.customerName,
          email: customerEmail,
          customerId: ord.customerId,
          country: ord.destination.split(',').pop()?.trim() || 'United Arab Emirates',
          countryCode: 'AE',
          phone: regInfo.phone || '+971 50 123 4567',
          avatar: ord.customerAvatar || '',
          lockerId: `I2W-${ord.customerId.replace('CUS-', '')}`,
          notificationsCount: 0,
        };

        const creationRes = createOrderAndAutomateInvoice({
          user: userProfile,
          products: ord.items.map((i) => ({
            name: i.title,
            storeName: i.store,
            priceINR: i.price,
            quantity: i.qty,
          })),
          costSummary: {
            subtotal: ord.items.reduce((acc, curr) => acc + curr.price * curr.qty, 0),
            domesticShipping: 350,
            serviceFee: 500,
            tax: 0,
            discount: 0,
            total: ord.totalINR,
          },
          existingOrderId: ord.id,
          destinationCity: ord.destination.split(',')[0]?.trim() || 'Dubai',
          destinationCountry: ord.destination.split(',').pop()?.trim() || 'United Arab Emirates',
        });
        invoice = creationRes.invoice;
      }

      if (!invoice) {
        throw new Error('Failed to generate or locate invoice for this order.');
      }

      const activeInvoice: CustomerOrderInvoice = invoice;

      const targetEmail = (selectedInvoiceModal && selectedInvoiceModal.invoiceNumber === activeInvoice.invoiceNumber && isEditingEmail && editedEmail)
        ? editedEmail.trim()
        : activeInvoice.customerEmail;

      const res = await resendInvoiceEmail(activeInvoice.invoiceNumber, targetEmail);
      if (res.success) {
        triggerToast(`✅ ${res.message}`);
      } else {
        triggerToast(`❌ Delivery failed: ${res.error || res.message}`);
        if ((res as any).configMissing) {
          setIsSmtpModalOpen(true);
        }
      }
      const updatedInvoices = getAllInvoices();
      setInvoices(updatedInvoices);
      setOrders(getAllOrders());

      if (selectedInvoiceModal && selectedInvoiceModal.invoiceNumber === activeInvoice.invoiceNumber) {
        const found = updatedInvoices.find((i) => i.invoiceNumber === activeInvoice.invoiceNumber);
        if (found) setSelectedInvoiceModal(found);
      }
    } catch (err: any) {
      triggerToast(`Error sending invoice: ${err.message || 'Please check SMTP settings'}`);
    } finally {
      setResendingInvoiceNum(null);
    }
  };

  const [resendingConfirmationOrderId, setResendingConfirmationOrderId] = useState<string | null>(null);

  const handleResendConfirmation = async (ord: AdminOrderRecord) => {
    setResendingConfirmationOrderId(ord.id);
    try {
      const linkedInv = invoices.find((i) => i.orderId === ord.id);
      const res = await triggerOrderConfirmationEmail(
        {
          id: ord.id,
          customerId: ord.customerId,
          customerName: ord.customerName,
          customerEmail: ord.customerEmail || linkedInv?.customerEmail || 'pharmayushtechteam@gmail.com',
          customerAvatar: ord.customerAvatar,
          destination: ord.destination,
          destinationFlag: ord.destinationFlag,
          orderType: ord.orderType,
          stores: ord.stores,
          itemCount: ord.itemCount,
          totalINR: ord.totalINR,
          paymentStatus: ord.paymentStatus,
          orderStatus: ord.orderStatus,
          createdAt: ord.createdAt,
          items: ord.items,
        } as any,
        linkedInv,
        true // Explicit retry
      );

      if (res.success) {
        triggerToast(`✅ Confirmation email sent to ${res.recipient}!`);
      } else {
        triggerToast(`❌ Delivery failed: ${res.error || res.message}`);
      }
      setOrders(getAllOrders());
      setInvoices(getAllInvoices());
      if (selectedOrder && selectedOrder.id === ord.id) {
        setSelectedOrder({
          ...selectedOrder,
          confirmationEmailStatus: res.success ? 'Sent' : 'Failed',
          confirmationEmailSentAt: res.timestamp,
        });
      }
    } catch (err: any) {
      triggerToast(`Error: ${err.message || 'Failed to dispatch confirmation email'}`);
    } finally {
      setResendingConfirmationOrderId(null);
    }
  };

  const handleResendInvoice = async (inv: CustomerOrderInvoice) => {
    const matchedOrder = allOrdersCombined.find((o) => o.id === inv.orderId) || {
      id: inv.orderId,
      customerId: inv.customerId,
      customerName: inv.customerName,
      customerAvatar: '',
      customerEmail: inv.customerEmail,
      destination: `${inv.destinationCity}, ${inv.destinationCountry}`,
      destinationFlag: inv.destinationFlag || '🌍',
      orderType: 'Assisted Purchase (Buy For Me)',
      stores: [],
      itemCount: inv.items.length,
      totalINR: inv.totalINR,
      paymentStatus: 'Paid',
      orderStatus: 'Procuring',
      createdAt: inv.createdAt,
      items: inv.items,
    };
    await handleSendInvoice(matchedOrder, inv);
  };

  const allOrdersCombined: AdminOrderRecord[] = useMemo(() => {
    const orderMap = new Map<string, AdminOrderRecord>();
    orders.forEach((o) => {
      const matchedInv = invoices.find((i) => i.orderId === o.id);
      orderMap.set(o.id, {
        ...o,
        customerEmail: o.customerEmail || matchedInv?.customerEmail,
        confirmationEmailStatus: o.confirmationEmailStatus || (matchedInv ? 'Sent' : 'Pending'),
        confirmationEmailSentAt: o.confirmationEmailSentAt || matchedInv?.createdAt,
      });
    });

    invoices.forEach((inv) => {
      if (!orderMap.has(inv.orderId)) {
        orderMap.set(inv.orderId, {
          id: inv.orderId,
          customerId: inv.customerId,
          customerName: inv.customerName,
          customerAvatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(inv.customerName)}&backgroundColor=0066FF`,
          customerEmail: inv.customerEmail,
          destination: `${inv.destinationCity}, ${inv.destinationCountry}`,
          destinationFlag: inv.destinationFlag || '🌍',
          orderType: 'Assisted Purchase (Buy For Me)',
          stores: Array.from(new Set(inv.items.map((i) => i.store))),
          itemCount: inv.items.reduce((acc, curr) => acc + curr.qty, 0),
          totalINR: inv.totalINR,
          paymentStatus: inv.paymentStatus === 'Paid' ? 'Paid' : 'Pending Balance',
          orderStatus: 'Procuring',
          createdAt: inv.createdAt.split(',')[0],
          confirmationEmailStatus: 'Sent',
          confirmationEmailSentAt: inv.createdAt,
          items: inv.items.map((i) => ({
            title: i.title,
            store: i.store,
            price: i.price,
            qty: i.qty,
          })),
        });
      }
    });

    return Array.from(orderMap.values());
  }, [orders, invoices]);

  const filtered = allOrdersCombined.filter((o) => {
    const matchesStatus = statusFilter === 'All' || o.orderStatus === statusFilter;
    const matchesSearch =
      !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.destination.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const paginatedOrders = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
            Customer Orders Master
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Full order lifecycle oversight from Indian retailer checkout to overseas delivery.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Active In-Flight Orders</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">24</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Processing</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across 18 international destinations</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">In Locker / Warehouse</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">12</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Stored</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ready for package consolidation</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Gross Merchandising Value</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">₹4.82 L</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Nov 2024</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">100% upfront escrow funded</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Delivered Successfully</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">142</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Past 30 Days</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">0 lost in transit claims</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {['All', 'In Warehouse', 'Dispatched', 'Consolidating', 'Delivered'].map((status) => (
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
            placeholder="Search Order ID, Customer..."
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-[#0066FF] focus:bg-white"
          />
        </div>
      </div>

      {/* Live Toast Notice */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0066FF] shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-blue-600 hover:text-blue-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Order ID & Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Order Type & Retailers</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Invoice & Automated Email</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedOrders.map((ord) => {
                const linkedInv = invoices.find((i) => i.orderId === ord.id);
                return (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-[#0066FF]">{ord.id}</div>
                      <div className="text-[11px] text-slate-400">{ord.createdAt}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <img src={ord.customerAvatar} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                        <div>
                          <div className="font-bold text-slate-800">{ord.customerName}</div>
                          <div className="text-[11px] text-slate-500 font-semibold">{ord.destinationFlag} {ord.destination}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-xs font-bold text-slate-800">{ord.orderType}</div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {ord.stores.map((s, idx) => (
                          <span key={idx} className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                            {s}
                          </span>
                        ))}
                        <span className="text-[11px] text-slate-400">&bull; {ord.itemCount} items</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-extrabold text-[#0B1933]">₹{ord.totalINR.toLocaleString('en-IN')}</div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {ord.paymentStatus}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                          ord.orderStatus === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : ord.orderStatus === 'Dispatched'
                            ? 'bg-blue-100 text-[#0066FF] border-blue-200'
                            : ord.orderStatus === 'In Warehouse'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-purple-100 text-purple-800 border-purple-200'
                        }`}
                      >
                        {ord.orderStatus}
                      </span>
                      {ord.trackingAwb && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          AWB: {ord.trackingAwb}
                        </div>
                      )}
                    </td>

                    {/* Invoice & Automated Email Delivery Tracking */}
                    <td className="py-4 px-4">
                      {resendingInvoiceNum === (linkedInv?.invoiceNumber || ord.id) ? (
                        <div className="space-y-1">
                          <div className="font-mono text-xs font-bold text-[#0066FF]">
                            {linkedInv?.invoiceNumber || `INV-2026-${ord.id.replace('ORD-', '')}`}
                          </div>
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#0066FF] border border-blue-200">
                              <RefreshCw className="w-3 h-3 animate-spin text-[#0066FF]" />
                              <span>Sending to {linkedInv?.customerEmail || (ord as any).customerEmail || ord.customerName}...</span>
                            </span>
                          </div>
                        </div>
                      ) : linkedInv ? (
                        <div className="space-y-1">
                          <div className="font-mono text-xs font-bold text-[#0066FF]">
                            {linkedInv.invoiceNumber}
                          </div>
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                linkedInv.emailStatus === 'Sent'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : linkedInv.emailStatus === 'Pending'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                              title={linkedInv.emailDeliveryLog || `Status: ${linkedInv.emailStatus}`}
                            >
                              <Mail className="w-3 h-3" />
                              <span>{linkedInv.emailStatus} to {linkedInv.customerEmail}</span>
                            </span>
                          </div>
                          {linkedInv.emailStatus === 'Sent' && linkedInv.emailSentAt && (
                            <div className="text-[10px] text-slate-400">
                              Dispatched: {linkedInv.emailSentAt}
                            </div>
                          )}
                          {linkedInv.emailStatus === 'Failed' && linkedInv.emailDeliveryLog && (
                            <div className="text-[10px] text-red-600 font-medium truncate max-w-[220px]" title={linkedInv.emailDeliveryLog}>
                              {linkedInv.emailDeliveryLog}
                            </div>
                          )}

                          {/* Order Confirmation Email Tracking */}
                          <div className="pt-1">
                            {resendingConfirmationOrderId === ord.id ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#0066FF] border border-blue-200">
                                <RefreshCw className="w-3 h-3 animate-spin text-[#0066FF]" />
                                <span>Sending Confirmation...</span>
                              </span>
                            ) : ord.confirmationEmailStatus === 'Sent' ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                                title={`Confirmation email delivered at ${ord.confirmationEmailSentAt || 'order placement'}`}
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Order Confirmed Emailed</span>
                              </span>
                            ) : ord.confirmationEmailStatus === 'Failed' ? (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200"
                                title={ord.confirmationEmailError || 'Delivery failed'}
                              >
                                <AlertCircle className="w-3 h-3 text-red-600" />
                                <span>Confirmation Failed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>Confirmation Queued</span>
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-slate-400 text-xs italic">Invoice Pending</div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>Ready to Dispatch</span>
                          </span>

                          <div className="pt-1">
                            {ord.confirmationEmailStatus === 'Sent' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Order Confirmed Emailed</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>Confirmation Queued</span>
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                          title="View Order Items"
                        >
                          Items
                        </button>

                        {linkedInv && (
                          <>
                            <button
                              onClick={() => handleOpenInvoiceModal(linkedInv)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#0066FF] rounded-xl cursor-pointer transition-colors"
                              title="View Tax Invoice"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => downloadInvoiceDocument(linkedInv)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-colors"
                              title={`Download Official Tax Invoice PDF (${linkedInv.invoiceNumber})`}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          disabled={resendingConfirmationOrderId === ord.id}
                          onClick={() => handleResendConfirmation(ord)}
                          className="p-1.5 rounded-xl border bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 cursor-pointer disabled:opacity-50 transition-colors"
                          title="Send/Resend Order Confirmation Email via Gmail SMTP"
                        >
                          {resendingConfirmationOrderId === ord.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0066FF]" />
                          ) : (
                            <Mail className="w-3.5 h-3.5 text-[#0066FF]" />
                          )}
                        </button>

                        <button
                          disabled={resendingInvoiceNum === (linkedInv?.invoiceNumber || ord.id)}
                          onClick={() => handleSendInvoice(ord, linkedInv)}
                          className={`p-1.5 rounded-xl border cursor-pointer disabled:opacity-50 transition-colors ${
                            linkedInv?.emailStatus === 'Failed'
                              ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                              : linkedInv?.emailStatus === 'Sent'
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 hover:bg-blue-100 text-[#0066FF] border-blue-200'
                          }`}
                          title={
                            linkedInv?.emailStatus === 'Failed'
                              ? `Retry sending invoice email to ${linkedInv.customerEmail}`
                              : `Send invoice email to ${linkedInv?.customerEmail || ord.customerName}`
                          }
                        >
                          {resendingInvoiceNum === (linkedInv?.invoiceNumber || ord.id) ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
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
          itemLabel="customer orders"
        />
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          onClick={() => setSelectedOrder(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#0066FF] uppercase tracking-wider">
                  Order Breakdown
                </span>
                <h3 className="text-lg font-extrabold text-[#0B1933]">
                  {selectedOrder.id} &bull; {selectedOrder.customerName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase">Purchased Merchandise</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/50 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{item.title}</div>
                      <div className="text-[11px] text-slate-400">Store: {item.store} &bull; Qty: {item.qty}</div>
                    </div>
                    <div className="font-extrabold text-[#0B1933]">₹{item.price.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Order Status Control */}
            <div className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Order Workflow Status:</span>
                <span className="text-xs font-extrabold text-[#0066FF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {selectedOrder.orderStatus}
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 pt-1.5">
                {(['Procuring', 'In Warehouse', 'Consolidating', 'Dispatched', 'Delivered'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-bold rounded-lg border transition-all cursor-pointer text-center ${
                      selectedOrder.orderStatus === st
                        ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Order Confirmation Email Service Status */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Order Confirmation Email:</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    selectedOrder.confirmationEmailStatus === 'Sent'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : selectedOrder.confirmationEmailStatus === 'Failed'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {selectedOrder.confirmationEmailStatus || 'Pending'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between items-center">
                <span>Recipient: <strong>{selectedOrder.customerEmail || (invoices.find(i => i.orderId === selectedOrder.id)?.customerEmail) || 'pharmayushtechteam@gmail.com'}</strong></span>
                {selectedOrder.confirmationEmailSentAt && (
                  <span className="text-[10px] text-slate-400">{selectedOrder.confirmationEmailSentAt}</span>
                )}
              </div>
              {selectedOrder.confirmationEmailError && (
                <div className="text-[10px] text-red-600 font-medium">
                  {selectedOrder.confirmationEmailError}
                </div>
              )}
              <button
                type="button"
                disabled={resendingConfirmationOrderId === selectedOrder.id}
                onClick={() => handleResendConfirmation(selectedOrder)}
                className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-[#0066FF] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {resendingConfirmationOrderId === selectedOrder.id ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Confirmation Email via SMTP...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send / Resend Order Confirmation Email</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-between items-center bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200 text-xs">
              <span className="font-bold text-[#0B1933]">Total Order Valuation:</span>
              <span className="text-base font-extrabold text-[#0066FF]">₹{selectedOrder.totalINR.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
              {selectedOrder.orderStatus === 'In Warehouse' && (
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    onNavigateTab('consolidation');
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] rounded-xl cursor-pointer"
                >
                  Proceed to Consolidation &rarr;
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Invoice Preview & Resend Modal */}
      {selectedInvoiceModal && (
        <div
          onClick={() => setSelectedInvoiceModal(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066FF]">
                    Customer Tax Invoice Record
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#0B1933]">
                    {selectedInvoiceModal.invoiceNumber}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoiceModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto py-4 space-y-4 pr-1 text-xs">
              {/* Delivery Status Banner */}
              {resendingInvoiceNum === selectedInvoiceModal.invoiceNumber ? (
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-blue-900 gap-2 animate-pulse">
                  <div className="flex items-center gap-2 min-w-0">
                    <RefreshCw className="w-4 h-4 text-[#0066FF] animate-spin shrink-0" />
                    <span className="truncate">
                      Connecting to SMTP Mail Server & Delivering Invoice PDF to <strong>{selectedInvoiceModal.customerEmail}</strong>...
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-200 text-[#0066FF] font-bold text-[10px] shrink-0">
                    Transmitting
                  </span>
                </div>
              ) : selectedInvoiceModal.emailStatus === 'Sent' ? (
                <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex flex-col gap-2 text-blue-900">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-extrabold text-blue-900 text-xs">
                        SMTP Relay Accepted (Queued for Inbox Delivery)
                      </span>
                    </div>
                    {selectedInvoiceModal.emailSentAt && (
                      <span className="text-[11px] text-blue-700">Relayed: {selectedInvoiceModal.emailSentAt}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-700">
                    Official invoice was relayed via Google SMTP to <strong>{selectedInvoiceModal.customerEmail}</strong>.
                  </div>
                  <div className="p-2 bg-white/80 rounded-xl border border-blue-100 text-[10.5px] text-slate-600 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span>Google SMTP relay accepted the message (250 OK). If not found in Primary inbox, check Spam / Junk or Promotions / Updates tabs.</span>
                  </div>
                </div>
              ) : selectedInvoiceModal.emailStatus === 'Failed' ? (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between text-red-900 gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-red-900">Email Delivery Failed via SMTP Gateway</div>
                      <div className="text-[11px] text-red-700">
                        {selectedInvoiceModal.emailDeliveryLog || `Could not deliver invoice to ${selectedInvoiceModal.customerEmail}. Please check SMTP credentials or verify the email address.`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInvoiceModal(null);
                        onNavigateTab('settings');
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Settings className="w-3 h-3" />
                      <span>Configure in Settings</span>
                    </button>
                    <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-800 font-bold text-[10px]">
                      Failed
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-amber-900 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="truncate">
                      Invoice Ready for Electronic Dispatch to <strong>{selectedInvoiceModal.customerEmail}</strong>
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 font-bold text-[10px] shrink-0">
                    {selectedInvoiceModal.paymentStatus}
                  </span>
                </div>
              )}

              {/* Billed To & Hub */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer Account</div>
                  <div className="font-bold text-slate-900 text-sm">{selectedInvoiceModal.customerName}</div>
                  <div className="text-slate-600">Customer ID: {selectedInvoiceModal.customerId}</div>
                  
                  {/* Recipient Email & Edit Option */}
                  <div className="pt-1">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recipient Email:</div>
                    {isEditingEmail ? (
                      <div className="mt-1 space-y-1.5">
                        <input
                          type="email"
                          value={editedEmail}
                          onChange={(e) => setEditedEmail(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#0066FF] rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
                          placeholder="customer@example.com"
                          autoFocus
                        />
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleSaveCorrectedEmail}
                            className="px-2.5 py-1 bg-[#0066FF] hover:bg-[#0052cc] text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            Save Email
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditedEmail(selectedInvoiceModal.customerEmail);
                              setIsEditingEmail(false);
                            }}
                            className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-semibold rounded-lg cursor-pointer transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1.5 mt-0.5">
                        <span className="text-[#0066FF] font-semibold truncate" title={selectedInvoiceModal.customerEmail}>
                          {selectedInvoiceModal.customerEmail}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditedEmail(selectedInvoiceModal.customerEmail);
                            setIsEditingEmail(true);
                          }}
                          className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-[#0066FF] text-[10px] font-bold rounded-md flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                          title="Edit recipient email address for this invoice"
                        >
                          <Edit2 className="w-2.5 h-2.5" />
                          <span>Edit / Change Email</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-slate-500">Destination: {selectedInvoiceModal.destinationCity}, {selectedInvoiceModal.destinationCountry}</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fulfillment Hub</div>
                  <div className="font-bold text-slate-900 text-sm">India2World Central Processing Hub</div>
                  <div className="text-slate-600">Plot 42, Udyog Vihar Phase 4</div>
                  <div className="text-slate-600">Gurugram, Haryana - 122016, India</div>
                  <div className="text-slate-500">Order Ref: {selectedInvoiceModal.orderId}</div>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedInvoiceModal.items.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="p-3 text-slate-400">{idx + 1}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{item.title}</div>
                          <div className="text-[10px] text-slate-400">Store: {item.store}</div>
                        </td>
                        <td className="p-3 text-center">{item.qty}</td>
                        <td className="p-3 text-right">₹{item.price.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          ₹{item.total.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 max-w-sm ml-auto">
                <div className="flex justify-between text-slate-600">
                  <span>Products Subtotal:</span>
                  <span className="font-semibold text-slate-800">₹{selectedInvoiceModal.subtotalINR.toLocaleString('en-IN')}</span>
                </div>
                {selectedInvoiceModal.domesticShippingINR > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Domestic Shipping:</span>
                    <span className="font-semibold text-slate-800">₹{selectedInvoiceModal.domesticShippingINR.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Assisted Procurement Fee:</span>
                  <span className="font-semibold text-slate-800">₹{selectedInvoiceModal.serviceFeeINR.toLocaleString('en-IN')}</span>
                </div>
                {selectedInvoiceModal.estimatedTaxINR > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Applicable Taxes:</span>
                    <span className="font-semibold text-slate-800">₹{selectedInvoiceModal.estimatedTaxINR.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-[#0B1933]">
                  <span>Total Amount Paid:</span>
                  <span className="text-[#0066FF]">₹{selectedInvoiceModal.totalINR.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Delivery Audit Log */}
              {selectedInvoiceModal.emailDeliveryLog && (
                <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <strong>Delivery Audit:</strong> {selectedInvoiceModal.emailDeliveryLog}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedInvoiceModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoiceModal(null);
                    onNavigateTab('settings');
                  }}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Configure SMTP in Admin & Operations Settings"
                >
                  <Settings className="w-3.5 h-3.5 text-blue-600" />
                  <span>SMTP Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => printInvoiceDocument(selectedInvoiceModal)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  disabled={resendingInvoiceNum === selectedInvoiceModal.invoiceNumber}
                  onClick={() => handleResendInvoice(selectedInvoiceModal)}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {resendingInvoiceNum === selectedInvoiceModal.invoiceNumber ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" />
                  )}
                  <span>{resendingInvoiceNum === selectedInvoiceModal.invoiceNumber ? 'Sending...' : 'Send Invoice Email'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadInvoiceDocument(selectedInvoiceModal)}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Invoice (PDF)</span>
                </button>
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
