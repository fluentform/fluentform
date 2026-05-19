# Fluent Forms Design Context

## Design System

Fluent Forms admin uses Vue 2, Element UI, existing Fluent Forms components, and SCSS tokens. New UI work should use the existing component vocabulary before introducing new patterns.

## Visual Direction

- Product register, restrained color strategy.
- White and light neutral admin surfaces with Fluent blue as the primary action/selection color.
- Use existing token variables and Element UI states for borders, text, hover, active, disabled, and danger states.
- Keep cards to real framed tools, repeated items, modals, and empty states. Do not nest decorative cards.

## Layout

- Prioritize predictable admin layouts: header, toolbar, filters, table, pagination.
- Keep high-frequency controls near the table they affect.
- Move secondary actions into dropdowns when the toolbar becomes crowded.
- Avoid duplicate information: if pagination shows total, top summaries should only explain loading or active filter context.
- On narrow admin widths, show essential row data first and move secondary details into expandable rows.

## Typography

- Use the existing admin font stack and sizes.
- Keep headings compact inside dashboards, tables, settings, and cards.
- Prefer short labels and one-line helper text.
- Avoid hero-scale type in product surfaces.

## Tables

- Tables should support scanning, comparison, and repeated action.
- Default visible columns should avoid empty data when possible.
- Important actions need accessible names and tooltips.
- Counts belong to pagination unless filter context needs clarification.
- Empty states should say what happened and offer the next action.

## Copy

- Use concise operational copy.
- Avoid restating page titles.
- Avoid vague help text. Tie guidance to a visible action.
- Use "entries" consistently for submission list surfaces.
- Use "integration feeds" for per-form integration configurations.

## Accessibility

- Icon-only controls need accessible labels.
- Toggle controls should expose expanded/collapsed state where relevant.
- Native browser title tooltips should not be the only label for controls.
- Empty states and filter summaries should be readable without relying on color alone.

## Responsive Behavior

- WordPress admin sidebars reduce usable width, so design for cramped desktop widths as well as mobile.
- Prefer structural changes over shrinking text.
- Use expandable rows or compact row summaries for secondary data.
- Keep touch/click targets usable on narrow screens.
