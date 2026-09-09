import React from 'react';
import InvoiceManagement from './accounts/InvoiceManagement';
import PaymentManagement from './accounts/PaymentManagement';
import BudgetManagement from './accounts/BudgetManagement';
import ExpenseManagement from './accounts/ExpenseManagement';
import FinancialReports from './accounts/FinancialReports';
import MessageCenter from '../communication/MessageCenter';
import AccountsDashboard from './accounts/AccountsDashboard';
import { CampReportsTab } from './admin/camp/CampReportsTab';
import { PendingCollections } from './accounts/PendingCollections';
import VendorManagement from './accounts/VendorManagement';
import BillsManagement from './accounts/BillsManagement';
import ProfileEditor from '../profile/ProfileEditor';
import ClientStatements from './accounts/ClientStatements';
import DataExplorer from './accounts/DataExplorer';
import ActivityCategoriesManager from './accounts/ActivityCategoriesManager';
import ClientDiscounts from './accounts/ClientDiscounts';
import TillReconciliation from './accounts/TillReconciliation';

interface AccountsPortalProps {
  activeTab: string;
}

const AccountsPortal: React.FC<AccountsPortalProps> = ({ activeTab }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AccountsDashboard />;
      case 'collections':
        return <PendingCollections />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'bills':
        return <BillsManagement />;
      case 'vendors':
        return <VendorManagement />;
      case 'payments':
        return <PaymentManagement />;
      case 'budget':
        return <BudgetManagement />;
      case 'expenses':
        return <ExpenseManagement />;
      case 'communication':
        return <MessageCenter />;
      case 'reports':
        return <FinancialReports />;
      case 'client-statements':
        return <ClientStatements />;
      case 'camp-analytics':
        return <CampReportsTab />;
      case 'data-explorer':
        return <DataExplorer />;
      case 'activity-categories':
        return <ActivityCategoriesManager />;
      case 'client-discounts':
        return <ClientDiscounts />;
      case 'till-reconciliation':
        return <TillReconciliation />;
      case 'my-profile':
        return <ProfileEditor />;
      default:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">Accounts Portal</h2>
            <p>Select a section from the sidebar to get started.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderContent()}
    </div>
  );
};

export default AccountsPortal;
