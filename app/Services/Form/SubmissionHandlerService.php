<?php

namespace FluentForm\App\Services\Form;

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\Form;
use FluentForm\App\Models\FormMeta;
use FluentForm\App\Models\Submission;
use FluentForm\App\Modules\Form\FormFieldsParser;
use FluentForm\App\Services\Browser\Browser;
use FluentForm\App\Services\FormBuilder\ShortCodeParser;
use FluentForm\App\Services\Submission\SubmissionService;
use FluentForm\Framework\Foundation\Application;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;
use FluentForm\Framework\Validator\ValidationException;


class SubmissionHandlerService
{
    protected $app;
    protected $form;
    protected $fields;
    protected $formData;
    protected $validationService;
    protected $submissionService;
    
    public function __construct(
        Application $app,
        FormValidationService $formValidationService,
        SubmissionService $submissionService
    ) {
        $this->app = $app;
        $this->validationService = $formValidationService;
        $this->submissionService = $submissionService;
    }
    
    /**
     * Form Submission
     * @param $formDataRaw
     * @param $formId
     * @return array
     * @throws \FluentForm\Framework\Validator\ValidationException
     */
    public function handleSubmission($formDataRaw, $formId)
    {
        $this->prepareHandler($formId, $formDataRaw);
        $insertData = $this->handleValidation();
    
        $insertId = $this->insertSubmission($insertData, $formDataRaw, $formId);
        
        return $this->processSubmissionData($insertId, $this->formData, $this->form);
    }
    
    protected function prepareHandler($formId, $formDataRaw)
    {
        $this->form = Form::find($formId);
        
        if (!$this->form) {
            throw new ValidationException('', 422, null, ['errors' => 'Sorry, No corresponding form found']);
        }
        // Parse the form and get the flat inputs with validations.
        $this->fields = FormFieldsParser::getInputs($this->form, ['rules', 'raw']);
        $this->formData = fluentFormSanitizer($formDataRaw, null, $this->fields);
    }
    
    
    /**
     * Prepare the data to be inserted to the database.
     * @param boolean $formData
     * @return array
     */
    public function prepareInsertData($formData = false)
    {
        $formId = $this->form->id;
        if (!$formData) {
            $formData = $this->formData;
        }
        $previousItem = Submission::where('form_id', $formId)->orderBy('id', 'DESC')->first();
        $serialNumber = 1;
        if ($previousItem) {
            $serialNumber = $previousItem->serial_number + 1;
        }
        $browser = new Browser();
        $inputConfigs = FormFieldsParser::getEntryInputs($this->form, ['admin_label', 'raw']);
        
        $this->formData = apply_filters('fluentform_insert_response_data', $formData, $formId, $inputConfigs);
        
        $ipAddress = $this->app->request->getIp();
        if ((defined('FLUENTFROM_DISABLE_IP_LOGGING') && FLUENTFROM_DISABLE_IP_LOGGING) || apply_filters('fluentform_disable_ip_logging',
                false, $formId)) {
            $ipAddress = false;
        }
        
        $response = [
            'form_id'       => $formId,
            'serial_number' => $serialNumber,
            'response'      => json_encode($this->formData, JSON_UNESCAPED_UNICODE),
            'source_url'    => site_url(Arr::get($formData, '_wp_http_referer')),
            'user_id'       => get_current_user_id(),
            'browser'       => $browser->getBrowser(),
            'device'        => $browser->getPlatform(),
            'ip'            => $ipAddress,
            'created_at'    => current_time('mysql'),
            'updated_at'    => current_time('mysql'),
        ];
        return apply_filters('fluentform_filter_insert_data', $response);
    }
    
    public function processSubmissionData($insertId, $formData, $form)
    {
        if ($insertId) {
            ob_start();
            $this->submissionService->recordEntryDetails($insertId, $form->id, $formData);
            $isError = ob_get_clean();
            if ($isError) {
                FormSubmissionDetails::migrate();
            }
        }
        
        $returnData = $this->getReturnData($insertId, $form, $formData);
        $error = '';
        try {
            $this->app->doAction(
                'fluentform_submission_inserted',
                $insertId,
                $formData,
                $form
            );
            Helper::setSubmissionMeta($insertId, 'is_form_action_fired', 'yes');
            $this->app->doAction(
                'fluentform_submission_inserted_' . $form->type . '_form',
                $insertId,
                $formData,
                $form
            );
        } catch (\Exception $e) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                $error = $e->getMessage();
            }
        }
        
        do_action('fluentform_before_submission_confirmation', $insertId, $formData, $form);
        // removed typo hook : fluenform_before_submission_confirmation was scheduled for 2021
        return [
            'insert_id' => $insertId,
            'result'    => $returnData,
            'error'     => $error,
        ];
    }
    
    /**
     * Return Formatted Response Data
     * @param $insertId
     * @param $form
     * @param $formData
     * @return mixed
     */
    public function getReturnData($insertId, $form, $formData)
    {
        if (empty($form->settings)) {
            $formSettings = FormMeta::retrieve('formSettings', $form->id);
            $form->settings = is_array($formSettings) ? $formSettings : [];
        }
        $confirmation = apply_filters(
            'fluentform_form_submission_confirmation',
            $form->settings['confirmation'],
            $formData,
            $form
        );
        if ('samePage' == Arr::get($confirmation, 'redirectTo')) {
            $confirmation['messageToShow'] = apply_filters('fluentform_submission_message_parse',
                $confirmation['messageToShow'], $insertId, $formData, $form);
            
            $message = ShortCodeParser::parse(
                $confirmation['messageToShow'],
                $insertId,
                $formData,
                $form,
                false,
                true
            );
            $message = $message ? $message : __('The form has been successfully submitted.', 'fluentform');
            $returnData = [
                'message' => do_shortcode($message),
                'action'  => $confirmation['samePageFormBehavior'],
            ];
        } else {
            $redirectUrl = Arr::get($confirmation, 'customUrl');
            if ('customPage' == $confirmation['redirectTo']) {
                $redirectUrl = get_permalink($confirmation['customPage']);
            }
            if (
                ('yes' == Arr::get($confirmation, 'enable_query_string')) &&
                Arr::get($confirmation, 'query_strings')
            ) {
                if (strpos($redirectUrl, '?')) {
                    $redirectUrl .= '&' . Arr::get($confirmation, 'query_strings');
                } else {
                    $redirectUrl .= '?' . Arr::get($confirmation, 'query_strings');
                }
            }
            
            $isUrlParser = apply_filters('fluentform_will_parse_url_value', true, $form);
            $redirectUrl = ShortCodeParser::parse(
                $redirectUrl,
                $insertId,
                $formData,
                $form,
                $isUrlParser
            );
            if ($isUrlParser) {
                /*
                 * For Empty Redirect Value
                 */
                if (strpos($redirectUrl, '=&') || '=' == substr($redirectUrl, -1)) {
                    $urlArray = explode('?', $redirectUrl);
                    $baseUrl = array_shift($urlArray);
                    
                    $query = wp_parse_url($redirectUrl)['query'];
                    
                    $queryParams = explode('&', $query);
                    
                    $params = [];
                    foreach ($queryParams as $queryParam) {
                        $paramArray = explode('=', $queryParam);
                        if (!empty($paramArray[1])) {
                            $params[$paramArray[0]] = $paramArray[1];
                        }
                    }
                    $redirectUrl = add_query_arg($params, $baseUrl);
                }
            }
            
            $message = ShortCodeParser::parse(
                Arr::get($confirmation, 'redirectMessage', ''),
                $insertId,
                $formData,
                $form,
                false,
                true
            );
            
            $returnData = [
                'redirectUrl' => wp_sanitize_redirect(urldecode($redirectUrl)),
                'message'     => $message,
            ];
        }
        
        return $this->app->applyFilters(
            'fluentform_submission_confirmation',
            $returnData,
            $form,
            $confirmation
        );
    }
    
    /**
     * Validates Submission
     * @throws ValidationException
     */
    private function handleValidation()
    {
        /* Now validate the data using the previous validations. */
        $this->validationService->setForm($this->form);
        $this->validationService->setFormData($this->formData);
    
        $this->validationService->validateSubmission($this->fields);
    
        $insertData = $this->prepareInsertData();
        
        if ($this->validationService->isSpam($this->formData, $this->form)) {
            $insertData['status'] = 'spam';
            $this->validationService->handleSpamError();
        }
        return $insertData;
    }
    
    protected function insertSubmission($insertData, $formDataRaw, $formId)
    {
        do_action('fluentform_before_insert_submission', $insertData, $formDataRaw, $this->form);
        
        if ($this->form->has_payment) {
            do_action('fluentform_before_insert_payment_form', $insertData, $formDataRaw, $this->form);
        }
        
        $insertId = Submission::insertGetId($insertData);
    
        do_action('fluentform/notify_on_form_submit', $insertId, $this->formData, $this->form);
        
        $uidHash = md5(wp_generate_uuid4() . $insertId);
        Helper::setSubmissionMeta($insertId, '_entry_uid_hash', $uidHash, $formId);
        
        do_action('fluentform_before_form_actions_processing', $insertId, $this->formData, $this->form);
        
        return $insertId;
    }
    
}
