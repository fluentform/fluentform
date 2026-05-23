# Fluent Forms WP Hive Accuracy & Benchmark Report

Generated: 2026-05-23  
Plugin under review: Fluent Forms free plugin  
Local checkout: `/Volumes/Projects/work/forms/wp-content/plugins/fluentform`  
Compared page: https://wphive.com/plugins/fluentform/

## Executive Summary

WP Hive's Fluent Forms report is not current. It reports Fluent Forms `6.1.11`, while WordPress.org, the local plugin header, and the local readme all show `6.2.3`.

The high-level WP Hive verdict that Fluent Forms has a small database footprint and can load without PHP syntax/runtime fatals is broadly supported by local evidence, but several WP Hive facts are stale or too generic to treat as an accurate 2026 benchmark.

Most important differences:

- WP Hive version: `6.1.11`; verified current version: `6.2.3`.
- WP Hive active installs: `600K`; WordPress.org/API current active installs: `700,000`.
- WP Hive rating count: `719`; WordPress.org/API current rating count: `760`.
- WP Hive downloads: `14M`; WordPress.org/API current downloads: `16,613,518`.
- WP Hive test stack says PHP `8.1.12` and WordPress `6.9`; local runtime verification used PHP `8.3.30` and WordPress `7.0`.
- WP Hive's "latest PHP" / "latest WordPress" wording is outdated for the current environment.

## Evidence Sources

### Public Sources

- WP Hive report page: https://wphive.com/plugins/fluentform/
- WordPress.org plugin page: https://wordpress.org/plugins/fluentform/
- WordPress.org API via WP-CLI plugin search.

### Local Sources

- `fluentform.php`
- `readme.txt`
- `database/Migrations/*`
- `app/Modules/Component/Component.php`
- Local WordPress install: `/Volumes/Projects/work/forms`
- Alternate Plugin Check WordPress install: `/Volumes/Projects/work/wp_lab`
- Benchmark harness inspected: `/Volumes/Projects/wp-benchmark`
- System browser used for runtime check: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

## Current Verified Plugin Identity

| Field | Verified value | Evidence |
|---|---:|---|
| Plugin header name | `Fluent Forms` | `fluentform.php` |
| Plugin header version | `6.2.3` | `fluentform.php` |
| `FLUENTFORM_VERSION` constant | `6.2.3` | `fluentform.php` |
| Stable tag | `6.2.3` | `readme.txt` |
| Requires WordPress | `6.4` | `readme.txt`, WordPress.org |
| Tested up to | `7.0` | `readme.txt`, WordPress.org |
| Requires PHP | `7.4` | `readme.txt`, WordPress.org |
| Local WP runtime | WordPress `7.0`, PHP `8.3.30` | WP-CLI |
| Local plugin status | Active, version `6.2.3` | WP-CLI with `--skip-plugins=presto-player` |

## WP Hive Claim Comparison

| WP Hive claim | WP Hive value | Verified value / finding | Status |
|---|---:|---|---|
| Current version | `6.1.11` | `6.2.3` | Outdated |
| Active installs | `600K` | `700,000` from WordPress.org/API | Outdated |
| Total downloads | `14M` | `16,613,518` from WordPress.org/API | Outdated |
| Ratings | `719` | `760` from WordPress.org/API; WordPress.org page shows 4.8/5 | Outdated |
| Updated recently | Yes | WordPress.org/API last updated `2026-05-21 1:52pm GMT` | Confirmed |
| WordPress compatibility | "Latest WordPress 6.9 compatible" | Current metadata says tested up to `7.0`; local WP core is `7.0` | Outdated wording, current compatibility confirmed by metadata/local load |
| PHP compatibility | "Latest PHP 8.1.12 compatible" | Local WP-CLI runtime is PHP `8.3.30`; plugin loaded and PHP lint passed | Outdated wording, local PHP 8.3 compatibility partially confirmed |
| No PHP errors/warnings/notices | WP Hive says none during activation | Local plugin loaded under WP-CLI when unrelated `presto-player` fatal was skipped; PHP lint passed for app/boot/config/database/main file | Mostly confirmed for syntax/load, not a clean activation replay |
| No JavaScript issues | WP Hive says none | System Chrome run found no uncaught `pageerror`, but did record 3 console warnings and 1 generic 404 console error | Not confirmed |
| No resource errors | WP Hive says none | System Chrome run found no Playwright `requestfailed` events and no captured `>=400` network responses, but console still logged a generic 404 resource error | Mostly confirmed with one unresolved console-level 404 |
| Optimized database footprint | Less than 50 tables | Local migrations define 8 core Fluent Forms tables; local active DB has 13 Fluent Forms/payment/scheduler tables | Confirmed |
| Minimal impact on memory usage | WP Hive screenshot/page report shows average page-level change around `+111.84KB` for its tested pages | Local isolated WP-CLI bootstrap delta: `+6.68 MiB` PHP real peak / `+6.00 MiB` PHP allocated peak; OS max RSS delta: `+7.03 MiB` | Both are memory signals, but they are not the same metric; WP Hive's visible chart is the closer public comparison point |
| Minimal impact on PageSpeed | Below WP Hive average + 1000ms | WP Hive does not expose raw measured value on the page; `/wp-benchmark` is video-player-specific, not form-specific | Not independently verified |

## Local Runtime Checks

### WP-CLI Load

Command used:

```bash
wp eval 'echo defined("FLUENTFORM_VERSION") ? FLUENTFORM_VERSION : "not_loaded";' \
  --path=/Volumes/Projects/work/forms \
  --skip-plugins=presto-player
```

Result:

- Output: `6.2.3`
- Interpretation: Fluent Forms loads in the local WordPress runtime when the unrelated `presto-player` WP-CLI fatal is skipped.

Important isolation note:

- Running WP-CLI without skipping `presto-player` failed in `presto-player/inc/Factory.php`.
- That failure is unrelated to Fluent Forms and should not be counted as a Fluent Forms activation/load failure.

### PHP Syntax Check

Command used:

```bash
find app boot config database fluentform.php -name '*.php' -print0 | xargs -0 -n 1 php -l
```

Result:

- No syntax errors detected across the checked Fluent Forms PHP source tree.
- Scope included app, boot, config, database migrations, and `fluentform.php`.

### Memory Usage Benchmark

Important correction:

- WP Hive's screenshot-style memory benchmark is a page-level before/after change report. In the provided screenshot, the average change is `+111.84KB`.
- The local `6-7 MiB` measurement below is an isolated WP-CLI WordPress bootstrap delta, not the same metric.
- Therefore, the local bootstrap delta should not be used to dispute WP Hive's `+111.84KB` page-level memory chart.

Memory was measured locally as an isolated WordPress bootstrap benchmark, not as a full WP Hive-style frontend/admin page-render benchmark.

Method:

- Baseline: WordPress loaded with `--skip-plugins`.
- Fluent Forms run: WordPress loaded with every active plugin skipped except `fluentform/fluentform.php`.
- Fluent Forms Pro was skipped.
- The unrelated local `presto-player` WP-CLI fatal was skipped.
- Each PHP memory measurement was repeated 10 times; values were stable across all 10 runs.

Baseline command shape:

```bash
wp eval 'echo json_encode([
  "peak_real" => memory_get_peak_usage(false),
  "peak_alloc" => memory_get_peak_usage(true),
  "current_real" => memory_get_usage(false),
  "current_alloc" => memory_get_usage(true),
]);' \
  --path=/Volumes/Projects/work/forms \
  --skip-plugins
```

Fluent Forms isolated command shape:

```bash
wp eval 'echo json_encode([
  "peak_real" => memory_get_peak_usage(false),
  "peak_alloc" => memory_get_peak_usage(true),
  "current_real" => memory_get_usage(false),
  "current_alloc" => memory_get_usage(true),
  "ff_loaded" => defined("FLUENTFORM_VERSION") ? FLUENTFORM_VERSION : false,
]);' \
  --path=/Volumes/Projects/work/forms \
  --skip-plugins=<all-active-plugins-except-fluentform>
```

PHP memory results:

| Scenario | Peak real | Peak allocated | Current real | Current allocated |
|---|---:|---:|---:|---:|
| WordPress baseline, no plugins | 55,962,880 bytes | 57,999,360 bytes | 55,775,456 bytes | 57,999,360 bytes |
| WordPress + Fluent Forms only | 62,961,112 bytes | 64,290,816 bytes | 62,774,112 bytes | 64,290,816 bytes |
| **Fluent Forms delta** | **+6,998,232 bytes** | **+6,291,456 bytes** | **+6,998,656 bytes** | **+6,291,456 bytes** |
| **Fluent Forms delta in MiB** | **+6.68 MiB** | **+6.00 MiB** | **+6.68 MiB** | **+6.00 MiB** |

OS-level process memory check with `/usr/bin/time -l`:

| Scenario | Maximum resident set size | Peak memory footprint |
|---|---:|---:|
| WordPress baseline, no plugins | 81,543,168 bytes | 64,030,080 bytes |
| WordPress + Fluent Forms only | 88,915,968 bytes | 71,435,776 bytes |
| **Fluent Forms delta** | **+7,372,800 bytes** | **+7,405,696 bytes** |
| **Fluent Forms delta in MiB** | **+7.03 MiB** | **+7.06 MiB** |

Interpretation:

- Local isolated PHP bootstrap impact is about `6-7 MiB`, depending on metric.
- WP Hive's visible chart/screenshot shows much smaller page-level deltas, with average change around `+111.84KB`.
- These two measurements answer different questions:
  - WP Hive chart: extra memory observed on selected page requests after plugin activation.
  - Local bootstrap benchmark: extra memory in a WP-CLI process after loading Fluent Forms code.
- For public benchmark messaging, prefer the WP Hive-style page-level figure when available, and use the local bootstrap number only as a separate engineering diagnostic.

### Local Page Fetch

Command used:

```bash
curl -k -sS -I https://forms.test/fluent-form/
```

Result:

- HTTP status: `200`
- Server header: `nginx/1.25.4`
- Runtime header: `PHP/8.3.30`

Rendered page evidence:

- `fluent-forms-public.css?ver=6.2.3` enqueued.
- `fluentform-public-default.css?ver=6.2.3` enqueued.
- Local HTML included Fluent Forms frontend form output and inline initialization for form `54`.

### System Chrome Browser Check

The `/Volumes/Projects/wp-benchmark` Playwright install was missing its bundled Chromium binary, so the browser check was rerun with the installed system Chrome:

```text
/Applications/Google Chrome.app/Contents/MacOS/Google Chrome
```

Result:

- Browser: Google Chrome system stable.
- URL: `https://forms.test/fluent-form/`
- HTTP status: `200`
- Document title: `Fluent Form – forms`
- Document ready state: `complete`
- Fluent Forms detected: `1` rendered `form.frm-fluent-form`
- Playwright `pageerror` events: none
- Playwright `requestfailed` events: none
- Captured `>=400` network responses: none

Console warnings/errors:

- Warning: `JQMIGRATE: jQuery.type is deprecated`
- Warning: `JQMIGRATE: jQuery.isFunction() is deprecated`
- Warning: `Unknown config option(s) passed maxItemTextPlural, maxItemTextSingular`
- Error: `Failed to load resource: the server responded with a status of 404 ()`

Interpretation:

- The page is renderable in the current system Chrome and the Fluent Forms frontend initializes.
- WP Hive's "No Javascript issues" claim is not strictly reproduced locally because Chrome recorded console warnings and one generic resource-load error.
- The 404 was not captured as a Playwright failed request or `>=400` response in the second run, so this report does not attribute it to a specific Fluent Forms asset.

## Frontend Asset Footprint

Direct file sizes from local built assets:

| Asset | Raw size | Gzip size where measured |
|---|---:|---:|
| `assets/js/form-submission.js` | 66,333 bytes | 14,069 bytes |
| `assets/css/fluent-forms-public.css` | 54,229 bytes | 8,544 bytes |
| `assets/css/fluentform-public-default.css` | 4,996 bytes | 1,438 bytes |
| `assets/js/fluentform-advanced.js` | 143,325 bytes | Not measured |
| `assets/css/choices.css` | 12,804 bytes | Not measured |

Baseline public assets for a standard shortcode page are registered/enqueued in `app/Modules/Component/Component.php`:

- `fluent-form-styles`
- `fluentform-public-default`
- `fluent-form-submission`
- `fluentform-advanced` only when fields/components require it

Interpretation:

- The core submission script plus the two baseline public CSS files are about `24 KB` gzip combined.
- That supports the current WordPress.org/readme claim that a standard form can be under roughly `30 KB` compressed CSS/JS, depending on which extra field assets are required.
- The raw uncompressed size is much larger, so the `30 KB` claim should be stated as compressed/network transfer size, not raw file size.

System Chrome resource transfer for the local test page:

| Resource | Transfer size |
|---|---:|
| `fluent-forms-public.css` | 9,038 bytes |
| `fluentform-public-default.css` | 1,717 bytes |
| `choices.css` | 2,911 bytes |
| `flatpickr.min.css` | 3,349 bytes |
| `form-submission.js` | 14,614 bytes |
| `jquery.mask.min.js` | 3,697 bytes |
| `choices.min.js` | 19,649 bytes |
| `flatpickr.min.js` | 14,647 bytes |
| `fluentform-advanced.js` | 32,628 bytes |
| **Total Fluent Forms transfer on this field-heavy page** | **102,250 bytes** |

This local page is not a minimal standard form. It includes advanced fields/assets such as Choices, Flatpickr, mask input, and `fluentform-advanced.js`, so it should not be used to judge the minimal-form asset claim.

## Database Footprint

Migration files define 8 core tables:

- `fluentform_forms`
- `fluentform_form_meta`
- `fluentform_submissions`
- `fluentform_submission_meta`
- `fluentform_entry_details`
- `fluentform_form_analytics`
- `fluentform_logs`
- `ff_scheduled_actions`

Local active database tables matching Fluent Forms/payment/scheduler patterns:

- `wp_fluentform_coupons`
- `wp_fluentform_draft_submissions`
- `wp_fluentform_entry_details`
- `wp_fluentform_form_analytics`
- `wp_fluentform_form_meta`
- `wp_fluentform_forms`
- `wp_fluentform_logs`
- `wp_fluentform_order_items`
- `wp_fluentform_submission_meta`
- `wp_fluentform_submissions`
- `wp_fluentform_subscriptions`
- `wp_fluentform_transactions`
- `wp_ff_scheduled_actions`

Result:

- Confirmed under WP Hive's "less than 50 database tables" threshold.
- Local count is 13 matching tables in an active dev install with payments-related tables present.

## Plugin Check Findings

Plugin Check was run from the alternate WP lab install because the main `/forms` WordPress install currently fatals in WordPress core AI client bootstrap before Plugin Check can run.

Main install failure:

- File: `/Volumes/Projects/work/forms/wp-includes/ai-client/adapters/class-wp-ai-client-http-client.php`
- Failure type: method signature compatibility fatal during WordPress bootstrap.
- Interpretation: not a Fluent Forms code failure.

Scoped Plugin Check command:

```bash
wp --path=/Volumes/Projects/work/wp_lab \
  --require=/Volumes/Projects/work/wp_lab/wp-content/plugins/plugin-check/cli.php \
  plugin check /Volumes/Projects/work/forms/wp-content/plugins/fluentform \
  --slug=fluentform \
  --format=json \
  --exclude-directories=node_modules,vendor,.git,.claude,tests,bin,builds,app/Services/Libraries/action-scheduler \
  --exclude-files=AGENTS.md
```

Result:

- Command exited successfully, but reported findings.
- Major categories:
  - i18n placeholder/translators-comment issues.
  - `date()` usage warnings/errors where `gmdate()` is recommended.
  - hidden/development files present in this working checkout.
  - unexpected root markdown files in this working checkout.
  - slow-query warnings around `meta_key` usage.
  - nonce warnings in selected payment/transaction request flows.
  - one `wp_redirect()` warning where Plugin Check recommends `wp_safe_redirect()`.

Interpretation:

- This local dev checkout is not a clean WordPress.org production ZIP shape because it includes development files, reports, hidden files, and `builds/`.
- Plugin Check does not support WP Hive's implied "no issues at all" as a code-quality statement.
- Plugin Check findings are static-analysis findings, not proof of exploitable bugs.

## `/Volumes/Projects/wp-benchmark` Assessment

The requested benchmark project exists, but it is a video-player benchmark harness:

- Package name: `wp-video-player-benchmark`
- Scenarios: YouTube embed, self-hosted MP4, playlist, below-the-fold video.
- Plugins configured: Presto Player, Fluent Player, FV Player.

Result:

- Not suitable as-is for Fluent Forms benchmarking.
- It can inspire methodology, but using its current scoring would be inaccurate because it measures video-player behavior, first frame, video CPU/memory, and video-specific scenarios.
- The project's bundled Playwright browser was missing, but the browser check was completed by pointing Playwright at the installed system Google Chrome binary.

## Accurate Replacement Report

### Health Snapshot

| Category | Result |
|---|---|
| Current public version | `6.2.3` |
| Local version | `6.2.3` |
| WordPress.org active installs | `700,000` |
| WordPress.org downloads | `16,613,518` |
| WordPress.org rating | `96/100`, 760 ratings |
| WordPress compatibility metadata | Requires `6.4+`, tested to `7.0` |
| PHP compatibility metadata | Requires PHP `7.4+` |
| Local runtime tested | WP `7.0`, PHP `8.3.30` |
| PHP syntax | Passed for checked source tree |
| Local plugin load | Passed with unrelated `presto-player` skipped |
| WP Hive-style memory screenshot | Average page-level change around `+111.84KB` |
| Isolated PHP bootstrap memory delta | `+6.68 MiB` real peak / `+6.00 MiB` allocated peak |
| OS process memory delta | `+7.03 MiB` max RSS / `+7.06 MiB` peak memory footprint |
| Frontend page response | HTTP `200` on local form page; system Chrome rendered 1 Fluent Forms form |
| Baseline compressed public assets | About `24 KB` for core submission JS + two baseline CSS files |
| Field-heavy local page Fluent Forms transfer | `102,250` bytes across 9 Fluent Forms CSS/JS resources |
| DB footprint | 13 local matching tables, below WP Hive's 50-table threshold |
| Static Plugin Check | Findings present; not a clean "no issues" result |

### Confirmed WP Hive Claims

- Fluent Forms has a database footprint below 50 tables.
- The plugin is actively maintained and was updated recently.
- The plugin can load locally under PHP `8.3.30` / WordPress `7.0` when isolated from an unrelated active-plugin fatal.
- A standard form baseline can stay around/under the `30 KB` compressed CSS/JS claim, depending on fields used.
- The local form page renders in the current system Chrome with no uncaught page errors and no Playwright request failures.

### Outdated WP Hive Claims

- Version `6.1.11` is stale; current is `6.2.3`.
- Active installs `600K` is stale; current WordPress.org/API value is `700,000`.
- Downloads `14M` is stale; current WordPress.org/API value is `16,613,518`.
- Rating count `719` is stale; current WordPress.org/API value is `760`.
- "Latest PHP 8.1.12" and "Latest WordPress 6.9" are stale labels for the current plugin metadata/runtime.

### Not Independently Verified

- WP Hive's raw memory usage result.
- WP Hive's raw PageSpeed delta result.
- The exact source of the generic Chrome 404 console error, because Playwright did not capture it as a failed request or `>=400` network response.

### Missing From WP Hive

- It does not show current `6.2.3` metadata.
- It does not expose raw memory/page-speed numbers on the visible report page.
- It does not distinguish current Fluent Forms code findings from generic pass/fail badges.
- It does not reflect Plugin Check findings from the current local checkout.
- It does not account for different field types loading additional assets beyond a simple standard form.

## Recommendation

Do not use the current WP Hive page as the authoritative Fluent Forms benchmark. It is useful as a stale third-party snapshot only.

Use this replacement summary instead:

> Fluent Forms `6.2.3` is current on WordPress.org, has `700,000` active installs, `16,613,518` downloads, a `96/100` rating across `760` ratings, requires WordPress `6.4+`, is tested up to WordPress `7.0`, and requires PHP `7.4+`. Local verification on PHP `8.3.30` / WordPress `7.0` confirms the plugin loads when isolated from an unrelated active-plugin fatal, PHP syntax checks pass across the checked source tree, the local form page returns HTTP `200`, system Chrome renders one Fluent Forms form with no uncaught page errors and no Playwright request failures, and the database footprint remains well below WP Hive's 50-table threshold. WP Hive's version, install, download, rating, PHP, and WordPress labels are outdated. Raw WP Hive memory/PageSpeed values were not independently reproduced in this run, and the local browser check found console warnings plus one unresolved generic 404 console error, so WP Hive's "no JavaScript issues" claim should not be repeated without qualification.
