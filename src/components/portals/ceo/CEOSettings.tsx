
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Building, Settings, Users, Shield, Bell } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CEOSettings = () => {
  const [companySettings, setCompanySettings] = useState({
    name: "NatureConnect Programs",
    description: "Connecting children with nature through educational outdoor programs",
    address: "123 Forest Lane, Green Valley, CA 95033",
    phone: "(555) 123-4567",
    email: "info@natureconnect.com",
    website: "www.natureconnect.com"
  });

  const [notifications, setNotifications] = useState({
    approvalAlerts: true,
    financialReports: true,
    emergencyAlerts: true,
    weeklyDigest: true,
    marketingUpdates: false
  });

  const [systemSettings, setSystemSettings] = useState({
    autoApprovalLimit: 1000,
    sessionTimeout: 30,
    requireTwoFactor: true,
    auditLogging: true,
    dataBackup: true
  });

  const handleSaveCompany = () => {
    toast({
      title: "Company Settings Updated",
      description: "Company information has been successfully updated.",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notification Preferences Updated",
      description: "Your notification settings have been saved.",
    });
  };

  const handleSaveSystem = () => {
    toast({
      title: "System Settings Updated",
      description: "System configuration has been successfully updated.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Company Settings</h2>
          <p className="text-gray-600">Manage company information and system preferences</p>
        </div>
      </div>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Information
          </CardTitle>
          <CardDescription>
            Update your company details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Company Name</label>
              <Input
                value={companySettings.name}
                onChange={(e) => setCompanySettings({...companySettings, name: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                value={companySettings.email}
                onChange={(e) => setCompanySettings({...companySettings, email: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={companySettings.description}
                onChange={(e) => setCompanySettings({...companySettings, description: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Address</label>
              <Input
                value={companySettings.address}
                onChange={(e) => setCompanySettings({...companySettings, address: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={companySettings.phone}
                onChange={(e) => setCompanySettings({...companySettings, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Website</label>
              <Input
                value={companySettings.website}
                onChange={(e) => setCompanySettings({...companySettings, website: e.target.value})}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleSaveCompany}>
              Save Company Information
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure when and how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Approval Alerts</h4>
                <p className="text-sm text-gray-600">Get notified when items need your approval</p>
              </div>
              <Switch
                checked={notifications.approvalAlerts}
                onCheckedChange={(checked) => setNotifications({...notifications, approvalAlerts: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Financial Reports</h4>
                <p className="text-sm text-gray-600">Receive daily financial summaries</p>
              </div>
              <Switch
                checked={notifications.financialReports}
                onCheckedChange={(checked) => setNotifications({...notifications, financialReports: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Emergency Alerts</h4>
                <p className="text-sm text-gray-600">Critical system and operational alerts</p>
              </div>
              <Switch
                checked={notifications.emergencyAlerts}
                onCheckedChange={(checked) => setNotifications({...notifications, emergencyAlerts: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Weekly Digest</h4>
                <p className="text-sm text-gray-600">Weekly summary of company performance</p>
              </div>
              <Switch
                checked={notifications.weeklyDigest}
                onCheckedChange={(checked) => setNotifications({...notifications, weeklyDigest: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Marketing Updates</h4>
                <p className="text-sm text-gray-600">Updates from marketing campaigns and initiatives</p>
              </div>
              <Switch
                checked={notifications.marketingUpdates}
                onCheckedChange={(checked) => setNotifications({...notifications, marketingUpdates: checked})}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={handleSaveNotifications}>
              Save Notification Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            System Configuration
          </CardTitle>
          <CardDescription>
            Configure system-wide settings and security preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium">Auto-Approval Limit ($)</label>
              <Input
                type="number"
                value={systemSettings.autoApprovalLimit}
                onChange={(e) => setSystemSettings({...systemSettings, autoApprovalLimit: parseInt(e.target.value)})}
              />
              <p className="text-xs text-gray-500 mt-1">Requests below this amount can be auto-approved</p>
            </div>
            <div>
              <label className="text-sm font-medium">Session Timeout (minutes)</label>
              <Input
                type="number"
                value={systemSettings.sessionTimeout}
                onChange={(e) => setSystemSettings({...systemSettings, sessionTimeout: parseInt(e.target.value)})}
              />
              <p className="text-xs text-gray-500 mt-1">Automatic logout after inactivity</p>
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Require Two-Factor Authentication</h4>
                <p className="text-sm text-gray-600">Enforce 2FA for all executive accounts</p>
              </div>
              <Switch
                checked={systemSettings.requireTwoFactor}
                onCheckedChange={(checked) => setSystemSettings({...systemSettings, requireTwoFactor: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Audit Logging</h4>
                <p className="text-sm text-gray-600">Log all administrative actions</p>
              </div>
              <Switch
                checked={systemSettings.auditLogging}
                onCheckedChange={(checked) => setSystemSettings({...systemSettings, auditLogging: checked})}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Automatic Data Backup</h4>
                <p className="text-sm text-gray-600">Daily automated backups of all data</p>
              </div>
              <Switch
                checked={systemSettings.dataBackup}
                onCheckedChange={(checked) => setSystemSettings({...systemSettings, dataBackup: checked})}
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Button onClick={handleSaveSystem}>
              Save System Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CEOSettings;
