<?php

namespace FluentForm\App\Modules\AiChat\Helpers;

/**
 * AI Chat Helper
 * Common utility functions for AI Chat
 *
 * @since 1.0.0
 */
class AiChatHelper
{
    /**
     * Check if AI chat is enabled for a form
     *
     * @param int $formId Form ID
     * @return bool
     */
    public static function isAiChatEnabled($formId)
    {
        $config = self::getAiConfig($formId);
        return !empty($config['enabled']);
    }
    
    /**
     * Get AI configuration for a form
     *
     * @param int $formId Form ID
     * @return array|null
     */
    public static function getAiConfig($formId)
    {
        $meta = wpFluent()->table('fluentform_form_meta')
            ->where('form_id', $formId)
            ->where('meta_key', 'ai_chat_config')
            ->first();

        if ($meta && $meta->value) {
            return is_string($meta->value) ? json_decode($meta->value, true) : $meta->value;
        }

        return null;
    }
    
    /**
     * Format conversation for display
     *
     * @param array $conversation Conversation history
     * @return array Formatted conversation
     */
    public static function formatConversation($conversation)
    {
        $formatted = [];
        
        foreach ($conversation as $message) {
            $formatted[] = [
                'role' => $message['role'],
                'content' => $message['content'],
                'timestamp' => $message['timestamp'],
                'time_ago' => self::timeAgo($message['timestamp']),
            ];
        }
        
        return $formatted;
    }
    
    /**
     * Get time ago string
     *
     * @param string $timestamp MySQL timestamp
     * @return string Time ago string
     */
    public static function timeAgo($timestamp)
    {
        return human_time_diff(strtotime($timestamp), current_time('timestamp')) . ' ' . __('ago', 'fluentform');
    }
    
    /**
     * Sanitize AI chat message
     *
     * @param string $message Message content
     * @return string Sanitized message
     */
    public static function sanitizeMessage($message)
    {
        $message = wp_strip_all_tags($message);
        $message = sanitize_textarea_field($message);
        return substr($message, 0, 5000); // Limit to 5000 characters
    }

    
    /**
     * Get available AI models
     *
     * @return array
     */
    public static function getAvailableModels()
    {
        return [
            'gpt-4' => [
                'label' => 'GPT-4',
                'description' => __('Most capable model, best for complex conversations', 'fluentform'),
                'cost' => 'High',
            ],
            'gpt-4-turbo-preview' => [
                'label' => 'GPT-4 Turbo',
                'description' => __('Faster and more cost-effective than GPT-4', 'fluentform'),
                'cost' => 'Medium',
            ],
            'gpt-3.5-turbo' => [
                'label' => 'GPT-3.5 Turbo',
                'description' => __('Fast and cost-effective for simple conversations', 'fluentform'),
                'cost' => 'Low',
            ],
        ];
    }
    
    /**
     * Log AI chat activity
     *
     * @param string $action Action performed
     * @param array $data Additional data
     * @return void
     */
    public static function logActivity($action, $data = [])
    {
        if (!defined('WP_DEBUG') || !WP_DEBUG) {
            return;
        }
        
        $logData = [
            'action' => $action,
            'timestamp' => current_time('mysql'),
            'data' => $data,
        ];
        
        // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
        error_log('[FluentForm AI Chat] ' . wp_json_encode($logData));
    }
    
    /**
     * Get conversation statistics
     *
     * @param int $submissionId Submission ID
     * @return array Statistics
     */
    public static function getConversationStats($submissionId)
    {
        $meta = wpFluent()->table('fluentform_submission_meta')
            ->where('response_id', $submissionId)
            ->where('meta_key', 'ai_conversation_history')
            ->first();
        
        if (!$meta || !$meta->value) {
            return [
                'message_count' => 0,
                'user_messages' => 0,
                'ai_messages' => 0,
                'duration' => 0,
            ];
        }
        
        $conversation = is_string($meta->value) ? json_decode($meta->value, true) : $meta->value;
        
        $userMessages = 0;
        $aiMessages = 0;
        $startTime = null;
        $endTime = null;
        
        foreach ($conversation as $message) {
            if ($message['role'] === 'user') {
                $userMessages++;
            } elseif ($message['role'] === 'assistant') {
                $aiMessages++;
            }
            
            $timestamp = strtotime($message['timestamp']);
            if ($startTime === null || $timestamp < $startTime) {
                $startTime = $timestamp;
            }
            if ($endTime === null || $timestamp > $endTime) {
                $endTime = $timestamp;
            }
        }
        
        return [
            'message_count' => count($conversation),
            'user_messages' => $userMessages,
            'ai_messages' => $aiMessages,
            'duration' => $endTime && $startTime ? ($endTime - $startTime) : 0,
        ];
    }
    
    /**
     * Format duration in human-readable format
     *
     * @param int $seconds Duration in seconds
     * @return string Formatted duration
     */
    public static function formatDuration($seconds)
    {
        if ($seconds < 60) {
            return sprintf(_n('%s second', '%s seconds', $seconds, 'fluentform'), $seconds);
        } elseif ($seconds < 3600) {
            $minutes = floor($seconds / 60);
            return sprintf(_n('%s minute', '%s minutes', $minutes, 'fluentform'), $minutes);
        } else {
            $hours = floor($seconds / 3600);
            $minutes = floor(($seconds % 3600) / 60);
            return sprintf(
                __('%s hours %s minutes', 'fluentform'),
                $hours,
                $minutes
            );
        }
    }
}

