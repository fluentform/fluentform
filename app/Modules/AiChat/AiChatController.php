<?php

namespace FluentForm\App\Modules\AiChat;

use Exception;
use FluentForm\App\Modules\Acl\Acl;
use FluentForm\App\Modules\AiChat\Services\AiConversationEngine;
use FluentForm\App\Modules\AiChat\Services\AiMetaStorage;
use FluentForm\App\Modules\AiChat\Services\OpenAiService;
use FluentForm\App\Modules\AiChat\Services\AiChatCleanup;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;

/**
 * AI Chat Controller
 * Handles AJAX endpoints for AI chat functionality
 *
 * @since 1.0.0
 */
class AiChatController
{
    private $conversationEngine;
    private $metaStorage;
    private $cleanup;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->conversationEngine = new AiConversationEngine();
        $this->metaStorage = new AiMetaStorage();
        $this->cleanup = new AiChatCleanup();
    }

    /**
     * Boot the controller
     */
    public function boot()
    {
        // Public AJAX endpoints (for form submissions)
        add_action('wp_ajax_fluentform_ai_start_conversation', [$this, 'startConversation']);
        add_action('wp_ajax_nopriv_fluentform_ai_start_conversation', [$this, 'startConversation']);
        
        add_action('wp_ajax_fluentform_ai_send_message', [$this, 'sendMessage']);
        add_action('wp_ajax_nopriv_fluentform_ai_send_message', [$this, 'sendMessage']);
        
        add_action('wp_ajax_fluentform_ai_complete_submission', [$this, 'completeSubmission']);
        add_action('wp_ajax_nopriv_fluentform_ai_complete_submission', [$this, 'completeSubmission']);

        // Admin AJAX endpoints
        add_action('wp_ajax_fluentform_ai_save_config', [$this, 'saveConfig']);
        add_action('wp_ajax_fluentform_ai_get_config', [$this, 'getConfig']);
        add_action('wp_ajax_fluentform_ai_test_api_key', [$this, 'testApiKey']);
        add_action('wp_ajax_fluentform_ai_get_cleanup_stats', [$this, 'getCleanupStats']);
        add_action('wp_ajax_fluentform_ai_preview_conversation', [$this, 'previewConversation']);
        add_action('wp_ajax_fluentform_ai_generate_questions', [$this, 'generateQuestions']);

        // Cleanup hooks
        add_action('fluentform_do_email_report_scheduled_tasks', [$this, 'scheduledCleanup']);
        add_action('fluentform_before_submission_deleted', [$this, 'onSubmissionDeleted'], 10, 2);
    }

    /**
     * Start a new AI conversation
     *
     * @return void
     */
    public function startConversation()
    {
        try {
            $formId = intval($_REQUEST['form_id'] ?? 0);
            
            if (!$formId) {
                throw new Exception(__('Form ID is required', 'fluentform'));
            }

            // Verify nonce for security
            $this->verifyNonce();

            $userId = get_current_user_id() ?: null;

            $response = $this->conversationEngine->startConversation($formId, $userId);

            wp_send_json_success($response);
        } catch (Exception $e) {
            wp_send_json_error([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Send a message in the conversation
     *
     * @return void
     */
    public function sendMessage()
    {
        try {
            $submissionId = intval($_REQUEST['submission_id'] ?? 0);
            $message = sanitize_textarea_field(wp_unslash($_REQUEST['message'] ?? ''));

            if (!$submissionId) {
                throw new Exception(__('Submission ID is required', 'fluentform'));
            }

            if (empty($message)) {
                throw new Exception(__('Message cannot be empty', 'fluentform'));
            }

            // Verify nonce
            $this->verifyNonce();

            $response = $this->conversationEngine->processUserResponse($submissionId, $message);

            wp_send_json_success($response);
        } catch (Exception $e) {
            wp_send_json_error([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Complete and submit the form
     *
     * @return void
     */
    public function completeSubmission()
    {
        try {
            $submissionId = intval($_REQUEST['submission_id'] ?? 0);

            if (!$submissionId) {
                throw new Exception(__('Submission ID is required', 'fluentform'));
            }

            // Verify nonce
            $this->verifyNonce();

            $response = $this->conversationEngine->completeSubmission($submissionId);

            wp_send_json_success($response);
        } catch (\FluentForm\Framework\Validator\ValidationException $e) {
            // Handle validation errors (unique email, required fields, etc.)
            $errors = $e->errors();
            $response = [
                'message' => __('Validation failed', 'fluentform'),
                'errors' => $errors,
            ];

            // Include progress if available (set by AiConversationEngine)
            if (isset($e->progress)) {
                $response['progress'] = $e->progress;
            }

            wp_send_json_error($response, $e->getCode());
        } catch (Exception $e) {
            wp_send_json_error([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Save AI configuration for a form
     *
     * @return void
     */
    public function saveConfig()
    {
        try {
            // Verify nonce
            $nonce = sanitize_text_field(wp_unslash($_REQUEST['nonce'] ?? ''));
            if (!wp_verify_nonce($nonce, 'fluentform_ai_chat')) {
                throw new Exception(__('Nonce verification failed, please try again.', 'fluentform'));
            }

            if (!current_user_can('manage_options')) {
                throw new Exception(__('Insufficient permissions', 'fluentform'));
            }

            $formId = intval($_REQUEST['form_id'] ?? 0);
            // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- JSON will be decoded and sanitized below
            $configJson = wp_unslash($_REQUEST['config'] ?? '{}');

            if (!$formId) {
                throw new Exception(__('Form ID is required', 'fluentform'));
            }

            // Decode JSON config
            $config = json_decode($configJson, true);
            if (!is_array($config)) {
                $config = [];
            }

            // Debug: Log received config
            error_log('AI Chat Config Received: ' . print_r($config, true));

            // Sanitize config (individual fields are sanitized here)
            $config = $this->sanitizeConfig($config);

            // Debug: Log sanitized config
            error_log('AI Chat Config Sanitized: ' . print_r($config, true));

            // Use MetaStorage to save config (handles encryption)
            $result = $this->metaStorage->saveAiConfig($formId, $config);

            // Debug: Log save result
            error_log('AI Chat Config Save Result: ' . ($result ? 'Success' : 'Failed'));

            wp_send_json_success([
                'message' => __('AI configuration saved successfully', 'fluentform'),
            ]);
        } catch (Exception $e) {
            wp_send_json_error([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get AI configuration for a form
     *
     * @return void
     */
    public function getConfig()
    {
        try {
            // Verify nonce
            $nonce = sanitize_text_field(wp_unslash($_REQUEST['nonce'] ?? ''));
            if (!wp_verify_nonce($nonce, 'fluentform_ai_chat')) {
                throw new Exception(__('Nonce verification failed, please try again.', 'fluentform'));
            }

            if (!current_user_can('manage_options')) {
                throw new Exception(__('Insufficient permissions', 'fluentform'));
            }

            $formId = intval($_REQUEST['form_id'] ?? 0);

            if (!$formId) {
                throw new Exception(__('Form ID is required', 'fluentform'));
            }

            $config = $this->metaStorage->getAiConfig($formId);

            // Don't send the actual API key to frontend
            if ($config && isset($config['api_key'])) {
                $config['has_api_key'] = !empty($config['api_key']);
                unset($config['api_key']);
            }

            wp_send_json_success([
                'config' => $config ?: $this->getDefaultConfig(),
            ]);
        } catch (Exception $e) {
            wp_send_json_error([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Preview AI conversation (questions + system prompt) for a form
     *
     * @return void
     */
    public function previewConversation()
    {
        try {
            // Verify nonce
            $nonce = sanitize_text_field(wp_unslash($_REQUEST['nonce'] ?? ''));
            if (!wp_verify_nonce($nonce, 'fluentform_ai_chat')) {
                throw new Exception(__('Nonce verification failed, please try again.', 'fluentform'));
            }

            if (!current_user_can('manage_options')) {
                throw new Exception(__('Insufficient permissions', 'fluentform'));
            }

            $formId = intval($_REQUEST['form_id'] ?? 0);

            if (!$formId) {
                throw new Exception(__('Form ID is required', 'fluentform'));
            }

            // Get latest AI config for this form
            $aiConfig = $this->metaStorage->getAiConfig($formId);
            if (!$aiConfig) {
                $aiConfig = $this->getDefaultConfig();
            }

            // Get form and convert to conversational format
            $form = wpFluent()->table('fluentform_forms')->where('id', $formId)->first();
            if (!$form) {
                throw new Exception(__('Form not found', 'fluentform'));
            }

            // Prepare form for Converter
            if (is_string($form->form_fields)) {
                $form->form_fields = json_decode($form->form_fields, true);
            }
            $formObj = (object) [
                'id' => $form->id,
                'title' => $form->title,
                'fields' => $form->form_fields,
            ];

            $convertedForm = \FluentForm\App\Services\FluentConversational\Classes\Converter\Converter::convert($formObj);
            $questions = $convertedForm->questions ?? [];
            $formTitle = $form->title;

            // Generate system prompt (without making any OpenAI calls)
            $reflection = new \ReflectionClass($this->conversationEngine);
            $method = $reflection->getMethod('generateSystemPrompt');
            $method->setAccessible(true);
            $systemPrompt = $method->invoke($this->conversationEngine, $questions, $formTitle, $aiConfig);

            wp_send_json_success([
                'questions' => $questions,
                'system_prompt' => $systemPrompt,
                'form_title' => $formTitle,
            ]);
        } catch (Exception $e) {
            wp_send_json_error([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Generate static questions for all fields using AI
     *
     * @return void
     */
    public function generateQuestions()
    {
        try {
            // Verify nonce
            $this->verifyNonce();

            if (!current_user_can('manage_options')) {
                throw new Exception(__('Insufficient permissions', 'fluentform'));
            }

            $formId = intval($_REQUEST['form_id'] ?? 0);
            if (!$formId) {
                throw new Exception(__('Form ID is required', 'fluentform'));
            }

            // Get AI config
            $aiConfig = $this->metaStorage->getAiConfig($formId);
            
            // Allow passing a temporary API key for testing/generation if not saved yet
            $tempApiKey = sanitize_text_field(wp_unslash($_REQUEST['api_key'] ?? ''));
            if ($tempApiKey) {
                $aiConfig['api_key'] = $tempApiKey;
            }

            if (empty($aiConfig['api_key'])) {
                throw new Exception(__('API key is required', 'fluentform'));
            }

            // Get form
            $form = wpFluent()->table('fluentform_forms')->where('id', $formId)->first();
            if (!$form) {
                throw new Exception(__('Form not found', 'fluentform'));
            }

            // Prepare form for Converter
            if (is_string($form->form_fields)) {
                $form->form_fields = json_decode($form->form_fields, true);
            }
            $formObj = (object) [
                'id' => $form->id,
                'title' => $form->title,
                'fields' => $form->form_fields,
            ];

            $convertedForm = \FluentForm\App\Services\FluentConversational\Classes\Converter\Converter::convert($formObj);
            $questions = $convertedForm->questions ?? [];

            // Use Engine to generate questions
            // We need to expose a method in AiConversationEngine for this
            // For now, we'll use a reflection hack or add a public method to the engine
            // Ideally, we should add a public method `generateQuestionsForFields` to AiConversationEngine
            
            // Let's use the OpenAiService directly here for simplicity as we are in the Controller
            // But better to keep logic in Service. I'll add a method to AiConversationEngine in the next step.
            // For now, let's assume the method exists or we implement it here.
            
            $generatedQuestions = $this->conversationEngine->generateStaticQuestions($questions, $form->title, $aiConfig);

            wp_send_json_success([
                'questions' => $generatedQuestions
            ]);

        } catch (Exception $e) {
            wp_send_json_error([
                'message' => $e->getMessage(),
            ], 422);
        }
    }


    /**
     * Test OpenAI API key
     *
     * @return void
     */
    public function testApiKey()
    {
        try {
            // Verify nonce
            $nonce = sanitize_text_field(wp_unslash($_REQUEST['nonce'] ?? ''));
            if (!wp_verify_nonce($nonce, 'fluentform_ai_chat')) {
                throw new Exception(__('Nonce verification failed, please try again.', 'fluentform'));
            }

            if (!current_user_can('manage_options')) {
                throw new Exception(__('Insufficient permissions', 'fluentform'));
            }

            $apiKey = sanitize_text_field(wp_unslash($_REQUEST['api_key'] ?? ''));

            if (empty($apiKey)) {
                throw new Exception(__('API key is required', 'fluentform'));
            }

            $openAiService = new OpenAiService($apiKey, 'gpt-3.5-turbo');
            $result = $openAiService->validateApiKey();

            if (is_wp_error($result)) {
                throw new Exception($result->get_error_message());
            }

            wp_send_json_success([
                'message' => __('API key is valid!', 'fluentform'),
                'valid' => true,
            ]);
        } catch (Exception $e) {
            wp_send_json_error([
                'message' => $e->getMessage(),
                'valid' => false,
            ], 422);
        }
    }

    /**
     * Verify nonce for security
     *
     * @throws Exception
     */
    private function verifyNonce()
    {
        $nonce = sanitize_text_field(wp_unslash($_REQUEST['nonce'] ?? $_REQUEST['_wpnonce'] ?? ''));

        if (!wp_verify_nonce($nonce, 'fluentform_ai_chat')) {
            throw new Exception(__('Security verification failed', 'fluentform'));
        }
    }

    /**
     * Sanitize configuration data
     *
     * @param array $config Configuration data
     * @return array Sanitized configuration
     */
    private function sanitizeConfig($config)
    {
        $sanitized = [
            'enabled' => (bool) Arr::get($config, 'enabled', false),
            'model' => sanitize_text_field(Arr::get($config, 'model', 'gpt-4-turbo-preview')),
            'api_key' => sanitize_text_field(Arr::get($config, 'api_key', '')),
            'custom_prompt' => sanitize_textarea_field(Arr::get($config, 'custom_prompt', '')),
            'conversation_style' => sanitize_text_field(Arr::get($config, 'conversation_style', 'friendly')),
            'question_generation_mode' => sanitize_text_field(Arr::get($config, 'question_generation_mode', 'dynamic')),
            'static_questions' => []
        ];

        // Sanitize static questions array
        $staticQuestions = Arr::get($config, 'static_questions', []);
        if (is_array($staticQuestions)) {
            foreach ($staticQuestions as $key => $value) {
                $sanitized['static_questions'][sanitize_text_field($key)] = sanitize_textarea_field($value);
            }
        }

        return $sanitized;
    }

    /**
     * Get default configuration
     *
     * @return array Default configuration
     */
    private function getDefaultConfig()
    {
        return [
            'enabled' => false,
            'model' => 'gpt-4',
            'api_key' => '',
            'system_prompt' => '',
            'conversation_style' => 'friendly',
            'auto_submit' => false,
            'has_api_key' => false,
            'question_generation_mode' => 'dynamic',
            'static_questions' => []
        ];
    }

    /**
     * Scheduled cleanup of incomplete AI chat submissions
     *
     * Runs via fluentform_do_email_report_scheduled_tasks hook
     * Cleans up submissions older than 24 hours that were never completed
     *
     * @return void
     */
    public function scheduledCleanup()
    {
        error_log('AI Chat - Running scheduled cleanup task');

        try {
            // Clean up incomplete submissions older than 24 hours
            $stats = $this->cleanup->cleanupIncompleteSubmissions(24);

            if ($stats['submissions_deleted'] > 0) {
                error_log("AI Chat - Scheduled cleanup completed: {$stats['submissions_deleted']} submissions, {$stats['messages_deleted']} messages, {$stats['meta_deleted']} meta entries deleted");
            }
        } catch (\Exception $e) {
            error_log('AI Chat - Scheduled cleanup error: ' . $e->getMessage());
        }
    }

    /**
     * Clean up AI chat data when a submission is deleted
     *
     * Runs via fluentform_before_submission_deleted hook
     *
     * @param int $submissionId Submission ID
     * @param int $formId Form ID
     * @return void
     */
    public function onSubmissionDeleted($submissionId, $formId)
    {
        try {
            $this->cleanup->onSubmissionDeleted($submissionId, $formId);
        } catch (\Exception $e) {
            error_log('AI Chat - Error cleaning up deleted submission: ' . $e->getMessage());
        }
    }

    /**
     * Get cleanup statistics
     *
     * AJAX endpoint for admin to view cleanup stats
     *
     * @return void
     */
    public function getCleanupStats()
    {
        try {
            // Verify user has permission
            if (!Acl::hasPermission('fluentform_forms_manager')) {
                wp_send_json_error([
                    'message' => __('You do not have permission to access this resource', 'fluentform'),
                ], 403);
            }

            // Verify nonce
            $this->verifyNonce();

            $stats = $this->cleanup->getCleanupStats();

            wp_send_json_success($stats);
        } catch (\Exception $e) {
            wp_send_json_error([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}

