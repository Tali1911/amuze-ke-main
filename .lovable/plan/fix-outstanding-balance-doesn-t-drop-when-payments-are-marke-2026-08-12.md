# Fix: Outstanding balance doesn't drop when payments are marked paid

## Problem

The "Total Outstanding" figure (Accounts Dashboard card, Pending Collections page, AR Aging / outstanding-by-activity reports) is calculated from the `accounts_action_items` table. But most places where a registration is marked as paid only update `camp_registrations.payment_status` and never update the matching action items — so the outstanding totals stay stuck.

Confirmed gaps:
1. **All Registrations tab → bulk "Mark Paid"** (`updatePaymentStatus`) never syncs action items. Primary bug.
2. **Registration Details → Save Payment** (`updatePaymentWithAmount`) syncs action items but matches them by exact child-name equality — name differences (spacing/casing vs. check-in records) silently miss, so only some items update.
3. **Daily Ops quick payment** completes items on "Paid" but syncs nothing on "Partial".
4. Existing data is already drifted: paid registrations whose action items are still pending inflate today's outstanding total.

## Fix

### 1. Sync action items inside `updatePaymentStatus` (client-side safety net)
In `src/services/campRegistrationService.ts`, after a successful update to `'paid'`, mark all pending/in-progress action items for that registration as completed (`amount_paid = amount_due`, `completed_at`, note). Matched by `registration_id` only — no fragile child-name matching. Wrapped in try/catch so it never blocks the payment update.

This one change fixes the bulk "Mark Paid" on the All tab, Daily Ops quick payment, and Invoice Management's "Mark Paid" — they all call this method.

### 2. Harden `updatePaymentWithAmount` child matching
- Normalize child names (trim + lowercase) when matching action items.
- Add a fallback: after per-child updates, if the registration is fully paid, complete any remaining pending items for that `registration_id` that weren't matched by name.

### 3. Database migration: trigger + data reconciliation
New migration file (e.g. `public/supabase/migrations/20260812_sync_action_items_on_payment.sql`):

a) **Trigger** on `camp_registrations` after `payment_status` changes to `'paid'`: auto-complete all pending/in-progress action items for that registration (`amount_paid = amount_due`). This is a server-side backstop so every current and future code path stays in sync.

b) **One-time reconciliation backfill** to repair existing drift:
- Action items still pending/in-progress whose registration is already `paid` → mark completed, `amount_paid = amount_due`.
- Action items whose registration is `partial` → set `amount_paid` pro-rata from the actual completed payments recorded for that registration (capped at `amount_due`).

### 4. Verify
- Mark a registration paid via bulk action on the All tab → confirm it disappears from Pending Collections and the dashboard Total Outstanding drops.
- Record a partial payment → confirm outstanding drops by the paid amount.
- Check AR Aging / outstanding-by-activity reports reflect the same numbers.

## Notes

- Marking a registration back to "unpaid" will **not** auto-reopen completed items (avoids clobbering manually-resolved items); that stays a manual accounts action.
- The migration SQL must be run against the database for the trigger and backfill to take effect; the client-side fix (steps 1–2) works immediately on its own.

## Files touched

- `src/services/campRegistrationService.ts` — sync in `updatePaymentStatus`, hardened matching in `updatePaymentWithAmount`
- `public/supabase/migrations/20260812_sync_action_items_on_payment.sql` — new migration (trigger + backfill)
