import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  openPaystackCheckout,
  generatePaystackReference,
} from '@/lib/paystack';

export interface PayWithPaystackButtonProps {
  registrationId: string;
  email: string;
  amountKES: number;
  parentName?: string;
  programName?: string;
  registrationNumber?: string;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  label?: string;
  variant?: 'default' | 'outline' | 'secondary';
  onPaid?: (info: { reference: string; status: string; amountPaid: number }) => void;
}

export const PayWithPaystackButton: React.FC<PayWithPaystackButtonProps> = ({
  registrationId,
  email,
  amountKES,
  parentName,
  programName,
  registrationNumber,
  size = 'default',
  className,
  label = 'Pay Now',
  variant = 'default',
  onPaid,
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!email || !amountKES || amountKES <= 0 || !registrationId) {
      toast.error('Missing payment details');
      return;
    }
    setLoading(true);
    try {
      const reference = generatePaystackReference('AMU');
      await openPaystackCheckout({
        email,
        amountKES,
        reference,
        metadata: {
          registrationId,
          registrationNumber,
          parentName,
          programName,
          custom_fields: [
            {
              display_name: 'Registration',
              variable_name: 'registration_number',
              value: registrationNumber || registrationId,
            },
          ],
        },
        onSuccess: async (ref) => {
          try {
            const { data, error } = await supabase.functions.invoke('paystack-verify', {
              body: { reference: ref, registrationId },
            });
            if (error) throw error;
            if (!data?.success) {
              // Verification failed — already logged server-side
              toast.error(
                data?.error
                  ? `Payment could not be verified: ${data.error}`
                  : 'Payment could not be verified. Please contact support with reference ' + ref
              );
              return;
            }
            toast.success(
              data.status === 'paid'
                ? 'Payment received in full. Thank you!'
                : `Partial payment recorded (KES ${Number(data.amountPaid || 0).toLocaleString()} of KES ${Number(data.totalAmount || 0).toLocaleString()}).`
            );
            onPaid?.({ reference: ref, status: data.status, amountPaid: data.amountPaid });
          } catch (err) {
            console.error('Verify error:', err);
            // Log unsuccessful verification attempt
            try {
              await supabase.functions.invoke('paystack-verify', {
                body: {
                  reference: ref,
                  registrationId,
                  logFailure: true,
                  failureReason: 'verification_error',
                  attemptedAmountKES: amountKES,
                },
              });
            } catch {}
            toast.error(
              'Payment processed but verification failed. Please contact support with reference ' +
                ref
            );
          } finally {
            setLoading(false);
          }
        },
        onClose: () => {
          // User closed the Paystack modal — log a cancelled attempt
          toast.info('Payment cancelled. You can try again anytime.');
          supabase.functions
            .invoke('paystack-verify', {
              body: {
                reference,
                registrationId,
                logFailure: true,
                failureReason: 'cancelled_by_user',
                attemptedAmountKES: amountKES,
              },
            })
            .catch((e) => console.warn('Could not log cancelled attempt:', e));
          setLoading(false);
        },
      });
    } catch (err) {
      console.error('Paystack open error:', err);
      toast.error('Could not start payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={loading}
      size={size}
      variant={variant}
      className={className}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4 mr-2" />
      )}
      {loading ? 'Processing...' : label}
    </Button>
  );
};

export default PayWithPaystackButton;
