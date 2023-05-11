<?php

use FluentForm\Framework\Foundation\Application;
use FluentForm\App\Hooks\Handlers\ActivationHandler;
use FluentForm\App\Hooks\Handlers\DeactivationHandler;
use FluentForm\App\Services\Migrator\Bootstrap as FormsMigrator;
use FluentForm\App\Services\FluentConversational\Classes\Form as FluentConversational;

return function ($file) {
    add_action('plugins_loaded',function (){
        $isNotCompatible = defined('FLUENTFORMPRO') && version_compare(FLUENTFORMPRO_VERSION, '5.0.0', '<');
        if ($isNotCompatible) {
            $class = 'notice notice-error';
            $message = __('You are using old version of Fluent Forms Pro. Please update Fluent Forms Pro to the latest from your plugins list or you can downgrade Fluent Forms less than 5.0.0 version.', 'fluentform');
            add_action('admin_notices', function () use ($class, $message) {
                printf('<div class="%1$s"><p>%2$s</p></div>', esc_attr($class), $message);
            });
            add_action('fluentform/global_menu', function () use ($class, $message) {
                printf('<div class="%1$s"><p>%2$s</p></div>', esc_attr($class), $message);
            });
            return add_action('fluentform/after_form_menu', function () use ($class, $message) {
                printf('<div class="%1$s"><p>%2$s</p></div>', esc_attr($class), $message);
            });
        }
    });
    $app = new Application($file);

    register_activation_hook($file, function () use ($app) {
        ($app->make(ActivationHandler::class))->handle();
    });

    add_action('wp_insert_site', function ($blog) use ($app) {
        if (is_plugin_active_for_network('fluentform/fluentform.php')) {
            switch_to_blog($blog->blog_id);
            ($app->make(ActivationHandler::class))->handle(false);
            restore_current_blog();
        }
    });

    register_deactivation_hook($file, function () use ($app) {
        ($app->make(DeactivationHandler::class))->handle();
    });

    add_action('plugins_loaded', function () use ($app) {
        do_action_deprecated(
            'fluentform_loaded',
            [
                $app
            ],
            FLUENTFORM_FRAMEWORK_UPGRADE,
            'fluentform/loaded',
            'Use fluentform/loaded instead of fluentform_loaded.'
        );

        do_action_deprecated(
            'fluentform-loaded',
            [
                $app
            ],
            FLUENTFORM_FRAMEWORK_UPGRADE,
            'fluentform/loaded',
            'Use fluentform/loaded instead of fluentform-loaded.'
        );

        do_action('fluentform/loaded', $app);
    });

    fluentformLoadFile('Services/FluentConversational/plugin.php');
    (new FluentConversational)->boot();
    
    (new FormsMigrator())->boot();
};
