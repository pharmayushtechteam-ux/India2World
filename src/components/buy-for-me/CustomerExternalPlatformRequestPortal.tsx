import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
  ShieldCheck,
  XCircle,
  X,
  Sparkles,
  Package,
  Truck,
} from 'lucide-react';
import {
  CustomerRequestedProductItem,
  ExternalPurchaseRequestRecord,
  submitCustomerExternalPurchaseRequest,
  verifyExternalQuotationToken,
  submitCustomerQuotationDecision,
  fetchCustomerExternalPurchaseRequests,
} from '../../services/externalPurchaseRequestService';
import { getCurrentUser } from '../../utils/userAuth';

const EXTERNAL_PLATFORMS = [
  'Amazon India',
  'Flipkart',
  'Myntra',
  'Nykaa',
  'AJIO',
  'Tata CLiQ',
  'Meisho',
  'Croma',
  'Reliance Digital',
  'FirstCry',
  'Other External Platform',
];

export const CustomerExternalPlatformRequestPortal: React.FC = () => {
  const userProfile = getCurrentUser();

  const [isFormOpen, setIsFormOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const qs = new URLSearchParams(window.location.search);
      return qs.get('externalRequestForm') === 'open';
    }
    return false;
  });

  // Customer Details
  const [fullName, setFullName] = useState(userProfile?.name || '');
  const [email, setEmail] = useState(userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [city, setCity] = useState((userProfile as any)?.city || '');
  const [state, setState] = useState('');
  const [country, setCountry] = useState(
    userProfile?.country || 'United Arab Emirates'
  );
  const [postalCode, setPostalCode] = useState('');

  // Multi-product items
  const [products, setProducts] = useState<
    Array<{
      id: string;
      productName: string;
      platform: string;
      productUrl: string;
      productImage: string;
      quantity: number;
      expectedBudgetINR: string;
      description: string;
      additionalRequirements: string;
    }>
  >([
    {
      id: `cust-req-1-${Date.now()}`,
      productName: '',
      platform: 'Amazon India',
      productUrl: '',
      productImage: '',
      quantity: 1,
      expectedBudgetINR: '',
      description: '',
      additionalRequirements: '',
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedRecord, setSubmittedRecord] =
    useState<ExternalPurchaseRequestRecord | null>(null);

  // Customer's own external requests list
  const [myExternalRequests, setMyExternalRequests] = useState<
    ExternalPurchaseRequestRecord[]
  >([]);

  // Secure Quotation Approval / Rejection Token state
  const [tokenReviewLoading, setTokenReviewLoading] = useState(false);
  const [tokenReviewRecord, setTokenReviewRecord] =
    useState<ExternalPurchaseRequestRecord | null>(null);
  const [activeToken, setActiveToken] = useState<string>('');
  const [tokenDecisionNote, setTokenDecisionNote] = useState('');
  const [tokenDecisionResult, setTokenDecisionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const loadCustomerRequests = async (targetEmail?: string) => {
    const emailToQuery = targetEmail || email || userProfile?.email;
    if (!emailToQuery) return;
    const list = await fetchCustomerExternalPurchaseRequests({
      email: emailToQuery,
      customerId: userProfile?.customerId,
    });
    setMyExternalRequests(list);
  };

  useEffect(() => {
    if (userProfile?.email) {
      loadCustomerRequests(userProfile.email);
    }
  }, [userProfile?.email]);

  // Check URL for secure quotation approval link (?externalRequestId=...&token=...&decision=approve|reject)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const reqId = params.get('externalRequestId');
    const tok = params.get('token');
    const autoDecision = params.get('decision') as 'approve' | 'reject' | null;

    if (reqId && tok) {
      setActiveToken(tok);
      setTokenReviewLoading(true);
      verifyExternalQuotationToken(reqId, tok)
        .then(async (res) => {
          if (res.success && res.request) {
            setTokenReviewRecord(res.request);
            if (
              autoDecision === 'approve' ||
              autoDecision === 'reject'
            ) {
              const decRes = await submitCustomerQuotationDecision({
                requestId: reqId,
                token: tok,
                decision: autoDecision,
              });
              if (decRes.success && decRes.record) {
                setTokenReviewRecord(decRes.record);
                setTokenDecisionResult({
                  success: true,
                  message:
                    autoDecision === 'approve'
                      ? `Thank you! Quotation ${decRes.record.quotation.quotationReference} has been marked as Customer Approved. Our admin procurement team has been notified to purchase your items.`
                      : `You have rejected Quotation ${decRes.record.quotation.quotationReference}. Our procurement team has been notified.`,
                });
              }
            }
          } else {
            setTokenDecisionResult({
              success: false,
              message:
                res.error || 'Invalid or expired quotation approval link.',
            });
          }
        })
        .finally(() => {
          setTokenReviewLoading(false);
        });
    }
  }, []);

  const handleAddProductRow = () => {
    setProducts((prev) => [
      ...prev,
      {
        id: `cust-req-${prev.length + 1}-${Date.now()}`,
        productName: '',
        platform: 'Amazon India',
        productUrl: '',
        productImage: '',
        quantity: 1,
        expectedBudgetINR: '',
        description: '',
        additionalRequirements: '',
      },
    ]);
  };

  const handleRemoveProductRow = (idx: number) => {
    setProducts((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev
    );
  };

  const updateProductField = (idx: number, field: string, value: any) => {
    setProducts((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please enter your phone number.');
      return;
    }
    if (!deliveryAddress.trim() || !city.trim() || !country.trim()) {
      setErrorMessage(
        'Please complete your delivery address, city, and country.'
      );
      return;
    }

    const validProducts: Partial<CustomerRequestedProductItem>[] = products
      .filter((p) => p.productName.trim())
      .map((p) => ({
        id: p.id,
        productName: p.productName.trim(),
        platform: p.platform,
        productUrl: p.productUrl.trim() || undefined,
        productImage: p.productImage.trim() || undefined,
        quantity: Math.max(1, Number(p.quantity) || 1),
        expectedBudgetINR: p.expectedBudgetINR
          ? Number(p.expectedBudgetINR)
          : undefined,
        description: p.description.trim() || undefined,
        additionalRequirements: p.additionalRequirements.trim() || undefined,
      }));

    if (validProducts.length === 0) {
      setErrorMessage(
        'Please enter at least one requested product name and platform.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitCustomerExternalPurchaseRequest({
        customerName: fullName.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        postalCode: postalCode.trim(),
        customerId: userProfile?.customerId,
        products: validProducts,
      });

      if (res.success && res.record) {
        setSubmittedRecord(res.record);
        loadCustomerRequests(email.trim());
      } else {
        setErrorMessage(
          res.error || 'Could not submit your purchase request. Please try again.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomerDecisionClick = async (decision: 'approve' | 'reject') => {
    if (!tokenReviewRecord || !activeToken) return;
    setTokenReviewLoading(true);
    try {
      const res = await submitCustomerQuotationDecision({
        requestId: tokenReviewRecord.requestId,
        token: activeToken,
        decision,
        customerNote: tokenDecisionNote,
      });
      if (res.success && res.record) {
        setTokenReviewRecord(res.record);
        setTokenDecisionResult({
          success: true,
          message:
            decision === 'approve'
              ? `Quotation ${res.record.quotation.quotationReference} Approved! Status updated to "Customer Approved". Our admin team has been notified to purchase your items.`
              : `Quotation ${res.record.quotation.quotationReference} Rejected. Our admin team has been notified.`,
        });
      } else {
        setTokenDecisionResult({
          success: false,
          message: res.error || 'Failed to record decision.',
        });
      }
    } finally {
      setTokenReviewLoading(false);
    }
  };

  return (
    <div className="mb-8 space-y-6">
      {/* Secure Quotation Approval Modal / Card when opened via email link */}
      {(tokenReviewRecord || tokenDecisionResult) && (
        <div className="bg-white rounded-3xl border-2 border-blue-600 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-6 py-4 text-white flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                PHARMAYUSH • SECURE QUOTATION APPROVAL PORTAL
              </div>
              <h3 className="text-lg font-black">
                {tokenReviewRecord
                  ? `Official Quotation for ${tokenReviewRecord.requestId} (${tokenReviewRecord.quotation.quotationReference})`
                  : 'Quotation Verification'}
              </h3>
            </div>
            <button
              onClick={() => {
                setTokenReviewRecord(null);
                setTokenDecisionResult(null);
              }}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {tokenDecisionResult && (
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  tokenDecisionResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {tokenDecisionResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="text-xs font-semibold">
                  {tokenDecisionResult.message}
                </div>
              </div>
            )}

            {tokenReviewRecord && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500">Customer: </span>
                    <strong className="text-slate-900">
                      {tokenReviewRecord.customerName} (
                      {tokenReviewRecord.customerEmail})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Current Status: </span>
                    <strong className="text-blue-600">
                      {tokenReviewRecord.status}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Grand Total: </span>
                    <strong className="text-base font-black text-slate-900">
                      ₹
                      {tokenReviewRecord.quotation.grandTotalINR.toLocaleString(
                        'en-IN'
                      )}
                    </strong>
                  </div>
                </div>

                {tokenReviewRecord.quotation.customerFacingMessage && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    <strong>Message from Procurement Team:</strong>{' '}
                    {tokenReviewRecord.quotation.customerFacingMessage}
                  </div>
                )}

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold">
                        <th className="p-3">Verified Product</th>
                        <th className="p-3">Platform</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Shipping/Extra</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {tokenReviewRecord.processedProducts.map((item) => (
                        <tr key={item.id}>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">
                              {item.actualProductName}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Est. Delivery: {item.estimatedDeliveryTime}
                            </div>
                            {item.verifiedProductUrl && (
                              <a
                                href={item.verifiedProductUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-blue-600 font-bold hover:underline"
                              >
                                View Shopping Link &rarr;
                              </a>
                            )}
                          </td>
                          <td className="p-3">{item.platform}</td>
                          <td className="p-3 text-center font-bold">
                            {item.quantity}
                          </td>
                          <td className="p-3 text-right">
                            ₹{item.actualPriceINR.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-right">
                            ₹
                            {(
                              item.shippingChargesINR +
                              item.additionalChargesINR
                            ).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-right font-bold">
                            ₹{item.subtotalINR.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {tokenReviewRecord.status !== 'Customer Approved' && (
                  <div className="space-y-3 pt-2">
                    <input
                      type="text"
                      value={tokenDecisionNote}
                      onChange={(e) => setTokenDecisionNote(e.target.value)}
                      placeholder="Optional note or comment for the procurement team..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        disabled={tokenReviewLoading}
                        onClick={() => handleCustomerDecisionClick('approve')}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approve Quotation (₹
                        {tokenReviewRecord.quotation.grandTotalINR.toLocaleString(
                          'en-IN'
                        )}
                        )
                      </button>
                      <button
                        disabled={tokenReviewLoading}
                        onClick={() => handleCustomerDecisionClick('reject')}
                        className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Quotation
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Call-to-Action Card: "Request a Product from Another Platform" */}
      <div className="bg-gradient-to-r from-[#0B1933] via-[#132952] to-[#1E3A8A] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-blue-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              EXTERNAL PLATFORM PROCUREMENT SERVICE
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Request a Product from Another Platform
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Want products from Amazon India, Flipkart, Myntra, Nykaa, AJIO, or
              any other external online store? Submit your product requirements
              below. Our admin team will verify pricing, send you an official
              quotation by email, purchase the items on your behalf, and ship
              them straight to your doorstep.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="/request-external-purchase"
              className="px-6 py-3.5 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-black text-xs sm:text-sm shadow-lg inline-flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              Request a Product from Another Platform
            </a>
            <button
              type="button"
              onClick={() => {
                setSubmittedRecord(null);
                setIsFormOpen((prev) => !prev);
              }}
              className="px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isFormOpen ? 'Hide Quick Form' : 'Quick Inline Form'}
            </button>
          </div>
        </div>

        {/* Submission Confirmation Banner */}
        {submittedRecord && (
          <div className="mt-6 p-5 rounded-2xl bg-emerald-950/90 border border-emerald-400/40 text-emerald-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-black text-sm">
                <CheckCircle2 className="w-5 h-5" />
                Purchase Request Submitted Successfully!
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 font-black text-xs">
                Ref: {submittedRecord.requestId}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-emerald-100/90">
              Your external platform purchase request has been saved with
              reference number <strong>{submittedRecord.requestId}</strong>. Our
              admin procurement team will review your requirements and send an
              official quotation to{' '}
              <strong>{submittedRecord.customerEmail}</strong>.
            </p>
          </div>
        )}

        {/* Expandable Customer Submission Form */}
        {isFormOpen && !submittedRecord && (
          <form
            onSubmit={handleSubmitRequest}
            className="mt-6 bg-white text-slate-800 rounded-2xl p-6 shadow-xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Submit External Platform Purchase Request
                </h3>
                <p className="text-xs text-slate-500">
                  Fill in your delivery details and add one or more products
                  from any external shopping website.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                {errorMessage}
              </div>
            )}

            {/* 1. Customer Information */}
            <div className="space-y-3">
              <div className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                1. Customer &amp; Delivery Information
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Delivery Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street address, apartment, building"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    State / Province *
                  </label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State / Emirate"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Postal / ZIP Code"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 2. Requested Products */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600">
                  2. Requested Product Information ({products.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddProductRow}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Another Product
                </button>
              </div>

              {products.map((prod, idx) => (
                <div
                  key={prod.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Product #{idx + 1}
                    </span>
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveProductRow(idx)}
                        className="text-xs font-bold text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={prod.productName}
                        onChange={(e) =>
                          updateProductField(idx, 'productName', e.target.value)
                        }
                        placeholder="e.g. Dyson Airwrap Multi-Styler Complete Long"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        External Shopping Platform *
                      </label>
                      <select
                        value={prod.platform}
                        onChange={(e) =>
                          updateProductField(idx, 'platform', e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                      >
                        {EXTERNAL_PLATFORMS.map((pf) => (
                          <option key={pf} value={pf}>
                            {pf}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Required Quantity *
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={prod.quantity}
                        onChange={(e) =>
                          updateProductField(
                            idx,
                            'quantity',
                            Number(e.target.value)
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Product Shopping URL (If Available)
                      </label>
                      <input
                        type="url"
                        value={prod.productUrl}
                        onChange={(e) =>
                          updateProductField(idx, 'productUrl', e.target.value)
                        }
                        placeholder="https://www.amazon.in/dp/..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Expected Budget in ₹ INR (Optional)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={prod.expectedBudgetINR}
                        onChange={(e) =>
                          updateProductField(
                            idx,
                            'expectedBudgetINR',
                            e.target.value
                          )
                        }
                        placeholder="e.g. 4500"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Product Image URL (Optional)
                      </label>
                      <input
                        type="url"
                        value={prod.productImage}
                        onChange={(e) =>
                          updateProductField(
                            idx,
                            'productImage',
                            e.target.value
                          )
                        }
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Product Description or Specifications
                      </label>
                      <input
                        type="text"
                        value={prod.description}
                        onChange={(e) =>
                          updateProductField(idx, 'description', e.target.value)
                        }
                        placeholder="Size, color, model number, variant..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Additional Requirements
                      </label>
                      <input
                        type="text"
                        value={prod.additionalRequirements}
                        onChange={(e) =>
                          updateProductField(
                            idx,
                            'additionalRequirements',
                            e.target.value
                          )
                        }
                        placeholder="Gift wrap, fragile packaging, specific seller..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black inline-flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {submitting
                  ? 'Submitting Purchase Request...'
                  : 'Submit Purchase Request'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Customer's Submitted External Platform Requests (If any exist for their email) */}
      {myExternalRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              Your Submitted External Platform Purchase Requests (
              {myExternalRequests.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myExternalRequests.map((req) => (
              <div
                key={req.requestId}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-black text-blue-600">
                    {req.requestId}
                  </div>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    {req.requestedProducts.map((p) => p.productName).join(', ')}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Submitted: {req.createdAt}
                    {req.purchaseRecord?.trackingNumber
                      ? ` • Tracking: ${req.purchaseRecord.trackingNumber}`
                      : ''}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                    {req.status}
                  </span>
                  {req.quotation?.grandTotalINR > 0 && (
                    <div className="font-black text-slate-900 mt-1">
                      ₹{req.quotation.grandTotalINR.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
