/**
 * Prompts admin to select a payment method when marking a registration as paid.
 * Returns one of the supported methods or null if cancelled / invalid.
 */
export type PaymentMethod = 'mpesa' | 'card' | 'cash_ground' | 'bank_transfer';

export function promptForPaymentMethod(): PaymentMethod | null {
  const raw = window.prompt(
    'Select payment method for this paid registration:\n\n' +
      '  1 = M-Pesa (Paybill / Till)\n' +
      '  2 = Card (Paystack / POS)\n' +
      '  3 = Cash (at gate)\n' +
      '  4 = Bank Transfer\n\n' +
      'Enter 1, 2, 3, or 4:'
  );
  if (raw === null) return null;
  const choice = raw.trim().toLowerCase();
  switch (choice) {
    case '1':
    case 'mpesa':
      return 'mpesa';
    case '2':
    case 'card':
      return 'card';
    case '3':
    case 'cash':
    case 'cash_ground':
      return 'cash_ground';
    case '4':
    case 'bank':
    case 'bank_transfer':
      return 'bank_transfer';
    default:
      window.alert('Invalid choice. Payment method not updated.');
      return null;
  }
}
