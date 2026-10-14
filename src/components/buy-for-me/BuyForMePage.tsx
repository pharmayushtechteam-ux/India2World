import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart,
  Link2,
  Trash2,
  Plus,
  Home,
  ChevronRight,
  Check,
  AlertCircle,
  Package,
  Clock,
  CreditCard,
  Sparkles,
  Info,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Image as ImageIcon,
  Edit2,
  X,
  Upload,
  UploadCloud,
  CheckCircle2,
  Loader2,
  Download,
  Printer,
  Mail,
  Lock,
  LogIn,
} from 'lucide-react';
import { StoreBadge } from '../common/StoreBadge';
import { ProductItem, Page, BuyForMeStep } from '../../types';
import { getCurrentUser, isUserAuthenticated, loginWithEmailAndPassword, fetchWithAuth, logoutUser, UserProfile } from '../../utils/userAuth';
import {
  CustomerOrderInvoice,
  createOrderAndAutomateInvoice,
  downloadInvoiceDocument,
  printInvoiceDocument,
} from '../../services/orderInvoiceService';
import {
  parseProductFromUrl,
  validateProductUrl,
  isDirectImageUrl,
} from '../../utils/urlProductParser';
import {
  createPurchaseRequest,
  createOrderRecord,
} from '../../services/integratedDataService';
import { triggerOrderConfirmationEmail } from '../../services/orderConfirmationService';


interface BuyForMePageProps {
  onNavigate: (page: Page) => void;
  initialUrl?: string;
  isInDashboard?: boolean;
}

const countriesList = [
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
];

const getCustomerDraftKey = (cid: string) => `i2w_draft_products_${cid || 'anonymous'}`;

export const BuyForMePage: React.FC<BuyForMePageProps> = ({ onNavigate, initialUrl = '', isInDashboard = false }) => {
  const [currentStep, setCurrentStep] = useState<BuyForMeStep>(1);

  // Authenticated customer state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isUserAuthenticated());
  const [customerPreviousRequests, setCustomerPreviousRequests] = useState<any[]>([]);
  const [customerPreviousOrders, setCustomerPreviousOrders] = useState<any[]>([]);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState<boolean>(false);

  // Customer-isolated Draft Products
  const [products, setProducts] = useState<ProductItem[]>(() => {
    try {
      const user = getCurrentUser();
      const saved = localStorage.getItem(getCustomerDraftKey(user.customerId));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading stored customer draft', e);
    }
    return [];
  });

  // Track broken images so we never display a broken browser icon or random placeholder
  const [brokenImageIds, setBrokenImageIds] = useState<Record<string, boolean>>({});

  // Track in-flight product photo retrieval so we show a live sync loader
  const [fetchingProductIds, setFetchingProductIds] = useState<Record<string, boolean>>({});

  // Load customer-specific Buy For Me workspace from server
  const loadCustomerWorkspace = async () => {
    try {
      setIsLoadingWorkspace(true);
      const res = await fetchWithAuth('/api/customer/buy-for-me');
      if (res.status === 401) {
        onNavigate('auth');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.customer) {
            setCurrentUser((prev) => ({
              ...prev,
              ...data.customer,
            }));
            setIsAuthenticated(true);
          }
          if (Array.isArray(data.draftProducts) && data.draftProducts.length > 0) {
            setProducts((prev) => {
              return data.draftProducts.map((sp: ProductItem) => {
                const existing = prev.find((p) => p.id === sp.id || (p.url && p.url === sp.url));
                if (existing && existing.imageUrl && !sp.imageUrl) {
                  return { ...sp, imageUrl: existing.imageUrl };
                }
                return sp;
              });
            });
          }
          if (Array.isArray(data.previousRequests)) {
            setCustomerPreviousRequests(data.previousRequests);
          }
          if (Array.isArray(data.orders)) {
            setCustomerPreviousOrders(data.orders);
          }
        }
      }
    } catch (err) {
      console.warn('Network error loading customer workspace:', err);
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  useEffect(() => {
    loadCustomerWorkspace();
  }, [currentUser.customerId]);

  // Sync products to customer draft storage whenever products change
  useEffect(() => {
    if (!currentUser.customerId) return;
    try {
      localStorage.setItem(getCustomerDraftKey(currentUser.customerId), JSON.stringify(products));
    } catch (e) {
      console.warn('Error persisting customer draft products', e);
    }
  }, [products, currentUser.customerId]);

  // Start new request: clears current draft on server and local state
  const handleStartNewRequest = async () => {
    try {
      await fetchWithAuth('/api/customer/buy-for-me/new-request', { method: 'POST' });
    } catch {}
    if (currentUser.customerId) {
      localStorage.removeItem(getCustomerDraftKey(currentUser.customerId));
    }
    setProducts([]);
    setUrlInput('');
    setCurrentStep(1);
    setPaymentSuccess(false);
    setGeneratedInvoice(null);
    showToast('Started a new purchase request! Paste an Indian product link to begin.');
  };

  const [urlInput, setUrlInput] = useState(initialUrl);
  const [inputError, setInputError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductStore, setNewProductStore] = useState('Amazon India');
  const [newProductPrice, setNewProductPrice] = useState('1499');
  const [newProductQty, setNewProductQty] = useState(1);
  const [newProductSize, setNewProductSize] = useState('M');
  const [newProductColour, setNewProductColour] = useState('Black');
  const [newProductUrl, setNewProductUrl] = useState('');
  const [manualImageUrl, setManualImageUrl] = useState('');
  const manualFileInputRef = useRef<HTMLInputElement | null>(null);

  // Image & Product details edit modal state
  const [selectedProductIdForImage, setSelectedProductIdForImage] = useState<string | null>(null);
  const [customImageUrlInput, setCustomImageUrlInput] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalPrice, setModalPrice] = useState('');
  const [modalStore, setModalStore] = useState('');
  const [modalSize, setModalSize] = useState('');
  const [modalColour, setModalColour] = useState('');
  const [modalTab, setModalTab] = useState<'upload' | 'link' | 'edit'>('upload');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Inline title editing
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState('');

  // Step 2 & 5 states
  const [destinationCountry, setDestinationCountry] = useState('United Arab Emirates');
  const [removePackaging, setRemovePackaging] = useState(true);
  const [photoInspection, setPhotoInspection] = useState(true);
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showAuthGateModal, setShowAuthGateModal] = useState<boolean>(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<CustomerOrderInvoice | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('Credit / Debit Card (Stripe)');
  const [submittedRequestId, setSubmittedRequestId] = useState<string>('REQ-30438');

  useEffect(() => {
    const handleUserChange = () => {
      const u = getCurrentUser();
      setCurrentUser(u);
      setIsAuthenticated(isUserAuthenticated());
      loadCustomerWorkspace();
    };
    window.addEventListener('i2w-user-changed', handleUserChange);
    return () => window.removeEventListener('i2w-user-changed', handleUserChange);
  }, []);

  const handleProceedToPayment = () => {
    // Only registered & authenticated customers can proceed with shopping & checkout
    if (!isAuthenticated) {
      setShowAuthGateModal(true);
      return;
    }
    setCurrentStep(5);
  };

  const handleQuickLogin = (email: string) => {
    loginWithEmailAndPassword(email, 'Secret123!');
    const user = getCurrentUser();
    setCurrentUser(user);
    setIsAuthenticated(true);
    setShowAuthGateModal(false);
    setCurrentStep(5);
    showToast(`Signed in as ${user.name} (${user.email}). Ready to checkout!`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open the Image / Edit modal with the item's current details prefilled
  const openImageModal = (item: ProductItem, initialTab: 'upload' | 'link' | 'edit' = 'upload') => {
    setSelectedProductIdForImage(item.id);
    setCustomImageUrlInput(item.imageUrl || '');
    setModalTitle(item.name);
    setModalPrice(String(item.priceINR || ''));
    setModalStore(item.storeName);
    setModalSize(item.size || 'Standard');
    setModalColour(item.colour || 'Default');
    setModalTab(initialTab);
  };

  // Handle local image file upload (converts to persistent Base64 Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedProductIdForImage) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image file too large. Please select an image under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        let updatedItem: ProductItem | null = null;
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === selectedProductIdForImage) {
              updatedItem = { ...p, imageUrl: dataUrl };
              return updatedItem;
            }
            return p;
          })
        );
        if (updatedItem) syncAddProduct(updatedItem);
        setBrokenImageIds((prev) => {
          const updated = { ...prev };
          delete updated[selectedProductIdForImage];
          return updated;
        });
        showToast('Exact product photo uploaded and saved!');
        setSelectedProductIdForImage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle manual modal file upload
  const handleManualFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setManualImageUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Save all modal edits (Title, Price, Store, Size, Colour, Image)
  const handleSaveModalDetails = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProductIdForImage) return;
    const numPrice = parseFloat(modalPrice.replace(/[^0-9.]/g, '')) || 0;

    let updatedItem: ProductItem | null = null;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === selectedProductIdForImage) {
          updatedItem = {
            ...p,
            name: modalTitle.trim() || p.name,
            priceINR: numPrice > 0 ? numPrice : p.priceINR,
            storeName: modalStore.trim() || p.storeName,
            size: modalSize.trim() || p.size,
            colour: modalColour.trim() || p.colour,
            imageUrl: customImageUrlInput.trim() || p.imageUrl,
          };
          return updatedItem;
        }
        return p;
      })
    );
    if (updatedItem) syncAddProduct(updatedItem);
    setBrokenImageIds((prev) => {
      const updated = { ...prev };
      delete updated[selectedProductIdForImage];
      return updated;
    });
    showToast('Product details updated successfully!');
    setSelectedProductIdForImage(null);
  };

  // Fetch live product metadata (exact image, title, and price from actual store page)
  const fetchLiveMetadata = async (productId: string, targetUrl: string) => {
    setFetchingProductIds((prev) => ({ ...prev, [productId]: true }));
    try {
      const res = await fetch(`/api/fetch-product-meta?url=${encodeURIComponent(targetUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          const isGeneric = (str?: string | null) => {
            if (!str) return true;
            const lower = str.toLowerCase();
            return (
              lower.includes('online fashion') ||
              lower.includes('online shopping') ||
              lower.includes('lifestyle shopping') ||
              lower.includes('buy products online') ||
              lower.includes('tatacliq') ||
              lower.includes('tata cliq') ||
              lower.includes('flipkart') ||
              lower.includes('amazon.in') ||
              lower.includes('robot check') ||
              lower.length < 5
            );
          };

          const isCleanImage = (img?: string | null) => {
            if (!img) return false;
            const lower = img.toLowerCase();
            return (
              (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('//')) &&
              !lower.includes('icon') &&
              !lower.includes('logo') &&
              !lower.includes('banner') &&
              !lower.includes('avatar')
            );
          };

          let updatedItem: ProductItem | null = null;
          setProducts((prev) =>
            prev.map((p) => {
              if (p.id === productId) {
                const nextImg = isCleanImage(data.imageUrl) ? data.imageUrl : p.imageUrl;
                const nextName = !isGeneric(data.title) ? data.title : p.name;
                const nextPrice = data.price && Number(data.price) > 0 ? Number(data.price) : p.priceINR;
                updatedItem = {
                  ...p,
                  imageUrl: nextImg,
                  name: nextName,
                  priceINR: nextPrice,
                };
                return updatedItem;
              }
              return p;
            })
          );
          if (updatedItem) {
            syncAddProduct(updatedItem);
          }
          if (isCleanImage(data.imageUrl)) {
            setBrokenImageIds((prev) => {
              const updated = { ...prev };
              delete updated[productId];
              return updated;
            });
            showToast('✓ Exact product photo retrieved directly from store!');
          }
        }
      }
    } catch {
      // Live fetch failed due to platform restrictions; user can upload photo via button
    } finally {
      setFetchingProductIds((prev) => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
    }
  };

  // Auto-sync any previously added products that are missing a photo
  useEffect(() => {
    products.forEach((p) => {
      if (
        (!p.imageUrl || p.imageUrl.startsWith('/images/icons') || brokenImageIds[p.id]) &&
        p.url &&
        p.url.startsWith('http') &&
        !fetchingProductIds[p.id]
      ) {
        fetchLiveMetadata(p.id, p.url);
      }
    });
  }, [products.length]);

  // Auto-parse initialUrl if passed from home page search bar
  useEffect(() => {
    if (initialUrl && initialUrl.trim()) {
      setUrlInput(initialUrl);
      const validation = validateProductUrl(initialUrl);
      if (validation.isValid) {
        const cleanUrl = validation.cleanUrl || initialUrl.trim();
        const parsed = parseProductFromUrl(cleanUrl);
        const newId = `prod-${Date.now()}`;
        setProducts((prev) => {
          if (!prev.some((p) => p.url === cleanUrl)) {
            const newProduct: ProductItem = {
              id: newId,
              name: parsed.name,
              store: parsed.store,
              storeName: parsed.storeName,
              url: cleanUrl,
              imageUrl: parsed.imageUrl || '',
              quantity: 1,
              size: parsed.size || 'Standard',
              colour: parsed.colour || 'Default',
              priceINR: parsed.priceINR || 1499,
            };
            return [newProduct, ...prev];
          }
          return prev;
        });
        fetchLiveMetadata(newId, cleanUrl);
      }
    }
  }, [initialUrl]);

  // Calculate Subtotal INR
  const subtotalINR = products.reduce((acc, p) => acc + (p.priceINR || 0) * (p.quantity || 1), 0);
  const serviceFeeINR = Math.round(subtotalINR * 0.06); // 6% assisted shopping fee or min ₹250
  const estimatedDomesticShippingINR = 0; // Free domestic shipping on orders
  const totalINR = subtotalINR + Math.max(250, serviceFeeINR) + estimatedDomesticShippingINR;

  // Handle URL Validation & Add Product
  const handleAddFromUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = urlInput.trim();
    if (!raw) {
      setInputError('Please paste a product URL from Amazon, Flipkart, BigBasket, Myntra, Nykaa, etc.');
      return;
    }

    // 1. Validate the URL before processing
    const validation = validateProductUrl(raw);
    if (!validation.isValid) {
      setInputError(validation.error || 'Please enter a valid product URL.');
      return;
    }

    setInputError('');
    const targetUrl = validation.cleanUrl || raw;
    const newId = `prod-${Date.now()}`;

    // 2. Direct image address pasted (e.g. from right-click -> Copy Image Address)
    if (validation.isDirectImage) {
      let title = 'Custom Direct Photo Item';
      try {
        const urlObj = new URL(targetUrl);
        const filename = urlObj.pathname.split('/').pop() || '';
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, '').replace(/^[0-9_]+-?/, '');
        if (nameWithoutExt && nameWithoutExt.length > 3) {
          title = nameWithoutExt
            .split(/[-_]+/)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
        }
      } catch {}

      const newProduct: ProductItem = {
        id: newId,
        name: title,
        store: validation.store || 'other',
        storeName: validation.storeName || 'Direct Image Link',
        url: targetUrl,
        imageUrl: targetUrl,
        quantity: 1,
        size: 'Standard',
        colour: 'Default',
        priceINR: 999,
      };
      setProducts((prev) => [newProduct, ...prev.filter((p) => p.id !== newProduct.id)]);
      syncAddProduct(newProduct);
      setUrlInput('');
      showToast(`Added product with exact photo: "${title}"!`);
      return;
    }

    // 3. Parse product details accurately from URL
    const parsed = parseProductFromUrl(targetUrl);

    // If product with this URL already exists, re-sync its exact photo directly
    const existingIndex = products.findIndex((p) => p.url === targetUrl);
    if (existingIndex >= 0) {
      const existing = products[existingIndex];
      setBrokenImageIds((prev) => {
        const updated = { ...prev };
        delete updated[existing.id];
        return updated;
      });
      setUrlInput('');
      setFetchingProductIds((prev) => ({ ...prev, [existing.id]: true }));
      showToast(`Retrieving exact photo for "${existing.name}"...`);
      fetchLiveMetadata(existing.id, targetUrl);
      return;
    }

    // Initial image starts with parsed image if available
    const newProduct: ProductItem = {
      id: newId,
      name: parsed.name,
      store: parsed.store,
      storeName: parsed.storeName,
      url: targetUrl,
      imageUrl: parsed.imageUrl || '',
      quantity: 1,
      size: parsed.size || 'Standard',
      colour: parsed.colour || 'Default',
      priceINR: parsed.priceINR || 1499,
    };

    setProducts((prev) => [newProduct, ...prev.filter((p) => p.id !== newProduct.id)]);
    syncAddProduct(newProduct);
    setUrlInput('');
    setFetchingProductIds((prev) => ({ ...prev, [newId]: true }));
    showToast(`Added "${parsed.name}"! Retrieving exact photo from ${parsed.storeName}...`);

    // 4. Fetch live metadata and exact image from the store page
    fetchLiveMetadata(newId, targetUrl);
  };

  // Add Manually Modal Submit
  const handleAddManualProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    let store: ProductItem['store'] = 'other';
    const lowerStore = newProductStore.toLowerCase();
    if (lowerStore.includes('amazon')) store = 'amazon';
    else if (lowerStore.includes('flipkart')) store = 'flipkart';
    else if (lowerStore.includes('myntra')) store = 'myntra';
    else if (lowerStore.includes('nykaa')) store = 'nykaa';
    else if (lowerStore.includes('ajio')) store = 'ajio';
    else if (lowerStore.includes('tatacliq')) store = 'tatacliq';

    const newProduct: ProductItem = {
      id: `prod-${Date.now()}`,
      name: newProductName.trim(),
      store,
      storeName: newProductStore,
      url: newProductUrl.trim() || 'Manual Product Entry',
      imageUrl: manualImageUrl.trim() || '',
      quantity: newProductQty,
      size: newProductSize,
      colour: newProductColour,
      priceINR: parseFloat(newProductPrice) || 999,
    };

    setProducts((prev) => [newProduct, ...prev.filter((p) => p.id !== newProduct.id)]);
    syncAddProduct(newProduct);
    setShowAddModal(false);
    setNewProductName('');
    setNewProductUrl('');
    setManualImageUrl('');
    showToast(`Added "${newProduct.name}" to request!`);
  };

  // Field update helpers
  const updateQuantity = (id: string, qty: number) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(1, qty) } : p)));
  };

  const updateSize = (id: string, size: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, size } : p)));
  };

  const updateColour = (id: string, colour: string) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, colour } : p)));
  };

  const updatePrice = (id: string, rawVal: string) => {
    const cleanNum = parseFloat(rawVal.replace(/[^0-9.]/g, '')) || 0;
    setProducts(products.map((p) => (p.id === id ? { ...p, priceINR: cleanNum } : p)));
  };

  const syncAddProduct = async (prod: ProductItem) => {
    try {
      await fetchWithAuth('/api/customer/buy-for-me/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prod),
      });
    } catch {}
  };

  const removeProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetchWithAuth(`/api/customer/buy-for-me/products/${id}`, { method: 'DELETE' });
    } catch {}
    showToast('Product removed from draft.');
  };

  const stepsList = [
    { num: 1, label: 'Add Products' },
    { num: 2, label: 'Review & Submit' },
    { num: 3, label: 'Admin Review' },
    { num: 4, label: 'Get Quote' },
    { num: 5, label: 'Make Payment' },
  ];

  return (
    <div className={isInDashboard ? "w-full space-y-6" : "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 hover:text-[#0066FF] transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-500">Buy For Me</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-800 font-bold">New Request</span>
      </div>

      {/* Page Title & Cart Icon */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0066FF] shrink-0 shadow-2xs">
          <ShoppingCart className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Buy For Me
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1 max-w-2xl leading-relaxed">
            Add products from any Indian online store and we'll purchase, warehouse and ship them to your doorstep worldwide.
          </p>
        </div>
      </div>

      {/* Customer Account & Locker Identification Banner (Strict Customer Data Isolation) */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-white rounded-2xl p-4 sm:p-5 border border-blue-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20 bg-white"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" title="Verified Customer Session" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-slate-900 text-base">{currentUser.name}</span>
              <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded border border-blue-200/60">
                {currentUser.customerId}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200/60 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Data Isolated
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap font-medium">
              <span>{currentUser.email}</span>
              <span className="text-slate-300">•</span>
              <span className="font-semibold text-slate-700">Locker: <strong className="text-blue-700 font-mono">{currentUser.lockerId}</strong></span>
              <span className="text-slate-300">•</span>
              <span>{currentUser.country}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
          <button
            type="button"
            onClick={handleStartNewRequest}
            className="px-3.5 py-2 bg-[#0066FF] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Start a new purchase request with a fresh draft"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Request</span>
          </button>

          <button
            type="button"
            onClick={() => {
              logoutUser();
              onNavigate('auth');
            }}
            className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            title="Log out and switch customer account"
          >
            Switch Account
          </button>
        </div>
      </div>

      {/* 5-Step Stepper Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-100">
        <div className="flex items-center justify-between max-w-3xl mx-auto relative">
          {/* Stepper Background Track Line */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />

          {stepsList.map((step) => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => setCurrentStep(step.num as BuyForMeStep)}
                className="relative z-10 flex flex-col items-center group focus:outline-hidden"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold transition-all duration-300 ring-4 ring-white ${
                    isActive
                      ? 'bg-[#0066FF] text-white shadow-md scale-110'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                </div>
                <span
                  className={`text-xs mt-2 font-bold whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-[#0066FF]'
                      : isCompleted
                      ? 'text-emerald-700'
                      : 'text-slate-500 group-hover:text-slate-800'
                  }`}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: ADD PRODUCTS */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Add Products Input Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-xs border border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">Add Products</h3>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full w-fit">
                ✓ Auto Image & Meta Sync Active
              </span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm">
              Paste product page link <strong>OR</strong> copied image address from Amazon, Flipkart, BigBasket, Myntra, Nykaa, etc.
            </p>

            <form onSubmit={handleAddFromUrl} className="pt-1 space-y-2">
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <div className="relative flex-1">
                  <Link2 className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://www.bigbasket.com/pd/40186547/... or direct image address"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-hidden focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#0066FF] hover:bg-[#0052CC] text-white px-7 py-3 rounded-xl font-bold text-sm shadow-xs transition-colors shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Supported Links Hint Bar */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-1">
                <span className="font-bold text-slate-700">Supported Formats:</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                  Product Link (e.g. BigBasket, Flipkart, Amazon, Nykaa)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                  Direct Photo (Right click image → "Copy image address")
                </span>
              </div>

              {inputError && (
                <p className="text-xs text-red-500 mt-2 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {inputError}
                </p>
              )}
            </form>
          </div>

          {/* Product Items List */}
          <div className="space-y-4">
            {products.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 sm:p-10 text-center border-2 border-dashed border-slate-200 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto shadow-2xs">
                  <ShoppingCart className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-lg">Your Purchase Request Draft is Empty</h4>
                <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
                  Paste any Indian product URL above (Amazon, Flipkart, BigBasket, Myntra, Tata CLiQ, etc.) or click "Add Another Product" to add items to your personal purchase request.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="px-5 py-2.5 bg-[#0066FF] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product Manually</span>
                </button>
              </div>
            ) : (
              products.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-slate-200/80 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  {/* Thumbnail with visible Upload / Change Image button */}
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    {fetchingProductIds[item.id] ? (
                      <div
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-200 flex flex-col items-center justify-center p-2 text-center shadow-2xs"
                        title="Retrieving exact product image from store..."
                      >
                        <Loader2 className="w-6 h-6 text-[#0066FF] animate-spin mb-1.5" />
                        <span className="text-[10px] font-extrabold text-[#0066FF] leading-tight">Retrieving Photo...</span>
                        <span className="text-[8px] text-slate-500 font-medium">Fetching from store</span>
                      </div>
                    ) : item.imageUrl && !brokenImageIds[item.id] ? (
                      <div
                        onClick={() => openImageModal(item, 'upload')}
                        className="relative group/thumb cursor-pointer w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-2xs hover:border-[#0066FF] hover:shadow-md transition-all"
                        title="Click to change or upload exact photo"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="w-full h-full object-contain p-1.5 group-hover/thumb:scale-105 transition-transform"
                          onError={() => {
                            setBrokenImageIds((prev) => ({ ...prev, [item.id]: true }));
                          }}
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center text-white transition-opacity p-1 text-center">
                          <ImageIcon className="w-5 h-5 mb-0.5 text-blue-300" />
                          <span className="text-[10px] font-bold leading-tight">Change Photo</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => openImageModal(item, 'upload')}
                        className="relative group/thumb cursor-pointer w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-blue-50/70 border-2 border-dashed border-blue-300 hover:border-[#0066FF] hover:bg-blue-100/50 flex flex-col items-center justify-center p-2 text-center transition-all shadow-2xs"
                        title="Click to upload exact product photo or paste image link"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-[#0066FF] flex items-center justify-center mb-1 group-hover/thumb:scale-110 transition-transform">
                          <UploadCloud className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-extrabold text-[#0066FF] leading-tight">+ Upload Photo</span>
                        <span className="text-[8px] text-slate-400 font-medium">Exact image</span>
                      </div>
                    )}

                    {fetchingProductIds[item.id] ? (
                      <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Syncing...</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openImageModal(item, 'upload')}
                        className="text-[11px] font-bold text-[#0066FF] hover:text-[#0052CC] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                        title="Upload photo from device or paste image address"
                      >
                        {item.imageUrl && !brokenImageIds[item.id] ? (
                          <>
                            <ImageIcon className="w-3 h-3" />
                            <span>Change Photo</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3 h-3" />
                            <span>Upload Photo</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Details & Controls */}
                  <div className="flex-1 min-w-0 w-full space-y-4">
                    {/* Top Row: Title + Store Badge + Trash */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {editingTitleId === item.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingTitleText}
                              onChange={(e) => setEditingTitleText(e.target.value)}
                              className="text-base font-extrabold text-slate-900 border border-[#0066FF] rounded-lg px-2 py-1 w-full focus:outline-hidden"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (editingTitleText.trim()) {
                                  setProducts(products.map((p) => p.id === item.id ? { ...p, name: editingTitleText.trim() } : p));
                                }
                                setEditingTitleId(null);
                              }}
                              className="px-3 py-1 bg-[#0066FF] text-white text-xs font-bold rounded-lg cursor-pointer shrink-0"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/edit">
                            <h4 className="font-extrabold text-slate-900 text-base sm:text-lg leading-snug">
                              {item.name}
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTitleId(item.id);
                                setEditingTitleText(item.name);
                              }}
                              className="opacity-0 group-hover/edit:opacity-100 p-1 text-slate-400 hover:text-slate-700 transition-opacity"
                              title="Edit product name"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#0066FF] hover:underline block truncate mt-0.5"
                          title={item.url}
                        >
                          {item.url}
                        </a>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <StoreBadge store={item.storeName} size="sm" />
                        <button
                          type="button"
                          onClick={() => removeProduct(item.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Fields Row: Quantity, Size, Colour, Price */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Quantity */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Quantity
                        </label>
                        <select
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-[#0066FF]"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <option key={num} value={num}>
                              {num}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Size (optional) */}
                      {item.size !== undefined ? (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Size
                          </label>
                          <select
                            value={item.size}
                            onChange={(e) => updateSize(item.id, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-[#0066FF]"
                          >
                            {['7', '8', '9', '10', '11', 'XS', 'S', 'M', 'L', 'XL', 'Standard'].map(
                              (s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      ) : (
                        <div />
                      )}

                      {/* Colour (optional) */}
                      {item.colour !== undefined ? (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Colour
                          </label>
                          <select
                            value={item.colour}
                            onChange={(e) => updateColour(item.id, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm font-semibold text-slate-800 focus:outline-hidden focus:border-[#0066FF]"
                          >
                            {['Blue', 'Pink', 'Black', 'White', 'Red', 'Green', 'Default'].map(
                              (c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      ) : (
                        <div />
                      )}

                      {/* Price (INR) */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Price (INR)
                        </label>
                        <input
                          type="text"
                          value={item.priceINR.toLocaleString('en-IN')}
                          onChange={(e) => updatePrice(item.id, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-800 focus:outline-hidden focus:border-[#0066FF]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* + Add Another Product */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="w-full py-3.5 px-4 bg-blue-50/80 hover:bg-blue-100 text-[#0066FF] border border-blue-200 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span>Add Another Product</span>
            </button>

            {/* Summary Bar */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 flex flex-wrap items-center justify-between text-sm">
              <div className="text-slate-600">
                Total Products: <strong className="text-slate-900">{products.length}</strong> (
                {products.reduce((acc, p) => acc + p.quantity, 0)} items)
              </div>
              <div className="text-slate-700">
                Estimated Items Subtotal:{' '}
                <strong className="text-xl font-extrabold text-[#0066FF]">
                  ₹{subtotalINR.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* Submit for Review */}
            <button
              type="button"
              disabled={products.length === 0}
              onClick={() => {
                if (products.length === 0) {
                  showToast('Please add at least one product before submitting for review.');
                  return;
                }
                setCurrentStep(2);
              }}
              className={`w-full py-4 px-6 rounded-2xl font-extrabold text-base shadow-md transition-all flex items-center justify-center gap-2 ${
                products.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-[#0066FF] hover:bg-[#0052CC] text-white hover:shadow-lg active:scale-[0.99] cursor-pointer'
              }`}
            >
              <span>Submit for Review</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Customer-Specific Previously Submitted Requests & Items (Strict Data Isolation) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
                  <span>My Previously Submitted Requests</span>
                  <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                    {customerPreviousRequests.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing purchase requests belonging strictly to {currentUser.name} ({currentUser.customerId}). Data is isolated.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartNewRequest}
                className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0066FF] border border-blue-200/70 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer w-fit"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New Request</span>
              </button>
            </div>

            {customerPreviousRequests.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs sm:text-sm">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No previously submitted requests for {currentUser.name}</p>
                <p className="text-slate-400 mt-0.5">Add products using the URL form above to submit your first purchase request.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {customerPreviousRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {req.requestNumber || req.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            req.status === 'Purchased' || req.status === 'Procuring'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : req.status === 'Quote Ready'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {req.status}
                        </span>
                        <span className="text-[11px] text-slate-400">{req.date}</span>
                      </div>

                      {/* Products preview */}
                      <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                        {(req.products || []).slice(0, 4).map((p: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 text-xs shrink-0 max-w-[220px]">
                            {p.imageUrl && (
                              <img src={p.imageUrl} alt={p.name} referrerPolicy="no-referrer" loading="lazy" className="w-6 h-6 rounded object-cover" />
                            )}
                            <span className="truncate text-slate-700 font-medium">{p.name}</span>
                          </div>
                        ))}
                        {(req.products || []).length > 4 && (
                          <span className="text-[10px] text-slate-500 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                            +{req.products.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                      <span className="text-xs text-slate-500">Quoted Total:</span>
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{(req.totalAmountINR || 0).toLocaleString('en-IN')}
                      </span>
                      {req.status === 'Quote Ready' && (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentStep(4);
                          }}
                          className="mt-1 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                        >
                          View Quote
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer's Previous Orders (Strictly Isolated) */}
          {customerPreviousOrders.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200/80 space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl flex items-center gap-2">
                    <span>My Order History</span>
                    <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                      {customerPreviousOrders.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Orders placed and paid by {currentUser.name} ({currentUser.customerId}).
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {customerPreviousOrders.map((ord: any) => (
                  <div
                    key={ord.orderId}
                    className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {ord.orderId}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {ord.orderStatus || 'Procuring'}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {ord.paymentStatus || 'Paid'}
                        </span>
                        <span className="text-xs text-slate-400">{ord.orderDate || ord.createdAt}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium pt-1">
                        {ord.products?.length || ord.items?.length || 1} items • Delivery to {ord.deliveryAddress?.city || 'Dubai'}, {ord.deliveryAddress?.country || 'UAE'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs text-slate-500 block">Total Paid:</span>
                      <span className="text-base font-extrabold text-emerald-700">
                        ₹{(ord.totalINR || ord.totalAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: REVIEW & SUBMIT */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-100 space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-2xl">Review Your Request</h3>
              <p className="text-slate-500 text-sm mt-0.5">
                Verify items, destination country, and packaging preferences before submission.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-xs font-bold text-[#0066FF] hover:underline"
            >
              ← Edit Items
            </button>
          </div>

          {/* Destination Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                Destination Country
              </label>
              <select
                value={destinationCountry}
                onChange={(e) => setDestinationCountry(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm font-semibold"
              >
                {countriesList.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                Customer Identifier
              </label>
              <input
                type="text"
                readOnly
                value={`${getCurrentUser().name} (${getCurrentUser().customerId}) — Mumbai Hub`}
                className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-mono text-slate-600"
              />
            </div>
          </div>

          {/* Preferences Checkboxes */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Warehouse Handling Preferences
            </h4>
            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={removePackaging}
                onChange={(e) => setRemovePackaging(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#0066FF]"
              />
              <div>
                <span className="text-sm font-bold text-slate-800">
                  Discard bulky merchant outer packaging (Recommended)
                </span>
                <p className="text-xs text-slate-500">
                  Reduces volumetric package weight by up to 40%, saving substantial international courier charges.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={photoInspection}
                onChange={(e) => setPhotoInspection(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#0066FF]"
              />
              <div>
                <span className="text-sm font-bold text-slate-800">
                  Free High-Definition Photos upon Warehouse Arrival
                </span>
                <p className="text-xs text-slate-500">
                  Our inspection staff takes photos of every item before repacking.
                </p>
              </div>
            </label>
          </div>

          {/* Notes for shoppers */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
              Special Instructions for Purchasing Team (Optional)
            </label>
            <textarea
              rows={2}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="e.g., If size 9 is out of stock, size 9.5 is acceptable. Please apply any available store coupon code."
              className="w-full p-3 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          {/* Cost Estimate Breakdown */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-5 space-y-2.5">
            <h4 className="font-extrabold text-slate-900 text-sm">Estimated Cost Overview</h4>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Items Total ({products.length} products):</span>
              <span>₹{subtotalINR.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Assisted Purchasing & Inspection Fee:</span>
              <span>₹{Math.max(250, serviceFeeINR).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Merchant Domestic Delivery to Mumbai Hub:</span>
              <span className="text-emerald-600 font-semibold">FREE</span>
            </div>
            <div className="pt-2 border-t border-blue-200 flex justify-between text-base font-extrabold text-slate-900">
              <span>Total Estimated Product + Procurement Cost:</span>
              <span className="text-[#0066FF]">₹{totalINR.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              * International courier shipping to {destinationCountry} will be weighed and quoted once items arrive at our Mumbai warehouse.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              if (!isAuthenticated) {
                setShowAuthGateModal(true);
                return;
              }
              const createdReq = createPurchaseRequest({
                customerId: currentUser.customerId,
                customerName: currentUser.name,
                customerEmail: currentUser.email,
                destinationCountry: destinationCountry || currentUser.country,
                destinationCity: currentUser.countryCode === 'AE' ? 'Dubai' : 'International City',
                products: products.map((p) => ({
                  name: p.name,
                  url: p.url,
                  store: p.storeName || p.store,
                  specs: p.size || p.colour ? `${p.size ? 'Size: ' + p.size : ''} ${p.colour ? '| ' + p.colour : ''}` : 'Standard Packaging',
                  priceINR: p.priceINR,
                  qty: p.quantity,
                  imageUrl: p.imageUrl,
                })),
              });
              setSubmittedRequestId(createdReq.id);

              try {
                await fetchWithAuth('/api/customer/buy-for-me/submit-request', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    products,
                    destinationCountry: destinationCountry || currentUser.country,
                    notes: customerNotes,
                  }),
                });
                loadCustomerWorkspace();
              } catch {}

              setCurrentStep(3);
              showToast(`Purchase Request ${createdReq.id} submitted for Admin Review!`);
            }}
            className="w-full py-4 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-2xl font-extrabold text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>Confirm & Send to Purchasing Team</span>
          </button>
        </div>
      )}

      {/* STEP 3: ADMIN REVIEW DEMONSTRATION */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl p-8 shadow-xs border border-slate-100 text-center space-y-6 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              Status: Under Admin Review ({submittedRequestId})
            </span>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Our Indian Purchasing Team is Reviewing Your Items
            </h3>
            <p className="text-slate-500 text-sm">
              We check store stock, prices, coupon codes, and seller reputation to ensure hassle-free fulfillment. Average review turnaround: <strong>1 to 2 hours</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-lg mx-auto text-left text-xs space-y-2">
            <div className="font-bold text-slate-700">Demonstration Simulation:</div>
            <p className="text-slate-600">
              In production, our backend emits an email and push notification once the operator approves the request. You can simulate the operator approval right now to test Step 4 and Step 5:
            </p>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="mt-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simulate Admin Approval → Go to Step 4 (Get Quote)</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: GET QUOTE */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-100 space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                Official Quotation Ready
              </span>
              <h3 className="font-extrabold text-slate-900 text-2xl mt-1">Quotation for {submittedRequestId}</h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Valid for 48 Hours</span>
              <strong className="text-xl font-extrabold text-[#0066FF]">₹{totalINR.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {/* Quotation Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Qty</th>
                  <th className="p-3.5">Store Price</th>
                  <th className="p-3.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3.5 font-medium">
                      <div>{p.name}</div>
                      <span className="text-slate-400 text-xs">{p.storeName}</span>
                    </td>
                    <td className="p-3.5">{p.quantity}</td>
                    <td className="p-3.5">₹{p.priceINR.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-right font-bold">
                      ₹{(p.priceINR * p.quantity).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleProceedToPayment}
            className="w-full py-4 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-2xl font-extrabold text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-5 h-5" />
            <span>Proceed to Step 5: Make Payment</span>
          </button>
        </div>
      )}

      {/* STEP 5: MAKE PAYMENT */}
      {currentStep === 5 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-100 space-y-6 animate-in fade-in duration-300">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-900 text-2xl">Payment & Invoice Confirmation</h3>
            <p className="text-slate-500 text-sm mt-0.5">
              Secure checkout for assisted product purchase on your behalf.
            </p>
          </div>

          {/* Authenticated Customer Identity Card (Auto-retrieved from account) */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#0066FF] text-white flex items-center justify-center font-bold text-sm shrink-0">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {currentUser.name} <span className="font-normal text-slate-500">({currentUser.customerId})</span>
                </div>
                <div className="text-slate-600 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-[#0066FF]" />
                  <span>Linked Account Email: <strong className="text-slate-900">{currentUser.email}</strong></span>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-blue-800 bg-white px-3 py-1.5 rounded-xl border border-blue-200 self-start sm:self-auto font-semibold">
              Official Tax Invoice PDF will be automatically generated & emailed to this address
            </div>
          </div>

          {paymentSuccess ? (
            <div className="p-6 sm:p-8 text-center space-y-5 bg-emerald-50/70 border border-emerald-200 rounded-3xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                  Order Confirmed &bull; {generatedInvoice?.orderId || 'ORD-90245'}
                </span>
                <h4 className="text-2xl font-extrabold text-slate-900 mt-2">Order & Payment Completed!</h4>
                <p className="text-slate-600 text-sm max-w-lg mx-auto mt-1">
                  Thank you, <strong>{currentUser.name}</strong>! Our Mumbai procurement team has received your order and will procure the items from merchants.
                </p>
              </div>

              {/* Automatic Invoice Notice Card */}
              {generatedInvoice && (
                <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs max-w-lg mx-auto text-left space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">Official Tax Invoice</span>
                    </div>
                    <span className="font-mono text-xs font-extrabold text-[#0066FF]">
                      {generatedInvoice.invoiceNumber}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        Automatically emailed to <strong>{generatedInvoice.customerEmail}</strong> (Status: <strong>Sent</strong>)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Transactional delivery accepted (Status 250 OK). You can view and download your tax invoices anytime in your customer account.
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => downloadInvoiceDocument(generatedInvoice)}
                      className="flex-1 py-2.5 px-3 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Invoice (PDF)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => printInvoiceDocument(generatedInvoice)}
                      className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-xs text-sm cursor-pointer transition-colors"
                >
                  View in My Orders / Invoices
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Methods */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-600 uppercase">
                    Select Payment Method
                  </label>
                  {['Credit / Debit Card (Stripe)', 'PayPal International', 'Apple Pay / Google Pay', 'International Wire Transfer'].map(
                    (m) => (
                      <label
                        key={m}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          selectedPaymentMethod === m
                            ? 'border-[#0066FF] bg-blue-50/40 text-[#0066FF] font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selectedPaymentMethod === m}
                          onChange={() => setSelectedPaymentMethod(m)}
                          className="w-4 h-4 text-[#0066FF]"
                        />
                        <span className="text-sm">{m}</span>
                      </label>
                    )
                  )}
                </div>

                {/* Amount to Pay */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-sm mb-3">Order Total</h5>
                    <div className="space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Items Subtotal:</span>
                        <span>₹{subtotalINR.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Procurement Fee:</span>
                        <span>₹{Math.max(250, serviceFeeINR).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-extrabold text-slate-900">
                        <span>Amount in INR:</span>
                        <span className="text-[#0066FF]">₹{totalINR.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-xs text-slate-500 pt-1">
                        Approx: <strong>${Math.round(totalINR / 87)} USD</strong> /{' '}
                        <strong>{Math.round(totalINR / 23.7)} AED</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 mb-3 space-y-1">
                      <div>
                        📧 <strong>Automatic Tax Invoice:</strong> Generated and emailed to <strong>{currentUser.email}</strong> upon payment.
                      </div>
                      <div className="text-slate-500 text-[10px]">
                        Demonstration Mode: Simulates secure transactional payment & automated invoice delivery.
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const { invoice } = createOrderAndAutomateInvoice({
                          user: currentUser,
                          products: products.map((p) => ({
                            name: p.name,
                            storeName: p.storeName,
                            store: p.store,
                            priceINR: p.priceINR,
                            quantity: p.quantity,
                          })),
                          costSummary: {
                            subtotal: subtotalINR,
                            domesticShipping: 0,
                            serviceFee: Math.max(250, serviceFeeINR),
                            tax: 0,
                            discount: 0,
                            total: totalINR,
                          },
                          paymentMethod: selectedPaymentMethod,
                          destinationCity: currentUser.country,
                          destinationCountry: currentUser.country,
                        });

                        const newOrder = createOrderRecord({
                          id: invoice.orderId,
                          requestId: submittedRequestId || undefined,
                          customerId: currentUser.customerId,
                          customerName: currentUser.name,
                          customerEmail: currentUser.email,
                          customerAvatar: currentUser.avatar,
                          destination: `${invoice.destinationCity}, ${invoice.destinationCountry}`,
                          destinationFlag: invoice.destinationFlag || '🌍',
                          orderType: 'Assisted Purchase (Buy For Me)',
                          stores: Array.from(new Set(products.map((p) => p.storeName || p.store))),
                          itemCount: products.reduce((acc, p) => acc + p.quantity, 0),
                          totalINR: totalINR,
                          paymentStatus: 'Paid',
                          orderStatus: 'Procuring',
                          createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                          items: products.map((p) => ({
                            title: p.name,
                            store: p.storeName || p.store,
                            price: p.priceINR,
                            qty: p.quantity,
                            imageUrl: p.imageUrl,
                          })),
                          costSummary: {
                            subtotal: subtotalINR,
                            domesticShipping: 0,
                            serviceFee: Math.max(250, serviceFeeINR),
                            tax: 0,
                            discount: 0,
                            total: totalINR,
                          },
                        });

                        // Trigger automatic order confirmation email with attached PDF invoice
                        triggerOrderConfirmationEmail(newOrder, invoice).catch(console.warn);
                        loadCustomerWorkspace();

                        setGeneratedInvoice(invoice);
                        setPaymentSuccess(true);
                        showToast(`Order created! Order confirmation email & invoice ${invoice.invoiceNumber} dispatched to ${currentUser.email}`);
                      }}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Simulate Payment & Send Invoice (₹{totalINR.toLocaleString('en-IN')})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Product Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Add Product Manually</h3>
                <p className="text-xs text-slate-500">Enter details and attach the exact product image.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Name / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Safari Ray Small Cabin Suitcase 55 cm"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#0066FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Link (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://www.flipkart.com/... or leave blank"
                  value={newProductUrl}
                  onChange={(e) => setNewProductUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#0066FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Online Store</label>
                  <select
                    value={newProductStore}
                    onChange={(e) => setNewProductStore(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#0066FF] bg-white"
                  >
                    <option value="Amazon India">Amazon.in</option>
                    <option value="Flipkart">Flipkart</option>
                    <option value="BigBasket">bigbasket</option>
                    <option value="Myntra">Myntra</option>
                    <option value="Nykaa">Nykaa</option>
                    <option value="Tata CLiQ">Tata CLiQ</option>
                    <option value="AJIO">AJIO</option>
                    <option value="Meesho">Meesho</option>
                    <option value="Other Indian Store">Other Indian Store</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price (INR ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#0066FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={newProductQty}
                    onChange={(e) => setNewProductQty(Number(e.target.value))}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Size / Variant</label>
                  <input
                    type="text"
                    value={newProductSize}
                    onChange={(e) => setNewProductSize(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Colour</label>
                  <input
                    type="text"
                    value={newProductColour}
                    onChange={(e) => setNewProductColour(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs text-center"
                  />
                </div>
              </div>

              {/* Exact Product Photo Upload / Link */}
              <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200/80 space-y-2">
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  Product Photo (Accurate)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={manualImageUrl}
                    onChange={(e) => setManualImageUrl(e.target.value)}
                    placeholder="Paste image URL (https://...jpg)"
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:border-[#0066FF]"
                  />
                  <input
                    ref={manualFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleManualFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => manualFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-[#0066FF] text-xs font-bold rounded-xl cursor-pointer shrink-0 flex items-center gap-1 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                </div>
                {manualImageUrl && (
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-10 h-10 rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                      <img src={manualImageUrl} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-contain p-0.5" />
                    </div>
                    <span className="text-[11px] text-emerald-700 font-semibold">Image ready to save</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Image Selector / Details Modal */}
      {selectedProductIdForImage && (() => {
        const activeItem = products.find((p) => p.id === selectedProductIdForImage);
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="min-w-0 pr-2">
                  <h3 className="font-extrabold text-slate-900 text-lg">Product Image & Details</h3>
                  <p className="text-xs text-slate-500 truncate">
                    {activeItem?.name || 'Manage Product Photo & Info'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProductIdForImage(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs in Modal */}
              <div className="flex border-b border-slate-100 gap-1 pb-1">
                <button
                  type="button"
                  onClick={() => setModalTab('upload')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'upload'
                      ? 'bg-blue-50 text-[#0066FF] border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('link')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'link'
                      ? 'bg-blue-50 text-[#0066FF] border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Paste Image Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('edit')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'edit'
                      ? 'bg-blue-50 text-[#0066FF] border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
              </div>

              {/* TAB 1: UPLOAD PHOTO FROM DEVICE */}
              {modalTab === 'upload' && (
                <div className="space-y-4 pt-1">
                  <div className="p-5 bg-slate-50/80 rounded-2xl border-2 border-dashed border-blue-200 text-center space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 text-[#0066FF] flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-800">Upload Product Image from Device</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Select the exact photo from your computer or phone (JPG, PNG, WEBP, AVIF)
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2.5 bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all inline-flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose Image File</span>
                    </button>
                  </div>

                  {activeItem?.imageUrl && !brokenImageIds[activeItem.id] && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <div className="w-14 h-14 rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={activeItem.imageUrl}
                          alt="Current"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div className="text-xs min-w-0">
                        <span className="font-bold text-slate-800 block">Current Photo Assigned</span>
                        <span className="text-slate-500 text-[11px]">Upload a new photo above to replace it.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PASTE DIRECT IMAGE LINK */}
              {modalTab === 'link' && (
                <div className="space-y-3 pt-1">
                  <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                        Paste Exact Image Address
                      </label>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                        100% Accurate
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Right-click the product photo on the website & select <strong className="text-slate-700">"Copy image address"</strong>, then paste below:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={customImageUrlInput}
                        onChange={(e) => setCustomImageUrlInput(e.target.value)}
                        placeholder="https://.../photo.jpg or rukminim2.flixcart.com/..."
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:border-[#0066FF] bg-white font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmedUrl = customImageUrlInput.trim();
                          if (trimmedUrl && selectedProductIdForImage) {
                            let updatedItem: ProductItem | null = null;
                            setProducts((prev) =>
                              prev.map((p) => {
                                if (p.id === selectedProductIdForImage) {
                                  updatedItem = { ...p, imageUrl: trimmedUrl };
                                  return updatedItem;
                                }
                                return p;
                              })
                            );
                            if (updatedItem) syncAddProduct(updatedItem);
                            setBrokenImageIds((prev) => {
                              const copy = { ...prev };
                              delete copy[selectedProductIdForImage];
                              return copy;
                            });
                            setSelectedProductIdForImage(null);
                            setCustomImageUrlInput('');
                            showToast('Exact product image applied!');
                          }
                        }}
                        className="px-4 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer shrink-0 transition-colors"
                      >
                        Apply Photo
                      </button>
                    </div>

                    {/* Live Preview if user typed/pasted a URL */}
                    {customImageUrlInput.trim() && (
                      <div className="flex items-center gap-3 pt-2">
                        <div className="w-14 h-14 rounded-xl border border-slate-200 overflow-hidden bg-white shrink-0 flex items-center justify-center">
                          <img
                            src={customImageUrlInput}
                            alt="Preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-emerald-700 font-medium">
                          Preview loaded. Click "Apply Photo" to save.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: EDIT PRODUCT DETAILS */}
              {modalTab === 'edit' && (
                <form onSubmit={handleSaveModalDetails} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Product Name</label>
                    <input
                      type="text"
                      value={modalTitle}
                      onChange={(e) => setModalTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#0066FF]"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Price (INR ₹)</label>
                      <input
                        type="number"
                        value={modalPrice}
                        onChange={(e) => setModalPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#0066FF]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Store Name</label>
                      <input
                        type="text"
                        value={modalStore}
                        onChange={(e) => setModalStore(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#0066FF]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Size / Variant</label>
                      <input
                        type="text"
                        value={modalSize}
                        onChange={(e) => setModalSize(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#0066FF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Colour</label>
                      <input
                        type="text"
                        value={modalColour}
                        onChange={(e) => setModalColour(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-[#0066FF]"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProductIdForImage(null)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Save Details
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );
      })()}
      {/* Registration & Authentication Gate Modal */}
      {showAuthGateModal && (
        <div
          onClick={() => setShowAuthGateModal(false)}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0B1933]">Account Authentication Required</h3>
                  <p className="text-[11px] text-slate-500">Registered customers only</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthGateModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Only registered and authenticated customers can proceed to checkout. Your official invoice and shipping tracking will be automatically generated and linked to your registered email address.
            </p>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAuthGateModal(false);
                  onNavigate('auth');
                }}
                className="w-full py-3 bg-[#0066FF] hover:bg-[#0052cc] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Create Account</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('john@example.com')}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Continue as Demo Customer (John Doe &bull; john@example.com)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
