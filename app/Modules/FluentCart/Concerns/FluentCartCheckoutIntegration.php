<?php

namespace FluentForm\App\Modules\FluentCart\Concerns;

use FluentCart\App\Models\Cart as FluentCartCart;
use FluentCart\App\Models\Meta as FluentCartMeta;
use FluentCart\App\Models\Order as FluentCartOrder;
use FluentCart\App\Models\OrderTransaction as FluentCartOrderTransaction;
use FluentCart\App\Vite as FluentCartVite;
use FluentForm\App\Helpers\Helper;
use FluentForm\App\Hooks\Handlers\GlobalNotificationHandler;
use FluentForm\App\Models\Form;
use FluentForm\App\Models\Submission;
use FluentForm\Framework\Support\Arr;

trait FluentCartCheckoutIntegration
{

    public function enqueueAssets()
    {
        if (!$this->isFluentCartCheckoutPage() || $this->isFluentCartPaymentCheckout()) {
            return;
        }

        wp_enqueue_script(
            'fluent-cart-form-integration',
            fluentFormMix('js/fluent-cart/fluent-cart-fluent-form-connection.js'),
            ['jquery', 'fluent-form-submission'],
            FLUENTFORM_VERSION,
            true
        );

        wp_localize_script('fluent-cart-form-integration', 'fluentFormFluentCart', $this->getScriptConfig());
    }

    public function enqueueAdminAssets()
    {
        if (!$this->isFluentCartAdminPage()) {
            return;
        }

        wp_enqueue_script(
            'fluent-cart-form-integration',
            fluentFormMix('js/fluent-cart/fluent-cart-fluent-form-connection.js'),
            ['jquery'],
            FLUENTFORM_VERSION,
            true
        );
        wp_localize_script('fluent-cart-form-integration', 'fluentFormFluentCart', $this->getScriptConfig());
    }

    public function registerCheckoutIntegration($integrations)
    {
        $integrations['fluent_forms'] = [
            'priority'                => 15,
            'title'                   => __('Fluent Forms', 'fluentform'),
            'description'             => __('Render a Fluent Form inside the Fluent Cart checkout and store the submitted form data with the order.', 'fluentform'),
            'category'                => 'core',
            'disable_global_settings' => true,
            'config_url'              => '',
            'logo'                    => $this->getCheckoutIntegrationLogo(),
            'enabled'                 => $this->hasAvailableForms(),
            'scopes'                  => ['global'],
            'installable'             => '',
            'delay_on_product_action' => false,
            'delay_on_global_action'  => false,
        ];

        return $integrations;
    }

    public function getCheckoutIntegrationDefaults($settings)
    {
        return [
            'enabled' => 'yes',
            'name'    => __('Fluent Forms Checkout', 'fluentform'),
            'form_id' => '',
        ];
    }

    public function getCheckoutIntegrationSettingsFields($settings, $args = [])
    {
        return [
            'fields'            => [
                [
                    'key'         => 'name',
                    'label'       => __('Feed Title', 'fluentform'),
                    'required'    => true,
                    'placeholder' => __('Fluent Forms Checkout', 'fluentform'),
                    'component'   => 'text',
                    'inline_tip'  => __('This label is used inside Fluent Cart integrations.', 'fluentform'),
                ],
                [
                    'key'         => 'form_id',
                    'label'       => __('Checkout Form', 'fluentform'),
                    'required'    => true,
                    'placeholder' => __('Select a Fluent Form', 'fluentform'),
                    'component'   => 'select',
                    'options'     => $this->getFormOptionsForIntegration(),
                    'inline_tip'  => __('The selected form will render before the Fluent Cart checkout form on the checkout page.', 'fluentform'),
                ],
            ],
            'integration_title' => __('Fluent Forms', 'fluentform'),
        ];
    }

    public function validateCheckoutIntegrationFeed($integration, $args)
    {
        $existingFeedId = $this->getCheckoutIntegrationFeedId();
        $currentFeedId = (int)Arr::get($args, 'integration_id');

        if ($existingFeedId && !$currentFeedId) {
            return new \WP_Error(
                'fluentform_checkout_integration_exists',
                __('Fluent Forms checkout integration is already configured. Edit the existing feed instead of creating another one.', 'fluentform')
            );
        }

        $integration['name'] = sanitize_text_field((string)Arr::get($integration, 'name'));
        $integration['form_id'] = (string)absint(Arr::get($integration, 'form_id'));
        $integration['enabled'] = Arr::get($integration, 'enabled') === 'no' ? 'no' : 'yes';

        return $integration;
    }


    /**
     * Render form before checkout
     *
     * @param array $data
     * @return void
     */
    public function renderFormBeforeCheckout($data = [])
    {
        if ($this->isFluentCartPaymentCheckout()) {
            return;
        }

        $formId = $this->getCheckoutFormId();

        if (!$formId) {
            return;
        }

        $renderingFilter = function ($form) use ($formId) {
            if ((int)$form->id !== (int)$formId) {
                return $form;
            }

            return $this->makeCheckoutCompatibleForm($form);
        };

        add_filter('fluentform/is_hide_submit_btn_' . $formId, '__return_true');
        add_filter('fluentform/replace_form_tag_' . $formId, function ($tag) {
            return 'div';
        });
        add_filter('fluentform/rendering_form', $renderingFilter, 10, 1);
        add_filter('fluentform/html_attributes', function ($attributes, $form) use ($formId) {
            if ($form->id == $formId) {
                $attributes['data-fluent-cart-checkout-form'] = 'true';
                $attributes['class'] = ($attributes['class'] ?? '') . ' fluent-cart-checkout-form';
            }
            return $attributes;
        }, 10, 2);

        echo do_shortcode('[fluentform id="' . $formId . '" title="false" description="false"]');

        remove_filter('fluentform/rendering_form', $renderingFilter, 10);
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

    protected function getFormOptionsForIntegration()
    {
        $forms = $this->getFormsForSelection();

        return array_reduce($forms, function ($options, $form) {
            $value = Arr::get($form, 'value');
            $label = Arr::get($form, 'label');

            if (!$value || $value === 'none' || !$label) {
                return $options;
            }

            $options[(string)$value] = $label;

            return $options;
        }, []);
    }

    protected function hasAvailableForms()
    {
        return !empty($this->getFormOptionsForIntegration());
    }

    protected function makeCheckoutCompatibleForm($form)
    {
        $formClone = clone $form;
        $formFields = json_decode($formClone->form_fields, true);

        if (!is_array($formFields)) {
            return $formClone;
        }

        $formFields['fields'] = $this->stripCheckoutPaymentFields(Arr::get($formFields, 'fields', []));
        $formClone->fields = $formFields;
        $formClone->form_fields = wp_json_encode($formFields);
        $formClone->has_payment = 0;

        return $formClone;
    }

    protected function stripCheckoutPaymentFields($fields)
    {
        $sanitizedFields = [];

        foreach ((array)$fields as $field) {
            if (!is_array($field)) {
                continue;
            }

            if ($this->isCheckoutPaymentField($field)) {
                continue;
            }

            if (Arr::get($field, 'element') === 'container') {
                $columns = Arr::get($field, 'columns', []);

                foreach ($columns as $index => $column) {
                    $columns[$index]['fields'] = $this->stripCheckoutPaymentFields(Arr::get($column, 'fields', []));
                }

                $columns = array_values(array_filter($columns, function ($column) {
                    return !empty(Arr::get($column, 'fields', []));
                }));

                if (!$columns) {
                    continue;
                }

                $field['columns'] = $columns;
            }

            $sanitizedFields[] = $field;
        }

        return $sanitizedFields;
    }

    protected function isCheckoutPaymentField($field)
    {
        $element = Arr::get($field, 'element');
        $paymentElements = [
            'custom_payment_component',
            'multi_payment_component',
            'payment_method',
            'payment_coupon',
            'payment_summary_component',
            'subscription_payment_component',
            'item_quantity_component',
        ];

        if (in_array($element, $paymentElements, true)) {
            return true;
        }

        if ($element === 'rangeslider' && Arr::get($field, 'settings.enable_target_product') === 'yes') {
            return true;
        }

        return Arr::get($field, 'settings.is_payment_field') === 'yes';
    }

    /**
     * Save Fluent Forms data to order meta
     *
     * @param array $data Contains: cart, order, prev_order, request_data, validated_data
     * @return void
     */
    public function attachSubmissionToOrder()
    {
        if (!wp_verify_nonce(sanitize_text_field((string) Arr::get($_REQUEST, '_ajax_nonce')), 'fluentform_fluentcart_checkout')) {
            wp_send_json_error([
                'message' => __('Fluent Forms checkout request could not be verified.', 'fluentform'),
            ], 403);
        }

        $submissionId = absint(Arr::get($_REQUEST, 'submission_id'));
        $formId = absint(Arr::get($_REQUEST, 'form_id'));
        $orderId = absint(Arr::get($_REQUEST, 'order_id'));
        $transactionHash = sanitize_text_field((string)Arr::get($_REQUEST, 'transaction_hash'));
        $checkoutHash = $this->getCheckoutCartHashFromRequest();

        if (!$submissionId || !$formId || !$checkoutHash) {
            wp_send_json_error([
                'message' => __('Missing Fluent Forms checkout submission data.', 'fluentform'),
            ], 422);
        }

        if ($formId !== $this->getCheckoutFormId()) {
            wp_send_json_error([
                'message' => __('This Fluent Forms checkout submission is not valid for the active Fluent Cart integration.', 'fluentform'),
            ], 403);
        }

        $submission = Submission::find($submissionId);

        if (!$submission || (int)$submission->form_id !== $formId) {
            wp_send_json_error([
                'message' => __('Fluent Forms submission could not be verified.', 'fluentform'),
            ], 404);
        }

        if (Helper::getSubmissionMeta($submissionId, '_ff_fluentcart_cart_hash') !== $checkoutHash) {
            wp_send_json_error([
                'message' => __('This Fluent Forms checkout submission is not valid for the current checkout session.', 'fluentform'),
            ], 403);
        }

        $order = $this->resolveCheckoutOrder($orderId, $transactionHash, $checkoutHash);

        if (!$order) {
            wp_send_json_error([
                'message' => __('Fluent Cart order could not be resolved for this submission.', 'fluentform'),
            ], 404);
        }

        if (!class_exists(FluentCartCart::class)) {
            wp_send_json_error([
                'message' => __('Fluent Cart checkout session is not available.', 'fluentform'),
            ], 404);
        }

        $cart = FluentCartCart::find($checkoutHash);
        if (!$cart || (int)$cart->order_id !== (int)$order->id) {
            wp_send_json_error([
                'message' => __('This Fluent Cart order is not valid for the current checkout session.', 'fluentform'),
            ], 403);
        }

        $formData = json_decode($submission->response, true);
        if (!is_array($formData)) {
            $formData = [];
        }

        $order->updateMeta('fluent_form_data', $formData);
        $order->updateMeta('fluent_form_id', $formId);
        $order->updateMeta('fluent_form_submission_id', $submissionId);
        Helper::setSubmissionMeta($submissionId, '_ff_fluentcart_order_id', (int)$order->id, $formId);
        Helper::setSubmissionMeta($submissionId, '_ff_fluentcart_notifications_deferred', 'yes', $formId);

        if ($this->isOrderPaid($order)) {
            $this->dispatchDeferredNotificationsForOrder($order, $submission, $formId);
        }

        wp_send_json_success([
            'order_id'      => $order->id,
            'form_id'       => $formId,
            'submission_id' => $submissionId,
        ]);
    }

    public function filterCheckoutPaymentFields($paymentFields)
    {
        if (!$this->shouldBypassCheckoutPaymentHandling()) {
            return $paymentFields;
        }

        return [];
    }

    public function filterCheckoutNotificationTypes($types, $formId)
    {
        if (!$this->shouldDeferCheckoutNotifications((int)$formId)) {
            return $types;
        }

        return [];
    }

    public function storeCheckoutSubmissionContext($submissionId, $formData, $form)
    {
        $formId = is_object($form) ? absint($form->id) : 0;

        if (!$submissionId || !$this->shouldBypassCheckoutPaymentHandling() || $formId !== $this->getCheckoutFormId()) {
            return;
        }

        $checkoutHash = $this->getCheckoutCartHashFromRequest();
        if (!$checkoutHash) {
            return;
        }

        Helper::setSubmissionMeta($submissionId, '_ff_fluentcart_cart_hash', $checkoutHash, $formId);
    }

    public function runDeferredNotificationsForPaidOrder($data)
    {
        $order = Arr::get((array)$data, 'order');

        if (!$order || !is_object($order)) {
            return;
        }

        $this->dispatchDeferredNotificationsForOrder($order);
    }

    protected function resolveCheckoutOrder($orderId = 0, $transactionHash = '', $checkoutHash = '')
    {
        if ($orderId && class_exists(FluentCartOrder::class)) {
            $order = FluentCartOrder::find($orderId);
            if ($order) {
                return $order;
            }
        }

        if ($transactionHash && class_exists(FluentCartOrderTransaction::class)) {
            $transaction = FluentCartOrderTransaction::query()
                ->where('uuid', $transactionHash)
                ->first();

            if ($transaction && $transaction->order) {
                return $transaction->order;
            }
        }

        if ($checkoutHash && class_exists(FluentCartCart::class) && class_exists(FluentCartOrder::class)) {
            $cart = FluentCartCart::find($checkoutHash);

            if ($cart && (int)$cart->order_id > 0) {
                $order = FluentCartOrder::find((int)$cart->order_id);
                if ($order) {
                    return $order;
                }
            }
        }

        return null;
    }

    protected function getCheckoutFormId()
    {
        return absint(Arr::get($this->getCheckoutIntegrationConfig(), 'form_id'));
    }

    protected function getCheckoutIntegrationConfig()
    {
        if (!class_exists(FluentCartMeta::class)) {
            return [];
        }

        $feed = FluentCartMeta::query()
            ->where('object_type', 'order_integration')
            ->where('meta_key', 'fluent_forms')
            ->orderBy('id', 'desc')
            ->first();

        if (!$feed) {
            return [];
        }

        $config = $feed->meta_value;

        if (!is_array($config) || Arr::get($config, 'enabled') === 'no') {
            return [];
        }

        return $config;
    }

    protected function getCheckoutIntegrationFeedId()
    {
        if (!class_exists(FluentCartMeta::class)) {
            return 0;
        }

        $feed = FluentCartMeta::query()
            ->where('object_type', 'order_integration')
            ->where('meta_key', 'fluent_forms')
            ->orderBy('id', 'desc')
            ->first();

        return $feed ? (int)$feed->id : 0;
    }

    protected function getCheckoutIntegrationLogo()
    {
        if (class_exists(FluentCartVite::class)) {
            return FluentCartVite::getAssetUrl('images/integrations/fluent-form.svg');
        }

        return '';
    }

    protected function isFluentCartAdminPage()
    {
        return is_admin() && isset($_GET['page']) && sanitize_text_field(wp_unslash($_GET['page'])) === 'fluent-cart';
    }

    protected function isFluentCartCheckoutPage()
    {
        return !is_admin() && (bool)$this->getCurrentCheckoutHash();
    }

    protected function isFluentCartPaymentCheckout()
    {
        $cart = $this->getCurrentCheckoutCart();

        if (!$cart) {
            return false;
        }

        return sanitize_text_field((string)Arr::get($cart->checkout_data, 'fluentform_payment.source')) === 'fluent_cart';
    }

    protected function getCurrentCheckoutCart()
    {
        $checkoutHash = $this->getCurrentCheckoutHash();

        if (!$checkoutHash || !class_exists(FluentCartCart::class)) {
            return null;
        }

        return FluentCartCart::find($checkoutHash);
    }

    protected function getCurrentCheckoutHash()
    {
        return sanitize_text_field((string) Arr::get($_GET, 'fct_cart_hash'));
    }

    protected function shouldBypassCheckoutPaymentHandling()
    {
        $requestFormId = absint(Arr::get($_REQUEST, 'form_id'));
        $context = $this->getCheckoutRequestContext();

        if (!$requestFormId || $context !== '1') {
            return false;
        }

        return $requestFormId === $this->getCheckoutFormId();
    }

    protected function getCheckoutRequestContext()
    {
        $context = sanitize_text_field((string) Arr::get($_REQUEST, '__ff_fluent_cart_checkout_context'));

        if ($context !== '') {
            return $context;
        }

        $serializedFormData = (string) Arr::get($_REQUEST, 'data');
        if (!$serializedFormData) {
            return '';
        }

        parse_str(wp_unslash($serializedFormData), $parsedData);

        return sanitize_text_field((string) Arr::get($parsedData, '__ff_fluent_cart_checkout_context'));
    }

    protected function getCheckoutCartHashFromRequest()
    {
        $checkoutHash = sanitize_text_field((string) Arr::get($_REQUEST, 'checkout_hash'));

        if ($checkoutHash !== '') {
            return $checkoutHash;
        }

        $checkoutHash = sanitize_text_field((string) Arr::get($_REQUEST, 'fct_cart_hash'));
        if ($checkoutHash !== '') {
            return $checkoutHash;
        }

        $requestData = $this->getCheckoutSerializedRequestData();

        $checkoutHash = sanitize_text_field((string) Arr::get($requestData, 'fct_cart_hash'));
        if ($checkoutHash !== '') {
            return $checkoutHash;
        }

        $referer = sanitize_text_field((string) Arr::get($requestData, '_wp_http_referer'));
        if (!$referer) {
            $referer = wp_unslash((string) Arr::get($_SERVER, 'HTTP_REFERER'));
        }

        if (!$referer) {
            return '';
        }

        $queryString = wp_parse_url($referer, PHP_URL_QUERY);
        if (!$queryString) {
            return '';
        }

        parse_str($queryString, $queryArgs);

        return sanitize_text_field((string) Arr::get($queryArgs, 'fct_cart_hash'));
    }

    protected function getCheckoutSerializedRequestData()
    {
        $serializedFormData = (string) Arr::get($_REQUEST, 'data');
        if (!$serializedFormData) {
            return [];
        }

        parse_str(wp_unslash($serializedFormData), $parsedData);

        return is_array($parsedData) ? $parsedData : [];
    }

    protected function shouldDeferCheckoutNotifications($formId = 0)
    {
        if (!$this->shouldBypassCheckoutPaymentHandling()) {
            return false;
        }

        return !$formId || $formId === $this->getCheckoutFormId();
    }

    protected function dispatchDeferredNotificationsForOrder($order, $submission = null, $formId = 0)
    {
        if (!$order || !is_object($order) || !method_exists($order, 'getMeta') || !$this->isOrderPaid($order)) {
            return false;
        }

        $submissionId = $submission ? (int)$submission->id : absint($order->getMeta('fluent_form_submission_id'));
        $formId = $formId ?: absint($order->getMeta('fluent_form_id'));

        if (!$submissionId || !$formId) {
            return false;
        }

        $status = Helper::getSubmissionMeta($submissionId, '_ff_fluentcart_notifications_processed');
        if (in_array($status, ['processing', 'yes'], true)) {
            return false;
        }

        if (!$submission) {
            $submission = Submission::find($submissionId);
        }

        if (!$submission || (int)$submission->form_id !== $formId) {
            return false;
        }

        $form = Form::find($formId);
        if (!$form) {
            return false;
        }

        $formData = json_decode($submission->response, true);
        if (!is_array($formData)) {
            $formData = [];
        }

        Helper::setSubmissionMeta($submissionId, '_ff_fluentcart_notifications_processed', 'processing', $formId);

        try {
            (new GlobalNotificationHandler($this->app))->globalNotify($submissionId, $formData, $form);
            Helper::setSubmissionMeta($submissionId, '_ff_fluentcart_notifications_processed', 'yes', $formId);

            return true;
        } catch (\Throwable $e) {
            Helper::setSubmissionMeta($submissionId, '_ff_fluentcart_notifications_processed', 'failed', $formId);

            if (method_exists($order, 'addLog')) {
                $order->addLog('Fluent Forms Integration Error', $e->getMessage(), 'error');
            }

            return false;
        }
    }

    protected function isOrderPaid($order)
    {
        return is_object($order) && isset($order->payment_status) && $order->payment_status === 'paid';
    }

    protected function getScriptConfig()
    {
        return [
            'ajaxUrl'      => admin_url('admin-ajax.php'),
            'ajaxNonce'    => wp_create_nonce('fluentform_fluentcart_checkout'),
            'checkoutHash' => $this->getCurrentCheckoutHash(),
        ];
    }
}
