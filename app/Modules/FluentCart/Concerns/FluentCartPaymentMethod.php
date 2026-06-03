<?php

namespace FluentForm\App\Modules\FluentCart\Concerns;

use FluentCart\Api\CurrencySettings as FluentCartCurrencySettings;
use FluentCart\Api\StoreSettings as FluentCartStoreSettings;
use FluentCart\App\Helpers\CartHelper as FluentCartCartHelper;
use FluentCart\App\Models\Cart as FluentCartCart;
use FluentCart\App\Models\Customer as FluentCartCustomer;
use FluentCart\App\Models\ProductVariation as FluentCartProductVariation;
use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\OrderItem;
use FluentForm\App\Models\Submission;
use FluentForm\App\Models\Subscription;
use FluentForm\App\Models\Transaction;
use FluentForm\App\Modules\Form\FormFieldsParser;
use FluentForm\App\Modules\Payments\PaymentHelper;
use FluentForm\App\Modules\Payments\PaymentMethods\BaseProcessor;
use FluentForm\Framework\Support\Arr;

trait FluentCartPaymentMethod
{

    public function registerFluentCartPaymentMethodSettings($methods)
    {
        if (!$this->isFluentCartActive()) {
            return $methods;
        }

        $methods['fluent_cart'] = [
            'label'  => __('Fluent Cart', 'fluentform'),
            'fields' => [
                [
                    'settings_key'   => 'is_active',
                    'type'           => 'yes-no-checkbox',
                    'label'          => __('Status', 'fluentform'),
                    'checkbox_label' => __('Enable Fluent Cart as a payment method', 'fluentform'),
                ],
                [
                    'settings_key' => 'option_label',
                    'type'         => 'input-text',
                    'data_type'    => 'text',
                    'label'        => __('Default Method Label', 'fluentform'),
                    'placeholder'  => __('Pay with Fluent Cart', 'fluentform'),
                    'inline_help'  => __('Customers are redirected to Fluent Cart checkout after the form submit. Map each payment item to a Fluent Cart product from the form editor.', 'fluentform'),
                ],
            ],
        ];

        return $methods;
    }

    public function getFluentCartPaymentMethodSettings()
    {
        return wp_parse_args(
            get_option('fluentform_payment_settings_fluent_cart', []),
            $this->getFluentCartPaymentMethodDefaults()
        );
    }

    public function validateFluentCartPaymentMethodSettings($errors, $settings)
    {
        if (Arr::get($settings, 'is_active') !== 'yes') {
            return [];
        }

        if (!$this->isFluentCartActive()) {
            $errors['is_active'] = __('Fluent Cart is not active on this site.', 'fluentform');
        }

        if (!$this->getFluentCartCheckoutPageUrl()) {
            $errors['is_active'] = __('Fluent Cart checkout page is not configured yet.', 'fluentform');
        }

        return $errors;
    }

    public function sanitizeFluentCartPaymentMethodSettings($settings)
    {
        $defaults = $this->getFluentCartPaymentMethodDefaults();

        return [
            'is_active'    => Arr::get($settings, 'is_active') === 'yes' ? 'yes' : 'no',
            'option_label' => sanitize_text_field((string)Arr::get($settings, 'option_label', $defaults['option_label'])),
        ];
    }

    public function registerFluentCartPaymentMethod($methods)
    {
        if (!$this->isFluentCartPaymentEnabled()) {
            return $methods;
        }

        $settings = $this->getFluentCartPaymentMethodSettings();

        $methods['fluent_cart'] = [
            'title'        => __('Fluent Cart', 'fluentform'),
            'enabled'      => 'yes',
            'method_value' => 'fluent_cart',
            'settings'     => [
                'option_label' => [
                    'type'     => 'text',
                    'template' => 'inputText',
                    'value'    => Arr::get($settings, 'option_label', __('Pay with Fluent Cart', 'fluentform')),
                    'label'    => __('Method Label', 'fluentform'),
                ],
            ],
        ];

        return $methods;
    }

    public function addFluentCartEditorVars($vars)
    {
        if (!$this->isFluentCartActive()) {
            return $vars;
        }

        $vars['fluent_cart_product_options'] = $this->getFluentCartProductOptions();

        return $vars;
    }

    public function normalizeFluentCartPaymentFieldSettings($element)
    {
        if (!isset($element['settings']['fluent_cart_product_id'])) {
            $element['settings']['fluent_cart_product_id'] = '';
        }

        if (!isset($element['settings']['use_fluent_cart_product'])) {
            $element['settings']['use_fluent_cart_product'] = !empty($element['settings']['fluent_cart_product_id']);
        }

        $pricingOptions = Arr::get($element, 'settings.pricing_options', []);

        foreach ($pricingOptions as $index => $pricingOption) {
            if (!isset($pricingOption['fluent_cart_product_id'])) {
                $pricingOptions[$index]['fluent_cart_product_id'] = '';
            }

            if (!isset($pricingOption['use_fluent_cart_product'])) {
                $pricingOptions[$index]['use_fluent_cart_product'] = !empty($pricingOption['fluent_cart_product_id']);
            }
        }

        $element['settings']['pricing_options'] = $pricingOptions;

        return $element;
    }

    public function normalizeFluentCartSubscriptionFieldSettings($element)
    {
        $subscriptionOptions = Arr::get($element, 'settings.subscription_options', []);

        foreach ($subscriptionOptions as $index => $subscriptionOption) {
            if (!isset($subscriptionOption['fluent_cart_product_id'])) {
                $subscriptionOptions[$index]['fluent_cart_product_id'] = '';
            }

            if (!isset($subscriptionOption['use_fluent_cart_product'])) {
                $subscriptionOptions[$index]['use_fluent_cart_product'] = !empty($subscriptionOption['fluent_cart_product_id']);
            }
        }

        $element['settings']['subscription_options'] = $subscriptionOptions;

        return $element;
    }

    public function syncMappedPricingOptionsWithFluentCart($pricingOptions, $item, $form)
    {
        if (!$this->formHasEnabledFluentCartPaymentMethod($form)) {
            return $pricingOptions;
        }

        foreach ($pricingOptions as $index => $pricingOption) {
            $variationId = absint(Arr::get($pricingOption, 'fluent_cart_product_id'));

            if (!$this->isUsingFluentCartProduct($pricingOption) || !$variationId) {
                continue;
            }

            $variation = $this->getFluentCartVariation($variationId);

            if (!$variation) {
                continue;
            }

            $pricingOptions[$index]['value'] = $this->convertFluentCartVariationPriceToFormAmount($variation);
        }

        return $pricingOptions;
    }

    public function syncSinglePaymentFieldWithFluentCart($data, $form)
    {
        if (
            !$this->formHasEnabledFluentCartPaymentMethod($form) ||
            Arr::get($data, 'attributes.type') !== 'single'
        ) {
            return $data;
        }

        $variationId = absint(Arr::get($data, 'settings.fluent_cart_product_id'));

        if (!$this->isUsingFluentCartProduct(Arr::get($data, 'settings', [])) || !$variationId) {
            return $data;
        }

        $variation = $this->getFluentCartVariation($variationId);

        if (!$variation) {
            return $data;
        }

        $data['attributes']['value'] = $this->convertFluentCartVariationPriceToFormAmount($variation);

        return $data;
    }

    public function syncSubscriptionFieldWithFluentCart($data, $form)
    {
        if (!$this->formHasEnabledFluentCartPaymentMethod($form)) {
            return $data;
        }

        $subscriptionOptions = Arr::get($data, 'settings.subscription_options', []);

        foreach ($subscriptionOptions as $index => $subscriptionOption) {
            $variationId = absint(Arr::get($subscriptionOption, 'fluent_cart_product_id'));

            if (!$this->isUsingFluentCartProduct($subscriptionOption) || !$variationId) {
                continue;
            }

            $variation = $this->getFluentCartVariation($variationId);

            if (!$variation || $variation->payment_type !== 'subscription') {
                continue;
            }

            $subscriptionOptions[$index] = $this->syncSubscriptionPlanWithFluentCartVariation($subscriptionOption, $variation);
        }

        $data['settings']['subscription_options'] = $subscriptionOptions;

        return $data;
    }

    public function syncPaymentFormBeforePaymentAction($insertData, $formData, $form)
    {
        if (!$this->formHasEnabledFluentCartPaymentMethod($form)) {
            return;
        }

        $formFields = json_decode($form->form_fields, true);

        if (!is_array($formFields) || empty($formFields['fields'])) {
            return;
        }

        $formFields['fields'] = $this->syncFluentCartFieldDefinitions($formFields['fields'], $form);
        $form->form_fields = wp_json_encode($formFields);

        FormFieldsParser::resetData();
    }

    public function validateFluentCartPaymentSelection($error, $field, $formData, $fields, $form)
    {
        if ($error) {
            return $error;
        }

        $selectedMethod = sanitize_text_field((string)Arr::get($formData, Arr::get($field, 'name')));

        if ($selectedMethod !== 'fluent_cart') {
            return $error;
        }

        if (!$this->isFluentCartPaymentEnabled()) {
            return __('Fluent Cart payment method is not available.', 'fluentform');
        }

        $context = $this->buildFluentCartPaymentContext($form, $formData, false);

        if (is_wp_error($context)) {
            return $context->get_error_message();
        }

        return $error;
    }

    public function validateFluentCartPaymentSubmission($errors, $formData, $form, $fields)
    {
        if (sanitize_text_field((string)Arr::get($formData, 'payment_method')) !== 'fluent_cart') {
            return $errors;
        }

        $targetFieldName = $this->resolveFluentCartPaymentValidationField($form, $formData);

        if (!$this->isFluentCartPaymentEnabled()) {
            $errors[$targetFieldName]['fluent_cart'] = __('Fluent Cart payment method is not available.', 'fluentform');

            return $errors;
        }

        $context = $this->buildFluentCartPaymentContext($form, $formData, true);

        if (is_wp_error($context)) {
            $errors[$targetFieldName][$context->get_error_code()] = $context->get_error_message();
        }

        return $errors;
    }

    public function processFluentCartPayment($submissionId, $submissionData, $form, $methodSettings, $hasSubscriptions, $totalPayable)
    {
        if (!$this->isFluentCartPaymentEnabled()) {
            wp_send_json_error([
                'message' => __('Fluent Cart payment method is not available.', 'fluentform'),
            ], 423);
        }

        $submission = Submission::find($submissionId);

        if (!$submission) {
            wp_send_json_error([
                'message' => __('Fluent Forms submission could not be resolved.', 'fluentform'),
            ], 404);
        }

        $submission->response = json_decode($submission->response, true);

        if (!is_array($submission->response)) {
            $submission->response = [];
        }

        $context = $this->buildFluentCartPaymentContext($form, $submission->response, true);

        if (is_wp_error($context)) {
            wp_send_json_error([
                'message' => $context->get_error_message(),
            ], 423);
        }

        $this->syncFluentCartSubmissionRecords($submission, $form, $context);

        $transaction = $this->createFluentCartPendingTransaction($submission, $form, $context);
        $cart = $this->createFluentCartPaymentCart($submission, $form, $context, $transaction);
        $checkoutUrl = $this->getFluentCartCheckoutUrl($cart->cart_hash);

        if (!$checkoutUrl) {
            wp_send_json_error([
                'message' => __('Fluent Cart checkout page is not configured yet.', 'fluentform'),
            ], 423);
        }

        Helper::setSubmissionMeta($submissionId, '_ff_fluentcart_payment_cart_hash', $cart->cart_hash, $form->id);
        Helper::setSubmissionMeta($submissionId, '_ff_fluentcart_payment_transaction_id', $transaction->id, $form->id);
        Helper::setSubmissionMeta($submissionId, '_ff_fluentcart_payment_transaction_hash', $transaction->transaction_hash, $form->id);

        wp_send_json_success([
            'nextAction' => 'payment',
            'actionName' => 'normalRedirect',
            'redirect_url' => $checkoutUrl,
            'message' => __('Redirecting to Fluent Cart checkout...', 'fluentform'),
            'result' => [
                'insert_id' => $submissionId,
            ],
        ], 200);
    }
    public function linkFluentCartPaymentOrder($data)
    {
        $order = Arr::get($data, 'order');
        $cart = Arr::get($data, 'cart');

        if (!$order || !$cart || !is_object($order) || !is_object($cart)) {
            return;
        }

        $paymentContext = Arr::get($cart->checkout_data, 'fluentform_payment', []);
        $source = sanitize_text_field((string)Arr::get($paymentContext, 'source'));

        if ($source !== 'fluent_cart') {
            return;
        }

        $submissionId = absint(Arr::get($paymentContext, 'submission_id'));
        $formId = absint(Arr::get($paymentContext, 'form_id'));
        $transactionId = absint(Arr::get($paymentContext, 'transaction_id'));

        if (!$submissionId || !$formId) {
            return;
        }

        $submission = Submission::find($submissionId);

        if (!$submission || (int)$submission->form_id !== $formId) {
            return;
        }

        $formData = json_decode($submission->response, true);

        if (!is_array($formData)) {
            $formData = [];
        }

        $order->updateMeta('fluent_form_data', $formData);
        $order->updateMeta('fluent_form_id', $formId);
        $order->updateMeta('fluent_form_submission_id', $submissionId);
        $order->updateMeta('fluent_form_transaction_id', $transactionId);
        $order->updateMeta('fluent_form_payment_method', 'fluent_cart');

        Helper::setSubmissionMeta($submissionId, '_ff_fluentcart_payment_order_id', (int)$order->id, $formId);
        Helper::setSubmissionMeta($submissionId, '_ff_fluentcart_payment_cart_hash', $cart->cart_hash, $formId);

        $this->syncFluentCartPendingTransactionWithOrder($order, $submissionId, $transactionId);
    }

    public function syncFluentCartPaymentSubmission($data)
    {
        $order = Arr::get((array)$data, 'order');

        if (
            !$order ||
            !is_object($order) ||
            !method_exists($order, 'getMeta') ||
            $order->getMeta('fluent_form_payment_method') !== 'fluent_cart'
        ) {
            return;
        }

        $submissionId = absint($order->getMeta('fluent_form_submission_id'));
        $formId = absint($order->getMeta('fluent_form_id'));
        $transactionId = absint($order->getMeta('fluent_form_transaction_id'));

        if (!$submissionId || !$formId) {
            return;
        }

        $processor = $this->makeFluentCartBaseProcessor();
        $processor->setSubmissionId($submissionId);

        $submission = $processor->getSubmission();

        if (!$submission || (int)$submission->form_id !== $formId) {
            return;
        }

        $orderTransaction = $order->transactions()->orderBy('id', 'DESC')->first();
        $transaction = $transactionId ? Transaction::find($transactionId) : Transaction::bySubmission($submissionId)->orderBy('id', 'DESC')->first();

        $submissionUpdateData = [
            'payment_total' => (int)$order->total_amount,
            'currency'      => strtoupper((string)$order->currency),
            'updated_at'    => current_time('mysql'),
        ];

        if ((string)$submission->payment_status !== 'paid') {
            Submission::where('id', $submissionId)->update($submissionUpdateData);
            $processor->changeSubmissionPaymentStatus('paid');
        } else {
            Submission::where('id', $submissionId)->update($submissionUpdateData);
        }

        if ($transaction) {
            $transactionUpdateData = [
                'payment_total' => (int)$order->total_amount,
                'currency'      => strtoupper((string)$order->currency),
                'updated_at'    => current_time('mysql'),
            ];

            if ($orderTransaction && !empty($orderTransaction->uuid)) {
                $transactionUpdateData['charge_id'] = $orderTransaction->uuid;
            }

            Transaction::where('id', $transaction->id)->update($transactionUpdateData);

            if ((string)$transaction->status !== 'paid') {
                $processor->changeTransactionStatus($transaction->id, 'paid');
            }
        }

        $fluentCartSubscription = method_exists($order, 'subscriptions') ? $order->subscriptions()->orderBy('id', 'DESC')->first() : null;

        if ($fluentCartSubscription) {
            $this->ensureFluentFormsSubscriptionForFluentCart([
                'form_id'       => $formId,
                'submission_id' => $submissionId,
            ], $fluentCartSubscription);

            $subscriptionUpdateData = [
                'status'     => 'active',
                'updated_at' => current_time('mysql'),
            ];

            if (!empty($fluentCartSubscription->vendor_subscription_id)) {
                $subscriptionUpdateData['vendor_subscription_id'] = sanitize_text_field((string)$fluentCartSubscription->vendor_subscription_id);
            }

            Subscription::bySubmission($submissionId)->update($subscriptionUpdateData);
        }

        $processor->recalculatePaidTotal();

        if ($processor->getMetaData('is_form_action_fired') === 'yes') {
            return;
        }

        $processor->getReturnData();
    }

    protected function getFluentCartPaymentMethodDefaults()
    {
        return [
            'is_active'    => 'no',
            'option_label' => __('Pay with Fluent Cart', 'fluentform'),
        ];
    }

    protected function isFluentCartPaymentEnabled()
    {
        return $this->isFluentCartActive() && Arr::get($this->getFluentCartPaymentMethodSettings(), 'is_active') === 'yes';
    }

    protected function formHasEnabledFluentCartPaymentMethod($form)
    {
        if (!$form || empty($form->id)) {
            return false;
        }

        $methods = PaymentHelper::getFormPaymentMethods($form->id);

        return isset($methods['fluent_cart']) && Arr::get($methods, 'fluent_cart.enabled') === 'yes';
    }

    protected function getFluentCartCheckoutPageUrl()
    {
        if (!class_exists(FluentCartStoreSettings::class)) {
            return '';
        }

        return (string)(new FluentCartStoreSettings())->getCheckoutPage();
    }

    protected function getFluentCartCheckoutUrl($cartHash)
    {
        $checkoutPage = $this->getFluentCartCheckoutPageUrl();

        if (!$checkoutPage || !$cartHash) {
            return '';
        }

        return add_query_arg('fct_cart_hash', $cartHash, $checkoutPage);
    }

    protected function getFluentCartProductOptions()
    {
        if (!class_exists(FluentCartProductVariation::class)) {
            return [];
        }

        $variations = FluentCartProductVariation::query()
            ->with(['product'])
            ->where('item_status', 'active')
            ->orderBy('post_id', 'DESC')
            ->orderBy('serial_index', 'ASC')
            ->get();

        $options = [];

        foreach ($variations as $variation) {
            if (!$variation->product || !in_array($variation->product->post_status, ['publish', 'private'], true)) {
                continue;
            }

            $title = $variation->product->post_title;

            if ($variation->variation_title && $variation->variation_title !== $title) {
                $title .= ' -> ' . $variation->variation_title;
            }

            $label = sprintf(
                '%s (#%d) %s [%s]',
                $title,
                $variation->id,
                FluentCartCurrencySettings::getFormattedPrice((int)$variation->item_price),
                $variation->payment_type === 'subscription' ? __('Subscription', 'fluentform') : __('One-time', 'fluentform')
            );

            $options[] = [
                'value'        => (string)$variation->id,
                'label'        => $label,
                'payment_type' => (string)$variation->payment_type,
            ];
        }

        return $options;
    }

    protected function syncFluentCartFieldDefinitions($fields, $form)
    {
        foreach ($fields as $index => $field) {
            if (!is_array($field)) {
                continue;
            }

            if (($field['element'] ?? '') === 'container') {
                foreach (($field['columns'] ?? []) as $columnIndex => $column) {
                    $fields[$index]['columns'][$columnIndex]['fields'] = $this->syncFluentCartFieldDefinitions(
                        Arr::get($column, 'fields', []),
                        $form
                    );
                }

                continue;
            }

            if (($field['element'] ?? '') === 'subscription_payment_component') {
                $fields[$index] = $this->syncSubscriptionFieldWithFluentCart($field, $form);
                continue;
            }

            if (($field['element'] ?? '') !== 'multi_payment_component') {
                continue;
            }

            $field = $this->syncSinglePaymentFieldWithFluentCart($field, $form);
            $field['settings']['pricing_options'] = $this->syncMappedPricingOptionsWithFluentCart(
                Arr::get($field, 'settings.pricing_options', []),
                $field,
                $form
            );

            $fields[$index] = $field;
        }

        return $fields;
    }

    protected function getFluentCartVariation($variationId)
    {
        static $variationCache = [];

        if (isset($variationCache[$variationId])) {
            return $variationCache[$variationId];
        }

        if (!$variationId || !class_exists(FluentCartProductVariation::class)) {
            $variationCache[$variationId] = null;
            return null;
        }

        $variation = FluentCartProductVariation::query()
            ->with(['product', 'media'])
            ->find($variationId);

        if (!$variation || !$variation->product || !in_array($variation->product->post_status, ['publish', 'private'], true)) {
            $variationCache[$variationId] = null;
            return null;
        }

        $variationCache[$variationId] = $variation;

        return $variation;
    }

    protected function convertFluentCartVariationPriceToFormAmount($variation)
    {
        return ((int)$variation->item_price) / 100;
    }

    protected function convertCentsToFormAmount($amount)
    {
        return ((int)$amount) / 100;
    }

    protected function normalizeFluentCartBillingInterval($interval)
    {
        $interval = sanitize_text_field((string)$interval);

        return Arr::get([
            'daily'       => 'day',
            'weekly'      => 'week',
            'monthly'     => 'month',
            'quarterly'   => 'month',
            'half_yearly' => 'year',
            'yearly'      => 'year',
        ], $interval, $interval ?: 'month');
    }

    protected function syncSubscriptionPlanWithFluentCartVariation($plan, $variation)
    {
        $otherInfo = is_array($variation->other_info) ? $variation->other_info : [];
        $trialDays = (int)Arr::get($otherInfo, 'trial_days', 0);
        $signupFee = $this->convertCentsToFormAmount((int)Arr::get($otherInfo, 'signup_fee', 0));
        $hasSignupFee = Arr::get($otherInfo, 'manage_setup_fee', 'no') === 'yes' && $signupFee > 0;

        $plan['subscription_amount'] = $this->convertFluentCartVariationPriceToFormAmount($variation);
        $plan['billing_interval'] = $this->normalizeFluentCartBillingInterval(Arr::get($otherInfo, 'repeat_interval', 'yearly'));
        $plan['has_trial_days'] = $trialDays > 0 ? 'yes' : 'no';
        $plan['trial_days'] = $trialDays;
        $plan['has_signup_fee'] = $hasSignupFee ? 'yes' : 'no';
        $plan['signup_fee'] = $hasSignupFee ? $signupFee : 0;
        $plan['user_input'] = 'no';

        return $plan;
    }

    protected function isUsingFluentCartProduct($data)
    {
        return filter_var(Arr::get($data, 'use_fluent_cart_product'), FILTER_VALIDATE_BOOLEAN);
    }

    protected function buildFluentCartPaymentContext($form, $formData, $requireItems = true)
    {
        FormFieldsParser::resetData();

        $inputs = FormFieldsParser::getInputs($form, ['element', 'attributes', 'settings', 'admin_label']);
        $quantityFields = $this->getFluentCartQuantityFieldMap($inputs);
        $items = [];
        $hasSubscriptionItems = false;

        foreach ($inputs as $input) {
            $element = Arr::get($input, 'element');
            $fieldName = Arr::get($input, 'attributes.name');

            if (!$fieldName) {
                continue;
            }

            if ($element === 'custom_payment_component' && Arr::get($formData, $fieldName) !== null && Arr::get($formData, $fieldName) !== '') {
                return new \WP_Error(
                    'fluent_cart_custom_payment_not_supported',
                    __('Fluent Cart only supports mapped payment items. Custom payment amount fields are not supported.', 'fluentform')
                );
            }

            if ($element === 'subscription_payment_component' && Arr::get($formData, $fieldName) !== null && Arr::get($formData, $fieldName) !== '') {
                $selectedPlanIndex = (int)Arr::get($formData, $fieldName, 0);
                $selectedPlan = Arr::get($input, 'settings.subscription_options.' . $selectedPlanIndex, []);

                if (!$selectedPlan) {
                    $selectedPlan = Arr::get($input, 'settings.subscription_options.0', []);
                }

                if (!$this->isUsingFluentCartProduct($selectedPlan)) {
                    return new \WP_Error(
                        'fluent_cart_mapping_missing',
                        __('Every selected payment item must be mapped to a Fluent Cart product.', 'fluentform')
                    );
                }

                $mappedItem = $this->buildMappedFluentCartItem(
                    absint(Arr::get($selectedPlan, 'fluent_cart_product_id')),
                    sanitize_text_field((string)Arr::get($selectedPlan, 'name', __('Subscription Plan', 'fluentform'))),
                    $fieldName,
                    1,
                    'subscription'
                );

                if (is_wp_error($mappedItem)) {
                    return $mappedItem;
                }

                if ($mappedItem) {
                    $hasSubscriptionItems = true;
                    $items[] = $mappedItem;
                }

                continue;
            }

            if ($element === 'payment_coupon' && Arr::get($formData, $fieldName) !== null && Arr::get($formData, $fieldName) !== '') {
                return new \WP_Error(
                    'fluent_cart_payment_coupon_not_supported',
                    __('Fluent Cart checkout owns coupon handling. Remove the Fluent Forms coupon field for this payment flow.', 'fluentform')
                );
            }

            if ($element !== 'multi_payment_component') {
                continue;
            }

            $fieldType = Arr::get($input, 'attributes.type');
            $selectedValue = Arr::get($formData, $fieldName);

            if ($selectedValue === null || $selectedValue === '' || $selectedValue === []) {
                continue;
            }

            if ($fieldType === 'single') {
                if (!$this->isUsingFluentCartProduct(Arr::get($input, 'settings', []))) {
                    return new \WP_Error(
                        'fluent_cart_mapping_missing',
                        __('Every selected payment item must be mapped to a Fluent Cart product.', 'fluentform')
                    );
                }

                $mappedItem = $this->buildMappedFluentCartItem(
                    absint(Arr::get($input, 'settings.fluent_cart_product_id')),
                    Arr::get($input, 'admin_label') ?: Arr::get($input, 'settings.label') ?: __('Payment Item', 'fluentform'),
                    $fieldName,
                    $this->resolveFluentCartQuantity($fieldName, $quantityFields, $formData),
                    'onetime'
                );

                if (is_wp_error($mappedItem)) {
                    return $mappedItem;
                }

                if ($mappedItem) {
                    $hasSubscriptionItems = $hasSubscriptionItems || $mappedItem['payment_type'] === 'subscription';
                    $items[] = $mappedItem;
                }

                continue;
            }

            if (!in_array($fieldType, ['radio', 'select', 'checkbox'], true)) {
                return new \WP_Error(
                    'fluent_cart_payment_field_not_supported',
                    __('Fluent Cart only supports single, radio, select, and checkbox payment item fields.', 'fluentform')
                );
            }

            $selectedOptions = $this->normalizeFluentCartSelectedPaymentOptions($selectedValue, $fieldType);

            foreach ($selectedOptions as $selectedOption) {
                $pricingOption = $this->findFluentCartPricingOption($input, $selectedOption);

                if (!$pricingOption) {
                    return new \WP_Error(
                        'fluent_cart_selected_option_not_found',
                        __('A selected payment item is no longer valid for Fluent Cart.', 'fluentform')
                    );
                }

                if (!$this->isUsingFluentCartProduct($pricingOption)) {
                    return new \WP_Error(
                        'fluent_cart_mapping_missing',
                        __('Every selected payment item must be mapped to a Fluent Cart product.', 'fluentform')
                    );
                }

                $mappedItem = $this->buildMappedFluentCartItem(
                    absint(Arr::get($pricingOption, 'fluent_cart_product_id')),
                    sanitize_text_field((string)Arr::get($pricingOption, 'label', __('Payment Item', 'fluentform'))),
                    $fieldName,
                    $this->resolveFluentCartQuantity($fieldName, $quantityFields, $formData),
                    'onetime'
                );

                if (is_wp_error($mappedItem)) {
                    return $mappedItem;
                }

                if ($mappedItem) {
                    $hasSubscriptionItems = $hasSubscriptionItems || $mappedItem['payment_type'] === 'subscription';
                    $items[] = $mappedItem;
                }
            }
        }

        if (!$items) {
            if ($requireItems) {
                return new \WP_Error(
                    'fluent_cart_no_mapped_items',
                    __('No Fluent Cart product was selected from the form submission.', 'fluentform')
                );
            }

            return [
                'items'            => [],
                'total'            => 0,
                'payment_type'     => 'product',
                'ff_payment_type'  => 'product',
                'currency'         => strtoupper((string)FluentCartCurrencySettings::get('currency')),
                'has_subscription' => false,
            ];
        }

        if ($hasSubscriptionItems && count($items) > 1) {
            return new \WP_Error(
                'fluent_cart_subscription_mix_not_allowed',
                __("Subscription items can't be combined with other products in the cart.", 'fluentform')
            );
        }

        return [
            'items'            => $items,
            'total'            => array_sum(array_column($items, 'line_total')),
            'payment_type'     => $hasSubscriptionItems ? 'subscription' : 'onetime',
            'ff_payment_type'  => $hasSubscriptionItems ? 'subscription' : 'product',
            'currency'         => strtoupper((string)FluentCartCurrencySettings::get('currency')),
            'has_subscription' => $hasSubscriptionItems,
        ];
    }

    protected function getFluentCartQuantityFieldMap($inputs)
    {
        $quantityFields = [];

        foreach ($inputs as $input) {
            $element = Arr::get($input, 'element');

            if ($element === 'rangeslider' && Arr::get($input, 'settings.enable_target_product') !== 'yes') {
                continue;
            }

            if (!in_array($element, ['item_quantity_component', 'rangeslider'], true)) {
                continue;
            }

            $targetProduct = Arr::get($input, 'settings.target_product');
            $quantityInputName = Arr::get($input, 'attributes.name');

            if ($targetProduct && $quantityInputName) {
                $quantityFields[$targetProduct] = $quantityInputName;
            }
        }

        return $quantityFields;
    }

    protected function resolveFluentCartPaymentValidationField($form, $formData)
    {
        $inputs = FormFieldsParser::getInputs($form, ['element', 'attributes']);
        $firstPaymentField = '';

        foreach ($inputs as $input) {
            $element = Arr::get($input, 'element');
            $fieldName = Arr::get($input, 'attributes.name');

            if (!$fieldName || !in_array($element, [
                'multi_payment_component',
                'subscription_payment_component',
                'custom_payment_component',
                'payment_coupon',
            ], true)) {
                continue;
            }

            if (!$firstPaymentField) {
                $firstPaymentField = $fieldName;
            }

            $value = Arr::get($formData, $fieldName);

            if ($value !== null && $value !== '' && $value !== []) {
                return $fieldName;
            }
        }

        return $firstPaymentField ?: 'payment_method';
    }

    protected function normalizeFluentCartSelectedPaymentOptions($selectedValue, $fieldType)
    {
        $selectedOptions = $fieldType === 'checkbox' ? Arr::wrap($selectedValue) : [$selectedValue];
        $normalizedOptions = [];

        array_walk_recursive($selectedOptions, function ($option) use (&$normalizedOptions) {
            if ($option === null || $option === '') {
                return;
            }

            $normalizedOptions[] = $option;
        });

        return $normalizedOptions;
    }

    protected function resolveFluentCartQuantity($targetProduct, $quantityFields, $formData)
    {
        if (!isset($quantityFields[$targetProduct])) {
            return 1;
        }

        $quantity = absint(Arr::get($formData, $quantityFields[$targetProduct]));

        return $quantity > 0 ? $quantity : 0;
    }

    protected function findFluentCartPricingOption($input, $selectedOption)
    {
        $pricingOptions = Arr::get($input, 'settings.pricing_options', []);

        foreach ($pricingOptions as $pricingOption) {
            $label = sanitize_text_field((string)Arr::get($pricingOption, 'label'));
            $value = sanitize_text_field((string)Arr::get($pricingOption, 'value'));
            $selectedOption = sanitize_text_field((string)$selectedOption);

            if ($label === $selectedOption || $value === $selectedOption) {
                return $pricingOption;
            }
        }

        return null;
    }

    protected function buildMappedFluentCartItem($variationId, $label, $fieldName, $quantity, $expectedPaymentType = '')
    {
        if (!$variationId) {
            return new \WP_Error(
                'fluent_cart_mapping_missing',
                __('Every selected payment item must be mapped to a Fluent Cart product.', 'fluentform')
            );
        }

        if (!$quantity) {
            return null;
        }

        $variation = $this->getFluentCartVariation($variationId);

        if (!$variation) {
            return new \WP_Error(
                'fluent_cart_product_missing',
                __('A mapped Fluent Cart product could not be found.', 'fluentform')
            );
        }

        $canPurchase = $variation->canPurchase($quantity);

        if (is_wp_error($canPurchase)) {
            return $canPurchase;
        }

        if ($expectedPaymentType === 'subscription' && $variation->payment_type !== 'subscription') {
            return new \WP_Error(
                'fluent_cart_invalid_product_type',
                __('Please map this field to a Fluent Cart subscription product.', 'fluentform')
            );
        }

        if ($expectedPaymentType === 'onetime' && $variation->payment_type === 'subscription') {
            return new \WP_Error(
                'fluent_cart_invalid_product_type',
                __('Please map payment item fields to one-time Fluent Cart products.', 'fluentform')
            );
        }

        return [
            'field_name'    => $fieldName,
            'label'         => $label,
            'quantity'      => $quantity,
            'unit_price'    => (int)$variation->item_price,
            'line_total'    => (int)$variation->item_price * $quantity,
            'payment_type'  => $variation->payment_type === 'subscription' ? 'subscription' : 'single',
            'variation_id'  => (int)$variation->id,
            'variation'     => $variation,
        ];
    }

    protected function syncFluentCartSubmissionRecords($submission, $form, $context)
    {
        OrderItem::where('submission_id', $submission->id)->delete();
        Subscription::where('submission_id', $submission->id)->delete();
        Transaction::where('submission_id', $submission->id)->delete();

        foreach ($context['items'] as $item) {
            OrderItem::create([
                'form_id'       => $form->id,
                'submission_id' => $submission->id,
                'item_name'     => $item['label'],
                'item_price'    => $item['unit_price'],
                'quantity'      => $item['quantity'],
                'line_total'    => $item['line_total'],
                'type'          => $item['payment_type'] === 'subscription' ? 'subscription' : 'single',
                'created_at'    => current_time('mysql'),
                'updated_at'    => current_time('mysql'),
            ]);

            if ($item['payment_type'] === 'subscription') {
                $variationInfo = is_array($item['variation']->other_info) ? $item['variation']->other_info : [];

                Subscription::create([
                    'form_id'          => $form->id,
                    'submission_id'    => $submission->id,
                    'payment_total'    => $item['line_total'],
                    'item_name'        => $item['label'],
                    'plan_name'        => $item['label'],
                    'billing_interval' => $this->normalizeFluentCartBillingInterval(Arr::get($variationInfo, 'repeat_interval', 'monthly')),
                    'trial_days'       => absint(Arr::get($variationInfo, 'trial_days')),
                    'initial_amount'   => absint(Arr::get($variationInfo, 'signup_fee')),
                    'quantity'         => $item['quantity'],
                    'recurring_amount' => $item['unit_price'],
                    'bill_times'       => absint(Arr::get($variationInfo, 'billing_cycles')),
                    'bill_count'       => 0,
                    'status'           => 'pending',
                    'element_id'       => $item['field_name'],
                    'original_plan'    => maybe_serialize([
                        'fluent_cart_variation_id' => $item['variation_id'],
                        'fluent_cart_product_id'   => (int)$item['variation']->post_id,
                    ]),
                    'created_at'       => current_time('mysql'),
                    'updated_at'       => current_time('mysql'),
                ]);
            }
        }

        Submission::where('id', $submission->id)->update([
            'payment_method' => 'fluent_cart',
            'payment_status' => 'pending',
            'payment_total'  => $context['total'],
            'payment_type'   => $context['ff_payment_type'],
            'currency'       => $context['currency'],
            'updated_at'     => current_time('mysql'),
        ]);
    }

    protected function createFluentCartPendingTransaction($submission, $form, $context)
    {
        $transactionHash = md5('fluent_cart_payment_' . $submission->id . '_' . wp_generate_uuid4() . '_' . time());
        $customerName = PaymentHelper::getCustomerName($submission, $form);
        $customerEmail = PaymentHelper::getCustomerEmail($submission, $form);

        return Transaction::create([
            'form_id'          => $form->id,
            'submission_id'    => $submission->id,
            'transaction_hash' => $transactionHash,
            'transaction_type' => $context['payment_type'],
            'payment_method'   => 'fluent_cart',
            'payment_total'    => $context['total'],
            'status'           => 'pending',
            'currency'         => $context['currency'],
            'payment_mode'     => (string)FluentCartCurrencySettings::get('order_mode'),
            'payer_name'       => sanitize_text_field((string)$customerName),
            'payer_email'      => sanitize_email((string)$customerEmail),
            'created_at'       => current_time('mysql'),
            'updated_at'       => current_time('mysql'),
        ]);
    }

    protected function createFluentCartPaymentCart($submission, $form, $context, $transaction)
    {
        $customerData = $this->getFluentCartCustomerData($submission, $form);
        $customer = $this->getOrCreateFluentCartCustomer($customerData);
        $cart = new FluentCartCart();
        $cart->cart_data = array_map(function ($item) {
            return FluentCartCartHelper::generateCartItemFromVariation($item['variation'], $item['quantity']);
        }, $context['items']);
        $cart = FluentCartCartHelper::addCommonCartData($cart);
        $cart->cart_group = 'instant';
        $cart->email = sanitize_email((string)Arr::get($customerData, 'email'));
        $cart->first_name = sanitize_text_field((string)Arr::get($customerData, 'first_name'));
        $cart->last_name = sanitize_text_field((string)Arr::get($customerData, 'last_name'));

        if ($customer) {
            $cart->customer_id = $customer->id;
        }

        $checkoutData = [
            'payment_method'     => '',
            'fluentform_payment' => [
                'source'           => 'fluent_cart',
                'submission_id'    => $submission->id,
                'form_id'          => $form->id,
                'transaction_id'   => $transaction->id,
                'transaction_hash' => $transaction->transaction_hash,
            ],
            'form_data'          => array_filter([
                'billing_email'      => Arr::get($customerData, 'email'),
                'billing_first_name' => Arr::get($customerData, 'first_name'),
                'billing_last_name'  => Arr::get($customerData, 'last_name'),
                'billing_full_name'  => Arr::get($customerData, 'full_name'),
                'billing_phone'      => Arr::get($customerData, 'phone'),
            ]),
        ];

        $cart->checkout_data = $checkoutData;
        $cart->save();

        return $cart;
    }

    protected function getFluentCartCustomerData($submission, $form)
    {
        $email = sanitize_email((string)PaymentHelper::getCustomerEmail($submission, $form));
        $fullName = trim((string)PaymentHelper::getCustomerName($submission, $form));
        $phone = sanitize_text_field((string)PaymentHelper::getCustomerPhoneNumber($submission, $form));
        $address = PaymentHelper::getCustomerAddress($submission);
        $nameParts = preg_split('/\s+/', $fullName, 2);
        $firstName = sanitize_text_field((string)Arr::get($nameParts, 0, ''));
        $lastName = sanitize_text_field((string)Arr::get($nameParts, 1, ''));

        return [
            'email'      => $email,
            'full_name'  => $fullName,
            'first_name' => $firstName,
            'last_name'  => $lastName,
            'phone'      => $phone,
            'country'    => sanitize_text_field((string)Arr::get($address, 'country')),
            'city'       => sanitize_text_field((string)Arr::get($address, 'city')),
            'state'      => sanitize_text_field((string)Arr::get($address, 'state')),
            'postcode'   => sanitize_text_field((string)Arr::get($address, 'zip')),
        ];
    }

    protected function getOrCreateFluentCartCustomer($customerData)
    {
        $email = sanitize_email((string)Arr::get($customerData, 'email'));

        if (!$email) {
            return null;
        }

        $customer = FluentCartCustomer::query()->where('email', $email)->first();
        $customerPayload = array_filter([
            'email'      => $email,
            'first_name' => sanitize_text_field((string)Arr::get($customerData, 'first_name')),
            'last_name'  => sanitize_text_field((string)Arr::get($customerData, 'last_name')),
            'country'    => sanitize_text_field((string)Arr::get($customerData, 'country')),
            'city'       => sanitize_text_field((string)Arr::get($customerData, 'city')),
            'state'      => sanitize_text_field((string)Arr::get($customerData, 'state')),
            'postcode'   => sanitize_text_field((string)Arr::get($customerData, 'postcode')),
        ], function ($value) {
            return $value !== '' && $value !== null;
        });

        if ($customer) {
            $customer->fill($customerPayload)->save();
            return $customer;
        }

        return FluentCartCustomer::query()->create($customerPayload);
    }

    protected function syncFluentCartPendingTransactionWithOrder($order, $submissionId, $transactionId)
    {
        $submission = Submission::find($submissionId);
        $orderTransaction = $order->transactions()->orderBy('id', 'DESC')->first();
        $submissionUpdateData = [
            'payment_total' => (int)$order->total_amount,
            'currency'      => strtoupper((string)$order->currency),
            'updated_at'    => current_time('mysql'),
        ];
        $transactionUpdateData = $submissionUpdateData;

        if ($orderTransaction && !empty($orderTransaction->uuid)) {
            $transactionUpdateData['charge_id'] = $orderTransaction->uuid;
        }

        if ($transactionId) {
            Transaction::where('id', $transactionId)->update($transactionUpdateData);
        }

        if ($submission) {
            Submission::where('id', $submissionId)->update($submissionUpdateData);
        }
    }

    protected function makeFluentCartBaseProcessor()
    {
        return new class extends BaseProcessor {
            protected $method = 'fluent_cart';

            public function handlePaymentAction($submissionId, $submissionData, $form, $methodSettings, $hasSubscriptions, $totalPayable)
            {
            }

            public function getPaymentMode()
            {
                return (string)FluentCartCurrencySettings::get('order_mode');
            }
        };
    }
}
