<?php

namespace FluentForm\App\Modules\Ai;

/**
 *  Handling AI Api.
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
        
        $request_url = $this->url;
        
        add_filter('http_request_timeout', function ($timeout) {
            return 60; // Set timeout to 60 seconds
        });
        
        $request = wp_remote_post($request_url, [
            'headers' => $headers,
            'body'    => json_encode($requestData)
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
