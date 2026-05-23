<?php
/**
 * Simulate an admin page request and report what FluentForms enqueues.
 * Usage: wp eval-file /tmp/ff_measure.php <admin-page>
 *   e.g. wp eval-file /tmp/ff_measure.php edit-comments.php
 */

$page = $args[0] ?? 'edit-comments.php';

if (!defined('WP_ADMIN')) {
    define('WP_ADMIN', true);
}

$_SERVER['REQUEST_URI']     = '/wp-admin/' . $page;
$_SERVER['SCRIPT_NAME']     = '/wp-admin/' . $page;
$_SERVER['SCRIPT_FILENAME'] = ABSPATH . 'wp-admin/' . $page;
$_SERVER['PHP_SELF']        = '/wp-admin/' . $page;
$GLOBALS['hook_suffix']     = $page;
$GLOBALS['pagenow']         = $page;
$GLOBALS['current_screen']  = WP_Screen::get($page);

$admin = get_users(['role' => 'administrator', 'number' => 1]);
if ($admin) {
    wp_set_current_user($admin[0]->ID);
}

do_action('admin_init');
do_action('admin_enqueue_scripts', $page);
do_action('admin_print_styles-' . $page);
do_action('admin_print_styles');
do_action('admin_print_scripts-' . $page);
do_action('admin_print_scripts');
do_action('admin_head-' . $page);
do_action('admin_head');

global $wp_scripts, $wp_styles;

$wp_scripts->all_deps($wp_scripts->queue);
$wp_styles->all_deps($wp_styles->queue);

$rows  = [];
$total = ['ff' => 0, 'other' => 0];

$collect = function ($deps, $type) use (&$rows, &$total) {
    foreach ($deps->to_do as $h) {
        $reg = $deps->registered[$h] ?? null;
        if (!$reg) continue;

        $src = $reg->src;
        if (!$src) continue;

        $url  = is_string($src) ? $src : '';
        $path = '';
        $size = 0;

        if (strpos($url, content_url()) === 0) {
            $path = WP_CONTENT_DIR . substr($url, strlen(content_url()));
        } elseif (strpos($url, site_url()) === 0) {
            $path = ABSPATH . ltrim(substr($url, strlen(site_url())), '/');
        } elseif (strpos($url, '/wp-includes/') === 0 || strpos($url, '/wp-admin/') === 0) {
            $path = ABSPATH . ltrim($url, '/');
        }

        $path = strtok($path, '?');
        if ($path && file_exists($path)) {
            $size = filesize($path);
        }

        $isFF = (strpos($url, 'fluentform') !== false)
             || (strpos($url, 'fluent-form') !== false)
             || (strpos($url, 'fluentformpro') !== false);

        $bucket = $isFF ? 'ff' : 'other';
        $total[$bucket] += $size;

        $rows[] = [
            'type'  => $type,
            'ff'    => $isFF ? 'FF' : '  ',
            'h'     => $h,
            'kb'    => round($size / 1024, 1),
            'url'   => preg_replace('#.*/wp-content/#', 'wp-content/', $url),
        ];
    }
};

$collect($wp_scripts, 'JS ');
$collect($wp_styles,  'CSS');

usort($rows, fn($a, $b) => $b['kb'] <=> $a['kb']);

WP_CLI::log(sprintf("Page: %s   (admin user: %d)\n", $page, get_current_user_id()));
WP_CLI::log(sprintf("%-3s %-4s %-9s %-50s %s", 'T', 'FF?', 'KB', 'handle', 'src'));
WP_CLI::log(str_repeat('-', 130));
foreach ($rows as $r) {
    WP_CLI::log(sprintf("%-3s %-4s %-9s %-50s %s", $r['type'], $r['ff'], $r['kb'], $r['h'], $r['url']));
}
WP_CLI::log(str_repeat('-', 130));
WP_CLI::log(sprintf("FluentForms total:  %.1f KB", $total['ff'] / 1024));
WP_CLI::log(sprintf("Everything else:    %.1f KB", $total['other'] / 1024));
WP_CLI::log(sprintf("Grand total:        %.1f KB", ($total['ff'] + $total['other']) / 1024));
