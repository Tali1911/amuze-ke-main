
import React from 'react';
import EmployeeManagement from './hr/EmployeeManagement';
import MessageCenter from '../communication/MessageCenter';
import HRDashboard from './hr/HRDashboard';
import { RecruitmentTab, PerformanceTab, TrainingTab, HRReportsTab } from './hr/HRPlaceholderTabs';
import ProfileEditor from '../profile/ProfileEditor';

interface HRPortalProps {
  activeTab: string;
}

const HRPortal: React.FC<HRPortalProps> = ({ activeTab }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HRDashboard />;
      case 'employees':
        return <EmployeeManagement />;
      case 'communication':
        return <MessageCenter />;
      case 'recruitment':
        return <RecruitmentTab />;
      case 'performance':
        return <PerformanceTab />;
      case 'training':
        return <TrainingTab />;
      case 'reports':
        return <HRReportsTab />;
      case 'my-profile':
        return <ProfileEditor />;
      default:
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">HR Portal</h2>
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

export default HRPortal;
