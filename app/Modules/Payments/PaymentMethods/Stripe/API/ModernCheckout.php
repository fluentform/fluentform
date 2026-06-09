<?php

namespace FluentForm\App\Modules\Payments\PaymentMethods\Stripe\API;

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

/**
 * Modern Stripe Checkout via the raw REST API (no SDK), pinned to the current
 * Stripe-Version. Raw HTTP avoids bundling stripe-php, whose global Stripe\
 * namespace collides with other plugins. Active only when
 * StripeSettings::useModernCheckout() is true.
 */
class ModernCheckout
{
    const ENDPOINT = 'https://api.stripe.com/v1/';

    /**
     * Send a request to the Stripe REST API with a Stripe-Account header for
     * Connect (on-behalf) calls. Nested args are form-encoded by WP.
     *
     * @return object|\WP_Error  json-decoded object, or WP_Error on failure
     */
    public static function request($args, $endpoint, $secretKey, $accountId = null, $method = 'POST')
    {
        $headers = [
            'Authorization'  => 'Basic ' . base64_encode($secretKey . ':'),
            'Stripe-Version' => self::apiVersion(),
            'User-Agent'     => 'Fluent Forms/' . FLUENTFORM_VERSION . ' (' . site_url() . ')',
        ];
        if ($accountId) {
            $headers['Stripe-Account'] = $accountId;
        }
        $headers = apply_filters('fluentform/stripe_modern_request_headers', $headers, $endpoint, $args);

        $response = wp_safe_remote_post(self::ENDPOINT . $endpoint, [
            'method'  => $method,
            'headers' => $headers,
            'body'    => $args,
            'timeout' => 50,
        ]);

        if (is_wp_error($response) || empty($response['body'])) {
            return new \WP_Error('stripe_modern_error', __('There was a problem connecting to the Stripe API endpoint.', 'fluentform'));
        }

        $body = json_decode(wp_remote_retrieve_body($response));

        if (wp_remote_retrieve_response_code($response) > 299) {
            $code = !empty($body->error->code) ? $body->error->code : 'stripe_error';
            $message = !empty($body->error->message) ? $body->error->message : __('Stripe General Error', 'fluentform');
            return new \WP_Error($code, $message, $body);
        }

        return $body;
    }
    /**
     * Convert the legacy line-item shape ({amount, currency, name, quantity}) to
     * the modern Checkout price_data shape.
     *
     * @param array $legacyItems
     * @return array
     */
    public static function toModernLineItems(array $legacyItems)
    {
        $items = [];
        foreach ($legacyItems as $item) {
            $items[] = [
                'price_data' => [
                    'currency'     => $item['currency'],
                    'unit_amount'  => (int) $item['amount'],
                    'product_data' => [
                        'name' => $item['name'],
                    ],
                ],
                'quantity' => isset($item['quantity']) ? (int) $item['quantity'] : 1,
            ];
        }
        return $items;
    }

    /**
     * Assemble modern one-time (mode=payment) Checkout Session args from the
     * shared base args and the converted modern line items.
     *
     * @param array $base        shared args (success_url, cancel_url, metadata, customer_email, payment_intent_data, ...)
     * @param array $modernItems output of toModernLineItems()
     * @return array
     */
    public static function buildOneTimeArgs(array $base, array $modernItems)
    {
        $args = $base;
        $args['mode'] = 'payment';
        // Force Customer creation — the completion handler requires session->customer.
        $args['customer_creation'] = 'always';
        $args['line_items'] = $modernItems;
        return $args;
    }

    /**
     * Assemble modern subscription (mode=subscription) Checkout Session args.
     * Recurring line items must carry price_data.recurring; an optional one-time
     * signup line item may be included in $oneTimeItems.
     *
     * @param array $base
     * @param array $recurringItems modern line_items with price_data.recurring set
     * @param array $oneTimeItems   modern one-time line_items (e.g. signup fee)
     * @param array $subscriptionData subscription_data (trial_period_days, metadata, application_fee_percent)
     * @return array
     */
    public static function buildSubscriptionArgs(array $base, array $recurringItems, array $oneTimeItems = [], array $subscriptionData = [])
    {
        $args = $base;
        $args['mode'] = 'subscription';
        $args['line_items'] = array_merge($recurringItems, $oneTimeItems);
        if ($subscriptionData) {
            $args['subscription_data'] = $subscriptionData;
        }
        // payment_intent_data is invalid in subscription mode.
        unset($args['payment_intent_data'], $args['submit_type']);
        return $args;
    }

    /**
     * Map a recurring line item (modernSubscriptionComponents shape, with inline
     * product_data) to the raw Subscriptions API item shape, which requires a
     * resolved product id instead of inline product_data.
     *
     * @param array  $recurringItem recurringLineItem() output
     * @param string $productId     a resolved/cached Stripe product id
     * @return array
     */
    public static function inlineSubscriptionItem(array $recurringItem, $productId)
    {
        $priceData = $recurringItem['price_data'];
        return [
            'price_data' => [
                'currency'    => $priceData['currency'],
                'unit_amount' => (int) $priceData['unit_amount'],
                'product'     => $productId,
                'recurring'   => $priceData['recurring'],
            ],
            'quantity' => isset($recurringItem['quantity']) ? (int) $recurringItem['quantity'] : 1,
        ];
    }

    /**
     * Map a one-time item (signup fee / one-time order item) to a Subscriptions
     * API `add_invoice_items` entry, so the first invoice charges it alongside
     * the recurring price — matching the hosted Checkout Session, which merges
     * one-time items as line_items. Keeps Stripe's first invoice in sync with the
     * locally recorded amount.
     *
     * @param array  $oneTimeItem toModernLineItems()/signup shape
     * @param string $productId   a resolved/cached Stripe product id
     * @return array
     */
    public static function inlineAddInvoiceItem(array $oneTimeItem, $productId)
    {
        $priceData = $oneTimeItem['price_data'];
        return [
            'price_data' => [
                'currency'    => $priceData['currency'],
                'unit_amount' => (int) $priceData['unit_amount'],
                'product'     => $productId,
            ],
            'quantity' => isset($oneTimeItem['quantity']) ? (int) $oneTimeItem['quantity'] : 1,
        ];
    }

    /**
     * Stable option key for caching a Stripe product id per secret-key + connected
     * account + product name, so inline subscriptions reuse a product instead of
     * creating one per checkout. Scoped by account so a connected account never
     * reuses a platform product (which would 404 under Stripe-Account).
     *
     * @param string      $secretKey
     * @param string|null $accountId
     * @param string      $name
     * @return string
     */
    public static function productCacheKey($secretKey, $accountId, $name)
    {
        $hash = md5($secretKey . '|' . (string) $accountId . '|' . $name);
        return 'ff_stripe_modern_product_' . $hash;
    }

    /**
     * Build a modern recurring line item from a FluentForm subscription row.
     *
     * @param array  $priceData  currency, unit_amount, product name
     * @param string $interval   day|week|month|year
     * @param int    $intervalCount
     * @param int    $quantity
     * @return array
     */
    public static function recurringLineItem(array $priceData, $interval, $intervalCount = 1, $quantity = 1)
    {
        return [
            'price_data' => [
                'currency'     => $priceData['currency'],
                'unit_amount'  => (int) $priceData['unit_amount'],
                'product_data' => ['name' => $priceData['name']],
                'recurring'    => [
                    'interval'       => $interval,
                    'interval_count' => (int) $intervalCount,
                ],
            ],
            'quantity' => (int) $quantity,
        ];
    }

    /**
     * Create a Payment Method Configuration offering only card + Apple/Google Pay.
     * A PMC is required because payment_method_types alone cannot hide Link (and
     * its pay-by-bank option), which Stripe.js injects when Link is enabled.
     *
     * @return object|\WP_Error
     */
    public static function createPaymentMethodConfiguration($secretKey, $accountId = null)
    {
        $config = apply_filters('fluentform/stripe_modern_pmc_config', [
            'name'            => 'Fluent Forms (Card + Wallets)',
            'card'            => ['display_preference' => ['preference' => 'on']],
            'apple_pay'       => ['display_preference' => ['preference' => 'on']],
            'google_pay'      => ['display_preference' => ['preference' => 'on']],
            'link'            => ['display_preference' => ['preference' => 'off']],
            'us_bank_account' => ['display_preference' => ['preference' => 'off']],
        ]);
        return self::request($config, 'payment_method_configurations', $secretKey, $accountId);
    }

    /**
     * Card-only fallback method types when no PMC is available (Apple/Google Pay
     * ride on card; excludes Link and async ACH, which inline cannot confirm).
     *
     * @return array
     */
    public static function inlinePaymentMethodTypes()
    {
        return apply_filters('fluentform/stripe_modern_inline_payment_method_types', ['card']);
    }

    /**
     * Assemble inline PaymentIntent args (amount in the currency's smallest unit).
     *
     * @param array  $base     metadata, description, application_fee_amount, customer, receipt_email
     * @param int    $amount
     * @param string $currency
     * @return array
     */
    public static function buildPaymentIntentArgs(array $base, $amount, $currency)
    {
        $args = $base;
        $args['amount'] = (int) $amount;
        $args['currency'] = $currency;
        return $args;
    }

    /**
     * Create an unconfirmed PaymentIntent (the frontend Payment Element confirms it).
     *
     * @param array       $args
     * @param string      $secretKey
     * @param string|null $accountId
     * @return object|\WP_Error
     */
    public static function createPaymentIntent(array $args, $secretKey, $accountId = null)
    {
        return self::request($args, 'payment_intents', $secretKey, $accountId);
    }

    /**
     * Create a Stripe Customer.
     *
     * @return object|\WP_Error
     */
    public static function createCustomer(array $args, $secretKey, $accountId = null)
    {
        return self::request($args, 'customers', $secretKey, $accountId);
    }

    /**
     * Subscription items need a product id (price_data has no inline product_data).
     *
     * @return object|\WP_Error
     */
    public static function createProduct($name, $secretKey, $accountId = null)
    {
        return self::request(['name' => $name], 'products', $secretKey, $accountId);
    }

    /**
     * Create a default_incomplete Subscription (the Element confirms it).
     *
     * @return object|\WP_Error
     */
    public static function createSubscription(array $args, $secretKey, $accountId = null)
    {
        return self::request($args, 'subscriptions', $secretKey, $accountId);
    }

    /**
     * Create a Checkout Session.
     *
     * @return object|\WP_Error
     */
    public static function createSession(array $args, $secretKey, $accountId = null)
    {
        return self::request($args, 'checkout/sessions', $secretKey, $accountId);
    }

    /**
     * Pinned Stripe API version (filterable for forward upgrades).
     */
    public static function apiVersion()
    {
        return apply_filters('fluentform/stripe_modern_api_version', '2026-05-27.dahlia');
    }
}
