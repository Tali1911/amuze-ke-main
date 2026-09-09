// Paystack inline checkout helper.
// Loads the official inline JS once and exposes a typed openPaystackCheckout().

const PAYSTACK_INLINE_URL = 'https://js.paystack.co/v2/inline.js';
export const PAYSTACK_PUBLIC_KEY = 'pk_live_f19af6f851fbc0615819ba14187530c3c36c0de9';

let loadPromise: Promise<void> | null = null;

export const loadPaystackScript = (): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  // Already loaded
  if ((window as any).PaystackPop) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${PAYSTACK_INLINE_URL}"]`
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Paystack')));
      return;
    }
    const script = document.createElement('script');
    script.src = PAYSTACK_INLINE_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Paystack'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
};

export interface PaystackOptions {
  email: string;
  amountKES: number; // amount in KES (we convert to kobo)
  reference?: string;
  metadata?: Record<string, any>;
  channels?: Array<'card' | 'bank' | 'mobile_money' | 'ussd' | 'bank_transfer'>;
  onSuccess: (reference: string) => void;
  onClose?: () => void;
}

export const openPaystackCheckout = async (opts: PaystackOptions) => {
  await loadPaystackScript();
  const PaystackPop = (window as any).PaystackPop;
  if (!PaystackPop) throw new Error('Paystack SDK unavailable');

  const popup = new PaystackPop();
  popup.newTransaction({
    key: PAYSTACK_PUBLIC_KEY,
    email: opts.email,
    amount: Math.max(0, Math.round(opts.amountKES * 100)), // convert KES to kobo
    currency: 'KES',
    ref: opts.reference,
    channels: opts.channels ?? ['card', 'mobile_money', 'bank', 'bank_transfer'],
    metadata: opts.metadata,
    onSuccess: (tx: { reference: string }) => opts.onSuccess(tx.reference),
    onCancel: () => opts.onClose?.(),
  });
};

export const generatePaystackReference = (prefix = 'AMU') =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
