
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { isSupabaseAvailable } from '@/services/supabaseService';

interface DataMigrationProps {
  migrationStatus: 'checking' | 'needed' | 'completed' | 'running';
  migrationProgress: number;
  schemaSetupStatus: 'checking' | 'needed' | 'completed' | 'running';
  onRunMigration: () => void;
  onCheckSystemStatus: () => void;
}

const DataMigration: React.FC<DataMigrationProps> = ({
  migrationStatus,
  migrationProgress,
  schemaSetupStatus,
  onRunMigration,
  onCheckSystemStatus
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Migration</CardTitle>
        <CardDescription>
          Migrate data from localStorage to Supabase database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {migrationStatus === 'needed' && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Data migration is required to enable full system functionality. 
              This will move all localStorage data to Supabase.
            </AlertDescription>
          </Alert>
        )}

        {migrationStatus === 'running' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Migration Progress</span>
              <span>{migrationProgress}%</span>
            </div>
            <Progress value={migrationProgress} className="w-full" />
          </div>
        )}

        {migrationStatus === 'completed' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Data migration completed successfully. All systems are ready to use.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button 
            onClick={onRunMigration}
            disabled={migrationStatus === 'running' || migrationStatus === 'completed' || schemaSetupStatus !== 'completed' || !isSupabaseAvailable()}
          >
            {migrationStatus === 'running' ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Migrating...
              </>
            ) : (
              'Start Migration'
            )}
          </Button>
          
          <Button variant="outline" onClick={onCheckSystemStatus} disabled={!isSupabaseAvailable()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataMigration;
