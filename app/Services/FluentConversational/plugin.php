<?php

defined('ABSPATH') or die;

if(isset($_GET['remote'])) {
    add_filter('option_siteurl', function($val) {
        return 'https://'.$_SERVER['HTTP_HOST'];
    });
    add_filter('option_home', function($val) {
        return 'https://'.$_SERVER['HTTP_HOST'];
    });

    add_filter('plugins_url', function ($url) {
        return str_replace('http://smtp.lab', 'https://b840b624f608.ngrok.io', $url);
    });
}

define('FLUENT_CONVERSATIONAL_FORM', true);
define('FLUENT_CONVERSATIONAL_FORM_VERSION', '1.0.0');
define('FLUENT_CONVERSATIONAL_FORM_DIR_URL', plugin_dir_url(__FILE__));
define('FLUENT_CONVERSATIONAL_FORM_DIR_PATH', plugin_dir_path(__FILE__));
