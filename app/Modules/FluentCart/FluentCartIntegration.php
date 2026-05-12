<?php

namespace FluentForm\App\Modules\FluentCart;

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Hooks\Handlers\GlobalNotificationHandler;
use FluentCart\App\Models\Cart as FluentCartCart;
use FluentCart\App\Models\Meta as FluentCartMeta;
use FluentCart\App\Models\Order as FluentCartOrder;
use FluentCart\App\Models\OrderMeta as FluentCartOrderMeta;
use FluentCart\App\Models\OrderTransaction as FluentCartOrderTransaction;
use FluentCart\App\Vite as FluentCartVite;
use FluentForm\App\Models\Form;
use FluentForm\App\Models\Submission;
use FluentForm\App\Modules\Form\FormFieldsParser;
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
        add_filter('fluent_cart/integration/order_integrations', [$this, 'registerCheckoutIntegration']);
        add_filter('fluent_cart/integration/get_integration_defaults_fluent_forms', [$this, 'getCheckoutIntegrationDefaults']);
        add_filter('fluent_cart/integration/get_integration_settings_fields_fluent_forms', [$this, 'getCheckoutIntegrationSettingsFields'], 10, 2);
        add_filter('fluent_cart/integration/integration_saving_data_fluent_forms', [$this, 'validateCheckoutIntegrationFeed'], 10, 2);
        add_filter('fluentform/global_notification_active_types', [$this, 'filterCheckoutNotificationTypes'], 10, 2);
        add_filter('fluentform/form_payment_fields', [$this, 'filterCheckoutPaymentFields']);
        add_action('fluentform/notify_on_form_submit', [$this, 'storeCheckoutSubmissionContext'], 1, 3);
        add_action('fluent_cart/before_checkout_form', [$this, 'renderFormBeforeCheckout'], 10);
        add_action('fluent_cart/order_paid_done', [$this, 'runDeferredNotificationsForPaidOrder'], 10, 1);
        add_filter('fluent_cart/widgets/single_order', [$this, 'addOrderFormWidget'], 10, 2);
        add_filter('fluent_cart/widgets/single_order_page', [$this, 'addOrderFormWidget'], 10, 2);
        add_filter('fluentform/submissions_widgets', [$this, 'addSubmissionOrderWidget'], 10, 3);
        add_action('wp_enqueue_scripts', [$this, 'enqueueAssets']);
        add_action('admin_enqueue_scripts', [$this, 'enqueueAdminAssets']);
        add_action('wp_ajax_fluentform_fluentcart_attach_submission', [$this, 'attachSubmissionToOrder']);
        add_action('wp_ajax_nopriv_fluentform_fluentcart_attach_submission', [$this, 'attachSubmissionToOrder']);
    }

    /**
     * Enqueue necessary assets
     *
     * @return void
     */
    public function enqueueAssets()
    {
        if (!$this->isFluentCartCheckoutPage()) {
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
    public function saveFluentFormDataToOrder($data)
    {
        $order = Arr::get($data, 'order');
        $requestData = Arr::get($data, 'request_data', []);

        if (!$order || !is_object($order)) {
            return;
        }

        // Get the configured form ID
        $formId = $this->getCheckoutFormId();

        if (!$formId) {
            return;
        }

        $fluentFormData = $this->extractFluentFormData($requestData, $formId);

        if (empty($fluentFormData)) {
            return;
        }

        $order->updateMeta('fluent_form_data', $fluentFormData);
        $order->updateMeta('fluent_form_id', $formId);
    }

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

        $order = $this->resolveCheckoutOrder($orderId, $transactionHash);

        if (!$order) {
            wp_send_json_error([
                'message' => __('Fluent Cart order could not be resolved for this submission.', 'fluentform'),
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

    protected function resolveCheckoutOrder($orderId = 0, $transactionHash = '')
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

    /**
     * Add Fluent Forms widget to order page
     *
     * @param array $widgets
     * @param \FluentCart\App\Models\Order|array $order
     * @return array
     */
    public function addOrderFormWidget($widgets, $order)
    {
        if (!$order) {
            return $widgets;
        }

        if (is_array($order)) {
            $orderModel = Arr::get($order, 'order');

            if (is_object($orderModel) && method_exists($orderModel, 'getMeta')) {
                $order = $orderModel;
            } else {
                $orderId = absint(Arr::get($order, 'order_id'));
                $orderUuid = sanitize_text_field((string) Arr::get($order, 'order_uuid'));

                if ($orderId) {
                    $orderModel = FluentCartOrder::find($orderId);
                } elseif ($orderUuid) {
                    $orderModel = FluentCartOrder::where('uuid', $orderUuid)->first();
                }

                if (!$orderModel) {
                    return $widgets;
                }

                $order = $orderModel;
            }
        }

        if (!is_object($order) || !method_exists($order, 'getMeta')) {
            return $widgets;
        }

        $formId = $order->getMeta('fluent_form_id');
        $submissionId = absint($order->getMeta('fluent_form_submission_id'));

        if (!$formId || !$submissionId) {
            return $widgets;
        }

        $form = Form::find($formId);
        $formTitle = $form ? $form->title : ('#' . $formId);
        $htmlContent = '<div class="fluent-form-data-display">';
        $htmlContent .= '<a href="' . esc_url($this->getSubmissionAdminUrl($formId, $submissionId)) . '" target="_blank" rel="noopener">' . sprintf(esc_html__('Open %s entry #%d', 'fluentform'), esc_html($formTitle), absint($submissionId)) . '</a>';
        $htmlContent .= '</div>';

        $widgets[] = [
            'title' => 'Fluent Forms Entry',
            'sub_title' => sprintf('Form: %s', $formTitle),
            'subtitle' => sprintf('Form: %s', $formTitle),
            'type' => 'html',
            'content' => $htmlContent,
        ];

        return $widgets;
    }

    public function addSubmissionOrderWidget($widgets, $resources, $submission)
    {
        if (!$submission || empty($submission->id)) {
            return $widgets;
        }

        $order = $this->findOrderBySubmissionId($submission->id);

        if (!$order) {
            return $widgets;
        }

        $orderTitle = $order->payment_method_title ?: ucwords(str_replace('_', ' ', (string) $order->payment_method));
        $total = number_format((float) $order->total_amount, 2);

        $html = '<ul class="fc_full_listed fcrm_fluentcart_customer_commerce_info">';
        $html .= '<li><span class="fc_list_sub">' . esc_html__('Order', 'fluentform') . '</span> <span class="fc_list_value"><a href="' . esc_url($this->getOrderAdminUrl($order->id)) . '" target="_blank" rel="noopener">#' . absint($order->id) . '</a></span></li>';
        $html .= '<li><span class="fc_list_sub">' . esc_html__('Payment Status', 'fluentform') . '</span> <span class="fc_list_value">' . esc_html($order->payment_status ?: '-') . '</span></li>';
        $html .= '<li><span class="fc_list_sub">' . esc_html__('Order Status', 'fluentform') . '</span> <span class="fc_list_value">' . esc_html($order->status ?: '-') . '</span></li>';
        $html .= '<li><span class="fc_list_sub">' . esc_html__('Payment Method', 'fluentform') . '</span> <span class="fc_list_value">' . esc_html($orderTitle ?: '-') . '</span></li>';
        $html .= '<li><span class="fc_list_sub">' . esc_html__('Total', 'fluentform') . '</span> <span class="fc_list_value">' . esc_html($total) . '</span></li>';
        $html .= '<li><span class="fc_list_sub">' . esc_html__('Created', 'fluentform') . '</span> <span class="fc_list_value">' . esc_html((string) $order->created_at) . '</span></li>';
        $html .= '</ul>';
        $html .= $this->getCompactAdminWidgetStyle();

        $widgets['fluent_cart'] = [
            'title'   => __('Fluent Cart', 'fluentform'),
            'content' => $html
        ];

        return $widgets;
    }

    /**
     * Format form data for display
     *
     * @param array $formData
     * @param array $fields
     * @param \FluentForm\App\Models\Form $form
     * @return array
     */
    protected function formatFormDataForDisplay($formData, $fields, $form)
    {
        $formatted = [];

        foreach ($formData as $key => $value) {
            if ($value === '' || $value === null) {
                continue;
            }

            if (is_array($value)) {
                $field = $this->findFieldByName($fields, $key);
                $rawField = Arr::get($field, 'raw');
                $subFields = Arr::get($rawField, 'fields', []);
                if (empty($subFields)) {
                    $subFields = Arr::get($field, 'fields', []);
                }
                
                if (!empty($subFields)) {
                    $formatted[$key] = $value;
                } else {
                    if (count($value) === 1 && isset($value[0])) {
                        $formatted[$key] = $value[0];
                    } else {
                        $formatted[$key] = $value;
                    }
                }
            } else {
                $formatted[$key] = $value;
            }
        }

        return $formatted;
    }

    /**
     * Find field by name in fields array
     *
     * @param array $fields
     * @param string $fieldName
     * @return array|null
     */
    protected function findFieldByName($fields, $fieldName)
    {
        if (isset($fields[$fieldName])) {
            return $fields[$fieldName];
        }
        
        foreach ($fields as $field) {
            $rawName = Arr::get($field, 'raw.attributes.name');
            if ($rawName === $fieldName) {
                return $field;
            }
        }
        return null;
    }

    protected function findOrderBySubmissionId($submissionId)
    {
        if (!$submissionId || !class_exists(FluentCartOrderMeta::class)) {
            return null;
        }

        $orderMeta = FluentCartOrderMeta::query()
            ->where('meta_key', 'fluent_form_submission_id')
            ->where('meta_value', (string) $submissionId)
            ->first();

        if (!$orderMeta || empty($orderMeta->order_id)) {
            return null;
        }

        return FluentCartOrder::find((int) $orderMeta->order_id);
    }

    protected function getOrderAdminUrl($orderId)
    {
        return admin_url('admin.php?page=fluent-cart#/orders/' . absint($orderId) . '/view');
    }

    protected function getSubmissionAdminUrl($formId, $submissionId)
    {
        return admin_url('admin.php?page=fluent_forms&form_id=' . absint($formId) . '&route=entries#/entries/' . absint($submissionId));
    }

    protected function getCompactAdminWidgetStyle()
    {
        return '<style>
ul.fc_full_listed {
    border-radius: 4px;
    list-style: none;
    margin: 0;
    padding: 0;
}
ul.fc_full_listed li {
    border-bottom: 1px solid #ebeef4;
    display: block;
    margin: 0;
    padding: 5px 0;
}
ul.fc_full_listed > li span.fc_list_sub {
    font-weight: 500;
}
ul.fc_full_listed > li span.fc_list_value {
    float: right;
}
</style>';
    }

    /**
     * Get field label
     *
     * @param array|null $field
     * @param string $fieldName
     * @return string
     */
    protected function getFieldLabel($field, $fieldName)
    {
        if ($field) {
            $adminLabel = Arr::get($field, 'admin_label');
            if ($adminLabel) {
                return $adminLabel;
            }
            
            $rawAdminLabel = Arr::get($field, 'raw.settings.admin_field_label');
            if ($rawAdminLabel) {
                return $rawAdminLabel;
            }
            
            $rawLabel = Arr::get($field, 'raw.settings.label');
            if ($rawLabel) {
                return $rawLabel;
            }
            
            $label = Arr::get($field, 'settings.label');
            if ($label) {
                return $label;
            }
        }

        return ucwords(str_replace(['_', '-'], ' ', $fieldName));
    }

    /**
     * Format field value for display
     *
     * @param mixed $value
     * @param array|null $field
     * @return string
     */
    protected function formatFieldValue($value, $field)
    {
        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
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
