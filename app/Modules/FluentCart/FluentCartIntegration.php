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
        // Product page integration
        $this->registerProductPageHooks();

        // Checkout page integration
        $this->registerCheckoutPageHooks();

        // Settings integration
        $this->registerSettingsHooks();

        // Multi Payment Component integration
        $this->registerMultiPaymentIntegration();

        // Form submission handling
        add_action('fluentform/submission_inserted', [$this, 'handleFormSubmissionWithCart'], 10, 3);

        // Form save handling - update product meta when form is saved
        add_action('fluentform/before_updating_form', [$this, 'handleFormSaved'], 10, 2);

        // Override form redirect behavior for add-to-cart forms
        add_filter('fluentform/form_submission_confirmation', [$this, 'overrideFormRedirectForCart'], 10, 3);
        add_filter('fluentform/submission_confirmation', [$this, 'hideMessageForCartForms'], 10, 5);

        add_action('fluent_cart/after_checkout', [$this, 'fluentFormSubmission'], 10, 1);

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
        add_filter("fluent_cart/store_settings/fields", [$this, 'addFormSettingsToFluentCart']);
        add_filter('fluent_cart/store_settings/sanitizer', [$this, 'addFormSettingsSanitizer']);
    }

    /**
     * Register Multi Payment Component integration hooks
     *
     * @return void
     */
    protected function registerMultiPaymentIntegration()
    {
        // Use editor_init hook to add FluentCart integration to existing component
        add_filter('fluentform/editor_init_element_multi_payment_component', [$this, 'addFluentCartIntegrationToComponent']);

        // Add fluent_cart_integration to advanced editor elements with higher priority
        add_filter('fluentform/editor_element_settings_placement', [$this, 'addFluentCartToAdvancedElements'], 30);

        // Add editor customization settings for MultiPaymentComponent
        add_filter('fluentform/editor_element_customization_settings', [$this, 'addFluentCartCustomizationSettings']);

        // Modify the component definition to include default Fluent Cart settings
        add_filter('fluentform/editor_components', [$this, 'addFluentCartToComponentDefaults'], 20);

        // Add AJAX handlers for admin
        add_action('wp_ajax_fluentform_get_fluent_cart_products', [$this, 'handleGetFluentCartProducts']);
        add_action('wp_ajax_fluentform_get_fluent_cart_variations', [$this, 'handleGetFluentCartVariations']);
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
            "type"  => "html",
            "value" => "<hr class='settings-devider'>"
        ];

        $fields['setting_tabs']['schema']['additional_information']['schema']['additional_information_settings']['schema']['fluent_forms_checkout'] = [
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

        $formId = get_post_meta($productId, '_fluent_cart_add_to_cart_fluent_form_id', true);

        if (!$formId) {
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
        $this->addVariationAttributes($formId, $productId, $viewData);

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
        add_filter('fluentform/html_attributes', function ($attributes, $form) use ($productId, $formId) {
            if ($form->id == $formId) {
                $attributes['data-product-id'] = $productId;
                $attributes['data-fluent-cart-form'] = 'true';
            }
            return $attributes;
        }, 10, 2);
    }

    /**
     * Add variation attributes to form fields for cart integration
     *
     * @param int $formId
     * @param int $productId
     * @param array $viewData
     * @return void
     */
    protected function addVariationAttributes($formId, $productId, $viewData)
    {
        // Handle MultiPaymentComponent
        add_filter('fluentform/rendering_field_html_multi_payment_component',
            function ($html, $data, $form) use ($productId, $viewData, $formId) {
                if ($form->id === $formId) {
                    $html = $this->addVariationAttributesToMultiPaymentComponent($html, $data, $form, $productId, $viewData);
                }
                return $html;
            }, 20, 3);
    }

    /**
     * Add variation attributes to MultiPaymentComponent
     *
     * @param string $html
     * @param array $data
     * @param object $form
     * @param int $productId
     * @param array $viewData
     * @return string
     */
    protected function addVariationAttributesToMultiPaymentComponent($html, $data, $form, $productId, $viewData)
    {
        // Check if this component has Fluent Cart integration
        $integration = Arr::get($data, 'settings.fluent_cart_integration');
        if (!$integration || !Arr::get($integration, 'enabled') || Arr::get($integration, 'product_id') != $productId) {
            return $html;
        }

        // Get pricing options from the form component
        $pricingOptions = Arr::get($data, 'settings.pricing_options', []);

        $titleToVariationMap = [];

        foreach ($pricingOptions as $index => $option) {
            $optionLabel = Arr::get($option, 'label', '');
            $fluentCartVariationId = Arr::get($option, 'fluent_cart_variation_id');

            if ($fluentCartVariationId && $optionLabel) {
                $titleToVariationMap[$optionLabel] = $fluentCartVariationId;
            }
        }

        // Find and modify radio input elements
        preg_match_all('/<input\s+([^>]*type=["\']radio["\'][^>]*)>/i', $html, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);

        // Loop through matches in reverse order to avoid offset issues when replacing
        for ($i = count($matches) - 1; $i >= 0; $i--) {
            $fullMatch = $matches[$i][0][0];
            $position = $matches[$i][0][1];
            $attributes = $matches[$i][1][0];

            // Extract the value attribute to determine which option this is
            if (preg_match('/value=["\']([^"\']*)["\']/', $attributes, $valueMatch)) {
                $optionTitle = $valueMatch[1];

                $variationId = isset($titleToVariationMap[$optionTitle]) ? $titleToVariationMap[$optionTitle] : '';

                // Create the replacement input tag with Fluent Cart attributes
                $replacement = '<input data-fluent-cart-single-product-page-product-variant data-cart-id="' . $variationId . '" ' . $attributes . '>';

                // Replace the original input tag with the modified one
                $html = substr_replace($html, $replacement, $position, strlen($fullMatch));
            }
        }

        return $html;
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
     * Override form redirect behavior for add-to-cart forms
     *
     * @param array $confirmation
     * @param array $formData
     * @param object $form
     * @return array
     */
    public function overrideFormRedirectForCart($confirmation, $formData, $form)
    {
        // Check if this form has Fluent Cart integration
        $hasFluentCartIntegration = $this->formHasFluentCartIntegration($form);

        if (!$hasFluentCartIntegration) {
            return $confirmation;
        }

        // Override confirmation settings for add-to-cart forms
        return [
            'redirectTo' => 'samePage',
            'messageToShow' => '',
            'customPage' => null,
            'samePageFormBehavior' => 'reset_form',
            'customUrl' => null
        ];
    }
    
    public function hideMessageForCartForms($returnData, $form, $confirmation, $insertId, $formData)
    {
        // Check if this form has Fluent Cart integration
        $hasFluentCartIntegration = $this->formHasFluentCartIntegration($form);

        if (!$hasFluentCartIntegration) {
            return $confirmation;
        }

        return [
            'message' => '',
            "action" => 'reset_form'
        ];
    }

    /**
     * Check if form has Fluent Cart integration
     *
     * @param object $form
     * @return bool
     */
    protected function formHasFluentCartIntegration($form)
    {
        $formFields = json_decode($form->form_fields, true);

        if (!is_array($formFields) || !isset($formFields['fields'])) {
            return false;
        }

        foreach ($formFields['fields'] as $field) {
            if (isset($field['element']) && $field['element'] === 'multi_payment_component') {
                $integration = Arr::get($field, 'settings.fluent_cart_integration');
                if ($integration && Arr::get($integration, 'enabled')) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Handle form save and update product meta
     *
     * @param object $form
     * @param array $data
     * @return void
     */
    public function handleFormSaved($form, $data)
    {
        if (!$this->isFluentCartActive()) {
            return;
        }

        $formFields = FormFieldsParser::getFields($form, true);
        
        foreach ($formFields as $field) {
            if (Arr::get($field, 'element') === 'multi_payment_component') {
                $integration = Arr::get($field, 'settings.fluent_cart_integration');

                if ($integration &&
                    Arr::get($integration, 'enabled') &&
                    $productId = Arr::get($integration, 'product_id')) {

                    // Update product meta to link it with this form
                    update_post_meta($productId, '_fluent_cart_add_to_cart_fluent_form_id', $form->id);
                }
            }
        }
    }

    /**
     * Render form before checkout
     *
     * @param array $data
     * @return void
     */
    public function renderFormBeforeCheckout($data)
    {
        $settings = new StoreSettings();
        $formId = intval($settings->get('fluent_forms'));

        if (!$formId) {
            return;
        }

        add_filter('fluentform/is_hide_submit_btn_' . $formId, '__return_true');
        add_filter('fluentform/replace_form_tag_' . $formId, function ($tag) {
            return 'div';
        });

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
        if (!class_exists('FluentForm\App\Models\Form')) {
            return [
                [
                    'value' => 'none',
                    'label' => 'FluentForm plugin not active'
                ]
            ];
        }

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
                    'id'              => $variant['id'],
                    'price'           => $variant['item_price'],
                    'original_price'  => $variant['compare_price'] ?? $variant['item_price'],
                    'stock_status'    => $variant['stock_status'] === 'in-stock' ? 'in_stock' : 'out_of_stock',
                    'stock_quantity'  => $variant['available'] ?? 0,
                    'title'           => $variant['variation_title'],
                    'description'     => $variant['variation_identifier'] ?? '',
                    'formatted_price' => $variant['formatted_total'] ?? '',
                    'thumbnail'       => $variant['thumbnail'] ?? ''
                ];
            }
            return $variationData;
        }

        return [];
    }

    /**
     * Get Fluent Cart products for searchable select
     *
     * @param array $items
     * @param string $search
     * @param array $ids
     * @return array
     */
    public function getFluentCartProducts($items, $search = '', $ids = [])
    {
        if (!$this->isFluentCartActive()) {
            return [];
        }

        try {
            // Use Fluent Cart's Product model to get products
            if (class_exists('FluentCart\App\Models\Product')) {
                $query = \FluentCart\App\Models\Product::query()
                    ->select(['ID as id', 'post_title as title'])
                    ->where('post_status', 'publish');

                if (!empty($search)) {
                    $query->where('post_title', 'LIKE', '%' . $search . '%');
                }

                if (!empty($ids)) {
                    $query->whereIn('ID', $ids);
                }

                $products = $query->get()->toArray();

                return array_map(function($product) {
                    return [
                        'id' => $product['id'],
                        'title' => $product['id'] . '# ' . $product['title']
                    ];
                }, $products);
            }
        } catch (\Exception $e) {
            error_log('FluentCart Products Error: ' . $e->getMessage());
        }

        return [];
    }

    /**
     * Get Fluent Cart product variations
     *
     * @param array $variations
     * @param int $productId
     * @return array
     */
    public function getFluentCartProductVariations($variations, $productId)
    {
        if (!$this->isFluentCartActive() || !$productId) {
            return [];
        }

        try {
            // Use Fluent Cart's ProductVariation model to get variations
            if (class_exists('FluentCart\App\Models\ProductVariation')) {
                $productVariations = \FluentCart\App\Models\ProductVariation::query()
                    ->where('post_id', $productId)
                    ->where('item_status', 'active')
                    ->orderBy('serial_index', 'asc')
                    ->get();

                $variationData = [];
                foreach ($productVariations as $variation) {
                    // Format price using Fluent Forms PaymentHelper
                    $formattedPrice = '';
                    if (class_exists('FluentFormPro\Payments\PaymentHelper')) {
                        $formattedPrice = \FluentFormPro\Payments\PaymentHelper::formatMoney($variation->item_price, 'USD');
                    } else {
                        // Fallback formatting - assuming price is in cents
                        $formattedPrice = '$' . number_format($variation->item_price / 100, 2);
                    }

                    $variationData[] = [
                        'id' => $variation->id,
                        'variation_title' => $variation->variation_title,
                        'item_price' => $variation->item_price,
                        'compare_price' => $variation->compare_price,
                        'thumbnail' => $variation->thumbnail ?? '',
                        'stock_status' => $variation->stock_status,
                        'formatted_total' => $formattedPrice,
                        'media' => $variation->media ?? []
                    ];
                }

                return $variationData;
            }
        } catch (\Exception $e) {
            error_log('FluentCart Product Variations Error: ' . $e->getMessage());
        }

        return [];
    }

    /**
     * Add FluentCart integration to MultiPaymentComponent via editor_init hook
     *
     * @param array $element
     * @return array
     */
    public function addFluentCartIntegrationToComponent($element)
    {
        if (!$this->isFluentCartActive()) {
            return $element;
        }

        // Add fluent_cart_integration to default settings
        if (!isset($element['settings']['fluent_cart_integration'])) {
            $element['settings']['fluent_cart_integration'] = [
                'enabled' => false,
                'product_id' => '',
                'variation_mapping' => []
            ];
        }

        return $element;
    }

    /**
     * Add fluent_cart_integration to advanced editor elements for multi_payment_component
     *
     * @param array $placement_settings
     * @return array
     */
    public function addFluentCartToAdvancedElements($placement_settings)
    {
        if (!$this->isFluentCartActive()) {
            return $placement_settings;
        }
        // Add fluent_cart_integration to advanced elements for multi_payment_component
        if (isset($placement_settings['multi_payment_component'])) {
            if (!isset($placement_settings['multi_payment_component']['advanced'])) {
                $placement_settings['multi_payment_component']['advanced'] = [];
            }

            if (!in_array('fluent_cart_integration', $placement_settings['multi_payment_component']['advanced'])) {
                $placement_settings['multi_payment_component']['advanced'][] = 'fluent_cart_integration';
            }
        }

        return $placement_settings;
    }

    /**
     * Add Fluent Cart customization settings to editor
     *
     * @param array $settings
     * @return array
     */
    public function addFluentCartCustomizationSettings($settings)
    {
        if (!$this->isFluentCartActive()) {
            return $settings;
        }

        $settings['fluent_cart_integration'] = [
            'template' => 'fluentCartIntegration',
            'label' => __('Fluent Cart Integration', 'fluentform'),
            'help_text' => __('Map this payment field with Fluent Cart products and variations', 'fluentform')
        ];

        return $settings;
    }

    /**
     * Handle AJAX request to get Fluent Cart products
     *
     * @return void
     */
    public function handleGetFluentCartProducts()
    {
        $request = $this->app->request->all();
        // Verify nonce and permissions
        if (!wp_verify_nonce(Arr::get($request, 'fluent_forms_admin_nonce'), 'fluent_forms_admin_nonce')) {
            wp_send_json_error([
                'message' => __('Nonce verification failed', 'fluentform')
            ]);
        }

        $search = sanitize_text_field(Arr::get($request, 'search', ''));
        $ids = array_map('intval', Arr::get($request, 'ids', []));

        $products = $this->getFluentCartProducts([], $search, $ids);

        wp_send_json_success([
            'products' => $products
        ]);
    }

    /**
     * Handle AJAX request to get Fluent Cart product variations
     *
     * @return void
     */
    public function handleGetFluentCartVariations()
    {
        $request = $this->app->request->all();
        // Verify nonce and permissions
        if (!wp_verify_nonce(Arr::get($request, 'fluent_forms_admin_nonce'), 'fluent_forms_admin_nonce')) {
            wp_send_json_error([
                'message' => __('Nonce verification failed', 'fluentform')
            ]);
        }

        $productId = intval(Arr::get($request, 'product_id', 0));

        $variations = $this->getFluentCartProductVariations([], $productId);

        wp_send_json_success([
            'variations' => $variations
        ]);
    }
    
    /**
     * Add Fluent Cart integration to component defaults
     *
     * @param array $components
     * @return array
     */
    public function addFluentCartToComponentDefaults($components)
    {
        // Only add if Fluent Cart is active
        if (!$this->isFluentCartActive()) {
            return $components;
        }

        // Find and modify the multi_payment_component in the components array
        if (isset($components['payments'])) {
            foreach ($components['payments'] as &$component) {
                if (isset($component['element']) && $component['element'] === 'multi_payment_component') {
                    // Add fluent_cart_integration to default settings
                    if (!isset($component['settings']['fluent_cart_integration'])) {
                        $component['settings']['fluent_cart_integration'] = [
                            'enabled' => false,
                            'product_id' => '',
                            'variation_mapping' => []
                        ];
                    }
                }
            }
        }

        return $components;
    }

    public function fluentFormSubmission($inputs)
    {
        $settings = new StoreSettings();
        $formId = intval($settings->get('fluent_forms'));

        if (!$formId) {
            return;
        }

        $form = Form::find($formId);
        if (!$form) {
            return;
        }

        $fields = FormFieldsParser::getInputs($form, ['attributes']);
        $data = [];
        $nestedParents = [];

        // First, identify all parent keys of nested fields
        foreach ($fields as $field) {
            $key = Arr::get($field, 'attributes.name');
            if (!$key) continue;

            if (strpos($key, '[') !== false && strpos($key, ']') !== false) {
                preg_match('/^([^\[]+)\[([^\]]+)\]/', $key, $matches);
                if (count($matches) === 3) {
                    $nestedParents[] = $matches[1];
                }
            }
        }

        // Remove duplicates
        $nestedParents = array_unique($nestedParents);

        // Now process all fields
        foreach ($fields as $field) {
            $key = Arr::get($field, 'attributes.name');
            if (!$key) continue;

            // Check if this is a nested field notation (with brackets)
            if (strpos($key, '[') !== false && strpos($key, ']') !== false) {
                // Skip these, we'll handle them through their parent
                continue;
            }
            // Check if this is a parent of nested fields
            elseif (in_array($key, $nestedParents)) {
                // Use the complete nested array from inputs
                if (isset($inputs['inputs'][$key]) && is_array($inputs['inputs'][$key])) {
                    $data[$key] = $inputs['inputs'][$key];
                }
            }
            // Regular field
            else {
                $data[$key] = Arr::get($inputs['inputs'], $key);
            }
        }

        $data['_fluentform_' . $formId . '_fluentformnonce'] = $inputs['inputs']['_fluentform_' . $formId . '_fluentformnonce'];
        $data['_wp_http_referer'] = $inputs['inputs']['_wp_http_referer'];

        try {
            $response = (new SubmissionHandlerService())->handleSubmission($data, $formId);
            return $response;
        } catch (\Exception $e) {
            return null;
        }
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