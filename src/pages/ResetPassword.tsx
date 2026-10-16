import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, Circle, Eye, EyeOff, Lock, AlertTriangle, ArrowLeft } from 'lucide-react';

const rules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'An uppercase and a lowercase letter', test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: 'A number', test: (p: string) => /\d/.test(p) },
  { label: 'A symbol (e.g. ! @ #)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const ResetPassword = () => {
  const navigate = useNavigate();
  const [hasRecoverySession, setHasRecoverySession] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = 'Reset Password | Amuse Kenya';
    const hash = window.location.hash;
    const hashError = new URLSearchParams(hash.replace(/^#/, '')).get('error_description');
    if (hashError) { setHasRecoverySession(false); return; }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) setHasRecoverySession(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasRecoverySession(true);
      else if (!hash.includes('access_token') && !window.location.search.includes('code=')) setHasRecoverySession(false);
    });
    const timeout = setTimeout(() => setHasRecoverySession((v) => (v === null ? false : v)), 8000);
    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const passed = useMemo(() => rules.map((r) => r.test(password)), [password]);
  const score = passed.filter(Boolean).length;
  const strength = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][score];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passed[0]) return setError('Password must be at least 8 characters.');
    if (password.length > 72) return setError('Password must be 72 characters or fewer.');
    if (score < 3) return setError('Please choose a stronger password.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(/same/i.test(err.message) ? 'Your new password must be different from the old one.' : err.message);
      return;
    }
    setSuccess(true);
    await supabase.auth.signOut();
    setTimeout(() => navigate('/'), 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md glass-card animate-fade-in">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {success ? <CheckCircle2 className="h-6 w-6 text-primary" />
              : hasRecoverySession === false ? <AlertTriangle className="h-6 w-6 text-destructive" />
              : <Lock className="h-6 w-6 text-primary" />}
          </div>
          <CardTitle>
            {success ? 'Password updated' : hasRecoverySession === false ? 'Link expired' : 'Set a new password'}
          </CardTitle>
          <CardDescription>
            {success ? 'You can now sign in with your new password. Redirecting…'
              : hasRecoverySession === false ? 'This reset link is invalid or has expired. Request a new one to continue.'
              : 'Choose a strong password you have not used before.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Button className="w-full" onClick={() => navigate('/')}>Continue</Button>
          ) : hasRecoverySession === false ? (
            <Button className="w-full" onClick={() => navigate('/forgot-password')}>Request a new link</Button>
          ) : hasRecoverySession === null ? (
            <div className="py-6 flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary" /> Verifying your reset link…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <div className="relative">
                  <Input id="password" type={show ? 'text' : 'password'} value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    autoComplete="new-password" autoFocus className="pr-10" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {password && (
                  <div className="space-y-1">
                    <Progress value={(score / 4) * 100} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">Strength: <span className="font-medium text-foreground">{strength}</span></p>
                  </div>
                )}
                <ul className="space-y-1 pt-1">
                  {rules.map((r, i) => (
                    <li key={r.label} className={`flex items-center gap-2 text-xs ${passed[i] ? 'text-primary' : 'text-muted-foreground'}`}>
                      {passed[i] ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}{r.label}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm new password</Label>
                <Input id="confirm" type={show ? 'text' : 'password'} value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }} autoComplete="new-password" />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">Passwords do not match.</p>
                )}
              </div>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update password
              </Button>
            </form>
          )}
        </CardContent>
        {!success && (
          <CardFooter className="justify-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ResetPassword;
