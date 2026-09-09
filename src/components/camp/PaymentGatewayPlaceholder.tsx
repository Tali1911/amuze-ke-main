import React from 'react';
import { CreditCard } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const PaymentGatewayPlaceholder: React.FC = () => {
  return (
    <Alert>
      <CreditCard className="h-4 w-4" />
      <AlertTitle>Secure online payment available</AlertTitle>
      <AlertDescription>
        Click <strong>Register &amp; Pay Now</strong> to pay securely via Paystack
        (Card, M-Pesa or Bank). Prefer to pay later? Use <strong>Register Only</strong> and
        complete payment from <strong>My Registrations</strong> or at the camp.
      </AlertDescription>
    </Alert>
  );
};
