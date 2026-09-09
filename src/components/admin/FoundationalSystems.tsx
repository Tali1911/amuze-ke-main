
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Database, 
  BarChart3, 
  Settings
} from "lucide-react";
import { isSupabaseAvailable } from '@/services/supabaseService';

interface FoundationalSystemsProps {
  schemaSetupStatus: 'checking' | 'needed' | 'completed' | 'running';
}

const FoundationalSystems: React.FC<FoundationalSystemsProps> = ({
  schemaSetupStatus
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Foundational Systems</CardTitle>
        <CardDescription>Status of core system components</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 border rounded">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium">Authentication System</h4>
                <p className="text-sm text-muted-foreground">Supabase Auth integration</p>
              </div>
            </div>
            <Badge variant={isSupabaseAvailable() ? 'default' : 'secondary'}>
              {isSupabaseAvailable() ? 'Active' : 'Pending'}
            </Badge>
          </div>

          <div className="flex justify-between items-center p-3 border rounded">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium">Database Services</h4>
                <p className="text-sm text-muted-foreground">CRUD operations for all entities</p>
              </div>
            </div>
            <Badge variant={isSupabaseAvailable() ? 'default' : 'secondary'}>
              {isSupabaseAvailable() ? 'Ready' : 'Pending'}
            </Badge>
          </div>

          <div className="flex justify-between items-center p-3 border rounded">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div>
                <h4 className="font-medium">Audit Logging</h4>
                <p className="text-sm text-muted-foreground">Action tracking and compliance</p>
              </div>
            </div>
            <Badge variant={isSupabaseAvailable() ? 'default' : 'secondary'}>
              {isSupabaseAvailable() ? 'Enabled' : 'Pending'}
            </Badge>
          </div>

          <div className="flex justify-between items-center p-3 border rounded">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-orange-600" />
              <div>
                <h4 className="font-medium">System Configuration</h4>
                <p className="text-sm text-muted-foreground">Global settings management</p>
              </div>
            </div>
            <Badge variant={schemaSetupStatus === 'completed' ? 'default' : 'secondary'}>
              {schemaSetupStatus === 'completed' ? 'Ready' : 'Pending'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FoundationalSystems;
