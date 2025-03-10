<?php

namespace FluentForm\App\Modules\Ai;

/**
 *  Handling Gemini Api.
 * @since 5.1.5
 */
class FluentFormAIAPI
{
    public function __construct()
    {
        $this->url = 'https://fluent-form-chatgpt.nakib-un.workers.dev/';
    }
    
    public function makeRequest($requestData = [])
    {
        $headers = [
            'Content-Type' => 'application/json',
        ];
        
        $bodyArgs = [
            'messages' => $requestData,
            'request_id' => uniqid('ffgemini_'),
            'wp_auth' => [
                'nonce' => wp_create_nonce('wp_fluent_form_ai_api'),
                'site_url' => site_url(),
                'timestamp' => time(),
                'plugin_version' => FLUENTFORM_VERSION,
            ],
        ];
        
        $request_url = $this->url;
        
        add_filter('http_request_timeout', function ($timeout) {
            return 60; // Set timeout to 60 seconds
        });
        
        $request = wp_remote_post($request_url, [
            'headers' => $headers,
            'body'    => json_encode($bodyArgs)
        ]);
       
        
        
        if (did_filter('http_request_timeout')) {
            add_filter('http_request_timeout', function ($timeout) {
                return 5; // Set timeout to original 5 seconds
            });
        }
        
        if (is_wp_error($request)) {
            $message = $request->get_error_message();
            return new \WP_Error(423, $message);
        }
        
        $body = json_decode(wp_remote_retrieve_body($request), true);
        $code = wp_remote_retrieve_response_code($request);
        
        if ($code !== 200) {
            $error = __('Something went wrong.', 'fluentform');
            if (isset($body['error']['message'])) {
                $error = __($body['error']['message'], 'fluentform');
            }
            return new \WP_Error(423, $error);
        }

        return $body;
    }
}
