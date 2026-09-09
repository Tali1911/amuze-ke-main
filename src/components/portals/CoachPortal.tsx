
import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import MessageCenter from '../communication/MessageCenter';
import CoachDashboard from './coach/CoachDashboard';
import { ProgramsTab, ScheduleTab, StudentsTab, ResourcesTab, ReportsTab } from './coach/CoachTabs';
import { CampRegistrationsManager } from './admin/CampRegistrationsManager';
import CoachAvailability from '../coach/CoachAvailability';
import ProfileEditor from '../profile/ProfileEditor';
import { useAuth } from '@/hooks/useAuth';
import { coachAccessService, CampTabId } from '@/services/coachAccessService';

interface CoachPortalProps {
  activeTab: string;
}

const CoachPortal: React.FC<CoachPortalProps> = ({ activeTab }) => {
  const { user } = useAuth();
  const [visibleTabs, setVisibleTabs] = useState<CampTabId[]>([]);

  useEffect(() => {
    if (user?.id) {
      coachAccessService.getAccessInfo(user.id).then(info => {
        setVisibleTabs(info.visibleTabs);
      });
    }
  }, [user?.id]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'programs':
        return <ProgramsTab />;
      case 'schedule':
        return <ScheduleTab />;
      case 'students':
        return <StudentsTab />;
      case 'availability':
        return <CoachAvailability />;
      case 'resources':
        return <ResourcesTab />;
      case 'reports':
        return <ReportsTab />;
      case 'communication':
        return <MessageCenter />;
      case 'record-portal':
        return <CampRegistrationsManager visibleTabs={visibleTabs} />;
      case 'my-profile':
        return <ProfileEditor />;
      default:
        return <CoachDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Coach Portal</h1>
        <Badge variant="outline" className="text-sm sm:text-base px-3 py-1 w-fit">
          Coaching Management
        </Badge>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default CoachPortal;
