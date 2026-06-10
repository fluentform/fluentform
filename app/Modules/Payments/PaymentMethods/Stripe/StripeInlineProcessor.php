<?php

namespace FluentForm\App\Modules\Payments\PaymentMethods\Stripe;

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Modules\Payments\PaymentHelper;
use FluentForm\Framework\Helpers\ArrayHelper;
use FluentForm\App\Modules\Payments\PaymentMethods\Stripe\API\SCA;
use FluentForm\App\Modules\Payments\PaymentMethods\Stripe\API\ApiRequest;
use FluentForm\App\Modules\Payments\PaymentMethods\Stripe\API\Plan;
use FluentForm\App\Modules\Payments\PaymentMethods\Stripe\API\Invoice;
use FluentForm\App\Modules\Payments\PaymentMethods\Stripe\API\Customer;
use FluentForm\App\Modules\Payments\PaymentMethods\Stripe\API\ModernCheckout;

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

class StripeInlineProcessor extends StripeProcessor
{
    
    public function init()
    {
        /*
         * After form submission this hooks fire to start Making payment
         */
        add_action('fluentform/process_payment_stripe_inline', [$this, 'handlePaymentAction'], 10, 6);

        /*
         * Mainly for single payment items
         */
        add_action('wp_ajax_fluentform_sca_inline_confirm_payment', [$this, 'confirmScaPayment']);
        add_action('wp_ajax_nopriv_fluentform_sca_inline_confirm_payment', [$this, 'confirmScaPayment']);

        /*
         * For Subscription payment + maybe single payment items
         */
        add_action('wp_ajax_fluentform_sca_inline_confirm_payment_setup_intents', array($this, 'confirmScaSetupIntentsPayment'));
        add_action('wp_ajax_nopriv_fluentform_sca_inline_confirm_payment_setup_intents', array($this, 'confirmScaSetupIntentsPayment'));

        add_action('wp_ajax_fluentform_modern_inline_confirm', array($this, 'confirmModernInlinePayment'));
        add_action('wp_ajax_nopriv_fluentform_modern_inline_confirm', array($this, 'confirmModernInlinePayment'));

        add_action('wp_ajax_fluentform_modern_inline_subscription_confirm', array($this, 'confirmModernInlineSubscription'));
        add_action('wp_ajax_nopriv_fluentform_modern_inline_subscription_confirm', array($this, 'confirmModernInlineSubscription'));
    }

    public function handlePaymentAction($submissionId, $submissionData, $form, $methodSettings, $hasSubscriptions, $totalPayable)
    {
        $this->setSubmissionId($submissionId);
        $this->form = $form;
        $submission = $this->getSubmission();
        $paymentTotal = $this->getAmountTotal();
        
        if (!$paymentTotal && !$hasSubscriptions) {
            return false;
        }

        // Create the initial transaction here
        $transaction = $this->createInitialPendingTransaction($submission, $hasSubscriptions);

        if (StripeSettings::useModernCheckout($form->id)) {
            if ($transaction->transaction_type == 'subscription') {
                return $this->handleModernInlineSubscriptionSession($transaction, $submission, $form, $methodSettings);
            }
            return $this->handleModernInlineSession($transaction, $submission, $form, $methodSettings);
        }

        $paymentMethodId = ArrayHelper::get($submissionData['response'], '__stripe_payment_method_id');
        $customerArgs = $this->customerArguments($paymentMethodId, $submission);

        $customer = Customer::createCustomer($customerArgs, $this->form->id);

        if (is_wp_error($customer)) {
            // We have errors
            $this->handlePaymentChargeError($customer->get_error_message(), $submission, $transaction);
        }

        if ($transaction->transaction_type == 'subscription') {
            $this->handleSetupIntent($submission, $paymentMethodId, $customer, $transaction, $totalPayable);
        } else {
            // Let's create the one time payment first
            // We will handle One-Time Payment Here only
            $paymentSettings = PaymentHelper::getFormSettings($form->id, 'admin');
            $intentArgs = [
                'payment_method'              => $paymentMethodId,
                'amount'                      => $transaction->payment_total,
                'currency'                    => $transaction->currency,
                'confirmation_method'          => 'manual',
                'confirm'                      => 'true',
                'description'                 => $this->getProductNames(),
                'statement_descriptor_suffix' => StripeSettings::getPaymentDescriptor($form),
                'metadata'                    => $this->getIntentMetaData($submission, $form, $transaction, $paymentSettings),
                'customer'                    => $customer->id
            ];

            $intentArgs = apply_filters('fluentform/stripe_checkout_args_inline', $intentArgs, $submission, $transaction, $form);

            // If FluentForm Pro is not installed, apply the fee 1.9% of the total amount
            if (!Helper::hasPro()) {
                $applicationFeeAmount = (int) ($totalPayable * 0.019);
                $intentArgs['application_fee_amount'] = $applicationFeeAmount;
            }
            $this->handlePaymentIntent($transaction, $submission, $intentArgs);
        }
    }

    /**
     * Modern inline one-time payment: create an unconfirmed PaymentIntent and
     * return its client_secret for the frontend Payment Element to confirm.
     */
    public function handleModernInlineSession($transaction, $submission, $form, $methodSettings)
    {
        $formSettings = PaymentHelper::getFormSettings($form->id);
        $paymentSettings = PaymentHelper::getFormSettings($form->id, 'admin');

        $secretKey = StripeSettings::getSecretKey($form->id);
        $accountId = $this->getModernConnectedAccountId($form);

        $base = [
            'description'                 => $form->title,
            'statement_descriptor_suffix' => StripeSettings::getPaymentDescriptor($form),
            'metadata'                    => $this->getIntentMetaData($submission, $form, $transaction, $paymentSettings),
        ];

        // Attach a Customer with the form's name/email/address so payer details are recorded.
        $customerArgs = $this->customerArguments('', $submission);
        unset($customerArgs['payment_method'], $customerArgs['invoice_settings']);
        $customer = ModernCheckout::createCustomer($customerArgs, $secretKey, $accountId);
        if (!is_wp_error($customer)) {
            $base['customer'] = $customer->id;
        }

        $receiptEmail = PaymentHelper::getCustomerEmail($submission, $form);
        if ($receiptEmail && ArrayHelper::get($formSettings, 'disable_stripe_payment_receipt') != 'yes') {
            $base['receipt_email'] = $receiptEmail;
        }

        if (!Helper::hasPro() && !StripeSettings::isCustomFormAccount($form->id)) {
            $base['application_fee_amount'] = (int) ($transaction->payment_total * 0.019);
        }

        $pmcId = StripeSettings::getModernPmcId($form->id, $accountId);
        if ($pmcId) {
            $base['payment_method_configuration'] = $pmcId;
        } else {
            $base['payment_method_types'] = ModernCheckout::inlinePaymentMethodTypes();
        }

        $amount = $transaction->payment_total;
        if (PaymentHelper::isZeroDecimal($transaction->currency)) {
            $amount = intval($amount / 100);
        }

        $args = ModernCheckout::buildPaymentIntentArgs($base, $amount, $transaction->currency);
        $args = apply_filters('fluentform/stripe_modern_payment_intent_args', $args, $submission, $transaction, $form);

        $intent = ModernCheckout::createPaymentIntent($args, $secretKey, $accountId);

        if (is_wp_error($intent)) {
            $this->handlePaymentChargeError($intent->get_error_message(), $submission, $transaction, false, 'payment_intent');
        }

        $this->setMetaData('stripe_payment_intent_id', $intent->id);
        // Mark the transaction 'intended' so the finalize endpoint accepts it.
        $this->processScaBeforeVerification($form->id, $submission->id, $transaction->id, $intent->id);

        $nonce = wp_create_nonce('fluentform_sca_confirm_' . $submission->id);

        wp_send_json_success([
            'nextAction'        => 'payment',
            'actionName'        => 'stripeConfirmPaymentElement',
            'client_secret'     => $intent->client_secret,
            'payment_intent_id' => $intent->id,
            'publishable_key'   => StripeSettings::getPublishableKey($form->id),
            'submission_id'     => $submission->id,
            '_ff_stripe_nonce'  => $nonce,
            'message'           => __('Confirming your payment. Please wait...', 'fluentform'),
            'result'            => ['insert_id' => $submission->id]
        ], 200);
    }

    /**
     * Finalize a modern inline payment after the frontend confirms the PaymentIntent.
     */
    public function confirmModernInlinePayment()
    {
        $submissionId = isset($_REQUEST['submission_id']) ? (int) $_REQUEST['submission_id'] : 0;
        $paymentIntentId = isset($_REQUEST['payment_intent_id']) ? sanitize_text_field(wp_unslash($_REQUEST['payment_intent_id'])) : '';

        $this->setSubmissionId($submissionId);
        $submission = $this->getSubmission();
        $this->form = $this->getForm();
        $transaction = $this->getLastTransaction($submissionId);

        $validation = $this->validateScaRequest($submissionId, $paymentIntentId, $submission, $transaction);
        if (is_wp_error($validation)) {
            wp_send_json(['errors' => $validation->get_error_message()], 423);
        }

        // The PaymentIntent was created under the modern connected account (when one
        // is set), so retrieve it with the same Stripe-Account context or it 404s.
        $accountId = $this->getModernConnectedAccountId($this->form);
        $intent = $this->withModernAccountHeader($accountId, function () use ($paymentIntentId, $submission) {
            return SCA::retrievePaymentIntent($paymentIntentId, ['expand' => ['charges']], $submission->form_id);
        });
        if (is_wp_error($intent)) {
            $this->handlePaymentChargeError($intent->get_error_message(), $submission, $transaction, false, 'payment_intent');
        }

        if ($intent->status !== 'succeeded') {
            $this->handlePaymentChargeError(__('We could not verify your payment. Please try again', 'fluentform'), $submission, $transaction, $intent, 'payment_error');
        }

        $charge = $intent->charges->data[0];

        // Verify the confirmed amount matches the recorded order total.
        $confirmedAmount = (int) $intent->amount;
        if (PaymentHelper::isZeroDecimal($transaction->currency)) {
            $confirmedAmount = $confirmedAmount * 100;
        }
        if ($transaction->payment_total && $confirmedAmount != intval($transaction->payment_total)) {
            do_action('fluentform/log_data', [
                'parent_source_id' => $submission->form_id,
                'source_type'      => 'submission_item',
                'source_id'        => $submission->id,
                'component'        => 'Payment',
                'status'           => 'error',
                'title'            => __('Stripe Amount Mismatch', 'fluentform'),
                'description'      => __('Confirmed amount did not match the order total. Payment rejected.', 'fluentform')
            ]);
            wp_send_json(['errors' => __('Payment amount verification failed.', 'fluentform')], 423);
        }

        $this->handlePaymentSuccess($charge, $transaction, $submission);
    }

    /**
     * Subscription payment_settings limited to card + wallets (no Link / bank),
     * via a Payment Method Configuration with a card-only fallback.
     */
    protected function modernInlinePaymentSettings($form)
    {
        $settings = ['save_default_payment_method' => 'on_subscription'];
        $pmcId = StripeSettings::getModernPmcId($form->id, $this->getModernConnectedAccountId($form));
        if ($pmcId) {
            $settings['payment_method_configuration'] = $pmcId;
        } else {
            $settings['payment_method_types'] = ModernCheckout::inlinePaymentMethodTypes();
        }
        return $settings;
    }

    /**
     * Modern inline subscription: create a default_incomplete subscription and
     * return the first invoice's PaymentIntent (or SetupIntent for trials) for
     * the frontend Payment Element to confirm.
     */
    public function handleModernInlineSubscriptionSession($transaction, $submission, $form, $methodSettings)
    {
        $parts = $this->modernSubscriptionComponents($transaction, $submission, $form);
        $secretKey = StripeSettings::getSecretKey($form->id);
        $accountId = $this->getModernConnectedAccountId($form);

        // Element attaches the payment method on confirm; an empty payment_method is rejected.
        $customerArgs = $this->customerArguments('', $submission);
        unset($customerArgs['payment_method'], $customerArgs['invoice_settings']);

        $customer = ModernCheckout::createCustomer($customerArgs, $secretKey, $accountId);
        if (is_wp_error($customer)) {
            $this->handlePaymentChargeError($customer->get_error_message(), $submission, $transaction, false, 'customer');
        }

        // Subscription price_data needs a product id (no inline product_data); the
        // product is cached per plan/account so we don't create one per checkout.
        $items = [];
        foreach ($parts['recurring'] as $recItem) {
            $productId = StripeSettings::getModernProductId($recItem['price_data']['product_data']['name'], $secretKey, $accountId);
            if (is_wp_error($productId)) {
                $this->handlePaymentChargeError($productId->get_error_message(), $submission, $transaction, false, 'payment_intent');
            }
            $items[] = ModernCheckout::inlineSubscriptionItem($recItem, $productId);
        }

        // One-time items (signup fee / one-time order items) ride the first invoice
        // via add_invoice_items so Stripe's first charge matches the recorded amount
        // (the hosted Checkout Session merges them as line_items in subscription mode).
        $addInvoiceItems = [];
        foreach ($parts['oneTime'] as $oneTimeItem) {
            $productId = StripeSettings::getModernProductId($oneTimeItem['price_data']['product_data']['name'], $secretKey, $accountId);
            if (is_wp_error($productId)) {
                $this->handlePaymentChargeError($productId->get_error_message(), $submission, $transaction, false, 'payment_intent');
            }
            $addInvoiceItems[] = ModernCheckout::inlineAddInvoiceItem($oneTimeItem, $productId);
        }

        $localSubscriptions = $this->getSubscriptions();
        $localSubscription = $localSubscriptions ? $localSubscriptions[0] : null;

        $subArgs = [
            'customer'         => $customer->id,
            'items'            => $items,
            'payment_behavior' => 'default_incomplete',
            'payment_settings' => $this->modernInlinePaymentSettings($form),
            'expand'           => ['latest_invoice.confirmation_secret', 'latest_invoice.payment_intent', 'pending_setup_intent'],
            'metadata'         => ArrayHelper::get($parts['subscriptionData'], 'metadata', []),
        ];
        if ($addInvoiceItems) {
            $subArgs['add_invoice_items'] = $addInvoiceItems;
        }
        if (isset($parts['subscriptionData']['trial_period_days'])) {
            $subArgs['trial_period_days'] = $parts['subscriptionData']['trial_period_days'];
        }
        if (isset($parts['subscriptionData']['application_fee_percent'])) {
            $subArgs['application_fee_percent'] = $parts['subscriptionData']['application_fee_percent'];
        }
        // Limited-installment subscriptions (bill_times) must stop billing.
        if ($localSubscription && ($cancelAt = Plan::getCancelledAtTimestamp($localSubscription))) {
            $subArgs['cancel_at'] = $cancelAt;
        }
        $subArgs = apply_filters('fluentform/stripe_modern_subscription_args', $subArgs, $submission, $transaction, $form);

        $subscription = ModernCheckout::createSubscription($subArgs, $secretKey, $accountId);
        if (is_wp_error($subscription)) {
            $this->handlePaymentChargeError($subscription->get_error_message(), $submission, $transaction, false, 'payment_intent');
        }

        // The confirmable secret moved across API versions: confirmation_secret
        // (current) -> payment_intent (older) -> pending_setup_intent ($0 trials).
        $confirmType = 'payment';
        $clientSecret = '';
        $intentId = '';
        $invoice = isset($subscription->latest_invoice) ? $subscription->latest_invoice : null;

        if ($invoice && !empty($invoice->confirmation_secret->client_secret)) {
            $clientSecret = $invoice->confirmation_secret->client_secret;
            $confirmType = (ArrayHelper::get((array) $invoice->confirmation_secret, 'type') === 'setup_intent') ? 'setup' : 'payment';
            $intentId = $this->intentIdFromClientSecret($clientSecret);
        } elseif ($invoice && !empty($invoice->payment_intent->client_secret)) {
            $clientSecret = $invoice->payment_intent->client_secret;
            $intentId = $invoice->payment_intent->id;
        } elseif (!empty($subscription->pending_setup_intent->client_secret)) {
            $confirmType = 'setup';
            $clientSecret = $subscription->pending_setup_intent->client_secret;
            $intentId = $subscription->pending_setup_intent->id;
        } else {
            $this->handlePaymentChargeError(__('Could not initialize the subscription payment. Please try again.', 'fluentform'), $submission, $transaction, false, 'payment_intent');
        }

        if ($localSubscription) {
            $this->updateSubscription($localSubscription->id, ['vendor_subscription_id' => $subscription->id]);
        }

        $this->setMetaData('stripe_payment_intent_id', $intentId);
        $this->setMetaData('stripe_subscription_id', $subscription->id);
        $this->processScaBeforeVerification($form->id, $submission->id, $transaction->id, $intentId);

        $nonce = wp_create_nonce('fluentform_sca_confirm_' . $submission->id);

        wp_send_json_success([
            'nextAction'             => 'payment',
            'actionName'             => 'stripeConfirmPaymentElement',
            'confirm_type'           => $confirmType,
            'finalize_action'        => 'fluentform_modern_inline_subscription_confirm',
            'client_secret'          => $clientSecret,
            'payment_intent_id'      => $intentId,
            'stripe_subscription_id' => $subscription->id,
            'publishable_key'        => StripeSettings::getPublishableKey($form->id),
            'submission_id'          => $submission->id,
            '_ff_stripe_nonce'       => $nonce,
            'message'                => __('Confirming your subscription. Please wait...', 'fluentform'),
            'result'                 => ['insert_id' => $submission->id]
        ], 200);
    }

    /**
     * Extract the intent id from a Stripe client_secret
     * (e.g. "pi_123_secret_abc" -> "pi_123", "seti_123_secret_abc" -> "seti_123").
     */
    protected function intentIdFromClientSecret($clientSecret)
    {
        $pos = strpos($clientSecret, '_secret');
        return $pos !== false ? substr($clientSecret, 0, $pos) : $clientSecret;
    }

    /**
     * Finalize a modern inline subscription after the frontend confirms the first
     * invoice / setup intent.
     */
    public function confirmModernInlineSubscription()
    {
        $submissionId = isset($_REQUEST['submission_id']) ? (int) $_REQUEST['submission_id'] : 0;
        $intentId = isset($_REQUEST['payment_intent_id']) ? sanitize_text_field(wp_unslash($_REQUEST['payment_intent_id'])) : '';

        $this->setSubmissionId($submissionId);
        $submission = $this->getSubmission();
        $this->form = $this->getForm();
        $transaction = $this->getLastTransaction($submissionId);

        $validation = $this->validateScaRequest($submissionId, $intentId, $submission, $transaction);
        if (is_wp_error($validation)) {
            wp_send_json(['errors' => $validation->get_error_message()], 423);
        }

        // Retrieve with the legacy API version (like SCA::retrievePaymentIntent) so
        // latest_invoice.payment_intent is present in the shape the recorder reads.
        $vendorSubscriptionId = $this->getMetaData('stripe_subscription_id');
        ApiRequest::set_secret_key(StripeSettings::getSecretKey($submission->form_id));

        // The subscription was created under the modern connected account (when the
        // fluentform/stripe_modern_connected_account filter supplies one), so the
        // retrieval must carry the same Stripe-Account context or the lookup 404s.
        // The legacy ApiRequest path is kept so latest_invoice.payment_intent stays
        // in the shape the recorder reads.
        $accountId = $this->getModernConnectedAccountId($this->form);
        $subscription = $this->withModernAccountHeader($accountId, function () use ($vendorSubscriptionId) {
            return ApiRequest::request(
                ['expand' => ['latest_invoice.payment_intent']],
                'subscriptions/' . $vendorSubscriptionId
            );
        });

        if (is_wp_error($subscription)) {
            $this->handlePaymentChargeError($subscription->get_error_message(), $submission, $transaction, false, 'payment_intent');
        }

        $invoice = $subscription->latest_invoice;
        $this->handlePaidSubscriptionInvoice($invoice, $submission);
    }

    // This is only for Subscription Payment
    protected function handleSetupIntent($submission, $paymentMethodId, $customer, $transaction, $totalPayable)
    {
        if (is_wp_error($customer)) {
            $this->handlePaymentChargeError($customer->get_error_message(), $submission, $transaction, false, 'customer');
        }

        $subscriptions = $this->getSubscriptions();

        $subscription = $subscriptions[0];

        $subscriptionTransactionArgs = Plan::getPriceIdsFromSubscriptionTransaction($subscription, $transaction);

        if(is_wp_error($subscriptionTransactionArgs)) {
            $this->handlePaymentChargeError($customer->get_error_message(), $submission, $transaction, false, 'customer');
        }

        $subscriptionArgs = [
            'customer'         => $customer->id,
            'metadata'         => $this->getIntentMetaData($submission, $this->getForm(), $transaction),
            'payment_behavior' => 'allow_incomplete',
        ];

        $subscriptionArgs['items'] = $subscriptionTransactionArgs['items'];

        if ($signupFee = $subscriptionTransactionArgs['signup_fee']) {
            Invoice::createItem([
                'amount'      => $signupFee,
                'currency'    => $submission->currency,
                'customer'    => $customer->id,
                /* translators: %s is the plan name */
                'description' => sprintf(__('Signup fee for %s', 'fluentform'), $subscription->plan_name),
            ], $submission->form_id);
        }

        // Maybe we have to set a cancel_at parameter to subscription args
        if ($cancelledAt = Plan::getCancelledAtTimestamp($subscription)) {
            $subscriptionArgs['cancel_at'] = $cancelledAt;
        }

        if ($subscription->trial_days) {
            $dateTime = current_datetime();
            $localtime = $dateTime->getTimestamp() + $dateTime->getOffset();
            $subscriptionArgs['trial_end'] = $localtime + $subscription->trial_days * 86400;
        }

        $subscriptionArgs = apply_filters('fluentform/stripe_subscription_args_inline', $subscriptionArgs, $submission, $transaction, $this->getForm());

        // If FluentForm Pro is not installed, apply the fee 1.9%
        if (!Helper::hasPro()) {
            $subscriptionArgs['application_fee_percent'] = 1.9;
        }

        $subscriptionPayment = Plan::subscribe($subscriptionArgs, $submission->form_id);

        if (is_wp_error($subscriptionPayment)) {
            $this->handlePaymentChargeError($subscriptionPayment->get_error_message(), $submission, $transaction, false, 'subscription');
        }

        $invoice = Invoice::retrieve(
            $subscriptionPayment->latest_invoice,
            $this->form->id,
            [
                'expand' => ['payment_intent.charges']
            ]
        );
        if (is_wp_error($invoice)) {
            $this->handlePaymentChargeError($invoice->get_error_message(), $submission, $transaction, false, 'invoice');
        }

        if (
            $invoice->payment_intent &&
            $invoice->payment_intent->status == 'requires_action' &&
            $invoice->payment_intent->next_action->type == 'use_stripe_sdk'
        ) {
            $transactionId = false;
            if ($transaction) {
                $transactionId = $transaction->id;
            }
            $this->processScaBeforeVerification($submission->form_id, $submission->id, $transactionId, $invoice->payment_intent->id);

            $nonceAction = 'fluentform_sca_confirm_' . $submission->id;
            $nonce = wp_create_nonce($nonceAction);
            
            wp_send_json_success([
                'nextAction'             => 'payment',
                'actionName'             => 'stripeSetupIntent',
                'stripe_subscription_id' => $subscriptionPayment->id,
                'payment_method_id'      => $paymentMethodId,
                'intent'                 => $invoice->payment_intent,
                'submission_id'          => $submission->id,
                'customer_name'          => ($transaction) ? $transaction->payer_name : '',
                'customer_email'         => ($transaction) ? $transaction->payer_email : '',
                'client_secret'          => $invoice->payment_intent->client_secret,
                '_ff_stripe_nonce'       => $nonce,
                'message'                => __('Verifying your card details. Please wait...', 'fluentform'),
                'result'                 => [
                    'insert_id' => $submission->id
                ]
            ], 200);
        }

        // now this payment is successful. We don't need anything else
        $this->handlePaidSubscriptionInvoice($invoice, $submission);
    }

    protected function customerArguments($paymentMethodId, $submission)
    {
        $customerArgs = [
            'payment_method'   => $paymentMethodId,
            'invoice_settings' => [
                'default_payment_method' => $paymentMethodId
            ],
            'metadata'         => [
                'submission_id' => $submission->id,
                'form_id'       => $submission->form_id,
                'form_name'     => wp_strip_all_tags($this->form->title)
            ]
        ];

        $receiptEmail = PaymentHelper::getCustomerEmail($submission, $this->form);

        if ($receiptEmail) {
            $customerArgs['email'] = $receiptEmail;
        }

        $receiptName = PaymentHelper::getCustomerName($submission, $this->form);

        if ($receiptName) {
            $customerArgs['name'] = $receiptName;
            $customerArgs['description'] = $receiptName;
        }

		$address = PaymentHelper::getCustomerAddress($submission);
		if ($address) {
			$customerArgs['address'] = [
				'city'        => ArrayHelper::get($address, 'city'),
				'country'     => ArrayHelper::get($address, 'country'),
				'line1'       => ArrayHelper::get($address, 'address_line_1'),
				'line2'       => ArrayHelper::get($address, 'address_line_2'),
				'postal_code' => ArrayHelper::get($address, 'zip'),
				'state'       => ArrayHelper::get($address, 'state'),
			];
		}

        return $customerArgs;
    }

    protected function handlePaidSubscriptionInvoice($invoice, $submission)
    {
        if ($invoice->status !== 'paid') {
            wp_send_json([
                'errors' => __('Stripe Error: Payment Failed! Please try again.', 'fluentform')
            ], 423);
        }

        // Submission status as paid
        $this->changeSubmissionPaymentStatus('paid');

        $subscriptions = $this->getSubscriptions();

        $this->processSubscriptionSuccess($subscriptions, $invoice, $submission);

        $transaction = $this->getLastTransaction($submission->id);

        $paymentStatus = $this->getIntentSuccessName($invoice->payment_intent);
        // A $0 trial invoice is 'paid' but has no payment_intent; treat it as paid
        // so the status is not blanked.
        if (!$paymentStatus && $invoice->status === 'paid') {
            $paymentStatus = 'paid';
        }
        $this->processOnetimeSuccess($invoice, $transaction, $paymentStatus);

        $this->recalculatePaidTotal();

        $this->sendSuccess($submission);
    }

    protected function handlePaymentIntent($transaction, $submission, $intentArgs)
    {
        $formSettings = PaymentHelper::getFormSettings($submission->form_id);

        if (PaymentHelper::isZeroDecimal($transaction->currency)) {
            $intentArgs['amount'] = intval($transaction->payment_total / 100);
        }

        $receiptEmail = PaymentHelper::getCustomerEmail($submission, $this->form);

        if ($receiptEmail && ArrayHelper::get($formSettings, 'disable_stripe_payment_receipt') != 'yes') {
            $intentArgs['receipt_email'] = $receiptEmail;
        }

        $intent = SCA::createPaymentIntent($intentArgs, $this->form->id);

        if (is_wp_error($intent)) {
            $this->handlePaymentChargeError($intent->get_error_message(), $submission, $transaction, false, 'payment_intent');
        }

        if (
            $intent->status == 'requires_action' &&
            $intent->next_action &&
            $intent->next_action->type == 'use_stripe_sdk'
        ) {
            $this->processScaBeforeVerification($submission->form_id, $submission->id, $transaction->id, $intent->id);

            // Generate nonce for secure SCA confirmation
            $nonceAction = 'fluentform_sca_confirm_' . $submission->id;
            $nonce = wp_create_nonce($nonceAction);
            
            # Tell the client to handle the action
            wp_send_json_success([
                'nextAction'    => 'payment',
                'actionName'    => 'initStripeSCAModal',
                'submission_id' => $submission->id,
                'client_secret' => $intent->client_secret,
                '_ff_stripe_nonce' => $nonce,
                'message'       => apply_filters('fluentform/stripe_strong_customer_verify_waiting_message', __('Verifying strong customer authentication. Please wait...', 'fluentform')),
                'result'        => [
                    'insert_id' => $submission->id
                ]
            ], 200);

        } else if ($intent->status == 'succeeded') {
            // Payment is succeeded here
            $charge = $intent->charges->data[0];

            $this->handlePaymentSuccess($charge, $transaction, $submission);
        } else {
            $message = __('Payment Failed! Your card may have been declined.', 'fluentform');

            if (!empty($intent->error->message)) {
                $message = $intent->error->message;
            }

            $this->handlePaymentChargeError($message, $submission, $transaction, false, 'payment_intent');
        }
    }

    protected function handlePaymentSuccess($charge, $transaction, $submission)
    {
        $transactionData = [
            'charge_id'      => $charge->payment_intent,
            'payment_method' => 'stripe',
            'payment_mode'   => $this->getPaymentMode(),
            'payment_note'   => maybe_serialize($charge)
        ];

        $methodDetails = $charge->payment_method_details;
        if ($methodDetails && !empty($methodDetails->card)) {
            $transactionData['card_brand'] = $methodDetails->card->brand;
            $transactionData['card_last_4'] = $methodDetails->card->last4;
        }

        $this->updateTransaction($transaction->id, $transactionData);

        $this->changeTransactionStatus($transaction->id, 'paid');

        $logData = [
            'parent_source_id' => $submission->form_id,
            'source_type'      => 'submission_item',
            'source_id'        => $submission->id,
            'component'        => 'Payment',
            'status'           => 'info',
            'title'            => __('Payment Status changed', 'fluentform'),
            'description'      => __('Payment status changed to paid', 'fluentform')
        ];

        do_action('fluentform/log_data', $logData);

        $this->updateSubmission($submission->id, [
            'payment_status' => 'paid',
            'payment_method' => 'stripe',
        ]);

        $logData = [
            'parent_source_id' => $submission->form_id,
            'source_type'      => 'submission_item',
            'source_id'        => $submission->id,
            'component'        => 'Payment',
            'status'           => 'success',
            'title'            => __('Payment Complete', 'fluentform'),
            'description'      => __('One time Payment Successfully made via Stripe. Charge ID: ', 'fluentform') . $charge->id
        ];

        do_action('fluentform/log_data', $logData);

        $this->recalculatePaidTotal();

        $this->sendSuccess($submission);
    }

    /**
     * Validate SCA payment confirmation request
     *
     * @param int $submissionId Submission ID
     * @param string $paymentIntentId Payment Intent ID
     * @param object|null $submission Submission object
     * @param object|null $transaction Transaction object
     * @return array|WP_Error Array with validation result or WP_Error on strict mode failure
     */
    protected function validateScaRequest($submissionId, $paymentIntentId, $submission = null, $transaction = null)
    {
        $warnings = [];

        // Validate nonce — always required by default.
        // Filter allows opt-out only for backward compat; emits deprecation notice.
        $nonce = isset($_REQUEST['_ff_stripe_nonce']) ? sanitize_text_field(wp_unslash($_REQUEST['_ff_stripe_nonce'])) : '';

        if ($nonce) {
            $nonceAction = 'fluentform_sca_confirm_' . $submissionId;
            if (!wp_verify_nonce($nonce, $nonceAction)) {
                return new \WP_Error('invalid_nonce', __('Security verification failed. Invalid nonce.', 'fluentform'));
            }
        } else {
            $strictMode = apply_filters('fluentform/stripe_sca_strict_security', true);
            if ($strictMode) {
                return new \WP_Error('missing_nonce', __('Security verification failed. Nonce required.', 'fluentform'));
            }
            _deprecated_argument(
                'fluentform/stripe_sca_strict_security',
                '6.2.0',
                esc_html(__('Disabling strict SCA nonce verification is deprecated and will be removed in a future version.', 'fluentform'))
            );
            $warnings[] = 'No nonce provided for SCA payment confirmation';
        }

        // Validate submission exists
        if (!$submission || !$submission->id) {
            return new \WP_Error('invalid_submission', __('Invalid submission.', 'fluentform'));
        }


        if ($submission->payment_status === 'paid') {
            return new \WP_Error(
                'already_paid',
                __('This payment has already been completed and cannot be modified.', 'fluentform')
            );
        }

        // Transaction must exist and be in 'intended' status (set by processScaBeforeVerification
        // when the SCA flow starts). A 'pending' transaction means SCA was never initiated,
        // 'paid'/'failed' means it's already been processed.
        if (!$transaction) {
            return new \WP_Error('no_transaction', __('No transaction found for this submission.', 'fluentform'));
        }

        if ($transaction->status !== 'intended') {
            return new \WP_Error(
                'invalid_transaction_status',
                __('This transaction is not awaiting payment confirmation.', 'fluentform')
            );
        }

        // Verify the payment intent ID matches what was stored during SCA initiation.
        // processScaBeforeVerification() stores the intent as charge_id.
        if ($transaction->charge_id && $transaction->charge_id !== $paymentIntentId) {
            return new \WP_Error(
                'payment_intent_mismatch',
                __('Payment verification failed. Payment intent does not match.', 'fluentform')
            );
        }

        // Log warnings for monitoring
        if (!empty($warnings) && defined('WP_DEBUG') && WP_DEBUG) {
            $logData = [
                'parent_source_id' => $submission->form_id,
                'source_type'      => 'submission_item',
                'source_id'        => $submission->id,
                'component'        => 'Payment',
                'status'           => 'warning',
                'title'            => __('Stripe SCA Security Warning', 'fluentform'),
                'description'      => implode('; ', $warnings)
            ];
            do_action('fluentform/log_data', $logData);
        }

        return [
            'valid'    => true,
            'warnings' => $warnings
        ];
    }

    public function confirmScaPayment()
    {
        $submissionId = isset($_REQUEST['submission_id']) ? (int)$_REQUEST['submission_id'] : 0;
        $paymentMethod = isset($_REQUEST['payment_method']) ? sanitize_text_field(wp_unslash($_REQUEST['payment_method'])) : '';
        $paymentIntentId = isset($_REQUEST['payment_intent_id']) ? sanitize_text_field(wp_unslash($_REQUEST['payment_intent_id'])) : '';

        $this->setSubmissionId($submissionId);
        $submission = $this->getSubmission();
        $this->form = $this->getForm();

        $transaction = $this->getLastTransaction($submissionId);

        $validation = $this->validateScaRequest($submissionId, $paymentIntentId, $submission, $transaction);

        if (is_wp_error($validation)) {
            wp_send_json([
                'errors' => $validation->get_error_message()
            ], 423);
        }

        // Use submission's form_id rather than trusting $_REQUEST
        $formId = $submission->form_id;

        $confirmation = SCA::confirmPayment($paymentIntentId, [
            'payment_method' => $paymentMethod
        ], $formId);

        if (is_wp_error($confirmation)) {
            $message = 'Payment has been failed. ' . $confirmation->get_error_message();
            $this->handlePaymentChargeError($message, $submission, $transaction, $confirmation, 'payment_error');
        }

        if ($confirmation->status == 'succeeded') {
            $charge = $confirmation->charges->data[0];

            // Verify the confirmed amount matches the transaction amount.
            // Normalize for zero-decimal currencies: FluentForm stores amounts x100 internally,
            // but Stripe returns amounts in the currency's smallest unit (e.g. yen for JPY).
            $confirmedAmount = (int) $confirmation->amount;
            if (PaymentHelper::isZeroDecimal($transaction->currency)) {
                $confirmedAmount = $confirmedAmount * 100;
            }
            if ($transaction->payment_total && $confirmedAmount != intval($transaction->payment_total)) {
                $logData = [
                    'parent_source_id' => $submission->form_id,
                    'source_type'      => 'submission_item',
                    'source_id'        => $submission->id,
                    'component'        => 'Payment',
                    'status'           => 'error',
                    'title'            => __('Stripe Amount Mismatch', 'fluentform'),
                    'description'      => sprintf(
                        // translators: %1$d is the expected amount, %2$d is the confirmed amount
                        __('Expected %1$d but Stripe confirmed %2$d. Payment rejected.', 'fluentform'),
                        intval($transaction->payment_total),
                        intval($confirmation->amount)
                    )
                ];
                do_action('fluentform/log_data', $logData);

                wp_send_json([
                    'errors' => __('Payment amount verification failed.', 'fluentform')
                ], 423);
            }

            $this->handlePaymentSuccess($charge, $transaction, $submission);
        } else {
            $this->handlePaymentChargeError('We could not verify your payment. Please try again', $submission, $transaction, $confirmation, 'payment_error');
        }
    }

    public function confirmScaSetupIntentsPayment()
    {
        $submissionId = isset($_REQUEST['submission_id']) ? intval($_REQUEST['submission_id']) : 0;
        $intentId = isset($_REQUEST['payment_intent_id']) ? sanitize_text_field(wp_unslash($_REQUEST['payment_intent_id'])) : '';

        $this->setSubmissionId($submissionId);
        $this->form = $this->getForm();

        $submission = $this->getSubmission();
        $transaction = $this->getLastTransaction($submissionId);

        // Validate the request
        $validation = $this->validateScaRequest($submissionId, $intentId, $submission, $transaction);

        if (is_wp_error($validation)) {
            wp_send_json([
                'errors' => $validation->get_error_message()
            ], 423);
        }

        // Use submission's form_id rather than trusting $_REQUEST
        $formId = $submission->form_id;

        // Let's retrieve the intent
        $intent = SCA::retrievePaymentIntent($intentId, [
            'expand' => [
                'invoice.payment_intent'
            ]
        ], $formId);

        if (is_wp_error($intent)) {
            $this->handlePaymentChargeError($intent->get_error_message(), $submission, false, false, 'payment_intent');
        }

        $invoice = $intent->invoice;

        $this->handlePaidSubscriptionInvoice($invoice, $submission);
    }

    protected function sendSuccess($submission)
    {
        try {
            $returnData = $this->getReturnData();
            wp_send_json_success($returnData, 200);
    
        } catch (\Exception $e) {
            wp_send_json([
                'errors' => $e->getMessage()
            ], 423);
        }
      
    }

    protected function processScaBeforeVerification($formId, $submissionId, $transactionId, $chargeId)
    {
        if ($transactionId) {
            $this->updateTransaction($transactionId, [
                'charge_id'    => $chargeId,
                'payment_mode' => $this->getPaymentMode()
            ]);

            $this->changeTransactionStatus($transactionId, 'intended');
        }

        $logData = [
            'parent_source_id' => $formId,
            'source_type'      => 'submission_item',
            'source_id'        => $submissionId,
            'component'        => 'Payment',
            'status'           => 'info',
            'title'            => __('Stripe SCA Required', 'fluentform'),
            'description'      => __('SCA is required for this payment. Requested SCA info from customer', 'fluentform')
        ];

        do_action('fluentform/log_data', $logData);
    }
    
    /**
     * Products name comma separated
     * @return string
     */
    public function getProductNames()
    {
        $orderItems = $this->getOrderItems();
        $itemsHtml = '';
        foreach ($orderItems as $item) {
            $itemsHtml != "" && $itemsHtml .= ", ";
            $itemsHtml .=  $item->item_name ;
        }
        
        return $itemsHtml;
    }
    
}
