import React, { useState, useEffect } from 'react';
import { Logo } from '../common/Logo';
import {
  Home,
  ShoppingCart,
  FileText,
  ShoppingBag,
  Warehouse,
  Boxes,
  Truck,
  CreditCard,
  MapPin,
  HelpCircle,
  Bell,
  User,
  CheckCircle2,
  Package,
  Plane,
  CheckSquare,
  Search,
  ExternalLink,
  Plus,
  Eye,
  Menu,
  X,
  ChevronRight,
  Shield,
  Clock,
  Sparkles,
  Download,
  AlertTriangle,
  Mail,
  MessageSquare,
  Send,
  Copy,
  Check,
  LifeBuoy,
  Printer,
  PhoneCall,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import {
  dashboardStats,
  recentActivities,
  sampleShipments,
  sampleWarehousePackages,
  samplePurchaseRequests,
  indianLockerAddress,
} from '../../data/mockData';
import {
  getCurrentUser,
  setCurrentUser as persistCurrentUser,
  USER_CHANGED_EVENT,
  UserProfile,
} from '../../utils/userAuth';
import {
  CustomerOrderInvoice,
  getInvoicesForCustomer,
  downloadInvoiceDocument,
  printInvoiceDocument,
  resendInvoiceEmail,
  syncInvoicesWithServerLogs,
} from '../../services/orderInvoiceService';
import { DashboardTab, Page } from '../../types';
import { openWhatsApp, WHATSAPP_DISPLAY_PHONE } from '../../utils/whatsapp';
import { WhatsAppIcon } from '../common/WhatsAppChatWidget';
import { WarehouseAddressModal } from '../common/WarehouseAddressModal';
import { TrackingModal } from '../common/TrackingModal';
import { BuyForMePage } from '../buy-for-me/BuyForMePage';
import { RequestExternalPurchasePage } from '../pages/RequestExternalPurchasePage';
import {
  getPurchaseRequestsByCustomerId,
  getPackagesByCustomerId,
  getShipmentsByCustomerId,
  getOrdersByCustomerId,
  getDynamicCustomerStats,
  confirmPurchaseOrderAndEmailInvoice,
  createConsolidatedShipment,
  getAllPayments,
  DATA_SYNC_EVENT,
  IntegratedPurchaseRequest,
  AdminIncomingPackage,
  AdminShipment,
  IntegratedOrderRecord,
} from '../../services/integratedDataService';

export interface SupportMessage {
  id: string;
  sender: 'user' | 'support';
  name: string;
  text: string;
  time: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  referenceId?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved';
  createdAt: string;
  lastReply: string;
  messages: SupportMessage[];
  customerId?: string;
  customerEmail?: string;
}

const getCustomerTicketsKey = (cid: string) => `i2w_support_tickets_${cid || 'anonymous'}`;

const defaultSupportTickets: SupportTicket[] = [
  {
    id: 'TKT-1082',
    subject: 'Customs clearance documentation for SHP-50012',
    category: 'Customs Clearance',
    referenceId: 'SHP-50012',
    priority: 'High',
    status: 'In Progress',
    createdAt: 'Today, 09:15 AM',
    lastReply: 'Support desk verified KYC documents',
    messages: [
      {
        id: 'msg-1',
        sender: 'user',
        name: 'You',
        text: 'Hi, I received a notification about Customs KYC requirement for Dubai delivery. Can you confirm if my uploaded passport copy is sufficient?',
        time: 'Today, 09:15 AM',
      },
      {
        id: 'msg-2',
        sender: 'support',
        name: 'Rajesh K. (India2World Support)',
        text: 'Hello! Yes, your passport copy has been verified by our customs clearance desk in Mumbai. The shipment SHP-50012 has cleared export checks and is scheduled for air cargo.',
        time: 'Today, 10:45 AM',
      },
    ],
  },
  {
    id: 'TKT-1049',
    subject: 'Fragile repackaging request for FabIndia glassware',
    category: 'Consolidation & Repackaging',
    referenceId: 'PKG-9921',
    priority: 'Medium',
    status: 'Resolved',
    createdAt: 'Yesterday, 03:20 PM',
    lastReply: 'Double bubble-wrap and fragile tags added',
    messages: [
      {
        id: 'msg-3',
        sender: 'user',
        name: 'You',
        text: 'Please ensure extra protective bubble wrap is used for the ceramic tea set before consolidation.',
        time: 'Yesterday, 03:20 PM',
      },
      {
        id: 'msg-4',
        sender: 'support',
        name: 'Warehouse Team (Bengaluru Hub)',
        text: 'Confirmed! Extra 5-layer shock bubble wrap and Fragile warning tags have been added to your parcel PKG-9921.',
        time: 'Yesterday, 05:10 PM',
      },
    ],
  },
];

interface CustomerDashboardProps {
  initialTab?: DashboardTab;
  onNavigatePage: (page: Page) => void;
  onTabChange?: (tab: DashboardTab) => void;
  initialBuyForMeUrl?: string;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  initialTab = 'overview',
  onNavigatePage,
  onTabChange,
  initialBuyForMeUrl = '',
}) => {
  const [activeTab, setActiveTabState] = useState<DashboardTab>(initialTab);

  const setActiveTab = (tab: DashboardTab) => {
    setActiveTabState(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTabState(initialTab);
    }
  }, [initialTab]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingNumberToView, setTrackingNumberToView] = useState('SHP-50012');
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingError, setTrackingError] = useState('');
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [notificationFilter, setNotificationFilter] = useState<
    'all' | 'unread' | 'order' | 'request' | 'warehouse' | 'shipment'
  >('all');

  // Dynamic user profile synced with auth login
  const [currentUser, setCurrentUser] = useState<UserProfile>(getCurrentUser);
  const isDemoUser =
    currentUser.customerId === 'CUS-10001' ||
    currentUser.customerId === 'CUS-10028' ||
    (currentUser.email || '').toLowerCase() === 'john@example.com';

  // Integrated data states filtered strictly by authenticated customer (Data Isolation)
  const [customerRequests, setCustomerRequests] = useState<IntegratedPurchaseRequest[]>(() =>
    getPurchaseRequestsByCustomerId(getCurrentUser().customerId)
  );
  const [customerPackages, setCustomerPackages] = useState<AdminIncomingPackage[]>(() =>
    getPackagesByCustomerId(getCurrentUser().customerId)
  );
  const [customerShipments, setCustomerShipments] = useState<AdminShipment[]>(() =>
    getShipmentsByCustomerId(getCurrentUser().customerId)
  );
  const [customerOrders, setCustomerOrders] = useState<IntegratedOrderRecord[]>(() =>
    getOrdersByCustomerId(getCurrentUser().customerId)
  );
  const [customerStats, setCustomerStats] = useState(() =>
    getDynamicCustomerStats(getCurrentUser().customerId)
  );

  useEffect(() => {
    const handleSync = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
      setCustomerRequests(getPurchaseRequestsByCustomerId(user.customerId));
      setCustomerPackages(getPackagesByCustomerId(user.customerId));
      setCustomerShipments(getShipmentsByCustomerId(user.customerId));
      setCustomerOrders(getOrdersByCustomerId(user.customerId));
      setCustomerStats(getDynamicCustomerStats(user.customerId));
      setInvoices(getInvoicesForCustomer(user.customerId || user.email));
    };

    window.addEventListener(USER_CHANGED_EVENT, handleSync);
    window.addEventListener(DATA_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(USER_CHANGED_EVENT, handleSync);
      window.removeEventListener(DATA_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Consolidation selection demo state
  const [selectedPackages, setSelectedPackages] = useState<string[]>(['pkg-1', 'pkg-2']);

  // Support tickets & interactive modals state (strictly isolated per customer)
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    try {
      const u = getCurrentUser();
      const saved = localStorage.getItem(getCustomerTicketsKey(u.customerId));
      if (saved) return JSON.parse(saved);
      if (u.customerId === 'CUS-10001' || u.customerId === 'CUS-10028') {
        return defaultSupportTickets;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(getCustomerTicketsKey(currentUser.customerId));
      if (saved) {
        setSupportTickets(JSON.parse(saved));
      } else if (isDemoUser) {
        setSupportTickets(defaultSupportTickets);
      } else {
        setSupportTickets([]);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser.customerId, isDemoUser]);

  useEffect(() => {
    if (!currentUser.customerId) return;
    try {
      localStorage.setItem(getCustomerTicketsKey(currentUser.customerId), JSON.stringify(supportTickets));
    } catch (e) {
      console.error(e);
    }
  }, [supportTickets, currentUser.customerId]);

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);
  const [supportSuccessToast, setSupportSuccessToast] = useState('');

  // Ticket creation form state
  const [newTicketCategory, setNewTicketCategory] = useState('Shipping & Tracking');
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketRef, setNewTicketRef] = useState('');
  const [newTicketPriority, setNewTicketPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [newTicketMessage, setNewTicketMessage] = useState('');

  // Email support composer form state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  // Customer Invoices & Automated Email Delivery state
  const [invoices, setInvoices] = useState<CustomerOrderInvoice[]>(() => getInvoicesForCustomer());
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerOrderInvoice | null>(null);
  const [resendingInvoiceNum, setResendingInvoiceNum] = useState<string | null>(null);
  const [invoiceToast, setInvoiceToast] = useState<string>('');
  const [quotationToast, setQuotationToast] = useState<string>('');

  const handleApproveQuotation = (requestId: string) => {
    const res = confirmPurchaseOrderAndEmailInvoice(requestId);
    if (res.success) {
      setQuotationToast(res.message || `Order confirmed! Sent to Purchase Queue.`);
      setTimeout(() => setQuotationToast(''), 5000);
    }
  };

  useEffect(() => {
    const handleInvoicesUpdated = () => {
      const user = getCurrentUser();
      setInvoices(getInvoicesForCustomer(user.customerId || user.email));
    };
    window.addEventListener('i2w-invoices-updated', handleInvoicesUpdated);
    return () => window.removeEventListener('i2w-invoices-updated', handleInvoicesUpdated);
  }, []);

  useEffect(() => {
    setInvoices(getInvoicesForCustomer(currentUser.customerId || currentUser.email));
    syncInvoicesWithServerLogs();
  }, [currentUser.customerId, currentUser.email]);

  const handleResendInvoice = async (inv: CustomerOrderInvoice) => {
    setResendingInvoiceNum(inv.invoiceNumber);
    try {
      const res = await resendInvoiceEmail(inv.invoiceNumber);
      setInvoiceToast(res.message);
      setInvoices(getInvoicesForCustomer());
      setTimeout(() => setInvoiceToast(''), 4000);
    } catch {
      setInvoiceToast('Failed to resend invoice. Please try again.');
      setTimeout(() => setInvoiceToast(''), 4000);
    } finally {
      setResendingInvoiceNum(null);
    }
  };

  const handleOpenEmailModal = () => {
    setIsEmailModalOpen(true);
  };

  const handleCopyEmail = () => {
    try {
      navigator.clipboard.writeText('support@india2world.com');
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLaunchEmailClient = () => {
    const lockerTag = currentUser.lockerId || `I2W-${currentUser.customerId.replace('CUS-', '')}`;
    const subject = encodeURIComponent(emailSubject || `India2World Customer Inquiry - ${lockerTag}`);
    const body = encodeURIComponent(
      (emailMessage ? emailMessage + '\n\n' : '') +
      `Customer ID: ${currentUser.customerId}\nCustomer Name: ${currentUser.name}\nEmail: ${currentUser.email}\nLocker ID: ${lockerTag}\nCountry: ${currentUser.country}`
    );
    window.location.href = `mailto:support@india2world.com?subject=${subject}&body=${body}`;
  };

  const handleSendEmailInquiryAsTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject.trim() && !emailMessage.trim()) {
      alert('Please enter a subject or message');
      return;
    }
    const newTicketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newTicket: SupportTicket = {
      id: newTicketId,
      customerId: currentUser.customerId,
      customerEmail: currentUser.email,
      subject: emailSubject.trim() || 'Email inquiry from Customer Portal',
      category: 'Email Support Desk',
      priority: 'Medium',
      status: 'Open',
      createdAt: timeStr,
      lastReply: `Inquiry queued. Support specialist will respond to ${currentUser.email}`,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'user',
          name: `${currentUser.name} (via Email Support)`,
          text: emailMessage.trim() || `Direct email inquiry submitted to support@india2world.com by ${currentUser.name}`,
          time: timeStr,
        },
      ],
    };
    setSupportTickets((prev) => [newTicket, ...prev]);
    setIsEmailModalOpen(false);
    setEmailSubject('');
    setEmailMessage('');
    setSupportSuccessToast(`Email ticket #${newTicketId} dispatched successfully! Our team will follow up promptly.`);
    setTimeout(() => setSupportSuccessToast(''), 6000);
  };

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim()) {
      alert('Please enter a ticket subject');
      return;
    }
    if (!newTicketMessage.trim()) {
      alert('Please enter your inquiry details');
      return;
    }

    const newTicketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newTicket: SupportTicket = {
      id: newTicketId,
      customerId: currentUser.customerId,
      customerEmail: currentUser.email,
      subject: newTicketSubject.trim(),
      category: newTicketCategory,
      referenceId: newTicketRef.trim() || undefined,
      priority: newTicketPriority,
      status: 'Open',
      createdAt: timeStr,
      lastReply: 'Ticket registered. Waiting for support agent assignment.',
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'user',
          name: currentUser.name || 'You',
          text: newTicketMessage.trim(),
          time: timeStr,
        },
      ],
    };

    setSupportTickets((prev) => [newTicket, ...prev]);
    setIsTicketModalOpen(false);
    setNewTicketSubject('');
    setNewTicketMessage('');
    setNewTicketRef('');
    setSupportSuccessToast(`Ticket #${newTicketId} created successfully! Our support specialists respond within 15 minutes.`);
    setTimeout(() => setSupportSuccessToast(''), 6000);
  };

  const handleSendReplyInTicket = (ticketId: string) => {
    if (!ticketReplyText.trim()) return;
    const now = new Date();
    const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      name: 'You',
      text: ticketReplyText.trim(),
      time: timeStr,
    };

    setSupportTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          return {
            ...t,
            status: 'Open',
            lastReply: `You: ${ticketReplyText.trim().slice(0, 30)}...`,
            messages: [...t.messages, newMsg],
          };
        }
        return t;
      })
    );

    if (viewingTicket && viewingTicket.id === ticketId) {
      setViewingTicket((prev) => (prev ? { ...prev, messages: [...prev.messages, newMsg] } : null));
    }
    setTicketReplyText('');
  };

  const sidebarItems: { id: DashboardTab; label: string; icon: React.FC<any> }[] = [
    { id: 'overview', label: 'Dashboard', icon: Home },
    { id: 'buy-for-me', label: 'Buy For Me', icon: ShoppingCart },
    { id: 'request-external-purchase', label: 'Request Product', icon: Sparkles },
    { id: 'my-requests', label: 'My Requests', icon: FileText },
    { id: 'my-purchases', label: 'My Purchases', icon: ShoppingBag },
    { id: 'my-warehouse', label: 'My Warehouse', icon: Warehouse },
    { id: 'consolidation', label: 'Consolidation', icon: Boxes },
    { id: 'shipments', label: 'Shipments', icon: Truck },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) {
      setTrackingError('Please enter a tracking number or shipment ID');
      return;
    }
    setTrackingError('');
    setTrackingNumberToView(trackingInput.trim().toUpperCase());
    setTrackingModalOpen(true);
  };

  const getStatIcon = (iconName: string) => {
    switch (iconName) {
      case 'FileText':
        return <FileText className="w-5 h-5 text-purple-600" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5 text-emerald-600" />;
      case 'Package':
        return <Package className="w-5 h-5 text-amber-600" />;
      case 'Plane':
        return <Plane className="w-5 h-5 text-rose-600" />;
      case 'Boxes':
        return <Boxes className="w-5 h-5 text-cyan-600" />;
      case 'Truck':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'CheckSquare':
        return <CheckSquare className="w-5 h-5 text-emerald-600" />;
      default:
        return <Package className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatBg = (color: string) => {
    switch (color) {
      case 'purple':
        return 'bg-purple-100/70 border-purple-200/50';
      case 'green':
        return 'bg-emerald-100/70 border-emerald-200/50';
      case 'orange':
        return 'bg-amber-100/70 border-amber-200/50';
      case 'red':
        return 'bg-rose-100/70 border-rose-200/50';
      case 'cyan':
        return 'bg-cyan-100/70 border-cyan-200/50';
      case 'blue':
        return 'bg-blue-100/70 border-blue-200/50';
      default:
        return 'bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-slate-800">
      {/* Modals */}
      <TrackingModal
        isOpen={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        initialTrackingNumber={trackingNumberToView}
      />
      <WarehouseAddressModal
        isOpen={addressModalOpen}
        onClose={() => setAddressModalOpen(false)}
      />

      {/* Modal 1: Create New Support Ticket */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Create Support Ticket</h3>
                  <p className="text-xs text-slate-500">Submit an inquiry to our 24/7 global operations team</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTicketModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={newTicketCategory}
                  onChange={(e) => setNewTicketCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white"
                >
                  <option value="Shipping & Tracking">Shipping & Tracking</option>
                  <option value="Customs Clearance & KYC">Customs Clearance & KYC</option>
                  <option value="Buy For Me Request">Buy For Me Request</option>
                  <option value="Package Inspection & Photos">Package Inspection & Photos</option>
                  <option value="Consolidation & Repackaging">Consolidation & Repackaging</option>
                  <option value="Locker & Warehouse">Locker & Warehouse</option>
                  <option value="Billing & Payments">Billing & Payments</option>
                  <option value="Other Inquiries">Other Inquiries</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Related Shipment / Package ID <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={newTicketRef}
                  onChange={(e) => setNewTicketRef(e.target.value)}
                  placeholder="e.g. SHP-50012, PKG-9921, or REQ-4011"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Priority Level
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Low', 'Medium', 'High', 'Urgent'] as const).map((pri) => (
                    <button
                      key={pri}
                      type="button"
                      onClick={() => setNewTicketPriority(pri)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                        newTicketPriority === pri
                          ? pri === 'Urgent' || pri === 'High'
                            ? 'bg-red-500 text-white border-red-500 shadow-xs'
                            : pri === 'Medium'
                            ? 'bg-[#0066FF] text-white border-[#0066FF] shadow-xs'
                            : 'bg-slate-800 text-white border-slate-800 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {pri}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="e.g., Request repackaging check for fragile items"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Inquiry Details *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  placeholder="Please describe your question, special shipping instructions, or issue in detail..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0066FF] hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit Support Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Send Email Support Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Email Support Desk</h3>
                  <p className="text-xs text-slate-500">Direct channel to India2World customer officers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Email address box with copy action */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
                    Official Support Email
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900 select-all block truncate">
                    support@india2world.com
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                >
                  {emailCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="e.g. Urgent query regarding export clearance"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Message
                </label>
                <textarea
                  rows={4}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Write your email inquiry here..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleLaunchEmailClient}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in Default Mail App
                </button>

                <div className="w-full sm:w-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleSendEmailInquiryAsTicket}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-[#0066FF] hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Inquiry Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: View Support Ticket Details & Reply */}
      {viewingTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden my-8 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-[#0066FF] bg-blue-50 px-2 py-0.5 rounded">
                    {viewingTicket.id}
                  </span>
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {viewingTicket.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      viewingTicket.status === 'Resolved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : viewingTicket.status === 'In Progress'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {viewingTicket.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base leading-snug">{viewingTicket.subject}</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation Messages */}
            <div className="p-5 overflow-y-auto space-y-3.5 flex-1 bg-slate-50/40">
              {viewingTicket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-xs font-bold text-slate-700">{msg.name}</span>
                    <span className="text-[10px] text-slate-400">{msg.time}</span>
                  </div>
                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#0066FF] text-white rounded-tr-xs shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input Area */}
            <div className="p-4 border-t border-slate-200 bg-white shrink-0 space-y-2.5">
              <textarea
                rows={2}
                value={ticketReplyText}
                onChange={(e) => setTicketReplyText(e.target.value)}
                placeholder="Type your response to the support team..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:bg-white resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Replies are dispatched directly to India2World Operations Desk
                </span>
                <button
                  type="button"
                  onClick={() => handleSendReplyInTicket(viewingTicket.id)}
                  disabled={!ticketReplyText.trim()}
                  className="px-4 py-2 bg-[#0066FF] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Top Header */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <Logo size="sm" onClick={() => onNavigatePage('home')} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('notifications')}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-full relative"
          >
            <Bell className="w-5 h-5" />
            {!notificationsRead && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-30 bg-slate-900/45 backdrop-blur-xs"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 md:static md:self-stretch z-40 bg-white border-r border-slate-200/80 flex flex-col transition-all duration-300 ease-in-out shrink-0 shadow-xl md:shadow-none ${
          sidebarOpen ? 'max-md:translate-x-0 w-64' : 'max-md:-translate-x-full'
        } ${
          desktopSidebarOpen
            ? 'md:w-64 md:opacity-100'
            : 'md:w-0 md:opacity-0 md:overflow-hidden md:border-r-0 md:pointer-events-none'
        }`}
      >
        <div className="h-screen md:sticky md:top-0 w-64 p-4 flex flex-col">
          {/* Logo pinned at top with Collapse Sidebar toggle */}
          <div className="px-2 pt-1 pb-3.5 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
            <Logo size="md" onClick={() => onNavigatePage('home')} />
            <button
              type="button"
              onClick={() => setDesktopSidebarOpen(false)}
              className="hidden md:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-[#0066FF] hover:bg-blue-50 transition-colors cursor-pointer shrink-0"
              title="Hide Side Menu"
              aria-label="Hide side menu"
            >
              <PanelLeftClose className="w-4.5 h-4.5" />
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links (fills available height and scrolls smoothly if needed) */}
          <nav className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-[13.5px] transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0066FF] to-[#1D4ED8] text-white font-bold shadow-sm shadow-blue-500/25'
                      : 'text-slate-600 hover:bg-blue-50/60 hover:text-[#0066FF]'
                  }`}
                >
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Mini Card pinned cleanly to bottom of sidebar */}
          <div className="pt-3 border-t border-slate-100 shrink-0">
            <div className="bg-slate-50/90 border border-slate-200/70 rounded-2xl p-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-9 h-9 rounded-full object-cover border border-white shadow-2xs shrink-0"
                />
                <div className="text-left text-xs min-w-0">
                  <span className="font-bold text-slate-800 block truncate max-w-[105px]">{currentUser.name}</span>
                  <span className="text-slate-400 font-mono text-[10px] block">{currentUser.customerId}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigatePage('login')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-[11px] font-bold text-[#0066FF] border border-slate-200 hover:border-blue-200 transition-colors cursor-pointer shrink-0"
                title="Switch User or Log In"
              >
                Switch
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-5 lg:p-6 w-full space-y-4 overflow-x-clip">
        {/* Compact Top Header Bar */}
        <div className="bg-white rounded-xl px-3.5 sm:px-4 py-2.5 shadow-2xs border border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setDesktopSidebarOpen((prev) => !prev)}
              className="hidden md:inline-flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-600 hover:text-[#0066FF] transition-colors cursor-pointer shrink-0"
              title={desktopSidebarOpen ? 'Hide Side Menu' : 'Show Side Menu'}
              aria-label={desktopSidebarOpen ? 'Hide side menu' : 'Show side menu'}
            >
              {desktopSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>
            <div className="relative shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-100"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-[15px] font-extrabold text-slate-900 leading-tight truncate">
                  {currentUser.name}
                </h2>
                <span className="text-[10px] font-mono font-bold text-[#0066FF] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                  {currentUser.customerId}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {currentUser.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Indian Locker Pill */}
            <button
              type="button"
              onClick={() => setAddressModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200/90 rounded-lg text-[11px] font-bold text-[#0066FF] transition-colors cursor-pointer"
              title="View your Mumbai Warehouse Locker Address"
            >
              <Warehouse className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Locker:</span>
              <span className="font-mono">{currentUser.lockerId || 'I2W-10028'}</span>
            </button>

            {/* Quick Track Shipment Button */}
            <button
              type="button"
              onClick={() => {
                setTrackingNumberToView('');
                setTrackingModalOpen(true);
              }}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition-colors cursor-pointer"
              title="Track your orders & shipments"
            >
              <Truck className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Track Order</span>
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('notifications');
                setNotificationsRead(true);
              }}
              className="relative p-1.5 sm:p-2 text-slate-600 hover:text-[#0066FF] hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 hover:border-blue-200 bg-white cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {!notificationsRead && (customerOrders.length > 0 || customerRequests.length > 0 || customerPackages.length > 0) && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white">
                  {Math.min(9, customerOrders.length + customerRequests.length + customerPackages.length)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW (THE EXACT REFERENCE DESIGN) */}
        {activeTab === 'overview' && (() => {
          const displayedRequests =
            customerRequests.length > 0
              ? customerRequests
              : isDemoUser
              ? samplePurchaseRequests
              : [];

          const displayedPackages =
            customerPackages.length > 0
              ? customerPackages
              : isDemoUser
              ? sampleWarehousePackages
              : [];

          const displayedShipments =
            customerShipments.length > 0
              ? customerShipments
              : isDemoUser
              ? sampleShipments
              : [];

          const liveStats = [
            {
              id: 1,
              title: 'Assisted Purchase Requests',
              count: displayedRequests.length > 0 ? displayedRequests.length : (isDemoUser ? 2 : 0),
              icon: 'FileText',
              color: 'purple',
              linkTab: 'my-requests' as DashboardTab,
            },
            {
              id: 2,
              title: 'Orders In Process',
              count: customerOrders.length > 0 ? customerOrders.length : (isDemoUser ? 5 : 0),
              icon: 'ShoppingBag',
              color: 'green',
              linkTab: 'my-purchases' as DashboardTab,
            },
            {
              id: 3,
              title: 'Action Required',
              count: displayedRequests.filter((r: any) => r.status === 'Quote Ready' || r.status === 'Awaiting Payment').length,
              icon: 'AlertTriangle',
              color: 'orange',
              linkTab: 'my-requests' as DashboardTab,
            },
            {
              id: 4,
              title: 'Packages in Locker',
              count: displayedPackages.length,
              icon: 'Package',
              color: 'blue',
              linkTab: 'my-warehouse' as DashboardTab,
            },
            {
              id: 5,
              title: 'Ready to Ship',
              count: displayedPackages.filter(
                (p: any) => p.status === 'Inspected' || p.status === 'Received' || p.status === 'Ready for Consolidation'
              ).length,
              icon: 'Boxes',
              color: 'cyan',
              linkTab: 'consolidation' as DashboardTab,
            },
            {
              id: 6,
              title: 'In Transit',
              count: displayedShipments.filter((s: any) => s.status === 'In Transit' || s.status === 'Out for Delivery').length,
              icon: 'Plane',
              color: 'red',
              linkTab: 'shipments' as DashboardTab,
            },
            {
              id: 7,
              title: 'Delivered',
              count: displayedShipments.filter((s: any) => s.status === 'Delivered').length,
              icon: 'CheckSquare',
              color: 'green',
              linkTab: 'shipments' as DashboardTab,
            },
          ];

          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* 7 Summary Statistic Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-4">
                {liveStats.map((stat) => (
                  <div
                    key={stat.id}
                    onClick={() => {
                      if (stat.linkTab) {
                        setActiveTab(stat.linkTab);
                      }
                    }}
                    className="bg-white rounded-2xl p-4 shadow-xs border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border ${getStatBg(
                          stat.color
                        )}`}
                      >
                        {getStatIcon(stat.icon)}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-500 leading-tight block line-clamp-2 h-7 mb-2">
                        {stat.title}
                      </span>
                      <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        {stat.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            {/* Lower Grid: Recent Activity + Right Column (Track + Indian Address) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Recent Activity (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-xs border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-extrabold text-slate-900 text-lg">Recent Activity</h3>
                    <button
                      onClick={() => setActiveTab('notifications')}
                      className="text-xs font-bold text-[#0066FF] hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  {/* Customer-Specific Activity Timeline List */}
                  {(() => {
                    const customerActivities: Array<{
                      id: string;
                      type: 'payment' | 'consolidation' | 'warehouse' | 'purchase';
                      title: string;
                      code: string;
                      timestamp: string;
                      iconBg: string;
                    }> = [];

                    customerOrders.forEach((o) => {
                      customerActivities.push({
                        id: `act-ord-${o.id}`,
                        type: 'payment',
                        title: `Order confirmed (${o.items?.length || 1} items)`,
                        code: o.id,
                        timestamp: o.createdAt || 'Recent',
                        iconBg: 'bg-emerald-50 text-emerald-600',
                      });
                    });

                    customerRequests.forEach((r: any) => {
                      customerActivities.push({
                        id: `act-req-${r.id}`,
                        type: 'purchase',
                        title: `Buy For Me Request (${r.status})`,
                        code: r.requestNumber || r.id,
                        timestamp: r.date || r.submittedAt || 'Recent',
                        iconBg: 'bg-rose-50 text-rose-600',
                      });
                    });

                    customerPackages.forEach((p: any) => {
                      customerActivities.push({
                        id: `act-pkg-${p.id}`,
                        type: 'warehouse',
                        title: `Package received (${p.seller || 'Merchant'})`,
                        code: p.packageNumber || p.id,
                        timestamp: p.receivedDate || 'Recent',
                        iconBg: 'bg-orange-50 text-orange-600',
                      });
                    });

                    customerShipments.forEach((s: any) => {
                      customerActivities.push({
                        id: `act-shp-${s.id}`,
                        type: 'consolidation',
                        title: `Shipment ${s.status} (${s.carrier || 'DHL'})`,
                        code: s.trackingNumber || s.id,
                        timestamp: s.departureDate || 'Recent',
                        iconBg: 'bg-blue-50 text-blue-600',
                      });
                    });

                    const displayActivities =
                      customerActivities.length > 0
                        ? customerActivities
                        : isDemoUser
                        ? recentActivities
                        : [];

                    if (displayActivities.length === 0) {
                      return (
                        <div className="py-10 text-center text-slate-400 space-y-2">
                          <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-xs font-bold text-slate-600">No account activity yet</p>
                          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                            Activity from your assisted purchase requests, locker receipts, and dispatches will be tracked here.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-6 relative pl-8 before:content-[''] before:absolute before:left-3.5 before:top-2 before:bottom-3 before:w-0.5 before:border-l-2 before:border-dashed before:border-slate-200">
                        {displayActivities.map((act) => (
                          <div key={act.id} className="relative flex items-start justify-between gap-4">
                            <div
                              className={`absolute -left-8 top-0 w-7 h-7 rounded-full flex items-center justify-center ring-4 ring-white ${act.iconBg}`}
                            >
                              {act.type === 'payment' && <Truck className="w-3.5 h-3.5" />}
                              {act.type === 'consolidation' && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {act.type === 'warehouse' && <Package className="w-3.5 h-3.5" />}
                              {act.type === 'purchase' && <Plane className="w-3.5 h-3.5" />}
                            </div>

                            <div>
                              <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                                {act.title}
                              </h4>
                              <span className="font-mono text-xs font-bold text-slate-500 block mt-0.5">
                                {act.code}
                              </span>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs text-slate-400 font-medium">
                                {act.timestamp}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Warehouse status: All systems operational</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Live Sync
                  </span>
                </div>
              </div>

              {/* Right Column: Track Your Shipment + Get Your Indian Address (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* 1. Track Your Shipment Card */}
                <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-lg">Track Your Shipment</h3>

                  <form onSubmit={handleTrackSubmit} className="space-y-3">
                    <div className="relative">
                      <Truck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={trackingInput}
                        onChange={(e) => setTrackingInput(e.target.value)}
                        placeholder="Enter Shipment ID or Tracking Number"
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:border-[#0066FF] text-slate-800"
                      />
                    </div>
                    {trackingError && (
                      <p className="text-xs text-red-500 font-medium">{trackingError}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Track</span>
                    </button>
                  </form>
                </div>

                {/* 2. Get Your Indian Address Card */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-slate-100">
                  {/* Visual Artwork Banner */}
                  <div className="relative h-28 bg-gradient-to-r from-blue-100 via-amber-50 to-orange-100">
                    <img
                      src="/assets/address-banner.jpg"
                      alt="Get Indian Address"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-6 space-y-4">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-lg">
                        Get Your Indian Address
                      </h4>
                      <p className="text-slate-500 text-xs sm:text-sm mt-1 leading-relaxed">
                        Shop directly from Indian websites and ship to your personal Indian warehouse address.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setAddressModalOpen(true)}
                      className="w-full py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl font-bold text-sm shadow-xs transition-colors cursor-pointer"
                    >
                      View My Address
                    </button>
                  </div>
                </div>
              </div>
            </div>
            </div>
          );
        })()}

        {/* TAB: BUY FOR ME */}
        {activeTab === 'buy-for-me' && (
          <div className="animate-in fade-in duration-200">
            <BuyForMePage
              onNavigate={(page) => {
                if (page === 'dashboard') {
                  setActiveTab('overview');
                } else {
                  onNavigatePage(page);
                }
              }}
              initialUrl={initialBuyForMeUrl}
              isInDashboard={true}
            />
          </div>
        )}

        {/* TAB: REQUEST PRODUCT FROM ANOTHER PLATFORM */}
        {activeTab === 'request-external-purchase' && (
          <div className="animate-in fade-in duration-200">
            <RequestExternalPurchasePage
              onNavigate={(page) => {
                if (page === 'dashboard') {
                  setActiveTab('overview');
                } else {
                  onNavigatePage(page);
                }
              }}
              isInDashboard={true}
            />
          </div>
        )}

        {/* TAB 2: MY REQUESTS */}
        {activeTab === 'my-requests' && (() => {
          const displayedRequests =
            customerRequests.length > 0
              ? customerRequests
              : isDemoUser
              ? samplePurchaseRequests
              : [];

          const totalRequestsCount = displayedRequests.length;
          const totalItemsCount = displayedRequests.reduce(
            (sum: number, req: any) =>
              sum +
              (req.products || []).reduce(
                (pSum: number, p: any) => pSum + Number(p.quantity || p.qty || 1),
                0
              ),
            0
          );
          const activePurchasingCount = displayedRequests.filter(
            (req: any) =>
              req.status === 'Purchasing' ||
              req.status === 'Purchased' ||
              req.status === 'Quote Ready' ||
              req.status === 'Awaiting Payment'
          ).length;
          const totalRequestsValueINR = displayedRequests.reduce(
            (sum: number, req: any) => sum + Number(req.totalAmountINR || req.totalINR || 0),
            0
          );

          return (
            <div className="space-y-5 pb-16 animate-in fade-in duration-200">
              {/* Page Header */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/70">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xl sm:text-2xl tracking-tight">
                      My Purchase Requests
                    </h3>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                      Track assisted purchase orders placed through India2World Buy For Me.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('buy-for-me')}
                    className="px-4 py-2.5 bg-[#0066FF] text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-[#0052cc] transition-all active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4" /> New Buy For Me Request
                  </button>
                </div>

                {/* Summary KPI Strip */}
                {displayedRequests.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100">
                    <div className="rounded-xl bg-slate-50/80 border border-slate-200/60 px-4 py-3">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Total Requests
                      </span>
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                        {totalRequestsCount}
                      </div>
                    </div>
                    <div className="rounded-xl bg-blue-50/60 border border-blue-100 px-4 py-3">
                      <span className="text-[11px] font-semibold text-blue-700/80 uppercase tracking-wide">
                        Total Items
                      </span>
                      <div className="text-xl font-extrabold text-[#0066FF] mt-0.5">
                        {totalItemsCount}
                      </div>
                    </div>
                    <div className="rounded-xl bg-emerald-50/60 border border-emerald-100 px-4 py-3">
                      <span className="text-[11px] font-semibold text-emerald-700/80 uppercase tracking-wide">
                        Active / Purchasing
                      </span>
                      <div className="text-xl font-extrabold text-emerald-700 mt-0.5">
                        {activePurchasingCount}
                      </div>
                    </div>
                    <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 px-4 py-3">
                      <span className="text-[11px] font-semibold text-indigo-700/80 uppercase tracking-wide">
                        Total Value
                      </span>
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                        ₹{totalRequestsValueINR.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {quotationToast && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{quotationToast}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setQuotationToast('')}
                    className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Requests List */}
              {displayedRequests.length === 0 ? (
                <div className="bg-white text-center py-14 px-4 rounded-2xl border-2 border-dashed border-slate-200 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-base mb-1">No Purchase Requests Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Submit a product link from Amazon, Myntra, Flipkart, or any Indian website and our Mumbai operations desk will verify and procure it for you.
                  </p>
                  <button
                    onClick={() => setActiveTab('buy-for-me')}
                    className="px-4 py-2 bg-[#0066FF] text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-[#0052cc]"
                  >
                    <Plus className="w-4 h-4" /> Start Buy For Me Request
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayedRequests.map((req: any) => {
                    const products = Array.isArray(req.products) ? req.products : [];
                    const itemCount = products.reduce(
                      (acc: number, p: any) => acc + Number(p.quantity || p.qty || 1),
                      0
                    );
                    const totalAmt = Number(req.totalAmountINR || req.totalINR || 0);
                    const isPurchasing = req.status === 'Purchased' || req.status === 'Purchasing';
                    const isQuoteReady = req.status === 'Quote Ready' || req.status === 'Awaiting Payment';
                    const isRejected = req.status === 'Rejected';

                    const gridColsClass =
                      products.length === 1
                        ? 'grid-cols-1'
                        : products.length === 2
                        ? 'grid-cols-1 md:grid-cols-2'
                        : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

                    return (
                      <div
                        key={req.id}
                        className="bg-white rounded-2xl border border-slate-200/80 hover:border-blue-200 shadow-xs hover:shadow-sm transition-all overflow-hidden"
                      >
                        {/* Card Header Bar */}
                        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0066FF] border border-blue-100 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono font-extrabold text-slate-900 text-sm sm:text-base">
                                  {req.requestNumber || req.id}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-bold text-slate-600">
                                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{req.date || req.submittedAt}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 sm:gap-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                                isPurchasing
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                  : isQuoteReady
                                  ? 'bg-blue-50 text-[#0066FF] border-blue-200/80'
                                  : isRejected
                                  ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                                  : 'bg-amber-50 text-amber-700 border-amber-200/80'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isPurchasing
                                    ? 'bg-emerald-500'
                                    : isQuoteReady
                                    ? 'bg-[#0066FF]'
                                    : isRejected
                                    ? 'bg-rose-500'
                                    : 'bg-amber-500'
                                }`}
                              />
                              {req.status}
                            </span>

                            <div className="text-right">
                              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
                                Total
                              </div>
                              <div className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight mt-0.5">
                                ₹{totalAmt.toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Body: Adaptive Product Grid */}
                        <div className="p-4 sm:p-5 space-y-4">
                          <div className={`grid ${gridColsClass} gap-3`}>
                            {products.map((p: any, pIdx: number) => {
                              const itemName = p.name || p.title || 'Product Item';
                              const itemQty = Number(p.quantity || p.qty || 1);
                              const itemPrice = Number(p.priceINR || 0);
                              const lineTotal = itemPrice * itemQty;

                              return (
                                <div
                                  key={p.id || pIdx}
                                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 hover:border-slate-300/80 transition-colors"
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <img
                                      src={p.imageUrl || '/assets/cat-wellness.jpg'}
                                      alt={itemName}
                                      className="w-14 h-14 object-contain bg-white rounded-xl p-1.5 border border-slate-200/70 shrink-0"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/assets/cat-wellness.jpg';
                                      }}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p
                                        className="text-xs sm:text-[13px] font-bold text-slate-800 line-clamp-2 leading-snug"
                                        title={itemName}
                                      >
                                        {itemName}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                        {p.store && (
                                          <span className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                                            {p.store}
                                          </span>
                                        )}
                                        <span className="px-1.5 py-0.5 rounded-md bg-slate-200/70 text-[10px] font-bold text-slate-700">
                                          Qty: {itemQty}
                                        </span>
                                        {itemPrice > 0 && (
                                          <span className="text-[11px] font-semibold text-slate-500">
                                            ₹{itemPrice.toLocaleString('en-IN')} each
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {products.length === 1 && lineTotal > 0 && (
                                    <div className="text-right shrink-0 pl-2 border-l border-slate-200/80">
                                      <div className="text-[10px] font-semibold text-slate-400 uppercase">
                                        Item Subtotal
                                      </div>
                                      <div className="text-sm font-extrabold text-slate-900">
                                        ₹{lineTotal.toLocaleString('en-IN')}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {isQuoteReady && (
                            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-[#0066FF]" />
                                  <span>Official Quotation Ready for Review &amp; Approval</span>
                                </div>
                                <p className="text-[11px] text-slate-600 mt-0.5">
                                  Total Cost: <strong>₹{totalAmt.toLocaleString('en-IN')}</strong>. Approving will automatically confirm order, place items into the procurement queue, and dispatch your tax invoice.
                                </p>
                              </div>
                              <button
                                onClick={() => handleApproveQuotation(req.id)}
                                className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer shadow-xs transition-all active:scale-95"
                              >
                                Approve Quotation &amp; Pay
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Card Footer */}
                        <div className="px-5 py-2.5 bg-slate-50/40 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {isPurchasing
                              ? 'Our Mumbai team is procuring your items and preparing warehouse check-in.'
                              : isQuoteReady
                              ? 'Review the quotation above to proceed with procurement.'
                              : isRejected
                              ? 'This request was declined. You can submit a new Buy For Me request anytime.'
                              : 'Submitted for verification by the India2World operations desk.'}
                          </span>
                          {isPurchasing && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('my-purchases')}
                              className="text-[#0066FF] hover:text-[#0052cc] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>View in My Purchases</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 3: MY PURCHASES */}
        {activeTab === 'my-purchases' && (() => {
          const resolveItemImage = (order: IntegratedOrderRecord, item: { title: string; imageUrl?: string }) => {
            if (item.imageUrl && item.imageUrl.trim()) {
              return item.imageUrl;
            }
            const linkedReq = customerRequests.find((r) => r.id === order.requestId);
            const matchedFromLinked = linkedReq?.products?.find(
              (p) => p.title.trim().toLowerCase() === item.title.trim().toLowerCase() && p.imageUrl
            );
            if (matchedFromLinked?.imageUrl) return matchedFromLinked.imageUrl;

            for (const req of customerRequests) {
              const matched = req.products?.find(
                (p) => p.title.trim().toLowerCase() === item.title.trim().toLowerCase() && p.imageUrl
              );
              if (matched?.imageUrl) return matched.imageUrl;
            }
            return '';
          };

          const purchasedItems = customerOrders.flatMap((order) =>
            order.items.map((i) => ({
              orderId: order.id,
              name: i.title,
              store: i.store,
              price: `₹${i.price.toLocaleString('en-IN')}`,
              status:
                order.orderStatus === 'In Warehouse'
                  ? 'At Mumbai Warehouse'
                  : order.orderStatus === 'Procuring'
                  ? 'Procuring from Merchant'
                  : order.orderStatus === 'Consolidating'
                  ? 'In Packing Hub'
                  : order.orderStatus === 'Dispatched'
                  ? 'Dispatched Internationally'
                  : 'Delivered',
              img: resolveItemImage(order, i),
            }))
          );

          const displayPurchasedItems =
            purchasedItems.length > 0
              ? purchasedItems
              : isDemoUser
              ? [
                  {
                    name: "Nike Men's Running Shoes (Blue, Size 9)",
                    store: 'Amazon India',
                    price: '₹3,999',
                    status: 'At Mumbai Warehouse',
                    img: '/assets/product-shoes.jpg',
                  },
                  {
                    name: "Women's Kurta Set (Pink, Size M)",
                    store: 'Myntra',
                    price: '₹1,299',
                    status: 'At Mumbai Warehouse',
                    img: '/assets/product-kurta.jpg',
                  },
                  {
                    name: 'Atomic Habits & Sapiens',
                    store: 'Amazon India',
                    price: '₹899',
                    status: 'At Mumbai Warehouse',
                    img: '/assets/product-book.jpg',
                  },
                  {
                    name: 'Boat Rockerz 450 Headphones',
                    store: 'Amazon India',
                    price: '₹1,499',
                    status: 'In Transit to Hub',
                    img: '/assets/cat-electronics.jpg',
                  },
                  {
                    name: 'Khadi Herbal Hair Oil',
                    store: 'Nykaa',
                    price: '₹1,000',
                    status: 'In Transit to Hub',
                    img: '/assets/cat-wellness.jpg',
                  },
                ]
              : [];

          return (
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="font-extrabold text-slate-900 text-2xl">Purchased Items History</h3>
                <p className="text-slate-500 text-xs sm:text-sm">
                  {displayPurchasedItems.length} items procured by our Mumbai purchasing desk.
                </p>
              </div>

              {displayPurchasedItems.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-base mb-1">No Purchased Items Yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Once you approve and pay for an assisted purchase quote, our team buys the items from Indian retailers and logs their arrival here.
                  </p>
                  <button
                    onClick={() => setActiveTab('buy-for-me')}
                    className="px-4 py-2 bg-[#0066FF] text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-[#0052cc]"
                  >
                    <Plus className="w-4 h-4" /> Start Buy For Me Request
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Item</th>
                        <th className="p-3">Merchant</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {displayPurchasedItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3 flex items-center gap-3">
                            {item.img ? (
                              <img
                                src={item.img}
                                alt={item.name}
                                className="w-11 h-11 object-contain rounded-lg border border-slate-200 bg-white p-0.5 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                                <ShoppingBag className="w-5 h-5" />
                              </div>
                            )}
                            <span className="font-semibold">{item.name}</span>
                          </td>
                          <td className="p-3">{item.store}</td>
                          <td className="p-3 font-bold">{item.price}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                              {item.status}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => setActiveTab('my-warehouse')}
                              className="text-xs font-bold text-[#0066FF] hover:underline cursor-pointer"
                            >
                              View in Locker
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 4: MY WAREHOUSE */}
        {activeTab === 'my-warehouse' && (() => {
          const resolveOrderImg = (order: IntegratedOrderRecord, item: { title: string; imageUrl?: string }) => {
            if (item.imageUrl && item.imageUrl.trim()) return item.imageUrl;
            const linkedReq = customerRequests.find((r) => r.id === order.requestId);
            const matchedLinked = linkedReq?.products?.find(
              (p) => p.title.trim().toLowerCase() === item.title.trim().toLowerCase() && p.imageUrl
            );
            if (matchedLinked?.imageUrl) return matchedLinked.imageUrl;
            for (const req of customerRequests) {
              const matched = req.products?.find(
                (p) => p.title.trim().toLowerCase() === item.title.trim().toLowerCase() && p.imageUrl
              );
              if (matched?.imageUrl) return matched.imageUrl;
            }
            return '';
          };

          const normalizedPhysicalPackages = customerPackages.map((pkg: any) => ({
            id: pkg.id,
            packageNumber: pkg.packageNumber || pkg.id,
            description:
              pkg.description ||
              `${pkg.seller || 'Indian Store'} Parcel${pkg.trackingNumber ? ` (${pkg.trackingNumber})` : ''}`,
            store: pkg.senderStore || pkg.seller || 'Indian Store',
            photoUrl: pkg.photos?.[0] || pkg.photoUrl || '',
            weightKg: pkg.weightKg ?? pkg.actualWeightKg ?? 1.0,
            dimensionsCm:
              pkg.dimensionsCm ||
              (pkg.lengthCm && pkg.widthCm && pkg.heightCm
                ? `${pkg.lengthCm} × ${pkg.widthCm} × ${pkg.heightCm}`
                : 'Standard Box'),
            receivedDate: pkg.receivedDate || pkg.arrivalDate || 'Arrived',
            freeStorageDaysLeft: pkg.freeStorageDaysLeft ?? Math.max(0, 30 - (pkg.storageDays || 0)),
            status: pkg.status || 'Received',
            warehouseLocation: pkg.warehouseLocation || 'Mumbai Hub',
            isIncomingOrder: false,
          }));

          const loggedOrderIds = new Set(
            customerPackages.map((p: any) => p.requestId).filter(Boolean)
          );

          const orderDerivedPackages = customerOrders
            .filter((o) => !loggedOrderIds.has(o.id) && (!o.requestId || !loggedOrderIds.has(o.requestId)))
            .flatMap((order) =>
              order.items.map((item, idx) => ({
                id: `PKG-${order.id.replace('ORD-', '')}-${idx + 1}`,
                packageNumber: `${order.id} • Item ${idx + 1}`,
                description: item.title,
                store: item.store || 'Indian Online Store',
                photoUrl: resolveOrderImg(order, item),
                weightKg: 0.5,
                dimensionsCm: 'Pending Hub Weighing',
                receivedDate: order.createdAt,
                freeStorageDaysLeft: 30,
                status:
                  order.orderStatus === 'In Warehouse'
                    ? 'In Warehouse'
                    : order.orderStatus === 'Consolidating'
                    ? 'Ready for Consolidation'
                    : order.orderStatus === 'Dispatched'
                    ? 'Dispatched'
                    : order.orderStatus === 'Delivered'
                    ? 'Delivered'
                    : 'Awaiting Arrival at Hub',
                warehouseLocation: order.orderStatus === 'In Warehouse' ? 'Mumbai Hub' : 'In Transit to Mumbai Hub',
                isIncomingOrder: order.orderStatus === 'Procuring',
              }))
            );

          const displayedPackages =
            normalizedPhysicalPackages.length > 0 || orderDerivedPackages.length > 0
              ? [...normalizedPhysicalPackages, ...orderDerivedPackages]
              : isDemoUser
              ? sampleWarehousePackages
              : [];

          return (
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-2xl">
                    Packages in Locker ({displayedPackages.length})
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Locker #{currentUser.lockerId || currentUser.customerId || 'I2W-10028'} • Unit 4B, Sakinaka, Andheri East, Mumbai 400072
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAddressModalOpen(true)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-[#0066FF]" /> My Locker Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('consolidation')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Boxes className="w-4 h-4" /> Consolidate Selected
                  </button>
                </div>
              </div>

              {displayedPackages.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto mb-3">
                    <Warehouse className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-base mb-1">Your Locker is Empty</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Order from Indian shopping sites and ship to your personalized India2World locker address. Once packages arrive at our Mumbai hub, you will see high-res photos and package weights here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAddressModalOpen(true)}
                    className="px-4 py-2 bg-[#0066FF] text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-[#0052cc]"
                  >
                    <MapPin className="w-4 h-4" /> View My Locker Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedPackages.map((pkg: any) => {
                    const isSelected = selectedPackages.includes(pkg.id);
                    const isAwaiting = pkg.status === 'Awaiting Arrival at Hub';
                    return (
                      <div
                        key={pkg.id}
                        className={`rounded-2xl border overflow-hidden hover:shadow-md transition-all flex flex-col ${
                          isSelected ? 'border-[#0066FF] ring-1 ring-[#0066FF]/30' : 'border-slate-200'
                        }`}
                      >
                        <div className="h-44 bg-slate-50 relative flex items-center justify-center p-4">
                          {pkg.photoUrl ? (
                            <img
                              src={pkg.photoUrl}
                              alt={pkg.description}
                              className="max-h-full max-w-full object-contain rounded-lg"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center">
                              <Package className="w-7 h-7" />
                            </div>
                          )}
                          <span
                            className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                              isAwaiting
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {pkg.status}
                          </span>
                          <label className="absolute top-3 right-3 inline-flex items-center gap-1 bg-white/95 px-2 py-1 rounded-lg border border-slate-200 shadow-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setSelectedPackages(selectedPackages.filter((id) => id !== pkg.id));
                                } else {
                                  setSelectedPackages([...selectedPackages, pkg.id]);
                                }
                              }}
                              className="w-3.5 h-3.5 rounded text-[#0066FF] cursor-pointer"
                            />
                            <span className="text-[10px] font-bold text-slate-600">Select</span>
                          </label>
                        </div>
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-[#0066FF] truncate">
                                {pkg.packageNumber || pkg.id}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                                {pkg.store || pkg.senderStore}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm mt-1 leading-snug line-clamp-2">
                              {pkg.description}
                            </h4>
                          </div>

                          <div className="text-xs text-slate-500 space-y-1.5 pt-2.5 border-t border-slate-100">
                            <div className="flex justify-between">
                              <span>Est. Weight:</span>
                              <strong className="text-slate-800">{pkg.weightKg || pkg.actualWeightKg} kg</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Dimensions:</span>
                              <strong className="text-slate-800">{pkg.dimensionsCm}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>{isAwaiting ? 'Ordered:' : 'Received:'}</span>
                              <span>{pkg.receivedDate}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Free Storage:</span>
                              <span className="text-emerald-700 font-semibold">
                                {pkg.freeStorageDaysLeft ?? 30} days left
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 5: CONSOLIDATION */}
        {activeTab === 'consolidation' && (() => {
          const normalizedPhysical = customerPackages.map((pkg: any) => ({
            id: pkg.id,
            packageNumber: pkg.packageNumber || pkg.id,
            senderStore: pkg.senderStore || pkg.seller || 'Indian Store',
            description:
              pkg.description ||
              `${pkg.seller || 'Indian Store'} Parcel${pkg.trackingNumber ? ` (${pkg.trackingNumber})` : ''}`,
            weightKg: pkg.weightKg ?? pkg.actualWeightKg ?? 1.0,
            dimensionsCm:
              pkg.dimensionsCm ||
              (pkg.lengthCm && pkg.widthCm && pkg.heightCm
                ? `${pkg.lengthCm} × ${pkg.widthCm} × ${pkg.heightCm} cm`
                : 'Standard Box'),
          }));

          const loggedOrderIds = new Set(
            customerPackages.map((p: any) => p.requestId).filter(Boolean)
          );

          const orderDerived = customerOrders
            .filter((o) => !loggedOrderIds.has(o.id) && (!o.requestId || !loggedOrderIds.has(o.requestId)))
            .flatMap((order) =>
              order.items.map((item, idx) => ({
                id: `PKG-${order.id.replace('ORD-', '')}-${idx + 1}`,
                packageNumber: `${order.id} • Item ${idx + 1}`,
                senderStore: item.store || 'Indian Online Store',
                description: item.title,
                weightKg: 0.5,
                dimensionsCm: 'Pending Hub Weighing',
              }))
            );

          const displayedPackages =
            normalizedPhysical.length > 0 || orderDerived.length > 0
              ? [...normalizedPhysical, ...orderDerived]
              : isDemoUser
              ? sampleWarehousePackages
              : [];

          const decodeHtmlText = (text: string) =>
            (text || '')
              .replace(/&amp;/gi, '&')
              .replace(/&quot;/gi, '"')
              .replace(/&#39;|&apos;/gi, "'")
              .replace(/&lt;/gi, '<')
              .replace(/&gt;/gi, '>')
              .replace(/\s+/g, ' ')
              .trim();

          const formatDimensionsLabel = (dim?: string) => {
            const raw = (dim || '').trim();
            if (!raw) return 'Pending Hub Weighing';
            if (/cm$/i.test(raw)) return raw;
            if (/^\d+(\.\d+)?\s*[x×]\s*\d+/i.test(raw)) return `${raw} cm`;
            return raw;
          };

          const selectedPkgObjects = displayedPackages.filter((pkg: any) =>
            selectedPackages.includes(pkg.id)
          );
          const totalSelectedWeightKg = selectedPkgObjects.reduce(
            (sum: number, pkg: any) => sum + Number(pkg.weightKg || pkg.actualWeightKg || 0.5),
            0
          );
          const estimatedSeparateCost = selectedPackages.length > 0 ? selectedPackages.length * 1800 : 0;
          const estimatedConsolidatedCost =
            selectedPackages.length > 0 ? Math.round(1450 + Math.max(0, selectedPackages.length - 1) * 350) : 0;
          const estimatedSavings = Math.max(0, estimatedSeparateCost - estimatedConsolidatedCost);
          const allSelected =
            displayedPackages.length > 0 && selectedPackages.length === displayedPackages.length;

          return (
            <div className="bg-white rounded-2xl p-5 sm:p-6 pb-20 sm:pb-8 shadow-xs border border-slate-100 space-y-6 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="min-w-0">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200/70">
                    Save Up to 80% on International Courier
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-2xl mt-2.5 tracking-tight">
                    Order Consolidation Center
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1">
                    Combine your individual incoming boxes into one single sturdy export carton to eliminate multiple base courier fees.
                  </p>
                </div>

                {displayedPackages.length > 0 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold whitespace-nowrap">
                      {selectedPackages.length} / {displayedPackages.length} Selected
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (allSelected) {
                          setSelectedPackages([]);
                        } else {
                          setSelectedPackages(displayedPackages.map((p: any) => p.id));
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#0066FF] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {allSelected ? 'Clear All' : 'Select All'}
                    </button>
                  </div>
                )}
              </div>

              {/* Package Selection List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Select Packages to Combine
                  </h4>
                  <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                    Weight &amp; Dimensions
                  </span>
                </div>

                {displayedPackages.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                    No packages currently available in locker to consolidate.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {displayedPackages.map((pkg: any) => {
                      const isChecked = selectedPackages.includes(pkg.id);
                      const cleanTitle = decodeHtmlText(pkg.description);
                      const storeName = (pkg.senderStore || pkg.seller || 'Indian Store').trim();
                      const formattedStore =
                        storeName.charAt(0).toUpperCase() + storeName.slice(1);
                      const dimLabel = formatDimensionsLabel(pkg.dimensionsCm);
                      const isPendingWeighing = dimLabel.toLowerCase().includes('pending');

                      return (
                        <label
                          key={pkg.id}
                          className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'border-[#0066FF] bg-blue-50/50 ring-1 ring-[#0066FF]/20'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                          }`}
                        >
                          {/* Left: Checkbox + Package Info */}
                          <div className="flex items-start gap-3.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedPackages(selectedPackages.filter((id) => id !== pkg.id));
                                } else {
                                  setSelectedPackages([...selectedPackages, pkg.id]);
                                }
                              }}
                              className="w-4.5 h-4.5 mt-0.5 rounded border-slate-300 text-[#0066FF] accent-[#0066FF] shrink-0 cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center flex-wrap gap-1.5 mb-1">
                                <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                  {pkg.packageNumber || pkg.id}
                                </span>
                                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                                  {formattedStore}
                                </span>
                              </div>
                              <p
                                className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 break-words"
                                title={cleanTitle}
                              >
                                {cleanTitle}
                              </p>
                            </div>
                          </div>

                          {/* Right: Weight & Dimensions (Fixed alignment, never wraps awkwardly) */}
                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 sm:gap-1 pl-8 sm:pl-4 sm:border-l sm:border-slate-100 shrink-0 sm:min-w-[156px]">
                            <span className="text-xs font-extrabold text-slate-800 whitespace-nowrap">
                              {Number(pkg.weightKg || pkg.actualWeightKg || 0.5).toFixed(1)} kg
                            </span>
                            <span
                              className={`text-[11px] font-medium whitespace-nowrap ${
                                isPendingWeighing
                                  ? 'px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70'
                                  : 'text-slate-500'
                              }`}
                            >
                              {dimLabel}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Savings & Weight Summary */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 space-y-2.5">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="font-semibold text-emerald-900">
                    Combined Estimated Weight ({selectedPackages.length}{' '}
                    {selectedPackages.length === 1 ? 'package' : 'packages'}):
                  </span>
                  <span className="font-extrabold text-emerald-950 whitespace-nowrap">
                    {totalSelectedWeightKg.toFixed(1)} kg
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm text-emerald-800">
                  <span>Estimated Separate Shipping Costs:</span>
                  <span className={estimatedSeparateCost > 0 ? 'line-through whitespace-nowrap' : 'whitespace-nowrap'}>
                    ₹{estimatedSeparateCost.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-base font-extrabold text-emerald-950 pt-2.5 border-t border-emerald-200/80">
                  <span>Consolidated Express Shipping:</span>
                  <span className="text-emerald-700 whitespace-nowrap">
                    {selectedPackages.length > 0 ? (
                      <>
                        ₹{estimatedConsolidatedCost.toLocaleString('en-IN')}{' '}
                        {estimatedSavings > 0 && (
                          <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full ml-1">
                            You Save ~₹{estimatedSavings.toLocaleString('en-IN')}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-emerald-700/80">
                        Select packages to estimate
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Primary Action */}
              <button
                type="button"
                onClick={() => {
                  const weightKg = Number(Math.max(0.5, totalSelectedWeightKg).toFixed(1));
                  const created = createConsolidatedShipment({
                    customerId: currentUser.customerId,
                    customerName: currentUser.name,
                    destination: currentUser.country || 'United Arab Emirates',
                    carrier: 'DHL Express',
                    packageIds: selectedPackages,
                    chargeableWeightKg: weightKg,
                  });
                  setCustomerShipments(getShipmentsByCustomerId(currentUser.customerId));
                  setSelectedPackages([]);
                  setQuotationToast(
                    `Consolidation confirmed! Shipment ${created.trackingNumber} (DHL Express) created for ${selectedPackages.length} package(s).`
                  );
                  setTimeout(() => setQuotationToast(''), 6000);
                  setActiveTab('shipments');
                }}
                disabled={selectedPackages.length === 0}
                className={`w-full py-3.5 px-5 rounded-xl font-extrabold text-sm sm:text-base shadow-sm transition-all ${
                  selectedPackages.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#0066FF] hover:bg-[#0052CC] text-white cursor-pointer shadow-blue-500/20'
                }`}
              >
                {selectedPackages.length > 0
                  ? `Request Consolidation & Repacking (${selectedPackages.length} ${
                      selectedPackages.length === 1 ? 'Package' : 'Packages'
                    })`
                  : 'Select Packages to Request Consolidation & Repacking'}
              </button>
            </div>
          );
        })()}

        {/* TAB 6: SHIPMENTS */}
        {activeTab === 'shipments' && (() => {
          const normalizedAdminShipments = customerShipments.map((shp: any) => ({
            id: shp.id,
            trackingNumber: shp.trackingNumber || shp.id,
            carrier: shp.carrier || 'DHL Express',
            destination:
              shp.destination ||
              [shp.destinationCity, shp.destinationCountry].filter(Boolean).join(', ') ||
              currentUser.country ||
              'International',
            status: shp.status || 'In Transit',
            packagesCount: shp.packageCount ?? shp.packagesCount ?? 1,
            weightKg: shp.chargeableWeightKg ?? shp.weightKg ?? 1.0,
            estimatedDelivery: shp.estimatedArrival || shp.estimatedDelivery || 'In 3-5 business days',
            departureDate: shp.departureDate || 'Scheduled',
            itemsSummary: '',
          }));

          const orderDerivedShipments = customerOrders
            .filter(
              (ord) =>
                !normalizedAdminShipments.some(
                  (s) => s.trackingNumber === ord.trackingAwb || s.id === `SHP-${ord.id.replace('ORD-', '')}`
                )
            )
            .map((ord) => ({
              id: `SHP-${ord.id.replace('ORD-', '')}`,
              trackingNumber: ord.trackingAwb || `I2W-${ord.id.replace('ORD-', '')}`,
              carrier: ord.trackingAwb ? 'DHL Express' : 'India2World Air Cargo',
              destination: ord.destination || currentUser.country || 'International',
              status:
                ord.orderStatus === 'Delivered'
                  ? 'Delivered'
                  : ord.orderStatus === 'Dispatched'
                  ? 'In Transit'
                  : ord.orderStatus === 'Consolidating'
                  ? 'Consolidating'
                  : ord.orderStatus === 'In Warehouse'
                  ? 'At Mumbai Hub (Ready to Dispatch)'
                  : 'Preparing at Mumbai Hub',
              packagesCount: ord.itemCount || ord.items.length || 1,
              weightKg: Number(Math.max(0.5, (ord.itemCount || ord.items.length || 1) * 0.5).toFixed(1)),
              estimatedDelivery:
                ord.orderStatus === 'Delivered'
                  ? 'Delivered'
                  : ord.orderStatus === 'Dispatched'
                  ? 'Est. 3-5 business days'
                  : 'Awaiting hub dispatch',
              departureDate: ord.createdAt,
              itemsSummary: ord.items.map((i) => i.title).join(', '),
            }));

          const displayedShipments =
            normalizedAdminShipments.length > 0 || orderDerivedShipments.length > 0
              ? [...normalizedAdminShipments, ...orderDerivedShipments]
              : isDemoUser
              ? sampleShipments.map((s) => ({
                  ...s,
                  destination: `${s.destinationCity}, ${s.destinationCountry}`,
                  departureDate: 'In Transit',
                  itemsSummary: '',
                }))
              : [];

          return (
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-2xl">
                    International Shipments ({displayedShipments.length})
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Real-time tracking of orders en route from India to your destination.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('consolidation')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-center"
                >
                  <Boxes className="w-4 h-4" /> Consolidate Packages
                </button>
              </div>

              <div className="space-y-4">
                {displayedShipments.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto mb-3">
                      <Plane className="w-6 h-6" />
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-base mb-1">No Active Shipments Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                      Once your locker packages are consolidated and dispatched through international air courier (DHL, FedEx, Aramex), real-time live flight tracking will appear here.
                    </p>
                  </div>
                ) : (
                  displayedShipments.map((shp: any) => (
                    <div
                      key={shp.id}
                      className="p-5 rounded-2xl border border-slate-200 space-y-3.5 hover:border-blue-200 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-slate-900 text-base">
                              {shp.trackingNumber}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#0066FF]">
                              {shp.carrier}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 mt-0.5 block">
                            To: {shp.destination}
                          </span>
                          {shp.itemsSummary && (
                            <span className="text-[11px] text-slate-400 mt-0.5 block truncate max-w-md">
                              Items: {shp.itemsSummary}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              shp.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-700'
                                : shp.status === 'In Transit'
                                ? 'bg-blue-100 text-[#0066FF]'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {shp.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setTrackingNumberToView(shp.trackingNumber);
                              setTrackingModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-[#0066FF] text-white text-xs font-bold rounded-lg shadow-2xs hover:bg-[#0052CC] cursor-pointer"
                          >
                            Track Live
                          </button>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 flex flex-wrap gap-4">
                        <span>
                          Items / Packages:{' '}
                          <strong className="text-slate-800">{shp.packagesCount}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Est. Weight: <strong className="text-slate-800">{shp.weightKg} kg</strong>
                        </span>
                        <span>•</span>
                        <span>
                          ETA: <strong className="text-slate-800">{shp.estimatedDelivery}</strong>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB 7: PAYMENTS & INVOICES */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6 animate-in fade-in duration-200">
            <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-2xl">Billing & Payment Invoices</h3>
                <p className="text-slate-500 text-xs sm:text-sm">
                  Official tax invoices for assisted purchases, international air freight, and repackaging.
                </p>
              </div>
              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-medium">
                Registered Account: <strong className="text-slate-800">{currentUser.email}</strong>
              </div>
            </div>

            {invoiceToast && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-900 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0066FF] shrink-0" />
                  <span>{invoiceToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInvoiceToast('')}
                  className="text-blue-600 hover:text-blue-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="w-full">
              {(() => {
                const emailNorm = (currentUser.email || '').trim().toLowerCase();
                const idNorm = (currentUser.customerId || '').trim().toLowerCase();
                const isolatedInvoices = invoices.filter((inv) => {
                  const invEmail = (inv.customerEmail || '').trim().toLowerCase();
                  const invCustId = (inv.customerId || '').trim().toLowerCase();
                  return (emailNorm && invEmail === emailNorm) || (idNorm && invCustId === idNorm);
                });

                const customerFreightPayments = getAllPayments().filter(
                  (p) =>
                    p.customerId === currentUser.customerId &&
                    !isolatedInvoices.some((inv) => inv.orderId === p.referenceId || inv.invoiceNumber === p.referenceId)
                );

                const totalInvoicesPaidINR = isolatedInvoices.reduce((sum, inv) => sum + (inv.totalINR || 0), 0);
                const totalFreightPaidINR = customerFreightPayments.reduce((sum, p) => sum + (p.amountINR || 0), 0);
                const grandTotalPaidINR = totalInvoicesPaidINR + totalFreightPaidINR;

                if (isolatedInvoices.length === 0 && customerFreightPayments.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-400 border border-slate-100 rounded-xl">
                      <div className="py-6 space-y-2">
                        <p className="font-semibold text-slate-600">No orders or invoices generated yet for this account.</p>
                        <p className="text-xs text-slate-400">
                          When you place or confirm an assisted purchase order, your official tax invoices will appear here automatically.
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-5">
                    {/* Payment Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Total Paid</div>
                        <div className="text-xl font-extrabold text-[#0B1933] mt-0.5">
                          ₹{grandTotalPaidINR.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Across {isolatedInvoices.length + customerFreightPayments.length} payment{isolatedInvoices.length + customerFreightPayments.length === 1 ? '' : 's'}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Order Invoices</div>
                        <div className="text-xl font-extrabold text-[#0B1933] mt-0.5">
                          ₹{totalInvoicesPaidINR.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {isolatedInvoices.length} paid tax invoice{isolatedInvoices.length === 1 ? '' : 's'}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Air Freight &amp; Extra</div>
                        <div className="text-xl font-extrabold text-[#0B1933] mt-0.5">
                          ₹{totalFreightPaidINR.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {customerFreightPayments.length} shipping/consolidation charge{customerFreightPayments.length === 1 ? '' : 's'}
                        </div>
                      </div>
                    </div>

                    {/* Desktop / Tablet Full-Width Table (No Horizontal Scroll) */}
                    {isolatedInvoices.length > 0 && (
                    <div className="hidden lg:block w-full border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full table-fixed text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-3 w-[16%]">Invoice #</th>
                            <th className="py-3 px-2 w-[15%]">Date</th>
                            <th className="py-3 px-2 w-[26%]">Items / Description</th>
                            <th className="py-3 px-2 w-[11%]">Total</th>
                            <th className="py-3 px-2 w-[10%]">Payment</th>
                            <th className="py-3 px-2 w-[11%]">Email</th>
                            <th className="py-3 px-3 w-[11%] text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                          {isolatedInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors align-middle">
                              <td className="py-3.5 px-3">
                                <div className="font-mono font-bold text-[#0066FF] text-[12px] truncate" title={inv.invoiceNumber}>
                                  {inv.invoiceNumber}
                                </div>
                              </td>
                              <td className="py-3.5 px-2 text-slate-600 whitespace-nowrap truncate" title={inv.createdAt}>
                                {inv.createdAt}
                              </td>
                              <td className="py-3.5 px-2">
                                <div className="font-medium text-slate-800 truncate" title={inv.items.map((i) => i.title).join(', ')}>
                                  {inv.items.map((i) => i.title).join(', ')}
                                </div>
                              </td>
                              <td className="py-3.5 px-2">
                                <div className="font-extrabold text-[#0B1933] whitespace-nowrap">
                                  ₹{inv.totalINR.toLocaleString('en-IN')}
                                </div>
                              </td>
                              <td className="py-3.5 px-2">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                  {inv.paymentStatus}
                                </span>
                              </td>
                              <td className="py-3.5 px-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold max-w-full ${
                                    inv.emailStatus === 'Sent'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : inv.emailStatus === 'Pending'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-red-50 text-red-700 border border-red-200'
                                  }`}
                                  title={inv.emailDeliveryLog || `${inv.emailStatus} to ${inv.customerEmail}`}
                                >
                                  <Mail className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{inv.emailStatus}</span>
                                </span>
                              </td>
                              <td className="py-3.5 px-2 text-center align-middle">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedInvoice(inv)}
                                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                    title="View Invoice Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => downloadInvoiceDocument(inv)}
                                    className="p-1.5 text-[#0066FF] hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                                    title="Download PDF Invoice"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={resendingInvoiceNum === inv.invoiceNumber}
                                    onClick={() => handleResendInvoice(inv)}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                                    title="Resend Invoice to Email"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    )}

                    {/* Mobile / Small Screen Stacked Cards (No Horizontal Scroll) */}
                    {isolatedInvoices.length > 0 && (
                    <div className="lg:hidden space-y-3">
                      {isolatedInvoices.map((inv) => (
                        <div key={inv.id} className="p-4 rounded-xl border border-slate-200/80 bg-white space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-mono font-bold text-[#0066FF] text-sm">{inv.invoiceNumber}</div>
                              <div className="text-[11px] text-slate-500">{inv.createdAt}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-extrabold text-[#0B1933] text-sm">₹{inv.totalINR.toLocaleString('en-IN')}</div>
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 mt-0.5">
                                {inv.paymentStatus}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-800 font-medium truncate">
                            {inv.items.map((i) => i.title).join(', ')}
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                            <div className="min-w-0">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  inv.emailStatus === 'Sent'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : inv.emailStatus === 'Pending'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                              >
                                <Mail className="w-3 h-3 shrink-0" />
                                <span>{inv.emailStatus}</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setSelectedInvoice(inv)}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="View Invoice Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadInvoiceDocument(inv)}
                                className="p-1.5 text-[#0066FF] hover:bg-blue-50 rounded-lg cursor-pointer"
                                title="Download PDF Invoice"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                disabled={resendingInvoiceNum === inv.invoiceNumber}
                                onClick={() => handleResendInvoice(inv)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer disabled:opacity-50"
                                title="Resend Invoice to Email"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    )}

                    {/* International Air Freight / Consolidation Payments */}
                    {customerFreightPayments.length > 0 && (
                      <div className="pt-2 space-y-2.5">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                          International Air Freight &amp; Consolidation Payments ({customerFreightPayments.length})
                        </h4>
                        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                          {customerFreightPayments.map((pay) => (
                            <div key={pay.id} className="p-3.5 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
                              <div>
                                <div className="font-bold text-slate-900">
                                  {pay.purpose} <span className="font-mono text-[#0066FF] ml-1">({pay.referenceId})</span>
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  Ref: {pay.id} &bull; {pay.date} &bull; {pay.method}
                                </div>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span className="font-extrabold text-[#0B1933]">₹{pay.amountINR.toLocaleString('en-IN')}</span>
                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                  {pay.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 8: ADDRESSES */}
        {activeTab === 'addresses' && (
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6 animate-in fade-in duration-200">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-2xl">Addresses & Lockers</h3>
              <p className="text-slate-500 text-xs sm:text-sm">
                Manage your Indian warehouse receiving locker and international delivery destinations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Indian Locker */}
              <div className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white shadow-2xs transition-colors space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                    Indian Receiving Warehouse
                  </span>
                  <button
                    type="button"
                    onClick={() => setAddressModalOpen(true)}
                    className="text-xs font-bold text-[#0066FF] hover:underline cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    {currentUser.name} / {currentUser.customerId}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {indianLockerAddress.addressLine1} <br />
                    {indianLockerAddress.addressLine2} <br />
                    {indianLockerAddress.city}, {indianLockerAddress.state} -{' '}
                    {indianLockerAddress.pincode}, India <br />
                    Phone: {indianLockerAddress.phone}
                  </p>
                </div>
              </div>

              {/* International Delivery Address */}
              <div className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white shadow-2xs transition-colors space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                    Primary International Destination
                  </span>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{currentUser.name}</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Apartment 1402, Marina Crown Tower <br />
                    Dubai Marina, Near Tram Station <br />
                    {currentUser.country} <br />
                    Phone: {currentUser.phone}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: SUPPORT */}
        {activeTab === 'support' && (
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6 animate-in fade-in duration-200">
            <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-2xl">Help & Customer Support</h3>
                <p className="text-slate-500 text-xs sm:text-sm">
                  Get dedicated support for your purchases, packages, or customs clearances.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsTicketModalOpen(true)}
                className="self-start sm:self-auto px-4 py-2 bg-[#0066FF] hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Support Ticket
              </button>
            </div>

            {/* Notification alert banner if recently created */}
            {supportSuccessToast && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{supportSuccessToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSupportSuccessToast('')}
                  className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-center space-y-2 hover:border-emerald-400 transition-colors shadow-2xs">
                <div className="flex items-center justify-center gap-1 text-[#25D366]">
                  <WhatsAppIcon className="w-5 h-5" />
                  <span className="text-[11px] font-extrabold uppercase text-[#128C7E] tracking-wider">Fastest Reply</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">WhatsApp Live Chat</h4>
                <p className="text-xs text-slate-600 font-medium">{WHATSAPP_DISPLAY_PHONE}</p>
                <button
                  type="button"
                  onClick={() =>
                    openWhatsApp(
                      'Hello BoxMyIndia support! I am currently logged into my Customer Dashboard and need assistance with my account/packages.',
                      '919747023382'
                    )
                  }
                  className="px-3.5 py-1.5 bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  Chat on WhatsApp
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 text-center space-y-2 hover:border-blue-300 transition-colors">
                <h4 className="font-bold text-slate-900 text-sm">Customer Care Helpline</h4>
                <p className="text-xs text-slate-500">{WHATSAPP_DISPLAY_PHONE} (Priority Support)</p>
                <a
                  href="tel:+919747023382"
                  className="px-3 py-1.5 bg-[#0066FF] hover:bg-[#0052cc] active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Call Support Desk
                </a>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 text-center space-y-2 hover:border-slate-400 transition-colors">
                <h4 className="font-bold text-slate-900 text-sm">Email Support</h4>
                <p className="text-xs text-slate-500">support@india2world.com</p>
                <button
                  type="button"
                  onClick={handleOpenEmailModal}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Send Email
                </button>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 text-center space-y-2 hover:border-blue-300 transition-colors">
                <h4 className="font-bold text-slate-900 text-sm">Create Support Ticket</h4>
                <p className="text-xs text-slate-500">Track complex shipping inquiries</p>
                <button
                  type="button"
                  onClick={() => setIsTicketModalOpen(true)}
                  className="px-3 py-1.5 bg-[#0066FF] hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Ticket
                </button>
              </div>
            </div>

            {/* Support Tickets Section */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">Active Support Tickets</h4>
                  <p className="text-xs text-slate-500">View real-time agent updates and reply to inquiries</p>
                </div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                  {supportTickets.length} Total
                </span>
              </div>

              <div className="space-y-3">
                {supportTickets.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto mb-3">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-base mb-1">No Support Tickets Yet</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                      Need help with an Indian assisted purchase, warehouse inspection, or shipping tracking? Create a support ticket to get dedicated assistance.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsTicketModalOpen(true)}
                      className="px-4 py-2 bg-[#0066FF] text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-[#0052cc]"
                    >
                      <Plus className="w-4 h-4" /> Create Support Ticket
                    </button>
                  </div>
                ) : (
                  supportTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setViewingTicket(ticket)}
                      className="p-4 rounded-xl border border-slate-200 hover:border-[#0066FF] hover:bg-slate-50/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#0066FF] bg-blue-50 px-2 py-0.5 rounded">
                            {ticket.id}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {ticket.category}
                          </span>
                          {ticket.referenceId && (
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              Ref: {ticket.referenceId}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              ticket.priority === 'Urgent' || ticket.priority === 'High'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : ticket.priority === 'Medium'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ticket.priority}
                          </span>
                        </div>
                        <h5 className="font-bold text-slate-900 text-sm">{ticket.subject}</h5>
                        <p className="text-xs text-slate-500 line-clamp-1">{ticket.lastReply}</p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-right">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                              ticket.status === 'Resolved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ticket.status === 'In Progress'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {ticket.status}
                          </span>
                          <div className="text-[11px] text-slate-400 mt-0.5">{ticket.createdAt}</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingTicket(ticket);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-[#0066FF] hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: NOTIFICATIONS */}
        {activeTab === 'notifications' && (() => {
          type NotifCategory = 'order' | 'request' | 'warehouse' | 'shipment' | 'welcome';
          const decodeNotifText = (text: string) =>
            (text || '')
              .replace(/&amp;/gi, '&')
              .replace(/&quot;/gi, '"')
              .replace(/&#39;|&apos;/gi, "'")
              .replace(/\s+/g, ' ')
              .trim();

          const customerNotifications: Array<{
            id: string;
            category: NotifCategory;
            categoryLabel: string;
            refCode: string;
            statusLabel: string;
            title: string;
            subtitle?: string;
            time: string;
            targetTab: DashboardTab;
            read: boolean;
          }> = [];

          customerOrders.forEach((o) => {
            const id = `notif-ord-${o.id}`;
            const status = o.orderStatus || 'Procuring';
            const itemCount = o.items?.length || o.itemCount || 0;
            const stores = Array.from(
              new Set((o.items || []).map((i) => i.store).filter(Boolean))
            )
              .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
              .join(', ');
            const firstItem = o.items?.[0]?.title ? decodeNotifText(o.items[0].title) : '';
            const totalINR = o.totalINR || (o.items || []).reduce((acc, i) => acc + (i.price || 0) * (i.qty || 1), 0);
            const subtitleParts = [
              itemCount > 0 ? `${itemCount} ${itemCount === 1 ? 'item' : 'items'}` : '',
              stores || '',
              totalINR > 0 ? `₹${totalINR.toLocaleString('en-IN')}` : '',
              firstItem ? firstItem : '',
            ].filter(Boolean);

            customerNotifications.push({
              id,
              category: 'order',
              categoryLabel: 'Order Update',
              refCode: o.id,
              statusLabel: status,
              title: `Order ${o.id} confirmed and currently in processing (${status}).`,
              subtitle: subtitleParts.join(' • '),
              time: o.createdAt || 'Recent',
              targetTab: 'my-purchases',
              read: notificationsRead || readNotificationIds.includes(id),
            });
          });

          customerRequests.forEach((r: any) => {
            const id = `notif-req-${r.id}`;
            const ref = r.requestNumber || r.id;
            const status = r.status || 'Processing';
            const prodCount = r.products?.length || r.itemsCount || 0;
            const totalAmt = r.totalEstimatedINR || r.totalINR || 0;
            const subtitleParts = [
              prodCount > 0 ? `${prodCount} ${prodCount === 1 ? 'product' : 'products'}` : '',
              totalAmt > 0 ? `Est. ₹${Number(totalAmt).toLocaleString('en-IN')}` : '',
            ].filter(Boolean);

            customerNotifications.push({
              id,
              category: 'request',
              categoryLabel: 'Buy For Me',
              refCode: ref,
              statusLabel: status,
              title: `Buy For Me Request ${ref} status updated to "${status}".`,
              subtitle: subtitleParts.join(' • '),
              time: r.date || r.submittedAt || 'Recent',
              targetTab: 'my-requests',
              read: notificationsRead || readNotificationIds.includes(id),
            });
          });

          customerPackages.forEach((pkg: any) => {
            const id = `notif-pkg-${pkg.id}`;
            const ref = pkg.packageNumber || pkg.id;
            customerNotifications.push({
              id,
              category: 'warehouse',
              categoryLabel: 'Mumbai Locker',
              refCode: ref,
              statusLabel: 'Received',
              title: `Parcel ${ref} (${pkg.seller || 'Merchant'}) received at your Mumbai Locker.`,
              subtitle: pkg.description ? decodeNotifText(pkg.description) : undefined,
              time: pkg.receivedDate || 'Recent',
              targetTab: 'my-warehouse',
              read: notificationsRead || readNotificationIds.includes(id),
            });
          });

          customerShipments.forEach((shp: any) => {
            const id = `notif-shp-${shp.id}`;
            const ref = shp.trackingNumber || shp.id;
            customerNotifications.push({
              id,
              category: 'shipment',
              categoryLabel: 'Shipment',
              refCode: ref,
              statusLabel: shp.status || 'In Transit',
              title: `International Shipment ${ref} is ${shp.status} via ${shp.carrier}.`,
              subtitle: shp.destination ? `Destination: ${shp.destination}` : undefined,
              time: shp.departureDate || 'Recent',
              targetTab: 'shipments',
              read: notificationsRead || readNotificationIds.includes(id),
            });
          });

          if (customerNotifications.length === 0 && !isDemoUser) {
            const id = `notif-welcome-${currentUser.customerId}`;
            customerNotifications.push({
              id,
              category: 'welcome',
              categoryLabel: 'Account',
              refCode: currentUser.lockerId || 'I2W-' + currentUser.customerId.replace('CUS-', ''),
              statusLabel: 'Active',
              title: `Welcome to India2World, ${currentUser.name}! Your Mumbai Virtual Locker is active and ready.`,
              time: 'Just now',
              targetTab: 'overview',
              read: notificationsRead || readNotificationIds.includes(id),
            });
          } else if (customerNotifications.length === 0 && isDemoUser) {
            const id = 'notif-demo-1';
            customerNotifications.push({
              id,
              category: 'welcome',
              categoryLabel: 'Account',
              refCode: 'PORTAL',
              statusLabel: 'Active',
              title: 'Welcome to your customer portal overview.',
              time: 'Today, 10:30 AM',
              targetTab: 'overview',
              read: notificationsRead || readNotificationIds.includes(id),
            });
          }

          const unreadCount = customerNotifications.filter((n) => !n.read).length;
          const filteredNotifications = customerNotifications.filter((n) => {
            if (notificationFilter === 'all') return true;
            if (notificationFilter === 'unread') return !n.read;
            return n.category === notificationFilter;
          });

          const categoryCounts = {
            all: customerNotifications.length,
            unread: unreadCount,
            order: customerNotifications.filter((n) => n.category === 'order').length,
            request: customerNotifications.filter((n) => n.category === 'request').length,
            warehouse: customerNotifications.filter((n) => n.category === 'warehouse').length,
            shipment: customerNotifications.filter((n) => n.category === 'shipment').length,
          };

          const getCategoryStyle = (category: NotifCategory) => {
            switch (category) {
              case 'order':
                return {
                  icon: ShoppingBag,
                  iconBox: 'bg-blue-50 text-[#0066FF] border-blue-100',
                  badge: 'bg-blue-50 text-[#0066FF] border-blue-100',
                  actionLabel: 'View Order',
                };
              case 'request':
                return {
                  icon: FileText,
                  iconBox: 'bg-indigo-50 text-indigo-600 border-indigo-100',
                  badge: 'bg-indigo-50 text-indigo-700 border-indigo-100',
                  actionLabel: 'View Request',
                };
              case 'warehouse':
                return {
                  icon: Warehouse,
                  iconBox: 'bg-amber-50 text-amber-600 border-amber-100',
                  badge: 'bg-amber-50 text-amber-700 border-amber-100',
                  actionLabel: 'Open Locker',
                };
              case 'shipment':
                return {
                  icon: Truck,
                  iconBox: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                  badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                  actionLabel: 'Track Shipment',
                };
              default:
                return {
                  icon: Sparkles,
                  iconBox: 'bg-cyan-50 text-cyan-600 border-cyan-100',
                  badge: 'bg-cyan-50 text-cyan-700 border-cyan-100',
                  actionLabel: 'Go to Overview',
                };
            }
          };

          return (
            <div className="bg-white rounded-2xl p-5 sm:p-6 pb-24 sm:pb-10 shadow-xs border border-slate-100 space-y-5 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#0066FF] flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="font-extrabold text-slate-900 text-xl sm:text-2xl tracking-tight">
                        Notifications Center
                      </h3>
                      {unreadCount > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[#0066FF] text-xs font-bold whitespace-nowrap">
                          {unreadCount} Unread
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold whitespace-nowrap">
                          All Caught Up
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs sm:text-sm mt-0.5 truncate">
                      Account updates for {currentUser.name} ({currentUser.email})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={unreadCount === 0}
                  onClick={() => {
                    setNotificationsRead(true);
                    setReadNotificationIds(customerNotifications.map((n) => n.id));
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors shrink-0 whitespace-nowrap ${
                    unreadCount === 0
                      ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-blue-200 text-[#0066FF] hover:bg-blue-50 cursor-pointer'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  Mark all as read
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {(
                  [
                    { key: 'all', label: 'All', count: categoryCounts.all },
                    { key: 'unread', label: 'Unread', count: categoryCounts.unread },
                    { key: 'order', label: 'Orders', count: categoryCounts.order },
                    { key: 'request', label: 'Requests', count: categoryCounts.request },
                    { key: 'warehouse', label: 'Warehouse', count: categoryCounts.warehouse },
                    { key: 'shipment', label: 'Shipments', count: categoryCounts.shipment },
                  ] as const
                )
                  .filter((tab) => tab.key === 'all' || tab.key === 'unread' || tab.count > 0)
                  .map((tab) => {
                    const active = notificationFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setNotificationFilter(tab.key)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-[#0066FF] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                        }`}
                      >
                        <span>{tab.label}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                            active ? 'bg-white/20 text-white' : 'bg-white text-slate-600'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
              </div>

              {/* Notifications List — Uniform, consistent card styling */}
              {filteredNotifications.length === 0 ? (
                <div className="p-10 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">No notifications in this view</p>
                  <p className="text-xs text-slate-500">
                    {notificationFilter === 'unread'
                      ? 'You have read all your account notifications.'
                      : 'Updates about your orders, requests, and shipments will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((n) => {
                    const style = getCategoryStyle(n.category);
                    const IconComp = style.icon;
                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          if (!n.read) {
                            setReadNotificationIds((prev) =>
                              prev.includes(n.id) ? prev : [...prev, n.id]
                            );
                          }
                        }}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-xl border border-slate-200/90 bg-white hover:border-blue-300/80 hover:shadow-xs transition-all"
                      >
                        {/* Left: Icon + Content */}
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          <div
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${style.iconBox}`}
                          >
                            <IconComp className="w-4.5 h-4.5" />
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center flex-wrap gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide ${style.badge}`}
                              >
                                {n.categoryLabel}
                              </span>
                              <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                {n.refCode}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-500">
                                • {n.statusLabel}
                              </span>
                              {!n.read && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 text-[#0066FF] text-[10px] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />
                                  New
                                </span>
                              )}
                            </div>

                            <p className="text-sm font-bold text-slate-900 leading-snug break-words">
                              {n.title}
                            </p>

                            {n.subtitle && (
                              <p
                                className="text-xs text-slate-500 truncate"
                                title={n.subtitle}
                              >
                                {n.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Timestamp + Quick Action */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pl-13 sm:pl-4 sm:border-l sm:border-slate-100 shrink-0 sm:min-w-[156px]">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 whitespace-nowrap">
                            <Clock className="w-3 h-3 shrink-0" />
                            {n.time}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!n.read) {
                                setReadNotificationIds((prev) =>
                                  prev.includes(n.id) ? prev : [...prev, n.id]
                                );
                              }
                              setActiveTab(n.targetTab);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-[#0066FF] text-[#0066FF] hover:text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <span>{style.actionLabel}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 11: PROFILE */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6 animate-in fade-in duration-200">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-2xl">Profile & Security Settings</h3>
              <p className="text-slate-500 text-xs sm:text-sm">
                Manage your personal details, KYC verification, and international preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentUser.name}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  readOnly
                  value={currentUser.email}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentUser.phone}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Country of Residence
                </label>
                <input
                  type="text"
                  readOnly
                  value={currentUser.country}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm font-semibold text-slate-800"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">KYC Identity Verified</h4>
                  <p className="text-xs text-emerald-700">
                    Your export customs documentation is active for express air shipping.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold">
                Active
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Invoice Detail & Download Modal */}
      {selectedInvoice && (
        <div
          onClick={() => setSelectedInvoice(null)}
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
                    Official India2World Tax Invoice
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#0B1933]">
                    {selectedInvoice.invoiceNumber}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto py-4 space-y-4 pr-1">
              {/* Delivery Banner */}
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">
                    Automated delivery status: <strong>{selectedInvoice.emailStatus}</strong> to <strong>{selectedInvoice.customerEmail}</strong>
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-bold text-[10px] shrink-0">
                  {selectedInvoice.paymentStatus}
                </span>
              </div>

              {/* Bill to & Warehouse info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Billed To (Registered Account)</div>
                  <div className="font-bold text-slate-900 text-sm">{selectedInvoice.customerName}</div>
                  <div className="text-slate-600">Customer ID: {selectedInvoice.customerId}</div>
                  <div className="text-[#0066FF] font-semibold">{selectedInvoice.customerEmail}</div>
                  <div className="text-slate-500">Destination: {selectedInvoice.destinationCity}, {selectedInvoice.destinationCountry}</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Payment &amp; Fulfillment Details</div>
                  <div className="font-bold text-slate-900 text-sm">Order: {selectedInvoice.orderId}</div>
                  <div className="text-slate-600">Date: {selectedInvoice.createdAt}</div>
                  <div className="text-slate-600">Method: <strong className="text-slate-800">{selectedInvoice.paymentMethod || 'Online Payment'}</strong></div>
                  <div className="text-slate-500">Hub: Unit 4B, Sakinaka, Mumbai 400072</div>
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
                    {selectedInvoice.items.map((item, idx) => (
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
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2 max-w-sm ml-auto">
                <div className="flex justify-between text-slate-600">
                  <span>Products Subtotal:</span>
                  <span className="font-semibold text-slate-800">₹{selectedInvoice.subtotalINR.toLocaleString('en-IN')}</span>
                </div>
                {selectedInvoice.domesticShippingINR > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Domestic Shipping:</span>
                    <span className="font-semibold text-slate-800">₹{selectedInvoice.domesticShippingINR.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Assisted Procurement Fee:</span>
                  <span className="font-semibold text-slate-800">₹{selectedInvoice.serviceFeeINR.toLocaleString('en-IN')}</span>
                </div>
                {selectedInvoice.estimatedTaxINR > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Applicable Taxes:</span>
                    <span className="font-semibold text-slate-800">₹{selectedInvoice.estimatedTaxINR.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {selectedInvoice.discountINR > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount Applied:</span>
                    <span className="font-semibold">-₹{selectedInvoice.discountINR.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-[#0B1933]">
                  <span>Total Amount Paid:</span>
                  <span className="text-[#0066FF]">₹{selectedInvoice.totalINR.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Delivery Log */}
              {selectedInvoice.emailDeliveryLog && (
                <div className="text-[11px] text-slate-400 bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                  <strong>Transactional Delivery Record:</strong> {selectedInvoice.emailDeliveryLog}
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => printInvoiceDocument(selectedInvoice)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  disabled={resendingInvoiceNum === selectedInvoice.invoiceNumber}
                  onClick={() => handleResendInvoice(selectedInvoice)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{resendingInvoiceNum === selectedInvoice.invoiceNumber ? 'Sending...' : 'Resend Email'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => downloadInvoiceDocument(selectedInvoice)}
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
    </div>
  );
};
