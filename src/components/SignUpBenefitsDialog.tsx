import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useClientAuth } from '@/hooks/useClientAuth';
import { Zap, Tag, Sparkles, Shield, X, Mail } from 'lucide-react';
import EmailAuthDialog from './EmailAuthDialog';

interface SignUpBenefitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const benefits = [
  {
    icon: Zap,
    title: 'Fast & Seamless Registration',
    description: 'Your details are saved and auto-filled every time you register — no retyping needed.',
  },
  {
    icon: Tag,
    title: 'Exclusive Discounted Pricing',
    description: 'Signed-in families get access to special rates and early-bird offers on camps and programs.',
  },
  {
    icon: Sparkles,
    title: 'Personalised Experience',
    description: 'We remember your children\'s details, preferences, and past activities to tailor recommendations.',
  },
  {
    icon: Shield,
    title: 'One-Time Safety Consent',
    description: 'Read and accept the participation consent form once — it carries over to all future registrations automatically.',
  },
];

const SignUpBenefitsDialog = ({ open, onOpenChange }: SignUpBenefitsDialogProps) => {
  const { signInWithGoogle } = useClientAuth();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  const handleSignIn = async () => {
    onOpenChange(false);
    await signInWithGoogle();
  };

  const handleEmailClick = () => {
    onOpenChange(false);
    setEmailDialogOpen(true);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('benefits_dialog_dismissed', 'true');
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-bold text-foreground">
              Make Registration Effortless
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Sign in once and never fill forms from scratch again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              onClick={handleSignIn}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>

            <div className="flex items-center gap-2 my-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              variant="outline"
              onClick={handleEmailClick}
              className="w-full font-medium"
            >
              <Mail className="w-4 h-4 mr-2" />
              Continue with email
            </Button>

            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="text-muted-foreground text-sm"
            >
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <EmailAuthDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen} />
    </>
  );
};

export default SignUpBenefitsDialog;
