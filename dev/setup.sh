#!/usr/bin/env bash
#
# One-time setup for the FluentForm PHP quality gate (PHPStan + PHPCS + pre-push hook).
#
#   bash dev/setup.sh
#
# Idempotent: safe to re-run. Does not touch your site or database.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEV_DIR="${REPO_ROOT}/dev"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; DIM='\033[2m'; NC='\033[0m'
ok()   { printf "${GREEN}✓${NC} %s\n" "$1"; }
warn() { printf "${YELLOW}!${NC} %s\n" "$1"; }
die()  { printf "${RED}✗ %s${NC}\n" "$1"; exit 1; }

echo "FluentForm quality-gate setup"
printf "${DIM}%s${NC}\n" "────────────────────────────"

# 1) Pick a PHP >= 8.1 (the tools require it; the served site can stay on any version).
PHP_BIN=""
for cand in php /opt/homebrew/opt/php@8.3/bin/php /opt/homebrew/opt/php@8.2/bin/php /opt/homebrew/opt/php@8.1/bin/php /opt/homebrew/bin/php; do
    if command -v "$cand" >/dev/null 2>&1 || [ -x "$cand" ]; then
        ver="$("$cand" -r 'echo PHP_VERSION_ID;' 2>/dev/null || echo 0)"
        if [ "$ver" -ge 80100 ] 2>/dev/null; then PHP_BIN="$cand"; break; fi
    fi
done
[ -n "$PHP_BIN" ] || die "No PHP >= 8.1 found. The quality tooling (PHPStan/PHPCS) needs PHP 8.1+. Install one (e.g. brew install php@8.3) and re-run. Your served site can stay on any PHP version."
ok "PHP for tooling: $("$PHP_BIN" -v | head -1)"

# 2) Install dev dependencies under that PHP.
command -v composer >/dev/null 2>&1 || die "composer not found on PATH."
( cd "$DEV_DIR" && "$PHP_BIN" "$(command -v composer)" install --no-interaction )
ok "dev/ Composer dependencies installed"

# 3) Install the pre-push hook (symlink so future updates to the tracked hook apply automatically).
HOOK_SRC="${DEV_DIR}/hooks/pre-push"
HOOK_DST="${REPO_ROOT}/.git/hooks/pre-push"
[ -f "$HOOK_SRC" ] || die "Hook source missing: $HOOK_SRC"
chmod +x "$HOOK_SRC"
if [ -d "${REPO_ROOT}/.git/hooks" ]; then
    ln -sf "../../dev/hooks/pre-push" "$HOOK_DST"
    ok "pre-push hook installed (.git/hooks/pre-push -> dev/hooks/pre-push)"
else
    warn ".git/hooks not found — are you in a git checkout? Skipped hook install."
fi

# 4) Node check (the gate runner is node).
if command -v node >/dev/null 2>&1; then ok "node: $(node -v)"; else warn "node not found — the gate runner (quality-gate.mjs) needs Node."; fi

printf "${DIM}%s${NC}\n" "────────────────────────────"
ok "Setup complete."
cat <<EOF

Run checks manually (from dev/, under PHP 8.1+):
  cd dev && composer gate        # PHPStan + PHPCS
  cd dev && composer phpstan
  cd dev && composer phpcs -- ../app/Path/File.php
  cd dev && vendor/bin/phpcbf --standard=../.phpcs.xml ../app/Path/File.php   # auto-fix style

The pre-push hook runs the gate automatically on changed files when you 'git push'.
See dev/QUALITY-GATE.md for details.
EOF
