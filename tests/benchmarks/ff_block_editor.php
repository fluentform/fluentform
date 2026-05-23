<?php
/**
 * Directly fire enqueue_block_editor_assets and report FF asset weight.
 * Usage: wp eval-file /tmp/ff_block_editor.php [post_id]
 *   - With no post_id: simulates a new post (no FF block in content)
 *   - With post_id: simulates editing that specific post
 */

$post_id = isset($args[0]) ? (int) $args[0] : 0;

if (!defined('WP_ADMIN')) {
    define('WP_ADMIN', true);
}

if ($post_id) {
    $GLOBALS['post'] = get_post($post_id);
    setup_postdata($GLOBALS['post']);
    WP_CLI::log("Simulating editor for post {$post_id}: {$GLOBALS['post']->post_title}");
    WP_CLI::log("Has FF block?     " . (has_block('fluentfom/guten-block', $GLOBALS['post']) ? 'YES' : 'no'));
    WP_CLI::log("Has FF shortcode? " . (has_shortcode($GLOBALS['post']->post_content, 'fluentform') ? 'YES' : 'no'));
} else {
    WP_CLI::log("Simulating NEW post (no FF block/shortcode in content)");
    $GLOBALS['post'] = null;
}

$admin = get_users(['role' => 'administrator', 'number' => 1]);
if ($admin) {
    wp_set_current_user($admin[0]->ID);
}

global $wp_scripts, $wp_styles;
$scripts_before = $wp_scripts ? array_keys($wp_scripts->queue) : [];
$styles_before  = $wp_styles ? array_keys($wp_styles->queue) : [];

do_action('enqueue_block_editor_assets');

$scripts_after = array_keys($wp_scripts->queue);
$styles_after  = array_keys($wp_styles->queue);

$new_scripts = array_diff($scripts_after, $scripts_before);
$new_styles  = array_diff($styles_after, $styles_before);

$ff_bytes = 0;
$rows     = [];

$tally = function ($handles, $deps, $type) use (&$rows, &$ff_bytes) {
    foreach ($handles as $h) {
        $reg = $deps->registered[$h] ?? null;
        if (!$reg || !$reg->src) continue;
        $url  = $reg->src;
        $path = '';
        if (strpos($url, content_url()) === 0) {
            $path = WP_CONTENT_DIR . substr($url, strlen(content_url()));
        }
        $path = strtok($path, '?');
        $size = ($path && file_exists($path)) ? filesize($path) : 0;
        $isFF = strpos($url, 'fluentform') !== false || strpos($url, 'fluent-form') !== false;
        if ($isFF) $ff_bytes += $size;
        $rows[] = [$type, $isFF ? 'FF' : '  ', round($size / 1024, 1), $h, preg_replace('#.*/wp-content/#', 'wp-content/', $url)];
    }
};

$tally($new_scripts, $wp_scripts, 'JS ');
$tally($new_styles,  $wp_styles,  'CSS');

usort($rows, fn($a, $b) => $b[2] <=> $a[2]);

WP_CLI::log("");
WP_CLI::log(sprintf("%-3s %-3s %-9s %-40s %s", 'T', 'FF', 'KB', 'handle', 'src'));
WP_CLI::log(str_repeat('-', 120));
foreach ($rows as $r) {
    WP_CLI::log(sprintf("%-3s %-3s %-9s %-40s %s", $r[0], $r[1], $r[2], $r[3], $r[4]));
}
WP_CLI::log(str_repeat('-', 120));
WP_CLI::log(sprintf("FluentForms enqueued by enqueue_block_editor_assets: %.1f KB", $ff_bytes / 1024));
