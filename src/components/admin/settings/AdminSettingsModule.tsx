import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  CheckCircle2,
  AlertCircle,
  Search,
  Save,
  RefreshCw,
  Globe,
  ShoppingBag,
  DollarSign,
  Warehouse,
  Truck,
  Mail,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  AdminSettingsData,
  fetchAdminSettings,
  saveCategorySettings,
  saveAllAdminSettings,
} from '../../../services/adminSettingsService';
import { useAdminAuth } from '../../../context/AdminAuthContext';

// Import all 12 cards
import { GeneralSettingsCard } from './cards/GeneralSettingsCard';
import { EmailSmtpSettingsCard } from './cards/EmailSmtpSettingsCard';
import { CustomerAccountSettingsCard } from './cards/CustomerAccountSettingsCard';
import { BuyForMeSettingsCard } from './cards/BuyForMeSettingsCard';
import { PricingAirCargoSettingsCard } from './cards/PricingAirCargoSettingsCard';
import { OrderWorkflowSettingsCard } from './cards/OrderWorkflowSettingsCard';
import { PaymentFinancialSettingsCard } from './cards/PaymentFinancialSettingsCard';
import { WarehouseStorageSettingsCard } from './cards/WarehouseStorageSettingsCard';
import { ShippingTrackingSettingsCard } from './cards/ShippingTrackingSettingsCard';
import { AdminRolesPermissionsCard } from './cards/AdminRolesPermissionsCard';
import { NotificationsTemplatesCard } from './cards/NotificationsTemplatesCard';
import { SecurityAuditBackupCard } from './cards/SecurityAuditBackupCard';

export interface ConceptPage {
  id: string;
  stepNumber: number;
  title: string;
  shortTitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  cardIds: (keyof AdminSettingsData)[];
}

export const AdminSettingsModule: React.FC = () => {
  const { adminUser } = useAdminAuth();
  const [settings, setSettings] = useState<AdminSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingCategory, setSavingCategory] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Page-wise navigation state (1 to 7 concepts)
  const [currentConceptIndex, setCurrentConceptIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'pagewise' | 'all'>('pagewise');

  const triggerToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAdminSettings();
      setSettings(data);
    } catch (err: any) {
      triggerToast(`Failed to load settings: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveCategory = async <K extends keyof AdminSettingsData>(
    category: K,
    data: AdminSettingsData[K]
  ) => {
    setSavingCategory(category);
    try {
      const result = await saveCategorySettings(
        category,
        data,
        adminUser ? { name: adminUser.name, email: adminUser.email } : undefined
      );
      if (result.settings) {
        setSettings(result.settings);
      }
      triggerToast(`Saved ${formatCategoryName(category)} configuration successfully!`, 'success');
    } catch (err: any) {
      triggerToast(`Failed to save ${formatCategoryName(category)}: ${err.message}`, 'error');
    } finally {
      setSavingCategory(null);
    }
  };

  const handleSaveAll = async () => {
    if (!settings) return;
    setIsSavingAll(true);
    try {
      const result = await saveAllAdminSettings(
        settings,
        adminUser ? { name: adminUser.name, email: adminUser.email } : undefined
      );
      if (result.settings) {
        setSettings(result.settings);
      }
      triggerToast('🎉 All 7 Concept Settings persisted to server database successfully!', 'success');
    } catch (err: any) {
      triggerToast(`Error saving settings: ${err.message}`, 'error');
    } finally {
      setIsSavingAll(false);
    }
  };

  const formatCategoryName = (cat: string) => {
    switch (cat) {
      case 'general':
        return 'General Application';
      case 'emailSmtp':
        return 'Email & SMTP';
      case 'customerAccount':
        return 'Customer & Account';
      case 'buyForMe':
        return 'Buy For Me & Product';
      case 'pricing':
        return 'Pricing & Air Cargo';
      case 'orderWorkflow':
        return 'Order Workflow';
      case 'payment':
        return 'Payment & Financial';
      case 'warehouse':
        return 'Warehouse & Storage';
      case 'shippingTracking':
        return 'Shipping & Tracking';
      case 'adminRoles':
        return 'Admin Roles & Permissions';
      case 'notifications':
        return 'Notifications & Templates';
      case 'securityAudit':
        return 'Security, Audit & Backup';
      default:
        return cat;
    }
  };

  // 7 Core Concepts (between 5 and 8 concepts!) with maximum details
  const concepts: ConceptPage[] = useMemo(() => [
    {
      id: 'concept-1-general-accounts',
      stepNumber: 1,
      title: 'General Identity & Customer Policy',
      shortTitle: 'General & Accounts',
      description: 'Platform identity, legal company contact, currency, timezone, customer registration, and account privacy isolation.',
      icon: Globe,
      badge: 'Core Platform',
      cardIds: ['general', 'customerAccount'],
    },
    {
      id: 'concept-2-buyforme-orders',
      stepNumber: 2,
      title: 'Buy For Me Procurement & Order Workflow',
      shortTitle: 'Buy For Me & Orders',
      description: 'Supported Indian e-commerce merchants, auto-metadata parser, cart limits, and procurement approval threshold.',
      icon: ShoppingBag,
      badge: 'Procurement',
      cardIds: ['buyForMe', 'orderWorkflow'],
    },
    {
      id: 'concept-3-pricing-finance',
      stepNumber: 3,
      title: 'Pricing Formulas, Tariffs & Payment Gateways',
      shortTitle: 'Pricing & Payments',
      description: 'IATA volumetric divisor formula, handling fees, international freight tariffs, Razorpay/Stripe, and GST invoices.',
      icon: DollarSign,
      badge: 'Financials',
      cardIds: ['pricing', 'payment'],
    },
    {
      id: 'concept-4-warehouse-hub',
      stepNumber: 4,
      title: 'Warehouse Operations & Locker Storage',
      shortTitle: 'Warehouse Hub',
      description: 'Mumbai Bay #4 fulfillment hub, 30-day complimentary locker retention, daily overage fee, and intake inspections.',
      icon: Warehouse,
      badge: 'Fulfillment',
      cardIds: ['warehouse'],
    },
    {
      id: 'concept-5-shipping-tracking',
      stepNumber: 5,
      title: 'International Shipping & Carrier Telemetry',
      shortTitle: 'Shipping & Tracking',
      description: 'DHL, FedEx, Aramex, UPS transit SLAs, volumetric repack optimization, parcel dimensions, and live milestones.',
      icon: Truck,
      badge: 'Air Freight',
      cardIds: ['shippingTracking'],
    },
    {
      id: 'concept-6-email-smtp',
      stepNumber: 6,
      title: 'Email Dispatch, SMTP & Notification Triggers',
      shortTitle: 'Email & Templates',
      description: 'Google Gmail SMTP live relay, sample PDF invoice diagnostic test, SPF/DKIM/DMARC alignment, and event triggers.',
      icon: Mail,
      badge: 'Communications',
      cardIds: ['emailSmtp', 'notifications'],
    },
    {
      id: 'concept-7-security-backup',
      stepNumber: 7,
      title: 'Admin Roles (RBAC), Security & Disaster Backup',
      shortTitle: 'Security & Backup',
      description: 'Super Admin & staff permissions matrix, real-time Node.js telemetry, settings audit trail, and JSON disaster backup.',
      icon: ShieldAlert,
      badge: 'Governance',
      cardIds: ['adminRoles', 'securityAudit'],
    },
  ], []);

  // Card component renderer
  const renderCardById = (cardId: keyof AdminSettingsData) => {
    if (!settings) return null;

    switch (cardId) {
      case 'general':
        return (
          <GeneralSettingsCard
            key="general"
            settings={settings.general}
            onSave={(data) => handleSaveCategory('general', data)}
            isSaving={savingCategory === 'general'}
          />
        );
      case 'emailSmtp':
        return (
          <EmailSmtpSettingsCard
            key="emailSmtp"
            settings={settings.emailSmtp}
            onSave={(data) => handleSaveCategory('emailSmtp', data)}
            isSaving={savingCategory === 'emailSmtp'}
            onToast={(msg) => triggerToast(msg, msg.includes('❌') ? 'error' : 'success')}
          />
        );
      case 'customerAccount':
        return (
          <CustomerAccountSettingsCard
            key="customerAccount"
            settings={settings.customerAccount}
            onSave={(data) => handleSaveCategory('customerAccount', data)}
            isSaving={savingCategory === 'customerAccount'}
          />
        );
      case 'buyForMe':
        return (
          <BuyForMeSettingsCard
            key="buyForMe"
            settings={settings.buyForMe}
            onSave={(data) => handleSaveCategory('buyForMe', data)}
            isSaving={savingCategory === 'buyForMe'}
          />
        );
      case 'pricing':
        return (
          <PricingAirCargoSettingsCard
            key="pricing"
            settings={settings.pricing}
            onSave={(data) => handleSaveCategory('pricing', data)}
            isSaving={savingCategory === 'pricing'}
          />
        );
      case 'orderWorkflow':
        return (
          <OrderWorkflowSettingsCard
            key="orderWorkflow"
            settings={settings.orderWorkflow}
            onSave={(data) => handleSaveCategory('orderWorkflow', data)}
            isSaving={savingCategory === 'orderWorkflow'}
          />
        );
      case 'payment':
        return (
          <PaymentFinancialSettingsCard
            key="payment"
            settings={settings.payment}
            onSave={(data) => handleSaveCategory('payment', data)}
            isSaving={savingCategory === 'payment'}
          />
        );
      case 'warehouse':
        return (
          <WarehouseStorageSettingsCard
            key="warehouse"
            settings={settings.warehouse}
            onSave={(data) => handleSaveCategory('warehouse', data)}
            isSaving={savingCategory === 'warehouse'}
          />
        );
      case 'shippingTracking':
        return (
          <ShippingTrackingSettingsCard
            key="shippingTracking"
            settings={settings.shippingTracking}
            onSave={(data) => handleSaveCategory('shippingTracking', data)}
            isSaving={savingCategory === 'shippingTracking'}
          />
        );
      case 'adminRoles':
        return (
          <AdminRolesPermissionsCard
            key="adminRoles"
            settings={settings.adminRoles}
            onSave={(data) => handleSaveCategory('adminRoles', data)}
            isSaving={savingCategory === 'adminRoles'}
          />
        );
      case 'notifications':
        return (
          <NotificationsTemplatesCard
            key="notifications"
            settings={settings.notifications}
            onSave={(data) => handleSaveCategory('notifications', data)}
            isSaving={savingCategory === 'notifications'}
          />
        );
      case 'securityAudit':
        return (
          <SecurityAuditBackupCard
            key="securityAudit"
            settings={settings.securityAudit}
            onSave={(data) => handleSaveCategory('securityAudit', data)}
            isSaving={savingCategory === 'securityAudit'}
            onToast={(msg) => triggerToast(msg, msg.includes('❌') ? 'error' : 'success')}
            onRefreshAll={loadSettings}
          />
        );
      default:
        return null;
    }
  };

  const currentConcept = concepts[currentConceptIndex] || concepts[0];

  const handleNextConcept = () => {
    if (currentConceptIndex < concepts.length - 1) {
      setCurrentConceptIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevConcept = () => {
    if (currentConceptIndex > 0) {
      setCurrentConceptIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 font-['Plus_Jakarta_Sans',sans-serif]">
        <RefreshCw className="w-8 h-8 text-[#0066FF] animate-spin" />
        <div className="text-sm font-bold text-slate-700">Loading Page-Wise Settings...</div>
        <div className="text-xs text-slate-400">Organizing 5 to 8 core concepts with backend database</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 text-center space-y-3 font-['Plus_Jakarta_Sans',sans-serif]">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Failed to load configuration</h2>
        <button
          onClick={loadSettings}
          className="px-4 py-2 bg-[#0066FF] text-white text-xs font-bold rounded-xl"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-red-950 text-white border-red-500/30'
              : 'bg-[#0B1933] text-white border-white/10'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Main Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1933] tracking-tight">
              Admin & Operations Settings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#0066FF] border border-blue-200">
              7 Concept Pages
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Page-wise configuration with maximum details across 7 structured logistics and platform concepts.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('pagewise')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'pagewise'
                  ? 'bg-[#0066FF] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Page-by-Page (7 Concepts)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-[#0066FF] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All 12 Cards Grid
            </button>
          </div>

          <button
            type="button"
            disabled={isSavingAll}
            onClick={handleSaveAll}
            className="px-5 py-2 bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSavingAll ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Saving All...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save All Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 7 Concepts Page-Wise Tab Stepper */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-3.5 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {concepts.map((concept, idx) => {
            const isActive = viewMode === 'pagewise' && currentConceptIndex === idx;
            const Icon = concept.icon;
            return (
              <button
                key={concept.id}
                type="button"
                onClick={() => {
                  setViewMode('pagewise');
                  setCurrentConceptIndex(idx);
                }}
                className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0066FF] border-[#0066FF] text-white shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className={`w-6 h-6 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white text-[#0066FF] border border-slate-200'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                  }`}>
                    Page {concept.stepNumber}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-bold leading-tight truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                    {concept.shortTitle}
                  </div>
                  <div className={`text-[10px] leading-tight mt-0.5 truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                    {concept.badge}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Page-by-Page View Mode */}
      {viewMode === 'pagewise' ? (
        <div className="space-y-4">
          {/* Current Page Concept Header Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0066FF] flex items-center justify-center shrink-0">
                {React.createElement(currentConcept.icon, { className: 'w-5 h-5' })}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">
                    Page {currentConcept.stepNumber} of 7
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-bold text-slate-500">{currentConcept.badge}</span>
                </div>
                <h2 className="text-base font-extrabold text-[#0B1933]">
                  {currentConcept.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentConcept.description}
                </p>
              </div>
            </div>

            {/* Previous / Next Pagination Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                disabled={currentConceptIndex === 0}
                onClick={handlePrevConcept}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Page</span>
              </button>

              <button
                type="button"
                disabled={currentConceptIndex === concepts.length - 1}
                onClick={handleNextConcept}
                className="px-4 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052cc] text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Next Page</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Render the 1-2 Paired Cards for this specific Concept Page */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentConcept.cardIds.map((cardId) => renderCardById(cardId))}
          </div>

          {/* Bottom Pagination Stepper */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              Showing Concept <strong>{currentConceptIndex + 1}</strong> of <strong>{concepts.length}</strong> (Page-wise mode)
            </span>

            <div className="flex items-center gap-1.5">
              {concepts.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setCurrentConceptIndex(i);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    currentConceptIndex === i
                      ? 'bg-[#0066FF] text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* All 12 Cards Grid Mode */
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-700">Displaying all 12 cards simultaneously</span>
            <button
              type="button"
              onClick={() => setViewMode('pagewise')}
              className="text-[#0066FF] font-bold hover:underline"
            >
              Switch back to Page-by-Page (7 Concepts)
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {concepts.flatMap((c) => c.cardIds).map((cardId) => renderCardById(cardId))}
          </div>
        </div>
      )}
    </div>
  );
};
