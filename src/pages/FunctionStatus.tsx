import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FunctionStatus {
  name: string;
  status: 'checking' | 'available' | 'unavailable' | 'error';
  message?: string;
}

export default function FunctionStatus() {
  const [functions, setFunctions] = useState<FunctionStatus[]>([
    { name: 'send-confirmation-email', status: 'checking' },
    { name: 'test-resend', status: 'checking' },
    { name: 'handle-resend-webhooks', status: 'checking' },
  ]);

  const checkFunctions = async () => {
    const updatedFunctions = await Promise.all(
      functions.map(async (func) => {
        try {
          const { data, error } = await supabase.functions.invoke(func.name, {
            body: { test: true }
          });

          if (error) {
            // If we get any error other than "Failed to send", it means function exists
            if (error.message && !error.message.includes('Failed to send')) {
              return {
                ...func,
                status: 'available' as const,
                message: 'Function is deployed and responding'
              };
            }
            return {
              ...func,
              status: 'unavailable' as const,
              message: error.message || 'Function not found'
            };
          }

          return {
            ...func,
            status: 'available' as const,
            message: 'Function is deployed and responding'
          };
        } catch (err: any) {
          return {
            ...func,
            status: 'error' as const,
            message: err.message
          };
        }
      })
    );

    setFunctions(updatedFunctions);
  };

  useEffect(() => {
    checkFunctions();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-5 h-5 animate-spin text-gray-500" />;
      case 'available':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'unavailable':
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Edge Function Status</CardTitle>
            <Button onClick={checkFunctions} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {functions.map((func) => (
              <div
                key={func.name}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(func.status)}
                  <div>
                    <div className="font-mono text-sm">{func.name}</div>
                    {func.message && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {func.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-3">
            <h3 className="font-semibold">Deployment Status</h3>
            
            {functions.some(f => f.status === 'unavailable') && (
              <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  ⚠️ Functions Not Deployed
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  The edge functions are not deployed yet. This happens after code changes.
                </p>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                  <p className="font-medium">What to do:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Edge functions auto-deploy in Lovable when you make changes</li>
                    <li>Wait 1-2 minutes for the deployment to complete</li>
                    <li>Click "Refresh" button above to check status again</li>
                    <li>If still not working after 5 minutes, check Supabase logs</li>
                  </ol>
                </div>
              </div>
            )}

            {functions.every(f => f.status === 'available') && (
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  ✅ All Functions Deployed
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  All edge functions are deployed and responding. You can now test email sending!
                </p>
              </div>
            )}

            <div className="text-sm space-y-2">
              <p className="font-medium">Recent updates:</p>
              <ul className="list-disc list-inside ml-2 text-muted-foreground">
                <li>Migrated from SendGrid to Resend for better email delivery</li>
                <li>Updated all registration forms to use new confirmation email function</li>
                <li>Implemented webhook handler for bounce tracking and email events</li>
                <li>Enhanced email suppression and delivery tracking</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline">
                <a href="/test/sendgrid" target="_blank">
                  Test Resend →
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href="https://supabase.com/dashboard/project/rfmyrqzrwamygvyibdbs/functions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View in Supabase →
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
