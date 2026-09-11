# Fix: confirmation emails claim "paid online" when the card payment failed or was refunded

## What's happening

Two separate gaps cause the mismatch between the dashboard (correctly "unpaid") and the client's email (looks paid).

1. **The email is sent before the payment result is known.** In `HolidayCampForm.tsx` and `DayCampsProgram.tsx`, the confirmation email is fired in the background immediately after the registration row is created, with `paymentMethod: buttonType === 'pay' ? 'online_payment' : 'cash'`. That value depends only on which button the client clicked — not on whether Paystack actually charged them. The email template then prints `Payment Method: online_payment`, which reads as "paid online". Registration itself is always saved as `payment_status: 'unpaid'`, which is why the dashboard stays correct.

2. **Reversals/refunds after a successful charge are never reconciled.** `paystack-webhook` only handles `charge.success` and acknowledges everything else. If Paystack later reverses or refunds a card charge (`charge.failed`, `refund.processed`, `charge.reversed`, `transfer.reversed`), nothing updates the payment row or registration status, and the client keeps the earlier "payment received" wording.

## Changes

### 1. Make the email reflect actual payment state
- Send the confirmation email with a payment status derived from real data, not from the button:
  - `payment_status = 'unpaid'` → show **"Payment pending — pay online from My Registrations or on arrival"**.
  - `'partial'` → show amount paid vs balance due.
  - `'paid'` → show **"Paid online"** plus the Paystack reference.
- In the pay-now flow, delay the confirmation email until the Paystack modal closes (success, cancel, or error) and pass the verified outcome. In the register-only flow, send immediately as unpaid.
- Apply to `src/components/forms/HolidayCampForm.tsx` and `src/components/forms/DayCampsProgram.tsx` (the two forms passing `online_payment`).

### 2. Update the email template
- In `supabase/functions/send-confirmation-email/index.ts`, replace the raw `paymentMethod` echo in both HTML blocks with a proper billing block: Total, Amount Paid, Balance Due, Status label, and reference when present. Never print raw internal values like `online_payment`.

### 3. Handle failures, reversals and refunds in the webhook
- In `supabase/functions/paystack-webhook/index.ts`, add handling for `charge.failed`, `charge.reversed`, `refund.processed`, and `refund.failed`:
  - mark the matching `payments` row `failed` / `refunded` (idempotent by reference),
  - recompute total paid excluding non-completed rows,
  - reset `camp_registrations.payment_status` (and `billing_doc_type`) accordingly,
  - keep returning 200 so Paystack stops retrying.
- Send a short "payment could not be completed / has been refunded" notice to the client so the last email they hold matches reality.

## Technical notes
- No schema change needed if `payments.status` already accepts `failed`/`refunded` text values; the code writes those strings only.
- Reconciliation math reuses the existing formula: total = `total_amount - discount_amount`, paid = sum of completed payments excluding `camp_registration_attempt` rows.
- Refund events carry the transaction reference under `data.transaction_reference`; fall back to `data.reference` when absent.
- Webhook must remain signature-verified and idempotent; all new branches are safe to receive twice.
