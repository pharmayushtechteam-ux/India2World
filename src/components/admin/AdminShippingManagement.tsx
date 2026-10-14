import React, { useState, useEffect } from 'react';
import {
  Truck,
  FileText,
  Printer,
  Download,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Box,
  FileCheck,
  ChevronRight,
  ExternalLink,
  X,
  Building,
  Check,
  Plane,
} from 'lucide-react';
import { AdminTab } from '../../types/admin';
import {
  getAllShipments,
  updateShipmentStatus,
  DATA_SYNC_EVENT,
} from '../../services/integratedDataService';
import { TablePaginationBar } from './TablePaginationBar';

export interface DispatchItem {
  id: string; // Dispatch ID
  shipmentId: string;
  customerId: string;
  customerName: string;
  destination: string;
  destinationFlag: string;
  carrier: 'DHL Express' | 'FedEx Priority' | 'Aramex Worldwide' | 'UPS Worldwide';
  awbNumber: string;
  manifestId: string;
  boxCount: number;
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  dimensionsCm: string;
  declaredValueUSD: number;
  exportDocStatus: 'CSB-V Cleared' | 'Pending CSB-V' | 'Invoice Ready';
  dispatchStatus: 'Ready for Pickup' | 'Handed Over to Carrier' | 'Manifest Closed' | 'Customs Hold';
  scheduledPickupTime: string;
  courierDriver?: string;
  preparedDate: string;
}

const INITIAL_DISPATCHES: DispatchItem[] = [
  {
    id: 'DSP-9041',
    shipmentId: 'SHP-500012',
    customerId: 'CUS-10034',
    customerName: 'Ahmed Khan',
    destination: 'Dubai, UAE',
    destinationFlag: '🇦🇪',
    carrier: 'DHL Express',
    awbNumber: 'DHL9876543210',
    manifestId: 'MNF-BOM-884',
    boxCount: 2,
    actualWeightKg: 2.6,
    volumetricWeightKg: 3.2,
    chargeableWeightKg: 3.2,
    dimensionsCm: '35 × 25 × 18 cm',
    declaredValueUSD: 185,
    exportDocStatus: 'CSB-V Cleared',
    dispatchStatus: 'Ready for Pickup',
    scheduledPickupTime: 'Today, 16:30 IST',
    courierDriver: 'Rajesh Sharma (DHL Fleet #4)',
    preparedDate: '12 Nov 2024',
  },
  {
    id: 'DSP-9040',
    shipmentId: 'SHP-500011',
    customerId: 'CUS-10067',
    customerName: 'Neha Patel',
    destination: 'New York, USA',
    destinationFlag: '🇺🇸',
    carrier: 'FedEx Priority',
    awbNumber: 'FDX4433221100',
    manifestId: 'MNF-BOM-883',
    boxCount: 1,
    actualWeightKg: 1.8,
    volumetricWeightKg: 2.1,
    chargeableWeightKg: 2.1,
    dimensionsCm: '28 × 20 × 15 cm',
    declaredValueUSD: 240,
    exportDocStatus: 'CSB-V Cleared',
    dispatchStatus: 'Handed Over to Carrier',
    scheduledPickupTime: 'Today, 14:00 IST',
    courierDriver: 'Vikas Kumar (FedEx Van #12)',
    preparedDate: '12 Nov 2024',
  },
  {
    id: 'DSP-9039',
    shipmentId: 'SHP-500010',
    customerId: 'CUS-10089',
    customerName: 'Suresh Reddy',
    destination: 'Toronto, Canada',
    destinationFlag: '🇨🇦',
    carrier: 'Aramex Worldwide',
    awbNumber: 'ARX1122334455',
    manifestId: 'MNF-BOM-882',
    boxCount: 3,
    actualWeightKg: 4.5,
    volumetricWeightKg: 5.0,
    chargeableWeightKg: 5.0,
    dimensionsCm: '42 × 30 × 20 cm',
    declaredValueUSD: 310,
    exportDocStatus: 'Invoice Ready',
    dispatchStatus: 'Customs Hold',
    scheduledPickupTime: 'Pending KYC Review',
    preparedDate: '11 Nov 2024',
  },
  {
    id: 'DSP-9038',
    shipmentId: 'SHP-500009',
    customerId: 'CUS-10015',
    customerName: 'Meena Nair',
    destination: 'London, UK',
    destinationFlag: '🇬🇧',
    carrier: 'DHL Express',
    awbNumber: 'DHL5566778899',
    manifestId: 'MNF-BOM-881',
    boxCount: 1,
    actualWeightKg: 1.2,
    volumetricWeightKg: 1.5,
    chargeableWeightKg: 1.5,
    dimensionsCm: '25 × 18 × 12 cm',
    declaredValueUSD: 95,
    exportDocStatus: 'CSB-V Cleared',
    dispatchStatus: 'Manifest Closed',
    scheduledPickupTime: 'Yesterday, 17:00 IST',
    preparedDate: '10 Nov 2024',
  },
  {
    id: 'DSP-9037',
    shipmentId: 'SHP-500008',
    customerId: 'CUS-10092',
    customerName: 'Arjun Iyer',
    destination: 'Sydney, Australia',
    destinationFlag: '🇦🇺',
    carrier: 'UPS Worldwide',
    awbNumber: 'UPS9988776655',
    manifestId: 'MNF-BOM-880',
    boxCount: 2,
    actualWeightKg: 3.8,
    volumetricWeightKg: 4.2,
    chargeableWeightKg: 4.2,
    dimensionsCm: '38 × 28 × 16 cm',
    declaredValueUSD: 275,
    exportDocStatus: 'CSB-V Cleared',
    dispatchStatus: 'Handed Over to Carrier',
    scheduledPickupTime: 'Yesterday, 15:30 IST',
    preparedDate: '10 Nov 2024',
  },
];

const buildDispatchesList = (): DispatchItem[] => {
  const shipments = getAllShipments();
  const list: DispatchItem[] = [...INITIAL_DISPATCHES];
  const existingIds = new Set(list.map((d) => d.shipmentId));

  shipments.forEach((s, idx) => {
    if (!existingIds.has(s.id)) {
      list.unshift({
        id: `DSP-${Math.floor(9045 + idx)}`,
        shipmentId: s.id,
        customerId: s.customerId,
        customerName: s.customerName,
        destination: s.destination,
        destinationFlag: '🌍',
        carrier: (s.carrier as any) || 'DHL Express',
        awbNumber: s.trackingNumber || `DHL${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        manifestId: `MNF-BOM-${Math.floor(885 + idx)}`,
        boxCount: s.packageCount || 1,
        actualWeightKg: s.chargeableWeightKg || 2.5,
        volumetricWeightKg: s.chargeableWeightKg || 2.5,
        chargeableWeightKg: s.chargeableWeightKg || 2.5,
        dimensionsCm: '35 × 25 × 18 cm',
        declaredValueUSD: 195,
        exportDocStatus: 'CSB-V Cleared',
        dispatchStatus: s.status === 'Delivered' ? 'Manifest Closed' : s.status === 'In Transit' ? 'Handed Over to Carrier' : 'Ready for Pickup',
        scheduledPickupTime: 'Today, 17:00 IST',
        courierDriver: 'DHL Cargo Fleet',
        preparedDate: s.departureDate || 'Today',
      });
      existingIds.add(s.id);
    }
  });

  return list;
};

interface AdminShippingManagementProps {
  onNavigateTab: (tab: AdminTab, params?: any) => void;
}

export const AdminShippingManagement: React.FC<AdminShippingManagementProps> = ({ onNavigateTab }) => {
  const [dispatches, setDispatches] = useState<DispatchItem[]>(buildDispatchesList);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Ready for Pickup' | 'Handed Over to Carrier' | 'Manifest Closed' | 'Customs Hold'>('All');
  const [carrierFilter, setCarrierFilter] = useState<string>('All');
  
  // Modals
  const [selectedLabel, setSelectedLabel] = useState<DispatchItem | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<DispatchItem | null>(null);
  const [showManifestModal, setShowManifestModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination states (5 to 8 items per page, default 6)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(6);

  useEffect(() => {
    const handleSync = () => {
      setDispatches(buildDispatchesList());
    };
    window.addEventListener(DATA_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(DATA_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, carrierFilter, searchQuery]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMarkHandover = (id: string) => {
    setDispatches((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          updateShipmentStatus(d.shipmentId, 'In Transit');
          return { ...d, dispatchStatus: 'Handed Over to Carrier' };
        }
        return d;
      })
    );
    triggerToast(`Shipment ${id} marked as Handed Over to Carrier Airport Hub!`);
  };

  // Filtered dispatches
  const filteredDispatches = dispatches.filter((d) => {
    const matchesStatus = statusFilter === 'All' || d.dispatchStatus === statusFilter;
    const matchesCarrier = carrierFilter === 'All' || d.carrier === carrierFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      d.shipmentId.toLowerCase().includes(query) ||
      d.customerName.toLowerCase().includes(query) ||
      d.awbNumber.toLowerCase().includes(query) ||
      d.manifestId.toLowerCase().includes(query) ||
      d.destination.toLowerCase().includes(query);
    return matchesStatus && matchesCarrier && matchesSearch;
  });

  const paginatedDispatches = filteredDispatches.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const readyCount = dispatches.filter((d) => d.dispatchStatus === 'Ready for Pickup').length;
  const handedOverCount = dispatches.filter((d) => d.dispatchStatus === 'Handed Over to Carrier').length;
  const customsHoldCount = dispatches.filter((d) => d.dispatchStatus === 'Customs Hold').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0B1933] text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-[#0066FF] uppercase tracking-wider">
              Warehouse Handoff & Courier Manifests
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
            Shipping & Carrier Dispatch
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage international freight dispatch, generate AWB shipping labels, manifests, and India Customs (CSB-V) export declarations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowPickupModal(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold rounded-xl border border-slate-200 shadow-2xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer touch-manipulation"
          >
            <Calendar className="w-4 h-4 text-[#0066FF]" />
            <span>Schedule Pickup</span>
          </button>

          <button
            onClick={() => setShowManifestModal(true)}
            className="px-4 py-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Manifest</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ready for Pickup</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Box className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">{readyCount}</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Packed & Weighed</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting evening carrier courier van</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">AWB Labels Generated</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Printer className="w-4 h-4 text-[#0066FF]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">18</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Today</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Barcodes affixed & verified</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Handed to Carrier</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Truck className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">{handedOverCount}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Dispatched</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">En route to Mumbai BOM Cargo Hub</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Customs / Export Hold</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">{customsHoldCount}</span>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">Action Req</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Requires KYC / Invoice clarification</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['All', 'Ready for Pickup', 'Handed Over to Carrier', 'Manifest Closed', 'Customs Hold'] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-[#0066FF] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {status}
              </button>
            )
          )}
        </div>

        {/* Carrier Select & Search */}
        <div className="flex items-center gap-2">
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-[#0066FF]"
          >
            <option value="All">All Carriers</option>
            <option value="DHL Express">DHL Express</option>
            <option value="FedEx Priority">FedEx Priority</option>
            <option value="Aramex Worldwide">Aramex Worldwide</option>
            <option value="UPS Worldwide">UPS Worldwide</option>
          </select>

          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search AWB, Customer, ID..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-[#0066FF] focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Dispatches Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Shipment & Customer</th>
                <th className="py-3.5 px-4">Carrier & AWB</th>
                <th className="py-3.5 px-4">Weight & Dimensions</th>
                <th className="py-3.5 px-4">Export Declaration</th>
                <th className="py-3.5 px-4">Dispatch Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredDispatches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No shipments match the current filters.
                  </td>
                </tr>
              ) : (
                paginatedDispatches.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Shipment & Customer */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{item.destinationFlag}</span>
                        <div>
                          <div className="font-bold text-[#0066FF] flex items-center gap-1.5">
                            <span>{item.shipmentId}</span>
                            <span className="text-[11px] font-normal text-slate-400">({item.id})</span>
                          </div>
                          <div className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5">
                            {item.customerName}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {item.destination} &bull; {item.boxCount} {item.boxCount > 1 ? 'boxes' : 'box'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Carrier & AWB */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            item.carrier.includes('DHL')
                              ? 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                              : item.carrier.includes('FedEx')
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : 'bg-red-100 text-red-900 border border-red-300'
                          }`}
                        >
                          {item.carrier}
                        </span>
                      </div>
                      <div className="font-mono text-xs font-bold text-slate-800 tracking-wider">
                        {item.awbNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Manifest: {item.manifestId}
                      </div>
                    </td>

                    {/* Weight & Dimensions */}
                    <td className="py-4 px-4">
                      <div className="text-xs font-bold text-slate-800">
                        Chargeable: {item.chargeableWeightKg} kg
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Actual: {item.actualWeightKg} kg | Vol: {item.volumetricWeightKg} kg
                      </div>
                      <div className="text-[10px] text-slate-400">{item.dimensionsCm}</div>
                    </td>

                    {/* Export Declaration */}
                    <td className="py-4 px-4">
                      <div className="text-xs font-bold text-slate-800">
                        ${item.declaredValueUSD} USD
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.exportDocStatus === 'CSB-V Cleared'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.exportDocStatus}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">HS Code: 6204.42 (Apparel)</div>
                    </td>

                    {/* Dispatch Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.dispatchStatus === 'Ready for Pickup'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : item.dispatchStatus === 'Handed Over to Carrier'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : item.dispatchStatus === 'Manifest Closed'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {item.dispatchStatus}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{item.scheduledPickupTime}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Print Label Button */}
                        <button
                          onClick={() => setSelectedLabel(item)}
                          title="Print AWB Label"
                          className="p-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl transition-all cursor-pointer touch-manipulation"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* CSB-V Commercial Invoice */}
                        <button
                          onClick={() => setSelectedInvoice(item)}
                          title="View Commercial Invoice / CSB-V"
                          className="p-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl transition-all cursor-pointer touch-manipulation"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Handover Action Toggle */}
                        {item.dispatchStatus === 'Ready for Pickup' && (
                          <button
                            onClick={() => handleMarkHandover(item.id)}
                            className="px-2.5 py-1.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer touch-manipulation whitespace-nowrap"
                          >
                            Mark Handover
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <TablePaginationBar
          totalItems={filteredDispatches.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="carrier dispatches & consignments"
        />
      </div>

      {/* MODAL 1: AWB Shipping Label Preview */}
      {selectedLabel && (
        <div
          onClick={() => setSelectedLabel(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 animate-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#0066FF] uppercase tracking-wider">
                  International Air Waybill (AWB)
                </span>
                <h3 className="text-lg font-extrabold text-[#0B1933]">
                  {selectedLabel.carrier} Shipping Label
                </h3>
              </div>
              <button
                onClick={() => setSelectedLabel(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Label Visual Mockup (Industrial courier label format) */}
            <div className="border-2 border-dashed border-slate-300 p-5 rounded-2xl bg-white font-mono text-xs space-y-4">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <div className="font-extrabold text-base text-black">{selectedLabel.carrier}</div>
                  <div className="text-[11px] text-slate-500">EXPRESS WORLDWIDE (WPX)</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black">{selectedLabel.destination.split(',')[1]?.trim() || 'INTL'}</div>
                  <div className="text-[10px] text-slate-500">ZONE 4 / AIR CARGO</div>
                </div>
              </div>

              {/* Shipper & Consignee */}
              <div className="grid grid-cols-2 gap-3 text-[11px] border-b border-slate-200 pb-3">
                <div>
                  <div className="font-bold text-slate-500 uppercase text-[9px]">FROM (SHIPPER):</div>
                  <div className="font-bold text-black">India2World Hub</div>
                  <div>Warehouse Bay 4, Marol MIDC</div>
                  <div>Andheri East, Mumbai 400093</div>
                  <div>INDIA (+91 98765 43210)</div>
                </div>
                <div>
                  <div className="font-bold text-slate-500 uppercase text-[9px]">TO (CONSIGNEE):</div>
                  <div className="font-bold text-black">{selectedLabel.customerName}</div>
                  <div>Locker #{selectedLabel.customerId}</div>
                  <div>{selectedLabel.destination}</div>
                  <div>TEL: +971 50 123 4567</div>
                </div>
              </div>

              {/* Weights & Pieces */}
              <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-2 rounded-lg border border-slate-200 text-[11px]">
                <div>
                  <span className="text-[9px] text-slate-400 block">PIECES</span>
                  <span className="font-bold text-black">{selectedLabel.boxCount} Box</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">ACTUAL WT</span>
                  <span className="font-bold text-black">{selectedLabel.actualWeightKg} KG</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">CHG WT</span>
                  <span className="font-bold text-[#0066FF]">{selectedLabel.chargeableWeightKg} KG</span>
                </div>
              </div>

              {/* Barcode Mockup */}
              <div className="text-center py-2 border-t border-slate-200">
                <div className="tracking-[6px] font-black text-2xl py-2 bg-slate-900 text-white rounded-sm select-none">
                  ||| | |||| | |||||| | |||
                </div>
                <div className="text-xs font-bold tracking-widest text-slate-700 mt-1">
                  AWB: {selectedLabel.awbNumber}
                </div>
              </div>
            </div>

            {/* Print Buttons */}
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setSelectedLabel(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  triggerToast(`Sending AWB ${selectedLabel.awbNumber} to thermal label printer...`);
                  setSelectedLabel(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Thermal Label (4x6)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: India Customs CSB-V Commercial Invoice */}
      {selectedInvoice && (
        <div
          onClick={() => setSelectedInvoice(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                  India Customs Form CSB-V
                </span>
                <h3 className="text-lg font-extrabold text-[#0B1933]">
                  Commercial Export Invoice & Declaration
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Content */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
              <div className="flex justify-between text-slate-600">
                <span>Invoice No: <strong>INV-{selectedInvoice.shipmentId}</strong></span>
                <span>Date: <strong>{selectedInvoice.preparedDate}</strong></span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Customs Port: <strong>INBOM4 (Sahar Air Cargo, Mumbai)</strong></span>
                <span>LUT/Bond: <strong>AD270324001920B</strong></span>
              </div>

              <div className="border-t border-slate-200 pt-2">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-400 font-bold border-b border-slate-200">
                      <th className="pb-1">Item Description</th>
                      <th className="pb-1">HS Code</th>
                      <th className="pb-1 text-center">Qty</th>
                      <th className="pb-1 text-right">Declared Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-1.5 font-bold text-slate-800">Assorted Personal Apparel & Footwear</td>
                      <td className="py-1.5 text-slate-600 font-mono">6204.42</td>
                      <td className="py-1.5 text-center">4</td>
                      <td className="py-1.5 text-right font-bold text-slate-800">${selectedInvoice.declaredValueUSD} USD</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Exporter declaration verified under Postal/Courier Bill of Entry Regulations 2024.</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  triggerToast(`CSB-V PDF downloaded for ${selectedInvoice.shipmentId}`);
                  setSelectedInvoice(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSB-V PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Schedule Courier Pickup */}
      {showPickupModal && (
        <div
          onClick={() => setShowPickupModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 animate-in zoom-in-95 duration-150"
          >
            <h3 className="text-lg font-extrabold text-[#0B1933]">Schedule Carrier Pickup</h3>
            <p className="text-xs text-slate-500">
              Request courier collection van to visit Mumbai Warehouse for international dispatch.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Carrier Partner</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium">
                  <option>DHL Express Worldwide</option>
                  <option>FedEx Priority</option>
                  <option>Aramex Global</option>
                  <option>UPS Worldwide Saver</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Pickup Time Window</label>
                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium">
                  <option>Today - Evening Slot (16:00 - 18:00 IST)</option>
                  <option>Tomorrow - Morning Slot (10:00 - 12:00 IST)</option>
                  <option>Tomorrow - Afternoon Slot (14:00 - 16:00 IST)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Warehouse Bay</label>
                <input
                  type="text"
                  defaultValue="Bay #4 - International Cargo Outbound"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowPickupModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  triggerToast('Pickup slot successfully booked with DHL Express dispatch team!');
                  setShowPickupModal(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] rounded-xl cursor-pointer"
              >
                Confirm Pickup Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Generate Carrier Manifest */}
      {showManifestModal && (
        <div
          onClick={() => setShowManifestModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 animate-in zoom-in-95 duration-150"
          >
            <h3 className="text-lg font-extrabold text-[#0B1933]">Generate Batch Manifest</h3>
            <p className="text-xs text-slate-500">
              Bundle today's packaged consolidated shipments into a single official handover manifest for airport customs clearance.
            </p>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-[#0066FF] space-y-1">
              <div className="font-bold">Proposed Manifest ID: MNF-BOM-885</div>
              <div>Contains: <strong>5 shipments</strong> &bull; Total weight: <strong>14.9 kg</strong></div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowManifestModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  triggerToast('Manifest MNF-BOM-885 generated and synchronized with carrier EDI!');
                  setShowManifestModal(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] rounded-xl cursor-pointer"
              >
                Generate & Close Manifest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
