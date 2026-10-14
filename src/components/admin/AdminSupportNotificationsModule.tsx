import React, { useState, useEffect } from 'react';
import {
  Headphones,
  Bell,
  Search,
  LifeBuoy,
  Mail,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  User,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { AdminTab } from '../../types/admin';
import {
  getAllAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getAllSupportTickets,
  addSupportMessage,
  DATA_SYNC_EVENT,
} from '../../services/integratedDataService';
import { TablePaginationBar } from './TablePaginationBar';

export interface SupportTicket {
  id: string; // TKT-1082
  customerId: string;
  customerName: string;
  customerAvatar: string;
  subject: string;
  category: 'Customs Duty Inquiry' | 'Locker Storage Extension' | 'Repackaging Request' | 'Courier Delay';
  priority: 'Urgent' | 'High' | 'Normal';
  channel: 'Help Desk' | 'Live Chat' | 'Email';
  status: 'Open' | 'In Progress' | 'Resolved';
  lastUpdated: string;
  messages: Array<{ sender: 'customer' | 'agent'; text: string; time: string }>;
}

export interface SystemNotification {
  id: string;
  title: string;
  category: 'Warehouse' | 'Customs' | 'Carrier' | 'Customer';
  message: string;
  timestamp: string;
  read: boolean;
}

const mapSupportTickets = (): SupportTicket[] => {
  const records = getAllSupportTickets();
  return records.map((t) => ({
    id: t.id,
    customerId: t.customerId,
    customerName: t.customerName,
    customerAvatar: t.customerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(t.customerName)}`,
    subject: t.subject,
    category: (t.category as any) || 'Customs Duty Inquiry',
    priority: (t.priority === 'Low' || t.priority === 'Medium' ? 'Normal' : t.priority as any) || 'Normal',
    channel: 'Help Desk',
    status: t.status,
    lastUpdated: t.createdAt || 'Recent',
    messages: t.messages.map((m) => ({
      sender: m.sender === 'user' ? 'customer' : 'agent',
      text: m.text,
      time: m.time,
    })),
  }));
};

const mapAdminNotifications = (): SystemNotification[] => {
  const notifs = getAllAdminNotifications();
  return notifs.map((n) => {
    let cat: SystemNotification['category'] = 'Warehouse';
    if (n.type === 'package') cat = 'Warehouse';
    else if (n.type === 'shipment') cat = 'Carrier';
    else if (n.type === 'request' || n.type === 'order' || n.type === 'customer') cat = 'Customer';
    else cat = 'Customs';

    return {
      id: n.id,
      title: n.title,
      category: cat,
      message: n.message,
      timestamp: n.timestamp,
      read: n.read,
    };
  });
};

export const AdminSupportNotificationsModule: React.FC<{
  tab: 'support' | 'notifications';
  onNavigateTab: (tab: AdminTab, params?: any) => void;
}> = ({ tab, onNavigateTab }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>(() => mapSupportTickets());
  const [notifications, setNotifications] = useState<SystemNotification[]>(() => mapAdminNotifications());
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination states (5 to 8 concepts/items per page, default 6)
  const [ticketsPage, setTicketsPage] = useState(1);
  const [ticketsPageSize, setTicketsPageSize] = useState<number>(6);
  const [notifsPage, setNotifsPage] = useState(1);
  const [notifsPageSize, setNotifsPageSize] = useState<number>(6);

  useEffect(() => {
    const handleUpdate = () => {
      setNotifications(mapAdminNotifications());
      setTickets(mapSupportTickets());
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

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    addSupportMessage(selectedTicket.id, {
      sender: 'support',
      name: 'India2World Operations Desk',
      text: replyText.trim(),
    });

    const updatedTickets = mapSupportTickets();
    setTickets(updatedTickets);
    const updatedSelected = updatedTickets.find((t) => t.id === selectedTicket.id) || null;
    setSelectedTicket(updatedSelected);

    triggerToast(`Reply sent to ${selectedTicket.customerName} via ${selectedTicket.channel}!`);
    setReplyText('');
  };

  if (tab === 'support') {
    const paginatedTickets = tickets.slice(
      (ticketsPage - 1) * ticketsPageSize,
      ticketsPage * ticketsPageSize
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
              Customer Support & Helpdesk
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live inquiries across Help Desk, live chat, and email regarding customs, storage, and parcel repackaging.
            </p>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Ticket ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Subject & Category</th>
                  <th className="py-3.5 px-4">Channel</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-[#0066FF]">{t.id}</td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <img src={t.customerAvatar} alt="" className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                        <div>
                          <div className="font-bold text-slate-800">{t.customerName}</div>
                          <div className="text-[11px] text-slate-400">{t.lastUpdated}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 max-w-sm">
                      <div className="font-bold text-slate-800 truncate">{t.subject}</div>
                      <div className="text-[11px] text-slate-500">{t.category}</div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                        {t.channel === 'Help Desk' ? <LifeBuoy className="w-3.5 h-3.5 text-blue-600" /> : <Mail className="w-3.5 h-3.5 text-blue-600" />}
                        {t.channel}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                          t.priority === 'Urgent'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                          t.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : t.status === 'In Progress'
                            ? 'bg-blue-100 text-[#0066FF] border-blue-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="px-3 py-1.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Reply & Chat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePaginationBar
            totalItems={tickets.length}
            currentPage={ticketsPage}
            pageSize={ticketsPageSize}
            onPageChange={setTicketsPage}
            onPageSizeChange={setTicketsPageSize}
            itemLabel="support tickets"
          />
        </div>

        {/* Live Chat / Reply Drawer Modal */}
        {selectedTicket && (
          <div
            onClick={() => setSelectedTicket(null)}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                    <LifeBuoy className="w-3.5 h-3.5" />
                    <span>{selectedTicket.channel} Channel</span>
                  </span>
                  <h3 className="text-lg font-extrabold text-[#0B1933]">
                    {selectedTicket.customerName} ({selectedTicket.id})
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Thread */}
              <div className="space-y-3 max-h-72 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                {selectedTicket.messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.sender === 'agent' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        m.sender === 'agent'
                          ? 'bg-[#0066FF] text-white rounded-br-xs'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{m.time}</span>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type official operations reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#0066FF] focus:bg-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Notifications View
  const paginatedNotifications = notifications.slice(
    (notifsPage - 1) * notifsPageSize,
    notifsPage * notifsPageSize
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0B1933] text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
            System & Operations Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time automated webhook alerts, carrier notifications, and warehouse events.
          </p>
        </div>

        <button
          onClick={() => {
            markAllNotificationsAsRead();
            setNotifications(mapAdminNotifications());
            triggerToast('All notifications marked as read.');
          }}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
        >
          Mark All Read
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 space-y-3">
          {paginatedNotifications.map((n, idx) => (
            <div
              key={`${n.id}-${idx}`}
              className="p-4 bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-start gap-3.5 hover:border-[#0066FF] transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#0B1933]">{n.title}</h4>
                  <span className="text-[11px] text-slate-400">{n.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
        <TablePaginationBar
          totalItems={notifications.length}
          currentPage={notifsPage}
          pageSize={notifsPageSize}
          onPageChange={setNotifsPage}
          onPageSizeChange={setNotifsPageSize}
          itemLabel="system alerts & webhook triggers"
        />
      </div>
    </div>
  );
};
