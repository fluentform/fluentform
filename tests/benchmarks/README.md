# Page-weight benchmarks

Throwaway scripts used to verify the block-editor asset gate landed in
`app/Hooks/actions.php`. Kept here so future enqueue changes can be
re-verified without rebuilding the harness from scratch.

All scripts assume a working local WordPress install reachable via WP-CLI
(`wp` on `$PATH`) and, for `ff_bench.sh`, a browsable URL. Defaults match the
repo's local dev setup (`/Volumes/Projects/work/forms`, `https://forms.test`).

## Scripts

| Script | Purpose | How to run |
|---|---|---|
| `ff_bench.sh` | WP-Hive-style benchmark. Toggles Fluent Forms off and on, curls a set of admin URLs, sums HTML + asset bytes per URL, prints the delta table. Restores the original plugin state on completion. | `./ff_bench.sh [site_url] [wp_path]` |
| `ff_measure.php` | Simulates one admin page request and lists every script/style enqueued, with FF entries tagged. Useful for verifying that gating works for a specific admin screen. | `wp eval-file ff_measure.php <admin-page>` (e.g. `edit-comments.php`) |
| `ff_block_editor.php` | Fires `enqueue_block_editor_assets` directly and reports what FF queues for a given post. Use to confirm the public CSS only loads when the post contains the block. | `wp eval-file ff_block_editor.php [post_id]` (no id = simulate new post) |
| `ff_hasblock.php` | Sanity check that `has_block('fluentfom/guten-block', $content)` resolves the typo'd historical slug. Quick regression check if the block name ever gets renamed. | `wp eval-file ff_hasblock.php` |

## What "good" looks like

After the gate is in place, expected output:

- `ff_bench.sh`: each admin URL should show a delta of single-digit KB (the
  FF admin bar + sidebar menu HTML). The front page should show 0 KB on a
  post with no form embed.
- `ff_block_editor.php` with no post id (or a post without the FF block):
  should enqueue only `fluentform-gutenberg-block` JS + CSS (~110 KB
  combined). No `fluent-form-styles` or `fluentform-public-default`.
- `ff_block_editor.php` with a post id that has the FF block: should also
  enqueue `fluent-form-styles` and `fluentform-public-default` for the
  preview.
- `ff_hasblock.php`: all `wp:fluentfom/guten-block` markers should return
  `block=Y`, the `[fluentform]` shortcode should return `sc=Y`.

## Related

- `benchmark-reports/block-editor-asset-gate.md` — the patch this verifies
- `app/Hooks/actions.php` (the `enqueue_block_editor_assets` callback) —
  the code under test
