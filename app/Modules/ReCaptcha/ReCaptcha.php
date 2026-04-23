<?php

namespace FluentForm\App\Modules\ReCaptcha;

use FluentForm\Framework\Helpers\ArrayHelper;

class ReCaptcha
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
     * Verify reCaptcha response.
     *
     * @param string $token response from the user.
     * @param null $secret provided or already stored secret key.
     *
     * @return bool
     */
    public static function validate($token, $secret = null, $version = 'v2_visible')
    {
        $result = static::verify($token, $secret, $version);
        return 'valid' === $result['status'];
    }

    /**
     * Verify reCaptcha response with detailed result.
     *
     * @param string $token
     * @param string|null $secret
     * @param string $version
     * @return array{status: string, error_codes: array, message: string}
     *   status: 'valid' | 'spam' | 'config_error' | 'network_error'
     */
    public static function verify($token, $secret = null, $version = 'v2_visible')
    {
        $verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';

        $secret = $secret ?: ArrayHelper::get(get_option('_fluentform_reCaptcha_details'), 'secretKey');

        $response = wp_remote_post($verifyUrl, [
            'method' => 'POST',
            'body'   => [
                'secret'   => $secret,
                'response' => $token
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
                    __('reCAPTCHA service returned HTTP %d.', 'fluentform'),
                    $statusCode
                ),
            ];
        }

        $result = json_decode(wp_remote_retrieve_body($response));

        if (! $result || ! isset($result->success)) {
            return [
                'status'      => 'network_error',
                'error_codes' => ['invalid_response'],
                'message'     => __('Invalid response from reCAPTCHA service.', 'fluentform'),
            ];
        }

        if ($result->success) {
            if ($version == 'v3_invisible') {
                $expectedAction = apply_filters('fluentform/recaptcha_v3_action', 'submit');
                if ($expectedAction && (!isset($result->action) || $result->action !== $expectedAction)) {
                    return [
                        'status'      => 'spam',
                        'error_codes' => ['action_mismatch'],
                        'message'     => sprintf(
                            __('reCAPTCHA v3 action mismatch: expected "%s", got "%s".', 'fluentform'),
                            $expectedAction,
                            isset($result->action) ? $result->action : 'none'
                        ),
                    ];
                }

                $score = isset($result->score) ? $result->score : 0;
                $value = 0.5;
                $value = apply_filters_deprecated(
                    'fluentforms_recaptcha_v3_ref_score',
                    [
                        $value
                    ],
                    FLUENTFORM_FRAMEWORK_UPGRADE,
                    'fluentform/recaptcha_v3_ref_score',
                    'Use fluentform/recaptcha_v3_ref_score instead of fluentforms_recaptcha_v3_ref_score.'
                );
                $checkScore = apply_filters('fluentform/recaptcha_v3_ref_score', $value);

                if ($score < $checkScore) {
                    return [
                        'status'      => 'spam',
                        'error_codes' => ['low_score'],
                        'message'     => sprintf(
                            __('reCAPTCHA v3 score too low: %s (threshold: %s).', 'fluentform'),
                            $score,
                            $checkScore
                        ),
                    ];
                }
            }

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
                'message'     => __('reCAPTCHA verification failed with no error codes returned.', 'fluentform'),
            ];
        }

        return [
            'status'      => static::classifyErrors($errorCodes),
            'error_codes' => $errorCodes,
            'message'     => sprintf(
                __('reCAPTCHA verification failed. Error codes: %s', 'fluentform'),
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
