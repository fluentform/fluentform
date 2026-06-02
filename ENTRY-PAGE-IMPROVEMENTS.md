# Entry Page Improvement Backlog

## Principles

- Keep the page aligned with the existing WordPress admin and Element UI patterns.
- Prioritize functional correctness, keyboard accessibility, performance, then visual polish.
- Avoid new visual systems unless they are already used on this page.

---

## 1 · UI and UX

### 1.1 Accessible labels for icon-only row actions
- Add `aria-label="View entry"` to the eye-icon router-link in the
  Actions column.
- Add `aria-label="Delete entry"` to the trash el-button in the Actions
  column.
- Match the existing UX writing tone: sentence case, no period, action verb first.

### 1.2 Bulk action affordance
- Surface bulk-action controls in the existing toolbar row when one or
  more entries are selected. Do **not** introduce a thick-bordered
  banner or floating card.
- Reuse `<btn-group>` styling already in the action row.

### 1.3 Persist column visibility per user × form
- Already implemented via `storeColumnSettings` + `visibleColumns`
  Vuex state. Verify on the next column change that the persistence
  survives logout / new device.

### 1.4 Persist compact view per user × form
- Current `localStorage['compactView']` is global. Migrate to
  `ff_entries_compact_<form_id>` keyed per form, mirroring the
  precedent set by `ff_entries_pinned_col_<form_id>`.

### 1.5 Empty state copy
- When the filtered query returns zero rows, render:
  - **Heading:** _No entries match these filters._
  - **Action:** inline text link _Clear filters_ that resets
    `entry_type`, `selectedPaymentStatuses`, `filter_date_range`,
    `search_string`, and `advanced_filter` to their initial state.
- Single line, no card wrapper, no illustration. Avoids the
  visual weight of an unnecessary empty-state card.

### 1.6 Loading state policy
- **First table load:** `el-skeleton` (existing).
- **Filter / pagination / sort change:** inline `el-loading` directive
  on the table only, no full-page overlay.
- **Form switching:** no overlay; the navigation reload is itself the
  loading state. Hide the form-switcher menu immediately on selection
  so the dropdown does not flash unfiltered state before reload
  (already implemented).
- Motion must be intentional and purposeful — no decorative spinners
  on simple table updates.

### 1.7 Row focus / hover / selection consistency across fixed columns
- **Hover state:** `#eef6ff` background on `:hover` / `.hover-row` rows
  via `entries.scss` (the rule near "`el-table--enable-row-hover ...
  background-color: #eef6ff`"). Element UI mirrors the `hover-row`
  class to fixed-column clones so the highlight spans the visible row.
- **Focus / current row:** `highlight-current-row` + `setCurrentRow`
  in `handleRowFocusIn` apply Element UI's `.current-row` class with
  `#e6f2ff` background. Focus on the row itself or any descendant
  promotes the row to current via the focusin handler.
- **State separation:** hover (`#eef6ff`) → current/focus (`#e6f2ff`)
  → click navigates. The two blues are deliberately close so
  hover-then-focus produces a subtle deepening rather than a colour
  jump. No bespoke palette — both shades sit in Element UI's
  primary-light range.

### 1.8 Rendered-page verification
- Confirm the page uses the existing WP admin font stack.
- Verify table padding holds on narrow viewports.
- Verify Element UI default text colors remain readable against striped rows.
- Verify View and Delete button focus states remain visible against adjacent cells.

---

## 2 · Keyboard and Accessibility

### 2.1 Tab order discipline
Per-row tab stops (in DOM order):
1. Selection checkbox.
2. Row itself (`tabindex="0"` applied via `applyRowTabindex`).
3. View button (router-link in Actions column).
4. Trash button (`el-button` in Actions column).

Explicitly `tabindex="-1"`:
- `#` column router-link (serial number).
- `.ff_entry_status_dot` (using native `title`, not `el-tooltip`, to
  prevent Element UI from re-adding tabindex).
- Favorite star span.
- Read / unread toggle span.
- Restore button span (trashed entries).

### 2.2 Row Enter opens entry detail
- `handleTableKeydown` Enter branch routes to `handleRowClick` when
  `event.target.matches('tr.el-table__row')`. Uses
  `stopImmediatePropagation` to prevent Element UI's internal
  `highlight-current-row` handler from running a second time.

### 2.3 ArrowUp / ArrowDown move exactly one row
- `@keydown.native.capture` on `<el-table>` plus
  `stopImmediatePropagation()` in both arrow branches.
- For a focused row: move focus to the adjacent row.
- For a focused descendant (checkbox, view, trash): move focus to the
  same column in the adjacent row, found via `td` cell index.

### 2.4 Form switcher keyboard contract
Persist as a regression checklist at
`docs/qa/entries-form-switcher.md`:
- Opening the dropdown auto-focuses the search input.
- `↓` from input → focus first non-disabled item.
- `↓` / `↑` on items → move within the list (capture-phase listener).
- `↑` on the first item → focus returns to the search input.
- `Enter` on the input with results → select the first non-disabled
  match.
- `Enter` on a focused item → trigger the underlying click via
  Element UI's `@command`.
- Selection hides the menu DOM immediately so no filter-state flash
  before page navigation.

### 2.5 Focus-visible styling for icon-only controls
- 3px solid `#1f2d3d` outline with 2px offset on
  `.ff_entries_table a:focus-visible` and
  `.ff_entries_table .el-button:focus-visible`. Avoids #21 low-
  contrast labels and ensures the ring stands out against both the
  blue view button and the red trash button.

### 2.6 Screen-reader names
- Status dot: `role="img"` with
  `aria-label="Status: <getStatusName(status)>"`.
- View button: `aria-label="View entry"` (see §1.1).
- Trash button: `aria-label="Delete entry"` (see §1.1).
- Confirm `<th>` headers carry meaningful `aria-sort` when sortable
  (deferred to a separate audit).

---

## 3 · PHP and Query Performance

> Backend performance work. Listed here so the backlog stays the single
> source of truth for this page.

### 3.1 List query review
- Audit `Submission::customQuery` and any callers for repeated joins,
  per-row meta lookups, and N+1s in the entries listing.

### 3.2 Selective field loading
- Restrict the SELECT to columns actually rendered by the visible
  column set, not the full row.

### 3.3 Indexes
- `fluentform_submissions` already has `form_id_status` and
  `form_id_created_at`.
- Review whether favorite/status views need a composite index that
  includes `is_favourite`.
- Review whether `(form_id, created_at, id)` is worth adding for stable
  submission-date sorting and pagination.
- Move the lazy `fluentform_entry_details.submission_id` index check
  into migration/install-time schema management, and audit whether
  report/filter paths also need `(form_id, field_name)`.

### 3.4 Pagination count caching
- Investigate whether the count query during paginated views can be
  cached or computed once per filter combination.

### 3.5 JSON parsing in list views
- Avoid decoding the full `response` JSON for list rendering when
  normalized entry-details rows already carry the values used.

### 3.6 Advanced filter profiling
- Run profiles against the largest production-shaped table available
  and capture timings for the slowest advanced-filter shapes.

---

## 4 · Overall Maintenance

### 4.1 Playwright regression for row keyboard nav
- Add a Playwright spec covering:
  1. Per-row tab stops are exactly four (checkbox / row / view /
     trash).
  2. `Enter` on a focused row routes to the entry detail.
  3. `↑` / `↓` on a focused row moves focus by exactly one row.
  4. `:focus-visible` outline renders on view and trash buttons.
- Persist the spec at
  `tests/playwright/entries-keyboard.spec.ts`. Exit-coded so it gates
     CI.

### 4.2 Accepted visual deviations
- Maintain `docs/qa/entries-ignore.md` listing intended visual
  deviations of fixed-column rendering, focus indicator placement,
  status-dot color choices, and any warnings we deliberately accept.

### 4.3 Form switcher coverage
- See §2.4 — the regression checklist at
  `docs/qa/entries-form-switcher.md` is the single source of truth.
- Add a Playwright spec mirroring it:
  `tests/playwright/entries-form-switcher.spec.ts`.

### 4.4 Critique snapshot artifact
- After each non-trivial Entries-page change, persist a critique pass
  at `docs/qa/entries-critique/<YYYY-MM-DD>__<slug>.md` summarizing:
  the change, the risks it could trigger, and the verification steps run.

### 4.5 Element UI alignment discipline
- Any future table change must reuse Element UI 2.15 components
  (`el-table`, `el-table-column`, `el-button`, `el-dropdown`) and
  existing tokens. No bespoke colors, no inline magic numbers for
  spacing, no nested cards.

---

## Appendix · Items the backlog explicitly defers

- Form switcher button relocation — discussed and intentionally
  skipped this iteration.
- "Sortable" column header honesty (Submitted at / Entry Status /
  Amount currently advertise sort arrows but only sort the visible
  page client-side) — separate refactor.
- Absolute date inline with relative timestamps — separate UX issue.
- Donor view tab for payment forms — strategic feature, not polish.
- Bulk select-all-across-pages — out of scope.
