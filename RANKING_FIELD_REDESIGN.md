# Ranking Field — UI redesign + a11y pass

Cross-plugin redesign of the Ranking field so the form builder preview, the public form, and the conversational survey all share the same visual language and a11y posture.

## Paired branches (must ship together)

| Repo | Branch | PR |
|------|--------|------|
| `fluentform/fluentform` | `improve/ranking-field-ui` | [#951](https://github.com/fluentform/fluentform/pull/951) |
| `fluentform/fluentformpro` | `improve/ranking-field-ui` | [#195](https://github.com/fluentform/fluentformpro/pull/195) |
| `WPManageNinja/fluent-conversational-js` | `improve/ranking-field-ui` | [#41](https://github.com/WPManageNinja/fluent-conversational-js/pull/41) |

Base: `dev` on each repo. All draft.

## Visual changes (all three surfaces)

- Row padding **14px 16px → 8px 12px** so rows match neighbouring text-input height.
- Position pill: 32px saturated primary fill + halo shadow → **26px neutral `#f5f7fa` + `#303133` text**.
- Drag handle pulled **out of `__item-main` to the trailing edge**, borderless, recessed `#b9bcc1` (darkens to `#606266` on hover).
- Up/down arrows joined into **one segmented pill** with a hairline divider; **SVG chevrons** (12×12, 1.75 stroke, `currentColor`) replace unicode `↑/↓`.
- Edge buttons stay in DOM with `:disabled` instead of `display:none` / `v-if` — symmetric pill on every row, stable tab order.
- Handle hidden on `(hover: none) / (pointer: coarse)` touch viewports.
- Grid-view actions divider + grid `__index` `top` aligned across all three surfaces.

## A11y improvements

- **Disabled chevron contrast** `#c8cbd0 → #a8acb3` (WCAG 1.4.11, 3:1 for UI components).
- **`focus-visible` outline** — 2px primary, `outline-offset: -2px`, sits flush inside the pill.
- **Focus restoration** after click reorder: walks to the same-direction button on the new row, falls back to the inverse if an edge made it disabled. Browsers no-op `.focus()` on disabled, so this prevents focus stranding on `<body>`.
- **Contextual aria-labels**: `"Move Option 1 up"` instead of generic `"Move up"`.
- **Conversational `focus()` selector** `:not(:disabled)` so `canReceiveFocus` doesn't autofocus a disabled button on render.
- PHP: numbered `%1$s` placeholders + translator comments + sprintf-false guard.
- Admin preview: `cursor: default` since it's non-interactive (no I-beam on hover).

## Theming / portability

- New **`--ff-ranking-accent`** CSS custom property — overrides hover/focus accent without re-skinning. Falls back to `--fluentform-primary`.
- Hard-coded `#dcdfe6 / #409eff / #f4f8ff` swapped for the existing `--fluentform-border-color`, `--fluentform-primary`, `--fluentform-border-radius` tokens.
- Static `rgba(...)` fallback declarations before each `color-mix()` for Safari < 16.2.

## Files touched

**fluentform (free)**
- `resources/assets/admin/components/templates/rankingField.vue`
- `resources/assets/admin/styles/editor.scss`
- `app/Services/FluentConversational/public/css/conversationalForm.css` *(rebuilt)*
- `app/Services/FluentConversational/public/css/conversationalForm-rtl.css` *(rebuilt)*
- `app/Services/FluentConversational/public/js/conversationalForm.js` *(rebuilt)*

**fluentformpro**
- `src/Components/RankingField.php`
- `src/assets/public/ff_ranking.js`
- `src/assets/public/ff_ranking.scss`

**fluent-conversational-js**
- `src/form/components/QuestionTypes/RankingType.vue`
- `src/form/styles/app.scss`

## Pre-merge reviews

Each branch was passed through both `engineering-review` and `pr-reviewer` skills.

| Branch | Critical | High | Medium | Status |
|---|---|---|---|---|
| fluentform | 0 | 0 | 2 | resolved |
| fluentformpro | 0 | 1 (focus loss) | 4 | resolved |
| fluent-conversational-js | 0 | 1 (focus selector) | 2 | resolved |

Blast-radius check confirmed no third-party consumers of the changed class names (`__handle`, `__move`, `__actions`, `__item-main`) outside the changed files. No tests asserted the old `aria-label` strings. SVG strings are static literals — no XSS surface. `$label` is escaped after interpolation via `esc_attr(sprintf(...))`.

## Local verification

Driven via Playwright + Chromium against `https://forms.test/?ff_landing=281` on both desktop (1280×900) and iPhone-13 touch viewport.

- DOM order: `[__item-main, __actions, __handle, hidden input]` ✓
- Disabled-edge buttons: top row's up + bottom row's down disabled, both still rendered ✓
- Click on disabled button: no reorder ✓
- Tab focus chain enters every enabled button with 2px primary outline; skips disabled ✓
- Click reorder: focus restored to the moved item's same-direction button ✓
- Touch viewport: handle hidden, arrows visible ✓
- `--ff-ranking-accent: #e91e63` override: hover/focus turn pink, rest stays neutral ✓
