export type Page =
  | 'home'
  | 'auth'
  | 'buy-for-me'
  | 'dashboard'
  | 'pricing'
  | 'countries'
  | 'how-it-works'
  | 'help'
  | 'track'
  | 'admin-login'
  | 'admin';

export type DashboardTab =
  | 'overview'
  | 'buy-for-me'
  | 'my-requests'
  | 'my-purchases'
  | 'my-warehouse'
  | 'consolidation'
  | 'shipments'
  | 'payments'
  | 'addresses'
  | 'support'
  | 'notifications'
  | 'profile';

export type BuyForMeStep = 1 | 2 | 3 | 4 | 5;

export interface ProductItem {
  id: string;
  name: string;
  store: 'amazon' | 'myntra' | 'flipkart' | 'tatacliq' | 'ajio' | 'nykaa' | 'other';
  storeName: string;
  url: string;
  imageUrl: string;
  quantity: number;
  size?: string;
  colour?: string;
  priceINR: number;
  remarks?: string;
}

export interface StatCard {
  id: string;
  title: string;
  count: number;
  icon: string;
  color: 'purple' | 'green' | 'orange' | 'red' | 'cyan' | 'blue';
  linkTab: DashboardTab;
}

export interface ActivityItem {
  id: string;
  type: 'payment' | 'consolidation' | 'warehouse' | 'purchase';
  title: string;
  code: string;
  timestamp: string;
  iconBg: string;
  statusText?: string;
}

export interface WarehousePackage {
  id: string;
  packageNumber: string;
  senderStore: string;
  description: string;
  weightKg: number;
  dimensionsCm: string;
  receivedDate: string;
  freeStorageDaysLeft: number;
  photoUrl: string;
  status: 'In Warehouse' | 'Ready for Consolidation' | 'Consolidated' | 'Awaiting Arrival';
  itemsCount: number;
  valueINR: number;
}

export interface ShipmentItem {
  id: string;
  trackingNumber: string;
  carrier: 'DHL Express' | 'FedEx Priority' | 'Aramex' | 'India Post EMS';
  destinationCountry: string;
  destinationCity: string;
  weightKg: number;
  packagesCount: number;
  status: 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Consolidating';
  estimatedDelivery: string;
  timeline: {
    title: string;
    location: string;
    timestamp: string;
    completed: boolean;
  }[];
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  date: string;
  totalItems: number;
  totalAmountINR: number;
  status: 'Admin Review' | 'Quoted' | 'Payment Done' | 'Purchased' | 'Rejected';
  products: ProductItem[];
  quotedDomesticShipping?: number;
  serviceFee?: number;
}
