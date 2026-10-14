import React, { useState } from 'react';
import { X, Search, Truck, CheckCircle2, Clock, MapPin, AlertCircle, Package } from 'lucide-react';
import { sampleShipments } from '../../data/mockData';
import { getAllShipments } from '../../services/integratedDataService';

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
    trackingNumber: s.trackingNumber || s.id || 'TRK-UNKNOWN',
    carrier: s.carrier || 'DHL Express',
    destinationCity: s.destinationCity || destParts[0] || 'International Hub',
    destinationCountry: s.destinationCountry || destParts[1] || 'Overseas',
    weightKg: typeof s.weightKg === 'number' ? s.weightKg : 2.5,
    packagesCount: typeof s.packagesCount === 'number' ? s.packagesCount : 1,
    status: (s.status as any) || 'In Transit',
    estimatedDelivery: s.estimatedDelivery || '3 - 5 business days',
    timeline: Array.isArray(s.timeline) && s.timeline.length > 0
      ? s.timeline
      : [
          {
            title: 'Shipment Label Generated & Handed to Carrier',
            location: 'Mumbai Hub, India',
            timestamp: s.date || 'Today, 08:30 AM',
            completed: true,
          },
          {
            title: 'In Transit to Destination',
            location: 'International Air Transit',
            timestamp: 'In Progress',
            completed: s.status === 'In Transit' || s.status === 'Delivered',
          },
          {
            title: 'Delivered',
            location: s.destination || 'Customer Address',
            timestamp: s.status === 'Delivered' ? 'Completed' : 'Pending',
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
  const [searchedShipment, setSearchedShipment] = useState<ShipmentItem>(() => {
    const all = [...getAllShipments(), ...sampleShipments];
    const found = all.find((s) => (s.trackingNumber || '').toUpperCase() === initialTrackingNumber.toUpperCase());
    return normalizeShipment(found || all[0]);
  });
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) {
      setErrorMsg('Please enter a tracking number.');
      return;
    }

    const all = [...getAllShipments(), ...sampleShipments];
    const found = all.find(
      (s) => (s.trackingNumber || '').toLowerCase() === searchCode.trim().toLowerCase()
    );

    if (found) {
      setSearchedShipment(normalizeShipment(found));
      setErrorMsg('');
    } else {
      // Create a demonstration tracking state for whatever tracking number the user typed
      setSearchedShipment(normalizeShipment({
        id: `mock-${Date.now()}`,
        trackingNumber: searchCode.trim().toUpperCase(),
        carrier: 'DHL Express',
        destinationCountry: 'United Arab Emirates',
        destinationCity: 'Dubai',
        weightKg: 1.85,
        packagesCount: 1,
        status: 'In Transit',
        estimatedDelivery: '3 - 5 business days',
        timeline: [
          {
            title: 'Shipment Label Generated & Handed to Carrier',
            location: 'Mumbai Hub, India',
            timestamp: 'Today, 08:30 AM',
            completed: true,
          },
          {
            title: 'Customs Clearance in Progress',
            location: 'Chhatrapati Shivaji Maharaj International Airport (BOM)',
            timestamp: 'Today, 11:45 AM',
            completed: true,
          },
          {
            title: 'In International Transit',
            location: 'Connecting Flight En Route',
            timestamp: 'Expected departure 08:00 PM',
            completed: false,
          },
        ],
      }));
      setErrorMsg('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-[#0066FF] flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Track Your Shipment</h3>
              <p className="text-xs text-slate-500">Live tracking from Mumbai hub to your destination</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Search Box */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Package className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Enter Shipment ID (e.g. SHP-50012, SHP-49910)"
                className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-[#0066FF] hover:bg-[#0052CC] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              Track
            </button>
          </form>

          {errorMsg && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Quick suggestions */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Try sample tracking numbers:</span>
            <button
              type="button"
              onClick={() => {
                setSearchCode('SHP-50012');
                setSearchedShipment(sampleShipments[0]);
              }}
              className="text-[#0066FF] font-semibold underline decoration-dotted hover:text-blue-800"
            >
              SHP-50012 (In Transit)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setSearchCode('SHP-49910');
                setSearchedShipment(sampleShipments[1]);
              }}
              className="text-[#0066FF] font-semibold underline decoration-dotted hover:text-blue-800"
            >
              SHP-49910 (Delivered)
            </button>
          </div>

          {/* Shipment Overview Card */}
          {searchedShipment && (
            <div className="border border-slate-200 rounded-xl p-5 bg-gradient-to-br from-blue-50/40 via-white to-slate-50">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-lg">
                      {searchedShipment.trackingNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#0066FF]">
                      {searchedShipment.carrier}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Destination: <strong className="text-slate-700">{searchedShipment.destinationCity}, {searchedShipment.destinationCountry}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
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
                  <span className="text-slate-400 block">Total Weight</span>
                  <strong className="text-slate-800 text-sm">{searchedShipment.weightKg} kg</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Consolidated Packages</span>
                  <strong className="text-slate-800 text-sm">{searchedShipment.packagesCount} items</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Service Level</span>
                  <strong className="text-slate-800 text-sm">International Express</strong>
                </div>
              </div>

              {/* Progress Milestones */}
              <div className="mt-5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-4">
                  Tracking History & Milestones
                </h4>
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {searchedShipment.timeline.map((step, idx) => (
                    <div key={idx} className="relative">
                      {/* Step node icon */}
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
                        <p className={`text-sm font-bold ${step.completed ? 'text-slate-900' : 'text-slate-500'}`}>
                          {step.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {step.location}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {step.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Frontend Demo Notice */}
          <div className="text-center bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-500">
            ℹ️ <strong>Demonstration Mode:</strong> In production, this interfaces directly with DHL, FedEx, Aramex, and Delhivery courier tracking webhooks.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
