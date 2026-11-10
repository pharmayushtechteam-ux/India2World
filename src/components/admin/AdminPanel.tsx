import React, { useState, useEffect } from 'react';
import { AdminTab } from '../../types/admin';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminPurchaseRequestDetails } from './AdminPurchaseRequestDetails';
import { AdminReceivePackage } from './AdminReceivePackage';
import { AdminCreateConsolidation } from './AdminCreateConsolidation';
import {
  AdminPurchaseRequestsList,
  AdminIncomingPackagesList,
  AdminConsolidationList,
} from './AdminLists';
import { AdminShippingManagement } from './AdminShippingManagement';
import { AdminLiveTracking } from './AdminLiveTracking';
import { AdminQuotationsModule } from './AdminQuotationsModule';
import { AdminPurchaseQueueModule } from './AdminPurchaseQueueModule';
import { AdminOrdersModule } from './AdminOrdersModule';
import { AdminExternalPurchaseRequestsModule } from './AdminExternalPurchaseRequestsModule';
import { AdminWarehouseModule } from './AdminWarehouseModule';
import { AdminPaymentsRefundsModule } from './AdminPaymentsRefundsModule';
import { AdminSupportNotificationsModule } from './AdminSupportNotificationsModule';
import { AdminReportsSettingsModule } from './AdminReportsSettingsModule';
import { AdminCustomersModule } from './AdminCustomersModule';

interface AdminPanelProps {
  onNavigateHome: () => void;
  initialTab?: AdminTab;
  currentTab?: AdminTab;
  onSelectTab?: (tab: AdminTab) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onNavigateHome,
  initialTab = 'dashboard',
  currentTab: controlledTab,
  onSelectTab,
}) => {
  const getInitialTab = (): AdminTab => {
    if (controlledTab) return controlledTab;
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (pathParts[0] === 'admin' && pathParts[1]) {
        return pathParts[1] as AdminTab;
      }
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('adminTab') as AdminTab;
      if (tabParam) return tabParam;
    }
    return initialTab;
  };

  const [internalTab, setInternalTab] = useState<AdminTab>(getInitialTab);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('REQ-20482');
  const [searchQuery, setSearchQuery] = useState('');

  const currentTab = controlledTab || internalTab;

  useEffect(() => {
    if (controlledTab && controlledTab !== internalTab) {
      setInternalTab(controlledTab);
    }
  }, [controlledTab]);

  const setCurrentTab = (tab: AdminTab) => {
    setInternalTab(tab);
    if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  const handleSelectRequest = (id: string) => {
    setSelectedRequestId(id);
    setCurrentTab('purchase-request-details');
  };

  const handleNavigateTab = (tab: AdminTab, params?: any) => {
    if (params?.requestId) {
      setSelectedRequestId(params.requestId);
    }
    setCurrentTab(tab);
  };

  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={(tab) => setCurrentTab(tab)}
      onNavigateHome={onNavigateHome}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {/* 1. Dashboard */}
      {currentTab === 'dashboard' && (
        <AdminDashboard
          onNavigateTab={handleNavigateTab}
          onSelectRequest={handleSelectRequest}
        />
      )}

      {/* 2. Customers */}
      {currentTab === 'customers' && (
        <AdminCustomersModule onNavigateTab={handleNavigateTab} />
      )}

      {/* 3. Purchase Requests List */}
      {currentTab === 'purchase-requests' && (
        <AdminPurchaseRequestsList onSelectRequest={handleSelectRequest} />
      )}

      {/* 4. Purchase Request Details */}
      {currentTab === 'purchase-request-details' && (
        <AdminPurchaseRequestDetails
          requestId={selectedRequestId}
          onBack={() => setCurrentTab('purchase-requests')}
          onNavigateConsolidation={() => setCurrentTab('create-consolidation')}
        />
      )}

      {/* 5. Quotations */}
      {currentTab === 'quotations' && (
        <AdminQuotationsModule onNavigateTab={handleNavigateTab} />
      )}

      {/* 6. Purchase Queue (Procurement) */}
      {currentTab === 'purchase-queue' && (
        <AdminPurchaseQueueModule onNavigateTab={handleNavigateTab} />
      )}

      {/* 7. Orders */}
      {currentTab === 'orders' && (
        <AdminOrdersModule onNavigateTab={handleNavigateTab} />
      )}

      {/* 7b. External Purchase Requests */}
      {currentTab === 'external-purchase-requests' && (
        <AdminExternalPurchaseRequestsModule />
      )}

      {/* 8. Incoming Packages List */}
      {currentTab === 'incoming-packages' && (
        <AdminIncomingPackagesList
          onOpenReceivePackage={() => setCurrentTab('receive-package')}
        />
      )}

      {/* 9. Receive Incoming Package */}
      {currentTab === 'receive-package' && (
        <AdminReceivePackage
          onBack={() => setCurrentTab('incoming-packages')}
          onSaved={() => setCurrentTab('incoming-packages')}
        />
      )}

      {/* 10. Warehouse Inventory & Shelf Bins */}
      {currentTab === 'warehouse' && (
        <AdminWarehouseModule onNavigateTab={handleNavigateTab} />
      )}

      {/* 11. Consolidation List */}
      {currentTab === 'consolidation' && (
        <AdminConsolidationList
          onOpenCreateConsolidation={() => setCurrentTab('create-consolidation')}
        />
      )}

      {/* 11b. Create Consolidated Shipment */}
      {currentTab === 'create-consolidation' && (
        <AdminCreateConsolidation
          onBack={() => setCurrentTab('consolidation')}
          onCreated={() => setCurrentTab('consolidation')}
        />
      )}

      {/* 12. Shipping: Dispatch & Carrier Operations */}
      {currentTab === 'shipping' && (
        <AdminShippingManagement onNavigateTab={handleNavigateTab} />
      )}

      {/* 13. Tracking: Live Air Freight Telemetry & Milestones */}
      {currentTab === 'tracking' && (
        <AdminLiveTracking onNavigateTab={handleNavigateTab} />
      )}

      {/* 14. Payments */}
      {currentTab === 'payments' && (
        <AdminPaymentsRefundsModule tab="payments" onNavigateTab={handleNavigateTab} />
      )}

      {/* 15. Refunds */}
      {currentTab === 'refunds' && (
        <AdminPaymentsRefundsModule tab="refunds" onNavigateTab={handleNavigateTab} />
      )}

      {/* 16. Support */}
      {currentTab === 'support' && (
        <AdminSupportNotificationsModule tab="support" onNavigateTab={handleNavigateTab} />
      )}

      {/* 17. Notifications */}
      {currentTab === 'notifications' && (
        <AdminSupportNotificationsModule tab="notifications" onNavigateTab={handleNavigateTab} />
      )}

      {/* 18. Reports */}
      {currentTab === 'reports' && (
        <AdminReportsSettingsModule tab="reports" onNavigateTab={handleNavigateTab} />
      )}

      {/* 19. Settings */}
      {currentTab === 'settings' && (
        <AdminReportsSettingsModule tab="settings" onNavigateTab={handleNavigateTab} />
      )}
    </AdminLayout>
  );
};
