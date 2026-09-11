# Fix missing children in the camp attendance register

## Goal
Find the exact shared reason Zola, Adama, Muritu, and Kaleb were absent from the 14 August 2026 attendance register, correct it, and prevent valid online registrations from being silently omitted again.

## Plan
1. **Verify the affected records before changing logic**
   - Inspect each named child's `camp_registrations` row and child JSON for registration status, payment status, camp type, location, selected dates/sessions, and creation time.
   - Compare those rows with any `camp_attendance` records for 14 August 2026.
   - Record which exact attendance condition rejects each child; do not infer the cause from payment status or the confirmation email.

2. **Fix the confirmed failing path**
   - Correct the responsible fetch, lifecycle-status, date-normalization, or stored-data path only after the row comparison identifies it.
   - Reuse the existing timezone-safe local-date utilities for any date correction.
   - Preserve the existing paid/unpaid grouping, attendance actions, optimistic behavior, and UI design.

3. **Repair affected data if necessary**
   - If the online submissions contain malformed/missing attendance dates or an incorrect lifecycle status, add a narrowly scoped, auditable migration to repair only demonstrably affected registrations.
   - Include required grants and preserve RLS rules if database objects are added or changed.

4. **Add regression coverage and verify**
   - Add tests using the confirmed production row shape and a multi-child/date scenario.
   - Verify all four children appear for 14 August 2026 under the correct paid/unpaid section and that unrelated or cancelled registrations remain excluded.
   - Check both a direct page load and date/filter changes so the register cannot silently lose records after refresh.

## Confirmed technical context
- The attendance page currently fetches registrations, then silently excludes every row whose `status` is not exactly `active`.
- It then requires an exact string match between the selected date and `children[].selectedDates`; no normalization is applied at this boundary.
- Payment status only chooses the Paid or Unpaid section and is not itself an attendance eligibility condition.
- The online holiday-camp form writes `status: active` and copies its selected date strings into `children[].selectedDates`.
- The project uses an external database connection that is not exposed to the workspace database-query tool, so the four live rows must be inspected through an authenticated project context before selecting the fix.