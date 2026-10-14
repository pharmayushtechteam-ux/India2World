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
} from '../../services/orderInvoiceService';
import { DashboardTab, Page } from '../../types';
import { WarehouseAddressModal } from '../common/WarehouseAddressModal';
import { TrackingModal } from '../common/TrackingModal';
import { BuyForMePage } from '../buy-for-me/BuyForMePage';
import {
  getPurchaseRequestsByCustomerId,
  getPackagesByCustomerId,
  getShipmentsByCustomerId,
  getOrdersByCustomerId,
  getDynamicCustomerStats,
  confirmPurchaseOrderAndEmailInvoice,
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
  initialBuyForMeUrl?: string;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  initialTab = 'overview',
  onNavigatePage,
  initialBuyForMeUrl = '',
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingNumberToView, setTrackingNumberToView] = useState('SHP-50012');
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [trackingError, setTrackingError] = useState('');
  const [notificationsRead, setNotificationsRead] = useState(false);

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

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-40 w-64 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="space-y-6 overflow-y-auto">
          {/* Logo */}
          <div className="pb-2 border-b border-slate-100">
            <Logo size="md" onClick={() => onNavigatePage('home')} />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
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
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#0066FF] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Mini Bar at bottom of sidebar */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <div className="text-left text-xs min-w-0">
              <span className="font-bold text-slate-800 block truncate max-w-[110px]">{currentUser.name}</span>
              <span className="text-slate-400 font-mono text-[10px] block">{currentUser.customerId}</span>
            </div>
          </div>
          <button
            onClick={() => onNavigatePage('auth')}
            className="text-[11px] font-bold text-[#0066FF] hover:underline cursor-pointer shrink-0 ml-1"
            title="Switch User or Log In"
          >
            Switch
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full space-y-6 overflow-x-hidden">
        {/* Top Header / Welcome section */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-4 ring-blue-50 shadow-sm"
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>

            <div>
              <span className="text-xs sm:text-sm text-slate-400 font-medium block">
                Welcome back,
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {currentUser.name}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-slate-500">
                  {currentUser.customerId}
                </span>
                <span className="text-slate-300 text-xs">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentUser.email}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Indian Locker Pill */}
            <button
              onClick={() => setAddressModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-bold text-[#0066FF] transition-colors cursor-pointer"
            >
              <Warehouse className="w-4 h-4" />
              <span>Mumbai Locker: {currentUser.lockerId || 'I2W-10028'}</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => {
                setActiveTab('notifications');
                setNotificationsRead(true);
              }}
              className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors border border-slate-200"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {!notificationsRead && (customerOrders.length > 0 || customerRequests.length > 0 || customerPackages.length > 0) && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
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

        {/* TAB 2: MY REQUESTS */}
        {activeTab === 'my-requests' && (() => {
          const displayedRequests =
            customerRequests.length > 0
              ? customerRequests
              : isDemoUser
              ? samplePurchaseRequests
              : [];

          return (
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-2xl">My Purchase Requests</h3>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Track assisted purchase orders placed through India2World Buy For Me.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('buy-for-me')}
                  className="px-4 py-2 bg-[#0066FF] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-[#0052cc]"
                >
                  <Plus className="w-4 h-4" /> New Buy For Me Request
                </button>
              </div>

              <div className="space-y-4">
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

                {displayedRequests.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200">
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
                  displayedRequests.map((req: any) => (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all space-y-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <span className="font-mono font-bold text-slate-900 text-base">
                            {req.requestNumber || req.id}
                          </span>
                          <span className="text-xs text-slate-400 block">{req.date || req.submittedAt}</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                              req.status === 'Purchased' || req.status === 'Purchasing'
                                ? 'bg-emerald-100 text-emerald-800'
                                : req.status === 'Quote Ready' || req.status === 'Awaiting Payment'
                                ? 'bg-blue-100 text-[#0066FF]'
                                : req.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {req.status}
                          </span>
                          <strong className="text-slate-900 text-sm">
                            ₹{(req.totalAmountINR || req.totalINR || 0).toLocaleString('en-IN')}
                          </strong>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {req.products.map((p: any, pIdx: number) => (
                          <div
                            key={p.id || pIdx}
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100"
                          >
                            <img
                              src={p.imageUrl || '/assets/cat-wellness.jpg'}
                              alt={p.name}
                              className="w-12 h-12 object-contain bg-white rounded-lg p-1"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/cat-wellness.jpg';
                              }}
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                              <span className="text-[11px] text-slate-500">
                                Qty: {p.quantity || p.qty || 1} {p.priceINR ? `• ₹${p.priceINR.toLocaleString('en-IN')}` : ''}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {(req.status === 'Quote Ready' || req.status === 'Awaiting Payment') && (
                        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-[#0066FF]" />
                              <span>Official Quotation Ready for Review & Approval</span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">
                              Total Cost: <strong>₹{(req.totalAmountINR || req.totalINR || 0).toLocaleString('en-IN')}</strong>. Approving will automatically confirm order, place items into the procurement queue, and dispatch your tax invoice.
                            </p>
                          </div>
                          <button
                            onClick={() => handleApproveQuotation(req.id)}
                            className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl shrink-0 cursor-pointer shadow-xs transition-all active:scale-95"
                          >
                            Approve Quotation & Pay
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}

        {/* TAB 3: MY PURCHASES */}
        {activeTab === 'my-purchases' && (() => {
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
              img: '/assets/product-shoes.jpg',
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
                            <img
                              src={item.img}
                              alt={item.name}
                              className="w-10 h-10 object-contain rounded-lg border border-slate-100"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/product-shoes.jpg';
                              }}
                            />
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
          const displayedPackages =
            customerPackages.length > 0
              ? customerPackages
              : isDemoUser
              ? sampleWarehousePackages
              : [];

          return (
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-2xl">Packages in Locker ({displayedPackages.length})</h3>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Locker #{currentUser.lockerId || currentUser.customerId || 'I2W-10028'} • Unit 4B, Sakinaka, Andheri East, Mumbai 400072
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('consolidation')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Boxes className="w-4 h-4" /> Consolidate Selected
                </button>
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
                    onClick={() => setAddressModalOpen(true)}
                    className="px-4 py-2 bg-[#0066FF] text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-[#0052cc]"
                  >
                    <MapPin className="w-4 h-4" /> View My Locker Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {displayedPackages.map((pkg: any) => (
                    <div
                      key={pkg.id}
                      className="rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="h-40 bg-slate-50 relative flex items-center justify-center p-4">
                        <img
                          src={pkg.photoUrl || '/assets/product-shoes.jpg'}
                          alt={pkg.description}
                          className="max-h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/product-shoes.jpg';
                          }}
                        />
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-700 shadow-xs">
                          {pkg.freeStorageDaysLeft ?? (30 - (pkg.storageDays || 0))} days free storage left
                        </span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <span className="font-mono text-xs font-bold text-[#0066FF] block">
                            {pkg.packageNumber || pkg.id}
                          </span>
                          <h4 className="font-bold text-slate-900 text-sm mt-0.5 leading-snug">
                            {pkg.description}
                          </h4>
                        </div>

                        <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                          <div className="flex justify-between">
                            <span>Weight:</span>
                            <strong className="text-slate-800">{pkg.weightKg || pkg.actualWeightKg} kg</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Dimensions:</span>
                            <strong className="text-slate-800">{pkg.dimensionsCm} cm</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Received:</span>
                            <span>{pkg.receivedDate}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* TAB 5: CONSOLIDATION */}
        {activeTab === 'consolidation' && (() => {
          const displayedPackages =
            customerPackages.length > 0
              ? customerPackages
              : isDemoUser
              ? sampleWarehousePackages
              : [];

          return (
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-slate-100">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800">
                  Save Up to 80% on International Courier
                </span>
                <h3 className="font-extrabold text-slate-900 text-2xl mt-2">
                  Order Consolidation Center
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                  Combine your individual incoming boxes into one single sturdy export carton to eliminate multiple base courier fees.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Packages to Combine:
                </h4>

                {displayedPackages.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                    No packages currently available in locker to consolidate.
                  </div>
                ) : (
                  displayedPackages.map((pkg: any) => {
                    const isChecked = selectedPackages.includes(pkg.id);
                    return (
                      <label
                        key={pkg.id}
                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'border-[#0066FF] bg-blue-50/50'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
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
                            className="w-5 h-5 rounded text-[#0066FF]"
                          />
                          <div>
                            <span className="font-mono text-xs font-bold text-slate-500 block">
                              {pkg.packageNumber || pkg.id} ({pkg.senderStore || pkg.seller})
                            </span>
                            <span className="font-bold text-slate-900 text-sm">{pkg.description}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-700">{pkg.weightKg || pkg.actualWeightKg} kg</span>
                          <span className="text-[11px] text-slate-400 block">{pkg.dimensionsCm} cm</span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-emerald-900">
                    Combined Estimated Weight ({selectedPackages.length} packages):
                  </span>
                  <span className="font-extrabold text-emerald-900">
                    {(selectedPackages.length * 0.7).toFixed(1)} kg
                  </span>
                </div>
                <div className="flex justify-between text-sm text-emerald-800">
                  <span>Estimated Separate Shipping Costs:</span>
                  <span className="line-through">₹5,400</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-emerald-950 pt-2 border-t border-emerald-200">
                  <span>Consolidated Express Shipping:</span>
                  <span className="text-emerald-700">₹2,150 (You Save ~₹3,250!)</span>
                </div>
              </div>

              <button
                onClick={() => {
                  alert('Consolidation Request created! Our warehouse staff will repack and weigh your combined box within 4 hours.');
                  setActiveTab('overview');
                }}
                disabled={selectedPackages.length === 0}
                className={`w-full py-4 rounded-2xl font-extrabold text-base shadow-md transition-colors cursor-pointer ${
                  selectedPackages.length === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-[#0066FF] hover:bg-[#0052CC] text-white'
                }`}
              >
                Request Consolidation & Repacking
              </button>
            </div>
          );
        })()}

        {/* TAB 6: SHIPMENTS */}
        {activeTab === 'shipments' && (() => {
          const displayedShipments =
            customerShipments.length > 0
              ? customerShipments
              : isDemoUser
              ? sampleShipments
              : [];

          return (
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-2xl">International Shipments</h3>
                <p className="text-slate-500 text-xs sm:text-sm">
                  Real-time tracking of orders en route from India to your destination.
                </p>
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
                      className="p-5 rounded-2xl border border-slate-200 space-y-4 hover:border-blue-200 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 text-base">
                              {shp.trackingNumber}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#0066FF]">
                              {shp.carrier}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 mt-0.5 block">
                            To: {shp.destinationCity}, {shp.destinationCountry}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              shp.status === 'In Transit'
                                ? 'bg-blue-100 text-[#0066FF]'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {shp.status}
                          </span>
                          <button
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
                          Packages:{' '}
                          <strong className="text-slate-800">{shp.packagesCount} consolidated</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Weight: <strong className="text-slate-800">{shp.weightKg} kg</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Status: <strong className="text-slate-800">{shp.estimatedDelivery}</strong>
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

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Invoice # & Order</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Items / Description</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Automated Email Delivery</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {(() => {
                    const emailNorm = (currentUser.email || '').trim().toLowerCase();
                    const idNorm = (currentUser.customerId || '').trim().toLowerCase();
                    const isolatedInvoices = invoices.filter((inv) => {
                      const invEmail = (inv.customerEmail || '').trim().toLowerCase();
                      const invCustId = (inv.customerId || '').trim().toLowerCase();
                      return (emailNorm && invEmail === emailNorm) || (idNorm && invCustId === idNorm);
                    });

                    if (isolatedInvoices.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            <div className="py-6 space-y-2">
                              <p className="font-semibold text-slate-600">No orders or invoices generated yet for this account.</p>
                              <p className="text-xs text-slate-400">
                                When you place or confirm an assisted purchase order, your official tax invoices will appear here automatically.
                              </p>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return isolatedInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3">
                          <div className="font-mono font-bold text-[#0066FF]">{inv.invoiceNumber}</div>
                          <div className="text-[11px] text-slate-400">Order: {inv.orderId}</div>
                        </td>
                        <td className="p-3 text-slate-500 whitespace-nowrap">{inv.createdAt}</td>
                        <td className="p-3 max-w-xs">
                          <div className="font-medium text-slate-800 truncate">
                            {inv.items.map((i) => i.title).join(', ')}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {inv.items.length} item{inv.items.length > 1 ? 's' : ''} &bull; {inv.destinationCountry}
                          </div>
                        </td>
                        <td className="p-3 font-extrabold text-[#0B1933] whitespace-nowrap">
                          ₹{inv.totalINR.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            {inv.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                inv.emailStatus === 'Sent'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : inv.emailStatus === 'Pending'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                              title={inv.emailDeliveryLog || `Status: ${inv.emailStatus}`}
                            >
                              <Mail className="w-3 h-3" />
                              <span>{inv.emailStatus} to {inv.customerEmail}</span>
                            </span>
                          </div>
                          {inv.emailSentAt && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Delivered {inv.emailSentAt}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
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
                    ))
                  })()}
                </tbody>
              </table>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Indian Locker */}
              <div className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0066FF] text-white">
                    Indian Receiving Warehouse
                  </span>
                  <button
                    onClick={() => setAddressModalOpen(true)}
                    className="text-xs font-bold text-[#0066FF] hover:underline"
                  >
                    View Details
                  </button>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    {currentUser.name} / {currentUser.customerId}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {indianLockerAddress.addressLine1} <br />
                    {indianLockerAddress.addressLine2} <br />
                    {indianLockerAddress.city}, {indianLockerAddress.state} -{' '}
                    {indianLockerAddress.pincode}, India <br />
                    Phone: {indianLockerAddress.phone}
                  </p>
                </div>
              </div>

              {/* International Delivery Address */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                  Primary International Destination
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{currentUser.name}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
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
              <div className="p-4 rounded-xl border border-slate-200 text-center space-y-2 hover:border-blue-300 transition-colors">
                <h4 className="font-bold text-slate-900 text-sm">Customer Care Helpline</h4>
                <p className="text-xs text-slate-500">+91 98765 43210 (24/7 Priority Support)</p>
                <a
                  href="tel:+919876543210"
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
          const customerNotifications: Array<{
            id: string;
            title: string;
            time: string;
            type: string;
            read: boolean;
          }> = [];

          customerOrders.forEach((o) => {
            customerNotifications.push({
              id: `notif-ord-${o.id}`,
              title: `Order ${o.id} confirmed and in processing (${o.orderStatus || 'Procuring'}).`,
              time: o.createdAt || 'Recent',
              type: 'order',
              read: notificationsRead,
            });
          });

          customerRequests.forEach((r: any) => {
            customerNotifications.push({
              id: `notif-req-${r.id}`,
              title: `Buy For Me Request ${r.requestNumber || r.id} status updated to "${r.status}".`,
              time: r.date || r.submittedAt || 'Recent',
              type: 'request',
              read: notificationsRead,
            });
          });

          customerPackages.forEach((pkg: any) => {
            customerNotifications.push({
              id: `notif-pkg-${pkg.id}`,
              title: `Parcel ${pkg.packageNumber || pkg.id} (${pkg.seller || 'Merchant'}) received at your Mumbai Locker.`,
              time: pkg.receivedDate || 'Recent',
              type: 'warehouse',
              read: notificationsRead,
            });
          });

          customerShipments.forEach((shp: any) => {
            customerNotifications.push({
              id: `notif-shp-${shp.id}`,
              title: `International Shipment ${shp.trackingNumber} is ${shp.status} via ${shp.carrier}.`,
              time: shp.departureDate || 'Recent',
              type: 'shipment',
              read: notificationsRead,
            });
          });

          if (customerNotifications.length === 0 && !isDemoUser) {
            customerNotifications.push({
              id: `notif-welcome-${currentUser.customerId}`,
              title: `Welcome to India2World, ${currentUser.name}! Your Mumbai Virtual Locker (${currentUser.lockerId || 'I2W-' + currentUser.customerId.replace('CUS-', '')}) is active.`,
              time: 'Just now',
              type: 'welcome',
              read: notificationsRead,
            });
          } else if (customerNotifications.length === 0 && isDemoUser) {
            customerNotifications.push({
              id: 'notif-demo-1',
              title: 'Welcome to your customer portal overview.',
              time: 'Today, 10:30 AM',
              type: 'welcome',
              read: notificationsRead,
            });
          }

          return (
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-100 space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-2xl">Notifications Center</h3>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Account updates for {currentUser.name} ({currentUser.email}).
                  </p>
                </div>
                <button
                  onClick={() => setNotificationsRead(true)}
                  className="text-xs font-bold text-[#0066FF] hover:underline cursor-pointer"
                >
                  Mark all as read
                </button>
              </div>

              <div className="space-y-3">
                {customerNotifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                          n.read ? 'bg-slate-300' : 'bg-[#0066FF]'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{n.title}</p>
                        <span className="text-xs text-slate-400">{n.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Origin / Fulfillment Hub</div>
                  <div className="font-bold text-slate-900 text-sm">India2World Central Processing Hub</div>
                  <div className="text-slate-600">Plot 42, Udyog Vihar Phase 4</div>
                  <div className="text-slate-600">Gurugram, Haryana - 122016, India</div>
                  <div className="text-slate-500">GSTIN: 27AAACI1234D1Z8</div>
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
