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
  Sparkles,
  Package,
  Truck,
  ArrowLeft,
  Copy,
  Check,
  Globe,
  Mail,
  Phone,
  MapPin,
  User,
  Link2,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { Page } from '../../types';
import {
  CustomerRequestedProductItem,
  ExternalPurchaseRequestRecord,
  submitCustomerExternalPurchaseRequest,
  verifyExternalQuotationToken,
  submitCustomerQuotationDecision,
} from '../../services/externalPurchaseRequestService';
import { getCurrentUser } from '../../utils/userAuth';
import { parseProductFromUrl } from '../../utils/urlProductParser';

interface RequestExternalPurchasePageProps {
  onNavigate: (page: Page) => void;
  isInDashboard?: boolean;
}

const SHOPPING_PLATFORMS = [
  'Amazon',
  'Flipkart',
  'Myntra',
  'Nykaa',
  'AJIO',
  'Tata CLiQ',
  'Croma',
  'Reliance Digital',
  'FirstCry',
  'Other',
];

function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true; // optional field when empty
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const RequestExternalPurchasePage: React.FC<
  RequestExternalPurchasePageProps
> = ({ onNavigate, isInDashboard = false }) => {
  const userProfile = getCurrentUser();

  // Customer Details State
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

  // Spam honeypot (must remain empty)
  const [honeypot, setHoneypot] = useState('');

  // Multi-product State
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
      id: `item-1-${Date.now()}`,
      productName: '',
      platform: 'Amazon',
      productUrl: '',
      productImage: '',
      quantity: 1,
      expectedBudgetINR: '',
      description: '',
      additionalRequirements: '',
    },
  ]);

  // Validation & Submission State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    record: ExternalPurchaseRequestRecord;
    emailSent: boolean;
    emailError?: string;
  } | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Secure Quotation Approval / Rejection via URL Token (?externalRequestId=...&token=...)
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenRecord, setTokenRecord] =
    useState<ExternalPurchaseRequestRecord | null>(null);
  const [activeToken, setActiveToken] = useState('');
  const [tokenNote, setTokenNote] = useState('');
  const [tokenDecisionMessage, setTokenDecisionMessage] = useState<{
    success: boolean;
    text: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const reqId = params.get('externalRequestId');
    const tok = params.get('token');
    const autoDecision = params.get('decision') as 'approve' | 'reject' | null;

    if (reqId && tok) {
      setActiveToken(tok);
      setTokenLoading(true);
      verifyExternalQuotationToken(reqId, tok)
        .then(async (res) => {
          if (res.success && res.request) {
            setTokenRecord(res.request);
            if (autoDecision === 'approve' || autoDecision === 'reject') {
              const decRes = await submitCustomerQuotationDecision({
                requestId: reqId,
                token: tok,
                decision: autoDecision,
              });
              if (decRes.success && decRes.record) {
                setTokenRecord(decRes.record);
                setTokenDecisionMessage({
                  success: true,
                  text:
                    autoDecision === 'approve'
                      ? `Quotation ${decRes.record.quotation.quotationReference} has been marked as Customer Approved! Our admin procurement team has been notified to purchase your items.`
                      : `You have declined Quotation ${decRes.record.quotation.quotationReference}. Our procurement team has been notified.`,
                });
              }
            }
          } else {
            setTokenDecisionMessage({
              success: false,
              text:
                res.error || 'Invalid or expired quotation approval link.',
            });
          }
        })
        .finally(() => {
          setTokenLoading(false);
        });
    }
  }, []);

  const handleAddAnotherProduct = () => {
    setProducts((prev) => [
      ...prev,
      {
        id: `item-${prev.length + 1}-${Date.now()}`,
        productName: '',
        platform: 'Amazon',
        productUrl: '',
        productImage: '',
        quantity: 1,
        expectedBudgetINR: '',
        description: '',
        additionalRequirements: '',
      },
    ]);
  };

  const handleRemoveProduct = (idx: number) => {
    if (products.length <= 1) return;
    setProducts((prev) => prev.filter((_, i) => i !== idx));
  };

  const detectPlatformFromUrl = (rawUrl: string): string | null => {
    const lower = rawUrl.toLowerCase();
    if (lower.includes('flipkart.')) return 'Flipkart';
    if (lower.includes('amazon.')) return 'Amazon';
    if (lower.includes('myntra.')) return 'Myntra';
    if (lower.includes('nykaa.')) return 'Nykaa';
    if (lower.includes('ajio.')) return 'AJIO';
    if (lower.includes('tatacliq.')) return 'Tata CLiQ';
    if (lower.includes('bigbasket.')) return 'BigBasket';
    if (lower.includes('meesho.')) return 'Meesho';
    if (lower.includes('jiomart.')) return 'JioMart';
    return null;
  };

  const enrichProductFromUrl = async (idx: number, rawUrl: string) => {
    const trimmed = rawUrl.trim();
    if (!/^https?:\/\//i.test(trimmed)) return;

    const detectedPlatform = detectPlatformFromUrl(trimmed);
    const parsed = parseProductFromUrl(trimmed);

    setProducts((prev) => {
      if (!prev[idx]) return prev;
      const next = [...prev];
      const cur = { ...next[idx] };
      if (detectedPlatform) cur.platform = detectedPlatform;
      if (!cur.productUrl.trim()) cur.productUrl = trimmed;
      if (!cur.productName.trim() || /^https?:\/\//i.test(cur.productName.trim())) {
        if (parsed.title) cur.productName = parsed.title;
      }
      next[idx] = cur;
      return next;
    });

    try {
      const res = await fetch(`/api/fetch-product-meta?url=${encodeURIComponent(trimmed)}`);
      if (!res.ok) return;
      const data = await res.json();
      setProducts((prev) => {
        if (!prev[idx]) return prev;
        const next = [...prev];
        const cur = { ...next[idx] };
        if (data.title && (!cur.productName.trim() || /^https?:\/\//i.test(cur.productName.trim()))) {
          cur.productName = data.title;
        }
        if (data.price && Number(data.price) > 0 && (!cur.expectedBudgetINR.trim() || Number(cur.expectedBudgetINR) <= 0)) {
          cur.expectedBudgetINR = String(Math.round(Number(data.price)));
        }
        if (data.imageUrl && !cur.productImage.trim()) {
          cur.productImage = data.imageUrl;
        }
        next[idx] = cur;
        return next;
      });
    } catch {
      // silent fallback
    }
  };

  const updateProduct = (idx: number, key: string, value: any) => {
    setProducts((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy[`product_${idx}_${key}`];
      return copy;
    });

    if ((key === 'productUrl' || key === 'productName') && typeof value === 'string' && /^https?:\/\//i.test(value.trim())) {
      void enrichProductFromUrl(idx, value);
    }
  };

  const validateAllFields = (): boolean => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.';
    }
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!phone.trim() || phone.trim().length < 6) {
      errors.phone = 'Valid phone number is required.';
    }
    if (!deliveryAddress.trim()) {
      errors.deliveryAddress = 'Delivery address is required.';
    }

    products.forEach((prod, idx) => {
      if (!prod.productName.trim()) {
        errors[`product_${idx}_productName`] = 'Product name is required.';
      }
      const qty = Number(prod.quantity);
      if (!qty || qty < 1 || !Number.isFinite(qty)) {
        errors[`product_${idx}_quantity`] =
          'Required quantity must be at least 1.';
      }
      if (prod.productUrl.trim() && !isValidHttpUrl(prod.productUrl)) {
        errors[`product_${idx}_productUrl`] =
          'Please enter a valid URL starting with https:// or http://';
      }
      if (prod.productImage.trim() && !isValidHttpUrl(prod.productImage)) {
        errors[`product_${idx}_productImage`] =
          'Please enter a valid image URL starting with https:// or http://';
      }
    });

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError(
        'Please correct the highlighted fields below before submitting your purchase request.'
      );
      return false;
    }
    setFormError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Anti-spam honeypot check
    if (honeypot.trim() !== '') {
      return;
    }

    if (!validateAllFields()) {
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const formattedProducts: Partial<CustomerRequestedProductItem>[] = await Promise.all(
        products.map(async (p) => {
          const rawName = p.productName.trim();
          const rawUrl = p.productUrl.trim();
          const effectiveUrl = rawUrl || (/^https?:\/\//i.test(rawName) ? rawName : '');
          let resolvedName = rawName;
          let resolvedPlatform = p.platform;
          let resolvedImage = p.productImage.trim() || undefined;
          let resolvedPrice =
            p.expectedBudgetINR.trim() && Number(p.expectedBudgetINR) > 0
              ? Math.round(Number(p.expectedBudgetINR))
              : undefined;

          if (effectiveUrl) {
            const detected = detectPlatformFromUrl(effectiveUrl);
            if (detected) resolvedPlatform = detected;
            const parsed = parseProductFromUrl(effectiveUrl);
            if (/^https?:\/\//i.test(resolvedName) && parsed.title) {
              resolvedName = parsed.title;
            }
            if (!resolvedPrice || /^https?:\/\//i.test(resolvedName)) {
              try {
                const metaRes = await fetch(
                  `/api/fetch-product-meta?url=${encodeURIComponent(effectiveUrl)}`
                );
                if (metaRes.ok) {
                  const meta = await metaRes.json();
                  if (!resolvedPrice && meta.price && Number(meta.price) > 0) {
                    resolvedPrice = Math.round(Number(meta.price));
                  }
                  if (/^https?:\/\//i.test(resolvedName) && meta.title) {
                    resolvedName = meta.title;
                  }
                  if (!resolvedImage && meta.imageUrl) {
                    resolvedImage = meta.imageUrl;
                  }
                }
              } catch {
                // fallback silently
              }
            }
          }

          return {
            id: p.id,
            productName: resolvedName,
            platform: resolvedPlatform,
            productUrl: effectiveUrl || undefined,
            productImage: resolvedImage,
            quantity: Math.max(1, Math.round(Number(p.quantity) || 1)),
            expectedBudgetINR: resolvedPrice,
            description: p.description.trim() || undefined,
            additionalRequirements: p.additionalRequirements.trim() || undefined,
          };
        })
      );

      const response = await submitCustomerExternalPurchaseRequest({
        customerName: fullName.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim() || 'India',
        postalCode: postalCode.trim(),
        customerId: userProfile?.customerId,
        products: formattedProducts,
      });

      if (response.success && response.record) {
        setSubmittedResult({
          record: response.record,
          emailSent: response.emailSent,
          emailError: response.emailError,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setFormError(
          response.error ||
            'Failed to submit your purchase request. Please check your details and try again.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForNewRequest = () => {
    setSubmittedResult(null);
    setProducts([
      {
        id: `item-1-${Date.now()}`,
        productName: '',
        platform: 'Amazon',
        productUrl: '',
        productImage: '',
        quantity: 1,
        expectedBudgetINR: '',
        description: '',
        additionalRequirements: '',
      },
    ]);
  };

  const handleCopyRef = (refId: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(refId);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2500);
    }
  };

  const handleQuotationDecision = async (decision: 'approve' | 'reject') => {
    if (!tokenRecord || !activeToken) return;
    setTokenLoading(true);
    try {
      const res = await submitCustomerQuotationDecision({
        requestId: tokenRecord.requestId,
        token: activeToken,
        decision,
        customerNote: tokenNote,
      });
      if (res.success && res.record) {
        setTokenRecord(res.record);
        setTokenDecisionMessage({
          success: true,
          text:
            decision === 'approve'
              ? `Quotation ${res.record.quotation.quotationReference} Approved! Your request status is now "Customer Approved" and our procurement desk has been notified.`
              : `Quotation ${res.record.quotation.quotationReference} Rejected. Our procurement team has been notified.`,
        });
      } else {
        setTokenDecisionMessage({
          success: false,
          text: res.error || 'Could not record decision.',
        });
      }
    } finally {
      setTokenLoading(false);
    }
  };

  return (
    <div className={isInDashboard ? 'bg-[#F8FAFC] pb-10 rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs' : 'min-h-screen bg-[#F8FAFC] pb-16'}>
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#EFF6FF] via-[#F8FAFC] to-white text-slate-900 py-7 sm:py-9 px-5 sm:px-8 border-b border-blue-100">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => onNavigate(isInDashboard ? 'dashboard' : 'home')}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0066FF] hover:text-[#0052CC] transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              {isInDashboard ? 'Back to Dashboard Overview' : 'Back to PHARMAYUSH / India2World Home'}
            </button>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#0066FF] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              PHARMAYUSH • ASSISTED EXTERNAL PROCUREMENT
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Request a Product from Another Platform
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
            Want to buy products from Amazon, Flipkart, Myntra, Nykaa, AJIO, or
            any other external shopping platform? Submit your product
            requirements below. Our team will verify availability, send an
            official quotation to your email, purchase the items for you, and
            deliver them directly to your address.
          </p>

          {/* 3-Step Pill Highlights */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white border border-blue-100 shadow-xs rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0066FF] text-white font-black flex items-center justify-center shrink-0 shadow-xs">
                1
              </div>
              <div>
                <div className="font-bold text-slate-900">Submit Requirements</div>
                <div className="text-slate-500 text-[11px]">
                  Add 1 or more products from any store
                </div>
              </div>
            </div>
            <div className="bg-white border border-blue-100 shadow-xs rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0066FF] text-white font-black flex items-center justify-center shrink-0 shadow-xs">
                2
              </div>
              <div>
                <div className="font-bold text-slate-900">Approve Quotation</div>
                <div className="text-slate-500 text-[11px]">
                  Receive verified pricing via email
                </div>
              </div>
            </div>
            <div className="bg-white border border-blue-100 shadow-xs rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#0066FF] text-white font-black flex items-center justify-center shrink-0 shadow-xs">
                3
              </div>
              <div>
                <div className="font-bold text-slate-900">We Purchase &amp; Ship</div>
                <div className="text-slate-500 text-[11px]">
                  Full order &amp; tracking updates by email
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Secure Quotation Approval / Rejection Section (When Customer Opens Email Link) */}
        {(tokenRecord || tokenDecisionMessage) && (
          <div className="bg-white rounded-3xl border-2 border-[#0066FF] shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#0066FF] to-[#1D4ED8] px-6 py-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
                  OFFICIAL QUOTATION REVIEW
                </span>
                <h2 className="text-lg font-black">
                  {tokenRecord
                    ? `Quotation ${tokenRecord.quotation.quotationReference} for Request ${tokenRecord.requestId}`
                    : 'Quotation Status'}
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {tokenDecisionMessage && (
                <div
                  className={`p-4 rounded-2xl border flex items-start gap-3 ${
                    tokenDecisionMessage.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {tokenDecisionMessage.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs sm:text-sm font-semibold">
                    {tokenDecisionMessage.text}
                  </div>
                </div>
              )}

              {tokenRecord && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500">Customer:</span>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {tokenRecord.customerName} ({tokenRecord.customerEmail})
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Request Status:</span>
                      <div className="font-bold text-blue-600 mt-0.5">
                        {tokenRecord.status}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500">Final Grand Total:</span>
                      <div className="text-base font-black text-slate-900 mt-0.5">
                        ₹
                        {tokenRecord.quotation.grandTotalINR.toLocaleString(
                          'en-IN'
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-x-auto">
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
                        {tokenRecord.processedProducts.map((item) => (
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
                                  Verified Shopping Link &rarr;
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

                  {tokenRecord.status !== 'Customer Approved' && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={tokenNote}
                        onChange={(e) => setTokenNote(e.target.value)}
                        placeholder="Optional comment for our procurement desk..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          disabled={tokenLoading}
                          onClick={() => handleQuotationDecision('approve')}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve Quotation (₹
                          {tokenRecord.quotation.grandTotalINR.toLocaleString(
                            'en-IN'
                          )}
                          )
                        </button>
                        <button
                          type="button"
                          disabled={tokenLoading}
                          onClick={() => handleQuotationDecision('reject')}
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

        {/* SUCCESS CONFIRMATION SCREEN AFTER SUBMISSION */}
        {submittedResult ? (
          <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-700 to-teal-700 px-6 sm:px-8 py-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-emerald-200" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                    EXTERNAL PURCHASE REQUEST RECEIVED
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black mt-0.5">
                    Thank You, {submittedResult.record.customerName}!
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
                    Your product request has been saved and forwarded to the
                    PHARMAYUSH procurement team.
                  </p>
                </div>
              </div>

              <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-right shrink-0">
                <div className="text-[10px] uppercase font-bold text-emerald-200">
                  Request Reference Number
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg sm:text-xl font-black tracking-tight text-white">
                    {submittedResult.record.requestId}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyRef(submittedResult.record.requestId)
                    }
                    className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white cursor-pointer"
                    title="Copy Reference ID"
                  >
                    {copiedRef ? (
                      <Check className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Email Confirmation Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  submittedResult.emailSent
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  {submittedResult.emailSent ? (
                    <>
                      A <strong>Request-Received Confirmation Email</strong>{' '}
                      with Reference ID{' '}
                      <strong>{submittedResult.record.requestId}</strong> has
                      been sent to{' '}
                      <strong>{submittedResult.record.customerEmail}</strong>.
                    </>
                  ) : (
                    <>
                      Your request{' '}
                      <strong>{submittedResult.record.requestId}</strong> is
                      saved in our database. Our admin team will contact you at{' '}
                      <strong>{submittedResult.record.customerEmail}</strong>.
                    </>
                  )}
                </div>
              </div>

              {/* Submitted Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-extrabold uppercase text-slate-400 text-[11px]">
                    Customer &amp; Contact Details
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {submittedResult.record.customerName}
                  </div>
                  <div className="text-slate-600">
                    Email: {submittedResult.record.customerEmail}
                  </div>
                  <div className="text-slate-600">
                    Phone: {submittedResult.record.customerPhone}
                  </div>
                  <div className="pt-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px]">
                      Status: New Request
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-extrabold uppercase text-slate-400 text-[11px]">
                    Delivery Address
                  </div>
                  <div className="text-slate-800 font-medium leading-relaxed">
                    {submittedResult.record.deliveryAddress}
                    <br />
                    {[
                      submittedResult.record.city,
                      submittedResult.record.state,
                      submittedResult.record.country,
                    ]
                      .filter(Boolean)
                      .join(', ')}{' '}
                    {submittedResult.record.postalCode
                      ? `— ${submittedResult.record.postalCode}`
                      : ''}
                  </div>
                </div>
              </div>

              {/* Requested Products Table */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-3">
                  Submitted Products (
                  {submittedResult.record.requestedProducts.length})
                </h3>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold">
                        <th className="p-3">#</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Shopping Platform</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Expected Budget</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {submittedResult.record.requestedProducts.map(
                        (item, index) => (
                          <tr key={item.id || index}>
                            <td className="p-3 font-bold text-slate-500">
                              {index + 1}
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">
                                {item.productName}
                              </div>
                              {item.description && (
                                <div className="text-[11px] text-slate-500">
                                  Specs: {item.description}
                                </div>
                              )}
                              {item.productUrl && (
                                <a
                                  href={item.productUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-blue-600 font-semibold hover:underline inline-flex items-center gap-1 mt-0.5"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Product Link
                                </a>
                              )}
                            </td>
                            <td className="p-3 font-semibold text-slate-700">
                              {item.platform}
                            </td>
                            <td className="p-3 text-center font-bold">
                              {item.quantity}
                            </td>
                            <td className="p-3 text-right font-semibold">
                              {item.expectedBudgetINR
                                ? `₹${item.expectedBudgetINR.toLocaleString(
                                    'en-IN'
                                  )}`
                                : '—'}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => onNavigate(isInDashboard ? 'dashboard' : 'home')}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  {isInDashboard ? 'Back to Dashboard' : 'Return to Website Home'}
                </button>
                <button
                  type="button"
                  onClick={handleResetForNewRequest}
                  className="px-6 py-2.5 rounded-xl bg-[#0066FF] hover:bg-blue-700 text-white text-xs font-black inline-flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Submit Another External Purchase Request
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* PUBLIC CUSTOMER SUBMISSION FORM */
          <form
            onSubmit={handleSubmit}
            noValidate
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden"
          >
            {/* Form Header */}
            <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-[#F8FAFC] to-[#EFF6FF]/70 border-b border-slate-200/90 text-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0066FF] shadow-xs flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                    External Platform Purchase Request Form
                  </h2>
                  <p className="text-xs text-slate-500">
                    Fields marked with <span className="text-rose-600 font-bold">*</span>{' '}
                    are required.
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 self-start sm:self-center">
                {isInDashboard ? 'Customer Account Verified' : 'Customer Portal'}
              </span>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              {/* Top-level Validation Banner */}
              {formError && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm font-semibold flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Hidden Anti-Spam Honeypot */}
              <div className="hidden" aria-hidden="true">
                <label>
                  Leave this field empty
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </label>
              </div>

              {/* SECTION 1: CUSTOMER DETAILS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <User className="w-4 h-4 text-[#0066FF]" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                    1. Customer &amp; Delivery Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        setFieldErrors((p) => ({ ...p, fullName: '' }));
                      }}
                      placeholder="Enter your full name"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                        fieldErrors.fullName
                          ? 'border-rose-400 bg-rose-50/40 focus:ring-rose-200'
                          : 'border-slate-300 bg-white focus:border-[#0066FF] focus:ring-blue-100'
                      }`}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-[11px] font-semibold text-rose-600 mt-1">
                        {fieldErrors.fullName}
                      </p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setFieldErrors((p) => ({ ...p, email: '' }));
                      }}
                      placeholder="you@example.com"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                        fieldErrors.email
                          ? 'border-rose-400 bg-rose-50/40 focus:ring-rose-200'
                          : 'border-slate-300 bg-white focus:border-[#0066FF] focus:ring-blue-100'
                      }`}
                    />
                    {fieldErrors.email && (
                      <p className="text-[11px] font-semibold text-rose-600 mt-1">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setFieldErrors((p) => ({ ...p, phone: '' }));
                      }}
                      placeholder="+971 50 123 4567 or +91 98765 43210"
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                        fieldErrors.phone
                          ? 'border-rose-400 bg-rose-50/40 focus:ring-rose-200'
                          : 'border-slate-300 bg-white focus:border-[#0066FF] focus:ring-blue-100'
                      }`}
                    />
                    {fieldErrors.phone && (
                      <p className="text-[11px] font-semibold text-rose-600 mt-1">
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Delivery Address <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => {
                      setDeliveryAddress(e.target.value);
                      setFieldErrors((p) => ({ ...p, deliveryAddress: '' }));
                    }}
                    placeholder="House / Flat / Building, Street Name, Area / Landmark"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                      fieldErrors.deliveryAddress
                        ? 'border-rose-400 bg-rose-50/40 focus:ring-rose-200'
                        : 'border-slate-300 bg-white focus:border-[#0066FF] focus:ring-blue-100'
                    }`}
                  />
                  {fieldErrors.deliveryAddress && (
                    <p className="text-[11px] font-semibold text-rose-600 mt-1">
                      {fieldErrors.deliveryAddress}
                    </p>
                  )}
                </div>

                {/* City, State, Country, Postal Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Dubai / Mumbai / London"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      State / Province
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="State / Emirate / Province"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Country"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="ZIP / PIN / Postal Code"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0066FF]"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: PRODUCT DETAILS */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#0066FF]" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                      2. Requested Product Details ({products.length})
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddAnotherProduct}
                    className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200 text-xs font-black inline-flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Another Product
                  </button>
                </div>

                <div className="space-y-5">
                  {products.map((prod, idx) => (
                    <div
                      key={prod.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-[#0066FF] text-white text-xs font-extrabold">
                          Product #{idx + 1}
                        </span>
                        {products.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(idx)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove Product
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Product Name */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Product Name <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={prod.productName}
                            onChange={(e) =>
                              updateProduct(idx, 'productName', e.target.value)
                            }
                            placeholder="e.g. Apple Watch Ultra 2 / Forest Essentials Facial Kit"
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-white focus:outline-none ${
                              fieldErrors[`product_${idx}_productName`]
                                ? 'border-rose-400 bg-rose-50/40'
                                : 'border-slate-300 focus:border-[#0066FF]'
                            }`}
                          />
                          {fieldErrors[`product_${idx}_productName`] && (
                            <p className="text-[11px] font-semibold text-rose-600 mt-1">
                              {fieldErrors[`product_${idx}_productName`]}
                            </p>
                          )}
                        </div>

                        {/* Shopping Platform */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Shopping Platform{' '}
                            <span className="text-rose-600">*</span>
                          </label>
                          <select
                            value={prod.platform}
                            onChange={(e) =>
                              updateProduct(idx, 'platform', e.target.value)
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0066FF]"
                          >
                            {SHOPPING_PLATFORMS.map((pf) => (
                              <option key={pf} value={pf}>
                                {pf}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Required Quantity */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Required Quantity{' '}
                            <span className="text-rose-600">*</span>
                          </label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={prod.quantity}
                            onChange={(e) =>
                              updateProduct(idx, 'quantity', e.target.value)
                            }
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-bold bg-white focus:outline-none ${
                              fieldErrors[`product_${idx}_quantity`]
                                ? 'border-rose-400 bg-rose-50/40'
                                : 'border-slate-300 focus:border-[#0066FF]'
                            }`}
                          />
                          {fieldErrors[`product_${idx}_quantity`] && (
                            <p className="text-[11px] font-semibold text-rose-600 mt-1">
                              {fieldErrors[`product_${idx}_quantity`]}
                            </p>
                          )}
                        </div>

                        {/* External Product Shopping URL */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            External Product Shopping URL
                          </label>
                          <input
                            type="url"
                            value={prod.productUrl}
                            onChange={(e) =>
                              updateProduct(idx, 'productUrl', e.target.value)
                            }
                            placeholder="https://www.amazon.in/dp/... or https://www.flipkart.com/..."
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-white focus:outline-none ${
                              fieldErrors[`product_${idx}_productUrl`]
                                ? 'border-rose-400 bg-rose-50/40'
                                : 'border-slate-300 focus:border-[#0066FF]'
                            }`}
                          />
                          {fieldErrors[`product_${idx}_productUrl`] && (
                            <p className="text-[11px] font-semibold text-rose-600 mt-1">
                              {fieldErrors[`product_${idx}_productUrl`]}
                            </p>
                          )}
                        </div>

                        {/* Product Image URL (Optional) */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Product Image URL (Optional)
                          </label>
                          <input
                            type="url"
                            value={prod.productImage}
                            onChange={(e) =>
                              updateProduct(idx, 'productImage', e.target.value)
                            }
                            placeholder="https://..."
                            className={`w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm bg-white focus:outline-none ${
                              fieldErrors[`product_${idx}_productImage`]
                                ? 'border-rose-400 bg-rose-50/40'
                                : 'border-slate-300 focus:border-[#0066FF]'
                            }`}
                          />
                          {fieldErrors[`product_${idx}_productImage`] && (
                            <p className="text-[11px] font-semibold text-rose-600 mt-1">
                              {fieldErrors[`product_${idx}_productImage`]}
                            </p>
                          )}
                        </div>

                        {/* Expected Budget (Optional) */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Expected Budget in ₹ INR (Optional)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={prod.expectedBudgetINR}
                            onChange={(e) =>
                              updateProduct(
                                idx,
                                'expectedBudgetINR',
                                e.target.value
                              )
                            }
                            placeholder="e.g. 2999"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0066FF]"
                          />
                        </div>

                        {/* Product Specifications or Description */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Product Specifications or Description
                          </label>
                          <textarea
                            rows={2}
                            value={prod.description}
                            onChange={(e) =>
                              updateProduct(idx, 'description', e.target.value)
                            }
                            placeholder="Size, color, model number, storage capacity, shade, or variant details..."
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0066FF]"
                          />
                        </div>

                        {/* Additional Requirements */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Additional Requirements
                          </label>
                          <textarea
                            rows={2}
                            value={prod.additionalRequirements}
                            onChange={(e) =>
                              updateProduct(
                                idx,
                                'additionalRequirements',
                                e.target.value
                              )
                            }
                            placeholder="Special packaging, gift note, preferred seller, urgent delivery..."
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm focus:outline-none focus:border-[#0066FF]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={handleAddAnotherProduct}
                    className="w-full py-3 rounded-2xl border-2 border-dashed border-blue-300 hover:border-[#0066FF] hover:bg-blue-50/50 text-[#0066FF] text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />+ Add Another Product
                  </button>
                </div>
              </div>

              {/* Submit Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Your request is encrypted and sent directly to the
                    PHARMAYUSH procurement desk.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-sm font-black inline-flex items-center justify-center gap-2.5 shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {submitting
                    ? 'Submitting Purchase Request...'
                    : 'Submit Purchase Request'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
