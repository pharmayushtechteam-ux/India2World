import React, { useState, useEffect } from 'react';
import { AdminTab, AdminPurchaseRequest, AdminIncomingPackage } from '../../types/admin';
import {
  getAllPurchaseRequests,
  getAllPackages,
  getAllShipments,
  DATA_SYNC_EVENT,
} from '../../services/integratedDataService';
import {
  INITIAL_PURCHASE_REQUESTS,
  INITIAL_INCOMING_PACKAGES,
  ADMIN_CUSTOMERS,
} from '../../services/adminMockData';
import {
  Plus,
  Search,
  Filter,
  ArrowRight,
  Eye,
  CheckCircle2,
  Clock,
  Package,
  Boxes,
  Truck,
  Download,
  MoreVertical,
} from 'lucide-react';
import { TablePaginationBar } from './TablePaginationBar';

/* -------------------------------------------------------------
 * 1. Purchase Requests List View
 * ------------------------------------------------------------- */
export const AdminPurchaseRequestsList: React.FC<{
  onSelectRequest: (id: string) => void;
}> = ({ onSelectRequest }) => {
  const [requests, setRequests] = useState<AdminPurchaseRequest[]>(() => getAllPurchaseRequests());
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(6);

  useEffect(() => {
    const handleSync = () => {
      setRequests(getAllPurchaseRequests());
    };
    window.addEventListener(DATA_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(DATA_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  const filtered = requests.filter((req) => {
    if (filter !== 'All' && req.status !== filter) return false;
    if (search && !req.id.toLowerCase().includes(search.toLowerCase()) && !req.customerName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const paginatedRequests = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
            Purchase Requests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review customer shopping lists from Indian eCommerce sites and issue quotes.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto text-xs font-bold">
          {['All', 'Under Review', 'Quote Ready', 'Awaiting Payment', 'Purchasing', 'Submitted'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
                filter === f
                  ? 'bg-[#0066FF] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search request or user..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/70 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">Request ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4">Est. Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedRequests.map((req) => (
                <tr
                  key={req.id}
                  onClick={() => onSelectRequest(req.id)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-5 font-bold text-slate-800 group-hover:text-[#0066FF]">
                    {req.id}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2.5">
                      <img src={req.customerAvatar} alt={req.customerName} className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <div className="font-bold text-slate-800 text-xs sm:text-sm">{req.customerName}</div>
                        <div className="text-[11px] text-slate-400">{req.customerId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600">
                    {req.destinationCountry}, {req.destinationCity}
                  </td>
                  <td className="py-4 px-4 text-center font-bold text-slate-700">
                    {req.itemsCount}
                  </td>
                  <td className="py-4 px-4 font-bold text-[#0B1933]">
                    ₹{req.totalAmountINR.toLocaleString('en-IN')}
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-lg border bg-amber-50 text-amber-800 border-amber-200">
                      {req.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0066FF] group-hover:underline">
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePaginationBar
          totalItems={filtered.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="purchase requests"
        />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * 2. Incoming Packages List View
 * ------------------------------------------------------------- */
export const AdminIncomingPackagesList: React.FC<{
  onOpenReceivePackage: () => void;
}> = ({ onOpenReceivePackage }) => {
  const [packages, setPackages] = useState<AdminIncomingPackage[]>(() => getAllPackages());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(6);

  useEffect(() => {
    const handleSync = () => {
      setPackages(getAllPackages());
    };
    window.addEventListener(DATA_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(DATA_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const paginatedPackages = packages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
            Incoming Warehouse Packages
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Log, verify weight and take condition photos of delivered items at the hub.
          </p>
        </div>

        <button
          onClick={onOpenReceivePackage}
          className="px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Receive Incoming Package</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/70 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">Package Code</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Seller & Tracking</th>
                <th className="py-3 px-4">Arrival Date</th>
                <th className="py-3 px-4">Weight & Dims</th>
                <th className="py-3 px-4">Bay Location</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedPackages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-800">
                    <div className="flex items-center gap-2.5">
                      <img src={pkg.photos[0]} alt="package" className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                      <span>{pkg.id}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-800">{pkg.customerName}</div>
                    <div className="text-[11px] text-slate-400">{pkg.customerId}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-700">{pkg.seller}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{pkg.trackingNumber}</div>
                  </td>
                  <td className="py-4 px-4 text-slate-600">{pkg.arrivalDate}</td>
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-800">{pkg.actualWeightKg} kg</div>
                    <div className="text-[11px] text-slate-400">{pkg.lengthCm}x{pkg.widthCm}x{pkg.heightCm} cm</div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-mono px-2 py-0.5 rounded-sm bg-slate-100 text-slate-700 text-xs font-bold">
                      {pkg.warehouseLocation}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-lg border bg-emerald-100 text-emerald-800 border-emerald-200">
                      {pkg.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePaginationBar
          totalItems={packages.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="incoming packages"
        />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------
 * 3. Consolidation List View
 * ------------------------------------------------------------- */
export const AdminConsolidationList: React.FC<{
  onOpenCreateConsolidation: () => void;
}> = ({ onOpenCreateConsolidation }) => {
  const [shipments, setShipments] = useState(() => getAllShipments());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(6); // Default 6 items (5 to 8 range)

  useEffect(() => {
    const handleSync = () => {
      setShipments(getAllShipments());
    };
    window.addEventListener(DATA_SYNC_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(DATA_SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(shipments.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedShipments = shipments.slice((activePage - 1) * pageSize, activePage * pageSize);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
            Shipment Consolidation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Combine multiple store parcels into 1 master box to save customers up to 80% on international courier shipping.
          </p>
        </div>

        <button
          onClick={onOpenCreateConsolidation}
          className="px-5 py-2.5 bg-[#0066FF] hover:bg-[#0052cc] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <Boxes className="w-4 h-4" />
          <span>Create Consolidated Shipment</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 pb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#0B1933]">Active Consolidated Shipments</h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
            {shipments.length} Total Master Consolidations
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/70 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Consolidation ID</th>
                <th className="py-3 px-4">Customer & Destination</th>
                <th className="py-3 px-4">Packages Combined</th>
                <th className="py-3 px-4">Chargeable Weight</th>
                <th className="py-3 px-4">Carrier Service</th>
                <th className="py-3 px-4">Tracking AWB</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedShipments.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 px-4 font-bold text-[#0066FF] font-mono">
                    {s.id.startsWith('SHP-') ? `CS-${s.id.replace('SHP-', '')}` : s.id}
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-800">
                    <div>{s.customerName}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{s.destination} ({s.customerId})</div>
                  </td>
                  <td className="py-4 px-4 text-slate-700">
                    <span className="font-bold text-slate-800">{s.packageCount} packages</span> combined
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-800">
                    {s.chargeableWeightKg} kg
                  </td>
                  <td className="py-4 px-4 font-bold text-slate-700">
                    {s.carrier || 'DHL Express'}
                  </td>
                  <td className="py-4 px-4 font-mono text-xs text-slate-600">
                    {s.trackingNumber || 'Pending AWB'}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                      s.status === 'Delivered'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : s.status === 'In Transit'
                        ? 'bg-blue-100 text-[#0066FF] border-blue-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200'
                    }`}>
                      {s.status === 'In Transit' ? 'Dispatched' : s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TablePaginationBar
          totalItems={shipments.length}
          currentPage={activePage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="master consolidations"
        />
      </div>
    </div>
  );
};
