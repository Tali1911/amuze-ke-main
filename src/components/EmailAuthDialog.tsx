import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';

interface EmailAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emailSchema = z.string().trim().email({ message: 'Please enter a valid email' }).max(255);
const passwordSchema = z.string().min(8, { message: 'Password must be at least 8 characters' }).max(72);
const nameSchema = z.string().trim().min(2, { message: 'Please enter your full name' }).max(100);

const EmailAuthDialog = ({ open, onOpenChange }: EmailAuthDialogProps) => {
  const { signInWithEmail, signUpWithEmail, resetPassword } = useClientAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Sign in
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');

  // Sign up
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');

  // Forgot
  const [fpEmail, setFpEmail] = useState('');

  const reset = () => {
    setSiEmail(''); setSiPassword('');
    setSuName(''); setSuEmail(''); setSuPassword('');
    setFpEmail('');
    setSignupSuccess(false); setResetSuccess(false);
    setLoading(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRes = emailSchema.safeParse(siEmail);
    if (!emailRes.success) return toast({ title: 'Invalid email', description: emailRes.error.errors[0].message, variant: 'destructive' });
    if (!siPassword) return toast({ title: 'Password required', variant: 'destructive' });
    setLoading(true);
    const { error } = await signInWithEmail(emailRes.data, siPassword);
    setLoading(false);
    if (error) {
      toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Welcome back!' });
      handleClose(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameRes = nameSchema.safeParse(suName);
    if (!nameRes.success) return toast({ title: 'Invalid name', description: nameRes.error.errors[0].message, variant: 'destructive' });
    const emailRes = emailSchema.safeParse(suEmail);
    if (!emailRes.success) return toast({ title: 'Invalid email', description: emailRes.error.errors[0].message, variant: 'destructive' });
    const pwRes = passwordSchema.safeParse(suPassword);
    if (!pwRes.success) return toast({ title: 'Weak password', description: pwRes.error.errors[0].message, variant: 'destructive' });

    setLoading(true);
    const { error } = await signUpWithEmail(emailRes.data, pwRes.data, nameRes.data);
    setLoading(false);
    if (error) {
      const msg = error.message.includes('already') ? 'An account with this email already exists. Try signing in instead.' : error.message;
      toast({ title: 'Sign up failed', description: msg, variant: 'destructive' });
    } else {
      setSignupSuccess(true);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRes = emailSchema.safeParse(fpEmail);
    if (!emailRes.success) return toast({ title: 'Invalid email', description: emailRes.error.errors[0].message, variant: 'destructive' });
    setLoading(true);
    const { error } = await resetPassword(emailRes.data);
    setLoading(false);
    if (error) {
      toast({ title: 'Reset failed', description: error.message, variant: 'destructive' });
    } else {
      setResetSuccess(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Continue with email</DialogTitle>
          <DialogDescription>
            Sign in or create an account to save your details for future registrations.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as typeof tab); setSignupSuccess(false); setResetSuccess(false); }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="forgot">Forgot</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label htmlFor="si-email">Email</Label>
                <Input id="si-email" type="email" value={siEmail} onChange={(e) => setSiEmail(e.target.value)} autoComplete="email" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="si-password">Password</Label>
                <Input id="si-password" type="password" value={siPassword} onChange={(e) => setSiPassword(e.target.value)} autoComplete="current-password" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sign in
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            {signupSuccess ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                <h4 className="font-semibold">Check your email</h4>
                <p className="text-sm text-muted-foreground">
                  We've sent a confirmation link to <strong>{suEmail}</strong>. Click it to activate your account.
                </p>
                <Button variant="outline" onClick={() => handleClose(false)} className="w-full">Done</Button>
              </div>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="su-name">Full name</Label>
                  <Input id="su-name" value={suName} onChange={(e) => setSuName(e.target.value)} autoComplete="name" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" value={suEmail} onChange={(e) => setSuEmail(e.target.value)} autoComplete="email" required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="su-password">Password</Label>
                  <Input id="su-password" type="password" value={suPassword} onChange={(e) => setSuPassword(e.target.value)} autoComplete="new-password" required minLength={8} />
                  <p className="text-xs text-muted-foreground">At least 8 characters.</p>
                </div>
                <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                  <Mail className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  We'll send a confirmation link to verify your email.
                </p>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create account
                </Button>
              </form>
            )}
          </TabsContent>

          <TabsContent value="forgot">
            {resetSuccess ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
                <h4 className="font-semibold">Check your email</h4>
                <p className="text-sm text-muted-foreground">
                  If an account exists for <strong>{fpEmail}</strong>, we've sent a password reset link.
                </p>
                <Button variant="outline" onClick={() => handleClose(false)} className="w-full">Done</Button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="fp-email">Email</Label>
                  <Input id="fp-email" type="email" value={fpEmail} onChange={(e) => setFpEmail(e.target.value)} autoComplete="email" required />
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll send a reset link if an account exists for this email.
                </p>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send reset link
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EmailAuthDialog;
