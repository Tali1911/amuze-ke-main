import { useEffect, useRef } from 'react';
import { useClientAuth } from '@/hooks/useClientAuth';
import { GOOGLE_CLIENT_ID } from '@/config/googleAuth';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleOneTapProps {
  onDismiss?: () => void;
}

// Generate a random nonce and its SHA-256 hash (hex). Google receives the
// hashed nonce; Supabase receives the raw nonce so it can verify the id_token.
const generateNonce = async (): Promise<[string, string]> => {
  const raw = btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))
  );
  const enc = new TextEncoder().encode(raw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  const hashed = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return [raw, hashed];
};

const isInCrossOriginIframe = (): boolean => {
  try {
    return window.self !== window.top && window.top?.location.origin !== window.location.origin;
  } catch {
    // Accessing top.location threw -> definitely cross-origin iframe
    return true;
  }
};

const GoogleOneTap = ({ onDismiss }: GoogleOneTapProps) => {
  const { isSignedIn, signInWithIdToken } = useClientAuth();
  const initialized = useRef(false);

  useEffect(() => {
    if (isSignedIn || initialized.current) return;

    // Persisted user dismissal only. Environment-failures (preview iframe,
    // FedCM blocked, etc.) no longer poison this flag.
    const dismissed = sessionStorage.getItem('google_one_tap_dismissed');
    if (dismissed === 'user') return;

    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE')) return;

    // Skip in cross-origin iframes (Lovable preview). One Tap can't render
    // there and would just spam the console with FedCM errors.
    if (isInCrossOriginIframe()) {
      console.info('[GoogleOneTap] Skipped: running inside a cross-origin iframe (preview).');
      return;
    }

    const loadScript = () =>
      new Promise<void>((resolve) => {
        if (window.google?.accounts?.id) return resolve();
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        document.head.appendChild(script);
      });

    const initOneTap = async () => {
      await loadScript();
      if (!window.google?.accounts?.id) return;

      initialized.current = true;

      const [rawNonce, hashedNonce] = await generateNonce();

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashedNonce,
        use_fedcm_for_prompt: false,
        callback: async (response: { credential: string }) => {
          try {
            await signInWithIdToken(response.credential, rawNonce);
          } catch (error) {
            console.error('[GoogleOneTap] sign-in error:', error);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.prompt((notification: any) => {
        // Diagnostic: surface why Google refused to show the prompt.
        try {
          if (notification.isNotDisplayed?.()) {
            console.warn(
              '[GoogleOneTap] not displayed:',
              notification.getNotDisplayedReason?.()
            );
            // Do NOT persist dismissal — it's an environment problem.
            return;
          }
          if (notification.isSkippedMoment?.()) {
            console.warn(
              '[GoogleOneTap] skipped:',
              notification.getSkippedReason?.()
            );
            return;
          }
          if (notification.isDismissedMoment?.()) {
            // Real user dismissal — remember for the session.
            sessionStorage.setItem('google_one_tap_dismissed', 'user');
            onDismiss?.();
          }
        } catch (e) {
          console.warn('[GoogleOneTap] notification handler error:', e);
        }
      });
    };

    const timer = setTimeout(initOneTap, 1500);
    return () => clearTimeout(timer);
  }, [isSignedIn, signInWithIdToken, onDismiss]);

  return null;
};

export default GoogleOneTap;
