<?php
/*
Plugin Name: Fluent Forms - Best Form Plugin for WordPress
Description: Contact Form By Fluent Forms is the advanced Contact form plugin with drag and drop, multi column supported form builder plugin
Version: 3.6.31
Author: WP Fluent Forms
Author URI: https://wpmanageninja.com
Plugin URI: https://wpmanageninja.com/wp-fluent-form/
License: GPLv2 or later
Text Domain: fluentform
Domain Path: /resources/languages
*/

defined('ABSPATH') or die;

defined('FLUENTFORM') or define('FLUENTFORM', true);
define('FLUENTFORM_DIR_PATH', plugin_dir_path(__FILE__));

defined('FLUENTFORM_VERSION') or define('FLUENTFORM_VERSION', '3.6.31');

if (!defined('FLUENTFORM_HAS_NIA')) {
    define('FLUENTFORM_HAS_NIA', true);
}

include FLUENTFORM_DIR_PATH . 'framework/Foundation/Bootstrap.php';

use FluentForm\Framework\Foundation\Bootstrap;

Bootstrap::run(__FILE__);

// Handle Newtwork new Site Activation
add_action('wpmu_new_blog', function ($blogId) {
    switch_to_blog($blogId);
    include_once plugin_dir_path(__FILE__) . 'app/Modules/Activator.php';
    (new FluentForm\App\Modules\Activator)->migrate();
    restore_current_blog();
});


add_action('init', function () {
    if(isset($_GET['hook_demo'])) {
        error_log(json_encode($_POST));
        wp_send_json([
            'status' => false,
            'errors' => 'TINYTEXT is a string data type that can store up to to 255 characters. TEXT is a string data type that can store up to 65,535 characters. TEXT is commonly used for storing blocks of text such as the body of an article. MEDIUMTEXT is a string data type with a maximum length of 16,777,215 characters.'
        ], 400);
        die();
    }
});