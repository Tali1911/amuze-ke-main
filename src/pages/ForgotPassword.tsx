import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getPublicBase } from '@/lib/publicUrl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().trim().email('Please enter a valid email address').max(255);
const RESEND_SECONDS = 60;

const ForgotPassword = () => {
  const [params] = useSearchParams();
  const backTo = params.get('from') === 'admin' ? '/admin' : '/';
  const [email, setEmail] = useState(params.get('email') || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => { document.title = 'Forgot Password | Amuse Kenya'; }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    const res = emailSchema.safeParse(email);
    if (!res.success) { setError(res.error.errors[0].message); return; }
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(res.data, {
      redirectTo: `${getPublicBase()}/reset-password`,
    });
    setLoading(false);
    if (err && !/user not found/i.test(err.message)) {
      setError(/rate|seconds/i.test(err.message)
        ? 'Too many requests. Please wait a minute and try again.'
        : err.message);
      return;
    }
    setSent(true);
    setCooldown(RESEND_SECONDS);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md glass-card animate-fade-in">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {sent ? <Mail className="h-6 w-6 text-primary" /> : <KeyRound className="h-6 w-6 text-primary" />}
          </div>
          <CardTitle>{sent ? 'Check your email' : 'Forgot your password?'}</CardTitle>
          <CardDescription>
            {sent
              ? <>If an account exists for <strong className="text-foreground">{email.trim()}</strong>, we've sent a link to reset your password.</>
              : "Enter the email you use to sign in and we'll send you a reset link."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />The link expires after 1 hour.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />Check your spam or promotions folder if it doesn't arrive.</li>
              </ul>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <Button variant="outline" className="w-full" onClick={send} disabled={loading || cooldown > 0}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend link'}
              </Button>
              <button type="button" onClick={() => { setSent(false); setError(null); }} className="w-full text-sm text-primary hover:underline">
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="fp-email">Email address</Label>
                <Input
                  id="fp-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  autoComplete="email"
                  autoFocus
                  aria-invalid={!!error}
                  aria-describedby={error ? 'fp-error' : undefined}
                />
                {error && <p id="fp-error" className="text-sm text-destructive" role="alert">{error}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send reset link
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="justify-center">
          <Link to={backTo} className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;
