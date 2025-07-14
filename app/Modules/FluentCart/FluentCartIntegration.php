<?php

namespace FluentForm\App\Modules\FluentCart;

use FluentCart\Api\StoreSettings;
use Fluentcart\App\Models\Meta;
use FluentForm\App\Models\Form;
use FluentForm\App\Modules\Form\FormFieldsParser;
use FluentForm\App\Services\Form\SubmissionHandlerService;
use FluentForm\Framework\Foundation\Application;
use FluentForm\Framework\Support\Arr;

class FluentCartIntegration
{
    protected $app;

    public function __construct(Application $app)
    {
        $this->app = $app;
        $this->init();
    }

    public function init()
    {
        // Only initialize if Fluent Cart is active
        if (!$this->isFluentCartActive()) {
            return;
        }

        $this->connectCartProductWithForm();

        // Hook into Fluent Cart single product page rendering
        add_action('fluent_cart/views/before_single_product_page_product_variants_iterator', [$this, 'renderFormBeforeAddToCart'], 10);

        // Handle form submissions with cart integration
        add_action('fluentform/submission_inserted', [$this, 'handleFormSubmissionWithCart'], 10, 3);
        
        add_action('fluent_cart/views/after_checkout_page_order_notes', [$this, 'renderFormBeforeCheckout'], 10);

        add_filter("fluent_cart/store_setting_fields", function ($fields) {
            $forms = Form::select(['id as value', 'title as label'])
                ->orderBy('id', 'DESC')
                ->get()
                ->toArray();

            $forms[] = [
                'value' => 'none',
                'label' => 'No Form selected'
            ];
            
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
        });

        add_filter('fluent_cart/store_settings/sanitizer', function ($sanitizer) {
            $sanitizer['fluent_forms'] = 'intval';
            return $sanitizer;
        });
        
//        add_action('fluent_cart/after_checkout', [$this, 'fluentFormSubmission'], 10, 1);

        // Enqueue assets
        add_action('wp_enqueue_scripts', [$this, 'enqueueAssets']);
    }
    
    public function connectCartProductWithForm()
    {
        add_filter('fluent_cart/widgets/single_product_page', function ($widgets, $data) {
            $forms = Form::select(['id as value', 'title as label'])
                ->orderBy('id', 'DESC')
                ->get()
                ->toArray();

            $forms[] = [
                'value' => 'none',
                'label' => 'No Form selected'
            ];
            
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
        }, 10, 2);


        add_action('fluent_cart/product_updated', function($data, $isUpdated) {
            update_post_meta(
                Arr::get($data, 'ID'),
                '_fluent_form_id',
                Arr::get($data, 'metaValue.ff_product_form.name')
            );
        }, 10, 2);
    }

    /**
     * Render form before add to cart button
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

        add_filter('fluent_cart/views/render_single_product_page_product_variants_iterator', '__return_false');
        add_filter('fluent_cart/views/render_single_product_page_product_payment_type', '__return_false');

        add_filter('fluent_cart/views/render_single_product_page_product_min_price', '__return_false');
        add_filter('fluent_cart/views/render_single_product_page_product_price_separator', '__return_false');
        
        add_filter('fluent_cart/views/render_single_product_page_product_max_price', '__return_false');
        add_filter('fluent_cart/views/render_single_product_page_product_item_price', '__return_false');
        add_filter('fluent_cart/views/render_single_product_page_product_quantity_container', '__return_false');
        
        add_filter('fluent_cart/views/render_single_product_page_product_add_to_cart', '__return_false');
        add_filter('fluent_cart/views/render_single_product_page_product_add_to_cart', '__return_false');
        add_filter('fluent_cart/views/render_single_product_page_direct_checkout_button', '__return_false');
    }

    /**
     * Render the form
     */
    private function renderForm($formId, $productId, $viewData = [])
    {
        if (!$formId) {
            return;
        }

        add_filter('fluentform/html_attributes', function($attributes, $form) use ($productId, $formId) {
            if ($form->id == $formId) {
                $attributes['data-product-id'] = $productId;
                $attributes['data-fluent-cart-form'] = 'true';
            }
            return $attributes;
        }, 10, 2);

        // Add Fluent Cart variation attributes to radio buttons
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
        
        echo do_shortcode('[fluentform id="' . intval($formId) . '"]');

        remove_filter('fluentform/is_hide_submit_btn_' . $formId, '__return_true');
        remove_filter('fluentform/remove_form_tag_' . $formId, '__return_true');
    }

    /**
     * Handle form submission with cart integration
     */
    public function handleFormSubmissionWithCart($insertId, $formData, $form)
    {
        // Check if this submission is from a product page
        $productId = Arr::get($formData, '__fluent_form_embded_post_id');

        if (!$productId) {
            return;
        }

        // Store the association between form submission and product
        \FluentForm\App\Helpers\Helper::setSubmissionMeta($insertId, '_cart_product_id', $productId, $form->id);
    }
    
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

        wp_localize_script('fluent-cart-form-integration', 'fluentCartFormVars', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('fluent_cart_form_nonce'),
            'restUrl' => function_exists('fluentCart') ? rest_url('fluent-cart/v1/') : '',
            'restNonce' => wp_create_nonce('wp_rest'),
        ]);
    }

    /**
     * Get product variations from view data (preferred method)
     */
    private function getProductVariationsFromViewData($viewData, $productId)
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
        foreach ($fields as $field) {
            $key = Arr::get($field, 'attributes.name');
            if ($key) {
                $data[$key] = Arr::get($inputs,'inputs.' . $key);
            }
        }

        $data['_wp_http_referer'] = isset($data['_wp_http_referer']) ? sanitize_url(urldecode($data['_wp_http_referer'])) : '';

        try {
            $response = (new SubmissionHandlerService())->handleSubmission($data, $formId);

            // Log successful submission
            error_log('FluentForm submission successful for checkout. Form ID: ' . $formId . ', Insert ID: ' . ($response['insert_id'] ?? 'N/A'));

            return $response;
        } catch (\Exception $e) {
            // Log error but don't break the checkout process
            error_log('FluentForm submission failed during checkout: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Check if Fluent Cart is active
     */
    private function isFluentCartActive()
    {
        return function_exists('fluentCart') || class_exists('FluentCart\App\App');
    }
}
