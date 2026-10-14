import React, { useState } from 'react';
import { AdminTab } from '../../types/admin';
import { ADMIN_CUSTOMERS, INITIAL_SHIPMENTS } from '../../services/adminMockData';
import {
  Users,
  FileSpreadsheet,
  ListOrdered,
  Package,
  Warehouse,
  Truck,
  MapPin,
  CreditCard,
  RotateCcw,
  Headphones,
  Bell,
  BarChart3,
  Settings,
  Search,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Save,
} from 'lucide-react';

export const AdminGenericModule: React.FC<{
  tab: AdminTab;
  onNavigateTab: (tab: AdminTab, params?: any) => void;
}> = ({ tab, onNavigateTab }) => {
  const [search, setSearch] = useState('');
  const [savedSettings, setSavedSettings] = useState(false);

  /* 1. Customers Module */
  if (tab === 'customers') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
              Registered Customers
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage international customer accounts, locker addresses, and order histories.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Customer</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4">Total Spent</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {ADMIN_CUSTOMERS.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <img src={c.avatar} alt={c.name} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                        <div>
                          <div className="font-bold text-slate-800 text-sm">{c.name}</div>
                          <div className="text-[11px] text-slate-400">{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-slate-700">{c.email}</div>
                      <div className="text-[11px] text-slate-400">{c.phone}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-700">
                      {c.country} ({c.city})
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-slate-800">{c.totalOrders}</td>
                    <td className="py-4 px-4 font-bold text-[#0B1933]">
                      ₹{c.totalSpentINR.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-slate-500">{c.joinedDate}</td>
                    <td className="py-4 px-5 text-right">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-emerald-100 text-emerald-800 border-emerald-200">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* 2. Quotations Module */
  if (tab === 'quotations') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
            Quotations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Issued pricing breakdowns pending customer acceptance or payment.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
              <span className="text-xs font-bold text-slate-500 block">Pending Quotes</span>
              <span className="text-2xl font-black text-[#0066FF] mt-1 block">8</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-xs font-bold text-slate-500 block">Accepted Quotes</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">42</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-500 block">Average Value</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">₹14,250</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Quote No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Request Ref</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr className="hover:bg-slate-50/70">
                  <td className="py-4 px-4 font-bold text-[#0066FF]">QTE-10492</td>
                  <td className="py-4 px-4 font-bold text-slate-800">Priya Sharma</td>
                  <td className="py-4 px-4 text-slate-600">REQ-20482</td>
                  <td className="py-4 px-4 font-bold text-[#0B1933]">₹8,245</td>
                  <td className="py-4 px-4 text-slate-500">12 Nov 2024</td>
                  <td className="py-4 px-4 text-right">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-amber-100 text-amber-800 border-amber-200">
                      Pending
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/70">
                  <td className="py-4 px-4 font-bold text-[#0066FF]">QTE-10491</td>
                  <td className="py-4 px-4 font-bold text-slate-800">Rahul Mehta</td>
                  <td className="py-4 px-4 text-slate-600">REQ-30481</td>
                  <td className="py-4 px-4 font-bold text-[#0B1933]">₹8,990</td>
                  <td className="py-4 px-4 text-slate-500">11 Nov 2024</td>
                  <td className="py-4 px-4 text-right">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg border bg-emerald-100 text-emerald-800 border-emerald-200">
                      Accepted
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* 3. Purchase Queue */
  if (tab === 'purchase-queue') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
            Purchase Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Items paid by customers awaiting procurement by internal shopping agents in India.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="space-y-3">
            {[
              { id: 'PQ-801', store: 'Amazon India', title: 'Nike Running Shoes Size 9', price: '₹3,999', buyer: 'Agent Amit', priority: 'High' },
              { id: 'PQ-802', store: 'Myntra', title: "Women's Kurta Set Pink (M)", price: '₹1,299', buyer: 'Agent Sneha', priority: 'Medium' },
              { id: 'PQ-803', store: 'Flipkart', title: 'Stainless Steel Water Bottle 1L x2', price: '₹1,598', buyer: 'Agent Amit', priority: 'Medium' },
            ].map((item) => (
              <div key={item.id} className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#0066FF] transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-blue-100 text-[#0066FF] rounded-md">{item.store}</span>
                    <span className="text-xs font-mono text-slate-400">{item.id}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-800">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Assigned to: {item.buyer}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-base font-extrabold text-[#0B1933]">{item.price}</span>
                  <button className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl cursor-pointer">
                    Mark Purchased
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }


  /* 5. Settings Module */
  if (tab === 'settings') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
            Admin & System Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure warehouse address, service fee rates, exchange rates, and staff credentials.
          </p>
        </div>

        {savedSettings && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-[#0B1933] border-b border-slate-100 pb-3">
            Operations & Service Fees
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Buy For Me Handling Fee (INR)</label>
              <input type="number" defaultValue={500} className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Standard Free Storage Days</label>
              <input type="number" defaultValue={30} className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Domestic Hub Address (India)</label>
              <input type="text" defaultValue="Plot 42, Udyog Vihar Phase 4, Gurugram, HR 122015" className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Default Courier Partner</label>
              <select className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl">
                <option>DHL Express</option>
                <option>FedEx</option>
                <option>Aramex</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => {
                setSavedSettings(true);
                setTimeout(() => setSavedSettings(false), 3000);
              }}
              className="px-6 py-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* Default placeholder for remaining modules */
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight capitalize">
          {tab.replace(/-/g, ' ')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Management console for {tab.replace(/-/g, ' ')}.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto border border-blue-100 shadow-2xs">
          <Package className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-[#0B1933] capitalize">
          {tab.replace(/-/g, ' ')} Management
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Connected to the mock data service. Production API endpoints and live database webhooks will plug in directly here.
        </p>
        <button
          onClick={() => onNavigateTab('dashboard')}
          className="px-5 py-2.5 bg-[#0066FF] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:bg-[#0052cc] transition-colors cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};
