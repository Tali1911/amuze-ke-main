import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, Mail } from "lucide-react";

const Unsubscribe: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "ready" | "done" | "already" | "invalid">("loading");
  const [email, setEmail] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setStatus("invalid");
        return;
      }
      const client = supabase as any;
      const { data, error } = await client
        .from("email_unsubscribe_tokens")
        .select("email, used_at")
        .eq("token", token)
        .maybeSingle();
      if (error || !data) {
        setStatus("invalid");
        return;
      }
      setEmail(data.email);
      setStatus(data.used_at ? "already" : "ready");
    };
    validate();
  }, [token]);

  const confirmUnsub = async () => {
    if (!email || !token) return;
    setSubmitting(true);
    const client = supabase as any;
    try {
      // Add to suppressions (idempotent: ignore unique conflict)
      await client.from("email_suppressions").insert({
        email,
        suppression_type: "unsubscribe",
        reason: "User unsubscribed via email link",
      });
    } catch {
      /* ignore duplicate */
    }
    await client.from("email_unsubscribe_tokens").update({ used_at: new Date().toISOString() }).eq("token", token);
    // Also update lead preference if present
    try {
      await client
        .from("leads")
        .update({ email_subscribed: false, unsubscribed_at: new Date().toISOString() })
        .eq("email", email);
    } catch {}
    setStatus("done");
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Email Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking your link…
            </div>
          )}
          {status === "invalid" && (
            <div className="flex items-start gap-2 text-destructive">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-medium">Invalid or expired link</p>
                <p className="text-sm text-muted-foreground">
                  Please contact us at hello@amusekenya.co.ke if you'd like to unsubscribe.
                </p>
              </div>
            </div>
          )}
          {status === "already" && (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">You're already unsubscribed</p>
                <p className="text-sm text-muted-foreground">
                  {email} will not receive marketing emails from Amuse Kenya.
                </p>
              </div>
            </div>
          )}
          {status === "ready" && (
            <>
              <p>
                Are you sure you want to unsubscribe <strong>{email}</strong> from Amuse Kenya marketing emails?
              </p>
              <p className="text-sm text-muted-foreground">
                You'll still receive transactional emails like booking confirmations.
              </p>
              <Button onClick={confirmUnsub} disabled={submitting} variant="destructive" className="w-full">
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Confirm Unsubscribe
              </Button>
            </>
          )}
          {status === "done" && (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">You've been unsubscribed</p>
                <p className="text-sm text-muted-foreground">{email} will no longer receive marketing emails.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
