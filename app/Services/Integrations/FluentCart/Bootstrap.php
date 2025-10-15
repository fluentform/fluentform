<?php

namespace FluentForm\App\Services\Integrations\FluentCart;

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

/**
 * Bootstrap FluentCart Integration
 *
 * @since 1.0.0
 */
class Bootstrap
{
    /**
     * Initialize the integration
     */
    public function boot($app)
    {

        if (!defined('FLUENTCART_VERSION')) {
            return;
        }
        
        $this->enableIntegration();
        
        new FluentCartIntegration($app);
        
        new FluentCartProductField();

        
        add_action('fluentform/submission_inserted', function($insertId, $formData, $form) {
            error_log('FluentCart Integration Debug: Form submission detected - Entry ID: ' . $insertId . ', Form ID: ' . $form->id);
        }, 5, 3);

    }

    /**
     * Enable the integration in global modules status
     */
    private function enableIntegration()
    {
        $modules = get_option('fluentform_global_modules_status', []);

        error_log('FluentCart Integration Bootstrap: Current global modules: ' . print_r($modules, true));

        
        if (!isset($modules['fluentcart'])) {
            $modules['fluentcart'] = 'yes';
            update_option('fluentform_global_modules_status', $modules, 'no');
        }
    }
}

