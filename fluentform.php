<?php

defined('ABSPATH') or die(__FILE__);

/**
 * Plugin Name: Fluent Forms
 * Description: Contact Form By Fluent Forms is the advanced Contact form plugin with drag and drop, multi column supported form builder plugin
 * Version: 5.2.0
 * Author: Contact Form - WPManageNinja LLC
 * Author URI: https://fluentforms.com
 * Plugin URI: https://wpmanageninja.com/wp-fluent-form/
 * License: GPLv2 or later
 * Text Domain: fluentform
 * Domain Path: /resources/languages
 */

defined('FLUENTFORM') or define('FLUENTFORM', true);
defined('FLUENTFORM_DIR_PATH') or define('FLUENTFORM_DIR_PATH', plugin_dir_path(__FILE__));
defined('FLUENTFORM_FRAMEWORK_UPGRADE') or define('FLUENTFORM_FRAMEWORK_UPGRADE', '4.3.22');
defined('FLUENTFORM_VERSION') or define('FLUENTFORM_VERSION', '5.2.0');
defined('FLUENTFORM_HAS_NIA') or define('FLUENTFORM_HAS_NIA', true);
defined('FLUENTFORM_URL') or define('FLUENTFORM_URL', plugin_dir_url(__FILE__));

/*************** Code IS Poetry **************/
return (function ($_) {

    return $_(__FILE__);
})(
    require __DIR__ . '/boot/app.php',

    require __DIR__ . '/vendor/autoload.php'
);
/************ Built With WPFluent *************/
