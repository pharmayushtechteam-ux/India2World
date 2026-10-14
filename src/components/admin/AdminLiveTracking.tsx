import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plane,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  ExternalLink,
  Mail,
  Share2,
  Calendar,
  ShieldCheck,
  ChevronRight,
  Filter,
  Plus,
  X,
  FileText,
  User,
  ArrowRight,
  RefreshCw,
  Box,
  Building,
} from 'lucide-react';
import { AdminTab } from '../../types/admin';

export interface TrackingCheckpoint {
  id: string;
  timestamp: string;
  location: string;
  status: string;
  description: string;
  completed: boolean;
  active?: boolean;
}

export interface TrackedShipment {
  id: string;
  awbNumber: string;
  carrier: string;
  carrierLogoText: string;
  customerId: string;
  customerName: string;
  destination: string;
  destinationFlag: string;
  flightNumber?: string;
  origin: string;
  route: string;
  estimatedDelivery: string;
  overallStatus: 'In Transit' | 'In Customs' | 'Out for Delivery' | 'Delivered' | 'Exception';
  currentMilestoneIndex: number; // 0 to 5
  exceptionMessage?: string;
  lastCheckpointTime: string;
  lastCheckpointLocation: string;
  checkpoints: TrackingCheckpoint[];
}

const TRACKED_SHIPMENTS: TrackedShipment[] = [
  {
    id: 'SHP-500012',
    awbNumber: 'DHL9876543210',
    carrier: 'DHL Express',
    carrierLogoText: 'DHL',
    customerId: 'CUS-10034',
    customerName: 'Ahmed Khan',
    destination: 'Dubai, UAE',
    destinationFlag: '🇦🇪',
    flightNumber: 'EK-501 (Emirates Cargo)',
    origin: 'Mumbai (BOM), India',
    route: 'BOM ➔ DXB',
    estimatedDelivery: '14 Nov 2024, 04:00 PM GST',
    overallStatus: 'In Transit',
    currentMilestoneIndex: 2, // In Flight Transit
    lastCheckpointTime: 'Today, 11:45 AM',
    lastCheckpointLocation: 'Air Cargo Transit Hub, BOM',
    checkpoints: [
      {
        id: 'cp-1',
        timestamp: '12 Nov 2024, 09:30 AM',
        location: 'Mumbai Warehouse Hub, India',
        status: 'Shipment Handed Over',
        description: 'Consolidated parcel handed over to DHL Express courier van with manifest MNF-BOM-884.',
        completed: true,
      },
      {
        id: 'cp-2',
        timestamp: '12 Nov 2024, 01:15 PM',
        location: 'BOM Air Cargo Gateway, Mumbai',
        status: 'Export Customs Cleared',
        description: 'India Customs CSB-V export formalities completed. Cleared for flight departure.',
        completed: true,
      },
      {
        id: 'cp-3',
        timestamp: '12 Nov 2024, 04:30 PM',
        location: 'Flight EK-501',
        status: 'Departed Facility on Aircraft',
        description: 'Cargo loaded onto flight EK-501 en route to Dubai International Airport (DXB).',
        completed: true,
        active: true,
      },
      {
        id: 'cp-4',
        timestamp: 'Estimated 13 Nov, 08:00 AM',
        location: 'Dubai Cargo Gateway (DXB)',
        status: 'Import Customs Inspection',
        description: 'Awaiting arrival and Dubai Customs inspection clearance.',
        completed: false,
      },
      {
        id: 'cp-5',
        timestamp: 'Estimated 14 Nov, 10:00 AM',
        location: 'Dubai Delivery Facility',
        status: 'With Delivery Courier',
        description: 'Package will be assigned to local DHL courier for doorstep delivery.',
        completed: false,
      },
      {
        id: 'cp-6',
        timestamp: 'Estimated 14 Nov, 04:00 PM',
        location: 'Recipient Address, Dubai',
        status: 'Delivery & Proof of Signature',
        description: 'Doorstep handover with recipient electronic signature.',
        completed: false,
      },
    ],
  },
  {
    id: 'SHP-500011',
    awbNumber: 'FDX4433221100',
    carrier: 'FedEx Priority',
    carrierLogoText: 'FedEx',
    customerId: 'CUS-10067',
    customerName: 'Neha Patel',
    destination: 'New York, USA',
    destinationFlag: '🇺🇸',
    flightNumber: 'FX-077 (FedEx Express)',
    origin: 'Delhi (DEL), India',
    route: 'DEL ➔ CDG ➔ JFK',
    estimatedDelivery: '15 Nov 2024, 02:30 PM EST',
    overallStatus: 'In Transit',
    currentMilestoneIndex: 2,
    lastCheckpointTime: '11 Nov 2024, 08:20 PM',
    lastCheckpointLocation: 'Charles de Gaulle Hub (CDG), France',
    checkpoints: [
      {
        id: 'cp-1',
        timestamp: '10 Nov 2024, 11:00 AM',
        location: 'Delhi Warehouse, India',
        status: 'Picked Up by FedEx',
        description: 'Courier picked up package for international transit.',
        completed: true,
      },
      {
        id: 'cp-2',
        timestamp: '11 Nov 2024, 02:45 AM',
        location: 'Indira Gandhi Cargo Terminal (DEL)',
        status: 'Export Cleared',
        description: 'Customs outbound clearance approved.',
        completed: true,
      },
      {
        id: 'cp-3',
        timestamp: '11 Nov 2024, 08:20 PM',
        location: 'Paris CDG Euro Hub',
        status: 'Transit Hub Sorting',
        description: 'Package sorted and transferred to transatlantic flight FX-077 to New York JFK.',
        completed: true,
        active: true,
      },
      {
        id: 'cp-4',
        timestamp: 'Estimated 13 Nov, 12:00 PM',
        location: 'New York JFK Airport',
        status: 'US Customs Clearance',
        description: 'US CBP clearance processing.',
        completed: false,
      },
      {
        id: 'cp-5',
        timestamp: 'Estimated 15 Nov, 09:00 AM',
        location: 'Manhattan Distribution Station',
        status: 'Out for Delivery',
        description: 'Out with courier for final delivery.',
        completed: false,
      },
      {
        id: 'cp-6',
        timestamp: 'Estimated 15 Nov, 02:30 PM',
        location: 'Customer Address, New York',
        status: 'Delivered',
        description: 'Package delivered.',
        completed: false,
      },
    ],
  },
  {
    id: 'SHP-500010',
    awbNumber: 'ARX1122334455',
    carrier: 'Aramex Worldwide',
    carrierLogoText: 'Aramex',
    customerId: 'CUS-10089',
    customerName: 'Suresh Reddy',
    destination: 'Toronto, Canada',
    destinationFlag: '🇨🇦',
    origin: 'Mumbai (BOM), India',
    route: 'BOM ➔ YYZ',
    estimatedDelivery: '17 Nov 2024 (Pending Clearance)',
    overallStatus: 'Exception',
    currentMilestoneIndex: 3, // Destination Customs
    exceptionMessage: 'Canada Border Services (CBSA) requested National ID/Tax proof for declared cosmetics item.',
    lastCheckpointTime: 'Today, 07:15 AM',
    lastCheckpointLocation: 'Toronto Pearson Cargo Gateway (YYZ)',
    checkpoints: [
      {
        id: 'cp-1',
        timestamp: '08 Nov 2024, 02:00 PM',
        location: 'Mumbai Hub',
        status: 'Shipment Created',
        description: 'Handed over to Aramex Global.',
        completed: true,
      },
      {
        id: 'cp-2',
        timestamp: '09 Nov 2024, 05:00 AM',
        location: 'Mumbai BOM Cargo',
        status: 'Export Cleared',
        description: 'Indian export customs clearance complete.',
        completed: true,
      },
      {
        id: 'cp-3',
        timestamp: '11 Nov 2024, 11:30 PM',
        location: 'Toronto Pearson Airport (YYZ)',
        status: 'Arrival at Destination',
        description: 'Arrived at CBSA customs examination warehouse.',
        completed: true,
      },
      {
        id: 'cp-4',
        timestamp: '12 Nov 2024, 07:15 AM',
        location: 'Toronto Pearson (YYZ)',
        status: 'Customs Action Required',
        description: 'Customs hold: Consignee Canadian ID confirmation needed.',
        completed: false,
        active: true,
      },
      {
        id: 'cp-5',
        timestamp: 'Pending Resolution',
        location: 'Toronto Delivery Depot',
        status: 'Out for Delivery',
        description: 'Delivery will resume post CBSA clearance.',
        completed: false,
      },
      {
        id: 'cp-6',
        timestamp: 'Pending Resolution',
        location: 'Mississauga, Ontario',
        status: 'Delivered',
        description: 'Recipient delivery.',
        completed: false,
      },
    ],
  },
  {
    id: 'SHP-500009',
    awbNumber: 'DHL5566778899',
    carrier: 'DHL Express',
    carrierLogoText: 'DHL',
    customerId: 'CUS-10015',
    customerName: 'Meena Nair',
    destination: 'London, UK',
    destinationFlag: '🇬🇧',
    flightNumber: 'BA-138 (British Airways)',
    origin: 'Mumbai (BOM), India',
    route: 'BOM ➔ LHR',
    estimatedDelivery: '10 Nov 2024',
    overallStatus: 'Delivered',
    currentMilestoneIndex: 5,
    lastCheckpointTime: '10 Nov 2024, 01:25 PM',
    lastCheckpointLocation: 'Kensington, London, UK',
    checkpoints: [
      { id: 'cp-1', timestamp: '06 Nov 2024', location: 'Mumbai Warehouse', status: 'Dispatched', description: 'Picked up by DHL', completed: true },
      { id: 'cp-2', timestamp: '07 Nov 2024', location: 'Mumbai Cargo', status: 'Export Cleared', description: 'Customs exit approved', completed: true },
      { id: 'cp-3', timestamp: '08 Nov 2024', location: 'Heathrow LHR', status: 'Arrived in UK', description: 'Flight BA-138 touched down', completed: true },
      { id: 'cp-4', timestamp: '09 Nov 2024', location: 'London Gateway', status: 'HMRC Cleared', description: 'Zero VAT threshold applied', completed: true },
      { id: 'cp-5', timestamp: '10 Nov 2024', location: 'West London Depot', status: 'Out for Delivery', description: 'Assigned to courier James T.', completed: true },
      { id: 'cp-6', timestamp: '10 Nov 2024, 01:25 PM', location: 'London Kensington', status: 'Delivered & Signed', description: 'Delivered to resident M. Nair with signature captured.', completed: true, active: true },
    ],
  },
  {
    id: 'SHP-500008',
    awbNumber: 'UPS9988776655',
    carrier: 'UPS Worldwide',
    carrierLogoText: 'UPS',
    customerId: 'CUS-10092',
    customerName: 'Arjun Iyer',
    destination: 'Sydney, Australia',
    destinationFlag: '🇦🇺',
    flightNumber: 'SQ-212 (Singapore Cargo)',
    origin: 'Bangalore (BLR), India',
    route: 'BLR ➔ SIN ➔ SYD',
    estimatedDelivery: '16 Nov 2024, 11:00 AM AEST',
    overallStatus: 'Out for Delivery',
    currentMilestoneIndex: 4,
    lastCheckpointTime: 'Today, 08:30 AM',
    lastCheckpointLocation: 'Sydney Mascot Hub, Australia',
    checkpoints: [
      { id: 'cp-1', timestamp: '07 Nov 2024', location: 'BLR Hub', status: 'Picked Up', description: 'Handed over to UPS Worldwide', completed: true },
      { id: 'cp-2', timestamp: '08 Nov 2024', location: 'BLR Air Cargo', status: 'Export Clearance', description: 'India Customs cleared', completed: true },
      { id: 'cp-3', timestamp: '10 Nov 2024', location: 'Singapore Changi (SIN)', status: 'In Transit', description: 'Transferred to Sydney flight', completed: true },
      { id: 'cp-4', timestamp: '11 Nov 2024', location: 'Sydney Airport (SYD)', status: 'Australian Border Force Cleared', description: 'Biosecurity & customs inspection passed', completed: true },
      { id: 'cp-5', timestamp: '12 Nov 2024, 08:30 AM', location: 'Sydney Mascot', status: 'On Delivery Vehicle', description: 'Package is with local UPS driver for today delivery.', completed: true, active: true },
      { id: 'cp-6', timestamp: 'Estimated Today 02:00 PM', location: 'Parramatta, Sydney', status: 'Delivered', description: 'Awaiting recipient signature.', completed: false },
    ],
  },
];

import {
  getAllShipments,
  updateShipmentStatus,
  DATA_SYNC_EVENT,
} from '../../services/integratedDataService';

const buildTrackedShipments = (): TrackedShipment[] => {
  const shipments = getAllShipments();
  const list: TrackedShipment[] = [...TRACKED_SHIPMENTS];
  const existingIds = new Set(list.map((s) => s.id));

  shipments.forEach((s) => {
    if (!existingIds.has(s.id)) {
      list.unshift({
        id: s.id,
        awbNumber: s.trackingNumber || `AWB${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        carrier: s.carrier || 'DHL Express',
        carrierLogoText: (s.carrier || 'DHL').split(' ')[0],
        customerId: s.customerId,
        customerName: s.customerName,
        destination: s.destination,
        destinationFlag: '🌍',
        origin: 'Mumbai (BOM), India',
        route: 'BOM ➔ International',
        estimatedDelivery: s.estimatedArrival || 'In 3-5 Days',
        overallStatus: s.status === 'Delivered' ? 'Delivered' : 'In Transit',
        currentMilestoneIndex: s.status === 'Delivered' ? 5 : 2,
        lastCheckpointTime: 'Today, 10:00 AM',
        lastCheckpointLocation: 'Mumbai Air Cargo Terminal',
        checkpoints: [
          {
            id: `cp-${s.id}-1`,
            timestamp: s.departureDate || 'Today, 09:00 AM',
            location: 'Mumbai Warehouse Hub, India',
            status: 'Shipment Handed Over',
            description: `Consolidated parcel with ${s.packageCount} package(s) handed over to ${s.carrier || 'carrier'}.`,
            completed: true,
          },
          {
            id: `cp-${s.id}-2`,
            timestamp: 'Today, 11:30 AM',
            location: 'BOM Air Cargo Gateway, Mumbai',
            status: 'Export Customs Cleared',
            description: 'Customs CSB-V export formalities completed. Cleared for flight departure.',
            completed: true,
            active: true,
          },
          {
            id: `cp-${s.id}-3`,
            timestamp: 'Estimated Tomorrow',
            location: 'Destination Airport Gateway',
            status: 'Import Customs Inspection',
            description: 'Awaiting arrival and destination customs clearance.',
            completed: false,
          },
          {
            id: `cp-${s.id}-4`,
            timestamp: 'In 3 Days',
            location: 'Customer Address',
            status: 'Delivered',
            description: 'Doorstep handover with proof of delivery signature.',
            completed: false,
          },
        ],
      });
      existingIds.add(s.id);
    }
  });

  return list;
};

interface AdminLiveTrackingProps {
  onNavigateTab: (tab: AdminTab, params?: any) => void;
}

export const AdminLiveTracking: React.FC<AdminLiveTrackingProps> = ({ onNavigateTab }) => {
  const [shipments, setShipments] = useState<TrackedShipment[]>(buildTrackedShipments);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>(() => {
    const list = buildTrackedShipments();
    return list[0]?.id || 'SHP-500012';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Transit' | 'In Customs' | 'Out for Delivery' | 'Delivered' | 'Exception'>('All');
  
  // Modals & alerts
  const [showAddCheckpointModal, setShowAddCheckpointModal] = useState(false);
  const [newCheckpointStatus, setNewCheckpointStatus] = useState('');
  const [newCheckpointLocation, setNewCheckpointLocation] = useState('');
  const [newCheckpointDesc, setNewCheckpointDesc] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleSync = () => {
      setShipments(buildTrackedShipments());
    };
    window.addEventListener(DATA_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(DATA_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const selectedShipment = shipments.find((s) => s.id === selectedShipmentId) || shipments[0];

  // Filtering
  const filteredShipments = shipments.filter((s) => {
    const matchesStatus = statusFilter === 'All' || s.overallStatus === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      s.id.toLowerCase().includes(query) ||
      s.awbNumber.toLowerCase().includes(query) ||
      s.customerName.toLowerCase().includes(query) ||
      s.destination.toLowerCase().includes(query) ||
      s.carrier.toLowerCase().includes(query);
    return matchesStatus && matchesSearch;
  });

  const inTransitCount = shipments.filter((s) => s.overallStatus === 'In Transit').length;
  const inCustomsCount = shipments.filter((s) => s.overallStatus === 'In Customs' || s.overallStatus === 'Exception').length;
  const outForDeliveryCount = shipments.filter((s) => s.overallStatus === 'Out for Delivery').length;
  const deliveredCount = shipments.filter((s) => s.overallStatus === 'Delivered').length;

  const handleAddCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckpointStatus || !newCheckpointLocation) return;

    const newCp: TrackingCheckpoint = {
      id: `cp-${Date.now()}`,
      timestamp: 'Just now',
      location: newCheckpointLocation,
      status: newCheckpointStatus,
      description: newCheckpointDesc || 'Milestone event updated by operations dispatch supervisor.',
      completed: true,
      active: true,
    };

    setShipments((prev) =>
      prev.map((s) => {
        if (s.id === selectedShipment.id) {
          const updatedCheckpoints = s.checkpoints.map((cp) => ({ ...cp, active: false }));
          return {
            ...s,
            lastCheckpointTime: 'Just now',
            lastCheckpointLocation: newCheckpointLocation,
            checkpoints: [...updatedCheckpoints, newCp],
          };
        }
        return s;
      })
    );

    setShowAddCheckpointModal(false);
    setNewCheckpointStatus('');
    setNewCheckpointLocation('');
    setNewCheckpointDesc('');
    triggerToast(`Checkpoint scan logged for ${selectedShipment.awbNumber}!`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0B1933] text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">
              Live Air Freight Telemetry
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
            Live Shipment Tracking & Milestones
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time international air cargo checkpoints, customs clearance inspection gates, and last-mile delivery tracking.
          </p>
        </div>

        {/* Global Tracking Lookup Input */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Track by AWB, Shipment ID, or Customer..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm placeholder:text-slate-400 focus:outline-hidden focus:border-[#0066FF] shadow-2xs font-medium"
            />
          </div>
        </div>
      </div>

      {/* Exception Warning Banner if any shipment has a customs hold */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-amber-950 text-xs sm:text-sm flex items-center gap-2">
              <span>1 Shipment Requires Destination Customs Clearance Action</span>
              <span className="bg-amber-200 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                URGENT
              </span>
            </div>
            <p className="text-xs text-amber-800 mt-0.5">
              Shipment <strong>SHP-500010</strong> (Suresh Reddy &bull; Toronto, Canada) is pending CBSA consignee ID verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setSelectedShipmentId('SHP-500010');
              triggerToast('Opened shipment SHP-500010 for customs review.');
            }}
            className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 shadow-2xs cursor-pointer touch-manipulation"
          >
            Review Hold
          </button>
          <button
            onClick={() => triggerToast('Automated email notification with KYC upload link sent to Suresh Reddy!')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer touch-manipulation"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Notify Customer</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">In Transit Flights</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Plane className="w-4 h-4 text-[#0066FF]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">{inTransitCount}</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Air Cargo</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">International airborne freight</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Customs Clearance</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">{inCustomsCount}</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Inspection</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">DXB, JFK & YYZ Cargo Gates</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Out for Delivery</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Truck className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">{outForDeliveryCount}</span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Today</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">With local country couriers</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Delivered (This Week)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">{deliveredCount + 28}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">100% Verified</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Proof of signature captured</div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Shipments Monitor (5 Columns on Desktop) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-2xs flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0B1933]">Active Air Shipments</h2>
            <div className="flex gap-1">
              {(['All', 'In Transit', 'Exception', 'Delivered'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-[#0066FF] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Shipment Cards List */}
          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredShipments.map((ship) => {
              const isSelected = ship.id === selectedShipment.id;
              return (
                <div
                  key={ship.id}
                  onClick={() => setSelectedShipmentId(ship.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-[#0066FF] shadow-sm ring-1 ring-[#0066FF]'
                      : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{ship.destinationFlag}</span>
                      <div>
                        <div className="font-bold text-sm text-[#0B1933] flex items-center gap-1.5">
                          <span>{ship.customerName}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span className="font-bold text-[#0066FF]">{ship.id}</span>
                          <span>&bull;</span>
                          <span>{ship.awbNumber}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                        ship.overallStatus === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ship.overallStatus === 'Out for Delivery'
                          ? 'bg-indigo-100 text-indigo-800'
                          : ship.overallStatus === 'Exception'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {ship.overallStatus}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1 font-semibold text-slate-700">
                      <Plane className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span>{ship.route}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[170px]">
                      {ship.lastCheckpointLocation}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Telemetry & Milestone Stepper (7 Columns on Desktop) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs relative">
            {/* Top Shipment Detail Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white bg-[#0B1933] px-2.5 py-0.5 rounded-md">
                    {selectedShipment.carrier}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#0066FF]">
                    AWB: {selectedShipment.awbNumber}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1933]">
                  {selectedShipment.origin} &rarr; {selectedShipment.destination}
                </h2>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                  <span>Customer: <strong className="text-slate-800">{selectedShipment.customerName}</strong></span>
                  {selectedShipment.flightNumber && (
                    <span>Flight: <strong className="text-slate-800">{selectedShipment.flightNumber}</strong></span>
                  )}
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-col sm:items-end gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Delivery</span>
                  <span className="text-xs sm:text-sm font-extrabold text-[#0B1933]">
                    {selectedShipment.estimatedDelivery}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-1">
                  <button
                    onClick={() => setShowAddCheckpointModal(true)}
                    className="px-3 py-1.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer touch-manipulation"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Scan</span>
                  </button>

                  <button
                    onClick={() =>
                      triggerToast(`Customer tracking link dispatched via Email to ${selectedShipment.customerName}!`)
                    }
                    title="Send tracking email to customer"
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-[#0066FF] rounded-xl border border-blue-200 cursor-pointer touch-manipulation"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Exception Callout if any */}
            {selectedShipment.exceptionMessage && (
              <div className="mt-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-red-900">Customs Clearance Exception</div>
                  <div className="mt-0.5">{selectedShipment.exceptionMessage}</div>
                </div>
              </div>
            )}

            {/* 6-Stage Visual Milestone Stepper */}
            <div className="mt-6 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Air Freight Transit Milestones
              </h3>

              <div className="grid grid-cols-6 gap-1 relative text-center">
                {[
                  { title: 'Warehouse', sub: 'Picked Up', icon: Box },
                  { title: 'BOM Cargo', sub: 'Export Cleared', icon: ShieldCheck },
                  { title: 'In Flight', sub: 'Air Cargo', icon: Plane },
                  { title: 'Destination', sub: 'Customs', icon: Building },
                  { title: 'Out For', sub: 'Delivery', icon: Truck },
                  { title: 'Delivered', sub: 'Signed', icon: CheckCircle2 },
                ].map((step, idx) => {
                  const isDone = idx <= selectedShipment.currentMilestoneIndex;
                  const isCurrent = idx === selectedShipment.currentMilestoneIndex;
                  const StepIcon = step.icon;

                  return (
                    <div key={idx} className="flex flex-col items-center relative group">
                      {/* Connecting Line */}
                      {idx < 5 && (
                        <div
                          className={`absolute top-4 left-1/2 w-full h-1 -z-0 ${
                            idx < selectedShipment.currentMilestoneIndex
                              ? 'bg-emerald-500'
                              : idx === selectedShipment.currentMilestoneIndex
                              ? 'bg-gradient-to-r from-emerald-500 to-slate-200'
                              : 'bg-slate-200'
                          }`}
                        />
                      )}

                      {/* Icon Circle */}
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center z-10 transition-all ${
                          isCurrent
                            ? 'bg-[#0066FF] text-white ring-4 ring-blue-100 shadow-sm animate-pulse'
                            : isDone
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        <StepIcon className="w-4 h-4" />
                      </div>

                      {/* Labels */}
                      <div className="mt-2 text-[10px] sm:text-xs font-bold text-slate-800 leading-tight">
                        {step.title}
                      </div>
                      <div className="text-[9px] text-slate-400 hidden sm:block">{step.sub}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Checkpoint Event Log Timeline */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Real-Time Checkpoint Event Logs
                </h3>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 text-[#0066FF] animate-spin" />
                  Live Sync Active
                </span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {selectedShipment.checkpoints.map((cp, idx) => (
                  <div key={cp.id || idx} className="relative group">
                    {/* Dot */}
                    <div
                      className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                        cp.active
                          ? 'border-[#0066FF] text-[#0066FF] ring-4 ring-blue-50'
                          : cp.completed
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-slate-300'
                      }`}
                    >
                      {cp.completed && !cp.active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      {cp.active && <div className="w-2 h-2 rounded-full bg-[#0066FF] animate-ping" />}
                    </div>

                    {/* Content */}
                    <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <div className="font-bold text-xs sm:text-sm text-[#0B1933]">
                          {cp.status}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{cp.timestamp}</span>
                        </div>
                      </div>

                      <div className="text-xs font-bold text-[#0066FF] flex items-center gap-1 mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{cp.location}</span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {cp.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Log Checkpoint Scan */}
      {showAddCheckpointModal && (
        <div
          onClick={() => setShowAddCheckpointModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-[#0B1933]">Log Checkpoint Scan</h3>
              <button
                onClick={() => setShowAddCheckpointModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCheckpoint} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Checkpoint Status</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Arrived at Sorting Facility / Cleared Customs"
                  value={newCheckpointStatus}
                  onChange={(e) => setNewCheckpointStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#0066FF] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Scan Location Hub</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Dubai International Airport Cargo Gateway (DXB)"
                  value={newCheckpointLocation}
                  onChange={(e) => setNewCheckpointLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#0066FF] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Operational Description</label>
                <textarea
                  rows={3}
                  placeholder="Additional scanning details, flight bag tags, or courier handover notes..."
                  value={newCheckpointDesc}
                  onChange={(e) => setNewCheckpointDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#0066FF] focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCheckpointModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] rounded-xl cursor-pointer"
                >
                  Save Checkpoint Scan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
