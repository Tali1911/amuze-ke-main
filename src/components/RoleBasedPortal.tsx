
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLog } from '@/hooks/useAuditLog';
import { ROLES } from '@/services/roleService';
import CEODashboard from './portals/CEODashboard';
import MarketingPortal from './portals/MarketingPortal';
import HRPortal from './portals/HRPortal';
import AccountsPortal from './portals/AccountsPortal';
import CoachPortal from './portals/CoachPortal';
import GovernancePortal from './portals/GovernancePortal';
import AdminDashboard from './AdminDashboard';
import PortalSidebar from './PortalSidebar';

const RoleBasedPortal = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Enable automatic page view tracking
  useAuditLog();

  if (!user) {
    return <div>Loading...</div>;
  }

  // Map roles to their respective portal components
  const renderPortalContent = () => {
    switch (user.role) {
      case ROLES.CEO:
        return <CEODashboard activeTab={activeTab} />;
      case ROLES.MARKETING:
        return <MarketingPortal activeTab={activeTab} />;
      case ROLES.HR:
        return <HRPortal activeTab={activeTab} />;
      case ROLES.ACCOUNTS:
        return <AccountsPortal activeTab={activeTab} />;
      case ROLES.COACH:
        return <CoachPortal activeTab={activeTab} />;
      case ROLES.GOVERNANCE:
        return <GovernancePortal activeTab={activeTab} />;
      case ROLES.ADMIN:
        return <AdminDashboard activeTab={activeTab} />;
      default:
        return <AdminDashboard activeTab={activeTab} />;
    }
  };

  return (
    <PortalSidebar 
      userRole={user.role}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      username={user.username}
      department={user.department}
    >
      {renderPortalContent()}
    </PortalSidebar>
  );
};

export default RoleBasedPortal;
