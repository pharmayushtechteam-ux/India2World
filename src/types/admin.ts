export type AdminTab =
  | 'dashboard'
  | 'customers'
  | 'purchase-requests'
  | 'purchase-request-details'
  | 'quotations'
  | 'purchase-queue'
  | 'orders'
  | 'incoming-packages'
  | 'receive-package'
  | 'warehouse'
  | 'consolidation'
  | 'create-consolidation'
  | 'shipping'
  | 'tracking'
  | 'payments'
  | 'refunds'
  | 'support'
  | 'notifications'
  | 'reports'
  | 'settings';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Admin' | 'Warehouse Staff' | 'Support Agent';
  avatar: string;
}

export interface AdminProductItem {
  id: number;
  name: string;
  store: 'amazon.in' | 'myntra' | 'flipkart' | 'tatacliq' | 'ajio' | 'nykaa' | string;
  storeLogo?: string;
  specs: string;
  priceINR: number;
  qty: number;
  totalINR: number;
  status: 'Pending Review' | 'Approved' | 'Price Changed' | 'Out of Stock' | 'Restricted';
  imageUrl: string;
}

export interface CostSummary {
  productCost: number;
  domesticShipping: number;
  serviceFee: number;
  tax: number;
  discount: number;
  total: number;
}

export interface AdminPurchaseRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerAvatar: string;
  destinationCountry: string;
  destinationCity: string;
  countryCode: string;
  submittedAt: string;
  submittedAgo: string;
  status: 'Under Review' | 'Quote Ready' | 'Awaiting Payment' | 'Purchasing' | 'Purchased' | 'Submitted';
  itemsCount: number;
  totalAmountINR: number;
  products: AdminProductItem[];
  costSummary: CostSummary;
}

export interface AdminShipment {
  id: string;
  customerId: string;
  customerName: string;
  destination: string;
  status: 'In Transit' | 'Departed' | 'Customs' | 'Delivered' | 'Pending';
  date?: string;
  departureDate?: string;
  estimatedArrival?: string;
  packageCount?: number;
  chargeableWeightKg?: number;
  carrier?: string;
  trackingNumber?: string;
}

export interface AdminIncomingPackage {
  id: string;
  customerId: string;
  customerName: string;
  requestId: string;
  seller: string;
  sellerOrderNumber: string;
  trackingNumber: string;
  courier: string;
  arrivalDate: string;
  actualWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  condition: 'Good' | 'Damaged' | 'Repackaged';
  warehouseLocation: string;
  photos: string[];
  status: 'Received' | 'Inspected' | 'Consolidated' | 'Dispatched';
}

export interface ConsolidationPackageItem {
  id: string;
  packageCode: string;
  seller: string;
  weightKg: number;
  status: 'Received' | 'Ready';
  imageUrl: string;
  selected?: boolean;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  totalOrders: number;
  totalSpentINR: number;
  status: 'Active' | 'Inactive';
  avatar: string;
  joinedDate: string;
}
