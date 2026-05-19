# Fluent Forms Entries UI/UX Review

## Scope

Reviewed the live admin entries experience on `forms.test`:

- Form-specific entries: `fluent_forms&route=entries&form_id=388`
- Global entries: `fluent_forms_all_entries`
- Entry detail view opened from global entries

No code changes are proposed here. This is a design improvement plan only.

## Findings

### Form-Specific Entries

- The entries table is difficult to use at narrow admin widths. Important columns such as email, selected options, status, and submitted time are pushed out of view while the sticky actions column remains visible.
- Empty field columns, such as `Image Upload` for the reviewed form, consume visible space even when there is no useful data in the listed rows.
- The actions column uses icon-only buttons. The delete action is visually strong but relies on icon recognition and needs clearer confirmation/tooltip affordance.
- Entry detail loads correctly, but the title `Entries / Serial Number #9` is unclear. It should identify the entry more directly.

### Global Entries

- The sidebar badge showed `Entries 1535`, while the global entries page showed `Total 23`. This appears to be a filtered/current-view count, but the UI does not explain the difference.
- The chart occupies the first viewport before the table. For an entries-management screen, the table should be the primary surface.
- During initial loading, the page briefly presents `Total 0` with skeleton rows before the real data appears. That can be misread as no entries.
- The search placeholder says `Search Forms`, which is misleading on an entries page.
- Active filters are not obvious enough. If a date range, status, or form scope is active, the UI should show that state clearly.

## Recommended Improvements

1. Make the entries list responsive.
   - Use a compact card layout on narrow admin widths.
   - Prioritize entry number, submitter/email, status, submitted time, and actions.
   - Move secondary field values into an expandable row/details area.

2. Improve column defaults.
   - Hide empty columns by default.
   - Let users restore hidden columns from the existing Columns control.
   - Consider per-form remembered column visibility.

3. Clarify counts.
   - Show copy like `Showing 23 filtered entries out of 1535 total`.
   - Keep sidebar/global badge semantics separate from current filtered results.

4. Make filters visible.
   - Add active filter chips such as `Last 30 days`, `All forms`, `Unread only`.
   - Add a clear reset action near the chips.

5. Reprioritize global entries layout.
   - Show the table before the chart.
   - Collapse the chart by default on narrow screens.
   - Keep `Hide Chart` as an optional control rather than a required cleanup step.

6. Tighten copy.
   - Change `Search Forms` to `Search entries` or `Search submissions`.
   - Change `Entries / Serial Number #9` to `Entry #9`.
   - Show `Submission ID #4470` as supporting metadata in the detail header.

7. Improve action affordances.
   - Add tooltips for view/delete actions.
   - Keep delete confirmation explicit.
   - Consider text labels on narrow layouts where space allows.

## Suggested Implementation Phases

### Phase 1: Low-Risk Copy And State Clarity

- Rename search placeholders on entries pages.
- Add filtered-count copy to global entries.
- Improve entry detail title and metadata labels.
- Add visible active filter chips if the data is already available in state.

### Phase 2: Table Usability

- Hide empty columns by default.
- Improve sticky action behavior.
- Add clearer tooltips and confirmation copy for row actions.

### Phase 3: Responsive Redesign

- Add a card-style entries layout for narrow admin widths.
- Move secondary fields into expandable details.
- Collapse the global chart by default on narrow screens.

## Open Questions

- Should global entries default to all-time entries or a recent/date-filtered view?
- Should column visibility be saved per user, per form, or both?
- Should chart visibility be remembered per user?
