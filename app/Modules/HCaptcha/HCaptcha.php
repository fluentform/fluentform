<?php

namespace FluentForm\App\Modules\HCaptcha;

use FluentForm\Framework\Helpers\ArrayHelper;

class HCaptcha
{
    /**
     * Error codes that indicate the captcha determined the submission is spam/bot.
     * These are client-controlled (token) errors — must always block.
     */
    private static $spamErrorCodes = [
        'missing-input-response',
        'invalid-input-response',
        'expired-input-response',
        'already-seen-response',
    ];

    /**
     * Error codes that indicate server-side configuration issues.
     * These are admin-controlled — safe to allow submission through.
     */
    private static $configErrorCodes = [
        'missing-input-secret',
        'invalid-input-secret',
        'bad-request',
        'sitekey-secret-mismatch',
        'not-using-dummy-passcode',
        'not-using-dummy-secret',
        'missing-remoteip',
        'invalid-remoteip',
    ];

    /**
     * Verify hCaptcha response.
     *
     * @param string $token  response from the user.
     * @param null   $secret provided or already stored secret key.
     *
     * @return bool
     */
    public static function validate($token, $secret = null)
    {
        $result = static::verify($token, $secret);
        return 'valid' === $result['status'];
    }

    /**
     * Verify hCaptcha response with detailed result.
     *
     * @param string $token
     * @param string|null $secret
     * @return array{status: string, error_codes: array, message: string}
     *   status: 'valid' | 'spam' | 'config_error' | 'network_error'
     */
    public static function verify($token, $secret = null)
    {
        $verifyUrl = 'https://api.hcaptcha.com/siteverify';

        $secret = $secret ?: ArrayHelper::get(get_option('_fluentform_hCaptcha_details'), 'secretKey');

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
                    __('hCaptcha service returned HTTP %d.', 'fluentform'),
                    $statusCode
                ),
            ];
        }

        $result = json_decode(wp_remote_retrieve_body($response));

        if (! $result || ! isset($result->success)) {
            return [
                'status'      => 'network_error',
                'error_codes' => ['invalid_response'],
                'message'     => __('Invalid response from hCaptcha service.', 'fluentform'),
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
                'message'     => __('hCaptcha verification failed with no error codes returned.', 'fluentform'),
            ];
        }

        return [
            'status'      => static::classifyErrors($errorCodes),
            'error_codes' => $errorCodes,
            'message'     => sprintf(
                __('hCaptcha verification failed. Error codes: %s', 'fluentform'),
                implode(', ', $errorCodes)
            ),
        ];
    }

    /**
     * Classify error codes as 'spam' or 'config_error'.
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
            if (in_array($code, static::$configErrorCodes, true)) {
                return 'config_error';
            }
        }

        // Unknown error codes default to spam for safety
        return 'spam';
    }
}
