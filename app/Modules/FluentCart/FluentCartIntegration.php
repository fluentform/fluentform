<?php

namespace FluentForm\App\Modules\FluentCart;

use FluentCart\Api\StoreSettings;
use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\Form;
use FluentForm\Framework\Foundation\Application;
use FluentForm\Framework\Support\Arr;

/**
 * Fluent Cart Integration for Fluent Forms
 *
 * Handles integration between Fluent Forms and Fluent Cart
 */
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
        // Product page integration
        $this->registerProductPageHooks();

        // Checkout page integration
        $this->registerCheckoutPageHooks();

        // Settings integration
        $this->registerSettingsHooks();

        // Form submission handling
        add_action('fluentform/submission_inserted', [$this, 'handleFormSubmissionWithCart'], 10, 3);

        // Enqueue assets
        add_action('wp_enqueue_scripts', [$this, 'enqueueAssets']);
    }

    /**
     * Register product page related hooks
     *
     * @return void
     */
    protected function registerProductPageHooks()
    {
        $this->connectCartProductWithForm();
        add_action('fluent_cart/views/before_single_product_page_product_variants_iterator',
            [$this, 'renderFormBeforeAddToCart'], 10);
    }

    /**
     * Register checkout page related hooks
     *
     * @return void
     */
    protected function registerCheckoutPageHooks()
    {
        add_action('fluent_cart/views/after_checkout_page_order_notes',
            [$this, 'renderFormBeforeCheckout'], 10);
    }

    /**
     * Register settings related hooks
     *
     * @return void
     */
    protected function registerSettingsHooks()
    {
        add_filter("fluent_cart/store_setting_fields", [$this, 'addFormSettingsToFluentCart']);
        add_filter('fluent_cart/store_settings/sanitizer', [$this, 'addFormSettingsSanitizer']);
    }

    /**
     * Connect cart product with form through admin UI
     *
     * @return void
     */
    public function connectCartProductWithForm()
    {
        add_filter('fluent_cart/widgets/single_product_page', [$this, 'addFormWidgetToProductPage'], 10, 2);
        add_action('fluent_cart/product_updated', [$this, 'saveProductFormAssociation'], 10, 2);
    }

    /**
     * Add form widget to product page
     *
     * @param array $widgets
     * @param array $data
     * @return array
     */
    public function addFormWidgetToProductPage($widgets, $data)
    {
        $forms = $this->getFormsForSelection();
        $selectedFormId = get_post_meta(Arr::get($data, 'product_id'), '_fluent_form_id', true);

        $widget = [
            [
                'title'              => 'Select Form',
                'sub_title'          => 'Select Form you want to show before add to cart',
                'type'               => 'form',
                'form_name'          => 'ff_product_form',
                'name'               => 'composition',
                'clearable'          => true,
                'filterable'         => true,
                'schema'             => [
                    'name' => [
                        'wrapperClass' => 'col-span-2 flex items-center',
                        'label'        => 'Fluent Forms',
                        'type'         => 'select',
                        'options'      => $forms,
                    ],
                ],
                'values'             => [
                    'name' => $selectedFormId
                ],
            ],
        ];

        return array_merge($widgets, $widget);
    }

    /**
     * Save product form association when product is updated
     *
     * @param array $data
     * @param bool $isUpdated
     * @return void
     */
    public function saveProductFormAssociation($data, $isUpdated)
    {
        update_post_meta(
            Arr::get($data, 'ID'),
            '_fluent_form_id',
            Arr::get($data, 'metaValue.ff_product_form.name')
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

        $fields['setting_tabs']['schema']['additional_information']['schema']['additional_information_settings']['schema']['hr7'] = [
            "type" => "html",
            "value" => "<hr class='settings-devider'>"
        ];

        $fields['setting_tabs']['schema']['additional_information']['schema']['additional_information_settings']['schema']['fluent_forms_checkout'] = [
            "type" => "grid",
            "columns" => [
                "default" => 1,
                "md" => 3
            ],
            "disable_nesting" => true,
            "schema" => [
                "label" => [
                    "type" => "html",
                    "value" => "<span class='setting-label'>Select FluentForm for Fluent Cart Checkout</span>
                                <div class='form-note'>Map Fluent Form to render in Fluent Cart Checkout Page</div>"
                ],
                "fluent_forms" => [
                    "wrapperClass" => "col-span-2 flex items-center",
                    "type" => "select",
                    "filterable" => true,
                    'clearable' => true,
                    "options" => $forms,
                    "value" => ''
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
        $sanitizer['fluent_forms'] = 'intval';
        return $sanitizer;
    }

    /**
     * Render form before add to cart button
     *
     * @param array $viewData
     * @return void
     */
    public function renderFormBeforeAddToCart($viewData = [])
    {
        $productId = Arr::get($viewData, 'variants.0.post_id');

        if (!$productId) {
            return;
        }

        $formId = get_post_meta($productId, '_fluent_form_id', true);

        if (!$formId || $formId === 'none') {
            return;
        }

        $this->renderForm($formId, $productId, $viewData);
        $this->disableDefaultCartButtons();
    }

    /**
     * Disable default cart buttons and price display on product page
     *
     * @return void
     */
    protected function disableDefaultCartButtons()
    {
        $elementsToDisable = [
            'single_product_page_product_variants_iterator',
            'single_product_page_product_payment_type',
            'single_product_page_product_min_price',
            'single_product_page_product_price_separator',
            'single_product_page_product_max_price',
            'single_product_page_product_item_price',
            'single_product_page_product_quantity_container',
            'single_product_page_product_add_to_cart',
            'single_product_page_direct_checkout_button'
        ];

        foreach ($elementsToDisable as $element) {
            add_filter('fluent_cart/views/render_' . $element, '__return_false');
        }
    }

    /**
     * Render the form with proper integration
     *
     * @param int $formId
     * @param int $productId
     * @param array $viewData
     * @return void
     */
    protected function renderForm($formId, $productId, $viewData = [])
    {
        if (!$formId) {
            return;
        }

        $this->addFormAttributes($formId, $productId);
        $this->addVariationAttributesToRadioButtons($formId, $productId, $viewData);

        echo do_shortcode('[fluentform id="' . intval($formId) . '"]');
    }

    /**
     * Add form attributes for product integration
     *
     * @param int $formId
     * @param int $productId
     * @return void
     */
    protected function addFormAttributes($formId, $productId)
    {
        add_filter('fluentform/html_attributes', function($attributes, $form) use ($productId, $formId) {
            if ($form->id == $formId) {
                $attributes['data-product-id'] = $productId;
                $attributes['data-fluent-cart-form'] = 'true';
            }
            return $attributes;
        }, 10, 2);
    }

    /**
     * Add variation attributes to radio buttons
     *
     * @param int $formId
     * @param int $productId
     * @param array $viewData
     * @return void
     */
    protected function addVariationAttributesToRadioButtons($formId, $productId, $viewData)
    {
        add_filter('fluentform/rendering_field_html_input_radio', function($html, $data, $form) use ($productId, $viewData, $formId) {
            if ($form->id === $formId) {
                $variations = $this->getProductVariationsFromViewData($viewData, $productId);
                preg_match_all('/<input\s+([^>]*)>/i', $html, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);

                // Loop through matches in reverse order to avoid offset issues when replacing
                for ($i = count($matches) - 1; $i >= 0; $i--) {
                    // Get the full matched input tag and its position
                    $fullMatch = $matches[$i][0][0];
                    $position = $matches[$i][0][1];

                    // Get the current variation ID (if available)
                    $variationId = (isset($variations[$i]) && isset($variations[$i]['id'])) ? $variations[$i]['id'] : '';

                    // Create the replacement input tag with the new attributes
                    $replacement = '<input data-fluent-cart-single-product-page-product-variant data-cart-id="' . $variationId . '" ' . $matches[$i][1][0] . '>';

                    // Replace the original input tag with the modified one
                    $html = substr_replace($html, $replacement, $position, strlen($fullMatch));
                }
            }

            return $html;
        }, 10, 3);
    }

    /**
     * Handle form submission with cart integration
     *
     * @param int $insertId
     * @param array $formData
     * @param object $form
     * @return void
     */
    public function handleFormSubmissionWithCart($insertId, $formData, $form)
    {
        // Check if this submission is from a product page
        $productId = Arr::get($formData, '__fluent_form_embded_post_id');

        if (!$productId) {
            return;
        }

        // Store the association between form submission and product
        Helper::setSubmissionMeta($insertId, '_cart_product_id', $productId, $form->id);
    }

    /**
     * Render form before checkout
     *
     * @param array $data
     * @return void
     */
    public function renderFormBeforeCheckout($data)
    {
        add_filter('fluentform/is_hide_submit_btn_' . 1, '__return_true');
        add_filter('fluentform/replace_form_tag_' . 1, function ($tag) {
            return 'div';
        });

        $settings = new StoreSettings();
        $formId = intval($settings->get('fluent_forms'));

        if (!$formId) {
            return;
        }

        echo do_shortcode('[fluentform id="' . $formId . '"]');
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
     * Get list of forms for selection dropdowns
     *
     * @return array
     */
    protected function getFormsForSelection()
    {
        $forms = Form::select(['id as value', 'title as label'])
            ->orderBy('id', 'DESC')
            ->get()
            ->toArray();

        $forms[] = [
            'value' => 'none',
            'label' => 'No Form selected'
        ];

        return $forms;
    }

    /**
     * Get product variations from view data
     *
     * @param array $viewData
     * @param int $productId
     * @return array
     */
    protected function getProductVariationsFromViewData($viewData, $productId)
    {
        // If we have view data with variants, use it directly
        if (!empty($viewData['variants']) && is_array($viewData['variants'])) {
            $variationData = [];
            foreach ($viewData['variants'] as $variant) {
                $variationData[] = [
                    'id' => $variant['id'],
                    'price' => $variant['item_price'],
                    'original_price' => $variant['compare_price'] ?? $variant['item_price'],
                    'stock_status' => $variant['stock_status'] === 'in-stock' ? 'in_stock' : 'out_of_stock',
                    'stock_quantity' => $variant['available'] ?? 0,
                    'title' => $variant['variation_title'],
                    'description' => $variant['variation_identifier'] ?? '',
                    'formatted_price' => $variant['formatted_total'] ?? '',
                    'thumbnail' => $variant['thumbnail'] ?? ''
                ];
            }
            return $variationData;
        }

        return [];
    }

    /**
     * Check if Fluent Cart is active
     *
     * @return bool
     */
    protected function isFluentCartActive()
    {
        return function_exists('fluentCart') || class_exists('FluentCart\App\App');
    }
}