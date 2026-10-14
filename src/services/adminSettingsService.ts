import { AdminSettingsData, AuditLogEntry } from '../types/adminSettings';

export type { AdminSettingsData, AuditLogEntry };

export const SETTINGS_SYNC_EVENT = 'i2w_settings_sync';

// Local storage key mirrors for legacy components
export const LEGACY_STORAGE_KEYS = {
  WAREHOUSE_ADDRESS: 'i2w_warehouse_address',
  FREE_STORAGE_DAYS: 'i2w_free_storage_days',
  DAILY_OVERAGE_FEE: 'i2w_daily_overage_fee',
  BUY_FOR_ME_FEE: 'i2w_buy_for_me_fee',
  VOLUMETRIC_DIVISOR: 'i2w_volumetric_divisor',
};

export function syncSettingsToLocalStorage(settings: AdminSettingsData) {
  if (typeof localStorage === 'undefined') return;
  try {
    if (settings.warehouse?.warehouseAddress) {
      localStorage.setItem(LEGACY_STORAGE_KEYS.WAREHOUSE_ADDRESS, settings.warehouse.warehouseAddress);
    }
    if (settings.warehouse?.freeStorageDays != null) {
      localStorage.setItem(LEGACY_STORAGE_KEYS.FREE_STORAGE_DAYS, String(settings.warehouse.freeStorageDays));
    }
    if (settings.warehouse?.dailyOverageFee != null) {
      localStorage.setItem(LEGACY_STORAGE_KEYS.DAILY_OVERAGE_FEE, String(settings.warehouse.dailyOverageFee));
    }
    if (settings.pricing?.buyForMeHandlingFee != null) {
      localStorage.setItem(LEGACY_STORAGE_KEYS.BUY_FOR_ME_FEE, String(settings.pricing.buyForMeHandlingFee));
    }
    if (settings.pricing?.volumetricDivisor != null) {
      localStorage.setItem(LEGACY_STORAGE_KEYS.VOLUMETRIC_DIVISOR, String(settings.pricing.volumetricDivisor));
    }
    window.dispatchEvent(new CustomEvent(SETTINGS_SYNC_EVENT, { detail: settings }));
  } catch (err) {
    console.error('Error syncing settings to localStorage:', err);
  }
}

export async function fetchAdminSettings(): Promise<AdminSettingsData> {
  try {
    const res = await fetch('/api/admin/settings');
    if (!res.ok) {
      throw new Error(`Failed to load admin settings (${res.status})`);
    }
    const data = await res.json();
    if (data.settings) {
      syncSettingsToLocalStorage(data.settings);
      return data.settings;
    }
    throw new Error(data.error || 'Invalid response from server');
  } catch (err) {
    console.warn('Network issue fetching admin settings, using local fallback:', err);
    // Fallback to local defaults if server is momentarily unreachable
    const fallbackSettings: AdminSettingsData = {
      general: {
        appName: 'India2World',
        tagline: 'Shop in India. Deliver Worldwide.',
        legalName: 'India2World Cross-Border Logistics Pvt. Ltd.',
        supportEmail: 'support@india2world.com',
        supportPhone: '+91 98200 12345',
        officeAddress: 'Chhatrapati Shivaji Maharaj International Airport Cargo Zone, Sahar Road, Andheri East, Mumbai 400099, India',
        defaultCurrency: 'INR',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        primaryCountry: 'India (IND)',
        customerRegistration: true,
        maintenanceMode: false,
        maintenanceNotice: 'India2World operations portal is temporarily undergoing scheduled maintenance.',
      },
      emailSmtp: {
        host: 'smtp.gmail.com',
        port: 587,
        security: 'STARTTLS',
        user: 'pharmayushtechteam@gmail.com',
        senderName: 'India2World Invoicing',
        passSet: true,
        testRecipient: 'pharmayushtechteam@gmail.com',
      },
      customerAccount: {
        registrationMode: 'open',
        emailVerificationRequired: true,
        autoActivateOnSignup: true,
        blockSuspendedAccounts: true,
        passwordResetValidityHours: 24,
        dormancyAlertDays: 90,
        customerDataPrivacyEnabled: true,
        strictCustomerDataIsolation: true,
      },
      buyForMe: {
        supportedPlatforms: {
          amazon: true,
          flipkart: true,
          myntra: true,
          tatacliq: true,
          ajio: true,
          nykaa: true,
        },
        urlValidationStrictness: 'strict',
        autoExtractMetadata: true,
        fallbackScraping: true,
        maxProductsPerRequest: 20,
        maxImageUploadSizeMB: 10,
        duplicateProductDetection: 'warn',
      },
      pricing: {
        buyForMeHandlingFee: Number(localStorage.getItem(LEGACY_STORAGE_KEYS.BUY_FOR_ME_FEE) || 500),
        volumetricDivisor: Number(localStorage.getItem(LEGACY_STORAGE_KEYS.VOLUMETRIC_DIVISOR) || 5000),
        baseShippingRatePerKg: 1850,
        expressPrioritySurcharge: 450,
        fuelSurchargePercent: 12,
        quotationValidityDays: 7,
        currencyBufferPercent: 2.5,
        gstTaxPercent: 18,
        minChargeableWeightKg: 0.5,
      },
      orderWorkflow: {
        autoConfirmOnPayment: true,
        procurementApprovalThresholdINR: 50000,
        autoGenerateInvoice: true,
        allowCustomerCancellation: 'until_procurement',
        statusTransitionMode: 'strict',
        failedEmailRetryCount: 3,
        orderRetentionDays: 365,
      },
      payment: {
        gateways: {
          razorpay: { enabled: true, keyId: 'rzp_live_i2w_secure_prod', status: 'ready' },
          stripe: { enabled: true, publishableKey: 'pk_live_i2w_global_pay', status: 'ready' },
          bankWire: {
            enabled: true,
            bankName: 'HDFC Bank - Commercial Branch',
            accountNumber: '50200084920194',
            ifsc: 'HDFC0000060',
            swift: 'HDFCINBBXXX',
            status: 'active',
          },
          paypal: { enabled: false, status: 'not_configured' },
        },
        requireTransactionRef: true,
        dualApprovalForRefunds: true,
        invoicePrefix: 'I2W-INV-',
        companyGstin: '27AABCU9603R1ZM',
        hsnSacCode: '996813',
        autoReconcileWebhooks: true,
      },
      warehouse: {
        warehouseAddress: localStorage.getItem(LEGACY_STORAGE_KEYS.WAREHOUSE_ADDRESS) || 'Bay #4, Marol MIDC, Andheri East, Mumbai 400093, Maharashtra, India',
        freeStorageDays: Number(localStorage.getItem(LEGACY_STORAGE_KEYS.FREE_STORAGE_DAYS) || 30),
        dailyOverageFee: Number(localStorage.getItem(LEGACY_STORAGE_KEYS.DAILY_OVERAGE_FEE) || 50),
        bayCapacity: 500,
        autoAllocateLocker: true,
        mandatoryIntakeInspection: true,
        mandatoryIntakePhotos: true,
      },
      shippingTracking: {
        carriers: {
          dhl: { enabled: true, name: 'DHL Express Worldwide', slaDays: '2 - 4 Days', status: 'active' },
          fedex: { enabled: true, name: 'FedEx Priority International', slaDays: '3 - 5 Days', status: 'active' },
          aramex: { enabled: true, name: 'Aramex Global Priority (GCC Hub)', slaDays: '4 - 7 Days', status: 'active' },
          ups: { enabled: false, name: 'UPS Worldwide Expedited', slaDays: '3 - 6 Days', status: 'available' },
        },
        repackStrategy: 'discard_outer_box',
        maxPackageDimensionCm: 300,
        maxParcelWeightKg: 30,
        autoMilestoneEmails: true,
        damagedPackageProtocol: 'quarantine',
      },
      adminRoles: {
        roles: [
          {
            roleId: 'super-admin',
            roleName: 'Super Admin',
            description: 'Complete unrestricted administrative access across system, pricing, SMTP, secrets and security audit.',
            permissions: {
              orders: 'full',
              procurement: 'full',
              warehouse: 'full',
              consolidation: 'full',
              dispatch: 'full',
              refunds: 'full',
              invoices: 'full',
              settings: 'full',
            },
          },
          {
            roleId: 'operations-manager',
            roleName: 'Operations Manager',
            description: 'Manages incoming requests, buyer purchase queue, warehouse consolidations, and outbound dispatches.',
            permissions: {
              orders: 'full',
              procurement: 'full',
              warehouse: 'full',
              consolidation: 'full',
              dispatch: 'full',
              refunds: 'approval_only',
              invoices: 'full',
              settings: 'view',
            },
          },
          {
            roleId: 'warehouse-staff',
            roleName: 'Warehouse Staff',
            description: 'Receives packages, inspects condition, records physical dimensions, uploads intake photos, and packs boxes.',
            permissions: {
              orders: 'view',
              procurement: 'none',
              warehouse: 'full',
              consolidation: 'full',
              dispatch: 'view',
              refunds: 'none',
              invoices: 'none',
              settings: 'none',
            },
          },
          {
            roleId: 'customer-support',
            roleName: 'Customer Support',
            description: 'Assists customers with quotes, package inquiries, tracking status, tickets, and communication.',
            permissions: {
              orders: 'view',
              procurement: 'view',
              warehouse: 'view',
              consolidation: 'view',
              dispatch: 'view',
              refunds: 'none',
              invoices: 'view',
              settings: 'none',
            },
          },
          {
            roleId: 'finance-staff',
            roleName: 'Finance Staff',
            description: 'Reviews payment captures, bank reconciliations, dual-signoff on refunds, and fiscal GST reporting.',
            permissions: {
              orders: 'view',
              procurement: 'none',
              warehouse: 'none',
              consolidation: 'none',
              dispatch: 'none',
              refunds: 'full',
              invoices: 'full',
              settings: 'view',
            },
          },
        ],
      },
      notifications: {
        templates: [
          {
            id: 'tpl-order-confirm',
            name: 'Order Confirmation',
            event: 'order_confirmed',
            channel: 'email',
            enabled: true,
            subject: 'Confirmed: Your India2World Order {{orderId}} is in processing',
            description: 'Dispatches immediately after customer pays assisted purchase or shipping quotation.',
          },
          {
            id: 'tpl-quote-ready',
            name: 'Quotation Ready',
            event: 'quotation_ready',
            channel: 'email',
            enabled: true,
            subject: 'Quotation Ready: Review and approve your request {{requestId}}',
            description: 'Notifies customer when operations team has reviewed and priced items.',
          },
          {
            id: 'tpl-payment-received',
            name: 'Payment Capture Receipt',
            event: 'payment_received',
            channel: 'email',
            enabled: true,
            subject: 'Payment Received: Transaction {{txnId}} confirmed for India2World',
            description: 'Sends instant payment receipt with gateway transaction reference.',
          },
          {
            id: 'tpl-invoice-pdf',
            name: 'Official Tax Invoice Dispatched',
            event: 'invoice_dispatched',
            channel: 'email',
            enabled: true,
            subject: 'Tax Invoice: India2World Invoice #{{invoiceNumber}} attached',
            description: 'Delivers generated GST-compliant PDF invoice via live SMTP transport.',
          },
          {
            id: 'tpl-package-intake',
            name: 'Package Received at Mumbai Hub',
            event: 'package_received',
            channel: 'email',
            enabled: true,
            subject: 'New Package Received: Bay Locker #{{lockerId}} (Tracking: {{trackingNumber}})',
            description: 'Sends notification and unboxing verification photos to customer.',
          },
          {
            id: 'tpl-shipment-awb',
            name: 'Air Cargo Dispatched (AWB Tracking)',
            event: 'shipment_dispatched',
            channel: 'email',
            enabled: true,
            subject: 'Dispatched: Consignment #{{shipmentId}} on flight with {{carrier}}',
            description: 'Includes live courier tracking URL, flight departure, and estimated delivery date.',
          },
          {
            id: 'tpl-refund-complete',
            name: 'Refund Credit Notification',
            event: 'refund_processed',
            channel: 'email',
            enabled: true,
            subject: 'Refund Processed: ₹{{amount}} credited to your original payment method',
            description: 'Alerts customer when refund has cleared dual finance sign-off.',
          },
          {
            id: 'tpl-admin-alert',
            name: 'Admin High-Value Order Alert',
            event: 'admin_high_value',
            channel: 'email',
            enabled: true,
            subject: '🚨 Operations Alert: High-Value Order {{orderId}} (> ₹50,000) Requires Review',
            description: 'Alerts Super Admin when assisted purchase exceeds sign-off threshold.',
          },
        ],
        emailSignature: 'India2World Global Logistics Hub • Airport Cargo Complex, Mumbai 400099 • Email: support@india2world.com',
      },
      securityAudit: {
        sessionTimeoutMinutes: 60,
        enforceAdmin2FA: false,
        rateLimitingEnabled: true,
        auditLogRetentionDays: 180,
      },
    };
    return fallbackSettings;
  }
}

export async function saveCategorySettings<K extends keyof AdminSettingsData>(
  category: K,
  data: AdminSettingsData[K],
  adminUser?: { name?: string; email?: string }
): Promise<{ success: boolean; settings: AdminSettingsData; message?: string }> {
  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partial: { [category]: data },
        adminUser: adminUser || { name: 'Super Admin', email: 'admin@india2world.com' },
      }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || result.message || 'Failed to save settings on server');
    }

    if (result.settings) {
      syncSettingsToLocalStorage(result.settings);
    }
    return result;
  } catch (err: any) {
    console.error(`Error saving ${category} settings:`, err);
    throw err;
  }
}

export async function saveAllAdminSettings(
  settings: AdminSettingsData,
  adminUser?: { name?: string; email?: string }
): Promise<{ success: boolean; settings: AdminSettingsData; message?: string }> {
  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partial: settings,
        adminUser: adminUser || { name: 'Super Admin', email: 'admin@india2world.com' },
      }),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || result.message || 'Failed to save settings on server');
    }

    if (result.settings) {
      syncSettingsToLocalStorage(result.settings);
    }
    return result;
  } catch (err: any) {
    console.error('Error saving all settings:', err);
    throw err;
  }
}

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const res = await fetch('/api/admin/audit-logs');
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return [];
  }
}

export async function fetchSystemHealth(): Promise<any> {
  try {
    const res = await fetch('/api/admin/system-health');
    if (!res.ok) return null;
    const data = await res.json();
    return data.health || null;
  } catch (err) {
    console.error('Error fetching system health:', err);
    return null;
  }
}

export async function downloadSettingsBackup() {
  try {
    const res = await fetch('/api/admin/backup');
    if (!res.ok) throw new Error('Failed to generate configuration backup');
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data.backup || data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `india2world-settings-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true };
  } catch (err: any) {
    console.error('Backup download error:', err);
    throw err;
  }
}

export async function restoreSettingsFromFile(
  fileContent: string,
  adminUser?: { name?: string; email?: string }
): Promise<{ success: boolean; message: string }> {
  try {
    const parsed = JSON.parse(fileContent);
    const backup = parsed.settings ? parsed : { settings: parsed };
    const res = await fetch('/api/admin/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        backup,
        adminUser: adminUser || { name: 'Super Admin', email: 'admin@india2world.com' },
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error || 'Restore failed on server');
    }
    return data;
  } catch (err: any) {
    console.error('Error restoring settings:', err);
    throw err;
  }
}
