#!/bin/bash
# WP-Hive-style page-weight benchmark for Fluent Forms.
# Measures total response bytes (HTML + all linked CSS/JS) for a set of admin URLs,
# with and without the plugin active, and reports the delta per URL.
#
# Usage:
#   /tmp/ff_bench.sh <site_url> <wp_path>
#   e.g. /tmp/ff_bench.sh https://forms.test /Volumes/Projects/work/forms

set -euo pipefail

SITE_URL="${1:-https://forms.test}"
WP_PATH="${2:-/Volumes/Projects/work/forms}"
URLS=(
    "/"
    "/wp-admin/index.php"
    "/wp-admin/edit-comments.php"
    "/wp-admin/edit.php"
    "/wp-admin/edit-tags.php?taxonomy=category"
    "/wp-admin/media-new.php"
    "/wp-admin/options-discussion.php"
)
PLUGINS_TO_TOGGLE=(fluentform fluentformpro fluentforms-pdf)
CURL_OPTS=(-sk --max-time 30 -A "Mozilla/5.0 (bench)")

# Generate auth cookies for an admin user.
gen_cookies() {
    wp --path="$WP_PATH" --skip-plugins=presto-player eval '
        $users = get_users(["role" => "administrator", "number" => 1]);
        if (!$users) { fwrite(STDERR, "no admin user\n"); exit(1); }
        $user_id    = $users[0]->ID;
        $expiration = time() + 3600;
        $token      = WP_Session_Tokens::get_instance($user_id)->create($expiration);
        $is_ssl     = strpos(site_url(), "https://") === 0;
        $auth_name  = $is_ssl ? SECURE_AUTH_COOKIE : AUTH_COOKIE;
        $auth_scheme = $is_ssl ? "secure_auth" : "auth";
        $auth        = wp_generate_auth_cookie($user_id, $expiration, $auth_scheme, $token);
        $logged_in   = wp_generate_auth_cookie($user_id, $expiration, "logged_in", $token);
        echo $auth_name . "=" . $auth . "; " . LOGGED_IN_COOKIE . "=" . $logged_in;
    ' 2>/dev/null
}

# Measure bytes for one URL: HTML response + every linked CSS/JS file.
measure() {
    local url="$1"
    local cookie="$2"
    local html
    local html_bytes
    local total_bytes

    html=$(curl "${CURL_OPTS[@]}" -L -H "Cookie: $cookie" "$url" || echo "")
    html_bytes=$(printf '%s' "$html" | wc -c | tr -d ' ')
    total_bytes="$html_bytes"

    # Extract script src and link href (CSS) URLs.
    local asset_urls
    asset_urls=$(printf '%s' "$html" \
        | grep -oE '(src|href)="[^"]+\.(js|css)(\?[^"]*)?"' \
        | sed -E 's/.*"([^"]+)".*/\1/' \
        | sort -u)

    local asset_total=0
    while IFS= read -r asset; do
        [ -z "$asset" ] && continue
        # Resolve relative URLs
        case "$asset" in
            http://*|https://*) full="$asset" ;;
            //*) full="https:$asset" ;;
            /*) full="${SITE_URL}${asset}" ;;
            *) full="${SITE_URL}/${asset}" ;;
        esac
        # Skip cross-origin assets (Google Fonts etc.) — match WP Hive's same-origin focus
        case "$full" in
            "$SITE_URL"*) ;;
            *) continue ;;
        esac
        local sz
        sz=$(curl "${CURL_OPTS[@]}" -L -H "Cookie: $cookie" -o /dev/null \
                  -w '%{size_download}' "$full" 2>/dev/null || echo 0)
        asset_total=$((asset_total + sz))
    done <<< "$asset_urls"

    total_bytes=$((html_bytes + asset_total))
    printf '%s\t%s\t%s\t%s\n' "$url" "$html_bytes" "$asset_total" "$total_bytes"
}

run_pass() {
    local label="$1"
    local cookie
    cookie=$(gen_cookies)
    if [ -z "$cookie" ]; then
        echo "FAILED to generate cookies" >&2
        return 1
    fi
    echo "# pass: $label" >&2
    for url in "${URLS[@]}"; do
        measure "${SITE_URL}${url}" "$cookie"
    done
}

active_before=$(wp --path="$WP_PATH" --skip-plugins=presto-player plugin list --status=active --field=name | tr '\n' ' ')

echo "=== Active plugins before benchmark: $active_before" >&2
echo "=== Running pass 1: WITH Fluent Forms" >&2

# Make sure FF is active for pass 1
for p in "${PLUGINS_TO_TOGGLE[@]}"; do
    if echo "$active_before" | grep -qw "$p"; then
        :  # already active
    fi
done

pass1=$(run_pass "with-ff")

echo "=== Deactivating ${PLUGINS_TO_TOGGLE[*]} for pass 2" >&2
wp --path="$WP_PATH" --skip-plugins=presto-player plugin deactivate "${PLUGINS_TO_TOGGLE[@]}" 2>&1 >&2 || true

pass2=$(run_pass "without-ff")

echo "=== Reactivating ${PLUGINS_TO_TOGGLE[*]}" >&2
wp --path="$WP_PATH" --skip-plugins=presto-player plugin activate "${PLUGINS_TO_TOGGLE[@]}" 2>&1 >&2 || true

# Combine and compute deltas
printf '\n%s\n' "URL                                       | HTML (KB) | Assets (KB) | Total (KB) | Without FF (KB) | Delta (KB)"
printf '%s\n' "---|---:|---:|---:|---:|---:"
paste <(echo "$pass1") <(echo "$pass2") | awk -F'\t' '
{
    # cols: url1 html1 assets1 total1 url2 html2 assets2 total2
    url=$1
    total_with=$4
    total_without=$8
    delta=total_with - total_without
    printf "%s | %.1f | %.1f | %.1f | %.1f | %+.1f\n",
        url,
        $2/1024, $3/1024, total_with/1024,
        total_without/1024, delta/1024
}'
