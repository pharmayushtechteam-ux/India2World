import React, { useState, useEffect } from 'react';
import { AdminTab } from '../../types/admin';
import {
  REVENUE_CHART_DATA,
  DESTINATION_COUNTRIES_DATA,
} from '../../services/adminMockData';
import {
  getDynamicAdminStats,
  getAllPurchaseRequests,
  getAllShipments,
  DATA_SYNC_EVENT,
} from '../../services/integratedDataService';
import {
  FileText,
  FileSpreadsheet,
  IndianRupee,
  ShoppingBag,
  Package,
  Warehouse,
  CreditCard,
  Truck,
  Calendar,
  ChevronDown,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: AdminTab, params?: any) => void;
  onSelectRequest?: (requestId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigateTab,
  onSelectRequest,
}) => {
  const [selectedDateRange, setSelectedDateRange] = useState('1 Nov 2024 - 30 Nov 2024');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [stats, setStats] = useState(getDynamicAdminStats);
  const [recentRequests, setRecentRequests] = useState(() => getAllPurchaseRequests().slice(0, 5));
  const [recentShipments, setRecentShipments] = useState(() => getAllShipments().slice(0, 5));

  useEffect(() => {
    const handleSync = () => {
      setStats(getDynamicAdminStats());
      setRecentRequests(getAllPurchaseRequests().slice(0, 5));
      setRecentShipments(getAllShipments().slice(0, 5));
    };
    window.addEventListener(DATA_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(DATA_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Under Review':
        return 'bg-amber-100/90 text-amber-800 border-amber-200';
      case 'Quote Ready':
        return 'bg-blue-100/90 text-[#0066FF] border-blue-200';
      case 'Awaiting Payment':
        return 'bg-rose-100/90 text-rose-800 border-rose-200';
      case 'Purchasing':
        return 'bg-cyan-100/90 text-cyan-800 border-cyan-200';
      case 'Submitted':
        return 'bg-emerald-100/90 text-emerald-800 border-emerald-200';
      case 'In Transit':
        return 'bg-blue-100/90 text-[#0066FF] border-blue-200';
      case 'Departed':
        return 'bg-amber-100/90 text-amber-800 border-amber-200';
      case 'Customs':
        return 'bg-rose-100/90 text-rose-800 border-rose-200';
      case 'Delivered':
        return 'bg-emerald-100/90 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const statCards = [
    {
      title: 'New Purchase Requests',
      value: stats.newPurchaseRequests,
      icon: FileText,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      tab: 'purchase-requests' as AdminTab,
    },
    {
      title: 'Quotes Pending',
      value: stats.quotesPending,
      icon: FileSpreadsheet,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      tab: 'quotations' as AdminTab,
    },
    {
      title: 'Awaiting Payment',
      value: stats.awaitingPayment,
      icon: IndianRupee,
      iconColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-100',
      tab: 'payments' as AdminTab,
    },
    {
      title: 'Purchases Pending',
      value: stats.purchasesPending,
      icon: ShoppingBag,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-100',
      tab: 'purchase-queue' as AdminTab,
    },
    {
      title: 'Packages Received Today',
      value: stats.packagesReceivedToday,
      icon: Package,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      tab: 'incoming-packages' as AdminTab,
    },
    {
      title: 'Ready for Consolidation',
      value: stats.readyForConsolidation,
      icon: Warehouse,
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      tab: 'consolidation' as AdminTab,
    },
    {
      title: 'Shipping Payments Pending',
      value: stats.shippingPaymentsPending,
      icon: CreditCard,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      tab: 'shipping' as AdminTab,
    },
    {
      title: 'Shipments in Transit',
      value: stats.shipmentsInTransit,
      icon: Truck,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      tab: 'tracking' as AdminTab,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
          Dashboard
        </h1>

        {/* Date Filter Dropdown */}
        <div className="relative self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>{selectedDateRange}</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showDateDropdown && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-20">
              {[
                'Today',
                'Last 7 Days',
                '1 Nov 2024 - 30 Nov 2024',
                'This Month',
                'Last Quarter',
                'Year to Date',
              ].map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => {
                    setSelectedDateRange(range);
                    setShowDateDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                    selectedDateRange === range ? 'bg-blue-50 text-[#0066FF] font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 8 Summary Cards Grid (2 rows of 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateTab(card.tab)}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group flex items-start gap-4"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${card.bgColor} ${card.borderColor}`}
              >
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-slate-500 block leading-tight line-clamp-2">
                  {card.title}
                </span>
                <span className="text-2xl sm:text-[28px] font-black text-[#0B1933] tracking-tight mt-1 block">
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle Section: Orders & Revenue Chart + Top Destination Countries Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders & Revenue Line Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-lg font-bold text-[#0B1933] tracking-tight">
              Orders & Revenue
            </h2>

            {/* Legend */}
            <div className="flex items-center gap-5 text-xs font-semibold">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="w-4 h-1 bg-[#0066FF] rounded-full inline-block" />
                <span>Purchase Value</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="w-4 h-1 bg-[#10B981] rounded-full inline-block" />
                <span>Shipping Revenue</span>
              </div>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="relative w-full h-64 sm:h-72">
            <svg className="w-full h-full" viewBox="0 0 700 260" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0066FF" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#0066FF" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.12" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[40, 90, 140, 190, 240].map((y, i) => (
                <line
                  key={i}
                  x1="50"
                  y1={y}
                  x2="680"
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              ))}

              {/* Y Axis Labels */}
              <text x="40" y="45" textAnchor="end" className="text-[11px] fill-slate-400 font-semibold">800K</text>
              <text x="40" y="95" textAnchor="end" className="text-[11px] fill-slate-400 font-semibold">600K</text>
              <text x="40" y="145" textAnchor="end" className="text-[11px] fill-slate-400 font-semibold">400K</text>
              <text x="40" y="195" textAnchor="end" className="text-[11px] fill-slate-400 font-semibold">200K</text>
              <text x="40" y="245" textAnchor="end" className="text-[11px] fill-slate-400 font-semibold">0</text>

              {/* Purchase Value Line & Area (Blue) */}
              <path
                d="M 60,180 Q 150,150 250,135 T 450,105 T 600,85 T 670,55"
                fill="none"
                stroke="#0066FF"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 60,180 Q 150,150 250,135 T 450,105 T 600,85 T 670,55 L 670,240 L 60,240 Z"
                fill="url(#blueGradient)"
              />

              {/* Shipping Revenue Line & Area (Green) */}
              <path
                d="M 60,210 Q 150,190 250,175 T 450,140 T 600,120 T 670,95"
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 60,210 Q 150,190 250,175 T 450,140 T 600,120 T 670,95 L 670,240 L 60,240 Z"
                fill="url(#greenGradient)"
              />
            </svg>

            {/* X Axis Labels */}
            <div className="flex justify-between pl-12 pr-4 pt-2 text-[11px] font-semibold text-slate-400">
              {REVENUE_CHART_DATA.map((d, i) => (
                <span key={i}>{d.date}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Top Destination Countries Donut Chart (1 Col) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <h2 className="text-lg font-bold text-[#0B1933] tracking-tight mb-4">
            Top Destination Countries
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-auto">
            {/* Donut Chart SVG */}
            <div className="relative w-40 h-40 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                {/* 1. UAE 28% */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0066FF" strokeWidth="20" strokeDasharray="67 172" strokeDashoffset="0" />
                {/* 2. USA 18% */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#0EA5E9" strokeWidth="20" strokeDasharray="43 196" strokeDashoffset="-67" />
                {/* 3. UK 15% */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F97316" strokeWidth="20" strokeDasharray="36 203" strokeDashoffset="-110" />
                {/* 4. Canada 12% */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#EC4899" strokeWidth="20" strokeDasharray="29 210" strokeDashoffset="-146" />
                {/* 5. Australia 10% */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8B5CF6" strokeWidth="20" strokeDasharray="24 215" strokeDashoffset="-175" />
                {/* 6. Others 17% */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#84CC16" strokeWidth="20" strokeDasharray="40 199" strokeDashoffset="-199" />
              </svg>
              {/* Center cutout */}
              <div className="absolute inset-0 m-auto w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
                <span className="text-xs font-black text-[#0B1933]">100%</span>
              </div>
            </div>

            {/* Legend & Percentages List */}
            <div className="space-y-2 text-xs font-semibold flex-1">
              {[
                { name: 'UAE', pct: '28%', color: 'bg-[#0066FF]' },
                { name: 'USA', pct: '18%', color: 'bg-[#0EA5E9]' },
                { name: 'UK', pct: '15%', color: 'bg-[#F97316]' },
                { name: 'Canada', pct: '12%', color: 'bg-[#EC4899]' },
                { name: 'Australia', pct: '10%', color: 'bg-[#8B5CF6]' },
                { name: 'Others', pct: '17%', color: 'bg-[#84CC16]' },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${c.color}`} />
                    <span className="text-slate-700">{c.name}</span>
                  </div>
                  <span className="font-bold text-[#0B1933]">{c.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Purchase Requests + Recent Shipments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Purchase Requests Table */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0B1933] tracking-tight">
              Recent Purchase Requests
            </h2>
            <button
              onClick={() => onNavigateTab('purchase-requests')}
              className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold text-center">Items</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentRequests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => {
                      if (onSelectRequest) onSelectRequest(req.id);
                      else onNavigateTab('purchase-request-details', { requestId: req.id });
                    }}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 font-bold text-slate-700 group-hover:text-[#0066FF]">
                      {req.id}
                    </td>
                    <td className="py-3.5 font-medium text-slate-800">
                      {req.customerName}
                    </td>
                    <td className="py-3.5 text-center text-slate-600 font-semibold">
                      {req.itemsCount}
                    </td>
                    <td className="py-3.5 font-bold text-[#0B1933]">
                      ₹{req.totalAmountINR.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-right">
                      <span
                        className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-lg border ${getStatusBadge(
                          req.status
                        )}`}
                      >
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Shipments Table */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0B1933] tracking-tight">
              Recent Shipments
            </h2>
            <button
              onClick={() => onNavigateTab('shipping')}
              className="text-xs font-bold text-[#0066FF] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Destination</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentShipments.map((ship) => (
                  <tr
                    key={ship.id}
                    onClick={() => onNavigateTab('tracking')}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 font-bold text-slate-700 group-hover:text-[#0066FF]">
                      {ship.id}
                    </td>
                    <td className="py-3.5 font-medium text-slate-800">
                      {ship.customerName}
                    </td>
                    <td className="py-3.5 font-medium text-slate-600">
                      {ship.destination}
                    </td>
                    <td className="py-3.5 text-right">
                      <span
                        className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-lg border ${getStatusBadge(
                          ship.status
                        )}`}
                      >
                        {ship.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
