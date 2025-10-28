<?php

namespace FluentForm\App\Modules\FluentCart;

use FluentCart\Api\StoreSettings;
use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\Form;
use FluentForm\App\Modules\Form\FormFieldsParser;
use FluentForm\App\Services\Form\SubmissionHandlerService;
use FluentForm\Framework\Foundation\Application;
use FluentForm\Framework\Support\Arr;

class FluentCartIntegration
{
    /**
     * @var Application
     */
    protected $app;

    /**
     * Constructor
     *
     * @param Application $app
     */
    public function __construct(Application $app)
    {
        $this->app = $app;

        if ($this->isFluentCartActive()) {
            $this->registerHooks();
        }
    }

    /**
     * Register all necessary hooks and filters
     *
     * @return void
     */
    protected function registerHooks()
    {
        // Settings integration
        add_filter("fluent_cart/store_settings/fields", [$this, 'addFormSettingsToFluentCart']);
        add_filter('fluent_cart/store_settings/sanitizer', [$this, 'addFormSettingsSanitizer']);

        // Checkout page integration
        add_action('fluent_cart/before_billing_fields', [$this, 'renderFormBeforeCheckout'], 10);

        // Enqueue assets
        add_action('wp_enqueue_scripts', [$this, 'enqueueAssets']);
    }

    /**
     * Enqueue necessary assets
     *
     * @return void
     */
    public function enqueueAssets()
    {
        wp_enqueue_script(
            'fluent-cart-form-integration',
            fluentFormMix('js/fluent-cart/fluent-cart-product-fluent-form-connection.js'),
            ['jquery', 'fluent-form-submission'],
            FLUENTFORM_VERSION,
            true
        );
    }

    /**
     * Add form settings to Fluent Cart settings
     *
     * @param array $fields
     * @return array
     */
    public function addFormSettingsToFluentCart($fields)
    {
        $forms = $this->getFormsForSelection();

        $fields['setting_tabs']['schema']['store_setup']['schema']['hr7'] = [
            "type"  => "html",
            "value" => "<hr class='settings-devider'>"
        ];

        $fields['setting_tabs']['schema']['store_setup']['schema']['fluent_forms_checkout'] = [
            "type"            => "grid",
            "columns"         => [
                "default" => 1,
                "md"      => 3
            ],
            "disable_nesting" => true,
            "schema"          => [
                "label"        => [
                    "type"  => "html",
                    "value" => "<span class='setting-label'>Select FluentForm for Fluent Cart Checkout</span>
                                <div class='form-note'>Map Fluent Form to render in Fluent Cart Checkout Page</div>"
                ],
                "fluent_forms" => [
                    "wrapperClass" => "col-span-2 flex items-center",
                    "type"         => "select",
                    "filterable"   => true,
                    'clearable'    => true,
                    "options"      => $forms,
                    "value"        => ''
                ]
            ]
        ];

        return $fields;
    }

    /**
     * Add form settings sanitizer
     *
     * @param array $sanitizer
     * @return array
     */
    public function addFormSettingsSanitizer($sanitizer)
    {
        $sanitizer['fluent_forms'] = 'sanitize_text_field';
        return $sanitizer;
    }


    /**
     * Render form before checkout
     *
     * @param array $data
     * @return void
     */
    public function renderFormBeforeCheckout($data = [])
    {
        $settings = new StoreSettings();
        $formId = intval($settings->get('fluent_forms'));

        if (!$formId) {
            return;
        }

        // Hide submit button since form will be submitted via JavaScript
        add_filter('fluentform/is_hide_submit_btn_' . $formId, '__return_true');
        
        // Replace form tag with div to prevent native form submission
        add_filter('fluentform/replace_form_tag_' . $formId, function ($tag) {
            return 'div';
        });

        // Add data attributes for JavaScript integration
        add_filter('fluentform/html_attributes', function ($attributes, $form) use ($formId) {
            if ($form->id == $formId) {
                $attributes['data-fluent-cart-checkout-form'] = 'true';
                $attributes['class'] = ($attributes['class'] ?? '') . ' fluent-cart-checkout-form';
            }
            return $attributes;
        }, 10, 2);

        echo do_shortcode('[fluentform id="' . $formId . '"]');
    }

    /**
     * Get list of forms for selection dropdowns
     *
     * @return array
     */
    protected function getFormsForSelection()
    {
        if (!class_exists('FluentForm\App\Models\Form')) {
            return [
                [
                    'value' => 'none',
                    'label' => 'FluentForm plugin not active'
                ]
            ];
        }

        try {
            $forms = Form::select(['id as value', 'title as label'])
                ->orderBy('id', 'DESC')
                ->get()
                ->toArray();

            // Add default option
            array_unshift($forms, [
                'value' => 'none',
                'label' => 'No Form selected'
            ]);

            return $forms;
        } catch (\Exception $e) {
            return [
                [
                    'value' => 'none',
                    'label' => 'Error loading forms'
                ]
            ];
        }
    }

    /**
     * Check if Fluent Cart is active
     *
     * @return bool
     */
    protected function isFluentCartActive()
    {
        return function_exists('fluentCart') || 
               class_exists('FluentCart\App\App') || 
               defined('FLUENT_CART_VERSION');
    }
}