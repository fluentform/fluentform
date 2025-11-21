<?php

namespace FluentForm\App\Modules\AiChat\Services;

/**
 * AI Meta Storage Service
 * Handles storage of AI chat data in existing FluentForm tables
 *
 * @since 1.0.0
 */
class AiMetaStorage
{
    /**
     * Create a new AI chat session
     *
     * @param int $formId Form ID
     * @param int|null $userId User ID (optional)
     * @return int Submission ID
     */
    public function createSession($formId, $userId = null)
    {
        // Get country code (same as normal submission)
        $country = apply_filters('fluentform/disable_submission_country_detection', false, $formId)
            ? null
            : \FluentForm\App\Helpers\Helper::getCountryCodeFromHeaders();

        // Get source URL from referer
        $sourceUrl = isset($_SERVER['HTTP_REFERER']) ? sanitize_url($_SERVER['HTTP_REFERER']) : site_url();

        $submissionData = [
            'form_id' => $formId,
            'user_id' => $userId,
            'status' => 'unread', // Changed from 'draft' to 'unread' so it appears in admin immediately
            'response' => wp_json_encode([]), // Initialize with empty JSON to prevent json_decode(null) warnings
            'source_url' => $sourceUrl,
            'country' => $country,
            'ip' => $this->getClientIp(),
            'browser' => $this->getBrowser(),
            'device' => $this->getDevice(),
            'created_at' => current_time('mysql'),
            'updated_at' => current_time('mysql'),
        ];

        $submissionId = wpFluent()->table('fluentform_submissions')->insertGetId($submissionData);

        // Initialize session state
        $this->saveSessionState($submissionId, $formId, [
            'session_id' => wp_generate_uuid4(),
            'mode' => 'ai_chat',
            'form_id' => $formId,
            'submission_id' => $submissionId,
            'started_at' => current_time('mysql'),
            'current_field' => null,
            'fields_completed' => [],
        ]);

        return $submissionId;
    }

    /**
     * Save session state
     *
     * @param int $submissionId Submission ID
     * @param int $formId Form ID
     * @param array $state Session state data
     * @return bool
     */
    public function saveSessionState($submissionId, $formId, $state)
    {
        return \FluentForm\App\Helpers\Helper::setSubmissionMeta($submissionId, 'ai_session_state', $state, $formId);
    }

    /**
     * Get session state
     *
     * @param int $submissionId Submission ID
     * @return array|null
     */
    public function getSessionState($submissionId)
    {
        return \FluentForm\App\Helpers\Helper::getSubmissionMeta($submissionId, 'ai_session_state');
    }

    /**
     * Save conversation message
     *
     * @param int $submissionId Submission ID
     * @param int $formId Form ID
     * @param string $role Message role (user|assistant)
     * @param string $content Message content
     * @return bool
     */
    public function saveConversationMessage($submissionId, $formId, $role, $content)
    {
        $history = $this->getConversationHistory($submissionId) ?: [];

        $history[] = [
            'role' => $role,
            'content' => $content,
            'timestamp' => current_time('mysql'),
        ];

        return \FluentForm\App\Helpers\Helper::setSubmissionMeta($submissionId, 'ai_conversation_history', $history, $formId);
    }

    /**
     * Get conversation history
     *
     * @param int $submissionId Submission ID
     * @return array
     */
    public function getConversationHistory($submissionId)
    {
        return \FluentForm\App\Helpers\Helper::getSubmissionMeta($submissionId, 'ai_conversation_history') ?: [];
    }

    /**
     * Save field mapping
     *
     * @param int $submissionId Submission ID
     * @param int $formId Form ID
     * @param string $fieldName Field name
     * @param string $rawResponse Raw user response
     * @param mixed $extractedValue Extracted field value
     * @return bool
     */
    public function saveFieldMapping($submissionId, $formId, $fieldName, $rawResponse, $extractedValue)
    {
        $mappings = $this->getFieldMappings($submissionId) ?: [];

        $mappings[$fieldName] = [
            'raw_response' => $rawResponse,
            'extracted_value' => $extractedValue,
            'mapped_at' => current_time('mysql'),
        ];

        // Save to submission_meta (for AI chat tracking)
        $metaSaved = \FluentForm\App\Helpers\Helper::setSubmissionMeta($submissionId, 'ai_field_mapping', $mappings, $formId);

        // Also save to entry_details immediately (for unique validation and admin visibility)
        // This makes the field value available for unique validation checks
        $this->saveFieldToEntryDetails($submissionId, $formId, $fieldName, $extractedValue);

        // Update submission response with current field values
        $this->updateSubmissionResponse($submissionId, $mappings);

        return $metaSaved;
    }

    /**
     * Save individual field to entry_details table
     *
     * @param int $submissionId Submission ID
     * @param int $formId Form ID
     * @param string $fieldName Field name
     * @param mixed $fieldValue Field value
     * @return bool
     */
    private function saveFieldToEntryDetails($submissionId, $formId, $fieldName, $fieldValue)
    {
        // Check if entry already exists
        $existing = wpFluent()->table('fluentform_entry_details')
            ->where('submission_id', $submissionId)
            ->where('form_id', $formId)
            ->where('field_name', $fieldName)
            ->first();

        $fieldValueStr = is_array($fieldValue) ? wp_json_encode($fieldValue) : (string)$fieldValue;

        if ($existing) {
            // Update existing entry
            return wpFluent()->table('fluentform_entry_details')
                ->where('id', $existing->id)
                ->update([
                    'field_value' => $fieldValueStr,
                ]);
        } else {
            // Insert new entry
            return wpFluent()->table('fluentform_entry_details')
                ->insert([
                    'submission_id' => $submissionId,
                    'form_id' => $formId,
                    'field_name' => $fieldName,
                    'field_value' => $fieldValueStr,
                ]);
        }
    }

    /**
     * Update submission response with current field values
     *
     * @param int $submissionId Submission ID
     * @param array $mappings Field mappings
     * @return bool
     */
    private function updateSubmissionResponse($submissionId, $mappings)
    {
        // Build form data from mappings
        $formData = [];
        foreach ($mappings as $fieldName => $mapping) {
            $formData[$fieldName] = $mapping['extracted_value'];
        }

        // Update submission response
        $updated = wpFluent()->table('fluentform_submissions')
            ->where('id', $submissionId)
            ->update([
                'response' => wp_json_encode($formData, JSON_UNESCAPED_UNICODE),
                'updated_at' => current_time('mysql'),
            ]);

        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log("AI Chat - Updated Submission Response: ID={$submissionId}, Updated=" . ($updated ? 'Yes' : 'No') . ", Data=" . wp_json_encode($formData));
        }

        return $updated;
    }

    /**
     * Get field mappings
     *
     * @param int $submissionId Submission ID
     * @return array
     */
    public function getFieldMappings($submissionId)
    {
        return \FluentForm\App\Helpers\Helper::getSubmissionMeta($submissionId, 'ai_field_mapping') ?: [];
    }

    /**
     * Complete submission
     *
     * @param int $submissionId Submission ID
     * @param int $formId Form ID
     * @param array $formData Final form data
     * @param object $form Form object
     * @return bool
     */
    public function completeSubmission($submissionId, $formId, $formData, $form)
    {
        // Get serial number
        $previousItem = wpFluent()->table('fluentform_submissions')
            ->where('form_id', $formId)
            ->orderBy('id', 'DESC')
            ->first();

        $serialNumber = 1;
        if ($previousItem && isset($previousItem->serial_number)) {
            $serialNumber = $previousItem->serial_number + 1;
        }

        // Apply filters to form data (same as normal submission)
        $formData = apply_filters('fluentform/insert_response_data', $formData, $formId, []);

        // Update submission with final data
        $updated = wpFluent()->table('fluentform_submissions')
            ->where('id', $submissionId)
            ->update([
                'response' => wp_json_encode($formData, JSON_UNESCAPED_UNICODE),
                'status' => 'submitted',
                'serial_number' => $serialNumber,
                'updated_at' => current_time('mysql'),
            ]);

        if (!$updated) {
            return false;
        }

        // Generate and save entry UID hash (same as normal submission)
        $uidHash = md5(wp_generate_uuid4() . $submissionId);
        \FluentForm\App\Helpers\Helper::setSubmissionMeta($submissionId, '_entry_uid_hash', $uidHash, $formId);

        // Mark as AI submission
        \FluentForm\App\Helpers\Helper::setSubmissionMeta($submissionId, 'submission_source', 'ai_chat', $formId);

        // Entry details are already saved incrementally as each field was completed
        // No need to call recordEntryDetails again

        // Fire WordPress actions (same as normal submission)
        do_action('fluentform/before_form_actions_processing', $submissionId, $formData, $form);
        do_action('fluentform/notify_on_form_submit', $submissionId, $formData, $form);

        return true;
    }

    /**
     * Get AI configuration for a form
     *
     * @param int $formId Form ID
     * @return array|null
     */
    public function getAiConfig($formId)
    {
        $config = \FluentForm\App\Helpers\Helper::getFormMeta($formId, 'ai_chat_config');

        if ($config) {
            // Decrypt API key if present
            if (!empty($config['api_key'])) {
                $config['api_key'] = $this->decryptApiKey($config['api_key']);
            }

            return $config;
        }

        return null;
    }

    /**
     * Decrypt API key
     *
     * @param string $encryptedKey Encrypted API key
     * @return string Decrypted API key
     */
    private function decryptApiKey($encryptedKey)
    {
        // Simple decryption - matches encryption
        // TODO: Implement proper decryption using WordPress encryption
        return base64_decode($encryptedKey);
    }

    /**
     * Save AI configuration for a form
     *
     * @param int $formId Form ID
     * @param array $config Configuration data
     * @return bool
     */
    public function saveAiConfig($formId, $config)
    {
        // Encrypt API key if provided
        if (!empty($config['api_key'])) {
            $config['api_key'] = $this->encryptApiKey($config['api_key']);
        }
        
        return \FluentForm\App\Helpers\Helper::setFormMeta($formId, 'ai_chat_config', $config);
    }

    /**
     * Encrypt API key
     *
     * @param string $apiKey API key
     * @return string Encrypted API key
     */
    private function encryptApiKey($apiKey)
    {
        // Simple encryption - in production, use proper encryption
        // For now, just base64 encode (NOT SECURE - just for demo)
        // TODO: Implement proper encryption using WordPress encryption functions
        return base64_encode($apiKey);
    }

    /**
     * Get client IP address
     *
     * @return string
     */
    private function getClientIp()
    {
        return wpFluentForm('request')->getIp() ?: '0.0.0.0';
    }

    /**
     * Get browser information
     *
     * @return string
     */
    private function getBrowser()
    {
        return isset($_SERVER['HTTP_USER_AGENT'])
            ? sanitize_text_field(wp_unslash($_SERVER['HTTP_USER_AGENT']))
            : '';
    }

    /**
     * Get device type
     *
     * @return string
     */
    private function getDevice()
    {
        return wp_is_mobile() ? 'mobile' : 'desktop';
    }
}

