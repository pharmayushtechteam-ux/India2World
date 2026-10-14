import React, { useState, useEffect } from 'react';
import { ConsolidationPackageItem } from '../../types/admin';
import { CONSOLIDATION_PACKAGES_POOL } from '../../services/adminMockData';
import {
  getAllCustomers,
  getAllPackages,
  createConsolidatedShipment,
} from '../../services/integratedDataService';
import {
  Home,
  User,
  Truck,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';

interface AdminCreateConsolidationProps {
  onBack: () => void;
  onCreated?: () => void;
}

const SHIPPING_SERVICES = [
  { id: 'DHL Express', name: 'DHL Express', badge: 'DHL', badgeBg: 'bg-[#FFCC00]', badgeText: 'text-[#D40511]', transit: '3-5 Days', basePrice: 5850 },
  { id: 'FedEx Priority', name: 'FedEx Priority', badge: 'FedEx', badgeBg: 'bg-[#4D148C]', badgeText: 'text-amber-400', transit: '2-4 Days', basePrice: 6420 },
  { id: 'Aramex International', name: 'Aramex International', badge: 'aramex', badgeBg: 'bg-[#ED1B24]', badgeText: 'text-white', transit: '5-8 Days', basePrice: 4950 },
];

export const AdminCreateConsolidation: React.FC<AdminCreateConsolidationProps> = ({
  onBack,
  onCreated,
}) => {
  const allCustomers = getAllCustomers();
  const allPkgs = getAllPackages();

  const [customer, setCustomer] = useState(() => {
    if (allCustomers.length > 0) {
      return `${allCustomers[0].id} - ${allCustomers[0].name}`;
    }
    return 'CUS-10028 - Priya Sharma';
  });

  const selectedCustomerObj = allCustomers.find((c) => `${c.id} - ${c.name}` === customer) || allCustomers[0];
  const customerName = selectedCustomerObj?.name || 'Priya Sharma';
  const email = selectedCustomerObj?.email || 'priya.sharma@example.com';
  const destinationCountry = selectedCustomerObj?.country || 'UAE';

  const [packages, setPackages] = useState<ConsolidationPackageItem[]>(() => {
    const custId = customer.split(' - ')[0];
    const customerPkgs = allPkgs.filter((p) => p.customerId === custId && p.status !== 'Dispatched' && p.status !== ('Consolidated' as any));
    if (customerPkgs.length > 0) {
      return customerPkgs.map((p) => ({
        id: p.id,
        packageCode: p.id,
        seller: p.seller,
        trackingNumber: p.trackingNumber,
        warehouseLocation: p.warehouseLocation,
        weightKg: p.actualWeightKg,
        photos: p.photos,
        imageUrl: p.photos && p.photos.length > 0 ? p.photos[0] : '/assets/product-shoes.jpg',
        status: (p.status === 'Received' ? 'Received' : 'Ready') as 'Received' | 'Ready',
        selected: true,
      }));
    }
    return CONSOLIDATION_PACKAGES_POOL;
  });

  useEffect(() => {
    const custId = customer.split(' - ')[0];
    const customerPkgs = allPkgs.filter((p) => p.customerId === custId && p.status !== 'Dispatched' && p.status !== ('Consolidated' as any));
    if (customerPkgs.length > 0) {
      setPackages(customerPkgs.map((p) => ({
        id: p.id,
        packageCode: p.id,
        seller: p.seller,
        trackingNumber: p.trackingNumber,
        warehouseLocation: p.warehouseLocation,
        weightKg: p.actualWeightKg,
        photos: p.photos,
        imageUrl: p.photos && p.photos.length > 0 ? p.photos[0] : '/assets/product-shoes.jpg',
        status: (p.status === 'Received' ? 'Received' : 'Ready') as 'Received' | 'Ready',
        selected: true,
      })));
    } else {
      setPackages(CONSOLIDATION_PACKAGES_POOL);
    }
  }, [customer]);

  const [length, setLength] = useState('40');
  const [width, setWidth] = useState('30');
  const [height, setHeight] = useState('25');

  const [selectedService, setSelectedService] = useState(SHIPPING_SERVICES[0]);
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generatedShipmentId, setGeneratedShipmentId] = useState<string>('SHP-500015');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Compute selected packages
  const selectedPackages = packages.filter((p) => p.selected);
  const selectedCount = selectedPackages.length;

  // Actual weight sum of selected packages
  const actualWeight = selectedPackages
    .reduce((sum, p) => sum + p.weightKg, 0)
    .toFixed(1);

  // Volumetric weight: (L * W * H) / 4000 = 7.5 kg
  const lNum = parseFloat(length) || 0;
  const wNum = parseFloat(width) || 0;
  const hNum = parseFloat(height) || 0;
  const volumetricWeight = ((lNum * wNum * hNum) / 4000).toFixed(1);

  // Chargeable weight is max of actual vs volumetric
  const chargeableWeight = Math.max(parseFloat(actualWeight) || 0, parseFloat(volumetricWeight) || 0).toFixed(1);

  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setPackages((prev) => prev.map((p) => ({ ...p, selected: checked })));
    setValidationError(null);
  };

  const handleTogglePackage = (id: string) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCount === 0) {
      setValidationError('Please select at least one package to include in the consolidated shipment.');
      return;
    }
    setValidationError(null);
    setLoading(true);

    const custId = customer.split(' - ')[0] || 'CUS-10028';
    const shipment = createConsolidatedShipment({
      customerId: custId,
      customerName,
      destination: destinationCountry,
      carrier: selectedService.name,
      packageIds: selectedPackages.map((p) => p.id),
      chargeableWeightKg: parseFloat(chargeableWeight) || 5.0,
      dimensions: {
        lengthCm: lNum,
        widthCm: wNum,
        heightCm: hNum,
      },
    });

    setGeneratedShipmentId(shipment.id);

    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      if (onCreated) {
        setTimeout(onCreated, 1500);
      }
    }, 500);
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto font-['Plus_Jakarta_Sans',sans-serif] pb-12">
      {/* Breadcrumb matching Screenshot */}
      <nav className="flex items-center gap-2 text-xs font-normal text-slate-500 py-1">
        <button
          onClick={onBack}
          className="hover:text-[#0066FF] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Home className="w-3.5 h-3.5 text-slate-400" />
          <span>Dashboard</span>
        </button>
        <span className="text-slate-400 font-light">{'>'}</span>
        <button
          onClick={onBack}
          className="hover:text-[#0066FF] transition-colors cursor-pointer"
        >
          Consolidation
        </button>
        <span className="text-slate-400 font-light">{'>'}</span>
        <span className="text-slate-800 font-medium">Create Consolidated Shipment</span>
      </nav>

      {/* Header Card matching Screenshot */}
      <div className="bg-white rounded-2xl border border-slate-200/70 p-6 flex items-start gap-4 shadow-2xs">
        {/* 3D Isometric Cube Outline Icon */}
        <div className="w-10 h-10 flex items-center justify-center shrink-0 mt-0.5">
          <svg
            className="w-9 h-9 text-[#0B1933]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[#0B1933] tracking-tight">
            Create Consolidated Shipment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Combine multiple packages into a single shipment for international delivery.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Consolidated shipment created successfully! Tracking code #{generatedShipmentId} generated.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card 1: Customer Information */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-5">
            <User className="w-5 h-5 text-[#0B1933]" />
            <h2 className="text-base sm:text-lg font-bold text-[#0B1933] tracking-tight">
              Customer Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Customer * */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Customer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-normal text-slate-800 appearance-none focus:outline-hidden focus:border-[#0066FF] cursor-pointer pr-10"
                  required
                >
                  {allCustomers.map((c) => (
                    <option key={c.id} value={`${c.id} - ${c.name}`}>
                      {c.id} - {c.name} ({c.country})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                readOnly
                className="w-full px-4 py-2.5 bg-[#F1F5F9] border border-slate-200/70 rounded-xl text-xs sm:text-sm font-normal text-slate-700 select-none cursor-default"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full px-4 py-2.5 bg-[#F1F5F9] border border-slate-200/70 rounded-xl text-xs sm:text-sm font-normal text-slate-700 select-none cursor-default"
              />
            </div>

            {/* Destination Country */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Destination Country
              </label>
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#F1F5F9] border border-slate-200/70 rounded-xl">
                <div className="w-6 h-4 rounded-xs overflow-hidden border border-slate-200 flex shrink-0">
                  <div className="w-1/3 bg-red-600 h-full" />
                  <div className="w-2/3 flex flex-col h-full">
                    <div className="h-1/3 bg-emerald-600" />
                    <div className="h-1/3 bg-white" />
                    <div className="h-1/3 bg-black" />
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-900">{destinationCountry}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Select Packages */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <svg
                className="w-5 h-5 text-[#0B1933]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <h2 className="text-base sm:text-lg font-bold text-[#0B1933] tracking-tight">
                Select Packages
              </h2>
            </div>
            <span className="text-xs sm:text-sm text-slate-500 font-normal">
              {selectedCount} packages selected
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[550px]">
              <thead>
                <tr className="bg-[#F0F5FA] text-slate-600 text-xs font-semibold">
                  <th className="py-3 px-4 w-12 rounded-l-lg">
                    <input
                      type="checkbox"
                      checked={selectedCount === packages.length && packages.length > 0}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded-xs text-[#0066FF] focus:ring-[#0066FF] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3">Package</th>
                  <th className="py-3 px-6">Seller</th>
                  <th className="py-3 px-6">Weight</th>
                  <th className="py-3 px-6 rounded-r-lg">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packages.map((pkg) => (
                  <tr
                    key={pkg.id}
                    onClick={() => handleTogglePackage(pkg.id)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={!!pkg.selected}
                        onChange={() => handleTogglePackage(pkg.id)}
                        className="w-4 h-4 rounded-xs text-[#0066FF] focus:ring-[#0066FF] cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={pkg.imageUrl}
                          alt={pkg.packageCode}
                          className="w-14 h-14 rounded-lg object-cover border border-slate-200/80 shrink-0 shadow-2xs"
                        />
                        <div>
                          <span className="font-bold text-[#0066FF] text-sm block">
                            {pkg.packageCode}
                          </span>
                          <span className="text-xs text-slate-500 block mt-0.5">
                            {pkg.seller}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-sm text-slate-700 font-normal">
                      {pkg.seller}
                    </td>
                    <td className="py-3.5 px-6 text-sm font-semibold text-slate-800">
                      {pkg.weightKg} kg
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="inline-block px-3 py-1 rounded-md bg-[#E8F8EE] text-[#107C41] text-xs font-semibold">
                        {pkg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Final Package Details */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-5">
            <svg
              className="w-5 h-5 text-[#0B1933]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
            <h2 className="text-base sm:text-lg font-bold text-[#0B1933] tracking-tight">
              Final Package Details
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Actual Weight (kg)
              </label>
              <input
                type="text"
                value={actualWeight}
                readOnly
                className="w-full px-4 py-2.5 bg-[#F1F5F9] border border-slate-200/70 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 select-none cursor-default"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Length (cm)
              </label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-normal text-slate-800 focus:outline-hidden focus:border-[#0066FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Width (cm)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-normal text-slate-800 focus:outline-hidden focus:border-[#0066FF]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-normal text-slate-800 focus:outline-hidden focus:border-[#0066FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Volumetric Weight (kg)
              </label>
              <input
                type="text"
                value={`${volumetricWeight} kg`}
                readOnly
                className="w-full px-4 py-2.5 bg-[#F1F5F9] border border-slate-200/70 rounded-xl text-xs sm:text-sm font-normal text-slate-700 select-none cursor-default"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chargeable Weight (kg)
              </label>
              <input
                type="text"
                value={`${chargeableWeight} kg`}
                readOnly
                className="w-full px-4 py-2.5 bg-[#F1F5F9] border border-slate-200/70 rounded-xl text-xs sm:text-sm font-normal text-slate-700 select-none cursor-default"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Shipping Quote */}
        <div className="bg-white rounded-2xl border border-slate-200/70 p-6 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-5">
            <Truck className="w-5 h-5 text-[#0B1933]" />
            <h2 className="text-base sm:text-lg font-bold text-[#0B1933] tracking-tight">
              Shipping Quote
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Select Shipping Service
              </label>
              <div className="relative">
                <div
                  onClick={() => setServiceDropdownOpen(!serviceDropdownOpen)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer hover:border-[#0066FF] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`${selectedService.badgeBg} px-2 py-0.5 rounded-xs flex items-center justify-center shrink-0`}>
                      <span className={`${selectedService.badgeText} font-black text-xs tracking-wider italic`}>{selectedService.badge}</span>
                    </div>
                    <span className="text-xs sm:text-sm font-normal text-slate-800">{selectedService.name}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${serviceDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {serviceDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                    {SHIPPING_SERVICES.map((srv) => (
                      <div
                        key={srv.id}
                        onClick={() => {
                          setSelectedService(srv);
                          setServiceDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 cursor-pointer text-xs sm:text-sm ${
                          selectedService.id === srv.id ? 'bg-blue-50/70 font-semibold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`${srv.badgeBg} px-2 py-0.5 rounded-xs flex items-center justify-center shrink-0`}>
                            <span className={`${srv.badgeText} font-black text-xs italic`}>{srv.badge}</span>
                          </div>
                          <span>{srv.name}</span>
                        </div>
                        <span className="text-slate-600 font-bold">₹{srv.basePrice.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Transit Time
              </label>
              <input
                type="text"
                value={selectedService.transit}
                readOnly
                className="w-full px-4 py-2.5 bg-[#F1F5F9] border border-slate-200/70 rounded-xl text-xs sm:text-sm font-normal text-slate-700 select-none cursor-default"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Price (INR)
              </label>
              <input
                type="text"
                value={`₹${selectedService.basePrice.toLocaleString()}`}
                readOnly
                className="w-full px-4 py-2.5 bg-[#F1F5F9] border border-slate-200/70 rounded-xl text-sm sm:text-base font-bold text-slate-900 select-none cursor-default"
              />
            </div>
          </div>

          {/* Validation error */}
          {validationError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Full Width Create Consolidation Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-[#0066FF] hover:bg-[#0052cc] active:bg-[#0040a8] text-white font-semibold text-sm rounded-xl shadow-xs transition-all active:scale-[0.99] cursor-pointer text-center disabled:opacity-70 flex items-center justify-center gap-2 touch-manipulation"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing Consolidation...</span>
              </>
            ) : (
              <span>Create Consolidation</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
