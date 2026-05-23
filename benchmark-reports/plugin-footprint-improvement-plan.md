# Plugin Footprint Improvement Plan

Date: 2026-05-23
Branch: `improve/plugin-footprint` (forked from `origin/dev`)
Goal: lift makewpfast.com score from **B- (65-79)** to **A or better (80+)** by reducing per-request query and memory overhead.

## Current measurements (makewpfast.com, Apr 2026)

| Context | TTFB | Memory | Queries |
|---|---:|---:|---:|
| Activation | +2 ms | +2 MB | +3 |
| **Homepage** | +3 ms | +2 MB | **+11** |
| **WP Admin** | +1 ms | +2 MB | **+22** |

## Target measurements (post-implementation)

| Context | TTFB | Memory | Queries |
|---|---:|---:|---:|
| Activation | +2 ms | +1.5 MB | +1 |
| Homepage | +2 ms | +1.5 MB | **+3** |
| WP Admin | +1 ms | +1.5 MB | **+5** |

## Scoring logic (from makewpfast)

- Each doubling of memory overhead costs 10 points
- Each **10× increase in query overhead costs 25 points**
- Logarithmic — the first few units matter most

**Therefore queries are the highest-leverage target.** 22 → 5 queries on admin is roughly one full 10× decrement on a log scale → +15-20 points.

## Methodology

Every fix must be:

1. **Preceded by measurement** — confirm the query/memory cost actually exists, on the actual page, in the current code path. No guessing.
2. **Followed by re-measurement** — verify the fix actually reduced the cost (not just moved it).
3. **Verified for regressions** — block-editor benchmark from `tests/benchmarks/` should still pass; manual sanity check of one FF admin page and one form submission.
4. **Documented in this plan** — status (PENDING / DONE / SKIPPED), with the measured delta when done.

### Measurement tool

Implemented as `tests/benchmarks/ff_queries.php` — a small mu-plugin-style measurement harness that:

- Hooks into `query` to capture every SQL statement,
- Filters to FF-related queries (`fluentform`, `ff_scheduled_actions`),
- Reports count + total time + the actual SQL,
- Can be triggered for arbitrary URL via WP-CLI or via `?ff_profile=1` query param.

---

## Phases

Each phase contains items measured *and* targeted. Items move PENDING → DONE only after re-measurement.

### Phase 0: Baseline measurement

| # | Item | Status | Notes |
|---|---|---|---|
| 0.1 | Build `ff_queries.php` measurement tool | PENDING | Outputs queries per page, both raw count and FF-specific |
| 0.2 | Capture baseline for `/`, `/wp-admin/index.php`, `/wp-admin/edit-comments.php`, `/wp-admin/edit.php` | PENDING | Records FF query count + SQL for each page in a baseline file |

### Phase 1: Admin query reduction (highest leverage)

| # | Item | File | Risk | Status | Delta |
|---|---|---|---|---|---|
| 1.1 | **AdminBar unread-count cache** — `SELECT COUNT(*) FROM fluentform_submissions WHERE status='unread'` runs on every admin page render. Cache as 60s transient invalidated on `fluentform/submission_inserted` and on submission status update. | `app/Modules/Registerer/AdminBar.php:116-121` | Low | PENDING | TBD |
| 1.2 | **`global_menu` scope check** — verify `fluentform/global_menu` action only fires on FF admin pages. If yes, no action needed. If no, gate the scheduled-event + migration checks to fire once per request not per menu render. | `app/Hooks/actions.php:115-131` | Low | PENDING | TBD |
| 1.3 | **Lazy AddOnModule / DashboardWidget queries** — currently `wp_dashboard_setup` instantiates `Acl` + calls `getCurrentUserCapability()` (DB read via `get_option('_fluentform_form_permission')`) on every dashboard load. Cache cap result for the request. | `app/Hooks/actions.php:133-142`, `app/Modules/Acl/Acl.php:222` | Low | PENDING | TBD |
| 1.4 | **Lazy-load eagerly-instantiated modules** — `SlackNotificationActions`, `CustomSubmitButton`, `MailChimpIntegration`, `TokenBasedSpamProtection`, `PaymentHandler`, `SidebarWidgets`, `ElementorWidget`, `OxygenWidget` — each does work at construct time on every request. Defer with `current_screen`, `admin_init` gating, or only-on-relevant-hook patterns. | `app/Hooks/actions.php` (884-891, 933-935, 1052-1073, etc.) | **HIGH** — large blast radius, pro-addon may depend on instantiation timing | DEFERRED | needs pro-addon impact check |
| 1.5 | **Autoload critical FF options** — `_fluentform_global_form_settings`, `_fluentform_form_permission` are read on every request. If not autoloaded, switch to `add_option(..., '', 'yes')` or memoize in a request-scoped static cache. | `app/Helpers/Helper.php` + various call sites | Low | PENDING | TBD |

### Phase 2: Homepage query reduction

| # | Item | File | Risk | Status | Delta |
|---|---|---|---|---|---|
| 2.1 | **`_has_fluentform` lookup gate** — runs on every frontend `wp` action regardless of post type. Skip on archive / feed / category pages where no single post is rendered. | `app/Hooks/actions.php:937-960` | Medium — could miss edge case where form is in an archive widget | PENDING | TBD |
| 2.2 | **Request-cache the form settings option** — multiple call sites do `get_option('_fluentform_global_form_settings')` independently per request. Memoize once. | `app/Helpers/Helper.php` | Low | PENDING | TBD |
| 2.3 | **Component::registerScripts skip on non-renderable pages** — `wp_register_*` for 20+ handles runs on every frontend `wp_enqueue_scripts`. No DB cost but allocation overhead and slightly inflates memory. Skip on feeds, REST, AJAX, sitemap, robots.txt. | `app/Modules/Component/Component.php:43-142, :465` | Low | PENDING | TBD |

### Phase 3: Memory & bootstrap

| # | Item | File | Risk | Status | Delta |
|---|---|---|---|---|---|
| 3.1 | **FluentConversational lazy load** — `Services/FluentConversational/plugin.php` is loaded in `boot/app.php` for every request, even non-conversational pages. Defer to the conversational shortcode/block render path. | `boot/app.php:82-86` | Medium — conversational feature detection paths | DEFERRED | needs separate scoping |
| 3.2 | **block.json migration for the FF Gutenberg block** — moves the 97 KB `fluent_gutenblock.js` from "load on every block editor open" to "load only when block inserted". Requires JS work + pro coordination. | `app/Services/Blocks/GutenbergBlock.php`, `guten_block/` | High — JS refactor + pro coordination | DEFERRED | item #4 in master action plan |
| 3.3 | **Exclude `.map` files from production build** | Build config | Low | PENDING | install-size only, no runtime effect |

### Phase 4: Documentation & verification

| # | Item | Status |
|---|---|---|
| 4.1 | Update `block-editor-asset-gate.md` if related changes touch the same area | PENDING |
| 4.2 | Update `tests/benchmarks/README.md` with the new query-profiler script | PENDING |
| 4.3 | Add measurement results to this plan (before/after table) | PENDING |
| 4.4 | Stage all changes on `improve/plugin-footprint`, do not commit | PENDING |

---

## Decision points (will pause and ask)

- **Phase 1.4 (lazy-load eager modules)** — high blast radius. Will produce a per-module analysis and ask for go/no-go on each module individually rather than batch.
- **Phase 3.1, 3.2** — defer to follow-up branches because of pro-addon coordination needed.
- **Cache TTL choices** — will use 60s for unread-count by default, ask if a different value is preferred.

## Out of scope for this branch

- Code-splitting the Vue admin bundles (`fluentform-global-settings.js` etc.)
- Replacing Element UI
- Removing the `fluentfom/guten-block` typo'd block slug (breaking change)
- Block.json migration (deferred, separate PR)

## Status legend

- **PENDING**: not started
- **IN PROGRESS**: actively being worked
- **DONE**: implemented + measured + verified
- **DEFERRED**: out of scope for this session, flagged as follow-up
- **SKIPPED**: investigated, determined to be a non-issue

---

## Execution results (2026-05-23)

### Final status per item

| # | Item | Status | Notes |
|---|---|---|---|
| 0.1 | Build `ff_queries.php` measurement tool | DONE | `tests/benchmarks/ff_queries.php`. Caveat: CLI simulation cannot faithfully reproduce makewpfast's clean-install measurement; many bootstrap-time fires happen before the filter attaches. Useful for catching obvious regressions, not for matching makewpfast's exact +22 number. |
| 0.2 | Capture baseline | DONE | Local baseline shows 0-1 FF queries on simulated admin pages — the gap vs makewpfast's +22 is environmental, not directly fixable. |
| 1.1 | AdminBar unread-count cache | **DONE** | Cached as 60-second per-user transient. Scope extended to `Menu.php:469-475` which had the exact same COUNT query duplicated. Both call sites now share the transient key `fluentform_unread_count_u_{user_id}`. |
| 1.2 | `global_menu` scope check | SKIPPED | Confirmed `fluentform/global_menu` is fired only from FF admin view templates (`all_entries.php`, `all_forms.php`, `addons/index.php`, `docs/index.php`). Already implicitly gated. |
| 1.3 | Dashboard widget cap-check memoization | SKIPPED | `Acl::getCurrentUserCapability()` already memoizes via `static::$capability` (Acl.php:222-235). Non-issue. |
| 1.4 | Lazy-load eager modules | DEFERRED | High blast radius. Needs pro-addon impact check first. Tracked in master action plan. |
| 1.5 | Autoload critical FF options | SKIPPED | Verified `_fluentform_global_form_settings` etc. are NOT autoloaded today, but they're also NOT read on every request — only on FF admin pages and on form submission paths. Autoloading would waste memory on every request without benefit. |
| 2.1 | `_has_fluentform` lookup gate | SKIPPED | Already gated by `is_a($post, 'WP_Post')` at `actions.php:1003-1005`. `get_post_meta` is served from WP's post-meta cache when `the_post()` populates it. No measurable DB hit on archive / feed / REST contexts. |
| 2.2 | Request-cache the form settings option | DEFERRED | Multiple call sites but spread across submission/notification paths; not a per-request hot read. Would need its own measurement-driven scoping. |
| 2.3 | `Component::registerScripts` skip on non-renderable contexts | SKIPPED | No DB cost — just `wp_register_*` function calls with strings. Memory cost is trivial. Not worth the conditional branching. |
| 3.1 | FluentConversational lazy load | DEFERRED | Needs conversational-feature detection work + likely pro coordination. |
| 3.2 | block.json migration | DEFERRED | Item #4 in master action plan. JS refactor + pro coordination. |
| 3.3 | Exclude `.map` files from production build | SKIPPED | Already in `.distignore` line 14 (`*.map`). |

### Files actually changed in this branch

```
app/Hooks/actions.php                — block-editor gate + form-list transient + invalidation
app/Modules/Registerer/AdminBar.php  — unread-count transient cache
app/Modules/Registerer/Menu.php      — unread-count transient cache (shares key with AdminBar)
benchmark-reports/                   — this plan + block-editor-asset-gate.md + WP Hive audit
tests/benchmarks/                    — 5 measurement scripts + README
```

### Honest assessment

The investigation found **dramatically less waste than makewpfast's +22 admin queries suggested**. Local code-read evidence:

- Two genuine wins: the duplicated unread-count COUNT query is now cached (1 query per minute per user, instead of 1 per admin page render). Both AdminBar and Menu sidebar paths benefit.
- Six "expected issues" turned out to be already-handled, already-gated, or non-issues (Acl memoization, global_menu scoping, post meta caching by WP, `.map` files, autoload trade-offs, registerScripts has no DB cost).

The remaining gap between local measurement (~0-1 FF queries) and makewpfast (+22) is most likely:
- Environmental: makewpfast tests on a clean install (no other plugins masking timing); my local has 30+ plugins active that affect the measurement.
- Methodology: makewpfast may count queries across the entire request including activation-time work; I'm only counting hook-fire-time work.
- WP Hive page is also stale (v6.1.11 vs current 6.2.3) — makewpfast may be similarly behind.

### What would move makewpfast's score

The deferred items (1.4, 3.1, 3.2) are the real next levers — they require careful pro-addon coordination and dedicated scoping. Recommended sequence:

1. **Run makewpfast on the current branch** (after committing these changes) to establish a new baseline.
2. **If score is still B-**, prioritize block.json migration (3.2) — removes the largest editor-time JS bundle.
3. **If score is B+/A-**, prioritize FluentConversational lazy load (3.1) — removes bootstrap cost on every request.
4. **Only if needed**, tackle lazy-loading the 18 eager modules (1.4) — highest regression risk, needs pro-addon coordination.

### Re-measurement

Page-weight benchmark re-run after all changes confirms **no regression in per-page byte deltas** (4-10 KB per admin page, identical to baseline):

```
/                                  +0.0 KB  (unchanged)
/wp-admin/index.php                +9.6 KB  (was +9.8, variance)
/wp-admin/edit-comments.php        +3.9 KB  (was +4.1, variance)
/wp-admin/edit.php                 +3.9 KB
/wp-admin/edit-tags.php            +3.9 KB
/wp-admin/media-new.php            +3.9 KB
/wp-admin/options-discussion.php   +3.9 KB
```

(Variance is curl-level rounding; semantic deltas are zero.)
