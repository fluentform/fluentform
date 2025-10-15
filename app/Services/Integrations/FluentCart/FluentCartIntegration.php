<?php

namespace FluentForm\App\Services\Integrations\FluentCart;

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Http\Controllers\IntegrationManagerController;
use FluentForm\Framework\Helpers\ArrayHelper;

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

/**
 * FluentCart Integration for FluentForm
 *
 * Converts form submissions into FluentCart orders automatically
 *
 * @since 1.0.0
 */
class FluentCartIntegration extends IntegrationManagerController
{
    use FluentCartHelper;

    public $hasGlobalMenu = false;
    public $disableGlobalSettings = 'yes';
    public $category = 'crm'; // Integration category

    public function __construct($app)
    {
        

        parent::__construct(
            $app,
            'FluentCart',
            'fluentcart',
            '_fluentform_fluentcart_settings',
            'fluentcart_feeds',
            16
        );

        

        $this->logo = $this->getLogoUrl();
        $this->description = __('Convert form submissions into FluentCart orders automatically. Perfect for custom order forms, service bookings, and more.', 'fluentform');

        // Register admin hooks
        

        // Check if integration is enabled before registering hooks
        $globalModules = get_option('fluentform_global_modules_status', []);
        $isEnabled = isset($globalModules[$this->integrationKey]) && 'yes' == $globalModules[$this->integrationKey];
        
        

        $this->registerAdminHooks();

        // Make this integration synchronous (not async)
        add_filter('fluentform/notifying_async_' . $this->integrationKey, '__return_false');
        

        // Add validation hook
        add_filter('fluentform/validation_errors', [$this, 'validateFluentCartFields'], 10, 3);

        // Add FluentCart info to entry details
        add_filter('fluentform/single_entry_widgets', [$this, 'addFluentCartInfoWidget'], 10, 2);

        
    }
    
    /**
     * Get integration logo URL
     */
    private function getLogoUrl()
    {
        if (defined('FLUENT_CART_PLUGIN_URL')) {
            return FLUENT_CART_PLUGIN_URL . 'assets/images/logo.svg';
        }
        return fluentFormMix('img/integrations/fluentcart.svg');
    }
    
    /**
     * Check if FluentCart is configured/active
     */
    public function isConfigured()
    {
        $hasVersion = defined('FLUENTCART_VERSION');
        $hasClass = class_exists('\FluentCart\App\Models\Order');

        
        

        return $hasVersion && $hasClass;
    }

    /**
     * Get API settings (not needed for FluentCart as it's internal)
     * This method is used by parent's isConfigured() method
     */
    public function getApiSettings()
    {
        $isActive = $this->isConfigured();

        return [
            'status' => $isActive,
            'message' => $isActive
                ? __('FluentCart is active and ready', 'fluentform')
                : __('FluentCart plugin is not installed or activated', 'fluentform')
        ];
    }

    /**
     * Notify/Process integration (called by notification system)
     * This is the main entry point for synchronous integrations
     *
     * @param array $feed The feed configuration
     * @param array $formData The submitted form data
     * @param object $entry The entry object
     * @param object $form The form object
     */
    public function notify($feed, $formData, $entry, $form)
    {
        
        
      


        

        // Validate form object
        if (!$form || !isset($form->id)) {
            
            return;
        }

        

        // Get the processed feed values
        $feedData = ArrayHelper::get($feed, 'processedValues', []);
        
        
        
        

        // Check if feed is enabled using ArrayHelper::isTrue() to handle various truthy values
        if (!ArrayHelper::isTrue($feedData, 'enabled')) {
            
            return;
        }

        

        // Process the feed and create order
        try {
            
            $this->processFeed($entry->id, $formData, $form, $feedData);

            

            do_action(
                'fluentform/integration_action_result',
                $feed,
                'success',
                __('FluentCart order has been successfully created', 'fluentform')
            );
        } catch (\Exception $e) {
            
            

            do_action(
                'fluentform/integration_action_result',
                $feed,
                'failed',
                $e->getMessage()
            );
        }

        
    }

    /**
     * Push integration to form settings
     */
    public function pushIntegration($integrations, $formId)
    {
        $integrations[$this->integrationKey] = [
            'category' => $this->category,
            'disable_global_settings' => 'yes',
            'title' => $this->title . ' Integration',
            'logo' => $this->logo,
            'is_active' => $this->isConfigured(),
            'configure_title' => __('Configuration required', 'fluentform'),
            'global_configure_url' => '',
            'configure_message' => __('FluentCart plugin must be installed and activated', 'fluentform'),
            'configure_button_text' => __('Learn More', 'fluentform')
        ];

        return $integrations;
    }
    
    /**
     * Get integration defaults
     */
    public function getIntegrationDefaults($settings, $formId)
    {
        // Auto-detect FluentCart Product field
        $productField = $this->getFirstFluentCartProductField($formId);

        // Determine default product source
        $defaultProductSource = $productField ? 'form_field' : 'fixed_product';

        return [
            'name' => '',
            'enabled' => 'no',
            'order_status' => 'pending',
            'customer_email_field' => '',
            'customer_name_field' => '', // Single name field (supports Name field with {inputs.name.value_text})
            'customer_phone_field' => '',
            'product_source' => $defaultProductSource, // Auto-detect: form_field if product field exists, otherwise fixed_product
            'product_field' => $productField, // Auto-filled with first FluentCart Product field
            'fixed_product_id' => '', // For fixed product
            'quantity_source' => 'fixed', // fixed or form_field
            'quantity_field' => '', // For dynamic quantity from form field
            'quantity_value' => '1', // For fixed quantity
            'billing_address_field' => '', // FluentForm Address field for billing
            'shipping_address_field' => '', // FluentForm Address field for shipping
            'custom_fields' => [],
            'conditionals' => [
                'conditions' => [],
                'status' => false,
                'type' => 'all'
            ]
        ];
    }
    
    /**
     * Get settings fields for form integration
     */
    public function getSettingsFields($settings, $formId)
    {
        // Return empty if no form ID (shouldn't happen, but safety check)
        if (!$formId) {
            return ['fields' => [], 'integration_title' => $this->title];
        }

        $fieldOptions = $this->getFormFields($formId);
        $productOptions = $this->getProductOptions();
        
        return [
            'fields' => [
                [
                    'key' => 'name',
                    'label' => __('Feed Name', 'fluentform'),
                    'required' => true,
                    'placeholder' => __('Your Feed Name', 'fluentform'),
                    'component' => 'text'
                ],
                [
                    'key' => 'enabled',
                    'label' => __('Status', 'fluentform'),
                    'component' => 'checkbox-single',
                    'checkbox_label' => __('Enable this feed', 'fluentform')
                ],
                [
                    'key' => 'order_status',
                    'label' => __('Order Status', 'fluentform'),
                    'component' => 'select',
                    'required' => true,
                    'options' => [
                        'pending' => __('Pending', 'fluentform'),
                        'processing' => __('Processing', 'fluentform'),
                        'draft' => __('Draft', 'fluentform'),
                        'on-hold' => __('On Hold', 'fluentform'),
                    ],
                    'tips' => __('Select the initial status for created orders', 'fluentform')
                ],
                [
                    'key' => 'customer_email_field',
                    'label' => __('Customer Email', 'fluentform'),
                    'component' => 'select',
                    'required' => true,
                    'options' => $fieldOptions,
                    'tips' => __('Select the form field that contains customer email', 'fluentform')
                ],
                [
                    'key' => 'customer_name_field',
                    'label' => __('Customer Name', 'fluentform'),
                    'component' => 'value_text',
                    'tips' => __('Use {inputs.name.value_text} for Name field, or select any text field. Leave empty to use logged-in user name.', 'fluentform')
                ],
                [
                    'key' => 'customer_phone_field',
                    'label' => __('Customer Phone', 'fluentform'),
                    'component' => 'select',
                    'options' => $fieldOptions,
                    'tips' => __('Select the form field that contains customer phone', 'fluentform')
                ],
                [
                    'key' => 'product_source',
                    'label' => __('Product Source', 'fluentform'),
                    'component' => 'radio_choice',
                    'required' => true,
                    'options' => [
                        'form_field' => __('From Form Field (User selects product)', 'fluentform'),
                        'fixed_product' => __('Fixed Product (Always same product)', 'fluentform'),
                    ],
                    'tips' => __('Choose how to determine which product to add to the order', 'fluentform'),
                    'inline_tip' => __('<strong>From Form Field:</strong> User selects product using FluentCart Product field in the form.<br><strong>Fixed Product:</strong> Always add the same product regardless of form input.', 'fluentform')
                ],
                [
                    'key' => 'product_field',
                    'label' => __('Product Field', 'fluentform'),
                    'component' => 'select',
                    'options' => $this->getFluentCartProductFields($formId),
                    'tips' => __('The FluentCart Product field that users will use to select products. Auto-detected if you have one in your form.', 'fluentform'),
                    'inline_tip' => __('Only used when Product Source is "From Form Field". If you don\'t see your field here, make sure you\'ve added a FluentCart Product field to your form.', 'fluentform')
                ],
                [
                    'key' => 'fixed_product_id',
                    'label' => __('Fixed Product', 'fluentform'),
                    'component' => 'select',
                    'options' => $productOptions,
                    'tips' => __('Select which product to always add to the order', 'fluentform'),
                    'inline_tip' => __('Only used when Product Source is "Fixed Product". This product will be added to every order created from this form.', 'fluentform')
                ],
                [
                    'key' => 'quantity_source',
                    'label' => __('Quantity Source', 'fluentform'),
                    'component' => 'radio_choice',
                    'options' => [
                        'fixed' => __('Fixed Quantity', 'fluentform'),
                        'form_field' => __('From Form Field', 'fluentform'),
                    ],
                    'tips' => __('Choose whether to use a fixed quantity or get it from a form field', 'fluentform')
                ],
                [
                    'key' => 'quantity_value',
                    'label' => __('Fixed Quantity Value', 'fluentform'),
                    'component' => 'value_text',
                    'tips' => __('Enter the quantity (default: 1). Only used if Quantity Source is "Fixed Quantity"', 'fluentform')
                ],
                [
                    'key' => 'quantity_field',
                    'label' => __('Quantity Field (for Dynamic)', 'fluentform'),
                    'component' => 'select',
                    'options' => $fieldOptions,
                    'tips' => __('Select the form field that contains the quantity. Only used if Quantity Source is "From Form Field"', 'fluentform')
                ],
                [
                    'key' => 'billing_address_field',
                    'label' => __('Billing Address Field', 'fluentform'),
                    'component' => 'select',
                    'options' => $this->getAddressFields($formId),
                    'tips' => __('Select the FluentForm Address field for billing address. Leave empty to skip billing address.', 'fluentform')
                ],
                [
                    'key' => 'shipping_address_field',
                    'label' => __('Shipping Address Field', 'fluentform'),
                    'component' => 'select',
                    'options' => $this->getAddressFields($formId),
                    'tips' => __('Select the FluentForm Address field for shipping address. Leave empty to skip shipping address.', 'fluentform')
                ],
                [
                    'require_list' => false,
                    'key' => 'conditionals',
                    'label' => __('Conditional Logic', 'fluentform'),
                    'tips' => __('Create order only when conditions are met', 'fluentform'),
                    'component' => 'conditional_block'
                ],
            ],
            'button_require_list' => false,
            'integration_title' => $this->title
        ];
    }
    
    /**
     * Get form fields for mapping
     */
    private function getFormFields($formId)
    {
        $formattedFields = ['' => __('Select Field', 'fluentform')];

        if (!$formId) {
            return $formattedFields;
        }

        $form = wpFluent()->table('fluentform_forms')->find($formId);

        if (!$form || !$form->form_fields) {
            return $formattedFields;
        }

        $fields = \json_decode($form->form_fields, true);

        if (!$fields || !isset($fields['fields']) || !is_array($fields['fields'])) {
            return $formattedFields;
        }

        foreach ($fields['fields'] as $field) {
            if (isset($field['attributes']['name'])) {
                $label = ArrayHelper::get($field, 'settings.label', $field['attributes']['name']);
                $formattedFields[$field['attributes']['name']] = $label;
            }
        }

        return $formattedFields;
    }

    /**
     * Get FluentCart Product fields from form
     */
    private function getFluentCartProductFields($formId)
    {
        $formattedFields = ['' => __('Select FluentCart Product Field', 'fluentform')];

        if (!$formId) {
            return $formattedFields;
        }

        $form = wpFluent()->table('fluentform_forms')->find($formId);

        if (!$form || !$form->form_fields) {
            return $formattedFields;
        }

        $fields = \json_decode($form->form_fields, true);

        if (!$fields || !isset($fields['fields']) || !is_array($fields['fields'])) {
            return $formattedFields;
        }

        foreach ($fields['fields'] as $field) {
            // Only include FluentCart Product fields
            if (isset($field['element']) && $field['element'] === 'fluentcart_product') {
                if (isset($field['attributes']['name'])) {
                    $label = ArrayHelper::get($field, 'settings.label', $field['attributes']['name']);
                    $formattedFields[$field['attributes']['name']] = $label;
                }
            }
        }

        return $formattedFields;
    }

    /**
     * Get Address fields from form
     */
    private function getAddressFields($formId)
    {
        $formattedFields = ['' => __('Select Address Field', 'fluentform')];

        if (!$formId) {
            return $formattedFields;
        }

        $form = wpFluent()->table('fluentform_forms')->find($formId);

        if (!$form || !$form->form_fields) {
            return $formattedFields;
        }

        $fields = \json_decode($form->form_fields, true);

        if (!$fields || !isset($fields['fields']) || !is_array($fields['fields'])) {
            return $formattedFields;
        }

        foreach ($fields['fields'] as $field) {
            // Only include Address fields
            if (isset($field['element']) && $field['element'] === 'address') {
                if (isset($field['attributes']['name'])) {
                    $label = ArrayHelper::get($field, 'settings.label', $field['attributes']['name']);
                    $formattedFields[$field['attributes']['name']] = $label;
                }
            }
        }

        return $formattedFields;
    }

    /**
     * Get the first FluentCart Product field from form (for auto-detection)
     */
    private function getFirstFluentCartProductField($formId)
    {
        if (!$formId) {
            return '';
        }

        $form = wpFluent()->table('fluentform_forms')->find($formId);

        if (!$form || !$form->form_fields) {
            return '';
        }

        $fields = \json_decode($form->form_fields, true);

        if (!$fields || !isset($fields['fields']) || !is_array($fields['fields'])) {
            return '';
        }

        foreach ($fields['fields'] as $field) {
            // Return the first FluentCart Product field found
            if (isset($field['element']) && $field['element'] === 'fluentcart_product') {
                if (isset($field['attributes']['name'])) {
                    return $field['attributes']['name'];
                }
            }
        }

        return '';
    }
    
    /**
     * Get FluentCart products for mapping
     */
    private function getProductOptions()
    {
        // Check if FluentCart is active
        if (!defined('FLUENTCART_VERSION')) {
            
            return ['' => __('FluentCart not active', 'fluentform')];
        }

        if (!class_exists('\FluentCart\App\Models\Product')) {
            
            return ['' => __('FluentCart Product class not found', 'fluentform')];
        }

        try {
            // Use the published() scope method from Product model
            // Load with detail relationship to get price info
            $products = \FluentCart\App\Models\Product::published()
                ->with('detail')
                ->limit(100)
                ->get();

            

            $options = ['' => __('Select Product', 'fluentform')];

            // Handle both collection and array
            $isEmpty = is_array($products) ? empty($products) : $products->isEmpty();

            if ($isEmpty) {
                $options[''] = __('No products found. Please create products in FluentCart first.', 'fluentform');
                return $options;
            }

            foreach ($products as $product) {
                $priceInfo = '';
                if ($product->detail && $product->detail->min_price) {
                    $priceInfo = ' - ' . \FluentCart\App\Helpers\Helper::toDecimal($product->detail->min_price);
                }
                $options[$product->ID] = $product->post_title . $priceInfo . ' (#' . $product->ID . ')';
            }

            
            return $options;
        } catch (\Exception $e) {
            
            
            return ['' => __('Error loading products: ' . $e->getMessage(), 'fluentform')];
        }
    }
    
    /**
     * Get merge fields (not used for FluentCart)
     */
    public function getMergeFields($list, $listId, $formId)
    {
        return [];
    }

    /**
     * Disable global menu (no global settings needed)
     */
    public function addGlobalMenu($setting)
    {
        return $setting;
    }

    /**
     * Get global fields (return empty - no global settings needed)
     */
    public function getGlobalFields($fields)
    {
        return [];
    }

    /**
     * Get global settings (return empty - no global settings needed)
     */
    public function getGlobalSettings($settings)
    {
        return [];
    }

    /**
     * Handle form submission and create FluentCart order
     *
     * @param int $submissionId
     * @param array $formData
     * @param object $form
     */
    public function handleFormSubmission($submissionId, $formData, $form)
    {
        if (!$this->isConfigured()) {
            return;
        }

        // Validate form object
        if (!$form || !isset($form->id)) {
            return;
        }

        // Get all feeds for this form
        $feeds = $this->getFormFeeds($form->id);

        if (!$feeds) {
            return;
        }

        foreach ($feeds as $feed) {
            $parsedValue = $feed['formattedValue'];

            // Check if feed is enabled
            if (ArrayHelper::get($parsedValue, 'enabled') !== 'yes') {
                continue;
            }

            // Check conditional logic
            if (!$this->checkCondition($parsedValue, $formData, $form)) {
                continue;
            }

            // Process the feed
            $this->processFeed($submissionId, $formData, $form, $parsedValue);
        }
    }

    /**
     * Process individual feed and create order
     */
    private function processFeed($submissionId, $formData, $form, $feed)
    {
        
        
        
        try {
            // Validate required fields
            
            $this->validateFeed($feed, $formData);
            

            // Get or create customer
            $customer = $this->getOrCreateCustomer($formData, $feed);

            if (!$customer) {
                throw new \Exception(__('Failed to create or find customer', 'fluentform'));
            }

            // Map form fields to order items
            $orderItems = $this->mapOrderItems($formData, $feed);

            if (empty($orderItems)) {
                throw new \Exception(__('No valid products found in form submission', 'fluentform'));
            }

            // Prepare order data
            $orderData = [
                'customer_id' => $customer->id,
                'status' => ArrayHelper::get($feed, 'order_status', 'pending'),
                'type' => 'payment',
                'source' => 'fluentform',
                'currency' => get_option('fluent_cart_currency', 'USD'),
                'order_hash' => wp_generate_uuid4(),
            ];

            // Create the order
            $order = \FluentCart\App\Models\Order::create($orderData);

            // Add order items
            foreach ($orderItems as $item) {
                $order->order_items()->create($item);
            }

            // Add billing address if mapped
            $billingAddressField = ArrayHelper::get($feed, 'billing_address_field');
            if (!empty($billingAddressField)) {
                $billingAddress = $this->mapAddress($formData, $billingAddressField);
                if ($billingAddress) {
                    $order->billing_address()->create($billingAddress);
                }
            }

            // Add shipping address if mapped
            $shippingAddressField = ArrayHelper::get($feed, 'shipping_address_field');
            if (!empty($shippingAddressField)) {
                $shippingAddress = $this->mapAddress($formData, $shippingAddressField);
                if ($shippingAddress) {
                    $order->shipping_address()->create($shippingAddress);
                }
            }

            // Calculate order totals from order items
            $subtotal = 0;
            foreach ($order->order_items as $item) {
                $subtotal += $item->line_total;
            }

            // Update order with calculated totals
            $order->subtotal = $subtotal;
            $order->tax_total = 0; // No tax calculation for now
            $order->shipping_total = 0; // No shipping calculation for now
            $order->shipping_tax = 0;
            $order->manual_discount_total = 0;
            $order->coupon_discount_total = 0;
            $order->total_amount = $subtotal; // Total = subtotal (no tax, shipping, or discounts)
            $order->save();

            // Link submission to order
            Helper::setSubmissionMeta($submissionId, '_fluentcart_order_id', $order->id, $form->id);
            Helper::setSubmissionMeta($submissionId, '_fluentcart_order_hash', $order->order_hash, $form->id);

            // Link order to submission
            $order->updateMeta('_fluentform_submission_id', $submissionId);
            $order->updateMeta('_fluentform_form_id', $form->id);
            $order->updateMeta('_fluentform_feed_name', ArrayHelper::get($feed, 'name', 'FluentForm Feed'));

            // Add custom fields as order meta
            $this->addCustomFields($order, $formData, $feed);

            // Add order log
            $order->addLog(
                __('Order created from FluentForm', 'fluentform'),
                sprintf(
                    __('Order created from FluentForm submission #%d (Form: %s)', 'fluentform'),
                    $submissionId,
                    $form->title
                ),
                'info'
            );

            // Sync payment if form has payment
            $this->syncPayment($submissionId, $order, $formData);

            // Fire action hook for extensibility
            do_action('fluentform/fluentcart_order_created', $order, $customer, $submissionId, $form, $feed);

           
            Helper::setSubmissionMeta(
                $submissionId,
                '_fluentcart_success',
                sprintf(__('Order #%d created successfully', 'fluentform'), $order->id),
                $form->id
            );

            // Add log entry to FluentForm logs table
            $logData = [
                'parent_source_id' => $form->id,
                'source_type'      => 'submission_item',
                'source_id'        => $submissionId,
                'component'        => 'FluentCart',
                'status'           => 'success',
                'title'            => ArrayHelper::get($feed, 'name', 'FluentCart Feed'),
                'description'      => sprintf(
                    __('Order #%d created successfully. Total: %s, Status: %s', 'fluentform'),
                    $order->id,
                    \FluentCart\App\Helpers\Helper::toDecimal($order->total_amount),
                    $order->status
                )
            ];

            do_action('fluentform/log_data', $logData);

        } catch (\Exception $e) {
           
            

           
            Helper::setSubmissionMeta(
                $submissionId,
                '_fluentcart_error',
                $e->getMessage(),
                $form->id
            );

            // Add error log entry to FluentForm logs table
            $logData = [
                'parent_source_id' => $form->id,
                'source_type'      => 'submission_item',
                'source_id'        => $submissionId,
                'component'        => 'FluentCart',
                'status'           => 'failed',
                'title'            => ArrayHelper::get($feed, 'name', 'FluentCart Feed'),
                'description'      => __('Order creation failed: ', 'fluentform') . $e->getMessage()
            ];

            do_action('fluentform/log_data', $logData);

            // Fire error hook
            do_action('fluentform/fluentcart_order_failed', $e, $submissionId, $form, $feed);
        }
    }

    /**
     * Get form feeds
     */
    private function getFormFeeds($formId)
    {
        if (!$formId) {
            return [];
        }

        $feeds = wpFluent()->table('fluentform_form_meta')
            ->where('form_id', $formId)
            ->where('meta_key', $this->settingsKey)
            ->get();

        if (!$feeds) {
            return [];
        }

        // Handle both collection and array
        if (is_array($feeds)) {
            $result = [];
            foreach ($feeds as $feed) {
                $feedArray = (array) $feed;
                $feedArray['formattedValue'] = json_decode($feed->value, true);
                $result[] = $feedArray;
            }
            return $result;
        }

        return $feeds->map(function($feed) {
                $feed->formattedValue = json_decode($feed->value, true);
                return (array) $feed;
            })
            ->toArray();
    }

    /**
     * Check conditional logic
     */
    private function checkCondition($parsedValue, $formData, $form)
    {
        $conditionals = ArrayHelper::get($parsedValue, 'conditionals');

        if (!$conditionals || !ArrayHelper::get($conditionals, 'status')) {
            return true;
        }

        return Helper::checkCondition($conditionals, $formData);
    }

    /**
     * Add FluentCart info widget to entry details
     */
    public function addFluentCartInfoWidget($widgets, $entryData)
    {
        if (!defined('FLUENTCART_VERSION')) {
            return $widgets;
        }

        $submissionId = $entryData['entry']->id;

        // Get FluentCart order ID from submission meta
        $orderIdMeta = wpFluent()->table('fluentform_submission_meta')
            ->where('response_id', $submissionId)
            ->where('meta_key', '_fluentcart_order_id')
            ->first();

        if (!$orderIdMeta) {
            return $widgets;
        }

        $orderId = $orderIdMeta->value;

        // Get order details
        $order = \FluentCart\App\Models\Order::find($orderId);

        if (!$order) {
            return $widgets;
        }

        // Get success/error messages
        $successMeta = wpFluent()->table('fluentform_submission_meta')
            ->where('response_id', $submissionId)
            ->where('meta_key', '_fluentcart_success')
            ->first();

        $errorMeta = wpFluent()->table('fluentform_submission_meta')
            ->where('response_id', $submissionId)
            ->where('meta_key', '_fluentcart_error')
            ->first();

        // Build widget content
        $content = '<div class="fluentcart-entry-info">';

        // Order link
        $orderUrl = admin_url('admin.php?page=fluent-cart#/orders/' . $order->id);
        $content .= '<p><strong>' . __('Order ID:', 'fluentform') . '</strong> ';
        $content .= '<a href="' . esc_url($orderUrl) . '" target="_blank">#' . $order->id . '</a></p>';

        // Order status
        $content .= '<p><strong>' . __('Status:', 'fluentform') . '</strong> ';
        $content .= '<span class="ff-badge ff-badge-' . esc_attr($order->status) . '">' . ucfirst($order->status) . '</span></p>';

        // Order total
        if ($order->total_amount) {
            $content .= '<p><strong>' . __('Total:', 'fluentform') . '</strong> ';
            $content .= \FluentCart\App\Helpers\Helper::toDecimal($order->total_amount) . '</p>';
        }

        // Payment status
        if ($order->payment_status) {
            $content .= '<p><strong>' . __('Payment Status:', 'fluentform') . '</strong> ';
            $content .= '<span class="ff-badge ff-badge-' . esc_attr($order->payment_status) . '">' . ucfirst($order->payment_status) . '</span></p>';
        }

        // Order hash
        if ($order->order_hash) {
            $content .= '<p><strong>' . __('Order Hash:', 'fluentform') . '</strong> ';
            $content .= '<code style="font-size: 11px;">' . esc_html($order->order_hash) . '</code></p>';
        }

        // Success message
        if ($successMeta && $successMeta->value) {
            $content .= '<div style="margin-top: 10px; padding: 10px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; color: #155724;">';
            $content .= '<strong>✓ ' . esc_html($successMeta->value) . '</strong>';
            $content .= '</div>';
        }

        // Error message
        if ($errorMeta && $errorMeta->value) {
            $content .= '<div style="margin-top: 10px; padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; color: #721c24;">';
            $content .= '<strong>✗ ' . esc_html($errorMeta->value) . '</strong>';
            $content .= '</div>';
        }

        $content .= '</div>';

        // Add widget
        $widgets['fluentcart_order'] = [
            'title' => __('FluentCart Order', 'fluentform'),
            'content' => $content
        ];

        return $widgets;
    }
}

