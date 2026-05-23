<?php
/**
 * Profile Fluent Forms query overhead per simulated page context.
 *
 * Hooks into the wpdb 'query' filter, captures every SQL statement that
 * touches a fluentform table or option, and reports a summary keyed by the
 * scenario you fire from the closure below.
 *
 * Usage:
 *   wp eval-file tests/benchmarks/ff_queries.php
 *
 * The script does NOT actually serve a request; it simulates the hook order
 * WordPress would fire for each scenario, then prints what FF added.
 */

if (!defined('SAVEQUERIES')) {
    define('SAVEQUERIES', true);
}

global $wpdb;
$captured = [];
$current_scenario = '__bootstrap__';

$capture = function ($query) use (&$captured, &$current_scenario) {
    if (preg_match('/(?:fluentform|ff_scheduled_actions)/i', $query)) {
        $captured[$current_scenario][] = trim(preg_replace('/\s+/', ' ', $query));
    }
    return $query;
};
add_filter('query', $capture);

$admin = get_users(['role' => 'administrator', 'number' => 1]);
if ($admin) {
    wp_set_current_user($admin[0]->ID);
}

if (!defined('WP_ADMIN')) {
    define('WP_ADMIN', true);
}

if (file_exists(ABSPATH . 'wp-admin/includes/dashboard.php')) {
    require_once ABSPATH . 'wp-admin/includes/dashboard.php';
}
if (file_exists(ABSPATH . 'wp-admin/includes/admin.php')) {
    require_once ABSPATH . 'wp-admin/includes/admin.php';
}

$run_scenario = function ($name, callable $fn) use (&$current_scenario, &$captured) {
    $current_scenario = $name;
    $captured[$name] = [];
    ob_start();
    try {
        $fn();
    } finally {
        ob_end_clean();
    }
    $current_scenario = '__post__';
};

$run_scenario('homepage', function () {
    global $post;
    $post = null;
    do_action('init');
    do_action('wp_loaded');
    do_action('wp');
    do_action('wp_enqueue_scripts');
    do_action('wp_head');
    do_action('wp_footer');
});

$run_scenario('admin_index_php', function () {
    $GLOBALS['hook_suffix'] = 'index.php';
    $GLOBALS['pagenow']     = 'index.php';
    do_action('admin_init');
    do_action('admin_enqueue_scripts', 'index.php');
    do_action('admin_print_scripts');
    do_action('admin_print_styles');
    do_action('wp_dashboard_setup');
    do_action('admin_head-index.php');
    do_action('admin_head');
});

$run_scenario('admin_edit_comments_php', function () {
    $GLOBALS['hook_suffix'] = 'edit-comments.php';
    $GLOBALS['pagenow']     = 'edit-comments.php';
    do_action('admin_init');
    do_action('admin_enqueue_scripts', 'edit-comments.php');
    do_action('admin_print_scripts');
    do_action('admin_print_styles');
    do_action('admin_head-edit-comments.php');
    do_action('admin_head');
});

$run_scenario('admin_edit_php', function () {
    $GLOBALS['hook_suffix'] = 'edit.php';
    $GLOBALS['pagenow']     = 'edit.php';
    do_action('admin_init');
    do_action('admin_enqueue_scripts', 'edit.php');
    do_action('admin_print_scripts');
    do_action('admin_print_styles');
    do_action('admin_head-edit.php');
    do_action('admin_head');
});

$run_scenario('admin_bar_render', function () {
    if (class_exists('WP_Admin_Bar')) {
        global $wp_admin_bar;
        $wp_admin_bar = new WP_Admin_Bar();
        do_action_ref_array('admin_bar_menu', [&$wp_admin_bar]);
    }
});

WP_CLI::log(str_pad('', 80, '='));
WP_CLI::log('FluentForms query profile by scenario');
WP_CLI::log(str_pad('', 80, '='));

foreach ($captured as $scenario => $queries) {
    if ($scenario === '__bootstrap__' || $scenario === '__post__') {
        continue;
    }
    WP_CLI::log('');
    WP_CLI::log(sprintf('[%s]  %d FF queries', $scenario, count($queries)));
    foreach ($queries as $i => $q) {
        WP_CLI::log(sprintf('  %2d. %s', $i + 1, substr($q, 0, 140)));
    }
}

WP_CLI::log('');
WP_CLI::log(str_pad('', 80, '='));
WP_CLI::log('Summary');
WP_CLI::log(str_pad('', 80, '='));
foreach ($captured as $scenario => $queries) {
    if ($scenario === '__bootstrap__' || $scenario === '__post__') {
        continue;
    }
    WP_CLI::log(sprintf('  %-30s %d', $scenario, count($queries)));
}
