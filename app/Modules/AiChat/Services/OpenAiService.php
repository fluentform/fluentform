<?php

namespace FluentForm\App\Modules\AiChat\Services;

use Exception;

/**
 * OpenAI API Service for AI Chat
 * Handles direct integration with OpenAI API
 * 
 * @since 1.0.0
 */
class OpenAiService
{
    private $apiKey;
    private $apiUrl = 'https://api.openai.com/v1/chat/completions';
    private $model = 'gpt-4';
    private $temperature = 0.7;
    private $maxTokens = 1000;

    /**
     * Constructor
     * 
     * @param string $apiKey OpenAI API key
     * @param string $model Model to use (default: gpt-4)
     */
    public function __construct($apiKey = null, $model = 'gpt-4')
    {
        $this->apiKey = $apiKey;
        $this->model = $model;
    }

    /**
     * Set API key
     * 
     * @param string $apiKey
     * @return self
     */
    public function setApiKey($apiKey)
    {
        $this->apiKey = $apiKey;
        return $this;
    }

    /**
     * Set model
     * 
     * @param string $model
     * @return self
     */
    public function setModel($model)
    {
        $this->model = $model;
        return $this;
    }

    /**
     * Set temperature
     * 
     * @param float $temperature
     * @return self
     */
    public function setTemperature($temperature)
    {
        $this->temperature = $temperature;
        return $this;
    }

    /**
     * Set max tokens
     * 
     * @param int $maxTokens
     * @return self
     */
    public function setMaxTokens($maxTokens)
    {
        $this->maxTokens = $maxTokens;
        return $this;
    }

    /**
     * Make a chat completion request to OpenAI
     * 
     * @param array $messages Array of message objects with 'role' and 'content'
     * @param array $options Additional options
     * @return array Response from OpenAI
     * @throws Exception
     */
    public function chat($messages, $options = [])
    {
        if (empty($this->apiKey)) {
            throw new Exception(__('OpenAI API key is not configured', 'fluentform'));
        }

        if (empty($messages)) {
            throw new Exception(__('Messages array cannot be empty', 'fluentform'));
        }

        $requestBody = [
            'model' => $this->model,
            'messages' => $messages,
            'temperature' => $this->temperature,
            'max_tokens' => $this->maxTokens,
        ];

        // Merge additional options
        if (!empty($options)) {
            $requestBody = array_merge($requestBody, $options);
        }

        $response = $this->makeRequest($requestBody);

        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }

        return $response;
    }

    /**
     * Make HTTP request to OpenAI API
     * 
     * @param array $body Request body
     * @return array|\WP_Error
     */
    private function makeRequest($body)
    {
        $headers = [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $this->apiKey,
        ];

        // Increase timeout for AI requests
        // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
        add_filter('http_request_timeout', function () {
            return 60;
        });

        $response = wp_remote_post($this->apiUrl, [
            'headers' => $headers,
            'body' => wp_json_encode($body),
            'timeout' => 60,
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $responseCode = wp_remote_retrieve_response_code($response);
        $responseBody = wp_remote_retrieve_body($response);
        $data = json_decode($responseBody, true);

        if ($responseCode !== 200) {
            $errorMessage = isset($data['error']['message'])
                ? $data['error']['message']
                : __('Unknown error from OpenAI API', 'fluentform');

            // Log error for debugging
            $this->logError('OpenAI API Error', [
                'code' => $responseCode,
                'message' => $errorMessage,
                'data' => $data,
            ]);

            return new \WP_Error($responseCode, $errorMessage);
        }

        return $data;
    }

    /**
     * Extract message content from OpenAI response
     * 
     * @param array $response OpenAI API response
     * @return string Message content
     */
    public function extractMessage($response)
    {
        if (isset($response['choices'][0]['message']['content'])) {
            return trim($response['choices'][0]['message']['content']);
        }

        return '';
    }

    /**
     * Extract function call from OpenAI response
     * 
     * @param array $response OpenAI API response
     * @return array|null Function call data
     */
    public function extractFunctionCall($response)
    {
        if (isset($response['choices'][0]['message']['function_call'])) {
            return $response['choices'][0]['message']['function_call'];
        }

        return null;
    }

    /**
     * Validate API key
     * 
     * @param string $apiKey
     * @return bool|\WP_Error
     */
    public function validateApiKey($apiKey = null)
    {
        $testKey = $apiKey ?: $this->apiKey;

        if (empty($testKey)) {
            return new \WP_Error('empty_key', __('API key is empty', 'fluentform'));
        }

        // Make a simple test request
        $tempService = new self($testKey, 'gpt-3.5-turbo');
        $tempService->setMaxTokens(10);

        try {
            $response = $tempService->chat([
                ['role' => 'user', 'content' => 'Hi']
            ]);

            return !is_wp_error($response);
        } catch (Exception $e) {
            return new \WP_Error('invalid_key', $e->getMessage());
        }
    }

    /**
     * Get available models
     * 
     * @return array
     */
    public static function getAvailableModels()
    {
        return [
            'gpt-4' => [
                'label' => 'GPT-4',
                'description' => 'Most capable model, best for complex conversations',
                'max_tokens' => 8192,
            ],
            'gpt-4-turbo-preview' => [
                'label' => 'GPT-4 Turbo',
                'description' => 'Faster and more cost-effective than GPT-4',
                'max_tokens' => 128000,
            ],
            'gpt-3.5-turbo' => [
                'label' => 'GPT-3.5 Turbo',
                'description' => 'Fast and cost-effective for simple conversations',
                'max_tokens' => 4096,
            ],
        ];
    }

    /**
     * Estimate token count (rough approximation)
     *
     * @param string $text
     * @return int
     */
    public static function estimateTokens($text)
    {
        // Rough estimate: 1 token ≈ 4 characters
        return (int) ceil(strlen($text) / 4);
    }

    /**
     * Log error for debugging
     *
     * @param string $message Error message
     * @param array $context Additional context
     * @return void
     */
    private function logError($message, $context = [])
    {
        if (defined('WP_DEBUG') && WP_DEBUG) {
            // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
            error_log(sprintf(
                '[FluentForm AI Chat] %s: %s',
                $message,
                wp_json_encode($context)
            ));
        }
    }
}

