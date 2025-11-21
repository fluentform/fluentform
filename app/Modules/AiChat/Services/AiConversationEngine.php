<?php

namespace FluentForm\App\Modules\AiChat\Services;

use Exception;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;
use FluentForm\App\Services\FluentConversational\Classes\Converter\Converter;

/**
 * AI Conversation Engine
 * Main orchestrator for AI-powered form conversations
 *
 * @since 1.0.0
 */
class AiConversationEngine
{
    private $openAiService;
    private $metaStorage;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->metaStorage = new AiMetaStorage();
    }

    /**
     * Start a new conversation
     *
     * @param int $formId Form ID
     * @param int|null $userId User ID
     * @return array Response data
     * @throws Exception
     */
    public function startConversation($formId, $userId = null)
    {
        // Get AI config
        $aiConfig = $this->metaStorage->getAiConfig($formId);
        if (!$aiConfig || !Arr::get($aiConfig, 'enabled')) {
            throw new Exception(__('AI chat is not enabled for this form', 'fluentform'));
        }

        // Initialize OpenAI service
        $this->initializeOpenAi($aiConfig);

        // Get form and convert to conversational format
        $form = wpFluent()->table('fluentform_forms')->where('id', $formId)->first();
        if (!$form) {
            throw new Exception(__('Form not found', 'fluentform'));
        }

        $form = $this->prepareForm($form);
        $convertedForm = Converter::convert($form);
        $questions = $convertedForm->questions ?? [];

        if (empty($questions)) {
            throw new Exception(__('No conversational fields found in this form', 'fluentform'));
        }

        // Create session
        $submissionId = $this->metaStorage->createSession($formId, $userId);

        // Get form title
        $formTitle = $form->title;

        // Generate system prompt
        $systemPrompt = $this->generateSystemPrompt($questions, $formTitle, $aiConfig);

        // Get first question from AI
        $firstMessage = $this->generateFirstMessage($systemPrompt, $questions);

        // Save first message
        $this->metaStorage->saveConversationMessage($submissionId, $formId, 'assistant', $firstMessage);

        // Update session state
        $this->metaStorage->saveSessionState($submissionId, $formId, [
            'session_id' => wp_generate_uuid4(),
            'mode' => 'ai_chat',
            'form_id' => $formId,
            'submission_id' => $submissionId,
            'started_at' => current_time('mysql'),
            'current_field' => $questions[0]['name'],
            'fields_completed' => [],
            'form_title' => $formTitle,
        ]);

        return [
            'submission_id' => $submissionId,
            'message' => $firstMessage,
            'current_field' => $questions[0]['name'],
            'total_fields' => count($questions),
        ];
    }

    /**
     * Process user response
     *
     * @param int $submissionId Submission ID
     * @param string $userMessage User's message
     * @return array Response data
     * @throws Exception
     */
    public function processUserResponse($submissionId, $userMessage)
    {
        // Get session state
        $session = $this->metaStorage->getSessionState($submissionId);
        if (!$session) {
            throw new Exception(__('Session not found', 'fluentform'));
        }

        $formId = Arr::get($session, 'form_id');
        if (!$formId) {
            // Get form_id from submission
            $submission = wpFluent()->table('fluentform_submissions')
                ->where('id', $submissionId)
                ->first();
            $formId = $submission->form_id;
        }

        // Get form object (needed for validation)
        $form = wpFluent()->table('fluentform_forms')
            ->where('id', $formId)
            ->first();

        if (!$form) {
            throw new Exception(__('Form not found', 'fluentform'));
        }

        // Get AI config
        $aiConfig = $this->metaStorage->getAiConfig($formId);
        $this->initializeOpenAi($aiConfig);

        // Get conversation history
        $conversation = $this->metaStorage->getConversationHistory($submissionId);

        // Get form and convert to conversational format
        $formObj = $this->prepareForm($form);
        $convertedForm = Converter::convert($formObj);
        $questions = $convertedForm->questions ?? [];

        // Canonical progress: derive completed fields from saved field mappings
        $fieldMappings = $this->metaStorage->getFieldMappings($submissionId) ?: [];
        $questionNames = array_column($questions, 'name');
        $completedFields = array_values(array_intersect(array_keys($fieldMappings), $questionNames));

        // Merge with any in-session completed fields (in case session was just updated)
        $sessionCompleted = Arr::get($session, 'fields_completed', []);
        $completedFields = array_values(array_unique(array_merge($sessionCompleted, $completedFields)));

        // Sync session with canonical completed fields
        $session['fields_completed'] = $completedFields;

        // Determine current field from completed fields
        $currentField = $this->getNextField($questions, $completedFields);
        $session['current_field'] = $currentField ? $currentField['name'] : null;

        // Save user message
        $this->metaStorage->saveConversationMessage($submissionId, $formId, 'user', $userMessage);

        // SIMPLE APPROACH: Extract value for CURRENT field only
        // We extract BEFORE generating the AI response to ensure the AI knows the actual state
        $extractedValues = [];
        $successfullyExtracted = [];
        $validationErrors = [];
        $systemNotes = [];

        // Extract the current field value (single-field mode)
        if ($currentField) {
            $currentValue = $this->extractFieldValue($userMessage, $currentField, null);

            // Treat empty string as "no value" so we don't mark a field completed accidentally
            if ($currentValue !== null && $currentValue !== '') {
                $extractedValues[$currentField['name']] = $currentValue;
            }
        }

        // Process extracted values
        foreach ($extractedValues as $fieldName => $extractedValue) {
            $field = $this->getFieldByName($questions, $fieldName);
            if (!$field) continue;

            // Validate
            $validationError = $this->validateFieldValue($form, $fieldName, $extractedValue, $submissionId);

            if ($validationError) {
                $validationErrors[$fieldName] = [
                    'label' => $field['title'],
                    'error' => $validationError,
                    'value' => $extractedValue,
                ];
            } else {
                // Save mapping
                $this->metaStorage->saveFieldMapping($submissionId, $formId, $fieldName, $userMessage, $extractedValue);
                $successfullyExtracted[] = $fieldName;
                $systemNotes[] = "Successfully collected value for '{$field['title']}'.";
            }
        }

        // Update canonical completed fields from successful extractions
        if (!empty($successfullyExtracted)) {
            $questionNames = array_column($questions, 'name');

            // Merge and normalize
            $completedFields = array_values(array_unique(array_merge($completedFields, $successfullyExtracted)));
            $completedFields = array_values(array_intersect($completedFields, $questionNames));

            // Determine next field from updated completed fields
            $currentField = $this->getNextField($questions, $completedFields);

            // CRITICAL: Update session array BEFORE saving and BEFORE building AI messages
            // This ensures the AI receives the correct current_field context
            $session['fields_completed'] = $completedFields;
            $session['current_field'] = $currentField ? $currentField['name'] : null;

            // Save updated session to database
            $this->metaStorage->saveSessionState($submissionId, $formId, $session);
        }

        // Build messages for OpenAI with UPDATED session state
        // This ensures AI knows about the field we just completed and asks about the NEXT field
        $messages = $this->buildMessages($conversation, $userMessage, $questions, $session, $aiConfig);

        // Add system notes (validations or success)
        if (!empty($validationErrors)) {
            $errorContext = "VALIDATION ERRORS:\n";
            foreach ($validationErrors as $fieldName => $error) {
                $errorContext .= "- Field '{$error['label']}': The value '{$error['value']}' failed validation: {$error['error']}\n";
            }
            $errorContext .= "\nPlease politely explain these errors to the user and ask them to provide corrected values.";

            $messages[] = ['role' => 'system', 'content' => $errorContext];
        } elseif (!empty($systemNotes)) {
            // Inform AI about success so it can move on naturally
            $messages[] = ['role' => 'system', 'content' => implode("\n", $systemNotes)];
        }

        // Get AI response
        $aiResponse = $this->openAiService->chat($messages);
        $aiMessage = $this->openAiService->extractMessage($aiResponse);

        // Recalculate canonical completed fields from saved mappings for progress & completion
        $finalMappings = $this->metaStorage->getFieldMappings($submissionId) ?: [];
        $finalQuestionNames = array_column($questions, 'name');
        $finalCompletedFields = array_values(array_intersect(array_keys($finalMappings), $finalQuestionNames));

        // Count only input fields (exclude section breaks, HTML blocks, etc.)
        $totalInputFields = $this->countInputFields($questions);

        // Determine completion status from canonical completed fields
        $isAllCompleted = ($this->getNextField($questions, $finalCompletedFields) === null
            && count($finalCompletedFields) === $totalInputFields);

        // If we just finished the last field, always append a clear completion message
        if ($isAllCompleted) {
             $aiMessage .= ' ' . __('Thank you! Your form is now complete and will be submitted.', 'fluentform');
        }

        // Save AI message
        $this->metaStorage->saveConversationMessage($submissionId, $formId, 'assistant', $aiMessage);

        // Get current field details for frontend (for showing options/buttons)
        $currentFieldDetails = null;
        $currentFieldName = Arr::get($session, 'current_field');
        if ($currentFieldName) {
            $currentFieldObj = $this->getFieldByName($questions, $currentFieldName);
            if ($currentFieldObj) {
                $currentFieldDetails = [
                    'name' => $currentFieldObj['name'],
                    'title' => $currentFieldObj['title'],
                    'type' => Arr::get($currentFieldObj, 'ff_input_type', ''),
                    'options' => Arr::get($currentFieldObj, 'options', []),
                ];
            }
        }

        $response = [
            'message' => $aiMessage,
            'field_completed' => !empty($successfullyExtracted),
            'all_completed' => $isAllCompleted,
            'current_field' => $currentFieldName,
            'current_field_details' => $currentFieldDetails,
            'progress' => [
                'completed' => count($finalCompletedFields),
                'total' => $totalInputFields,
            ],
            'validation_errors' => $validationErrors,
        ];

        return $response;
    }

    /**
     * Complete and submit the form
     *
     * @param int $submissionId Submission ID
     * @return array Response data
     * @throws Exception
     */
    public function completeSubmission($submissionId)
    {

        // Get field mappings
        $mappings = $this->metaStorage->getFieldMappings($submissionId);

        if (empty($mappings)) {
            throw new Exception(__('No field data found', 'fluentform'));
        }


        // Get submission
        $submission = wpFluent()->table('fluentform_submissions')
            ->where('id', $submissionId)
            ->first();

        if (!$submission) {
            throw new Exception(__('Submission not found', 'fluentform'));
        }


        // Get form
        $form = wpFluent()->table('fluentform_forms')
            ->where('id', $submission->form_id)
            ->first();

        if (!$form) {
            throw new Exception(__('Form not found', 'fluentform'));
        }

        // IMPORTANT: Do NOT decode form_fields here!
        // FormFieldsParser and other FluentForm services expect it to be a JSON string
        // They will decode it internally as needed

        // Build form data
        $formData = [];
        foreach ($mappings as $fieldName => $mapping) {
            $formData[$fieldName] = $mapping['extracted_value'];
        }


        // Run validation (same as normal submission)
        try {
            $this->validateFinalSubmission($form, $formData);
        } catch (\FluentForm\Framework\Validator\ValidationException $e) {

            // Reset session to allow user to fix the failed field
            $errors = $e->errors();
            $updatedSession = null;

            if (!empty($errors)) {
                // Get the first failed field
                $failedFieldName = array_key_first($errors);

                // Update session to set current field to the failed field
                $session = $this->metaStorage->getSessionState($submissionId);
                if ($session) {
                    $session['current_field'] = $failedFieldName;
                    // Remove failed field from completed fields
                    $completedFields = Arr::get($session, 'fields_completed', []);
                    $completedFields = array_filter($completedFields, function($field) use ($failedFieldName) {
                        return $field !== $failedFieldName;
                    });
                    $session['fields_completed'] = array_values($completedFields);
                    $this->metaStorage->saveSessionState($submissionId, $submission->form_id, $session);
                    $updatedSession = $session;
                }
            }

            // Get total questions for progress
            $formObj = $this->prepareForm($form);
            $convertedForm = Converter::convert($formObj);
            $questions = $convertedForm->questions ?? [];

            // Create a new ValidationException with additional data
            $validationException = new \FluentForm\Framework\Validator\ValidationException(
                $e->getMessage(),
                $e->getCode()
            );
            $validationException->setErrors($e->errors());

            // Add progress data to exception (will be caught by controller)
            $validationException->progress = [
                'completed' => count(Arr::get($updatedSession, 'fields_completed', [])),
                'total' => count($questions),
            ];

            // Return validation errors to frontend
            throw $validationException;
        }

        // Complete submission (updates status and response)
        $this->metaStorage->completeSubmission($submissionId, $submission->form_id, $formData, $form);

        return [
            'success' => true,
            'submission_id' => $submissionId,
            'message' => __('Form submitted successfully!', 'fluentform'),
        ];
    }

    /**
     * Validate final submission data
     *
     * @param object $form Form object
     * @param array $formData Form data
     * @throws \FluentForm\Framework\Validator\ValidationException
     */
    private function validateFinalSubmission($form, &$formData)
    {
        // Get form fields with validation rules
        $fields = \FluentForm\App\Modules\Form\FormFieldsParser::getEssentialInputs($form, $formData, ['rules', 'raw']);

        // Sanitize form data
        $formData = fluentFormSanitizer($formData, null, $fields);

        // Get validations (rules and messages)
        $validations = \FluentForm\App\Modules\Form\FormFieldsParser::getValidations($form, $formData, $fields);

        // Apply validation filters
        $validations = apply_filters('fluentform/validations', $validations, $form, $formData);

        // Run Laravel validator
        $validator = wpFluentForm('validator')->make($formData, $validations[0], $validations[1]);

        $errors = [];
        if ($validator->validate()->fails()) {
            foreach ($validator->errors() as $attribute => $rules) {
                $position = strpos($attribute, ']');
                if ($position) {
                    $attribute = substr($attribute, 0, strpos($attribute, ']') + 1);
                }
                $errors[$attribute] = $rules;
            }
        }

        // Run custom field validations (includes unique email check)
        foreach ($fields as $fieldKey => $field) {
            $field['data_key'] = $fieldKey;
            $inputName = \FluentForm\Framework\Helpers\ArrayHelper::get($field, 'raw.attributes.name');
            $field['name'] = $inputName;

            // This calls Helper::validateInput which includes isUniqueValidation
            $error = \FluentForm\App\Helpers\Helper::validateInput($field, $formData, $form);

            // Apply field-specific validation filters
            $error = apply_filters('fluentform/validate_input_item_' . $field['element'], $error, $field, $formData, $fields, $form, $errors);

            if ($error) {
                if (empty($errors[$inputName])) {
                    $errors[$inputName] = [];
                }
                if (is_string($error)) {
                    $error = [fluentform_sanitize_html($error)];
                } else if (is_array($error)) {
                    foreach ($error as $rule => $message) {
                        $error[$rule] = fluentform_sanitize_html($message);
                    }
                }
                $errors[$inputName] = array_merge($error, $errors[$inputName]);
            }
        }

        // Apply final error filters
        $errors = apply_filters('fluentform/validation_errors', $errors, $formData, $form, $fields);

        // Throw exception if there are errors
        if ($errors) {
            throw new \FluentForm\Framework\Validator\ValidationException('Validation failed', 423, null, ['errors' => $errors]);
        }
    }

    /**
     * Validate a single field value
     *
     * @param object $form Form object
     * @param string $fieldName Field name
     * @param mixed $value Field value
     * @param int $submissionId Submission ID (for unique validation)
     * @return string|null Error message if validation fails, null if passes
     */
    private function validateFieldValue($form, $fieldName, $value, $submissionId)
    {

        // Build form data with just this field
        $formData = [$fieldName => $value];

        // Get form fields with validation rules
        $fields = \FluentForm\App\Modules\Form\FormFieldsParser::getEssentialInputs($form, $formData, ['rules', 'raw']);

        // Check if this field exists
        if (!isset($fields[$fieldName])) {
            return null; // No validation rules for this field
        }

        $field = $fields[$fieldName];



        // Sanitize the value
        $formData = fluentFormSanitizer($formData, null, $fields);
        $value = $formData[$fieldName];

        // Get validations for this field only
        $validations = \FluentForm\App\Modules\Form\FormFieldsParser::getValidations($form, $formData, $fields);

        // Run Laravel validator for this field
        if (isset($validations[0][$fieldName])) {
            $rules = [$fieldName => $validations[0][$fieldName]];
            $messages = isset($validations[1][$fieldName]) ? [$fieldName => $validations[1][$fieldName]] : [];


            $validator = wpFluentForm('validator')->make($formData, $rules, $messages);

            if ($validator->validate()->fails()) {
                $errors = $validator->errors();
                if (isset($errors[$fieldName])) {
                    return is_array($errors[$fieldName]) ? $errors[$fieldName][0] : $errors[$fieldName];
                }
            } else {
            }
        } else {
        }

        // Run custom field validation (includes unique email check)
        $field['data_key'] = $fieldName;
        $inputName = \FluentForm\Framework\Helpers\ArrayHelper::get($field, 'raw.attributes.name');
        $field['name'] = $inputName;

        // This calls Helper::validateInput which includes isUniqueValidation
        $error = \FluentForm\App\Helpers\Helper::validateInput($field, $formData, $form);

        // Apply field-specific validation filters
        // This includes isUniqueValidation which now works correctly because we save to entry_details immediately
        $error = apply_filters('fluentform/validate_input_item_' . $field['element'], $error, $field, $formData, $fields, $form, []);

        if ($error) {
            if (is_string($error)) {
                return fluentform_sanitize_html($error);
            } else if (is_array($error)) {
                $firstError = reset($error);
                return fluentform_sanitize_html($firstError);
            }
        }

        return null; // Validation passed
    }

    /**
     * Initialize OpenAI service
     *
     * @param array $aiConfig AI configuration
     * @throws Exception
     */
    private function initializeOpenAi($aiConfig)
    {
        $apiKey = Arr::get($aiConfig, 'api_key');
        if (!$apiKey) {
            throw new Exception(__('OpenAI API key not configured', 'fluentform'));
        }

        $model = Arr::get($aiConfig, 'model', 'gpt-4');

        $this->openAiService = new OpenAiService($apiKey, $model);
        $this->openAiService->setTemperature(0.7);
        $this->openAiService->setMaxTokens(500);
    }

    /**
     * Generate system prompt
     *
     * @param array $questions Form questions
     * @param string $formTitle Form title
     * @param array $aiConfig AI configuration
     * @param array|null $currentField Current field being asked (for field-specific instructions)
     * @return string System prompt
     */
    private function generateSystemPrompt($questions, $formTitle, $aiConfig, $currentField = null)
    {
        $customPrompt = Arr::get($aiConfig, 'system_prompt');

        if ($customPrompt) {
            return $customPrompt;
        }

        $customInstructions = Arr::get($aiConfig, 'custom_instructions', '');

        $prompt = "You are a friendly and helpful form assistant for the form: '{$formTitle}'.\n\n";

        if ($customInstructions) {
            $prompt .= "ADDITIONAL CONTEXT: {$customInstructions}\n\n";
        }

        $prompt .= "Your goal is to collect the following information through natural conversation:\n\n";

        foreach ($questions as $index => $q) {
            $prompt .= ($index + 1) . ". " . $q['title'];

            if (!empty($q['required'])) {
                $prompt .= " (REQUIRED)";
            }

            if (!empty($q['options'])) {
                $options = array_column($q['options'], 'label');
                $prompt .= "\n   Valid options: " . implode(', ', $options);
                $prompt .= "\n   (Accept partial or informal answers - e.g., 'online' for 'Online Search', 'friend' for 'Friend/Colleague')";
            }

            if (!empty($q['help_text'])) {
                $prompt .= "\n   Help: " . $q['help_text'];
            }

            $prompt .= "\n\n";
        }

        $prompt .= "CRITICAL INSTRUCTIONS:\n";
        $prompt .= "- Use the field labels shown above as a guide, but rephrase them naturally if they sound generic or technical\n";
        $prompt .= "- If a label is generic (like 'Textarea', 'Text Input', 'Message', 'Input', 'Field'), rephrase it conversationally\n";
        $prompt .= "- Use the 'Help' text (if provided) to understand the field's purpose and ask a more natural question\n";
        $prompt .= "  Examples of rephrasing generic labels:\n";
        $prompt .= "    * 'Textarea' → 'What would you like to share with us?' or 'Please tell us more'\n";
        $prompt .= "    * 'Message' → 'What's your message?' or 'How can we help you?'\n";
        $prompt .= "    * 'Comments' → 'Do you have any comments or feedback?'\n";
        $prompt .= "    * 'Text Input' → 'Could you provide some details?'\n";
        $prompt .= "    * 'Your Name' → 'What's your name?' or 'May I have your name?'\n";
        $prompt .= "- If a label is already clear and specific (like 'What is your email address?'), use it as-is or slightly rephrase for flow\n";
        $prompt .= "- NEVER mention technical field names, field types, or internal identifiers (like 'input_email', 'textarea', 'input_text')\n";
        $prompt .= "- Ask ONE question at a time by default\n";
        $prompt .= "- Be conversational, friendly, and natural - imagine you're having a real conversation\n";
        $prompt .= "- If the user provides information for MULTIPLE fields in one message, acknowledge ALL the information they provided\n";
        $prompt .= "- Only ask for fields that haven't been answered yet\n";
        $prompt .= "- NEVER re-ask for information that has already been collected - you will be shown collected values separately\n";
        $prompt .= "- If the user provides information you already have, acknowledge it politely but don't save it again\n";
        $prompt .= "- Extract answers from the user's natural language response\n";
        $prompt .= "- If validation fails, explain the error clearly and ask the user to provide a corrected value\n";
        $prompt .= "- If an answer is unclear, politely ask again\n";
        $prompt .= "- After collecting ALL required information, thank the user and let them know their response has been submitted\n";
        $prompt .= "- DO NOT ask for confirmation - the form will be submitted automatically\n";
        $prompt .= "- DO NOT ask follow-up questions or request additional details after all fields are completed\n";
        $prompt .= "- Once all fields are filled, STOP asking questions and end the conversation with a thank you message\n";
        $prompt .= "- Keep responses concise and engaging\n";

        // Add field-specific instructions ONLY for the current field type
        if ($currentField) {
            $fieldType = Arr::get($currentField, 'ff_input_type');
            $fieldSpecificInstruction = $this->getFieldSpecificInstruction($fieldType, $currentField);

            if ($fieldSpecificInstruction) {
                $prompt .= "\n=== FIELD-SPECIFIC INSTRUCTION ===\n";
                $prompt .= "For the current field you're asking about, follow this format requirement:\n\n";
                $prompt .= $fieldSpecificInstruction . "\n";
            }
        }

        // Add Static Question Instructions if enabled
        $generationMode = Arr::get($aiConfig, 'question_generation_mode', 'dynamic');
        $staticQuestions = Arr::get($aiConfig, 'static_questions', []);

        if ($generationMode === 'static' && !empty($staticQuestions)) {
            $prompt .= "\nSTRICT QUESTION PHRASING:\n";
            $prompt .= "When you decide to ask for the following fields, you MUST use the exact phrasing provided below. Do not rephrase or vary the wording.\n";

            foreach ($questions as $q) {
                if (!empty($staticQuestions[$q['name']])) {
                    $prompt .= "- Field '{$q['title']}': \"{$staticQuestions[$q['name']]}\"\n";
                }
            }

            $prompt .= "CRITICAL: You must use these EXACT questions when asking for these fields.\n";
        }

        return $prompt;
    }

    /**
     * Get field-specific instruction for a given field type
     *
     * @param string $fieldType Field type (ff_input_type)
     * @param array|null $field Field configuration (for format-specific instructions)
     * @return string|null Field-specific instruction or null if not applicable
     */
    private function getFieldSpecificInstruction($fieldType, $field = null)
    {
        switch ($fieldType) {
            case 'input_name':
                return "NAME FIELD:\n" .
                       "   - Ask for the COMPLETE name in ONE question\n" .
                       "   - Example: 'What's your full name?' → User: 'John Michael Smith'\n" .
                       "   - Accept names in any format: 'First Last', 'First Middle Last', 'Last, First', etc.\n" .
                       "   - The system will automatically parse into first_name, middle_name, last_name";

            case 'address':
                return "ADDRESS FIELD:\n" .
                       "   - Ask for the COMPLETE address in ONE question\n" .
                       "   - Example: 'What's your complete address?' → User: 'Lukman Nakib, 47, Jallarpar Sylhet Sadar, Sylhet, 01711429264'\n" .
                       "   - Accept addresses in any format (with name, street, city, postal code, phone, country, etc.)\n" .
                       "   - The system will automatically parse into address_line_1, city, state, zip, country";

            case 'input_email':
                return "EMAIL FIELD:\n" .
                       "   - Ask for email address\n" .
                       "   - Example: 'What's your email address?' → User: 'john@example.com'\n" .
                       "   - Accept emails in natural language: 'My email is john@example.com' or just 'john@example.com'";

            case 'phone':
                return "PHONE FIELD:\n" .
                       "   - Ask for phone number\n" .
                       "   - Example: 'What's your phone number?' → User: '+1 (555) 123-4567' or '01711429264'\n" .
                       "   - Accept any phone format: with/without country code, with/without separators";

            case 'input_radio':
            case 'input_checkbox':
            case 'select':
                return "CHOICE FIELD:\n" .
                       "   - Present the available options clearly\n" .
                       "   - Example: 'How did you hear about us? (Website, Friend/Colleague, Online Search)'\n" .
                       "   - Accept partial matches: 'online' matches 'Online Search', 'friend' matches 'Friend/Colleague'\n" .
                       "   - For checkboxes, allow multiple selections: 'Website and Friend'";

            case 'input_date':
                // Get the configured date format
                $dateFormat = 'd/m/Y'; // Default
                if ($field) {
                    $dateFormat = Arr::get($field, 'settings.date_format', 'd/m/Y');
                }

                // Convert PHP date format to human-readable examples
                $formatExample = $this->getDateFormatExample($dateFormat);

                return "DATE FIELD:\n" .
                       "   - Ask for date in natural language\n" .
                       "   - Accept various formats: 'December 25, 2024', '12/25/2024', 'tomorrow', '14th this month', etc.\n" .
                       "   - IMPORTANT: When extracting the date, you MUST format it as: {$formatExample}\n" .
                       "   - Required format: {$dateFormat}\n" .
                       "   - Examples:\n" .
                       "     * User says 'tomorrow' → Extract as: " . date($dateFormat, strtotime('tomorrow')) . "\n" .
                       "     * User says 'December 25, 2024' → Extract as: " . date($dateFormat, strtotime('2024-12-25')) . "\n" .
                       "     * User says '14th this month' → Extract as: " . date($dateFormat, mktime(0, 0, 0, date('n'), 14, date('Y')));

            case 'input_number':
                return "NUMBER FIELD:\n" .
                       "   - Ask for numeric value\n" .
                       "   - Example: 'How many tickets do you need?' → User: '3' or 'three'\n" .
                       "   - Accept numbers in words or digits";

            case 'textarea':
                return "TEXT AREA FIELD:\n" .
                       "   - Ask for detailed text response\n" .
                       "   - Example: 'Please describe your issue in detail'\n" .
                       "   - Accept multi-line responses";

            default:
                return null;
        }
    }

    /**
     * Get human-readable date format example
     *
     * @param string $format PHP date format
     * @return string Example date in the given format
     */
    private function getDateFormatExample($format)
    {
        // Use a fixed date for consistent examples: December 25, 2024
        return date($format, strtotime('2024-12-25'));
    }

    /**
     * Generate static questions for all fields
     *
     * @param array $questions Form questions
     * @param string $formTitle Form title
     * @param array $aiConfig AI configuration
     * @return array Generated questions keyed by field name
     */
    public function generateStaticQuestions($questions, $formTitle, $aiConfig)
    {
        $this->initializeOpenAi($aiConfig);

        $prompt = "You are a friendly form assistant for the form: '{$formTitle}'.\n";
        $prompt .= "Generate a friendly, natural, and conversational question for EACH of the following fields.\n";
        $prompt .= "The question should be what you would ask the user to get this information.\n\n";
        $prompt .= "Fields:\n";

        foreach ($questions as $q) {
            $prompt .= "- Name: {$q['name']}, Label: {$q['title']}";
            if (!empty($q['help_text'])) {
                $prompt .= ", Context: {$q['help_text']}";
            }
            $prompt .= "\n";
        }

        $prompt .= "\nReturn ONLY a JSON object where keys are field names and values are the generated questions.\n";
        $prompt .= "Example: {\"first_name\": \"What is your first name?\", \"email\": \"Could you please share your email address?\"}";

        $messages = [
            ['role' => 'system', 'content' => 'You are a JSON generator. Return only valid JSON.'],
            ['role' => 'user', 'content' => $prompt]
        ];

        $response = $this->openAiService->chat($messages);
        $content = $this->openAiService->extractMessage($response);

        // Extract JSON from response (in case of markdown code blocks)
        if (preg_match('/\{.*\}/s', $content, $matches)) {
            $content = $matches[0];
        }

        $generated = json_decode($content, true);

        if (!is_array($generated)) {
            // Fallback: use labels as questions if generation failed
            $generated = [];
            foreach ($questions as $q) {
                $generated[$q['name']] = "What is your {$q['title']}?";
            }
        }

        return $generated;
    }

    /**
     * Generate first message
     *
     * @param string $systemPrompt System prompt
     * @param array $questions Form questions
     * @return string First message
     */
    private function generateFirstMessage($systemPrompt, $questions)
    {
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => 'Start the conversation'],
        ];

        $response = $this->openAiService->chat($messages);
        return $this->openAiService->extractMessage($response);
    }

    /**
     * Build messages array for OpenAI
     *
     * @param array $conversation Conversation history
     * @param string $userMessage Current user message
     * @param array $questions All questions
     * @param array $session Session state
     * @param array $aiConfig AI configuration
     * @return array Messages array
     */
    private function buildMessages($conversation, $userMessage, $questions, $session, $aiConfig)
    {
        // Get current field for field-specific instructions
        $currentFieldName = Arr::get($session, 'current_field');
        $currentField = null;
        if ($currentFieldName) {
            $currentField = $this->getFieldByName($questions, $currentFieldName);
        }

        $systemPrompt = $this->generateSystemPrompt(
            $questions,
            Arr::get($session, 'form_title', ''),
            $aiConfig,
            $currentField
        );

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        // Add progress context to help AI understand where we are
        $completedFields = Arr::get($session, 'fields_completed', []);
        $totalFields = count($questions);
        $completedCount = count($completedFields);

        // Always add progress context to help AI understand where we are
        $progressContext = "PROGRESS: {$completedCount} out of {$totalFields} fields completed. ";
        if ($completedCount < $totalFields) {
            $progressContext .= "Continue asking questions until ALL {$totalFields} fields are completed. DO NOT say the form is submitted until all fields are done.";
        } else {
            $progressContext .= "All {$totalFields} fields are now completed. STOP asking questions. Thank the user and confirm their response has been submitted. DO NOT ask for additional information or follow-up questions.";
        }

        $messages[] = [
            'role' => 'system',
            'content' => $progressContext,
        ];

        // Add collected values context to prevent duplicate questions
        $submissionId = Arr::get($session, 'submission_id');
        if ($submissionId) {
            $fieldMappings = $this->metaStorage->getFieldMappings($submissionId);
            if (!empty($fieldMappings)) {
                $collectedContext = "✅ ALREADY COLLECTED VALUES - DO NOT ASK AGAIN:\n";
                foreach ($fieldMappings as $fieldName => $mapping) {
                    $field = $this->getFieldByName($questions, $fieldName);
                    if ($field) {
                        $value = $mapping['extracted_value'];
                        if (is_array($value)) {
                            $value = json_encode($value);
                        }
                        $collectedContext .= "✓ {$field['title']}: {$value}\n";
                    }
                }
                $collectedContext .= "\n🚫 CRITICAL RULES:\n";
                $collectedContext .= "- NEVER ask for these fields again\n";
                $collectedContext .= "- If user mentions these values, acknowledge but don't re-collect\n";
                $collectedContext .= "- Only ask for the NEXT unanswered field\n";
                $collectedContext .= "- These values are permanently saved and cannot be changed in this conversation";

                $messages[] = [
                    'role' => 'system',
                    'content' => $collectedContext,
                ];
            }
        }

        // Add conversation history (last 10 messages to save tokens)
        $recentConversation = array_slice($conversation, -10);
        foreach ($recentConversation as $msg) {
            $messages[] = [
                'role' => $msg['role'],
                'content' => $msg['content'],
            ];
        }

        // Add current user message
        $messages[] = [
            'role' => 'user',
            'content' => $userMessage,
        ];

        // Add CURRENT FOCUS context AFTER user message for maximum impact
        // This ensures AI responds about the CORRECT field, not what it asked about previously
        $currentFieldName = Arr::get($session, 'current_field');
        if ($currentFieldName) {
            $currentField = $this->getFieldByName($questions, $currentFieldName);
            if ($currentField) {
                $focusContext = "🎯 CRITICAL INSTRUCTION - CURRENT FIELD TO ASK ABOUT:\n";
                $focusContext .= "The field '{$currentField['title']}' (name: {$currentField['name']}) is the NEXT field that needs a value.\n";
                $focusContext .= "Your response MUST ask the user for this specific field.\n";
                $focusContext .= "IGNORE any previous questions you asked - assume those fields are already completed.\n";
                $focusContext .= "DO NOT ask about any other fields. ONLY ask about '{$currentField['title']}'.";

                $messages[] = [
                    'role' => 'system',
                    'content' => $focusContext,
                ];
            }
        }

        return $messages;
    }

    /**
     * Extract field value from user message (single field)
     *
     * @param string $userMessage User message
     * @param array $field Current field
     * @param string $aiResponse AI response
     * @return mixed|null Extracted value or null
     */
    private function extractFieldValue($userMessage, $field, $aiResponse)
    {
        // Check if AI response indicates rejection/clarification needed
        // Be more specific to avoid false positives
        $rejectionIndicators = [
            'invalid email', 'invalid format', 'incorrect format',
            'please provide a valid', 'try again with',
            'not a valid', 'doesn\'t look like a valid',
            'must be a valid', 'should be a valid',
        ];

        $lowerResponse = $aiResponse ? strtolower($aiResponse) : '';

        // Check for rejection first - only if it's clearly asking for correction
        if ($lowerResponse) {
            foreach ($rejectionIndicators as $indicator) {
                if (stripos($lowerResponse, $indicator) !== false) {
                    return null; // AI is asking for clarification
                }
            }
        }

        // Use AI to extract the actual value from natural language
        $extractionPrompt = "Extract ONLY the value for the field '{$field['title']}' from this user message: \"{$userMessage}\"\n\n";
        $extractionPrompt .= "IMPORTANT: Return ONLY the user's actual answer from their message. Do NOT return field types, labels, or any other metadata.\n";
        $extractionPrompt .= "Return ONLY the extracted value, nothing else. No explanations, no extra text.\n\n";

        // Use ff_input_type (original FluentForm element type) for field-specific instructions
        $ffInputType = Arr::get($field, 'ff_input_type', '');

        switch ($ffInputType) {
            case 'input_name':
                $extractionPrompt .= "Extract the COMPLETE name from the user's message.\n";
                $extractionPrompt .= "Include ALL name parts provided: first name, middle name, last name.\n";
                $extractionPrompt .= "Return the full name exactly as provided by the user.\n";
                $extractionPrompt .= "Examples:\n";
                $extractionPrompt .= "  - 'John Smith' → 'John Smith'\n";
                $extractionPrompt .= "  - 'John Michael Smith' → 'John Michael Smith'\n";
                $extractionPrompt .= "  - 'My name is Sarah Johnson' → 'Sarah Johnson'\n";
                break;

            case 'address':
                $extractionPrompt .= "Extract the COMPLETE address from the user's message.\n";
                $extractionPrompt .= "Include ALL details provided: name, street number, street name, area, city, state/division, postal code, country, phone number.\n";
                $extractionPrompt .= "Return the full address exactly as provided by the user.\n";
                $extractionPrompt .= "Examples:\n";
                $extractionPrompt .= "  - 'Lukman Nakib, 47, Jallarpar Sylhet Sadar, Sylhet, 01711429264' → 'Lukman Nakib, 47, Jallarpar Sylhet Sadar, Sylhet, 01711429264'\n";
                $extractionPrompt .= "  - '123 Main St, New York, NY 10001' → '123 Main St, New York, NY 10001'\n";
                break;

            case 'input_email':
                $extractionPrompt .= "Extract only the email address from the user's message.\n";
                $extractionPrompt .= "Examples:\n";
                $extractionPrompt .= "  - 'My email is john@example.com' → 'john@example.com'\n";
                $extractionPrompt .= "  - 'john@example.com' → 'john@example.com'\n";
                break;

            case 'phone':
                $extractionPrompt .= "Extract only the phone number from the user's message.\n";
                $extractionPrompt .= "Include country code, area code, and number as provided.\n";
                $extractionPrompt .= "Examples:\n";
                $extractionPrompt .= "  - 'My phone is +1 (555) 123-4567' → '+1 (555) 123-4567'\n";
                $extractionPrompt .= "  - '01711429264' → '01711429264'\n";
                break;

            case 'input_text':
                $extractionPrompt .= "Extract only the text value from the user's message.\n";
                break;

            case 'textarea':
                $extractionPrompt .= "Extract the full text response from the user's message.\n";
                break;

            case 'input_number':
                $extractionPrompt .= "Extract only the numeric value from the user's message.\n";
                $extractionPrompt .= "Convert words to numbers if needed (e.g., 'three' → '3').\n";
                break;

            case 'input_date':
                // Get the configured date format
                $dateFormat = Arr::get($field, 'settings.date_format', 'd/m/Y');

                // Get example date in the required format
                $formatExample = date($dateFormat, strtotime('2024-12-25'));

                $extractionPrompt .= "Extract the date from the user's message and format it EXACTLY as: {$dateFormat}\n";
                $extractionPrompt .= "CRITICAL: You MUST return the date in this EXACT format: {$formatExample} (format: {$dateFormat})\n\n";
                $extractionPrompt .= "Accept dates in any natural language format:\n";
                $extractionPrompt .= "  - 'December 25, 2024' or '12/25/2024' or '2024-12-25'\n";
                $extractionPrompt .= "  - 'tomorrow', 'next Monday', 'in 3 days'\n";
                $extractionPrompt .= "  - '14th this month', '1st of next month'\n\n";
                $extractionPrompt .= "But ALWAYS return in format: {$dateFormat}\n";
                $extractionPrompt .= "Examples of correct output:\n";
                $extractionPrompt .= "  - User: 'tomorrow' → You return: '" . date($dateFormat, strtotime('tomorrow')) . "'\n";
                $extractionPrompt .= "  - User: 'December 25, 2024' → You return: '" . date($dateFormat, strtotime('2024-12-25')) . "'\n";
                $extractionPrompt .= "  - User: '14th this month' → You return: '" . date($dateFormat, mktime(0, 0, 0, date('n'), 14, date('Y'))) . "'\n";
                break;

            case 'input_checkbox':
            case 'input_radio':
            case 'select':
                $extractionPrompt .= "Extract the user's choice/selection from their message.\n";

                // Include available options if present
                if (!empty($field['options'])) {
                    $options = array_column($field['options'], 'label');
                    $extractionPrompt .= "Valid options are: " . implode(', ', $options) . "\n";
                    $extractionPrompt .= "IMPORTANT: Match the user's answer to the CLOSEST option, even if they use partial words or informal language.\n";
                    $extractionPrompt .= "For example: 'online' should match 'Online Search', 'friend' should match 'Friend/Colleague', 'web' should match 'Website'.\n";
                    $extractionPrompt .= "Return the EXACT option label from the list above.\n";
                }
                break;

            default:
                $extractionPrompt .= "Extract the value from the user's message.\n";
                break;
        }

        $extractionMessages = [
            ['role' => 'system', 'content' => 'You are a data extraction assistant. Extract only the requested value from user messages.'],
            ['role' => 'user', 'content' => $extractionPrompt],
        ];

        $extractionResponse = $this->openAiService->chat($extractionMessages);
        $extractedValue = trim($this->openAiService->extractMessage($extractionResponse));

        // Check if AI couldn't extract a value (common responses when no value found)
        $noValueIndicators = [
            'no value', 'not provided', 'not mentioned', 'not specified',
            'cannot extract', 'unable to extract', 'no information',
            'not available', 'n/a', 'none', 'null'
        ];

        $lowerExtracted = strtolower($extractedValue);
        foreach ($noValueIndicators as $indicator) {
            if (stripos($lowerExtracted, $indicator) !== false) {
                return null; // AI couldn't extract a value
            }
        }

        return $this->cleanFieldValue($extractedValue, $field);
    }

    /**
     * Clean and format field value based on field type
     *
     * @param string $value Raw value
     * @param array $field Field configuration
     * @return mixed Cleaned value
     */
    private function cleanFieldValue($value, $field)
    {
        $value = trim($value);
        // Use ff_input_type (original FluentForm element type) instead of non-existent field_type
        $fieldType = Arr::get($field, 'ff_input_type');

        switch ($fieldType) {
            case 'input_name':
                // Parse full name into first_name, middle_name, last_name
                // FluentForm expects: ['first_name' => 'John', 'middle_name' => 'Michael', 'last_name' => 'Smith']
                return $this->parseNameField($value, $field);

            case 'address':
                // Parse address into structured format
                // FluentForm expects: ['address_line_1' => '...', 'city' => '...', 'state' => '...', 'zip' => '...', 'country' => '...']
                return $this->parseAddressField($value, $field);

            case 'input_email':
                // Extract email if embedded in text
                if (preg_match('/[\w\-\.]+@[\w\-\.]+\.\w+/', $value, $matches)) {
                    return $matches[0];
                }
                return $value;

            case 'input_url':
                // Ensure URL has protocol
                if (!preg_match('/^https?:\/\//', $value)) {
                    return 'https://' . $value;
                }
                return $value;

            case 'input_number':
                // Extract numeric value
                return preg_replace('/[^0-9.-]/', '', $value);

            case 'phone':
                // Extract phone number
                return preg_replace('/[^0-9+\-() ]/', '', $value);

            case 'input_date':
                // Parse and format date according to field's date_format setting
                return $this->parseDateField($value, $field);

            case 'input_checkbox':
            case 'input_radio':
            case 'select':
                // Convert label to value for choice fields
                // AI extracts the label (e.g., "Yes") but FluentForm expects the value (e.g., "yes")
                if (!empty($field['options'])) {
                    // Try exact match first (case-insensitive)
                    foreach ($field['options'] as $option) {
                        if (strcasecmp($option['label'], $value) === 0) {
                            return $option['value'];
                        }
                    }

                    // Try partial match (case-insensitive)
                    $valueLower = strtolower($value);
                    foreach ($field['options'] as $option) {
                        $labelLower = strtolower($option['label']);
                        if (strpos($labelLower, $valueLower) !== false || strpos($valueLower, $labelLower) !== false) {
                            return $option['value'];
                        }
                    }
                }
                return $value;

            default:
                return $value;
        }
    }

    /**
     * Parse name field value into structured format
     * Converts "John Michael Smith" into ['first_name' => 'John', 'middle_name' => 'Michael', 'last_name' => 'Smith']
     *
     * @param string $value Full name string
     * @param array $field Field configuration
     * @return array Structured name data
     */
    private function parseNameField($value, $field)
    {
        // Get visible fields from the name field configuration
        $visibleFields = [];
        if (!empty($field['fields'])) {
            foreach ($field['fields'] as $subField) {
                if (!empty($subField['settings']['visible'])) {
                    $visibleFields[] = Arr::get($subField, 'attributes.name');
                }
            }
        }

        // Default visible fields if not specified
        if (empty($visibleFields)) {
            $visibleFields = ['first_name', 'last_name'];
        }

        // Split name into parts
        $nameParts = array_filter(preg_split('/\s+/', trim($value)));
        $result = [];

        // Parse based on visible fields
        if (in_array('first_name', $visibleFields)) {
            $result['first_name'] = array_shift($nameParts) ?: '';
        }

        if (in_array('middle_name', $visibleFields) && count($nameParts) > 1) {
            $result['middle_name'] = array_shift($nameParts) ?: '';
        }

        if (in_array('last_name', $visibleFields)) {
            // Remaining parts are last name
            $result['last_name'] = implode(' ', $nameParts) ?: '';
        }

        return $result;
    }

    /**
     * Parse date field value and format according to field's date_format setting
     * Converts natural language dates to the configured format
     *
     * @param string $value Date string in any format
     * @param array $field Field configuration
     * @return string Formatted date string
     */
    private function parseDateField($value, $field)
    {
        // Get the configured date format from field settings
        $dateFormat = Arr::get($field, 'settings.date_format', 'd/m/Y');

        // Clean up the input value
        $value = trim($value);

        // First, check if the value is already in the correct format
        // Try to parse it with the expected format
        $date = \DateTime::createFromFormat($dateFormat, $value);
        if ($date !== false && $date->format($dateFormat) === $value) {
            // Value is already in the correct format, return as-is
            return $value;
        }

        // If not in correct format, try to parse and reformat
        // This is a fallback in case AI didn't format it correctly

        // Handle special patterns like "14th this month", "1st of next month", etc.
        if (preg_match('/^(\d+)(st|nd|rd|th)?\s+(of\s+)?(this|next|last)\s+month$/i', $value, $matches)) {
            $day = (int)$matches[1];
            $modifier = strtolower($matches[4]); // this, next, or last

            // Get the target month
            if ($modifier === 'this') {
                $month = date('n'); // Current month
                $year = date('Y');
            } elseif ($modifier === 'next') {
                $month = date('n', strtotime('next month'));
                $year = date('Y', strtotime('next month'));
            } else { // last
                $month = date('n', strtotime('last month'));
                $year = date('Y', strtotime('last month'));
            }

            // Create the date
            $timestamp = mktime(0, 0, 0, $month, $day, $year);
        } else {
            // Remove ordinal suffixes (st, nd, rd, th) for better parsing
            $cleanValue = preg_replace('/(\d+)(st|nd|rd|th)\b/i', '$1', $value);

            // Try to parse the date using strtotime
            $timestamp = strtotime($cleanValue);

            if ($timestamp === false) {
                // If strtotime fails, try some common formats manually
                $commonFormats = [
                    'Y-m-d',
                    'm/d/Y',
                    'd/m/Y',
                    'd.m.Y',
                    'Y/m/d',
                    'F j, Y',
                    'M j, Y',
                    'j F Y',
                    'j M Y',
                    'd F Y',
                    'd M Y',
                ];

                foreach ($commonFormats as $format) {
                    $date = \DateTime::createFromFormat($format, $cleanValue);
                    if ($date !== false) {
                        $timestamp = $date->getTimestamp();
                        break;
                    }
                }
            }
        }

        // If we still couldn't parse it, return the original value
        if ($timestamp === false || $timestamp === null) {
            return $value;
        }

        // Check if the format includes time
        $hasTime = $this->hasTimeInFormat($dateFormat);

        // Format the date according to the configured format
        $formattedDate = date($dateFormat, $timestamp);

        return $formattedDate;
    }

    /**
     * Check if date format includes time
     *
     * @param string $format Date format string
     * @return bool True if format includes time
     */
    private function hasTimeInFormat($format)
    {
        // Check for time indicators in format: h, H, i, s, K (AM/PM)
        return preg_match('/[hHisK]/', $format) === 1;
    }

    /**
     * Parse address field value into structured format
     * Converts "123 Main St, New York, NY 10001" into structured address array
     *
     * @param string $value Full address string
     * @param array $field Field configuration
     * @return array Structured address data
     */
    private function parseAddressField($value, $field)
    {
        // Get visible fields from the address field configuration
        $visibleFields = [];
        if (!empty($field['fields'])) {
            foreach ($field['fields'] as $subField) {
                if (!empty($subField['settings']['visible'])) {
                    $visibleFields[] = Arr::get($subField, 'attributes.name');
                }
            }
        }

        // Default visible fields if not specified
        if (empty($visibleFields)) {
            $visibleFields = ['address_line_1', 'address_line_2', 'city', 'state', 'zip', 'country'];
        }

        $result = [];

        // Simple parsing: split by comma and try to identify parts
        $parts = array_map('trim', explode(',', $value));

        // Try to extract postal code (5 digits or 5+4 format)
        $zip = '';
        foreach ($parts as $i => $part) {
            if (preg_match('/\b\d{5}(?:-\d{4})?\b/', $part, $matches)) {
                $zip = $matches[0];
                $parts[$i] = trim(str_replace($zip, '', $part));
                break;
            }
        }

        // Try to extract phone number
        $phone = '';
        foreach ($parts as $i => $part) {
            if (preg_match('/[\d\+\-\(\)\s]{10,}/', $part, $matches)) {
                $phone = trim($matches[0]);
                $parts[$i] = trim(str_replace($phone, '', $part));
                break;
            }
        }

        // Remove empty parts
        $parts = array_values(array_filter($parts));

        // Assign parts to fields based on what's visible
        $partIndex = 0;

        if (in_array('address_line_1', $visibleFields) && isset($parts[$partIndex])) {
            $result['address_line_1'] = $parts[$partIndex++];
        }

        if (in_array('address_line_2', $visibleFields) && isset($parts[$partIndex]) && count($parts) > 3) {
            $result['address_line_2'] = $parts[$partIndex++];
        }

        if (in_array('city', $visibleFields) && isset($parts[$partIndex])) {
            $result['city'] = $parts[$partIndex++];
        }

        if (in_array('state', $visibleFields) && isset($parts[$partIndex])) {
            $result['state'] = $parts[$partIndex++];
        }

        if (in_array('zip', $visibleFields) && $zip) {
            $result['zip'] = $zip;
        }

        if (in_array('country', $visibleFields) && isset($parts[$partIndex])) {
            $result['country'] = $parts[$partIndex++];
        }

        return $result;
    }

    /**
     * Prepare form object for Converter
     *
     * @param object $form Form database object
     * @return object Prepared form object
     */
    private function prepareForm($form)
    {
        // Get form_fields - handle both string and array cases
        $formFields = $form->form_fields;

        // Decode form_fields if it's a string
        if (is_string($formFields)) {
            $formFields = json_decode($formFields, true);
        } elseif (is_array($formFields)) {
            // Already an array, use as-is
            // This can happen if the form object was already processed
        } else {
            // Unexpected type, initialize empty
            $formFields = ['fields' => [], 'submitButton' => []];
        }

        // Ensure fields structure exists
        if (!isset($formFields['fields'])) {
            $formFields = ['fields' => [], 'submitButton' => []];
        }

        // Ensure fields is an array
        if (!isset($formFields['fields'])) {
            $formFields['fields'] = [];
        }

        // Create a new object with the required structure
        $formObj = (object) [
            'id' => $form->id,
            'title' => $form->title,
            'fields' => $formFields,
        ];

        return $formObj;
    }

    /**
     * Get field by name from questions array
     *
     * @param array $questions Questions array
     * @param string $fieldName Field name to find
     * @return array|null Field data or null if not found
     */
    private function getFieldByName($questions, $fieldName)
    {
        foreach ($questions as $question) {
            if ($question['name'] === $fieldName) {
                return $question;
            }
        }
        return null;
    }

    /**
     * Get next unanswered field
     *
     * @param array $questions All questions
     * @param array $completedFields Completed field names
     * @return array|null Next field or null if all completed
     */
    private function getNextField($questions, $completedFields = [])
    {
        // Non-input field types that should be skipped
        // These are display-only types, not actual input fields
        $skipTypes = [
            'FlowFormSectionBreakType',
            'FlowFormStepType',
            'FlowFormHtmlType',
            'section_break',
            'custom_html',
        ];

        foreach ($questions as $question) {
            // Skip non-input fields (section breaks, HTML blocks, etc.)
            $questionType = Arr::get($question, 'type', '');
            if (in_array($questionType, $skipTypes)) {
                continue;
            }

            // Skip fields with empty names
            if (empty($question['name'])) {
                continue;
            }

            // Return first unanswered field
            if (!in_array($question['name'], $completedFields)) {
                return $question;
            }
        }
        return null;
    }

    /**
     * Count only input fields (exclude section breaks, HTML blocks, etc.)
     *
     * @param array $questions All questions
     * @return int Number of input fields
     */
    private function countInputFields($questions)
    {
        // Non-input field types that should be skipped
        // These are display-only types, not actual input fields
        $skipTypes = [
            'FlowFormSectionBreakType',
            'FlowFormStepType',
            'FlowFormHtmlType',
            'section_break',
            'custom_html',
        ];

        $count = 0;
        foreach ($questions as $question) {
            $questionType = Arr::get($question, 'type', '');

            // Skip non-input fields
            if (in_array($questionType, $skipTypes)) {
                continue;
            }

            // Skip fields with empty names
            if (empty($question['name'])) {
                continue;
            }

            $count++;
        }

        return $count;
    }

    /**
     * Check if field is an address field
     *
     * @param array $field Field data
     * @return bool True if address field
     */
    private function isAddressField($field)
    {
        // Use ff_input_type (original FluentForm element type) instead of non-existent field_type
        $fieldType = Arr::get($field, 'ff_input_type', '');
        $fieldName = Arr::get($field, 'name', '');
        $fieldTitle = Arr::get($field, 'title', '');

        return $fieldType === 'address' ||
               stripos($fieldName, 'address') !== false ||
               stripos($fieldTitle, 'address') !== false;
    }

    /**
     * Parse full address into components
     *
     * @param string $fullAddress Full address string
     * @param array $field Field data
     * @return array Address components
     */
    private function parseAddress($fullAddress, $field)
    {
        // For address fields, try to extract components
        // This is a simple implementation - can be enhanced with geocoding API

        $components = [];

        // Try to extract zip/postal code (numbers at end)
        if (preg_match('/\b(\d{4,6})\b/', $fullAddress, $matches)) {
            $components['zip'] = $matches[1];
        }

        // Try to extract country (last word if it's a known country)
        $countries = ['Bangladesh', 'India', 'USA', 'United States', 'UK', 'United Kingdom', 'Canada', 'Australia', 'Pakistan', 'Nepal', 'Sri Lanka'];
        foreach ($countries as $country) {
            if (stripos($fullAddress, $country) !== false) {
                $components['country'] = $country;
                break;
            }
        }

        // Store full address as-is
        $components['full_address'] = $fullAddress;

        return $components;
    }
}

