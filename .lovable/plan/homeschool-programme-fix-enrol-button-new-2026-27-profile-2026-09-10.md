# Homeschool Programme: fix Enrol button + new 2026/27 profile

## Why the Enrol button does nothing

The form silently fails validation, so nothing is submitted and no message appears:

- The package list shown to families comes from the content editor (Explorer / Adventurer / Naturalist), but the form only accepts three old hard-coded package codes (`1-day-discovery`, `weekly-pod`, `project-based`). Whatever a family picks is rejected.
- "Allergies" is treated as a required text box even though it is labelled optional, so leaving it blank blocks submission.
- "Focus Areas" demands at least one tick.
- None of these three failures print a visible error next to the field, so the button just looks dead.

Fix: accept the real package options, make allergies genuinely optional, remove Focus Areas entirely, show an error under every field that fails, and scroll the page to the first problem.

## New page content

Rewrite the page around the 2026/27 profile:

- Heading: Amuse Homeschool — Explorers & Adventure. Ages 3 and below to 15. Year-round, outdoor, led by trained facilitators, a fresh theme every month.
- Two package cards:
  - **Explorers** — once a week (Wednesday or Friday), half day 9:00 AM – 1:00 PM, signature activities in a fun exploratory format.
  - **Adventure** — twice a week (Wednesday and Friday), full day 9:00 AM – 4:00 PM, includes a 20-minute professional training block for signature activities, focus rotating between the two days.
  - Both keep an editable price field so you can fill in per-session pricing from the content editor.
- **The Five Learning Segments** as a collapsible list (closed by default so the page stays light): Outdoor & Sport Skills, Bushcraft & Survival Skills, Life Skills, Free Play, Creative Skills — each expanding to its examples, plus a Signature Activity entry (horse riding, archery and mountain biking at select venues) explaining how it differs by package.
- A short note that families can switch packages at term boundaries, that monthly/quarterly/annual commitments and siblings attract discounts, and that current per-session pricing is confirmed by the team.
- The existing "Available Activities" list stays.
- "Focus Areas" is removed from the page and the form.

## Session dates, QR code and registration details

Homeschool enrolments currently go to their own table with no dates, no QR code and no attendance record. To match the camps experience:

- Families choose their session dates on the form the same way as camps: Explorers picks Wednesday **or** Friday dates, Adventure automatically takes both days.
- The available dates are managed in the admin calendar/content editor like camp dates, so only published dates can be chosen.
- On submit, the enrolment is recorded as a camp-style registration of type "Homeschooling", which gives it a registration number, a downloadable QR code, a confirmation email with the chosen dates, and visibility in the admin All / Attendance / Daily Operations and Accounts pages exactly like a camp booking.
- Existing lead capture, consent forms, refund policy and duplicate/rate-limit protection stay as they are.

## Technical notes

- `src/components/forms/HomeschoolingProgram.tsx`: schema fix (dynamic package ids from config, `allergies` optional, drop `focus`), per-field error output, `scrollToError`, new content sections with an accordion for the five segments, day/date selection per child.
- `src/hooks/useHomeschoolingPageConfig.tsx`: replace default packages with Explorers/Adventure (frequency, day, hours, price, features), add `segments` (title, blurb, examples) and `signatureActivity`, remove `focusAreas` from `formConfig`.
- Date source: reuse `useCampDatesForLocation` / `MultiDatePicker` with a `homeschooling` camp type; Adventure preselects both weekly days.
- Submission: route through `campRegistrationService.createRegistration` with `camp_type: 'homeschooling'`, per-child `selectedDates` and `selectedSessions` (half for Explorers, full for Adventure), `qrCodeService` QR data, invoice creation and `send-confirmation-email` — mirroring `HolidayCampForm`. Keep writing the homeschooling lead record for the marketing pipeline.
- `programRegistrationService.homeschoolingService.create` drops the `focus` column write; the existing admin homeschooling views drop the focus display.
- Update the homeschooling section editor in the CMS to edit packages, segments and prices; remove focus-area fields.
