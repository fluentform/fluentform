<?php

namespace FluentForm\App\Modules\Ai;

/**
 *  Handling Gemini Api.
 * @since 5.1.5
 */
class GeminiApi
{
    
    protected $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    protected $key;
    
    public function __construct()
    {
        $this->key = 'AIzaSyB5W3Aq9RdDLD_cY5SpGxOyaeYtQXAYQW0';
    }
    
    public function makeRequest($args = [], $token = '')
    {
        $headers = [
            'Content-Type' => 'application/json',
        ];
        
        $content = isset($args['content']) ? $args['content'] : "You are a helpful assistant.";
        $role = isset($args['role']) ? $args['role'] : "system";
        
        $bodyArgs = [
            "contents"         => [
                [
                    "role"  => $role === "system" ? "user" : $role,
                    "parts" => [
                        ["text" => $content]
                    ]
                ]
            ],
            "generationConfig" => [
                "temperature" => 0.1,
            ]
        ];
        
        // Add API key as a query parameter
        $request_url = $this->url . '?key=' . $this->key;
        
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
