# Workflow: Release

Read this when preparing a new release of FluentForm.

## Pre-Release Checklist

### Security
- [ ] No unresolved critical/high issues in `audit_todo.md`
- [ ] All REST endpoints have policy authorization
- [ ] No hardcoded credentials or API keys
- [ ] Input sanitized in all controllers and AJAX handlers
- [ ] Output escaped in all PHP templates
- [ ] SQL uses query builder or `$wpdb->prepare()`

### Code Quality
- [ ] No `var_dump()`, `print_r()`, `error_log()` debug calls
- [ ] All new strings use `__('text', 'fluentform')` text domain
- [ ] No console.log() in production JS (check compiled assets)
- [ ] Vue components use Options API only (no Composition API)

### Build
- [ ] Run `npm run production` — clean build with no errors
- [ ] Verify `assets/js/` and `assets/css/` are updated
- [ ] Check compiled bundle sizes haven't grown unexpectedly
- [ ] RTL CSS files regenerated if styles changed

### Version Consistency
- [ ] Version in `fluentform.php` header (`Version:` line)
- [ ] `FLUENTFORM_VERSION` constant updated
- [ ] `FLUENTFORM_FRAMEWORK_UPGRADE` constant updated (if framework changed)
- [ ] `readme.txt` — `Stable tag:` line
- [ ] `readme.txt` — changelog entry added
- [ ] `FLUENTFORM_MINIMUM_PRO_VERSION` bumped if pro needs update

### Pro Plugin Compatibility
- [ ] `FLUENTFORM_MINIMUM_PRO_VERSION` bumped if this release breaks pro compatibility
- [ ] Pro plugin activates and works with this new free version
- [ ] Pro plugin shows correct compatibility warning if it's too old (`boot/app.php` version_compare)
- [ ] Free plugin works fully without pro active (no fatal errors, no missing features that should be free)
- [ ] All hardcoded `version_compare(FLUENTFORMPRO_VERSION, ...)` calls still valid:
  - `Converter.php:335` — `> 6.1.0` for countryOrder
  - `Converter.php:1266` — `>= 5.1.13` for conversational
  - `Menu.php:314` — `>= 5.1.7` for entries import
  - `Menu.php:803` — `>= 5.1.12` for conv form save/resume
- [ ] Webpack alias `@fluentform` paths still valid (pro imports shared Vue components)
- [ ] Run `/wp-compat-check` for full cross-plugin verification

### Platform Compatibility
- [ ] Works on PHP 7.4 (minimum) through PHP 8.4
- [ ] Works on WordPress 4.5+ through latest (6.8)
- [ ] Gutenberg block tested in latest block editor
- [ ] Elementor widget tested if widget code changed

### Feature Testing
- [ ] Form builder: create, edit, duplicate, delete forms
- [ ] Form rendering: shortcode + Gutenberg block
- [ ] Submissions: submit, view entries, search, filter, export
- [ ] Multi-step forms: navigation, validation, progress
- [ ] Conversational forms: rendering, submission
- [ ] Email notifications: send on submission
- [ ] File uploads (if changed): upload, delete, size/type validation
- [ ] Payment forms (if changed): Stripe, PayPal basic flow
- [ ] Import/export: form templates, entries CSV/Excel

## Version Bump Steps

```bash
# 1. Update version in main plugin file
# fluentform.php: Version: X.Y.Z
# fluentform.php: FLUENTFORM_VERSION = 'X.Y.Z'

# 2. Update readme.txt
# Stable tag: X.Y.Z
# Add changelog entry

# 3. Build production assets
npm run production

# 4. Build distribution package
sh build.sh --node-build

# 5. Commit
git add fluentform.php readme.txt assets/
git commit -m "Release: vX.Y.Z"

# 6. Tag
git tag -a vX.Y.Z -m "Release vX.Y.Z"
```

## Distribution

`build.sh` creates a production ZIP:
```bash
sh build.sh                  # Use existing compiled assets
sh build.sh --node-build     # Rebuild assets first
```

Output: `builds/fluentform-{VERSION}.zip`

Respects `.distignore` — excludes: node_modules, resources/assets (source), guten_block (source), .claude/, *.md, webpack.mix.js, package.json, mix-manifest.json

## Changelog Format

```
= X.Y.Z (Date: Month DD, YYYY) =
- Added: Description of new feature
- Fixed: Description of bug fix
- Improved: Description of improvement
```

## Post-Release

1. Merge `dev` → `master` (or `release` → `master`)
2. Deploy to WordPress.org SVN (if applicable)
3. Update fluentforms.com download
4. Check Pro plugin compatibility notification works
5. Spot-check key features on a fresh install
