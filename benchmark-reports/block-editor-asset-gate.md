# Block Editor Asset Gate

Date: 2026-05-23
File touched: `app/Hooks/actions.php` (the `enqueue_block_editor_assets` callback, ~lines 1075-1149)

## Summary

The Gutenberg block editor hook was loading public form CSS on every post/page edit screen, even when the post didn't contain a Fluent Forms block. It also re-queried `fluentform_forms` on every editor load and enqueued the same CSS file twice. This change gates the public CSS behind block presence, caches the form-list query, and removes the duplicate enqueue.

## Changes

| # | Change | What it does |
|---|---|---|
| 1 | Add `global $post;` | Brings the current post into scope so we can inspect its content. |
| 2 | Cache the form-picker query as a 5-minute transient | The `SELECT id, title FROM fluentform_forms` used to run on every block editor page load. Now it hits the DB at most every 5 minutes. |
| 3 | Inline-compact the `$presets` array literal | Same data, fewer lines. No functional change. |
| 4 | Gate public CSS behind `has_block('fluentfom/guten-block', $post)` and `has_shortcode($post->post_content, 'fluentform')` | `fluent-forms-public.css` (~53 KB) and `fluentform-public-default.css` (~5 KB) now only load when the post actually contains the block or shortcode. |
| 5 | Add `fluentform/load_block_editor_public_css` filter | Sites that want to force-load the public CSS in the editor (e.g. third-party preview integrations) can override the gate. |
| 6 | Remove duplicate `wp_enqueue_style('fluentform-gutenberg-block', ...)` call | Same handle was enqueued twice in the same function. Pure bug fix. |
| 7 | Bust the form-list transient on form-lifecycle hooks | A single closure is registered against `fluentform/inserted_new_form`, `fluentform/form_duplicated`, `fluentform/form_imported`, `fluentform/after_form_delete`, and `fluentform/before_updating_form`. The 5-minute TTL becomes a safety net rather than the primary correctness mechanism. |

## Effect

Measured directly with `do_action('enqueue_block_editor_assets')` on a local install:

| Scenario | Before | After |
|---|---:|---:|
| Block editor on post **without** FF block | ~170 KB FF assets | ~110 KB FF assets |
| Block editor on post **with** FF block | ~170 KB FF assets | ~170 KB FF assets (unchanged) |
| DB queries per editor load | 1 (every time) | 0 (after first hit, for 5 min) |
| Duplicate enqueue calls | 1 redundant call | 0 |

Per-page admin weight (separately verified with a WP-Hive-style benchmark, FF on vs off):

| URL | Delta with FF |
|---|---:|
| `/` (front page, no form) | +0.0 KB |
| `/wp-admin/index.php` | +9.8 KB |
| `/wp-admin/edit-comments.php` | +4.1 KB |
| `/wp-admin/edit.php` | +4.1 KB |
| `/wp-admin/edit-tags.php` | +4.1 KB |
| `/wp-admin/media-new.php` | +4.1 KB |
| `/wp-admin/options-discussion.php` | +4.1 KB |

These admin deltas were not changed by this patch (they were already ~4 KB before). The patch's measurable savings are specifically on Gutenberg edit screens, which the WP Hive crawl does not test.

## Why

1. **Real waste exists on the Gutenberg path.** The original hook unconditionally enqueued public form CSS for the editor's live preview. That preview only matters when the post actually contains the block — otherwise the styles are dead weight.
2. **Repeated DB query.** The form-picker dropdown needs the form list, but the list changes infrequently. Hitting the database on every editor load was overkill.
3. **The duplicate enqueue was a bug.** No behavior change, just a stale leftover from an earlier refactor.
4. **No risk to admin pages.** The other admin enqueues (`enqueuePageScripts`, `reisterScripts`) were already gated by `Helper::isFluentAdminPage()`. Measurement confirmed they leak zero bytes onto pages like `edit-comments.php` or `media-new.php`.

## Trade-offs

- **Block-name typo.** The historical block slug is `fluentfom/guten-block` (note the missing "r"). The gate uses this exact slug. If a future refactor renames the block, the gate must be updated in lockstep.
- **Transient edge cases not covered by hook-based invalidation.** Hook bust handles create / duplicate / import / delete / rename via the FormService, AiFormBuilder, TransferService, BaseMigrator, and Form model code paths. Not covered:
  - Direct `wpFluent()->table('fluentform_forms')->insert(...)` calls that bypass FormService.
  - Pro-addon form-creation paths that don't fire one of the listed hooks.
  - WP-CLI scripts or custom migrations that write to the table directly.

  In any of those cases, the picker may be stale for up to 5 minutes — the TTL still bounds the worst case.
- **Bulk operations multiply the bust calls.** Importing N forms fires `delete_transient` N times. Idempotent and cheap, but noisy. Debounce on shutdown if it ever shows up in profiling.
- **Transient cost on sites without an object cache.** `get_transient()` without Redis/Memcached does 1-2 `wp_options` reads on a hit. For sites without an object cache, the "saved" `fluentform_forms` query is replaced with 1-2 options-table queries — wash or slightly worse. The win is real only when an object cache is present (typical on managed hosts).

## Why this does not move WP Hive's reported number

WP Hive's published page (`+894.71KB` average for Fluent Forms) was measured against version `6.1.11` and never re-crawled. The current `6.2.3` codebase only adds 4-10 KB per admin page, as measured locally. The remaining gap between WP Hive's per-page numbers (568-614 KB) and current reality is stale data, not unfixed bloat. This patch makes the Gutenberg path leaner, but WP Hive's snapshot will not reflect it unless their crawl re-runs.
