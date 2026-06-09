<?php

namespace FluentForm\App\Modules\Payments\PaymentMethods\Stripe\Components;

use FluentForm\Framework\Helpers\ArrayHelper;
use FluentForm\App\Services\FormBuilder\BaseFieldManager;
use FluentForm\App\Modules\Payments\PaymentMethods\Stripe\StripeSettings;

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

class StripeInline extends BaseFieldManager
{
    /**
     * This is not a standalone editor components
     * rather just a frontend rendering.
     */
    public function __construct()
    {
        parent::__construct(
            'stripe_inline',
            'Inline Stripe Payment Method',
            ['payment methods', 'payment', 'methods', 'stripe', 'stripe inline'],
            'payments'
        );

        add_filter('fluentform/payment_method_contents_stripe', array($this, 'maybePushPaymentInputs'), 10, 4);
    }

    public function maybePushPaymentInputs($inlineContents, $method, $data, $form)
    {
        if (ArrayHelper::get($method, 'settings.embedded_checkout.value') !== 'yes') {
            return $inlineContents;
        }

        // Modern flow renders the Stripe Payment Element inline (not the Card Element).
        if (StripeSettings::useModernCheckout($form->id)) {
            add_filter('fluentform/form_class', function ($classes, $targetForm) use ($form) {
                if ($form->instance_index == $targetForm->instance_index) {
                    $classes .= ' ff_has_stripe_modern_inline';
                }
                return $classes;
            }, 10, 2);

            $elementId = $data['attributes']['name'] . '_' . $form->id . '_' . $form->instance_index . '_stripe_payment_element';
            $label = ArrayHelper::get($method, 'settings.option_label.value', __('Pay with Card', 'fluentform'));
            $display = $method['is_default'] ? 'block' : 'none';

            // Passed to the frontend so the Element shows the same methods as the PMC.
            $pmcId = StripeSettings::getModernPmcId($form->id);
            $pmcAttr = $pmcId ? ' data-ff_stripe_pmc="' . esc_attr($pmcId) . '"' : '';

            $markup = '<div class="ff_stripe_payment_element_wrapper ff_pay_inline ff_pay_inline_stripe"' . $pmcAttr . ' style="display: ' . $display . '">';
            $markup .= '<div class="ff-el-input--label"><label>' . esc_html($label) . '</label></div>';
            $markup .= '<div id="' . esc_attr($elementId) . '" class="ff_stripe_payment_element"></div>';
            $markup .= '<div class="ff_card-errors text-danger" role="alert"></div>';
            if (!StripeSettings::isLive($form->id)) {
                $markup .= '<span style="margin-top: 5px;padding: 0;font-style: italic;font-size: 12px">' . esc_html__('Stripe test mode activated', 'fluentform') . '</span>';
            }
            $markup .= '</div>';

            return $inlineContents . $markup;
        }

        add_filter('fluentform/form_class', function ($classes, $targetForm) use ($form) {
            if ($form->instance_index == $targetForm->instance_index) {
                $classes .= ' ff_has_stripe_inline';
            }

            return $classes;
        }, 10, 2);

        $elementId = $data['attributes']['name'] . '_' . $form->id . '_' . $form->instance_index . '_stripe_inline';
        $label = ArrayHelper::get($method, 'settings.option_label.value', __('Pay with Stripe', 'fluentform'));
        $display = $method['is_default'] ? 'block' : 'none';

        $markup = '<div class="stripe-inline-wrapper ff_pay_inline ff_pay_inline_stripe" style="display: ' . $display . '">';
        $markup .= '<div class="ff-el-input--label">';
        $markup .= '<label for="' . $elementId . '">' . $label . '</label>';
        $markup .= '</div>';

        $attributes = [
            'name'                    => 'stripe_card_element',
            'class'                   => 'ff_stripe_card_element ff-el-form-control',
            'data-wpf_payment_method' => 'stripe',
            'id'                      => $elementId,
            'data-checkout_style'     => 'embedded_form',
            'data-verify_zip'         => ArrayHelper::get($method, 'settings.verify_zip.value') === 'yes'
        ];

        $markup .= '<div ' . $this->buildAttributes($attributes) . '></div>';
        $markup .= '<div class="ff_card-errors text-danger" role="alert"></div>';

        if (!StripeSettings::isLive($form->id)) {
            $stripeTestModeMessage = __('Stripe test mode activated', 'fluentform');
            $markup .= '<span style="margin-top: 5px;padding: 0;font-style: italic;font-size: 12px">' . $stripeTestModeMessage . '</span>';
        }

        $markup .= '</div>';

        return $inlineContents . $markup;
    }


    /**
     * We don't need to return anything from here
     */
    function getComponent()
    {
    }

    /**
     * We don't need to return anything from here
     */
    function render($element, $form)
    {
    }
}
