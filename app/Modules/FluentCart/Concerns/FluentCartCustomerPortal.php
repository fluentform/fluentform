<?php

namespace FluentForm\App\Modules\FluentCart\Concerns;

trait FluentCartCustomerPortal
{
    public function addFluentFormsCustomerOrderData($orderData, $context)
    {
        $formContext = $this->getFluentFormContextFromOrder($context['order'] ?? null);

        if (!$formContext) {
            return $orderData;
        }

        $orderData['fluent_forms'] = $this->getCustomerPortalFluentFormsData($formContext);

        return $orderData;
    }

    public function addFluentFormsCustomerOrderSection($sections, $context)
    {
        $formContext = $this->getFluentFormContextFromOrder($context['order'] ?? null);

        if (!$formContext) {
            return $sections;
        }

        $sections['after_summary'] .= $this->renderCustomerPortalFluentFormsSection($formContext);

        return $sections;
    }

    public function addFluentFormsCustomerSubscriptionData($subscriptionData, $context)
    {
        $order = $this->getFluentCartOrderFromSubscription($context['subscription'] ?? null);
        $formContext = $this->getFluentFormContextFromOrder($order);

        if (!$formContext) {
            return $subscriptionData;
        }

        $subscriptionData['fluent_forms'] = $this->getCustomerPortalFluentFormsData($formContext);

        return $subscriptionData;
    }

    protected function getCustomerPortalFluentFormsData($context)
    {
        return [
            'entry_id'       => $context['submission_id'],
            'form_id'        => $context['form_id'],
            'form_title'     => $context['form'] ? (string) $context['form']->title : '',
            'entry_status'   => (string) $context['submission']->status,
            'payment_status' => (string) $context['submission']->payment_status,
            'uploads'        => $this->extractFluentFormUploadUrls($context['response']),
        ];
    }

    protected function renderCustomerPortalFluentFormsSection($context)
    {
        $data = $this->getCustomerPortalFluentFormsData($context);
        $html = '<div class="fct-fluent-forms-entry"><h3>' . esc_html__('Form Submission', 'fluentform') . '</h3>';
        $html .= '<p><strong>' . esc_html__('Form', 'fluentform') . ':</strong> ' . esc_html($data['form_title'] ?: ('#' . $data['form_id'])) . '</p>';
        $html .= '<p><strong>' . esc_html__('Entry ID', 'fluentform') . ':</strong> #' . absint($data['entry_id']) . '</p>';
        $html .= '<p><strong>' . esc_html__('Entry Status', 'fluentform') . ':</strong> ' . esc_html($data['entry_status']) . '</p>';
        $html .= '<p><strong>' . esc_html__('Payment Status', 'fluentform') . ':</strong> ' . esc_html($data['payment_status']) . '</p>';

        if (!empty($data['uploads'])) {
            $html .= '<p><strong>' . esc_html__('Uploaded Files', 'fluentform') . ':</strong><br />' . wp_kses_post($this->formatFluentFormUploadUrls($data['uploads'])) . '</p>';
        }

        return $html . '</div>';
    }
}
