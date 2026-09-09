import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, Users, Shield } from "lucide-react";
import { CampRegistrationsManager } from './portals/admin/CampRegistrationsManager';
import { ProgramRegistrationsManager } from './portals/admin/ProgramRegistrationsManager';
import MessageCenter from './communication/MessageCenter';
import AnalyticsDashboard from './analytics/AnalyticsDashboard';
import CustomerDashboard from './admin/CustomerDashboard';
import UserManagement from './admin/UserManagement';
import AuditLogsViewer from './admin/AuditLogsViewer';
import { CampReportsTab } from './portals/admin/camp/CampReportsTab';
import SystemAdminPanel from './admin/SystemAdminPanel';
import SystemSettingsPanel from './admin/SystemSettingsPanel';
import LeadSourceAuditPanel from './admin/LeadSourceAuditPanel';
import SecurityPanel from './admin/SecurityPanel';
import CompanyConfigPanel from './admin/CompanyConfigPanel';
import ProfileEditor from './profile/ProfileEditor';
import CoachAvailabilityView from './admin/CoachAvailabilityView';
import BudgetManagement from './portals/accounts/BudgetManagement';
import ExpenseManagement from './portals/accounts/ExpenseManagement';
import { PendingCollections } from './portals/accounts/PendingCollections';

interface AdminDashboardProps {
  activeTab: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab }) => {
  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <SystemSettingsPanel />;
      case 'company':
        return <CompanyConfigPanel />;
      case 'security':
        return <SecurityPanel />;
      case 'system':
        return <SystemAdminPanel />;
      case 'communication':
        return <MessageCenter />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'customer-management':
        return <CustomerDashboard />;
      case 'camp-registrations':
        return <CampRegistrationsManager />;
      case 'program-registrations':
        return <ProgramRegistrationsManager />;
      case 'camp-analytics':
        return <CampReportsTab />;
      case 'audit-logs':
        return <AuditLogsViewer />;
      case 'lead-audit':
        return <LeadSourceAuditPanel />;
      case 'coach-availability':
        return <CoachAvailabilityView />;
      case 'budget':
        return <BudgetManagement />;
      case 'expenses':
        return <ExpenseManagement />;
      case 'collections':
        return <PendingCollections />;
      case 'my-profile':
        return <ProfileEditor />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Active system users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Healthy</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">Currently logged in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No active alerts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Key system metrics and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 border rounded">
              <div>
                <h4 className="font-medium">Database Status</h4>
                <p className="text-sm text-muted-foreground">All systems operational</p>
              </div>
              <Badge variant="default">Healthy</Badge>
            </div>
            <div className="flex justify-between items-center p-3 border rounded">
              <div>
                <h4 className="font-medium">Backup Status</h4>
                <p className="text-sm text-muted-foreground">Managed by Supabase Cloud</p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          System Administration
        </Badge>
      </div>

      {renderTabContent()}
    </div>
  );
};

export default AdminDashboard;
