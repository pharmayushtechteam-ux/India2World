import React, { useState } from 'react';
import {
  ArrowLeft,
  Package,
  Calendar,
  Upload,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  receiveNewPackage,
  getAllCustomers,
  getAllPurchaseRequests,
  getAllOrders,
  updateOrderStatus,
  updatePurchaseRequestStatus,
} from '../../services/integratedDataService';

interface AdminReceivePackageProps {
  onBack: () => void;
  onSaved?: () => void;
}

export const AdminReceivePackage: React.FC<AdminReceivePackageProps> = ({
  onBack,
  onSaved,
}) => {
  const availableCustomers = getAllCustomers();
  const availableRequests = getAllPurchaseRequests();
  const availableOrders = getAllOrders();

  const [customer, setCustomer] = useState(() => {
    if (availableCustomers.length > 0) {
      return `${availableCustomers[0].id} - ${availableCustomers[0].name}`;
    }
    return 'CUS-10028 - Priya Sharma';
  });

  const [relatedRequest, setRelatedRequest] = useState(() => {
    if (availableOrders.length > 0) {
      return availableOrders[0].id;
    }
    if (availableRequests.length > 0) {
      return availableRequests[0].id;
    }
    return 'REQ-20482';
  });

  const [seller, setSeller] = useState('Amazon India');
  const [sellerOrderNumber, setSellerOrderNumber] = useState('408-1234567-8901234');
  const [trackingNumber, setTrackingNumber] = useState('AWB123456789');
  const [courier, setCourier] = useState('Amazon Logistics');
  const [arrivalDate, setArrivalDate] = useState('06 Nov 2024');

  const [actualWeight, setActualWeight] = useState('1.2');
  const [length, setLength] = useState('25');
  const [width, setWidth] = useState('18');
  const [height, setHeight] = useState('12');
  const [condition, setCondition] = useState('Good');
  const [warehouseLocation, setWarehouseLocation] = useState('A-12-B');

  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300&auto=format&fit=crop&q=80',
  ]);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSamplePhoto = () => {
    const sample = 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=300&auto=format&fit=crop&q=80';
    setPhotos((prev) => [...prev, sample]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = customer.split(' - ');
    const customerId = parts[0] || 'CUS-10028';
    const customerName = parts[1] || 'Priya Sharma';

    receiveNewPackage({
      customerId,
      customerName,
      requestId: relatedRequest || 'REQ-20482',
      seller,
      sellerOrderNumber: sellerOrderNumber || 'ORD-INBOUND-99',
      trackingNumber: trackingNumber || 'AWB-INBOUND-12',
      courier,
      arrivalDate,
      actualWeightKg: parseFloat(actualWeight) || 1.2,
      lengthCm: parseFloat(length) || 25,
      widthCm: parseFloat(width) || 18,
      heightCm: parseFloat(height) || 12,
      condition: (condition as any) || 'Good',
      warehouseLocation: warehouseLocation || 'A-12-B',
      photos: photos.length > 0 ? photos : ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&auto=format&fit=crop&q=80'],
      status: 'Received',
    });

    if (relatedRequest.startsWith('ORD-')) {
      updateOrderStatus(relatedRequest, 'In Warehouse');
    } else if (relatedRequest.startsWith('REQ-')) {
      updatePurchaseRequestStatus(relatedRequest, 'Purchased');
    }

    setSavedSuccess(true);
    setTimeout(() => {
      if (onSaved) onSaved();
      else onBack();
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#0066FF] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incoming Packages</span>
        </button>
      </div>

      {/* Page Title with 3D cube icon */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0066FF] shadow-2xs">
          <Package className="w-6 h-6 text-[#0066FF]" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
            Receive Incoming Package
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Add the details of the package received at the Indian warehouse.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Package received and saved to bay {warehouseLocation} successfully! Returning to inventory...</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-bold text-[#0B1933] tracking-tight">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Customer * */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF] font-medium text-slate-800 cursor-pointer"
                required
              >
                {availableCustomers.map((c) => (
                  <option key={c.id} value={`${c.id} - ${c.name}`}>
                    {c.id} - {c.name} ({c.country})
                  </option>
                ))}
              </select>
            </div>

            {/* Related Request * */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Related Order / Request <span className="text-red-500">*</span>
              </label>
              <select
                value={relatedRequest}
                onChange={(e) => setRelatedRequest(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF] font-medium text-slate-800 cursor-pointer"
                required
              >
                {availableOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} - {o.customerName} ({o.orderType})
                  </option>
                ))}
                {availableRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} - {r.customerName} ({r.destinationCountry})
                  </option>
                ))}
              </select>
            </div>

            {/* Seller */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Seller
              </label>
              <select
                value={seller}
                onChange={(e) => setSeller(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF] font-medium text-slate-800 cursor-pointer"
              >
                <option value="Amazon India">Amazon India</option>
                <option value="Myntra">Myntra</option>
                <option value="Flipkart">Flipkart</option>
                <option value="TATA CLiQ">TATA CLiQ</option>
                <option value="AJIO">AJIO</option>
              </select>
            </div>

            {/* Seller Order Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Seller Order Number
              </label>
              <input
                type="text"
                value={sellerOrderNumber}
                onChange={(e) => setSellerOrderNumber(e.target.value)}
                placeholder="408-1234567-8901234"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF] font-medium text-slate-800"
              />
            </div>

            {/* Tracking Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tracking Number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="AWB123456789"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF] font-medium text-slate-800"
              />
            </div>

            {/* Courier */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Courier
              </label>
              <select
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF] font-medium text-slate-800 cursor-pointer"
              >
                <option value="Amazon Logistics">Amazon Logistics</option>
                <option value="Blue Dart">Blue Dart</option>
                <option value="Delhivery">Delhivery</option>
                <option value="Ekart Logistics">Ekart Logistics</option>
                <option value="DTDC">DTDC</option>
              </select>
            </div>

            {/* Arrival Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Arrival Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  placeholder="06 Nov 2024"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF] font-medium text-slate-800"
                />
                <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Package Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-[#0B1933] tracking-tight">
              Package Details
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter the physical details and condition of the received package.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Actual Weight */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Actual Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={actualWeight}
                onChange={(e) => setActualWeight(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF] font-medium text-slate-800"
              />
            </div>

            {/* Length */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Length (cm)
              </label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF] font-medium text-slate-800"
              />
            </div>

            {/* Width */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Width (cm)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF] font-medium text-slate-800"
              />
            </div>

            {/* Height */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Height (cm)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF] font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            {/* Condition */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF] font-medium text-slate-800 cursor-pointer"
              >
                <option value="Good">Good</option>
                <option value="Damaged">Damaged</option>
                <option value="Repackaged">Repackaged</option>
              </select>
            </div>

            {/* Warehouse Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Warehouse Location
              </label>
              <select
                value={warehouseLocation}
                onChange={(e) => setWarehouseLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-[#0066FF] font-medium text-slate-800 cursor-pointer"
              >
                <option value="A-12-B">A-12-B</option>
                <option value="A-12-C">A-12-C</option>
                <option value="B-04-A">B-04-A</option>
                <option value="C-01-D">C-01-D</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Photos */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[#0B1933] tracking-tight">
              Photos
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Add photos of the package for record keeping.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Image Previews */}
            {photos.map((src, index) => (
              <div
                key={index}
                className="relative w-32 h-28 rounded-2xl overflow-hidden border border-slate-200 shadow-2xs group"
              >
                <img src={src} alt="Package" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-slate-900/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add Photos Button */}
            <button
              type="button"
              onClick={handleAddSamplePhoto}
              className="w-32 h-28 rounded-2xl border-2 border-dashed border-blue-300 hover:border-[#0066FF] bg-blue-50/40 hover:bg-blue-50 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer text-[#0066FF]"
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs font-bold">Add Photos</span>
            </button>
          </div>
        </div>

        {/* Save Package Full-width Button */}
        <button
          type="submit"
          className="w-full py-4 px-6 bg-[#0066FF] hover:bg-[#0052cc] text-white font-extrabold text-base rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer text-center"
        >
          Save Package
        </button>
      </form>
    </div>
  );
};
