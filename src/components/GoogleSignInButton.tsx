import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useClientAuth } from '@/hooks/useClientAuth';
import { LogIn, LogOut, User, Mail } from 'lucide-react';
import EmailAuthDialog from './EmailAuthDialog';

interface GoogleSignInButtonProps {
  className?: string;
  compact?: boolean;
  showEmailOption?: boolean;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ className, compact = false, showEmailOption = true }) => {
  const { isSignedIn, profile, signInWithGoogle, signOut, isLoading } = useClientAuth();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  if (isLoading) return null;

  if (isSignedIn && profile) {
    return (
      <div className={`flex items-center gap-2 ${className || ''}`}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{profile.full_name || profile.email}</span>
        </div>
        {!compact && (
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-1" />
            Sign out
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={`flex flex-wrap items-center gap-2 ${className || ''}`}>
        <Button variant="outline" size="sm" onClick={signInWithGoogle}>
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Sign in with Google
        </Button>
        {showEmailOption && (
          <Button variant="ghost" size="sm" onClick={() => setEmailDialogOpen(true)} className="text-sm">
            <Mail className="h-4 w-4 mr-1.5" />
            Use email instead
          </Button>
        )}
      </div>
      <EmailAuthDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen} />
    </>
  );
};

export default GoogleSignInButton;
