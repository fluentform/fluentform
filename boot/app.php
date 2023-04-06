<?php

use FluentForm\Framework\Foundation\Application;
use FluentForm\App\Hooks\Handlers\ActivationHandler;
use FluentForm\App\Hooks\Handlers\DeactivationHandler;
use FluentForm\App\Services\Migrator\Bootstrap as FormsMigrator;
use FluentForm\App\Services\FluentConversational\Classes\Form as FluentConversational;

return function ($file) {
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
