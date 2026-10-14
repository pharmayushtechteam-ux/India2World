export interface AdminSettingsData {
  general: {
    appName: string;
    tagline: string;
    legalName: string;
    supportEmail: string;
    supportPhone: string;
    officeAddress: string;
    defaultCurrency: string;
    timezone: string;
    dateFormat: string;
    primaryCountry: string;
    customerRegistration: boolean;
    maintenanceMode: boolean;
    maintenanceNotice: string;
  };
  emailSmtp: {
    host: string;
    port: number;
    security: 'STARTTLS' | 'SSL' | 'NONE';
    user: string;
    senderName: string;
    passSet: boolean;
    testRecipient: string;
  };
  customerAccount: {
    registrationMode: 'open' | 'invite' | 'approval';
    emailVerificationRequired: boolean;
    autoActivateOnSignup: boolean;
    blockSuspendedAccounts: boolean;
    passwordResetValidityHours: number;
    dormancyAlertDays: number;
    customerDataPrivacyEnabled: boolean;
    strictCustomerDataIsolation: boolean;
  };
  buyForMe: {
    supportedPlatforms: {
      amazon: boolean;
      flipkart: boolean;
      myntra: boolean;
      tatacliq: boolean;
      ajio: boolean;
      nykaa: boolean;
    };
    urlValidationStrictness: 'strict' | 'permissive';
    autoExtractMetadata: boolean;
    fallbackScraping: boolean;
    maxProductsPerRequest: number;
    maxImageUploadSizeMB: number;
    duplicateProductDetection: 'warn' | 'prevent' | 'allow';
  };
  pricing: {
    buyForMeHandlingFee: number;
    volumetricDivisor: number;
    baseShippingRatePerKg: number;
    expressPrioritySurcharge: number;
    fuelSurchargePercent: number;
    quotationValidityDays: number;
    currencyBufferPercent: number;
    gstTaxPercent: number;
    minChargeableWeightKg: number;
  };
  orderWorkflow: {
    autoConfirmOnPayment: boolean;
    procurementApprovalThresholdINR: number;
    autoGenerateInvoice: boolean;
    allowCustomerCancellation: 'until_procurement' | 'until_payment' | 'never';
    statusTransitionMode: 'strict' | 'flexible';
    failedEmailRetryCount: number;
    orderRetentionDays: number;
  };
  payment: {
    gateways: {
      razorpay: { enabled: boolean; keyId: string; status: 'ready' | 'sandbox' | 'not_configured' };
      stripe: { enabled: boolean; publishableKey: string; status: 'ready' | 'sandbox' | 'not_configured' };
      bankWire: { enabled: boolean; accountNumber: string; bankName: string; ifsc: string; swift: string; status: 'active' };
      paypal: { enabled: boolean; status: 'not_configured' };
    };
    requireTransactionRef: boolean;
    dualApprovalForRefunds: boolean;
    invoicePrefix: string;
    companyGstin: string;
    hsnSacCode: string;
    autoReconcileWebhooks: boolean;
  };
  warehouse: {
    warehouseAddress: string;
    freeStorageDays: number;
    dailyOverageFee: number;
    bayCapacity: number;
    autoAllocateLocker: boolean;
    mandatoryIntakeInspection: boolean;
    mandatoryIntakePhotos: boolean;
  };
  shippingTracking: {
    carriers: {
      dhl: { enabled: boolean; name: string; slaDays: string; status: 'active' };
      fedex: { enabled: boolean; name: string; slaDays: string; status: 'active' };
      aramex: { enabled: boolean; name: string; slaDays: string; status: 'active' };
      ups: { enabled: boolean; name: string; slaDays: string; status: 'available' };
    };
    repackStrategy: 'discard_outer_box' | 'original_box' | 'box_in_box';
    maxPackageDimensionCm: number;
    maxParcelWeightKg: number;
    autoMilestoneEmails: boolean;
    damagedPackageProtocol: 'quarantine' | 'notify_only' | 'return_to_seller';
  };
  adminRoles: {
    roles: Array<{
      roleId: string;
      roleName: string;
      description: string;
      permissions: {
        orders: 'full' | 'view' | 'none';
        procurement: 'full' | 'view' | 'none';
        warehouse: 'full' | 'view' | 'none';
        consolidation: 'full' | 'view' | 'none';
        dispatch: 'full' | 'view' | 'none';
        refunds: 'full' | 'approval_only' | 'none';
        invoices: 'full' | 'view' | 'none';
        settings: 'full' | 'view' | 'none';
      };
    }>;
  };
  notifications: {
    templates: Array<{
      id: string;
      name: string;
      event: string;
      channel: 'email' | 'sms' | 'whatsapp';
      enabled: boolean;
      subject: string;
      description: string;
    }>;
    emailSignature: string;
  };
  securityAudit: {
    sessionTimeoutMinutes: number;
    enforceAdmin2FA: boolean;
    rateLimitingEnabled: boolean;
    auditLogRetentionDays: number;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  adminName: string;
  adminEmail: string;
  category: string;
  action: string;
  details: string;
  ipAddress?: string;
}
