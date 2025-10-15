<?php

namespace FluentForm\App\Services\Integrations\FluentCart;

use FluentForm\App\Services\FormBuilder\BaseFieldManager;
use FluentForm\Framework\Helpers\ArrayHelper;

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

/**
 * FluentCart Product Selector Field
 * 
 * Custom form field for selecting FluentCart products
 * 
 * @since 1.0.0
 */
class FluentCartProductField extends BaseFieldManager
{
    public function __construct()
    {
        parent::__construct(
            'fluentcart_product',
            'FluentCart Product',
            ['product', 'ecommerce', 'cart', 'fluentcart'],
            'advanced'
        );

        // Add field to editor
        add_filter('fluentform/editor_init_element_' . $this->key, [$this, 'pushEditorComponent']);

        // Note: render action is already registered by parent::register()
        // Scripts are enqueued in the render() method

        // Format response for display
        add_filter('fluentform/response_render_' . $this->key, [$this, 'formatResponse'], 10, 3);

        // Register custom settings via filters
        add_filter('fluentform/editor_element_customization_settings', [$this, 'addCustomizationSettings']);
        add_filter('fluentform/element_settings_placement', [$this, 'addSettingsPlacement']);

        // Register AJAX endpoint for product fetching
        add_action('wp_ajax_fluentform_get_fluentcart_products', [$this, 'getProductsForEditor']);
    }
    
    /**
     * Get component structure
     */
    public function getComponent()
    {
        return [
            'index' => 20,
            'element' => $this->key,
            'attributes' => [
                'name' => 'fluentcart_product',
                'value' => '',
                'class' => '',
                'product_source' => 'all', // all, specific, category
                'product_ids' => [],
                'category_ids' => [],
                'show_price' => 'yes',
                'show_image' => 'yes',
                'show_description' => 'no',
                'layout' => 'dropdown', // dropdown, radio, checkbox
                'enable_quantity' => 'no',
                'enable_search' => 'no', // Enable search for dropdown
                'product_limit' => '100', // Limit number of products to display
            ],
            'settings' => [
                'container_class' => '',
                'label' => __('Select Product', 'fluentform'),
                'label_placement' => '',
                'help_message' => '',
                'admin_field_label' => '',
                'validation_rules' => [
                    'required' => [
                        'value' => false,
                        'message' => __('This field is required', 'fluentform')
                    ]
                ],
                'conditional_logics' => []
            ],
            'editor_options' => [
                'title' => __('FluentCart Product', 'fluentform'),
                'icon_class' => 'ff-edit-shopping-cart',
                'template' => 'inputText',
                'element' => $this->key
            ]
        ];
    }
    
    /**
     * Push component to editor
     */
    public function pushEditorComponent($element)
    {
        return $element;
    }

    /**
     * Get products for editor (AJAX endpoint)
     */
    public function getProductsForEditor()
    {
        // Verify nonce - FluentForm uses fluent_forms_admin_nonce (with underscores)
        check_ajax_referer('fluent_forms_admin_nonce', 'fluent_forms_admin_nonce');

        if (!defined('FLUENTCART_VERSION') || !class_exists('\FluentCart\App\Models\Product')) {
            wp_send_json_error(['message' => __('FluentCart is not active', 'fluentform')]);
        }

        try {
            $search = isset($_REQUEST['search']) ? sanitize_text_field($_REQUEST['search']) : '';
            $page = isset($_REQUEST['page']) ? intval($_REQUEST['page']) : 1;
            $perPage = 50;

            $query = \FluentCart\App\Models\Product::published()->with('detail');

            // Search by title
            if ($search) {
                $query->where('post_title', 'LIKE', '%' . $search . '%');
            }

            // Pagination
            $total = $query->count();
            $products = $query->limit($perPage)
                ->offset(($page - 1) * $perPage)
                ->get();

            $formattedProducts = [];
            foreach ($products as $product) {
                $priceInfo = '';
                if ($product->detail && $product->detail->min_price) {
                    $priceInfo = ' - ' . \FluentCart\App\Helpers\Helper::toDecimal($product->detail->min_price);
                }

                $formattedProducts[] = [
                    'id' => $product->ID,
                    'title' => $product->post_title . $priceInfo . ' (#' . $product->ID . ')',
                    'value' => $product->ID,
                    'label' => $product->post_title . $priceInfo,
                ];
            }

            wp_send_json_success([
                'products' => $formattedProducts,
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
            ]);
        } catch (\Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * Get editor customization settings
     */
    public function getEditorCustomizationSettings()
    {
        return [
            'selectProductIds' => [
                'template' => 'selectProductIds',
                'label' => __('Select Products', 'fluentform'),
            ],
        ];
    }

    /**
     * Get general editor elements
     */
    public function getGeneralEditorElements()
    {
        return [
            'label',
            'admin_field_label',
            'label_placement',
            'layout',
            'product_source',
            'product_ids',
            'product_limit',
            'enable_search',
            'show_price',
            'show_image',
            'show_description',
            'enable_quantity',
            'validation_rules',
        ];
    }

    /**
     * Get advanced editor elements
     */
    public function getAdvancedEditorElements()
    {
        return [
            'name',
            'help_message',
            'container_class',
            'class',
            'conditional_logics',
        ];
    }

    /**
     * General editor element extras
     */
    public function generalEditorElement()
    {
        return [
            'layout' => [
                'template' => 'radio',
                'label' => __('Display Layout', 'fluentform'),
                'help_text' => __('Select how you want to display the products', 'fluentform'),
                'options' => [
                    [
                        'value' => 'dropdown',
                        'label' => __('Dropdown', 'fluentform'),
                    ],
                    [
                        'value' => 'radio',
                        'label' => __('Radio Buttons', 'fluentform'),
                    ],
                    [
                        'value' => 'checkbox',
                        'label' => __('Checkboxes', 'fluentform'),
                    ],
                ],
            ],
            'product_source' => [
                'template' => 'radio',
                'label' => __('Product Source', 'fluentform'),
                'help_text' => __('Select which products to display', 'fluentform'),
                'options' => [
                    [
                        'value' => 'all',
                        'label' => __('All Products', 'fluentform'),
                    ],
                    [
                        'value' => 'specific',
                        'label' => __('Specific Products', 'fluentform'),
                    ],
                ],
            ],
            'product_ids' => [
                'template' => 'selectProductIds',
                'label' => __('Select Products', 'fluentform'),
                'help_text' => __('Choose which products to display in this field', 'fluentform'),
                'dependency' => [
                    'depends_on' => 'attributes/product_source',
                    'value' => 'specific',
                    'operator' => '==',
                ],
            ],
            'product_limit' => [
                'template' => 'inputText',
                'label' => __('Product Limit', 'fluentform'),
                'help_text' => __('Maximum number of products to display (default: 100)', 'fluentform'),
                'dependency' => [
                    'depends_on' => 'attributes/product_source',
                    'value' => 'all',
                    'operator' => '==',
                ],
            ],
            'enable_search' => [
                'template' => 'inputYesNoCheckBox',
                'label' => __('Enable Search', 'fluentform'),
                'help_text' => __('Add search functionality for dropdown (useful for many products)', 'fluentform'),
                'dependency' => [
                    'depends_on' => 'attributes/layout',
                    'value' => 'dropdown',
                    'operator' => '==',
                ],
            ],
            'show_price' => [
                'template' => 'inputYesNoCheckBox',
                'label' => __('Show Price', 'fluentform'),
                'help_text' => __('Display product prices', 'fluentform'),
            ],
            'show_image' => [
                'template' => 'inputYesNoCheckBox',
                'label' => __('Show Image', 'fluentform'),
                'help_text' => __('Display product images (for radio/checkbox layouts)', 'fluentform'),
            ],
            'show_description' => [
                'template' => 'inputYesNoCheckBox',
                'label' => __('Show Description', 'fluentform'),
                'help_text' => __('Display product descriptions (for radio/checkbox layouts)', 'fluentform'),
            ],
            'enable_quantity' => [
                'template' => 'inputYesNoCheckBox',
                'label' => __('Enable Quantity', 'fluentform'),
                'help_text' => __('Allow users to select quantity', 'fluentform'),
            ],
        ];
    }
    
    /**
     * Render field on frontend
     */
    public function render($data, $form)
    {
        // Validate form object
        if (!is_object($form)) {
            error_log('FluentCart Product Field: Form object is not valid');
            return;
        }

        $elementName = $data['element'];
        $data = apply_filters('fluentform/rendering_field_data_' . $elementName, $data, $form);

        $products = $this->getProducts($data['attributes']);

        error_log('FluentCart Product Field Render: Got ' . count($products) . ' products');

        if (empty($products)) {
            echo '<div class="ff-el-group">';
            echo '<p class="ff-el-help-message" style="color: #e74c3c;">' . __('No FluentCart products available. Please create products in FluentCart first.', 'fluentform') . '</p>';
            echo '</div>';
            return;
        }

        // Enqueue scripts for this field
        $this->enqueueScripts();

        $layout = ArrayHelper::get($data, 'attributes.layout', 'dropdown');
        $showPrice = ArrayHelper::get($data, 'attributes.show_price') === 'yes';
        $showImage = ArrayHelper::get($data, 'attributes.show_image') === 'yes';
        $showDescription = ArrayHelper::get($data, 'attributes.show_description') === 'yes';
        $enableQuantity = ArrayHelper::get($data, 'attributes.enable_quantity') === 'yes';
        $required = ArrayHelper::get($data, 'settings.validation_rules.required.value', false);

        ?>
        <div class="ff-el-group ff-el-form-control fluentcart-product-field" data-products='<?php echo esc_attr(json_encode($products)); ?>'>
            <div class="ff-el-input--label">
                <label for="<?php echo esc_attr($data['attributes']['name']); ?>">
                    <?php echo fluentform_sanitize_html($data['settings']['label']); ?>
                    <?php if ($required): ?>
                        <span class="ff-el-is-required">*</span>
                    <?php endif; ?>
                </label>
            </div>
            
            <div class="ff-el-input--content">
                <?php if ($layout === 'dropdown'): ?>
                    <?php $this->renderDropdown($data, $products, $showPrice); ?>
                <?php elseif ($layout === 'radio'): ?>
                    <?php $this->renderRadio($data, $products, $showPrice, $showImage, $showDescription); ?>
                <?php elseif ($layout === 'checkbox'): ?>
                    <?php $this->renderCheckbox($data, $products, $showPrice, $showImage, $showDescription); ?>
                <?php endif; ?>
                
                <?php if ($enableQuantity): ?>
                    <div class="fluentcart-quantity-wrapper" style="margin-top: 10px;">
                        <label><?php _e('Quantity:', 'fluentform'); ?></label>
                        <input type="number" 
                               name="<?php echo esc_attr($data['attributes']['name']); ?>_quantity" 
                               class="ff-el-form-control fluentcart-quantity"
                               value="1" 
                               min="1" 
                               step="1">
                    </div>
                <?php endif; ?>
                
                <?php if ($showPrice): ?>
                    <div class="fluentcart-price-display" style="margin-top: 10px; font-weight: bold;">
                        <?php _e('Total:', 'fluentform'); ?> <span class="price-amount">$0.00</span>
                    </div>
                <?php endif; ?>
            </div>
            
            <?php if (!empty($data['settings']['help_message'])): ?>
                <div class="ff-el-help-message"><?php echo fluentform_sanitize_html($data['settings']['help_message']); ?></div>
            <?php endif; ?>
        </div>
        <?php
    }
    
    /**
     * Render dropdown layout
     */
    private function renderDropdown($data, $products, $showPrice)
    {
        ?>
        <select name="<?php echo esc_attr($data['attributes']['name']); ?>" 
                class="ff-el-form-control fluentcart-product-select"
                data-name="<?php echo esc_attr($data['attributes']['name']); ?>">
            <option value=""><?php _e('Select a product', 'fluentform'); ?></option>
            <?php foreach ($products as $product): ?>
                <option value="<?php echo esc_attr($product['id']); ?>" 
                        data-price="<?php echo esc_attr($product['price']); ?>">
                    <?php echo esc_html($product['title']); ?>
                    <?php if ($showPrice): ?>
                        - <?php echo esc_html($product['price_formatted']); ?>
                    <?php endif; ?>
                </option>
            <?php endforeach; ?>
        </select>
        <?php
    }
    
    /**
     * Render radio layout
     */
    private function renderRadio($data, $products, $showPrice, $showImage, $showDescription)
    {
        foreach ($products as $product) {
            ?>
            <div class="ff-el-form-check fluentcart-product-option">
                <label class="ff-el-form-check-label">
                    <input type="radio" 
                           name="<?php echo esc_attr($data['attributes']['name']); ?>" 
                           value="<?php echo esc_attr($product['id']); ?>"
                           data-price="<?php echo esc_attr($product['price']); ?>"
                           class="ff-el-form-check-input fluentcart-product-radio">
                    
                    <?php if ($showImage && !empty($product['image'])): ?>
                        <img src="<?php echo esc_url($product['image']); ?>" 
                             alt="<?php echo esc_attr($product['title']); ?>"
                             class="fluentcart-product-image"
                             style="width: 60px; height: 60px; object-fit: cover; margin-right: 10px; vertical-align: middle;">
                    <?php endif; ?>
                    
                    <span class="fluentcart-product-title"><?php echo esc_html($product['title']); ?></span>
                    
                    <?php if ($showPrice): ?>
                        <span class="fluentcart-product-price" style="margin-left: 10px; font-weight: bold;">
                            <?php echo esc_html($product['price_formatted']); ?>
                        </span>
                    <?php endif; ?>
                    
                    <?php if ($showDescription && !empty($product['description'])): ?>
                        <div class="fluentcart-product-description" style="margin-top: 5px; font-size: 0.9em; color: #666;">
                            <?php echo esc_html(wp_trim_words($product['description'], 20)); ?>
                        </div>
                    <?php endif; ?>
                </label>
            </div>
            <?php
        }
    }
    
    /**
     * Render checkbox layout
     */
    private function renderCheckbox($data, $products, $showPrice, $showImage, $showDescription)
    {
        foreach ($products as $product) {
            ?>
            <div class="ff-el-form-check fluentcart-product-option">
                <label class="ff-el-form-check-label">
                    <input type="checkbox" 
                           name="<?php echo esc_attr($data['attributes']['name']); ?>[]" 
                           value="<?php echo esc_attr($product['id']); ?>"
                           data-price="<?php echo esc_attr($product['price']); ?>"
                           class="ff-el-form-check-input fluentcart-product-checkbox">
                    
                    <?php if ($showImage && !empty($product['image'])): ?>
                        <img src="<?php echo esc_url($product['image']); ?>" 
                             alt="<?php echo esc_attr($product['title']); ?>"
                             class="fluentcart-product-image"
                             style="width: 60px; height: 60px; object-fit: cover; margin-right: 10px; vertical-align: middle;">
                    <?php endif; ?>
                    
                    <span class="fluentcart-product-title"><?php echo esc_html($product['title']); ?></span>
                    
                    <?php if ($showPrice): ?>
                        <span class="fluentcart-product-price" style="margin-left: 10px; font-weight: bold;">
                            <?php echo esc_html($product['price_formatted']); ?>
                        </span>
                    <?php endif; ?>
                    
                    <?php if ($showDescription && !empty($product['description'])): ?>
                        <div class="fluentcart-product-description" style="margin-top: 5px; font-size: 0.9em; color: #666;">
                            <?php echo esc_html(wp_trim_words($product['description'], 20)); ?>
                        </div>
                    <?php endif; ?>
                </label>
            </div>
            <?php
        }
    }
    
    /**
     * Get products based on field settings
     */
    private function getProducts($attributes)
    {
        if (!defined('FLUENTCART_VERSION')) {
            error_log('FluentCart Product Field: FLUENTCART_VERSION not defined');
            return [];
        }

        if (!class_exists('\FluentCart\App\Models\Product')) {
            error_log('FluentCart Product Field: Product class not found');
            return [];
        }

        try {
            // Use the published() scope method from Product model
            // Load with detail relationship to get price info
            $query = \FluentCart\App\Models\Product::published()->with('detail');

            $productSource = ArrayHelper::get($attributes, 'product_source', 'all');

            // Filter by source
            if ($productSource === 'specific' && !empty($attributes['product_ids'])) {
                $query->whereIn('ID', $attributes['product_ids']);
            } elseif ($productSource === 'category' && !empty($attributes['category_ids'])) {
                // Filter by category if your product model supports it
                // Adjust this based on your actual category implementation
            }

            // Apply product limit (default 100)
            $limit = intval(ArrayHelper::get($attributes, 'product_limit', 100));
            if ($limit <= 0) {
                $limit = 100;
            }

            $products = $query->limit($limit)->get();

            if (!$products) {
                return [];
            }

            error_log('FluentCart Product Field: Found ' . (is_countable($products) ? count($products) : 0) . ' products');

            // Format products for frontend - handle both collection and array
            $formatProduct = function($product) {
                // Get price from product detail (stored in cents)
                $priceInCents = 0;
                if ($product->detail && $product->detail->min_price) {
                    $priceInCents = $product->detail->min_price;
                }

                // Convert price from cents to decimal for JavaScript
                $priceDecimal = \FluentCart\App\Helpers\Helper::toDecimalWithoutComma($priceInCents);

                // Format price for display using FluentCart helper
                $priceFormatted = \FluentCart\App\Helpers\Helper::toDecimal($priceInCents);

                return [
                    'id' => $product->ID,
                    'title' => $product->post_title,
                    'price' => $priceDecimal, // Price in decimal format for JS calculations
                    'price_formatted' => $priceFormatted, // Formatted price for display
                    'image' => $product->thumbnail ?? '',
                    'description' => $product->post_excerpt ?? '',
                ];
            };

            // Handle both collection and array
            if (is_array($products)) {
                return array_map($formatProduct, $products);
            }

            return $products->map($formatProduct)->toArray();
        } catch (\Exception $e) {
            error_log('FluentCart Product Field Error: ' . $e->getMessage());
            error_log('FluentCart Product Field Error trace: ' . $e->getTraceAsString());
            return [];
        }
    }
    
    /**
     * Enqueue scripts for price calculation
     */
    private function enqueueScripts()
    {
        static $scriptsEnqueued = false;

        // Only enqueue once per page load
        if ($scriptsEnqueued) {
            return;
        }

        $scriptsEnqueued = true;

        // Enqueue inline script for price calculation
        wp_add_inline_script('fluent-form-submission', "
            jQuery(document).ready(function($) {
                // Update price when product or quantity changes
                $('.fluentcart-product-select, .fluentcart-product-radio, .fluentcart-product-checkbox, .fluentcart-quantity').on('change', function() {
                    var container = $(this).closest('.fluentcart-product-field');
                    var price = 0;

                    // Get selected product(s) price
                    container.find('input:checked, select option:selected').each(function() {
                        var itemPrice = parseFloat($(this).data('price')) || 0;
                        price += itemPrice;
                    });

                    // Multiply by quantity if enabled
                    var quantity = parseInt(container.find('.fluentcart-quantity').val()) || 1;
                    var total = price * quantity;

                    container.find('.price-amount').text('$' + total.toFixed(2));
                });

                // Trigger initial calculation
                $('.fluentcart-product-select, .fluentcart-product-radio:checked, .fluentcart-product-checkbox:checked').first().trigger('change');
            });
        ");
    }
    
    /**
     * Format response for display in entries
     */
    public function formatResponse($value, $field, $form_id)
    {
        if (!$value || !class_exists('\FluentCart\App\Models\Product')) {
            return $value;
        }

        // Handle array of product IDs (checkbox)
        if (is_array($value)) {
            $productTitles = [];
            foreach ($value as $productId) {
                $product = \FluentCart\App\Models\Product::find($productId);
                if ($product) {
                    $productTitles[] = $product->post_title;
                }
            }
            return implode(', ', $productTitles);
        }

        // Handle single product ID
        $product = \FluentCart\App\Models\Product::find($value);
        return $product ? $product->post_title : $value;
    }

    /**
     * Add custom settings to element customization
     */
    public function addCustomizationSettings($settings)
    {
        $settings['selectProductIds'] = [
            'template'  => 'selectProductIds',
            'label'     => __('Select Products', 'fluentform'),
            'help_text' => __('Choose which products to display in this field', 'fluentform'),
        ];

        return $settings;
    }

    /**
     * Add settings placement for this field
     */
    public function addSettingsPlacement($placements)
    {
        $placements['fluentcart_product'] = [
            'general' => [
                'label',
                'admin_field_label',
                'label_placement',
                'layout',
                'product_source',
                'product_ids',
                'product_limit',
                'enable_search',
                'show_price',
                'show_image',
                'show_description',
                'enable_quantity',
                'validation_rules',
            ],
            'advanced' => [
                'name',
                'help_message',
                'container_class',
                'class',
                'conditional_logics',
            ],
        ];

        return $placements;
    }
}

