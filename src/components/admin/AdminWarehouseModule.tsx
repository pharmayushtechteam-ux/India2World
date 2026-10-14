import React, { useState, useEffect } from 'react';
import {
  Warehouse,
  Search,
  Plus,
  Box,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  Filter,
  X,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { AdminTab } from '../../types/admin';

export interface WarehouseBinItem {
  id: string; // PKG-30421
  customerId: string;
  customerName: string;
  seller: string;
  courier: string;
  shelfLocation: string; // A-12-B
  weightKg: number;
  dimensionsCm: string;
  condition: 'Good' | 'Damaged' | 'Repackaged';
  receivedDate: string;
  daysInStorage: number;
  maxFreeDays: number;
  imageUrl: string;
  status: 'In Storage' | 'Ready for Consolidation' | 'Storage Overage';
}

const INITIAL_WAREHOUSE_ITEMS: WarehouseBinItem[] = [
  {
    id: 'PKG-30421',
    customerId: 'CUS-10028',
    customerName: 'Priya Sharma',
    seller: 'Amazon India',
    courier: 'Amazon Logistics',
    shelfLocation: 'A-12-B',
    weightKg: 1.2,
    dimensionsCm: '25 × 18 × 12 cm',
    condition: 'Good',
    receivedDate: '06 Nov 2024',
    daysInStorage: 6,
    maxFreeDays: 30,
    imageUrl: '/images/packages/pkg-30421.png',
    status: 'Ready for Consolidation',
  },
  {
    id: 'PKG-30422',
    customerId: 'CUS-10028',
    customerName: 'Priya Sharma',
    seller: 'Myntra',
    courier: 'Delhivery',
    shelfLocation: 'A-12-C',
    weightKg: 0.8,
    dimensionsCm: '22 × 15 × 8 cm',
    condition: 'Good',
    receivedDate: '06 Nov 2024',
    daysInStorage: 6,
    maxFreeDays: 30,
    imageUrl: '/images/packages/pkg-30422.png',
    status: 'Ready for Consolidation',
  },
  {
    id: 'PKG-30423',
    customerId: 'CUS-10028',
    customerName: 'Priya Sharma',
    seller: 'Flipkart',
    courier: 'Ekart Logistics',
    shelfLocation: 'B-04-A',
    weightKg: 0.6,
    dimensionsCm: '20 × 14 × 10 cm',
    condition: 'Good',
    receivedDate: '07 Nov 2024',
    daysInStorage: 5,
    maxFreeDays: 30,
    imageUrl: '/images/packages/pkg-30423.png',
    status: 'Ready for Consolidation',
  },
  {
    id: 'PKG-30419',
    customerId: 'CUS-10042',
    customerName: 'Rahul Mehta',
    seller: 'FabIndia',
    courier: 'Blue Dart',
    shelfLocation: 'C-08-D',
    weightKg: 2.1,
    dimensionsCm: '30 × 24 × 15 cm',
    condition: 'Good',
    receivedDate: '25 Oct 2024',
    daysInStorage: 18,
    maxFreeDays: 30,
    imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&auto=format&fit=crop&q=80',
    status: 'In Storage',
  },
  {
    id: 'PKG-30415',
    customerId: 'CUS-10089',
    customerName: 'Suresh Reddy',
    seller: 'Nykaa',
    courier: 'Shadowfax',
    shelfLocation: 'D-02-A',
    weightKg: 1.5,
    dimensionsCm: '24 × 18 × 12 cm',
    condition: 'Repackaged',
    receivedDate: '10 Oct 2024',
    daysInStorage: 33,
    maxFreeDays: 30,
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=80',
    status: 'Storage Overage',
  },
];

import { getAllPackages, DATA_SYNC_EVENT } from '../../services/integratedDataService';

export const AdminWarehouseModule: React.FC<{
  onNavigateTab: (tab: AdminTab, params?: any) => void;
}> = ({ onNavigateTab }) => {
  const getCombinedItems = (): WarehouseBinItem[] => {
    const pkgs = getAllPackages();
    return pkgs.map((p, idx) => ({
      id: p.id,
      customerId: p.customerId,
      customerName: p.customerName,
      seller: p.seller,
      courier: p.courier,
      shelfLocation: p.warehouseLocation || `A-12-${String.fromCharCode(65 + (idx % 4))}`,
      weightKg: p.actualWeightKg,
      dimensionsCm: `${p.lengthCm} × ${p.widthCm} × ${p.heightCm} cm`,
      condition: p.condition,
      receivedDate: p.arrivalDate,
      daysInStorage: Math.min(28, 4 + (idx * 3)),
      maxFreeDays: 30,
      imageUrl: p.photos && p.photos[0] ? p.photos[0] : 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&auto=format&fit=crop&q=80',
      status: p.status === 'Dispatched' ? 'In Storage' : 'Ready for Consolidation',
    }));
  };

  const [items, setItems] = useState<WarehouseBinItem[]>(getCombinedItems);
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [selectedRelocate, setSelectedRelocate] = useState<WarehouseBinItem | null>(null);
  const [newLocationInput, setNewLocationInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleSync = () => {
      setItems(getCombinedItems());
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
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRelocateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRelocate || !newLocationInput) return;

    setItems((prev) =>
      prev.map((i) =>
        i.id === selectedRelocate.id ? { ...i, shelfLocation: newLocationInput.toUpperCase() } : i
      )
    );
    triggerToast(`Package ${selectedRelocate.id} moved to bin ${newLocationInput.toUpperCase()}!`);
    setSelectedRelocate(null);
    setNewLocationInput('');
  };

  const filtered = items.filter((item) => {
    const matchesZone = zoneFilter === 'All' || item.shelfLocation.startsWith(zoneFilter);
    const matchesSearch =
      !search ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.customerName.toLowerCase().includes(search.toLowerCase()) ||
      item.shelfLocation.toLowerCase().includes(search.toLowerCase()) ||
      item.seller.toLowerCase().includes(search.toLowerCase());
    return matchesZone && matchesSearch;
  });

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
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 uppercase tracking-wider">
              Mumbai Logistics Hub (BOM-WH-01)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
            Warehouse & Shelf Inventory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time physical bin locations, customer locker storage, and 30-day free storage countdown timers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('receive-package')}
            className="px-4 py-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            <span>Check In New Package</span>
          </button>
        </div>
      </div>

      {/* Warehouse Capacity Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Warehouse Capacity</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">68%</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Optimal</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">142 of 210 bins occupied</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Packages in Storage</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">84</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across 32 customer lockers</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Ready for Consolidation</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">7 Lockers</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pack Now</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Customer requested consolidation</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">Storage Overage (&gt; 30 Days)</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#0B1933]">1</span>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">₹50/day fee</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Automated alert sent to customer</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1">Zone:</span>
          {['All', 'A', 'B', 'C', 'D'].map((zone) => (
            <button
              key={zone}
              onClick={() => setZoneFilter(zone)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation ${
                zoneFilter === zone
                  ? 'bg-[#0066FF] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {zone === 'All' ? 'All Aisles' : `Zone ${zone}`}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Bin, Package ID, Customer..."
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-hidden focus:border-[#0066FF] focus:bg-white"
          />
        </div>
      </div>

      {/* Warehouse Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4">Package & Image</th>
                <th className="py-3.5 px-4">Locker & Customer</th>
                <th className="py-3.5 px-4">Shelf / Bin Location</th>
                <th className="py-3.5 px-4">Weight & Dims</th>
                <th className="py-3.5 px-4">Storage Duration</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="w-12 h-12 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1"
                      />
                      <div>
                        <div className="font-bold text-[#0066FF] font-mono">{item.id}</div>
                        <div className="font-bold text-slate-800 text-xs">{item.seller}</div>
                        <div className="text-[11px] text-slate-400">Via {item.courier}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800">{item.customerName}</div>
                    <div className="text-xs text-slate-500 font-mono">Locker #{item.customerId}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-[#0B1933] font-mono font-bold rounded-lg border border-slate-200 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span>{item.shelfLocation}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800">{item.weightKg} kg</div>
                    <div className="text-[11px] text-slate-400">{item.dimensionsCm}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold text-slate-800">{item.daysInStorage} / {item.maxFreeDays} days</span>
                    </div>
                    <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className={`h-full rounded-full ${
                          item.daysInStorage > item.maxFreeDays
                            ? 'bg-purple-600'
                            : item.daysInStorage > 20
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, (item.daysInStorage / item.maxFreeDays) * 100)}%` }}
                      />
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedRelocate(item)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Relocate Bin
                      </button>
                      {item.status === 'Ready for Consolidation' && (
                        <button
                          onClick={() => onNavigateTab('consolidation')}
                          className="px-2.5 py-1.5 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Consolidate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Relocate Bin Modal */}
      {selectedRelocate && (
        <div
          onClick={() => setSelectedRelocate(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-[#0B1933]">Relocate Shelf Bin</h3>
              <button
                onClick={() => setSelectedRelocate(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Moving package <strong>{selectedRelocate.id}</strong> (currently at <strong>{selectedRelocate.shelfLocation}</strong>).
            </p>

            <form onSubmit={handleRelocateSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  New Shelf / Bin ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B-09-C or A-04-A"
                  value={newLocationInput}
                  onChange={(e) => setNewLocationInput(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRelocate(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#0066FF] hover:bg-[#0052cc] rounded-xl cursor-pointer"
                >
                  Update Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
