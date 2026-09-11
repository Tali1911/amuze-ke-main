# Programs Page section editor — parity with Camp page

## What already exists (verified in code)

The Programs Page editor is already wired the same way as the Camp page:

- **Content tab**: a dedicated "Programs Page" tab in Content Management with a live preview of `/programs`, an "Add Section" button, and the section list.
- **Editor**: reuses the same `HomeSectionEditor` dialog with `scope="programs"`. For both `camp` and `programs` scopes the section-kind options are identical — Custom Section and Cards / Grid Section (no built-in kinds).
- **Ordering**: drag-and-drop reordering via the same sortable list and shared reorder handler that saves `metadata.order` automatically.
- **Per-row controls**: show/hide toggle, edit (opens the Programs-scoped editor), and delete (enabled for custom/cards sections, built-ins can only be hidden) — the same rules as Camp.
- **Public page**: `/programs` renders visible sections ordered by `metadata.order`, using the same custom-section and cards-grid renderers as `/camp`.

So no new editor needs to be built. What remains are two small inconsistencies.

## Changes to make

1. **Fix the stale tab description** in the Programs Page tab: it still says the page "falls back to the default programme cards" when no sections exist. `/programs` no longer falls back — it shows a "page is being prepared" message. Reword to match Camp's wording (add sections/card grids, edit typography, toggle visibility, drag to reorder) and mention the empty-state message.
2. **Clean the stale comment** at the top of `src/pages/Programs.tsx` that describes the removed `ProgramsOverview` fallback, so the file documents the actual CMS-only behaviour like `Camp.tsx`.

## Technical notes

- Files touched: `src/components/portals/marketing/ContentManagement.tsx` (Programs Page `CardDescription` text) and `src/pages/Programs.tsx` (header comment only).
- No database, service-layer, routing, or styling changes; no behaviour change to Camp, Home, or News tabs.
