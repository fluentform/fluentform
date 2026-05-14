<?php

namespace FluentForm\App\Modules\FluentCart\Concerns;

use FluentCart\App\Models\Order as FluentCartOrder;
use FluentCart\App\Models\OrderMeta as FluentCartOrderMeta;
use FluentForm\App\Models\Form;
use FluentForm\Framework\Support\Arr;

trait FluentCartWidgets
{

    public function addOrderFormWidget($widgets, $order)
    {
        if (!class_exists(FluentCartOrder::class)) {
            return $widgets;
        }

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
        $currency = sanitize_text_field((string) $order->currency);
        $total = number_format((float) $order->total_amount, 2);
        $formattedTotal = trim($currency . ' ' . $total);

        $rows = [
            __('Order', 'fluentform') => '<a href="' . esc_url($this->getOrderAdminUrl($order->id)) . '" target="_blank" rel="noopener">#' . absint($order->id) . '</a>',
            __('Payment Status', 'fluentform') => esc_html($order->payment_status ?: '-'),
            __('Order Status', 'fluentform') => esc_html($order->status ?: '-'),
            __('Payment Method', 'fluentform') => esc_html($orderTitle ?: '-'),
            __('Total', 'fluentform') => esc_html($formattedTotal ?: '-'),
            __('Created', 'fluentform') => esc_html((string) $order->created_at),
        ];

        $html = '<div class="ff_fluentcart_entry_widget">';

        foreach ($rows as $label => $value) {
            $html .= '<p><strong>' . esc_html($label) . ':</strong> ' . $value . '</p>';
        }

        $html .= '</div>';

        $widgets['fluent_cart'] = [
            'title'   => __('Fluent Cart', 'fluentform'),
            'content' => $html
        ];

        return $widgets;
    }

    protected function findOrderBySubmissionId($submissionId)
    {
        if (!$submissionId || !class_exists(FluentCartOrderMeta::class) || !class_exists(FluentCartOrder::class)) {
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
}
