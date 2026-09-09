
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Database, 
  CheckCircle,
  AlertTriangle,
  Table,
  FileText,
  Shield
} from "lucide-react";

interface SystemHealthOverviewProps {
  connectionStatus: 'connected' | 'disconnected';
  schemaSetupStatus: 'checking' | 'needed' | 'completed' | 'running';
  migrationStatus: 'checking' | 'needed' | 'completed' | 'running';
  systemHealth: 'healthy' | 'warning' | 'error';
}

const SystemHealthOverview: React.FC<SystemHealthOverviewProps> = ({
  connectionStatus,
  schemaSetupStatus,
  migrationStatus,
  systemHealth
}) => {
  const getSystemHealthColor = () => {
    switch (systemHealth) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectionStatusBadge = () => {
    return connectionStatus === 'connected' ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Connected
      </Badge>
    ) : (
      <Badge variant="destructive">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Disconnected
      </Badge>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Database Connection</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className={`text-2xl font-bold ${getSystemHealthColor()}`}>
              {connectionStatus === 'connected' ? 'Active' : 'Offline'}
            </div>
            {getConnectionStatusBadge()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Schema Status</CardTitle>
          <Table className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {schemaSetupStatus === 'completed' ? 'Ready' : 
               schemaSetupStatus === 'running' ? 'Setting up' : 'Needs Setup'}
            </div>
            <Badge variant={schemaSetupStatus === 'completed' ? 'default' : 'secondary'}>
              {schemaSetupStatus === 'completed' ? 'Complete' : 'Pending'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Migration Status</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">
              {migrationStatus === 'completed' ? 'Complete' : 
               migrationStatus === 'running' ? 'Running' : 'Pending'}
            </div>
            <Badge variant={migrationStatus === 'completed' ? 'default' : 'secondary'}>
              {migrationStatus === 'completed' ? 'Done' : 'Needed'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Health</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className={`text-2xl font-bold ${getSystemHealthColor()}`}>
              {systemHealth === 'healthy' ? 'Healthy' : 
               systemHealth === 'warning' ? 'Warning' : 'Error'}
            </div>
            <Badge variant={systemHealth === 'healthy' ? 'default' : 'destructive'}>
              {systemHealth.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemHealthOverview;
