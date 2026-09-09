import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Mail, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface EmailDelivery {
  id: string;
  email: string;
  message_id: string;
  recipient_type: string;
  recipient_id: string;
  email_type: string;
  subject: string;
  status: string;
  sent_at: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  bounce_reason?: string;
  postmark_data?: any;
}

interface Registration {
  id: string;
  registration_number: string;
  camp_type: string;
  parent_name: string;
  email: string;
  phone: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
}

export default function EmailTestMonitor() {
  const [emailDeliveries, setEmailDeliveries] = useState<EmailDelivery[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      // Fetch recent email deliveries
      const { data: emails, error: emailError } = await (supabase as any)
        .from("email_deliveries")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(20);

      if (emailError) {
        console.error("Error fetching email deliveries:", emailError);
        toast({
          title: "Error",
          description: `Failed to load email deliveries: ${emailError.message}`,
          variant: "destructive",
        });
      } else {
        setEmailDeliveries((emails || []) as EmailDelivery[]);
      }

      // Fetch recent registrations
      const { data: regs, error: regError } = await supabase
        .from("camp_registrations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (regError) {
        console.error("Error fetching registrations:", regError);
        toast({
          title: "Error",
          description: `Failed to load registrations: ${regError.message}`,
          variant: "destructive",
        });
      } else {
        setRegistrations(regs || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Set up real-time subscription for email_deliveries
    const emailChannel = supabase
      .channel("email-deliveries-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "email_deliveries",
        },
        (payload) => {
          console.log("📧 Email delivery change:", payload);
          toast({
            title: "New Email Event",
            description: `Email ${payload.eventType}: ${(payload.new as any)?.email || "Unknown"}`,
          });
          loadData();
        },
      )
      .subscribe();

    // Set up real-time subscription for camp_registrations
    const regChannel = supabase
      .channel("registrations-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "camp_registrations",
        },
        (payload) => {
          console.log("📝 New registration:", payload);
          toast({
            title: "New Registration",
            description: `Registration created for ${(payload.new as any)?.parent_name}`,
          });
          loadData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(emailChannel);
      supabase.removeChannel(regChannel);
    };
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      sent: { color: "bg-blue-100 text-blue-800", icon: Mail },
      delivered: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      opened: { color: "bg-purple-100 text-purple-800", icon: Mail },
      clicked: { color: "bg-indigo-100 text-indigo-800", icon: CheckCircle },
      bounced: { color: "bg-red-100 text-red-800", icon: XCircle },
      spam: { color: "bg-orange-100 text-orange-800", icon: AlertTriangle },
    };

    const variant = variants[status] || { color: "bg-gray-100 text-gray-800", icon: Clock };
    const Icon = variant.icon;

    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Test Monitor</h1>
          <p className="text-muted-foreground">Real-time email delivery tracking and debugging</p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{emailDeliveries.length}</div>
            <p className="text-xs text-muted-foreground">Total Emails Tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {emailDeliveries.filter((e) => e.status === "delivered").length}
            </div>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {emailDeliveries.filter((e) => e.status === "bounced").length}
            </div>
            <p className="text-xs text-muted-foreground">Bounced</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{registrations.length}</div>
            <p className="text-xs text-muted-foreground">Recent Registrations</p>
          </CardContent>
        </Card>
      </div>

      {/* Email Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle>Email Deliveries (Real-time)</CardTitle>
        </CardHeader>
        <CardContent>
          {emailDeliveries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No email deliveries tracked yet. Submit a registration form to see emails appear here in real-time.
            </div>
          ) : (
            <div className="space-y-4">
              {emailDeliveries.map((email) => (
                <div key={email.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="font-semibold">{email.email}</div>
                      <div className="text-sm text-muted-foreground">{email.subject}</div>
                    </div>
                    {getStatusBadge(email.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Message ID:</span>
                      <div className="font-mono text-xs break-all">{email.message_id}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <div>{email.email_type}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sent At:</span>
                      <div>{formatDate(email.sent_at)}</div>
                    </div>
                    {email.delivered_at && (
                      <div>
                        <span className="text-muted-foreground">Delivered At:</span>
                        <div>{formatDate(email.delivered_at)}</div>
                      </div>
                    )}
                    {email.opened_at && (
                      <div>
                        <span className="text-muted-foreground">Opened At:</span>
                        <div>{formatDate(email.opened_at)}</div>
                      </div>
                    )}
                    {email.bounced_at && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Bounced At:</span>
                        <div>{formatDate(email.bounced_at)}</div>
                        {email.bounce_reason && (
                          <div className="text-red-600 text-xs mt-1">Reason: {email.bounce_reason}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {email.postmark_data && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground">View Raw Data</summary>
                      <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                        {JSON.stringify(email.postmark_data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Registrations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Registrations (Real-time)</CardTitle>
        </CardHeader>
        <CardContent>
          {registrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No registrations yet.</div>
          ) : (
            <div className="space-y-3">
              {registrations.map((reg) => (
                <div key={reg.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{reg.parent_name}</div>
                      <div className="text-sm text-muted-foreground">{reg.email}</div>
                      <div className="text-sm text-muted-foreground">{reg.phone}</div>
                    </div>
                    <div className="text-right">
                      <Badge>{reg.camp_type}</Badge>
                      <div className="text-sm mt-1">{reg.registration_number}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Created: {formatDate(reg.created_at)} | Amount: KES {reg.total_amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Navigate to any camp registration form (e.g., Easter Camp)</p>
          <p>2. Fill out the form with a real email address you can check</p>
          <p>3. Submit the registration</p>
          <p>4. Watch this dashboard for real-time updates:</p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>New registration will appear in "Recent Registrations"</li>
            <li>Email delivery tracking will appear in "Email Deliveries"</li>
            <li>Check your email inbox for the confirmation email</li>
            <li>Status will update from "sent" → "delivered" → "opened" as you interact with the email</li>
          </ul>
          <p className="font-semibold mt-4">Expected Sender: amusekenya@gmail.com</p>
          <p className="font-semibold">Expected Subject: Registration Confirmed - [Camp Name]</p>
        </CardContent>
      </Card>
    </div>
  );
}
