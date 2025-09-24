<?php

namespace FluentForm\App\Modules\FriendlyCaptcha;

use FluentForm\Framework\Helpers\ArrayHelper;

class FriendlyCaptcha
{
    /**
     * Verify Friendly Captcha response using v2 API.
     *
     * @param string $token  response from the user.
     * @param string $secret provided or already stored secret key.
     *
     * @return bool
     */
    public static function validate($token, $secret)
    {
        if (empty($token) || empty($secret)) {
            return false;
        }

        // Get the API endpoint from settings
        $friendlyCaptcha = get_option('_fluentform_friendlycaptcha_details');
        $apiEndpoint = ArrayHelper::get($friendlyCaptcha, 'api_endpoint', 'global');

        // Convert endpoint to URL
        if ($apiEndpoint === 'eu') {
            $verifyUrl = 'https://eu.frcapi.com/api/v2/captcha/siteverify';
        } else {
            $verifyUrl = 'https://global.frcapi.com/api/v2/captcha/siteverify';
        }

        $response = wp_remote_post($verifyUrl, [
            'method' => 'POST',
            'headers' => [
                'X-API-Key' => $secret,
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode([
                'response' => $token,
            ]),
            'timeout' => 10,
        ]);

        $isValid = false;

        if (!is_wp_error($response)) {
            $httpCode = wp_remote_retrieve_response_code($response);
            $result = json_decode(wp_remote_retrieve_body($response), true);
            
            // Check for successful response
            if ($httpCode === 200) {
                $isValid = ArrayHelper::get($result, 'success', false);
            }
        }

        return $isValid;
    }

    /**
     * Test Friendly Captcha keys by making a test API call using v2 API.
     *
     * @param string $siteKey
     * @param string $apiKey
     * @param string $apiEndpoint
     *
     * @return array
     */
    public static function testKeys($siteKey, $apiKey, $apiEndpoint = 'global')
    {
        if (empty($siteKey) || empty($apiKey)) {
            return [
                'success' => false,
                'message' => 'Site Key and API Key are required.'
            ];
        }

        // Convert endpoint to URL
        if ($apiEndpoint === 'eu') {
            $testUrl = 'https://eu.frcapi.com/api/v2/captcha/siteverify';
        } else {
            $testUrl = 'https://global.frcapi.com/api/v2/captcha/siteverify';
        }

        // Make a test request with a dummy token to check if keys are valid
        $response = wp_remote_post($testUrl, [
            'method' => 'POST',
            'headers' => [
                'X-API-Key' => $apiKey,
                'Content-Type' => 'application/json',
            ],
            'body' => json_encode([
                'response' => 'test-token-for-validation',
                'sitekey' => $siteKey,
            ]),
            'timeout' => 10,
        ]);

        if (is_wp_error($response)) {
            return [
                'success' => false,
                'message' => 'Connection error: ' . $response->get_error_message()
            ];
        }

        $httpCode = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $result = json_decode($body, true);

        // Check for authentication errors (invalid API key)
        if ($httpCode === 401) {
            return [
                'success' => false,
                'message' => __('Invalid API Key. Please check your API key.', 'fluentform')
            ];
        }

        // Check for bad request (invalid site key or other issues)
        if ($httpCode === 400) {
            $errorCode = ArrayHelper::get($result, 'error_code', 'unknown');
            if ($errorCode === 'sitekey_invalid') {
                return [
                    'success' => false,
                    'message' => __('Invalid Site Key. Please check your site key.', 'fluentform')
                ];
            } else if ($errorCode === 'sitekey_missing') {
                return [
                    'success' => false,
                    'message' => __('Site Key is missing or invalid format.', 'fluentform')
                ];
            } else {
                return [
                    'success' => false,
                    'message' => __('Bad request: ' . ArrayHelper::get($result, 'detail', 'Unknown error'), 'fluentform')
                ];
            }
        }

        return [
            'success' => true,
            'message' => __('Keys are valid! FriendlyCaptcha v2 API connection successful.', 'fluentform')
        ];
    }
}
