
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { isSupabaseAvailable } from '@/services/supabaseService';

interface DatabaseSchemaSetupProps {
  schemaSetupStatus: 'checking' | 'needed' | 'completed' | 'running';
  schemaStatus: Record<string, boolean>;
  onSetupSchema: () => void;
  onCheckSchema: () => void;
}

const DatabaseSchemaSetup: React.FC<DatabaseSchemaSetupProps> = ({
  schemaSetupStatus,
  schemaStatus,
  onSetupSchema,
  onCheckSchema
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Schema Setup</CardTitle>
        <CardDescription>
          Create and configure the required database tables with proper relationships and security policies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {schemaSetupStatus === 'needed' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Database schema setup is required. This will create all necessary tables and security policies.
            </AlertDescription>
          </Alert>
        )}

        {schemaSetupStatus === 'completed' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Database schema is properly configured with all required tables and security policies.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(schemaStatus).map(([table, exists]) => (
            <div key={table} className="flex items-center justify-between p-2 border rounded">
              <span className="text-sm font-medium">{table}</span>
              <Badge variant={exists ? 'default' : 'secondary'}>
                {exists ? 'Ready' : 'Missing'}
              </Badge>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={onSetupSchema}
            disabled={schemaSetupStatus === 'running' || schemaSetupStatus === 'completed' || !isSupabaseAvailable()}
          >
            {schemaSetupStatus === 'running' ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              'Setup Database Schema'
            )}
          </Button>
          
          <Button variant="outline" onClick={onCheckSchema} disabled={!isSupabaseAvailable()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Check Schema
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseSchemaSetup;
