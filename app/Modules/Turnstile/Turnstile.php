<?php

namespace FluentForm\App\Modules\Turnstile;

use FluentForm\Framework\Helpers\ArrayHelper;

class Turnstile
{
    /**
     * Error codes that indicate the captcha determined the submission is spam/bot.
     * These are client-controlled (token) errors — must always block.
     */
    private static $spamErrorCodes = [
        'missing-input-response',
        'invalid-input-response',
        'timeout-or-duplicate',
    ];

    /**
     * Error codes that indicate server-side configuration issues.
     * These are admin-controlled — safe to allow submission through.
     */
    private static $configErrorCodes = [
        'missing-input-secret',
        'invalid-input-secret',
        'bad-request',
    ];

    /**
     * Transient error codes from Cloudflare (service-side issues).
     */
    private static $transientErrorCodes = [
        'internal-error',
    ];

    /**
     * Verify turnstile response.
     *
     * @param string $token  response from the user.
     * @param null   $secret provided or already stored secret key.
     *
     * @return bool
     */
    public static function validate($token, $secret)
    {
        $result = static::verify($token, $secret);
        return 'valid' === $result['status'];
    }

    /**
     * Verify turnstile response with detailed result.
     *
     * @param string $token
     * @param string $secret
     * @return array{status: string, error_codes: array, message: string}
     *   status: 'valid' | 'spam' | 'config_error' | 'network_error'
     */
    public static function verify($token, $secret)
    {
        $verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

        $response = wp_remote_post($verifyUrl, [
            'method' => 'POST',
            'body'   => [
                'secret'   => $secret,
                'response' => $token,
            ],
        ]);

        if (is_wp_error($response)) {
            return [
                'status'      => 'network_error',
                'error_codes' => ['wp_error'],
                'message'     => $response->get_error_message(),
            ];
        }

        $statusCode = wp_remote_retrieve_response_code($response);
        if ($statusCode < 200 || $statusCode >= 300) {
            return [
                'status'      => 'network_error',
                'error_codes' => ['http_' . $statusCode],
                'message'     => sprintf(
                    __('Turnstile service returned HTTP %d.', 'fluentform'),
                    $statusCode
                ),
            ];
        }

        $result = json_decode(wp_remote_retrieve_body($response));

        if (! $result || ! isset($result->success)) {
            return [
                'status'      => 'network_error',
                'error_codes' => ['invalid_response'],
                'message'     => __('Invalid response from Turnstile service.', 'fluentform'),
            ];
        }

        if ($result->success) {
            return [
                'status'      => 'valid',
                'error_codes' => [],
                'message'     => '',
            ];
        }

        $errorCodes = isset($result->{'error-codes'}) ? (array) $result->{'error-codes'} : [];

        if (empty($errorCodes)) {
            return [
                'status'      => 'spam',
                'error_codes' => ['unknown'],
                'message'     => __('Turnstile verification failed with no error codes returned.', 'fluentform'),
            ];
        }

        return [
            'status'      => static::classifyErrors($errorCodes),
            'error_codes' => $errorCodes,
            'message'     => sprintf(
                __('Turnstile verification failed. Error codes: %s', 'fluentform'),
                implode(', ', $errorCodes)
            ),
        ];
    }

    /**
     * Classify error codes as 'spam', 'config_error', or 'network_error'.
     * If ANY spam error is present, it's treated as spam.
     */
    private static function classifyErrors($errorCodes)
    {
        foreach ($errorCodes as $code) {
            if (in_array($code, static::$spamErrorCodes, true)) {
                return 'spam';
            }
        }

        foreach ($errorCodes as $code) {
            if (in_array($code, static::$transientErrorCodes, true)) {
                return 'network_error';
            }
        }

        foreach ($errorCodes as $code) {
            if (in_array($code, static::$configErrorCodes, true)) {
                return 'config_error';
            }
        }

        // Unknown error codes default to spam for safety
        return 'spam';
    }

    public static function ensureSettings($values)
    {
        $settings = ArrayHelper::get($values, '_fluentform_turnstile_details');

        if (!is_array($settings)) {
            $settings = [];
        }

        $settings['invisible'] = ArrayHelper::get($settings, 'invisible', 'no');
        $settings['theme'] = ArrayHelper::get($settings, 'theme', 'auto');
        $settings['appearance'] = ArrayHelper::get($settings, 'appearance', 'always');
        $settings['size'] = ArrayHelper::get($settings, 'size', 'normal');
        unset($settings['token']);

        $values['_fluentform_turnstile_details'] = $settings;

        return $values;
    }
}
