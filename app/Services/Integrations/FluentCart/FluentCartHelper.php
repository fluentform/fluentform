<?php

namespace FluentForm\App\Services\Integrations\FluentCart;

use FluentForm\Framework\Helpers\ArrayHelper;

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

/**
 * FluentCart Integration Helper Methods
 *
 * @since 1.0.0
 */
trait FluentCartHelper
{
    /**
     * Validate feed configuration
     *
     * @param array $feed
     * @param array $formData
     * @throws \Exception
     */
    private function validateFeed(&$feed, $formData)
    {
        // Validate email field
        
        $emailField = ArrayHelper::get($feed, 'customer_email_field');
        if (empty($emailField)) {
            throw new \Exception(__('Customer email field is required', 'fluentform'));
        }

        $email = $this->getFieldValue($formData, $emailField);
        if (empty($email) || !is_email($email)) {
            throw new \Exception(__('Valid customer email is required to create order', 'fluentform'));
        }

        // Validate product configuration based on product source
        $productSource = ArrayHelper::get($feed, 'product_source', 'form_field');

        if ($productSource === 'form_field') {
            // Auto-detect product field if not configured
            $productField = ArrayHelper::get($feed, 'product_field');
            if (empty($productField)) {
                // Try to auto-detect FluentCart Product field from form data
                $productField = $this->autoDetectProductField($formData);
                if ($productField) {
                    $feed['product_field'] = $productField;
                    error_log('FluentCart Integration: Auto-detected product field: ' . $productField);
                } else {
                    throw new \Exception(__('Product field is required when using form field as product source. Please add a FluentCart Product field to your form or select a fixed product.', 'fluentform'));
                }
            }
        } elseif ($productSource === 'fixed_product') {
            // Validate that fixed product is configured
            $fixedProductId = ArrayHelper::get($feed, 'fixed_product_id');
            if (empty($fixedProductId)) {
                throw new \Exception(__('Fixed product ID is required when using fixed product as product source', 'fluentform'));
            }
        } else {
            throw new \Exception(__('Invalid product source configuration', 'fluentform'));
        }
    }
    
    /**
     * Auto-detect FluentCart Product field from form
     * Uses FormFieldsParser to find fields by element type
     *
     * @param array $formData
     * @return string|null
     */
    private function autoDetectProductField($formData)
    {
        // Get form ID from entry
        $formId = ArrayHelper::get($formData, '__fluent_form_id');

        if (!$formId) {
            error_log('FluentCart Integration: Cannot auto-detect product field - form ID not found in form data');
            return null;
        }

        // Get form object
        $form = wpFluent()->table('fluentform_forms')->find($formId);

        if (!$form) {
            error_log('FluentCart Integration: Cannot auto-detect product field - form not found');
            return null;
        }

        // Use FormFieldsParser to find FluentCart Product fields by element type
        $productFields = \FluentForm\App\Modules\Form\FormFieldsParser::getInputsByElementTypes(
            $form,
            ['fluentcart_product'],
            ['element', 'attributes']
        );

        if (empty($productFields)) {
            error_log('FluentCart Integration: No FluentCart Product fields found in form');
            return null;
        }

        // Get the first product field name
        $fieldNames = array_keys($productFields);
        $fieldName = $fieldNames[0];

        error_log('FluentCart Integration: Auto-detected product field: ' . $fieldName);

        return $fieldName;
    }

    /**
     * Get or create customer from form data
     *
     * @param array $formData
     * @param array $feed
     * @return object|null
     */
    private function getOrCreateCustomer($formData, $feed)
    {
        // Get email - try mapped field first, then fallback to logged-in user
        $email = $this->getFieldValue($formData, ArrayHelper::get($feed, 'customer_email_field'));

        if (!$email || !is_email($email)) {
            // Fallback to logged-in user email
            $currentUser = wp_get_current_user();
            if ($currentUser && $currentUser->ID) {
                $email = $currentUser->user_email;
            }
        }

        if (!$email || !is_email($email)) {
            return null;
        }

        // Try to find existing customer
        $customer = \FluentCart\App\Models\Customer::where('email', $email)->first();

        if ($customer) {
            // Update customer data if fields are empty
            $this->updateCustomerFromForm($customer, $formData, $feed);
            return $customer;
        }

        // Get customer name - parse into first and last name
        list($firstName, $lastName) = $this->getCustomerName($formData, $feed);

        // Create new customer
        $customerData = [
            'email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'phone' => $this->getFieldValue($formData, ArrayHelper::get($feed, 'customer_phone_field')),
            'source' => 'fluentform',
            'status' => 'active',
        ];

        // Remove empty values
        $customerData = array_filter($customerData, function($value) {
            return !empty($value);
        });

        return \FluentCart\App\Models\Customer::create($customerData);
    }

    /**
     * Get customer name from form data and parse into first and last name
     * Supports:
     * - Single name field with full name (e.g., "John Doe")
     * - FluentForm's Name field with {inputs.name.value_text}
     * - FluentForm's Name field array structure
     * - Logged-in user fallback
     *
     * @param array $formData
     * @param array $feed
     * @return array [firstName, lastName]
     */
    private function getCustomerName($formData, $feed)
    {
        // Try mapped name field
        $name = $this->getFieldValue($formData, ArrayHelper::get($feed, 'customer_name_field'));

        if (!empty($name)) {
            // If it's an array (FluentForm Name field), extract first_name and last_name
            if (is_array($name)) {
                $firstName = ArrayHelper::get($name, 'first_name', '');
                $lastName = ArrayHelper::get($name, 'last_name', '');
                return [$firstName, $lastName];
            }

            // If it's a string, parse it into first and last name
            return $this->parseFullName($name);
        }

        // Try to find FluentForm Name field in form data (auto-detection)
        foreach ($formData as $key => $value) {
            if (is_array($value) && (isset($value['first_name']) || isset($value['last_name']))) {
                $firstName = ArrayHelper::get($value, 'first_name', '');
                $lastName = ArrayHelper::get($value, 'last_name', '');
                return [$firstName, $lastName];
            }
        }

        // Fallback to logged-in user
        $currentUser = wp_get_current_user();
        if ($currentUser && $currentUser->ID) {
            $firstName = $currentUser->first_name ?: $currentUser->display_name;
            $lastName = $currentUser->last_name;
            return [$firstName, $lastName];
        }

        return ['', ''];
    }

    /**
     * Parse full name string into first and last name
     *
     * @param string $fullName
     * @return array [firstName, lastName]
     */
    private function parseFullName($fullName)
    {
        $fullName = trim($fullName);

        if (empty($fullName)) {
            return ['', ''];
        }

        // Split by space
        $parts = explode(' ', $fullName);

        if (count($parts) === 1) {
            // Only one name provided, use it as first name
            return [$parts[0], ''];
        }

        // First part is first name, rest is last name
        $firstName = array_shift($parts);
        $lastName = implode(' ', $parts);

        return [$firstName, $lastName];
    }
    
    /**
     * Update existing customer from form data
     *
     * @param object $customer
     * @param array $formData
     * @param array $feed
     */
    private function updateCustomerFromForm($customer, $formData, $feed)
    {
        $updated = false;

        // Update name if empty
        if (empty($customer->first_name) || empty($customer->last_name)) {
            list($firstName, $lastName) = $this->getCustomerName($formData, $feed);

            if (empty($customer->first_name) && $firstName) {
                $customer->first_name = $firstName;
                $updated = true;
            }

            if (empty($customer->last_name) && $lastName) {
                $customer->last_name = $lastName;
                $updated = true;
            }
        }

        // Update phone if empty
        if (empty($customer->phone)) {
            $phone = $this->getFieldValue($formData, ArrayHelper::get($feed, 'customer_phone_field'));
            if ($phone) {
                $customer->phone = $phone;
                $updated = true;
            }
        }

        if ($updated) {
            $customer->save();
        }
    }
    
    /**
     * Map form fields to order items
     *
     * @param array $formData
     * @param array $feed
     * @return array
     */
    private function mapOrderItems($formData, $feed)
    {
        $orderItems = [];
        $productId = null;
        $variationId = null;

        // Get product source
        $productSource = ArrayHelper::get($feed, 'product_source', 'form_field');

        if ($productSource === 'form_field') {
            // Product selected in form field
            $productField = ArrayHelper::get($feed, 'product_field');
            if (!$productField) {
                throw new \Exception(__('Product field is not configured', 'fluentform'));
            }

            $fieldValue = $this->getFieldValue($formData, $productField);

            if (!$fieldValue) {
                throw new \Exception(__('No product selected in form', 'fluentform'));
            }

            // Handle product_id|variation_id format
            if (strpos($fieldValue, '|') !== false) {
                list($productId, $variationId) = explode('|', $fieldValue, 2);
            } else {
                $productId = $fieldValue;
            }
        } elseif ($productSource === 'fixed_product') {
            // Fixed product
            $productId = ArrayHelper::get($feed, 'fixed_product_id');
            if (!$productId) {
                throw new \Exception(__('Fixed product is not configured', 'fluentform'));
            }
        }

        if (!$productId) {
            throw new \Exception(__('No product ID found', 'fluentform'));
        }

        // Get product with relationships
        $product = \FluentCart\App\Models\Product::with(['detail', 'variants'])->find($productId);
        if (!$product) {
            throw new \Exception(sprintf(__('Product #%d not found', 'fluentform'), $productId));
        }

        // Get quantity
        $quantity = 1;
        $quantitySource = ArrayHelper::get($feed, 'quantity_source', 'fixed');

        if ($quantitySource === 'form_field') {
            $quantityField = ArrayHelper::get($feed, 'quantity_field');
            if ($quantityField) {
                $quantity = (int) $this->getFieldValue($formData, $quantityField);
            }
        } else {
            $quantityValue = ArrayHelper::get($feed, 'quantity_value', '1');
            $quantity = (int) $quantityValue;
        }

        if ($quantity < 1) {
            $quantity = 1;
        }

        // Get price (use variation price if available, otherwise use product min_price)
        $price = 0;

        if ($variationId) {
            $variation = \FluentCart\App\Models\ProductVariation::find($variationId);
            if ($variation && $variation->item_price) {
                $price = $variation->item_price;
            }
        }

        // If no variation price, try to get from product detail
        if (!$price && $product->detail && $product->detail->min_price) {
            $price = $product->detail->min_price;
        }

        // If still no price, try first variant
        if (!$price && $product->variants) {
            // Handle both collection and array
            $variants = is_array($product->variants) ? $product->variants : $product->variants->all();

            if (!empty($variants)) {
                $firstVariant = is_array($variants) ? reset($variants) : $variants[0];
                if ($firstVariant && isset($firstVariant->item_price) && $firstVariant->item_price) {
                    $price = $firstVariant->item_price;
                    // Use this variant ID if no variation was specified
                    if (!$variationId) {
                        $variationId = $firstVariant->id;
                    }
                }
            }
        }

        // Build order item
        $orderItems[] = [
            'post_id' => $productId,
            'variation_id' => $variationId,
            'quantity' => $quantity,
            'item_price' => $price,
            'line_total' => $price * $quantity,
            'item_type' => 'product',
            'title' => $product->post_title,
        ];

        return $orderItems;
    }
    
    /**
     * Map address from FluentForm Address field
     *
     * @param array $formData
     * @param string $addressFieldName The name of the FluentForm Address field
     * @return array|null
     */
    private function mapAddress($formData, $addressFieldName)
    {
        // If no address field specified, return null
        if (empty($addressFieldName)) {
            return null;
        }

        // Get the address data from form
        // FluentForm Address field stores data as an array with keys:
        // address_line_1, address_line_2, city, state, zip, country
        $addressData = ArrayHelper::get($formData, $addressFieldName);

        // If address data is not an array, return null
        if (!is_array($addressData)) {
            return null;
        }

        // Map FluentForm address field structure to FluentCart address structure
        $address = [
            'address_1' => ArrayHelper::get($addressData, 'address_line_1', ''),
            'address_2' => ArrayHelper::get($addressData, 'address_line_2', ''),
            'city' => ArrayHelper::get($addressData, 'city', ''),
            'state' => ArrayHelper::get($addressData, 'state', ''),
            'zip' => ArrayHelper::get($addressData, 'zip', ''),
            'country' => ArrayHelper::get($addressData, 'country', ''),
        ];

        // Remove empty values
        $address = array_filter($address, function($value) {
            return !empty($value);
        });

        // Return null if no address data
        if (empty($address)) {
            return null;
        }

        return $address;
    }
    
    /**
     * Add custom fields as order meta
     *
     * @param object $order
     * @param array $formData
     * @param array $feed
     */
    private function addCustomFields($order, $formData, $feed)
    {
        $customFields = ArrayHelper::get($feed, 'custom_fields', []);
        
        foreach ($customFields as $customField) {
            $fieldName = ArrayHelper::get($customField, 'field_name');
            $metaKey = ArrayHelper::get($customField, 'meta_key');
            
            if (!$fieldName || !$metaKey) {
                continue;
            }
            
            $value = $this->getFieldValue($formData, $fieldName);
            if ($value !== null && $value !== '') {
                $order->updateMeta($metaKey, $value);
            }
        }
    }
    
    /**
     * Sync payment from FluentForm to FluentCart
     *
     * @param int $submissionId
     * @param object $order
     * @param array $formData
     */
    private function syncPayment($submissionId, $order, $formData)
    {
        // Check if form has payment
        if (empty($formData['payment_method'])) {
            return;
        }

        // Get FluentForm transaction
        $transaction = wpFluent()->table('fluentform_transactions')
            ->where('submission_id', $submissionId)
            ->first();

        if (!$transaction) {
            return;
        }

        // Map FluentForm transaction status to FluentCart transaction status
        // FluentForm uses: paid, pending, failed, refunded
        // FluentCart uses: succeeded, pending, canceled, failed, refunded
        $transactionStatus = $this->mapTransactionStatus($transaction->status);

        // Create FluentCart transaction
        // FluentCart transaction fields: order_id, order_type, transaction_type, vendor_charge_id,
        // payment_method, payment_mode, payment_method_type, status, currency, total, uuid
        $transactionData = [
            'order_type' => 'payment',
            'transaction_type' => 'charge',
            'vendor_charge_id' => $transaction->charge_id ?? '',
            'payment_method' => $this->mapPaymentMethod($transaction->payment_method ?? ''),
            'payment_mode' => $transaction->payment_mode ?? 'live',
            'payment_method_type' => $this->mapPaymentMethodType($transaction),
            'status' => $transactionStatus,
            'currency' => $transaction->currency ?? get_option('fluent_cart_currency', 'USD'),
            'total' => $transaction->payment_total ?? 0,
            'uuid' => $transaction->transaction_hash ?? wp_generate_uuid4(),
            'card_last_4' => $transaction->card_last_4 ?? null,
            'card_brand' => $transaction->card_brand ?? null,
        ];

        // Remove null values
        $transactionData = array_filter($transactionData, function($value) {
            return $value !== null;
        });

        $order->transactions()->create($transactionData);

        // Update order status based on payment
        if ($transaction->status === 'paid') {
            $order->status = 'processing';
            $order->payment_status = 'paid';
            $order->save();

            $order->addLog(
                __('Payment received from FluentForm', 'fluentform'),
                sprintf(__('Payment of %s received via %s', 'fluentform'),
                    \FluentCart\App\Helpers\Helper::toDecimal($transaction->payment_total),
                    $transaction->payment_method ?? 'Unknown'
                ),
                'info'
            );
        }
    }
    
    /**
     * Map FluentForm payment method to FluentCart
     *
     * @param string $method
     * @return string
     */
    private function mapPaymentMethod($method)
    {
        $mapping = [
            'stripe' => 'stripe',
            'paypal' => 'paypal',
            'razorpay' => 'razorpay',
            'mollie' => 'mollie',
            'test' => 'offline_payment',
            'offline' => 'offline_payment',
        ];

        return ArrayHelper::get($mapping, strtolower($method), $method);
    }

    /**
     * Map FluentForm transaction status to FluentCart transaction status
     * FluentForm: paid, pending, failed, refunded
     * FluentCart: succeeded, pending, canceled, failed, refunded
     *
     * @param string $status
     * @return string
     */
    private function mapTransactionStatus($status)
    {
        $mapping = [
            'paid' => 'succeeded',
            'pending' => 'pending',
            'failed' => 'failed',
            'refunded' => 'refunded',
            'cancelled' => 'canceled',
            'canceled' => 'canceled',
        ];

        return ArrayHelper::get($mapping, strtolower($status), 'pending');
    }

    /**
     * Map payment method type from FluentForm transaction
     *
     * @param object $transaction
     * @return string
     */
    private function mapPaymentMethodType($transaction)
    {
        // Check if card brand exists (indicates card payment)
        if (!empty($transaction->card_brand)) {
            return 'card';
        }

        // Map based on payment method
        $method = strtolower($transaction->payment_method ?? '');

        $mapping = [
            'stripe' => 'card',
            'paypal' => 'paypal',
            'razorpay' => 'card',
            'mollie' => 'card',
            'test' => 'offline',
            'offline' => 'offline',
        ];

        return ArrayHelper::get($mapping, $method, 'online');
    }
    
    /**
     * Get field value from form data
     * Handles both raw field names and already-parsed shortcode values from processedValues
     *
     * @param array $formData
     * @param string $fieldName Can be a field name (e.g., "email") or already-parsed value (e.g., "John Doe")
     * @return mixed
     */
    private function getFieldValue($formData, $fieldName)
    {
        if (empty($fieldName)) {
            return null;
        }

        // First, try to get value from formData using fieldName as a key
        // This handles cases where fieldName is an actual field name like "email", "name", etc.
        $value = ArrayHelper::get($formData, $fieldName);

        // If we found a value in formData, return it
        if ($value !== null) {
            return $value;
        }

        // If no value found in formData, the fieldName might already be the parsed value
        // This happens when using value_text component with shortcodes like {inputs.name.value_text}
        // FluentForm's core parses these shortcodes before passing to processedValues
        // So "customer_name_field" might contain "John Doe" instead of "name"
        // In this case, we return the fieldName itself as the value
        return $fieldName;
    }
    
    /**
     * Validate FluentCart fields before submission
     *
     * @param array $errors
     * @param array $formData
     * @param object $form
     * @return array
     */
    public function validateFluentCartFields($errors, $formData, $form)
    {
        // Early exit if not configured or if form is invalid
        if (!$this->isConfigured()) {
            return $errors;
        }

        // Validate form object - must be an object with an id property
        if (!is_object($form) || !isset($form->id) || !$form->id) {
            return $errors;
        }

        // Get feeds for this form
        $feeds = $this->getFormFeeds($form->id);

        if (!$feeds) {
            return $errors;
        }

        foreach ($feeds as $feed) {
            $parsedValue = $feed['formattedValue'];

            // Check if feed is enabled
            if (ArrayHelper::get($parsedValue, 'enabled') !== 'yes') {
                continue;
            }

            // Check conditional logic - skip validation if conditions not met
            if (!$this->checkCondition($parsedValue, $formData, $form)) {
                continue;
            }

            // Validate email
            $emailField = ArrayHelper::get($parsedValue, 'customer_email_field');
            if ($emailField) {
                $email = ArrayHelper::get($formData, $emailField);
                if (empty($email)) {
                    $errors[$emailField] = [__('Customer email is required for order creation', 'fluentform')];
                } elseif (!is_email($email)) {
                    $errors[$emailField] = [__('Please enter a valid email address', 'fluentform')];
                }
            }

            // Validate product selection based on product source
            $productSource = ArrayHelper::get($parsedValue, 'product_source', 'form_field');

            if ($productSource === 'form_field') {
                // Validate dynamic product field
                $productField = ArrayHelper::get($parsedValue, 'product_field');
                if ($productField) {
                    $productId = ArrayHelper::get($formData, $productField);
                    if (empty($productId)) {
                        $errors[$productField] = [__('Please select a product', 'fluentform')];
                    } else {
                        // Validate that product exists in FluentCart
                        $product = \FluentCart\App\Models\Product::find($productId);
                        if (!$product) {
                            $errors[$productField] = [__('Selected product is not available', 'fluentform')];
                        }
                    }
                } else {
                    // Product field not configured
                    $errors['_fluentcart_config'] = [__('FluentCart integration error: Product field not configured', 'fluentform')];
                }
            } elseif ($productSource === 'fixed_product') {
                // Validate fixed product exists
                $fixedProductId = ArrayHelper::get($parsedValue, 'fixed_product_id');
                if (empty($fixedProductId)) {
                    $errors['_fluentcart_config'] = [__('FluentCart integration error: Fixed product not configured', 'fluentform')];
                } else {
                    $product = \FluentCart\App\Models\Product::find($fixedProductId);
                    if (!$product) {
                        $errors['_fluentcart_config'] = [__('FluentCart integration error: Configured product is not available', 'fluentform')];
                    }
                }
            }

            // Validate quantity if from form field
            $quantitySource = ArrayHelper::get($parsedValue, 'quantity_source', 'fixed');
            if ($quantitySource === 'form_field') {
                $quantityField = ArrayHelper::get($parsedValue, 'quantity_field');
                if ($quantityField) {
                    $quantity = ArrayHelper::get($formData, $quantityField);
                    if (empty($quantity) || !is_numeric($quantity) || $quantity < 1) {
                        $errors[$quantityField] = [__('Please enter a valid quantity (minimum 1)', 'fluentform')];
                    }
                }
            }
        }

        return $errors;
    }
}

