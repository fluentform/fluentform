<?php

namespace FluentForm\App\Services\Form;

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\FormMeta;
use FluentForm\App\Modules\Form\AkismetHandler;
use FluentForm\App\Modules\Form\FormFieldsParser;
use FluentForm\App\Modules\HCaptcha\HCaptcha;
use FluentForm\App\Modules\ReCaptcha\ReCaptcha;
use FluentForm\App\Modules\Turnstile\Turnstile;
use FluentForm\Framework\Foundation\App;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;
use FluentForm\Framework\Validator\ValidationException;

class FormValidationService
{
    protected $app;
    protected $form;
    protected $formData;
    
    public function __construct()
    {
        $this->app = App::getInstance();
    }
    
    public function setForm($form)
    {
        $this->form = $form;
    }
    
    public function setFormData($formData)
    {
        $this->formData = $formData;
    }
    
    /**
     * @param $fields
     * @return bool
     * @throws ValidationException
     */
    public function validateSubmission(&$fields, &$formData)
    {
        $this->preventMaliciousAttacks();
    
        $this->validateRestrictions($fields);
        
        $this->validateNonce();
        
        $this->validateReCaptcha();
        $this->validateHCaptcha();
        $this->validateTurnstile();
        
        foreach ($fields as $fieldName => $field) {
            if (isset($formData[$fieldName])) {
                $element = $field['element'];
                $formData[$fieldName] = apply_filters('fluentform_input_data_' . $element, $formData[$fieldName], $field, $formData, $this->form);
            }
        }
        
        $originalValidations = FormFieldsParser::getValidations($this->form, $formData, $fields);
        
        // Fire an event so that one can hook into it to work with the rules & messages.
        $validations = apply_filters('fluentform_validations', $originalValidations, $this->form, $formData);
    
        /*
         * Clean talk fix for now
         * They should not hook fluentform_validations and return nothing!
         * We will remove this extra check once it's done
         */
        if ($originalValidations && (!$validations || !array_filter($validations))) {
            $validations = $originalValidations;
        }
        
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
            // Fire an event so that one can hook into it to work with the errors.
            $errors = $this->app->applyFilters('fluentform_validation_error', $errors, $this->form, $fields, $formData);
        }
        
        foreach ($fields as $fieldKey => $field) {
            $field['data_key'] = $fieldKey;
            $inputName = Arr::get($field, 'raw.attributes.name');
            $field['name'] = $inputName;
            $error = apply_filters('fluentform_validate_input_item_' . $field['element'], '', $field, $formData, $fields, $this->form, $errors);
            if ($error) {
                if (empty($errors[$inputName])) {
                    $errors[$inputName] = [];
                }
                if (is_string($error)) {
                    $error = [$error];
                }
                $errors[$inputName] = array_merge($error, $errors[$inputName]);
            }
        }
    
    
        $errors = apply_filters('fluentform_validation_errors', $errors, $formData, $this->form, $fields);
    
        if ('yes' == Helper::getFormMeta($this->form->id, '_has_user_registration') && !get_current_user_id()) {
            $errors = apply_filters('fluentform_validation_user_registration_errors', $errors, $formData, $this->form, $fields);
        }
    
        if ('yes' == Helper::getFormMeta($this->form->id, '_has_user_update') && get_current_user_id()) {
            $errors = apply_filters('fluentform_validation_user_update_errors', $errors, $formData, $this->form, $fields);
        }
        
        if ($errors) {
            throw new ValidationException('', 423, null,  ['errors' => $errors]);
        }
        
        return true;
    }
    
    /**
     * Prevents malicious attacks when the submission
     * count exceeds in an allowed interval.
     * @throws ValidationException
     */
    public function preventMaliciousAttacks()
    {
        $prevent = apply_filters('fluentform/prevent_malicious_attacks', true, $this->form->id);
        
        if ($prevent) {
            $maxSubmissionCount = apply_filters('fluentform/max_submission_count', 5, $this->form->id);
            $minSubmissionInterval = apply_filters('fluentform/min_submission_interval', 30, $this->form->id);
            
            $interval = date('Y-m-d H:i:s', strtotime(current_time('mysql')) - $minSubmissionInterval);
            
            $submissionCount = wpFluent()->table('fluentform_submissions')
                ->where('status', '!=', 'trashed')
                ->where('ip', $this->app->request->getIp())
                ->where('created_at', '>=', $interval)
                ->count();
            
            if ($submissionCount >= $maxSubmissionCount) {
    
                throw new ValidationException('', 429, null,  [
                    'errors' => [
                        'restricted' => [
                            __(apply_filters('fluentform/too_many_requests', 'Too Many Requests.', $this->form->id), 'fluentform'),
                        ],
                    ]
                ]);
            }
        }
    }
    
    /**
     * Validate form data based on the form restrictions settings.
     *
     * @param $fields
     * @throws ValidationException
     */
    private function validateRestrictions(&$fields)
    {
        $formSettings = FormMeta::retrieve('formSettings', $this->form->id);
    
        $this->form->settings = is_array($formSettings) ? $formSettings : [];
    
        $isAllowed = [
            'status'  => true,
            'message' => '',
        ];
        
        // This will check the following restriction settings.
        // 1. limitNumberOfEntries
        // 2. scheduleForm
        // 3. requireLogin
        $isAllowed = apply_filters('fluentform_is_form_renderable', $isAllowed, $this->form);
        
        if (!$isAllowed['status']) {
            throw new ValidationException('', 422, null,  [
                'errors' => [
                    'restricted' => [
                        $isAllowed['message'],
                    ],
                ],
            ]);
        }
        
        // Since we are here, we should now handle if the form should be allowed to submit empty.
        $restrictions = Arr::get($this->form->settings, 'restrictions.denyEmptySubmission', []);
        
        $this->handleDenyEmptySubmission($restrictions, $fields);
    }
    
    /**
     * Handle response when empty form submission is not allowed.
     *
     * @param array $settings
     * @param $fields
     * @throws ValidationException
     */
    private function handleDenyEmptySubmission($settings, &$fields)
    {
        // Determine whether empty form submission is allowed or not.
        if (Arr::get($settings, 'enabled')) {
            // confirm this form has no required fields.
            if (!FormFieldsParser::hasRequiredFields($this->form, $fields)) {
                // Filter out the form data which doesn't have values.
                $filteredFormData = array_filter(
                // Filter out the other meta fields that aren't actual inputs.
                    array_intersect_key($this->formData, $fields)
                );
                
                // TODO: Extract this function into global functions file...
                $arrayFilterRecursive = function ($array) use (&$arrayFilterRecursive) {
                    foreach ($array as $key => $item) {
                        is_array($item) && $array[$key] = $arrayFilterRecursive($item);
                        if (empty($array[$key])) {
                            unset($array[$key]);
                        }
                    }
                    return $array;
                };
                
                if (!count($arrayFilterRecursive($filteredFormData))) {
    
                    throw new ValidationException('', 422, null,  [
                        'errors' => [
                            'restricted' => [
                                __(!($m = Arr::get($settings, 'message')) ? 'Sorry! You can\'t submit an empty form.' : $m, 'fluentform'),
                            ],
                        ],
                    ]);
                }
            }
        }
    }
    
    
    /**
     * Validate nonce.
     * @throws ValidationException
     */
    protected function validateNonce()
    {
        $formId = $this->form->id;
        $shouldVerifyNonce = $this->app->applyFilters('fluentform_nonce_verify', false, $formId);
        
        if ($shouldVerifyNonce) {
            $nonce = Arr::get($this->formData, '_fluentform_' . $formId . '_fluentformnonce');
            if (!wp_verify_nonce($nonce, 'fluentform-submit-form')) {
                $errors = $this->app->applyFilters('fluentForm_nonce_error', [
                    '_fluentformnonce' => [
                        __('Nonce verification failed, please try again.', 'fluentform'),
                    ],
                ]);
                throw new ValidationException('', 422, null, ['errors' => $errors]);
            }
        }
    }
    
    /** Validate Spam
     * @throws ValidationException
     */
    public function handleSpamError()
    {
        $settings = get_option('_fluentform_global_form_settings');
        if (!$settings || 'validation_failed' != ArrayHelper::get($settings, 'misc.akismet_validation')) {
            return;
        }
        
        $errors = [
            '_fluentformakismet' => __('Submission marked as spammed. Please try again', 'fluentform'),
        ];
        throw new ValidationException('', 422, null, ['errors' => $errors]);
    }
    
    public function isSpam($formData, $form)
    {
         if (!AkismetHandler::isEnabled()) {
            return false;
        }
        
        $isSpamCheck = apply_filters('fluentform_akismet_check_spam', true, $form->id, $formData);
        if (!$isSpamCheck) {
            return false;
        }
        // Let's validate now
        $isSpam = AkismetHandler::isSpamSubmission($formData, $form);
        
        return apply_filters('fluentform_akismet_spam_result', $isSpam, $form->id, $formData);
    }
    
    /**
     * Validate reCaptcha.
     * @throws ValidationException
     */
    private function validateReCaptcha()
    {
        $autoInclude = apply_filters('ff_has_auto_recaptcha', false);
        if (FormFieldsParser::hasElement($this->form, 'recaptcha') || $autoInclude) {
            $keys = get_option('_fluentform_reCaptcha_details');
            $token = Arr::get($this->formData, 'g-recaptcha-response');
            $version = 'v2_visible';
            if (!empty($keys['api_version'])) {
                $version = $keys['api_version'];
            }
            $isValid = ReCaptcha::validate($token, $keys['secretKey'], $version);
            
            if (!$isValid) {
                throw new ValidationException('', 422, null, [
                    'errors' => [
                        'g-recaptcha-response' => [
                            __('reCaptcha verification failed, please try again.', 'fluentform'),
                        ],
                    ],
                ]);
            }
        }
    }
    
    /**
     * Validate hCaptcha.
     * @throws ValidationException
     */
    private function validateHCaptcha()
    {
        $autoInclude = apply_filters('ff_has_auto_hcaptcha', false);
        FormFieldsParser::resetData();
        if (FormFieldsParser::hasElement($this->form, 'hcaptcha') || $autoInclude) {
            $keys = get_option('_fluentform_hCaptcha_details');
            $token = Arr::get($this->formData, 'h-captcha-response');
            $isValid = HCaptcha::validate($token, $keys['secretKey']);
            
            if (!$isValid) {
                throw new ValidationException('', 422, null, [
                    'errors' => [
                        'h-captcha-response' => [
                            __('hCaptcha verification failed, please try again.', 'fluentform'),
                        ],
                    ],
                ]);
            }
        }
    }
    
    /**
     * Validate turnstile.
     * @throws ValidationException
     */
    private function validateTurnstile()
    {
        $autoInclude = apply_filters('ff_has_auto_turnstile', false);
        if (FormFieldsParser::hasElement($this->form, 'turnstile') || $autoInclude) {
            $keys = get_option('_fluentform_turnstile_details');
            $token = Arr::get($this->formData, 'cf-turnstile-response');
            
            $isValid = Turnstile::validate($token, $keys['secretKey']);
            
            if (!$isValid) {
                throw new ValidationException('', 422, null, [
                    'errors' => [
                        'cf-turnstile-response' => [
                            __('Turnstile verification failed, please try again.', 'fluentform'),
                        ],
                    ],
                ]);
            }
        }
    }
    
    
    /**
     * Delegate the validation rules & messages to the
     * ones that the validation library recognizes.
     *
     * @param $rules
     * @param $messages
     * @param array $search
     * @param array $replace
     * @return array
     */
    protected function delegateValidations($rules, $messages, $search = [], $replace = [])
    {
        $search = $search ?: ['max_file_size', 'allowed_file_types'];
        $replace = $replace ?: ['max', 'mimes'];
        
        foreach ($rules as &$rule) {
            $rule = str_replace($search, $replace, $rule);
        }
        
        foreach ($messages as $key => $message) {
            $newKey = str_replace($search, $replace, $key);
            $messages[$newKey] = $message;
            unset($messages[$key]);
        }
        
        return [$rules, $messages];
    }
}
