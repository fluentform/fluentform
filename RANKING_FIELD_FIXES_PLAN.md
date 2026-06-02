# Ranking Field — Post-Review Fix Plan

Plan for resolving the blocking + High findings from the 5 parallel reviewer passes on PRs #955, #198, #43.

## Findings being addressed

### 🚨 Blocking

- **#43 / conversational — accent picker is dead-code.** `RankingType.vue` sets `--ff-ranking-accent` on the wrapper, but `app.scss` never consumes it. Hover, focus, and drag-over all hardcode `#1a7efb`. Builder picks a colour → zero visual effect on conversational forms.

### ⚠️ Highs

- **#43 / conversational — grid-mode visually-hidden no-op.** `.ff_conv_ranking--grid .ff_conv_ranking__index` is `(0,2,0)`. New `.ff_conv_ranking__index--visually-hidden` modifier is `(0,1,0)` so the grid rule wins. Show-position toggle has no effect when the field is configured as grid display.

- **#198 / fluentformpro — cross-PR colour mismatch with #955.** Pro's response SCSS keeps explicit `color: #303133` + `font-weight: 500`; free (`#955`) removed both to inherit the table cell colour. Result: admin entries view and public after-submit confirmation render the same submission with different colours.

## Fixes

### Fix 1 — Conversational consumes `--ff-ranking-accent`

**File:** `fluent-conversational-js/src/form/styles/app.scss`

Three selectors swap their hardcoded `#1a7efb` for `var(--ff-ranking-accent, #1a7efb)` with `rgba()` fallback where `color-mix()` is used.

- `.ff_conv_ranking__item--over` — border colour + bg tint
- `.ff_conv_ranking__move:hover:not(:disabled)` — bg + text colour
- `.ff_conv_ranking__move:focus-visible` — outline colour

### Fix 2 — Grid-mode visually-hidden specificity

Same file. Compound selector to win:

```scss
.ff_conv_ranking__index.ff_conv_ranking__index--visually-hidden,
.ff_conv_ranking--grid .ff_conv_ranking__index.ff_conv_ranking__index--visually-hidden {
  /* clip-rect sr-only pattern */
}
```

### Fix 3 — Drop explicit colour/weight on Pro response view

**File:** `fluentformpro/src/assets/public/ff_ranking.scss`

- `.ff-ranking-response__position` — remove `color: #303133;`
- `.ff-ranking-response__label` — remove `color: #303133;` and `font-weight: 500;`

Both then inherit the surrounding form context, matching #955's "let table cells cascade" approach. Admin entries and public confirmation now read at the same weight + colour as their surroundings.

## Execution order

1. Apply Fix 1 + Fix 2 in `fluent-conversational-js/src/form/styles/app.scss` → rebuild conversational → commit + push to #43.
2. Apply Fix 3 in `fluentformpro/src/assets/public/ff_ranking.scss` → rebuild pro → commit + push to #198.
3. Commit the rebuilt conversational compiled CSS/JS in `fluentform/app/Services/FluentConversational/public/` → push to #43's paired branch in fluentform (which is `feat/ranking-field-settings`, not `fix/ranking-response-style`) — but the response-style fix branch already has its commits, and the rebuild from this round of fixes lands on the **settings** branch since that's where conversational source changes flow.

Note: the conversational rebuild affects `app/Services/FluentConversational/public/conversationalForm.css` etc. — those compiled artefacts live in `fluentform`. They'll arrive on whichever branch is checked out at build time. Build under `feat/ranking-field-settings` to keep the artefact aligned with the source branch that introduced the SCSS rules.

## Out of scope here

Deferred to follow-ups (cosmetic / pre-existing):

- #43 M-01 `showPositionSerial` allowlist (`=== 'yes'` instead of `!== 'no' && !== false`)
- #43 M-02 a11y aria-live region for reorder announcements
- #955 S-01 admin entries.scss missing `--visually-hidden` rule
- #955 S-02 duplicate `.ff-ranking-response` BEM trees
- #198 CS-01 accent var emitted on response wrapper but response SCSS doesn't consume it

## Files touched (summary)

| Repo | Branch | File |
|---|---|---|
| `fluent-conversational-js` | `feat/ranking-field-settings` | `src/form/styles/app.scss` |
| `fluentformpro` | `fix/ranking-response-style` | `src/assets/public/ff_ranking.scss` |
| `fluentform` | `feat/ranking-field-settings` | `app/Services/FluentConversational/public/*` (rebuilt) |
