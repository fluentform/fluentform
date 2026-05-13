<?php

namespace FluentForm\App\Modules\FluentCart;

use FluentForm\App\Modules\FluentCart\Concerns\FluentCartCheckoutIntegration;
use FluentForm\App\Modules\FluentCart\Concerns\FluentCartCustomerPortal;
use FluentForm\App\Modules\FluentCart\Concerns\FluentCartLifecycleSync;
use FluentForm\App\Modules\FluentCart\Concerns\FluentCartOrderFilters;
use FluentForm\App\Modules\FluentCart\Concerns\FluentCartPaymentMethod;
use FluentForm\App\Modules\FluentCart\Concerns\FluentCartShortcodes;
use FluentForm\App\Modules\FluentCart\Concerns\FluentCartSubmissionContext;
use FluentForm\App\Modules\FluentCart\Concerns\FluentCartWidgets;
use FluentForm\Framework\Foundation\Application;

class FluentCartIntegration
{
    use FluentCartCheckoutIntegration;
    use FluentCartCustomerPortal;
    use FluentCartLifecycleSync;
    use FluentCartOrderFilters;
    use FluentCartPaymentMethod;
    use FluentCartShortcodes;
    use FluentCartSubmissionContext;
    use FluentCartWidgets;

    /**
     * @var Application
     */
    protected $app;

    public function __construct(Application $app)
    {
        $this->app = $app;

        if ($this->isFluentCartActive()) {
            $this->registerHooks();
        }
    }

    protected function registerHooks()
    {
        add_filter('fluent_cart/integration/order_integrations', [$this, 'registerCheckoutIntegration']);
        add_filter('fluent_cart/integration/get_integration_defaults_fluent_forms', [$this, 'getCheckoutIntegrationDefaults']);
        add_filter('fluent_cart/integration/get_integration_settings_fields_fluent_forms', [$this, 'getCheckoutIntegrationSettingsFields'], 10, 2);
        add_filter('fluent_cart/integration/integration_saving_data_fluent_forms', [$this, 'validateCheckoutIntegrationFeed'], 10, 2);
        add_filter('fluentform/payment_methods_global_settings', [$this, 'registerFluentCartPaymentMethodSettings']);
        add_filter('fluentform/payment_settings_fluent_cart', [$this, 'getFluentCartPaymentMethodSettings']);
        add_filter('fluentform/payment_method_settings_validation_fluent_cart', [$this, 'validateFluentCartPaymentMethodSettings'], 10, 2);
        add_filter('fluentform/payment_method_settings_save_fluent_cart', [$this, 'sanitizeFluentCartPaymentMethodSettings']);
        add_filter('fluentform/available_payment_methods', [$this, 'registerFluentCartPaymentMethod']);
        add_filter('fluentform/editor_vars', [$this, 'addFluentCartEditorVars']);
        add_filter('fluentform/editor_init_element_multi_payment_component', [$this, 'normalizeFluentCartPaymentFieldSettings']);
        add_filter('fluentform/editor_init_element_subscription_payment_component', [$this, 'normalizeFluentCartSubscriptionFieldSettings']);
        add_filter('fluentform/payment_field_multi_payment_component_pricing_options', [$this, 'syncMappedPricingOptionsWithFluentCart'], 10, 3);
        add_filter('fluentform/rendering_field_data_multi_payment_component', [$this, 'syncSinglePaymentFieldWithFluentCart'], 10, 2);
        add_filter('fluentform/rendering_field_data_subscription_payment_component', [$this, 'syncSubscriptionFieldWithFluentCart'], 10, 2);
        add_filter('fluentform/validate_input_item_payment_method', [$this, 'validateFluentCartPaymentSelection'], 20, 5);
        add_filter('fluentform/global_notification_active_types', [$this, 'filterCheckoutNotificationTypes'], 10, 2);
        add_filter('fluentform/form_payment_fields', [$this, 'filterCheckoutPaymentFields']);
        add_action('fluentform/before_insert_payment_form', [$this, 'syncPaymentFormBeforePaymentAction'], 5, 3);
        add_action('fluentform/notify_on_form_submit', [$this, 'storeCheckoutSubmissionContext'], 1, 3);
        add_action('fluentform/process_payment_fluent_cart', [$this, 'processFluentCartPayment'], 10, 6);
        add_action('fluent_cart/before_checkout_form', [$this, 'renderFormBeforeCheckout'], 10);
        add_action('fluent_cart/checkout/prepare_other_data', [$this, 'linkFluentCartPaymentOrder'], 11, 1);
        add_action('fluent_cart/order_paid_done', [$this, 'runDeferredNotificationsForPaidOrder'], 10, 1);
        add_action('fluent_cart/order_paid_done', [$this, 'syncFluentCartPaymentSubmission'], 20, 1);
        add_action('fluent_cart/order_refunded', [$this, 'syncFluentCartRefund'], 20, 1);
        add_action('fluent_cart/order_status_changed_to_canceled', [$this, 'syncFluentCartCanceledOrder'], 20, 1);
        add_action('fluent_cart/subscription_canceled', [$this, 'syncFluentCartCanceledSubscription'], 20, 1);
        add_action('fluent_cart/subscription_eot', [$this, 'syncFluentCartEndedSubscription'], 20, 1);
        add_action('fluent_cart/subscription_expired_validity', [$this, 'syncFluentCartExpiredSubscription'], 20, 1);
        add_filter('fluent_cart/confirmation_shortcodes', [$this, 'addFluentFormsConfirmationShortcodes'], 20, 2);
        add_filter('fluent_cart/editor_shortcodes', [$this, 'addFluentFormsEmailShortcodes'], 20);
        add_filter('fluent_cart/smartcode_fallback', [$this, 'parseFluentFormsCartSmartCode'], 20, 2);
        add_filter('fluent_cart/customer/order_data', [$this, 'addFluentFormsCustomerOrderData'], 20, 2);
        add_filter('fluent_cart/customer/order_details_section_parts', [$this, 'addFluentFormsCustomerOrderSection'], 20, 2);
        add_filter('fluent_cart/customer_portal/subscription_data', [$this, 'addFluentFormsCustomerSubscriptionData'], 20, 2);
        add_filter('fluent_cart/orders_filter_options', [$this, 'addFluentFormsOrderFilterOptions'], 20);
        add_action('fluent_cart/orders_filter_fluent_forms', [$this, 'filterOrdersByFluentForms'], 10, 2);
        add_filter('fluent_cart/widgets/single_order', [$this, 'addOrderFormWidget'], 10, 2);
        add_filter('fluent_cart/widgets/single_order_page', [$this, 'addOrderFormWidget'], 10, 2);
        add_filter('fluentform/submissions_widgets', [$this, 'addSubmissionOrderWidget'], 10, 3);
        add_action('wp_enqueue_scripts', [$this, 'enqueueAssets']);
        add_action('admin_enqueue_scripts', [$this, 'enqueueAdminAssets']);
        add_action('wp_ajax_fluentform_fluentcart_attach_submission', [$this, 'attachSubmissionToOrder']);
        add_action('wp_ajax_nopriv_fluentform_fluentcart_attach_submission', [$this, 'attachSubmissionToOrder']);
    }

    protected function isFluentCartActive()
    {
        return function_exists('fluentCart') ||
            class_exists('FluentCart\App\App') ||
            defined('FLUENT_CART_VERSION');
    }
}
