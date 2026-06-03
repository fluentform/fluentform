<?php

namespace FluentForm\App\Modules\FluentCart\Concerns;

use FluentForm\App\Models\Submission;
use FluentForm\App\Models\Subscription;
use FluentForm\App\Models\Transaction;
use FluentForm\Framework\Support\Arr;

trait FluentCartLifecycleSync
{
    public function syncFluentCartRefund($data)
    {
        $context = $this->getFluentFormContextFromCartData($data);

        if (!$context) {
            return;
        }

        $submission = $context['submission'];
        $transaction = $context['transaction_id'] ? Transaction::find($context['transaction_id']) : Transaction::bySubmission($submission->id)->orderBy('id', 'DESC')->first();

        if (!$transaction) {
            return;
        }

        $order = Arr::get((array) $data, 'order');
        $refundTransaction = Arr::get((array) $data, 'transaction');
        $refundAmount = absint(Arr::get((array) $data, 'refunded_amount'));

        if (!$refundAmount && $refundTransaction) {
            $refundAmount = absint($this->getFluentCartValue($refundTransaction, 'total'));
        }

        if (!$refundAmount && $order) {
            $refundAmount = absint($this->getFluentCartValue($order, 'total_refund'));
        }

        if (!$refundAmount) {
            return;
        }

        $totalRefunded = $order ? absint($this->getFluentCartValue($order, 'total_refund')) : 0;
        $totalRefunded = max($refundAmount, $totalRefunded);

        $refundId = sanitize_text_field((string) ($this->getFluentCartValue($refundTransaction, 'uuid') ?: $this->getFluentCartValue($refundTransaction, 'id')));
        $processor = $this->makeFluentCartBaseProcessor();
        $processor->updateRefund($totalRefunded, $transaction, $submission, 'fluent_cart', $refundId, __('Refunded from Fluent Cart', 'fluentform'));
    }

    public function syncFluentCartCanceledOrder($data)
    {
        $this->syncFluentCartPaymentStatus($data, 'cancelled');
    }

    public function syncFluentCartCanceledSubscription($data)
    {
        $this->syncFluentCartSubscriptionStatus($data, 'cancelled');
    }

    public function syncFluentCartEndedSubscription($data)
    {
        $this->syncFluentCartSubscriptionStatus($data, 'cancelled');
    }

    public function syncFluentCartExpiredSubscription($data)
    {
        $this->syncFluentCartSubscriptionStatus($data, 'expired');
    }

    protected function syncFluentCartPaymentStatus($data, $status)
    {
        $context = $this->getFluentFormContextFromCartData($data);

        if (!$context) {
            return;
        }

        Submission::where('id', $context['submission_id'])->update([
            'payment_status' => $status,
            'updated_at'     => current_time('mysql'),
        ]);

        $transaction = $context['transaction_id'] ? Transaction::find($context['transaction_id']) : Transaction::bySubmission($context['submission_id'])->orderBy('id', 'DESC')->first();

        if ($transaction) {
            Transaction::where('id', $transaction->id)->update([
                'status'     => $status,
                'updated_at' => current_time('mysql'),
            ]);
        }
    }

    protected function syncFluentCartSubscriptionStatus($data, $status)
    {
        $context = $this->getFluentFormContextFromCartData($data);

        if (!$context) {
            return;
        }

        $subscription = Arr::get((array) $data, 'subscription');
        $this->ensureFluentFormsSubscriptionForFluentCart($context, $subscription);

        $vendorSubscriptionId = sanitize_text_field((string) $this->getFluentCartValue($subscription, 'vendor_subscription_id'));
        $updateData = [
            'status'     => $status,
            'updated_at' => current_time('mysql'),
        ];

        if ($vendorSubscriptionId) {
            $updateData['vendor_subscription_id'] = $vendorSubscriptionId;
        }

        Subscription::bySubmission($context['submission_id'])->update($updateData);
        $this->syncFluentCartPaymentStatus($data, $status);
    }

    protected function ensureFluentFormsSubscriptionForFluentCart($context, $fluentCartSubscription)
    {
        if (!$context || !$fluentCartSubscription || Subscription::bySubmission($context['submission_id'])->first()) {
            return;
        }

        Subscription::create([
            'form_id'                => $context['form_id'],
            'submission_id'          => $context['submission_id'],
            'payment_total'          => absint($this->getFluentCartValue($fluentCartSubscription, 'recurring_total')),
            'item_name'              => sanitize_text_field((string) $this->getFluentCartValue($fluentCartSubscription, 'item_name')),
            'plan_name'              => sanitize_text_field((string) $this->getFluentCartValue($fluentCartSubscription, 'item_name')),
            'billing_interval'       => sanitize_text_field((string) $this->getFluentCartValue($fluentCartSubscription, 'billing_interval', 'month')),
            'trial_days'             => absint($this->getFluentCartValue($fluentCartSubscription, 'trial_days')),
            'initial_amount'         => absint($this->getFluentCartValue($fluentCartSubscription, 'signup_fee')),
            'quantity'               => absint($this->getFluentCartValue($fluentCartSubscription, 'quantity', 1)) ?: 1,
            'recurring_amount'       => absint($this->getFluentCartValue($fluentCartSubscription, 'recurring_amount')),
            'bill_times'             => absint($this->getFluentCartValue($fluentCartSubscription, 'bill_times')),
            'bill_count'             => absint($this->getFluentCartValue($fluentCartSubscription, 'bill_count')),
            'vendor_customer_id'     => sanitize_text_field((string) $this->getFluentCartValue($fluentCartSubscription, 'vendor_customer_id')),
            'vendor_subscription_id' => sanitize_text_field((string) $this->getFluentCartValue($fluentCartSubscription, 'vendor_subscription_id')),
            'vendor_plan_id'         => sanitize_text_field((string) $this->getFluentCartValue($fluentCartSubscription, 'vendor_plan_id')),
            'status'                 => sanitize_text_field((string) $this->getFluentCartValue($fluentCartSubscription, 'status', 'pending')),
            'vendor_response'        => maybe_serialize($this->getFluentCartValue($fluentCartSubscription, 'vendor_response', [])),
            'expiration_at'          => $this->getFluentCartValue($fluentCartSubscription, 'expire_at') ?: null,
            'created_at'             => current_time('mysql'),
            'updated_at'             => current_time('mysql'),
        ]);
    }
}
