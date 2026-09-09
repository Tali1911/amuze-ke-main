import React from 'react';
import { Badge } from "@/components/ui/badge";
import MessageCenter from '../communication/MessageCenter';
import AnalyticsDashboard from '../analytics/AnalyticsDashboard';
import MarketingDashboard from './marketing/MarketingDashboard';
import CustomerManagement from './marketing/CustomerManagement';
import LeadsManagement from './marketing/LeadsManagement';
import ContentManagement from './marketing/ContentManagement';
import { ReportsTab } from './marketing/MarketingTabs';
import EmailCampaignsTab from './marketing/EmailCampaignsTab';
import { FAQManager } from './marketing/FAQManager';
import ServiceLocationsManager from './marketing/ServiceLocationsManager';
import EmailHealthDashboard from './marketing/EmailHealthDashboard';
import EmailDeliveriesTab from './marketing/EmailDeliveriesTab';
import EmailSegmentsTab from './marketing/EmailSegmentsTab';
import EmailSuppressionsTab from './marketing/EmailSuppressionsTab';
import UserEngagementTab from './marketing/UserEngagementTab';
import SiteAnalyticsTab from './marketing/SiteAnalyticsTab';
import RealTimeAnalytics from './marketing/RealTimeAnalytics';
import ProfileEditor from '../profile/ProfileEditor';

interface MarketingPortalProps {
  activeTab: string;
}

const MarketingPortal: React.FC<MarketingPortalProps> = ({ activeTab }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'customers':
        return <CustomerManagement />;
      case 'leads':
        return <LeadsManagement />;
      case 'content':
        return <ContentManagement />;
      case 'campaigns':
        return <EmailCampaignsTab />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'communication':
        return <MessageCenter />;
      case 'reports':
        return <ReportsTab />;
      case 'service-locations':
        return <ServiceLocationsManager />;
      case 'faq':
        return <FAQManager />;
      case 'email-health':
        return <EmailHealthDashboard />;
      case 'email-deliveries':
        return <EmailDeliveriesTab />;
      case 'email-segments':
        return <EmailSegmentsTab />;
      case 'email-suppressions':
        return <EmailSuppressionsTab />;
      case 'user-engagement':
        return <UserEngagementTab />;
      case 'site-analytics':
        return <SiteAnalyticsTab />;
      case 'realtime':
        return <RealTimeAnalytics />;
      case 'my-profile':
        return <ProfileEditor />;
      default:
        return <MarketingDashboard />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Marketing & CRM Portal</h1>
        <Badge variant="outline" className="text-sm sm:text-base px-3 py-1 w-fit">
          Customer Relationship Management
        </Badge>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default MarketingPortal;
