
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface AdminContentManagerProps {
  currentAdminUsername: string;
}

const AdminContentManager: React.FC<AdminContentManagerProps> = ({ currentAdminUsername }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Content Management</CardTitle>
          <CardDescription>
            Manage website content through the Marketing Portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Content management has been moved to the Marketing Portal. 
              Please use the Marketing Portal's "Content" tab to manage hero slides, programs, 
              announcements, testimonials, team members, and site settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminContentManager;
