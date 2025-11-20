<?php

namespace FluentForm\App\Modules\FluentCart;

use FluentCart\Api\StoreSettings;
use FluentCart\App\Models\Order as FluentCartOrder;
use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\Form;
use FluentForm\App\Modules\Form\FormFieldsParser;
use FluentForm\Framework\Foundation\Application;
use FluentForm\Framework\Support\Arr;

class FluentCartIntegration
{
    /**
     * @var Application
     */
    protected $app;

    /**
     * Constructor
     *
     * @param Application $app
     */
    public function __construct(Application $app)
    {
        $this->app = $app;

        if ($this->isFluentCartActive()) {
            $this->registerHooks();
        }
    }

    /**
     * Register all necessary hooks and filters
     *
     * @return void
     */
    protected function registerHooks()
    {
        // Settings integration
        add_filter("fluent_cart/store_settings/fields", [$this, 'addFormSettingsToFluentCart']);
        add_filter('fluent_cart/store_settings/sanitizer', [$this, 'addFormSettingsSanitizer']);

        // Checkout page integration
        add_action('fluent_cart/before_billing_fields', [$this, 'renderFormBeforeCheckout'], 10);

        // Save Fluent Forms data to order meta
        add_action('fluent_cart/checkout/prepare_other_data', [$this, 'saveFluentFormDataToOrder'], 10, 1);

        // Add widget to order page
        add_filter('fluent_cart/widgets/single_order_page', [$this, 'addOrderFormWidget'], 10, 2);

        // Enqueue assets
        add_action('wp_enqueue_scripts', [$this, 'enqueueAssets']);
    }

    /**
     * Enqueue necessary assets
     *
     * @return void
     */
    public function enqueueAssets()
    {
        wp_enqueue_script(
            'fluent-cart-form-integration',
            fluentFormMix('js/fluent-cart/fluent-cart-fluent-form-connection.js'),
            ['jquery', 'fluent-form-submission'],
            FLUENTFORM_VERSION,
            true
        );
    }

    /**
     * Add form settings to Fluent Cart settings
     *
     * @param array $fields
     * @return array
     */
    public function addFormSettingsToFluentCart($fields)
    {
        $forms = $this->getFormsForSelection();

        $fields['setting_tabs']['schema']['store_setup']['schema']['hr7'] = [
            "type"  => "html",
            "value" => "<hr class='settings-devider'>"
        ];

        $fields['setting_tabs']['schema']['store_setup']['schema']['fluent_forms_checkout'] = [
            "type"            => "grid",
            "columns"         => [
                "default" => 1,
                "md"      => 3
            ],
            "disable_nesting" => true,
            "schema"          => [
                "label"        => [
                    "type"  => "html",
                    "value" => "<span class='setting-label'>Select FluentForm for Fluent Cart Checkout</span>
                                <div class='form-note'>Map Fluent Form to render in Fluent Cart Checkout Page</div>"
                ],
                "fluent_forms" => [
                    "wrapperClass" => "col-span-2 flex items-center",
                    "type"         => "select",
                    "filterable"   => true,
                    'clearable'    => true,
                    "options"      => $forms,
                    "value"        => ''
                ]
            ]
        ];

        return $fields;
    }

    /**
     * Add form settings sanitizer
     *
     * @param array $sanitizer
     * @return array
     */
    public function addFormSettingsSanitizer($sanitizer)
    {
        $sanitizer['fluent_forms'] = 'sanitize_text_field';
        return $sanitizer;
    }


    /**
     * Render form before checkout
     *
     * @param array $data
     * @return void
     */
    public function renderFormBeforeCheckout($data = [])
    {
        $settings = new StoreSettings();
        $formId = intval($settings->get('fluent_forms'));

        if (!$formId) {
            return;
        }

        // Hide submit button since form will be submitted via JavaScript
        add_filter('fluentform/is_hide_submit_btn_' . $formId, '__return_true');
        
        // Replace form tag with div to prevent native form submission
        add_filter('fluentform/replace_form_tag_' . $formId, function ($tag) {
            return 'div';
        });

        // Add data attributes for JavaScript integration
        add_filter('fluentform/html_attributes', function ($attributes, $form) use ($formId) {
            if ($form->id == $formId) {
                $attributes['data-fluent-cart-checkout-form'] = 'true';
                $attributes['class'] = ($attributes['class'] ?? '') . ' fluent-cart-checkout-form';
            }
            return $attributes;
        }, 10, 2);

        echo do_shortcode('[fluentform id="' . $formId . '"]');
    }

    /**
     * Get list of forms for selection dropdowns
     *
     * @return array
     */
    protected function getFormsForSelection()
    {
        if (!class_exists('FluentForm\App\Models\Form')) {
            return [
                [
                    'value' => 'none',
                    'label' => 'FluentForm plugin not active'
                ]
            ];
        }

        try {
            $forms = Form::select(['id as value', 'title as label'])
                ->orderBy('id', 'DESC')
                ->get()
                ->toArray();

            // Add default option
            array_unshift($forms, [
                'value' => 'none',
                'label' => 'No Form selected'
            ]);

            return $forms;
        } catch (\Exception $e) {
            return [
                [
                    'value' => 'none',
                    'label' => 'Error loading forms'
                ]
            ];
        }
    }

    /**
     * Save Fluent Forms data to order meta
     *
     * @param array $data Contains: cart, order, prev_order, request_data, validated_data
     * @return void
     */
    public function saveFluentFormDataToOrder($data)
    {
        $order = Arr::get($data, 'order');
        $requestData = Arr::get($data, 'request_data', []);

        if (!$order || !is_object($order)) {
            return;
        }

        // Get the configured form ID
        $settings = new StoreSettings();
        $formId = intval($settings->get('fluent_forms'));

        if (!$formId) {
            return;
        }

        $fluentFormData = $this->extractFluentFormData($requestData, $formId);

        if (empty($fluentFormData)) {
            return;
        }

        $order->updateMeta('fluent_form_data', $fluentFormData);
        $order->updateMeta('fluent_form_id', $formId);
    }

    /**
     * Extract Fluent Forms data from request data
     *
     * @param array $requestData
     * @param int $formId
     * @return array
     */
    protected function extractFluentFormData($requestData, $formId)
    {
        $formData = [];

        // Get form fields to identify which data belongs to the form
        $form = Form::find($formId);
        if (!$form) {
            return $formData;
        }

        // Get raw form fields structure to recursively extract all field names
        $formFields = json_decode($form->form_fields, true);
        $allFieldNames = $this->extractAllFieldNames($formFields);

        // Extract only form fields from request data
        foreach ($requestData as $key => $value) {
            $isFormField = false;
            
            // Check for exact field name match
            if (in_array($key, $allFieldNames)) {
                $isFormField = true;
            } else {
                // Check for array-based fields
                foreach ($allFieldNames as $fieldName) {
                    if (strpos($key, $fieldName . '[') === 0) {
                        $isFormField = true;
                        break;
                    }
                }
            }

            if ($isFormField) {
                $formData[$key] = $value;
            }
        }

        return $formData;
    }

    /**
     * Recursively extract all field names from form structure
     *
     * @param array $formFields
     * @return array
     */
    protected function extractAllFieldNames($formFields)
    {
        $fieldNames = [];
        
        if (!isset($formFields['fields']) || !is_array($formFields['fields'])) {
            return $fieldNames;
        }

        $this->recursiveExtractFieldNames($formFields['fields'], $fieldNames);

        return $fieldNames;
    }

    /**
     * Recursively extract field names from fields array
     *
     * @param array $fields
     * @param array $fieldNames Reference to field names array
     * @return void
     */
    protected function recursiveExtractFieldNames($fields, &$fieldNames)
    {
        foreach ($fields as $field) {
            if (!is_array($field)) {
                continue;
            }

            $element = Arr::get($field, 'element');
            $fieldName = Arr::get($field, 'attributes.name');

            // Handle container fields
            if ($element === 'container' && isset($field['columns'])) {
                foreach ($field['columns'] as $column) {
                    if (isset($column['fields']) && is_array($column['fields'])) {
                        $this->recursiveExtractFieldNames($column['fields'], $fieldNames);
                    }
                }
            }
            // Handle fields with nested fields
            elseif (isset($field['fields']) && is_array($field['fields'])) {
                if ($fieldName) {
                    $fieldNames[] = $fieldName;
                }
                
                // Process nested fields
                foreach ($field['fields'] as $nestedField) {
                    $nestedFieldName = Arr::get($nestedField, 'attributes.name');
                    if ($nestedFieldName) {
                        // Add nested field as parent[nested] format
                        if ($fieldName) {
                            $fieldNames[] = $fieldName . '[' . $nestedFieldName . ']';
                        }
                        // Also add just the nested name for direct access
                        $fieldNames[] = $nestedFieldName;
                    }
                }
            }
            // Regular field
            elseif ($fieldName) {
                $fieldNames[] = $fieldName;
            }
        }
    }

    /**
     * Add Fluent Forms widget to order page
     *
     * @param array $widgets
     * @param \FluentCart\App\Models\Order|array $order
     * @return array
     */
    public function addOrderFormWidget($widgets, $order)
    {
        if (!$order) {
            return $widgets;
        }

        // Handle case where $order is an array with order_id
        if (is_array($order)) {
            $orderId = Arr::get($order, 'order_id');
            if (!$orderId) {
                return $widgets;
            }
            
            $orderModel = FluentCartOrder::where('uuid', $orderId)->first();
        
            if (!$orderModel) {
                return $widgets;
            }
            
            $order = $orderModel;
        }

        // Ensure $order is an object with getMeta method
        if (!is_object($order) || !method_exists($order, 'getMeta')) {
            return $widgets;
        }

        $formId = $order->getMeta('fluent_form_id');
        $formData = $order->getMeta('fluent_form_data');

        if (!$formId || empty($formData)) {
            return $widgets;
        }

        $form = Form::find($formId);
        if (!$form) {
            return $widgets;
        }

        // Get form fields to format the data properly
        $fields = FormFieldsParser::getEntryInputs($form);
        $formattedData = $this->formatFormDataForDisplay($formData, $fields, $form);

        if (empty($formattedData)) {
            return $widgets;
        }

        // Build HTML content for displaying form data
        $htmlContent = '<div class="fluent-form-data-display">';
        
        foreach ($formattedData as $fieldName => $fieldValue) {
            $field = $this->findFieldByName($fields, $fieldName);
            $element = Arr::get($field, 'element');
            
            // Handle name fields with sub-fields
            if ($element === 'input_name' && is_array($fieldValue)) {
                $parentLabel = $this->getFieldLabel($field, $fieldName);
                
                // Build full name from sub-fields in order: first, middle, last
                $nameParts = [];
                $nameOrder = ['first_name', 'middle_name', 'last_name'];
                
                foreach ($nameOrder as $namePart) {
                    if (isset($fieldValue[$namePart]) && $fieldValue[$namePart] !== '' && $fieldValue[$namePart] !== null) {
                        $nameParts[] = $fieldValue[$namePart];
                    }
                }
                
                if (!empty($nameParts)) {
                    $fullName = implode(' ', $nameParts);
                    
                    $htmlContent .= '<div class="ff-field-display" style="margin-bottom: 15px;">';
                    $htmlContent .= '<div class="ff-field-label" style="font-weight: 600; margin-bottom: 5px; color: #333;">' . htmlspecialchars($parentLabel, ENT_QUOTES, 'UTF-8') . '</div>';
                    $htmlContent .= '<div class="ff-field-value" style="color: #666; word-wrap: break-word;">' . htmlspecialchars($fullName, ENT_QUOTES, 'UTF-8') . '</div>';
                    $htmlContent .= '</div>';
                }
            }
            // Handle address fields with sub-fields
            elseif ($element === 'address' && is_array($fieldValue)) {
                $parentLabel = $this->getFieldLabel($field, $fieldName);
                $subFields = Arr::get($field, 'fields', []);
                
                // Display parent label if it exists
                if ($parentLabel && $parentLabel !== $fieldName) {
                    $htmlContent .= '<div class="ff-field-group" style="margin-bottom: 20px;">';
                    $htmlContent .= '<div class="ff-field-group-label" style="font-weight: 600; margin-bottom: 10px; color: #333; font-size: 14px;">' . htmlspecialchars($parentLabel, ENT_QUOTES, 'UTF-8') . '</div>';
                }
                
                // Display each sub-field with its label
                foreach ($subFields as $subField) {
                    $subFieldName = Arr::get($subField, 'attributes.name');
                    if (!$subFieldName || !isset($fieldValue[$subFieldName])) {
                        continue;
                    }
                    
                    $subFieldValue = $fieldValue[$subFieldName];
                    if ($subFieldValue === '' || $subFieldValue === null) {
                        continue;
                    }
                    
                    // Get sub-field label (admin_label or settings.label)
                    $subFieldLabel = Arr::get($subField, 'admin_label');
                    if (!$subFieldLabel) {
                        $subFieldLabel = Arr::get($subField, 'settings.label');
                    }
                    if (!$subFieldLabel) {
                        $subFieldLabel = ucwords(str_replace('_', ' ', $subFieldName));
                    }
                    
                    $htmlContent .= '<div class="ff-field-display" style="margin-bottom: 10px; margin-left: ' . ($parentLabel ? '15px' : '0') . ';">';
                    $htmlContent .= '<div class="ff-field-label" style="font-weight: 600; margin-bottom: 5px; color: #333;">' . htmlspecialchars($subFieldLabel, ENT_QUOTES, 'UTF-8') . '</div>';
                    $htmlContent .= '<div class="ff-field-value" style="color: #666; word-wrap: break-word;">' . htmlspecialchars($subFieldValue, ENT_QUOTES, 'UTF-8') . '</div>';
                    $htmlContent .= '</div>';
                }
                
                if ($parentLabel && $parentLabel !== $fieldName) {
                    $htmlContent .= '</div>';
                }
            } else {
                // Regular field display
                $label = $this->getFieldLabel($field, $fieldName);
                $formattedValue = $this->formatFieldValue($fieldValue, $field);
                
                $htmlContent .= '<div class="ff-field-display" style="margin-bottom: 15px;">';
                $htmlContent .= '<div class="ff-field-label" style="font-weight: 600; margin-bottom: 5px; color: #333;">' . htmlspecialchars($label, ENT_QUOTES, 'UTF-8') . '</div>';
                $htmlContent .= '<div class="ff-field-value" style="color: #666; word-wrap: break-word;">' . htmlspecialchars($formattedValue, ENT_QUOTES, 'UTF-8') . '</div>';
                $htmlContent .= '</div>';
            }
        }
        
        $htmlContent .= '</div>';

        $widgets[] = [
            'title' => 'Fluent Form Data',
            'sub_title' => sprintf('Form: %s', $form->title),
            'type' => 'html',
            'content' => $htmlContent,
        ];

        return $widgets;
    }

    /**
     * Format form data for display
     *
     * @param array $formData
     * @param array $fields
     * @param \FluentForm\App\Models\Form $form
     * @return array
     */
    protected function formatFormDataForDisplay($formData, $fields, $form)
    {
        $formatted = [];

        foreach ($formData as $key => $value) {
            // Skip empty values
            if ($value === '' || $value === null) {
                continue;
            }

            // Handle array values
            if (is_array($value)) {
                $field = $this->findFieldByName($fields, $key);
                $element = Arr::get($field, 'element');
                
                // Keep array structure for name and address fields to display sub-fields
                if ($element === 'input_name' || $element === 'address') {
                    $formatted[$key] = $value;
                } else {
                    $formatted[$key] = $this->formatArrayValue($value, $key, $fields);
                }
            } else {
                $formatted[$key] = $value;
            }
        }

        return $formatted;
    }

    /**
     * Format array value for display
     *
     * @param array $value
     * @param string $fieldName
     * @param array $fields
     * @return string
     */
    protected function formatArrayValue($value, $fieldName, $fields)
    {
        $field = $this->findFieldByName($fields, $fieldName);
        $element = Arr::get($field, 'element');

        // Handle name fields
        if ($element === 'input_name') {
            $parts = [];
            if (isset($value['first_name'])) {
                $parts[] = $value['first_name'];
            }
            if (isset($value['last_name'])) {
                $parts[] = $value['last_name'];
            }
            if (isset($value['middle_name'])) {
                $parts[] = $value['middle_name'];
            }
            return implode(' ', $parts);
        }

        // Handle address fields
        if ($element === 'address') {
            $parts = [];
            if (isset($value['address_line_1'])) {
                $parts[] = $value['address_line_1'];
            }
            if (isset($value['address_line_2'])) {
                $parts[] = $value['address_line_2'];
            }
            if (isset($value['city'])) {
                $parts[] = $value['city'];
            }
            if (isset($value['state'])) {
                $parts[] = $value['state'];
            }
            if (isset($value['postal_code'])) {
                $parts[] = $value['postal_code'];
            }
            if (isset($value['country'])) {
                $parts[] = $value['country'];
            }
            return implode(', ', array_filter($parts));
        }

        // Handle checkbox/select multiple
        if (is_array($value)) {
            return implode(', ', array_filter($value));
        }

        return $value;
    }

    /**
     * Find field by name in fields array
     *
     * @param array $fields
     * @param string $fieldName
     * @return array|null
     */
    protected function findFieldByName($fields, $fieldName)
    {
        foreach ($fields as $field) {
            $name = Arr::get($field, 'attributes.name');
            if ($name === $fieldName) {
                return $field;
            }
        }
        return null;
    }

    /**
     * Get field label
     *
     * @param array|null $field
     * @param string $fieldName
     * @return string
     */
    protected function getFieldLabel($field, $fieldName)
    {
        if ($field) {
            $label = Arr::get($field, 'settings.label');
            if ($label) {
                return $label;
            }
            $adminLabel = Arr::get($field, 'admin_label');
            if ($adminLabel) {
                return $adminLabel;
            }
        }

        // Fallback to formatted field name
        return ucwords(str_replace(['_', '-'], ' ', $fieldName));
    }

    /**
     * Format field value for display
     *
     * @param mixed $value
     * @param array|null $field
     * @return string
     */
    protected function formatFieldValue($value, $field)
    {
        if (is_array($value)) {
            return $this->formatArrayValue($value, '', $field ? [$field] : []);
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
    }

    /**
     * Check if Fluent Cart is active
     *
     * @return bool
     */
    protected function isFluentCartActive()
    {
        return function_exists('fluentCart') || 
               class_exists('FluentCart\App\App') || 
               defined('FLUENT_CART_VERSION');
    }
}