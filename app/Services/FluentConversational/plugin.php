<?php
/*
Plugin Name: Fluent Conversational Form
Description: Create interactive conversational form, which takes the one question at a time approach and helps to boost form completion and your overall form conversions.
Version: 1.0.0
Author: WP Fluent Forms
Author URI: https://wpfluentforms.com
License: GPLv2 or later
Text Domain: fluent-conversational-form
Domain Path: /languages
*/

defined('ABSPATH') or die;

define('FLUENT_CONVERSATIONAL_FORM', true);
define('FLUENT_CONVERSATIONAL_FORM_VERSION', '1.0.0');
define('FLUENT_CONVERSATIONAL_FORM_DIR_URL', plugin_dir_url(__FILE__));
define('FLUENT_CONVERSATIONAL_FORM_DIR_PATH', plugin_dir_path(__FILE__));

include FLUENT_CONVERSATIONAL_FORM_DIR_PATH . 'autoload.php';
