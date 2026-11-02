import React, { useState, useEffect } from 'react';
import { X, Search, Truck, CheckCircle2, Clock, MapPin, AlertCircle, Package } from 'lucide-react';
import { sampleShipments, sampleWarehousePackages, samplePurchaseRequests } from '../../data/mockData';
import {
  getAllShipments,
  getAllOrders,
  getAllPackages,
  getAllPurchaseRequests,
} from '../../services/integratedDataService';
import { ShipmentItem } from '../../types';

interface TrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrackingNumber?: string;
}

const normalizeShipment = (s: any): ShipmentItem => {
  if (!s) {
    return sampleShipments[0];
  }
  const destParts = (s.destination || '').split(',').map((x: string) => x.trim());
  return {
    id: s.id || `shp-${Date.now()}`,
    trackingNumber: s.trackingNumber || s.id || 'SHP-50012',
    carrier: s.carrier || 'DHL Express',
    destinationCity: s.destinationCity || destParts[0] || 'Dubai',
    destinationCountry: s.destinationCountry || destParts[1] || s.destination || 'United Arab Emirates',
    weightKg: typeof s.weightKg === 'number' ? s.weightKg : 2.5,
    packagesCount: typeof s.packagesCount === 'number' ? s.packagesCount : 1,
    status: (s.status as any) || 'In Transit',
    estimatedDelivery: s.estimatedDelivery || '3 - 5 business days',
    timeline:
      Array.isArray(s.timeline) && s.timeline.length > 0
        ? s.timeline
        : [
            {
              title: 'Shipment Label Generated & Handed to Carrier',
              location: 'Mumbai Hub, India',
              timestamp: s.date || 'Completed',
              completed: true,
            },
            {
              title: 'In International Air Transit',
              location: `En Route to ${s.destinationCountry || s.destination || 'Destination'}`,
              timestamp: s.status === 'Delivered' ? 'Completed' : 'In Progress',
              completed: s.status === 'In Transit' || s.status === 'Departed' || s.status === 'Delivered',
            },
            {
              title: 'Delivered to Recipient',
              location: s.destinationCity || s.destination || 'Destination Address',
              timestamp: s.status === 'Delivered' ? s.date || 'Delivered' : 'Pending',
              completed: s.status === 'Delivered',
            },
          ],
  };
};

export const TrackingModal: React.FC<TrackingModalProps> = ({
  isOpen,
  onClose,
  initialTrackingNumber = 'SHP-50012',
}) => {
  const [searchCode, setSearchCode] = useState(initialTrackingNumber);
  const [serverOrders, setServerOrders] = useState<any[]>([]);
  const [searchedShipment, setSearchedShipment] = useState<ShipmentItem | null>(() => {
    const all = [...getAllShipments(), ...sampleShipments];
    const found = all.find(
      (s) =>
        (s.trackingNumber || '').toUpperCase() === initialTrackingNumber.toUpperCase() ||
        (s.id || '').toUpperCase() === initialTrackingNumber.toUpperCase()
    );
    return normalizeShipment(found || sampleShipments[0]);
  });
  const [errorMsg, setErrorMsg] = useState('');

  // Load real orders from backend database (/api/server-orders)
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/server-orders')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.orders)) {
          setServerOrders(data.orders);
        }
      })
      .catch(() => {
        // Fallback to local integrated store if offline
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const lookupTrackingRecord = (rawQuery: string): ShipmentItem | null => {
    const code = rawQuery.trim().toUpperCase();
    if (!code) return null;

    // 1. Check Shipments (Integrated + Sample)
    const allShipments = [...getAllShipments(), ...sampleShipments];
    const matchedShipment = allShipments.find(
      (s) =>
        (s.trackingNumber || '').toUpperCase() === code ||
        (s.id || '').toUpperCase() === code
    );
    if (matchedShipment) {
      return normalizeShipment(matchedShipment);
    }

    // 2. Check Real Server Orders (/api/server-orders) & Integrated Orders
    const allOrders = [...serverOrders, ...getAllOrders()];
    const matchedOrder = allOrders.find(
      (o) =>
        (o.orderId || o.id || '').toUpperCase() === code ||
        (o.trackingAwb || '').toUpperCase() === code ||
        (o.invoice?.invoiceNumber || '').toUpperCase() === code
    );
    if (matchedOrder) {
      const orderId = matchedOrder.orderId || matchedOrder.id;
      const itemsCount =
        matchedOrder.itemCount ||
        (Array.isArray(matchedOrder.products) ? matchedOrder.products.length : 0) ||
        (Array.isArray(matchedOrder.items) ? matchedOrder.items.length : 1);
      const city =
        matchedOrder.deliveryAddress?.city ||
        matchedOrder.invoice?.destinationCity ||
        'Dubai';
      const country =
        matchedOrder.deliveryAddress?.country ||
        matchedOrder.invoice?.destinationCountry ||
        matchedOrder.destination ||
        'United Arab Emirates';
      const status = matchedOrder.orderStatus || 'Procuring';

      return {
        id: orderId,
        trackingNumber: orderId,
        carrier: 'DHL Express',
        destinationCity: city,
        destinationCountry: country,
        weightKg: Number((itemsCount * 0.65).toFixed(2)),
        packagesCount: itemsCount,
        status: status === 'Delivered' ? 'Delivered' : 'In Transit',
        estimatedDelivery: status === 'Delivered' ? 'Delivered' : '3 - 5 business days after dispatch',
        timeline: [
          {
            title: `Order Confirmed & Payment Verified (${matchedOrder.paymentStatus || 'Paid'})`,
            location: 'Mumbai Operations Hub, India',
            timestamp: matchedOrder.orderDate || matchedOrder.createdAt || 'Confirmed',
            completed: true,
          },
          {
            title: `Procurement & Quality Inspection (${itemsCount} items)`,
            location: 'Mumbai Warehouse Facility',
            timestamp: status === 'Procuring' ? 'In Progress' : 'Completed',
            completed: true,
          },
          {
            title: 'Consolidation & Export Customs Manifest',
            location: 'Mumbai International Hub (BOM)',
            timestamp:
              status === 'Dispatched' || status === 'Delivered' ? 'Completed' : 'Scheduled',
            completed: status === 'Dispatched' || status === 'Delivered',
          },
          {
            title: `International Delivery to ${city}, ${country}`,
            location: `${city}, ${country}`,
            timestamp: status === 'Delivered' ? 'Delivered' : 'Pending Dispatch',
            completed: status === 'Delivered',
          },
        ],
      };
    }

    // 3. Check Warehouse Packages
    const allPackages = [...getAllPackages(), ...sampleWarehousePackages];
    const matchedPkg: any = allPackages.find(
      (p: any) =>
        (p.packageNumber || p.id || '').toUpperCase() === code ||
        (p.trackingNumber || '').toUpperCase() === code
    );
    if (matchedPkg) {
      const pkgCode = matchedPkg.packageNumber || matchedPkg.id;
      return {
        id: pkgCode,
        trackingNumber: pkgCode,
        carrier: matchedPkg.courier || matchedPkg.senderStore || 'Mumbai Warehouse Locker',
        destinationCity: 'Mumbai Hub',
        destinationCountry: 'India (Ready for International Consolidation)',
        weightKg: matchedPkg.weightKg || matchedPkg.actualWeightKg || 0.95,
        packagesCount: matchedPkg.itemsCount || 1,
        status: 'Customs Clearance' as any,
        estimatedDelivery: `${matchedPkg.freeStorageDaysLeft || 29} days free locker storage remaining`,
        timeline: [
          {
            title: `Dispatched by ${matchedPkg.senderStore || matchedPkg.seller || 'Indian Store'}`,
            location: 'Domestic Courier Transit, India',
            timestamp: matchedPkg.receivedDate || matchedPkg.arrivalDate || 'Completed',
            completed: true,
          },
          {
            title: 'Received & Inspected at Mumbai Warehouse',
            location: 'Sakinaka Hub, Andheri East, Mumbai',
            timestamp: matchedPkg.receivedDate || matchedPkg.arrivalDate || 'Completed',
            completed: true,
          },
          {
            title: `Status: ${matchedPkg.status || 'Ready for Consolidation'}`,
            location: 'Personal Indian Locker',
            timestamp: 'Ready for International Dispatch',
            completed: true,
          },
        ],
      };
    }

    // 4. Check Purchase Requests
    const allRequests = [...getAllPurchaseRequests(), ...samplePurchaseRequests];
    const matchedReq: any = allRequests.find(
      (r: any) =>
        (r.requestNumber || r.id || '').toUpperCase() === code
    );
    if (matchedReq) {
      const reqCode = matchedReq.requestNumber || matchedReq.id;
      return {
        id: reqCode,
        trackingNumber: reqCode,
        carrier: 'DHL Express',
        destinationCity: matchedReq.destinationCity || 'Dubai',
        destinationCountry: matchedReq.destinationCountry || 'United Arab Emirates',
        weightKg: Number(((matchedReq.totalItems || matchedReq.itemsCount || 2) * 0.6).toFixed(2)),
        packagesCount: matchedReq.totalItems || matchedReq.itemsCount || 2,
        status: 'In Transit',
        estimatedDelivery: `Status: ${matchedReq.status}`,
        timeline: [
          {
            title: 'Buy For Me Request Submitted',
            location: 'Online Portal',
            timestamp: matchedReq.date || matchedReq.submittedAt || 'Submitted',
            completed: true,
          },
          {
            title: `Procurement Status: ${matchedReq.status}`,
            location: 'Mumbai Buying Desk, India',
            timestamp: 'Active',
            completed: true,
          },
        ],
      };
    }

    return null;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) {
      setErrorMsg('Please enter a tracking, shipment, or order number.');
      return;
    }

    const found = lookupTrackingRecord(searchCode);
    if (found) {
      setSearchedShipment(found);
      setErrorMsg('');
    } else {
      setSearchedShipment(null);
      setErrorMsg(
        `No shipment, order, or package found matching "${searchCode.trim().toUpperCase()}". Please verify your ID or select one of the active records below.`
      );
    }
  };

  const quickSelectCode = (code: string) => {
    setSearchCode(code);
    const found = lookupTrackingRecord(code);
    if (found) {
      setSearchedShipment(found);
      setErrorMsg('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-100 text-[#0066FF] flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate">Track Your Shipment</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Live tracking from Mumbai hub to your destination
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tracking modal"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[78vh] overflow-y-auto">
          {/* Search Box */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 min-w-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Enter ID (e.g. SHP-50012, ORD-22033, PKG-30421)"
                className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-hidden focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-[#0066FF] hover:bg-[#0052CC] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Track</span>
            </button>
          </form>

          {errorMsg && (
            <div className="flex items-start gap-2 text-xs sm:text-sm text-red-700 bg-red-50 p-3.5 rounded-xl border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick suggestions from real database records */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-slate-500">
            <span className="font-medium">Active records:</span>
            <button
              type="button"
              onClick={() => quickSelectCode('SHP-50012')}
              className="text-[#0066FF] font-semibold underline decoration-dotted hover:text-blue-800 cursor-pointer"
            >
              SHP-50012 (In Transit)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => quickSelectCode('SHP-49910')}
              className="text-[#0066FF] font-semibold underline decoration-dotted hover:text-blue-800 cursor-pointer"
            >
              SHP-49910 (Delivered)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => quickSelectCode('ORD-22033')}
              className="text-[#0066FF] font-semibold underline decoration-dotted hover:text-blue-800 cursor-pointer"
            >
              ORD-22033 (Order)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => quickSelectCode('PKG-30421')}
              className="text-[#0066FF] font-semibold underline decoration-dotted hover:text-blue-800 cursor-pointer"
            >
              PKG-30421 (Warehouse)
            </button>
          </div>

          {/* Shipment Overview Card */}
          {searchedShipment && (
            <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-gradient-to-br from-blue-50/40 via-white to-slate-50">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-base sm:text-lg">
                      {searchedShipment.trackingNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#0066FF]">
                      {searchedShipment.carrier}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Destination:{' '}
                    <strong className="text-slate-700">
                      {searchedShipment.destinationCity}, {searchedShipment.destinationCountry}
                    </strong>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {searchedShipment.status}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 font-medium">
                    Est: {searchedShipment.estimatedDelivery}
                  </div>
                </div>
              </div>

              {/* Package stats */}
              <div className="grid grid-cols-3 gap-2 py-3 text-center text-xs border-b border-slate-100 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Weight</span>
                  <strong className="text-slate-800 text-xs sm:text-sm">{searchedShipment.weightKg} kg</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Packages / Items</span>
                  <strong className="text-slate-800 text-xs sm:text-sm">{searchedShipment.packagesCount} items</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Service Level</span>
                  <strong className="text-slate-800 text-xs sm:text-sm">International Express</strong>
                </div>
              </div>

              {/* Progress Milestones */}
              <div className="mt-5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">
                  Tracking History &amp; Milestones
                </h4>
                <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {searchedShipment.timeline.map((step, idx) => (
                    <div key={idx} className="relative">
                      <div
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                          step.completed
                            ? 'bg-[#0066FF] text-white'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                      >
                        {step.completed ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-slate-400" />
                        )}
                      </div>

                      <div>
                        <p className={`text-xs sm:text-sm font-bold ${step.completed ? 'text-slate-900' : 'text-slate-500'}`}>
                          {step.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{step.location}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{step.timestamp}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
