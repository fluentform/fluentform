<?php

namespace FluentForm\App\Modules\FluentCart\Concerns;

use FluentCart\App\Models\Order as FluentCartOrder;
use FluentCart\App\Models\OrderMeta as FluentCartOrderMeta;
use FluentForm\App\Models\Form;
use FluentForm\App\Models\Submission;
use FluentForm\Framework\Support\Arr;

trait FluentCartSubmissionContext
{
    protected function getFluentFormContextFromCartData($data)
    {
        $data = (array) $data;
        $order = Arr::get($data, 'order');

        if (!$order && ($subscription = Arr::get($data, 'subscription'))) {
            $order = $this->getFluentCartOrderFromSubscription($subscription);
        }

        return $this->getFluentFormContextFromOrder($order);
    }

    protected function getFluentFormContextFromOrder($order)
    {
        $order = $this->resolveFluentCartOrder($order);

        if (!$order || !method_exists($order, 'getMeta')) {
            return null;
        }

        $submissionId = absint($order->getMeta('fluent_form_submission_id'));
        $formId = absint($order->getMeta('fluent_form_id'));
        $transactionId = absint($order->getMeta('fluent_form_transaction_id'));

        if (!$submissionId || !$formId) {
            return null;
        }

        $submission = Submission::find($submissionId);

        if (!$submission || (int) $submission->form_id !== $formId) {
            return null;
        }

        $form = Form::find($formId);
        $response = json_decode($submission->response, true);

        if (!is_array($response)) {
            $response = [];
        }

        return [
            'order'          => $order,
            'form'           => $form,
            'form_id'        => $formId,
            'submission'     => $submission,
            'submission_id'  => $submissionId,
            'transaction_id' => $transactionId,
            'response'       => $response,
        ];
    }

    protected function resolveFluentCartOrder($order)
    {
        if (is_object($order) && method_exists($order, 'getMeta')) {
            return $order;
        }

        if (is_array($order)) {
            $orderModel = Arr::get($order, 'order');

            if (is_object($orderModel) && method_exists($orderModel, 'getMeta')) {
                return $orderModel;
            }

            $orderId = absint(Arr::get($order, 'order_id') ?: Arr::get($order, 'id'));
            $orderUuid = sanitize_text_field((string) Arr::get($order, 'order_uuid', Arr::get($order, 'uuid')));

            if ($orderId && class_exists(FluentCartOrder::class)) {
                return FluentCartOrder::find($orderId);
            }

            if ($orderUuid && class_exists(FluentCartOrder::class)) {
                return FluentCartOrder::where('uuid', $orderUuid)->first();
            }
        }

        return null;
    }

    protected function getFluentCartOrderFromSubscription($subscription)
    {
        if (!$subscription || !class_exists(FluentCartOrder::class)) {
            return null;
        }

        $order = $this->getFluentCartValue($subscription, 'order');

        if (is_object($order) && method_exists($order, 'getMeta')) {
            return $order;
        }

        $orderId = absint($this->getFluentCartValue($subscription, 'parent_order_id'));

        return $orderId ? FluentCartOrder::find($orderId) : null;
    }

    protected function getFluentCartValue($data, $key, $default = null)
    {
        if (is_array($data)) {
            return Arr::get($data, $key, $default);
        }

        if (is_object($data)) {
            return isset($data->{$key}) ? $data->{$key} : $default;
        }

        return $default;
    }

    protected function getFluentCartOrderIdsByMeta($metaKey, $metaValue = null, $operator = '=')
    {
        if (!class_exists(FluentCartOrderMeta::class)) {
            return [];
        }

        $query = FluentCartOrderMeta::query()->where('meta_key', $metaKey);

        if ($metaValue !== null) {
            $query->where('meta_value', $operator, (string) $metaValue);
        }

        $metas = $query->get();
        $ids = [];

        foreach ($metas as $meta) {
            if (!empty($meta->order_id)) {
                $ids[] = (int) $meta->order_id;
            }
        }

        return array_values(array_unique($ids));
    }
}
