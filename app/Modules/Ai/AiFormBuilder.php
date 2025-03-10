<?php

namespace FluentForm\App\Modules\Ai;

use Exception;
use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\Form;
use FluentForm\App\Models\FormMeta;
use FluentForm\App\Modules\Acl\Acl;
use FluentForm\App\Modules\Form\FormFieldsParser;
use FluentForm\App\Services\FluentConversational\Classes\Converter\Converter;
use FluentForm\App\Services\Form\FormService;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;
use FluentForm\Framework\Support\Sanitizer;

class AiFormBuilder extends FormService
{
    private $allDefaultFields = [];

    public function __construct()
    {
        parent::__construct();
        add_action('wp_ajax_fluentform_ai_create_form', [$this, 'buildForm'], 11, 0);
    }

    public function buildForm()
    {
        try {
            Acl::verifyNonce();
            $form = $this->generateForm($this->app->request->all());
            $form = $this->prepareAndSaveForm($form);
            wp_send_json_success([
                'formId'       => $form->id,
                'redirect_url' => admin_url(
                    'admin.php?page=fluent_forms&form_id=' . $form->id . '&route=editor'
                ),
                'message'      => __('Successfully created a form.', 'fluentform'),
            ], 200);
        } catch (Exception $e) {
            wp_send_json_error([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * @param array $form
     * @return Form|\FluentForm\Framework\Database\Query\Builder
     * @throws Exception
     */
    protected function prepareAndSaveForm($form)
    {
        $allFields = $this->getDefaultFields();
        $fluentFormFields = [];
        $fields = Arr::get($form, 'fields', []);
        $isConversational = Arr::isTrue($form, 'is_conversational');
        $hasStep = false;
        $lastFieldIndex = count($fields) - 1;

        foreach ($fields as $index => $field) {
            if (count($field) == 1) {
                $field = reset($field);
            }
            if ($element = $this->resolveInput($field)) {
                if (!$hasStep && 'form_step' === $element) {
                    if (0 === $index || $lastFieldIndex === $index) {
                        continue;
                    }
                    $hasStep = true;
                }
                $fluentFormFields[] = $this->processField($element, $field, $allFields);
            }
        }
        $fluentFormFields = array_filter($fluentFormFields);
        if (!$fluentFormFields) {
            throw new Exception(__('Empty form. Please try again!', 'fluentform'));
        }
        $title = Arr::get($form, 'title', '');
        return $this->saveForm($fluentFormFields, $title, $hasStep, $isConversational);
    }

    /**
     * @param array $args
     * @return array response form fields
     * @throws Exception
     */
    protected function generateForm($args)
    {
        $aiModel = Arr::get($args, 'ai_model', 'default');
        $isUsingChatGpt = Helper::hasPro() && 'chat_gpt' == $aiModel && class_exists('FluentFormPro\classes\Chat\ChatFormBuilder');

        if ($isUsingChatGpt) {
            (new \FluentFormPro\classes\Chat\ChatFormBuilder())->buildForm();
        }
        
        $prompt = $this->generateAIPrompt($args);
        
        $queryArgs = [
            'content' => $prompt,
            'role'    => 'model',
        ];

        $result = (new FluentFormAIAPI())->makeRequest([$queryArgs]);
        
        if (is_wp_error($result)) {
            throw new Exception($result->get_error_message());
        }
       
        $response = trim(Arr::get($result, 'response', ''), '"');
        if (false !== preg_match('/```json(.*?)```/s', $response, $matches)) {
            $response = trim($matches[1]);
        }

        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE || empty($decoded) || empty($decoded['fields'])) {
            throw new Exception(__('Invalid response: Please try again!', 'fluentform'));
        }
        return $decoded;
    }
    
    protected function getDefaultFields()
    {
        if ($this->allDefaultFields) {
            return $this->allDefaultFields;
        }
        /**
         * @var \FluentForm\App\Services\FormBuilder\Components
         */
        $components = $this->app->make('components');
        $this->app->doAction('fluentform/editor_init', $components);
        $editorComponents = $components->toArray();
        $general = Arr::get($editorComponents, 'general', []);
        $advanced = Arr::get($editorComponents, 'advanced', []);
        $container = Arr::get($editorComponents, 'container', []);
        $editorComponents = apply_filters('fluentform/editor_components', $components->sort()->toArray(), 0);
        $payments = Arr::get($editorComponents, 'payments', []);
        $payments = array_column($payments, null, 'element');
        $this->allDefaultFields = array_merge($general, $payments, $advanced, ['container' => $container]);
        return $this->allDefaultFields;
    }
    
    protected function processField($element, $field, $allFields)
    {
        if ('container' == $element) {
            return $this->resolveContainerFields($field, $allFields);
        }

        $matchedField = Arr::get($allFields, $element);
        if (!$matchedField) {
            return [];
        }
        $formatField = $matchedField;
        if ($settings = Arr::get($field, 'settings')) {
            $formatField['settings'] = wp_parse_args($settings, $matchedField['settings']);
        }
        if ($attributes = Arr::get($field, 'attributes')) {
            $formatField['attributes'] = wp_parse_args($attributes, $matchedField['attributes']);
        }

        $formatField['uniqElKey'] = "el_" . uniqid();

        if ('form_step' === $element) {
            return $formatField;
        }

        if ($fieldName = Arr::get($field, 'attributes.name')) {
            $formatField['attributes']['name'] = $fieldName;
        }

        if ($options = $this->getOptions(Arr::get($field, 'options'))) {
            if (isset($formatField['settings']['advanced_options'])) {
                $formatField['settings']['advanced_options'] = $options;
            }
            if ('ratings' == $element) {
                $formatField['options'] = array_column($options, 'label', 'value');
            }
        }

        if ('rangeslider' == $element) {
            if ($min = Arr::get($field, 'min')) {
                $formatField['attributes']['min'] = intval($min);
            }
            if ($max = intval(Arr::get($field, 'max', 10))) {
                $formatField['attributes']['max'] = $max;
            }
        }
        
        return $formatField;
    }
    
    protected function resolveInput($field)
    {
        if (!is_array($field)) {
            return false;
        }
        $element = Arr::get($field, 'element');
        $allElements = array_keys($this->getDefaultFields());
        if (in_array($element, $allElements)) {
            return $element;
        }

        $type = Arr::get($field, 'type');
        if (!$type) {
            return false;
        }

        $searchTags = fluentformLoadFile('Services/FormBuilder/ElementSearchTags.php');
        $form = ['type' => ''];
        $form = json_decode(json_encode($form));
        $searchTags = apply_filters('fluentform/editor_element_search_tags', $searchTags, $form);
        foreach ($searchTags as $inputKey => $tags) {
            if (array_search($type, $tags) !== false) {
                return $inputKey;
            } else {
                foreach ($tags as $tag) {
                    if (strpos($tag, $type) !== false) {
                        return $inputKey;
                    }
                }
            }
        }
        return false;
    }
    
    protected function getOptions($options = [])
    {
        $formattedOptions = [];
        if (empty($options) || !is_array($options)) {
            return $options;
        }
        foreach ($options as $key => $option) {
            if (is_string($option) || is_numeric($option)) {
                $value = $label = $option;
            } elseif (is_array($option)) {
                $label = Arr::get($option, 'label');
                $value = Arr::get($option, 'value');
            } else {
                continue;
            }
            if (!$value || !$label) {
                $value = $value ?? $label;
                $label = $label ?? $value;
            }
            if (!$value || !$label) {
                continue;
            }
            $formattedOptions[] = [
                'label' => $label,
                'value' => $value,
            ];
        }
        
        return $formattedOptions;
    }
    
    protected function getBlankFormConfig()
    {
        $attributes = ['type' => 'form', 'predefined' => 'blank_form'];
        $customForm = Form::resolvePredefinedForm($attributes);
        $customForm['form_fields'] = json_decode($customForm['form_fields'], true);
        $customForm['form_fields']['submitButton'] = $customForm['form']['submitButton'];
        $customForm['form_fields'] = json_encode($customForm['form_fields']);
        return $customForm;
    }
    
    protected function saveForm($formattedInputs, $title, $isStepForm = false, $isConversational = false)
    {
        $customForm = $this->prepareCustomForm($formattedInputs, $isStepForm);
        $data = Form::prepare($customForm);

        $form = $this->model->create($data);
        $form->title = $title ?: $form->title . ' (ChatGPT#' . $form->id . ')';

        $formData = (object)$form->toArray();
        if (FormFieldsParser::hasPaymentFields($formData)) {
            $form->has_payment = 1;
        }

        if ($isConversational) {
            $formMeta = FormMeta::prepare(['type' => 'form', 'predefined' => 'conversational'], $customForm);
            $form->fill([
                'form_fields' => Converter::convertExistingForm($form),
            ])->save();
        } else {
            $form->save();
            $formMeta = FormMeta::prepare(['type' => 'form', 'predefined' => 'blank_form'], $customForm);
        }

        FormMeta::store($form, $formMeta);
        
        do_action('fluentform/inserted_new_form', $form->id, $data);
        return $form;
    }

    protected function prepareCustomForm($formattedInputs, $isStepForm)
    {
        $formattedInputs = fluentFormSanitizer($formattedInputs);
        $customForm = $this->getBlankFormConfig();
        $fields = json_decode($customForm['form_fields'], true);

        $fields['form_fields']['fields'] = $formattedInputs;
        $fields['form_fields']['submitButton'] = Arr::get($customForm, 'form.submitButton');

        if ($isStepForm) {
            $fields['form_fields']['stepsWrapper'] = $this->getStepWrapper();
        }

        $customForm['form_fields'] = json_encode($fields['form_fields']);

        return $customForm;
    }

    protected function resolveContainerFields($field, $allFields)
    {
        $columns = Arr::get($field, 'columns');
        $columnsCount = count($columns);
        if (!$columnsCount || $columnsCount > 6) {
            return [];
        }
        $matchedField = Arr::get($allFields, 'container.container_' . $columnsCount . '_col');
        if (!$matchedField) {
            return [];
        }
        $columnWidth = round(100 / $columnsCount, 2);
        foreach ($columns as &$column) {
            $formatedFields = [];
            $fields = Arr::get($column, 'fields', []);
            $columnWidth = Arr::get($column, 'width', $columnWidth);
            foreach ($fields as $colField) {
                $element = Arr::get($colField, 'element');
                if ($columnField = $this->processField($element, $colField, $allFields)) {
                    $formatedFields[] = $columnField;
                }
            }
            if ($formatedFields) {
                $column['fields'] = $formatedFields;
                $column['width'] = $columnWidth;
            }
        }
        $matchedField['columns'] = $columns;
        return $matchedField;
    }

    /**
     * @return array
     */
    protected function getStepWrapper()
    {
        return [
            'stepStart' => [
                'element'        => 'step_start',
                'attributes'     => [
                    'id'    => '',
                    'class' => '',
                ],
                'settings'       => [
                    'progress_indicator'           => 'progress-bar',
                    'step_titles'                  => [],
                    'disable_auto_focus'           => 'no',
                    'enable_auto_slider'           => 'no',
                    'enable_step_data_persistency' => 'no',
                    'enable_step_page_resume'      => 'no',
                ],
                'editor_options' => [
                    'title' => 'Start Paging'
                ],
            ],
            'stepEnd'   => [
                'element'        => 'step_end',
                'attributes'     => [
                    'id'    => '',
                    'class' => '',
                ],
                'settings'       => [
                    'prev_btn' => [
                        'type'    => 'default',
                        'text'    => 'Previous',
                        'img_url' => ''
                    ]
                ],
                'editor_options' => [
                    'title' => 'End Paging'
                ],
            ]
        ];
    }
    
    private function generateAIPrompt($args)
    {
        $startingQuery = "Create a form for ";
        $query = Sanitizer::sanitizeTextField(Arr::get($args, 'query'));
        if (empty($query)) {
            throw new Exception(__('Query is empty!', 'fluentform'));
        }
        
        $additionalQuery = Sanitizer::sanitizeTextField(Arr::get($args, 'additional_query'));
        
        if ($additionalQuery) {
            $query .= "\n including questions for information like  " . $additionalQuery . ".";
        }
        $fields = json_encode($this->getDefaultFields());
        $calculationForm = '[{"index":17,"element":"custom_html","attributes":[],"settings":{"html_codes":"<h3 id=\"header_1\" class=\"form-header\" style=\"text-align: left;\" data-comp>Pay Raise Calculator</h3>","conditional_logics":{"type":"any","status":false,"conditions":[{"field":"","value":"","operator":""}]},"container_class":""},"editor_options":{"title":"Custom HTML","icon_class":"ff-edit-html","template":"customHTML"},"uniqElKey":"el_1724749029122"},{"index":1,"element":"container","attributes":[],"settings":{"container_class":"","conditional_logics":[],"container_width":"","is_width_auto_calc":true},"columns":[{"width":50,"fields":[{"index":6,"element":"input_number","attributes":{"type":"number","name":"numeric_field","value":"","id":"","class":"","placeholder":""},"settings":{"container_class":"","label":"Current Pay","admin_field_label":"","label_placement":"","help_message":"","number_step":"","prefix_label":"$","suffix_label":"","numeric_formatter":"","validation_rules":{"required":{"value":false,"message":"This field is required","global_message":"This field is required","global":true},"numeric":{"value":true,"message":"This field must contain numeric value","global_message":"This field must contain numeric value","global":true},"min":{"value":"","message":"Validation fails for minimum value","global_message":"Validation fails for minimum value","global":true},"max":{"value":"","message":"Validation fails for maximum value","global_message":"Validation fails for maximum value","global":true},"digits":{"value":"","message":"Validation fails for limited digits","global_message":"Validation fails for limited digits","global":true}},"conditional_logics":{"type":"any","status":false,"conditions":[{"field":"","value":"","operator":""}]},"calculation_settings":{"status":false,"formula":""}},"editor_options":{"title":"Numeric Field","icon_class":"ff-edit-numeric","template":"inputText"},"uniqElKey":"el_173614402532913"}]},{"width":50,"fields":[{"index":6,"element":"input_number","attributes":{"type":"number","name":"numeric_field_1","value":"","id":"","class":"","placeholder":""},"settings":{"container_class":"","label":"Percent Increase","admin_field_label":"","label_placement":"","help_message":"","number_step":"","prefix_label":"","suffix_label":"%","numeric_formatter":"","validation_rules":{"required":{"value":false,"message":"This field is required","global_message":"This field is required","global":true},"numeric":{"value":true,"message":"This field must contain numeric value","global_message":"This field must contain numeric value","global":true},"min":{"value":"","message":"Validation fails for minimum value","global_message":"Validation fails for minimum value","global":true},"max":{"value":"","message":"Validation fails for maximum value","global_message":"Validation fails for maximum value","global":true},"digits":{"value":"","message":"Validation fails for limited digits","global_message":"Validation fails for limited digits","global":true}},"conditional_logics":{"type":"any","status":false,"conditions":[{"field":"","value":"","operator":""}]},"calculation_settings":{"status":false,"formula":""}},"editor_options":{"title":"Numeric Field","icon_class":"ff-edit-numeric","template":"inputText"},"uniqElKey":"el_173614405614830"}]}],"editor_options":{"title":"Two Column Container","icon_class":"ff-edit-column-2"},"uniqElKey":"el_1736144019549"},{"index":6,"element":"input_number","attributes":{"type":"number","name":"numeric_field_2","value":"","id":"","class":"","placeholder":""},"settings":{"container_class":"ff-hidden","label":"Raised Pay","admin_field_label":"","label_placement":"","help_message":"","number_step":"","prefix_label":"","suffix_label":"","numeric_formatter":"","validation_rules":{"required":{"value":false,"message":"This field is required","global_message":"This field is required","global":true},"numeric":{"value":true,"message":"This field must contain numeric value","global_message":"This field must contain numeric value","global":true},"min":{"value":"","message":"Validation fails for minimum value","global_message":"Validation fails for minimum value","global":true},"max":{"value":"","message":"Validation fails for maximum value","global_message":"Validation fails for maximum value","global":true},"digits":{"value":"","message":"Validation fails for limited digits","global_message":"Validation fails for limited digits","global":true}},"conditional_logics":{"type":"any","status":false,"conditions":[{"field":"","value":"","operator":""}]},"calculation_settings":{"status":true,"formula":"({input.numeric_field}*({input.numeric_field_1}/100))+{input.numeric_field}"}},"editor_options":{"title":"Numeric Field","icon_class":"ff-edit-numeric","template":"inputText"},"uniqElKey":"el_1736144105914"},{"index":17,"element":"custom_html","attributes":[],"settings":{"html_codes":"<p>Your salary after the pay raise</p>\n<h3>${dynamic.numeric_field_2}</h3>","conditional_logics":{"type":"all","status":false,"conditions":[{"field":"numeric_field_2","value":"","operator":""}]},"container_class":""},"editor_options":{"title":"Custom HTML","icon_class":"ff-edit-html","template":"customHTML"},"uniqElKey":"el_172474443042320"}]';
        
        $query .= <<<EOD
Generate a JSON-based form structure strictly following FluentForm's format.

### Field Requirements:
- Each field must include:
  - 'element' (e.g., input_text, input_email, input_number, select, input_radio, input_checkbox, etc.)
  - 'name' (unique identifier)
  - 'label' (clear and meaningful)
  - 'placeholder' (if applicable, clear and meaningful)
  - 'required' (true/false)

### Special Field Rules:
- If a field has 'options', format them as an array of objects with 'value' and 'label' pairs.
- Field type mapping:
  - Fields related to product,payment → **element: 'multi_payment_component'**
  - Fields related to donation → **element: 'custom_payment_component'**
  - Fields related to product quantity → **element: 'item_quantity_component'**
  - Fields related to subscription → **element: 'subscription_payment_component'**
  - Fields related to payment summery → **element: 'payment_summary_component'**
  - Fields related to payment method → **element: 'payment_method'**
  - Fields related to full name, first name, or last name → **element: 'input_name'**
  - Fields related to phone numbers → **element: 'phone'**
  - Fields related to ratings, review, feedback, or stars → **element: 'ratings'** (include 'options' as 'label' => 'value' pairs)
  - Fields related to sliders, ranges, or scales → **element: 'rangeslider'** (include 'min' and 'max' properties)
  - Fields that serve as layout containers → **element: 'container'** (include inner fields in the 'fields' array)
  - Forms with steps, tabs, or multiple pages → **insert a field with 'element': 'form_step'** at each step break
  
### Additional Form Attributes:
  - Include an **'is_conversational'** key (true/false) to indicate if the form follows a conversational format.
  - Include a **'title'** key to define the form's title.
  - The JSON output must be structured with a **'fields' array** containing only form fields.
  - Ensure **'label', 'admin_field_label', 'placeholder', and 'name'** are clear and well-defined.
  
### FluentForm JSON Format:
Return the JSON structure adhering to FluentForm’s format as seen in the default fields below:
    ```json  $fields ```
    
### Special Case: Calculation Forms
- If the form includes **calculations**, ensure fields are structured correctly using FluentForm’s calculation feature.
- Example: A percentage-based salary raise form should include numeric fields with formulas, similar to:
```json $calculationForm ```
EOD;
        return $startingQuery . $query;
    }
    
}
