# Client Statements: what the terms mean, and why the numbers look wrong

## What each term is supposed to mean

- **Charges** — what the family owes for the camp days their children actually attended (per child, per registration).
- **Payments** — money received against those registrations.
- **Balance** (running) — Charges minus Payments accumulated down the ledger.
- **Balance Due** — the family's remaining unpaid amount.
- **Total Outstanding** (top card) — the portal-wide unpaid amount.

## Why they don't make sense today (code-level cause, confirmed)

In `src/components/portals/accounts/ClientStatements.tsx`:

1. **Charges are derived, not read from a ledger.** For each attendance row the charge is taken from the registration's `children[].price` / `children[].amount`, falling back to `total_amount / number_of_children`. If those fields are empty/zero (or the registration row isn't returned), the charge silently becomes **0** — so every line renders as "check-in", which is exactly what both screenshots show. Payments, by contrast, come from the real `payments` table, so a statement can show KES 7,500 paid against KES 0 charged and a negative running balance (-5,000, -7,500).

2. **Balance Due is clamped.** `balanceDue = Math.max(0, totalCharged - totalPaid)`, so as soon as charges collapse to 0 the family shows **KES 0 balance due** regardless of reality.

3. **Total Outstanding comes from a different source entirely.** The card sums pending `accounts_action_items` (`amount_due - amount_paid`) for the whole portal, while each statement is built from attendance + payments. The two are computed from unrelated data, so 1,582,416.66 outstanding can coexist with every visible client showing 0 due.

The one thing this diagnosis does not yet confirm is *why* the per-child amounts are zero in the data (missing `price` in `children`, `total_amount = 0`, or registrations not returned by the query). That needs a data check before the fix, and it is step 1 below.

## Fix plan

### 1. Verify the data (first step, no code change)
Query the registrations behind a few affected statements (Adarsh Shah, Bastien Maucet) and check: `total_amount`, the `children` JSON shape and whether it carries a price, and whether the matching `accounts_action_items` rows have sensible `amount_due`. This tells us whether the amounts are missing in the source data or just unreadable by this page.

### 2. Make `accounts_action_items` the single source of charges
Pending Collections, the dashboard's Total Outstanding, and the AR reports already use `accounts_action_items` as the ledger. Client Statements should too:

- Build each statement line from action items (`amount_due`, `amount_paid`, `child_name`, `camp_type`, `created_at`) instead of recomputing per-child prices from attendance.
- Keep attendance rows only as informational, zero-value "check-in" lines when there is no matching action item.
- Fall back to the registration-derived amount only when an action item genuinely has no `amount_due`.

Result: a family's Balance Due, their row in Pending Collections, and the Total Outstanding card all add up from the same numbers.

### 3. Stop hiding inconsistencies
- Remove the `Math.max(0, ...)` clamp on Balance Due; show a credit (negative balance) as **"Credit / Overpaid KES X"** instead of a misleading KES 0.
- When a statement has payments but zero charges, show an explicit "Charges not recorded" note on the line rather than an em dash, so accounts can see it needs attention.

### 4. Label the totals so they are self-explanatory
- Rename the summary tiles to **Total Charges (attended days)**, **Total Payments Received**, **Balance Due (unpaid)**.
- Add a caption to the Total Outstanding card: "Across all clients, from pending collections."
- Apply the same labels in the PDF/print/CSV exports so downloads match the screen.

### 5. Verify
Pick two families with a known balance and confirm: statement Balance Due equals their Pending Collections total, and the sum of all statement balances reconciles with Total Outstanding.

## Files touched

- `src/components/portals/accounts/ClientStatements.tsx` — ledger source, balance handling, labels, exports
- possibly `src/services/accountsActionService.ts` — shared helper for reading action-item ledgers per family
