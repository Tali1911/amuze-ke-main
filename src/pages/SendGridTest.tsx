import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SendGridTest() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testResend = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to test",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      console.log('🧪 Testing Resend with email:', email);
      
      const { data, error } = await supabase.functions.invoke('test-resend', {
        body: { email: email }
      });

      console.log('Response:', data);
      console.log('Error:', error);

      if (error) {
        setResult({
          success: false,
          error: error.message,
          details: error
        });
        toast({
          title: "Test Failed",
          description: error.message,
          variant: "destructive"
        });
      } else if (data) {
        setResult(data);
        if (data.success) {
          toast({
            title: "Test Successful!",
            description: `Email sent to ${email}. Check your inbox!`,
          });
        } else {
          toast({
            title: "Test Failed",
            description: data.error || "Unknown error",
            variant: "destructive"
          });
        }
      }
    } catch (err: any) {
      console.error('Exception:', err);
      setResult({
        success: false,
        error: err.message,
        exception: true
      });
      toast({
        title: "Exception",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Resend Integration Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              This tool tests the Resend email integration by sending a test email.
              Use this to verify your Resend API key is working correctly.
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <Button onClick={testResend} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Test
                </>
              )}
            </Button>
          </div>

          {result && (
            <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="font-semibold">
                      {result.success ? 'Test Successful!' : 'Test Failed'}
                    </div>
                    
                    {result.success && (
                      <div className="text-sm space-y-1">
                        <div className="text-muted-foreground">
                          Email sent successfully to: <span className="font-mono">{result.details?.recipient || email}</span>
                        </div>
                        <div className="text-muted-foreground">
                          Message ID: <span className="font-mono text-xs">{result.messageId}</span>
                        </div>
                        <div className="text-green-600 font-medium mt-2">
                          ✓ Check your inbox for the test email from Amuse Kenya
                        </div>
                      </div>
                    )}

                    {!result.success && (
                      <div className="text-sm space-y-1">
                        <div className="text-red-600">
                          Error: {result.error}
                        </div>
                        {result.details && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">What this test checks:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Resend API key is configured</li>
              <li>Sender email domain is verified</li>
              <li>Edge function can send emails</li>
              <li>CORS and authentication are working</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
              Common Issues:
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Email domain not verified in Resend (visit resend.com/domains)</li>
              <li>• Invalid API key</li>
              <li>• API key doesn't have proper permissions</li>
              <li>• Edge function not deployed</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
