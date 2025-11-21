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
        add_filter("fluent_cart/store_settings/fields", [$this, 'addFormSettingsToFluentCart']);
        add_filter('fluent_cart/store_settings/sanitizer', [$this, 'addFormSettingsSanitizer']);
        add_action('fluent_cart/before_billing_fields', [$this, 'renderFormBeforeCheckout'], 10);
        add_action('fluent_cart/checkout/prepare_other_data', [$this, 'saveFluentFormDataToOrder'], 10, 1);
        add_filter('fluent_cart/widgets/single_order_page', [$this, 'addOrderFormWidget'], 10, 2);
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

        add_filter('fluentform/is_hide_submit_btn_' . $formId, '__return_true');
        add_filter('fluentform/replace_form_tag_' . $formId, function ($tag) {
            return 'div';
        });
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

        $form = Form::find($formId);
        if (!$form) {
            return $formData;
        }

        $formFields = json_decode($form->form_fields, true);
        $allFieldNames = $this->extractAllFieldNames($formFields);

        foreach ($requestData as $key => $value) {
            $isFormField = false;
            
            if (in_array($key, $allFieldNames)) {
                $isFormField = true;
            } else {
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

            if ($element === 'container' && isset($field['columns'])) {
                foreach ($field['columns'] as $column) {
                    if (isset($column['fields']) && is_array($column['fields'])) {
                        $this->recursiveExtractFieldNames($column['fields'], $fieldNames);
                    }
                }
            } elseif (isset($field['fields']) && is_array($field['fields'])) {
                if ($fieldName) {
                    $fieldNames[] = $fieldName;
                }
                
                foreach ($field['fields'] as $nestedField) {
                    $nestedFieldName = Arr::get($nestedField, 'attributes.name');
                    if ($nestedFieldName) {
                        if ($fieldName) {
                            $fieldNames[] = $fieldName . '[' . $nestedFieldName . ']';
                        }
                        $fieldNames[] = $nestedFieldName;
                    }
                }
            } elseif ($fieldName) {
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

        $fields = FormFieldsParser::getEntryInputs($form);
        $formattedData = $this->formatFormDataForDisplay($formData, $fields, $form);

        if (empty($formattedData)) {
            return $widgets;
        }

        $htmlContent = '<div class="fluent-form-data-display">';
        
        foreach ($formattedData as $fieldName => $fieldValue) {
            $field = $this->findFieldByName($fields, $fieldName);
            
            if (!$field) {
                continue;
            }
            
            $rawField = Arr::get($field, 'raw');
            $subFields = Arr::get($rawField, 'fields', []);
            if (empty($subFields)) {
                $subFields = Arr::get($field, 'fields', []);
            }
            
            if (!empty($subFields) && is_array($fieldValue)) {
                $parentLabel = $this->getFieldLabel($field, $fieldName);
                
                if ($parentLabel && $parentLabel !== $fieldName) {
                    $htmlContent .= '<div class="ff-field-group" style="margin-bottom: 20px;">';
                    $htmlContent .= '<div class="ff-field-group-label" style="font-weight: 600; margin-bottom: 10px; color: #333; font-size: 14px;">' . htmlspecialchars($parentLabel, ENT_QUOTES, 'UTF-8') . '</div>';
                }
                
                foreach ($subFields as $subFieldName => $subField) {
                    if (!isset($fieldValue[$subFieldName])) {
                        continue;
                    }
                    
                    $subFieldValue = $fieldValue[$subFieldName];
                    if ($subFieldValue === '' || $subFieldValue === null) {
                        continue;
                    }
                    
                    $subFieldLabel = Arr::get($subField, 'settings.label');
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
                $label = $this->getFieldLabel($field, $fieldName);
                
                if (is_array($fieldValue)) {
                    $htmlContent .= '<div class="ff-field-display" style="margin-bottom: 15px;">';
                    $htmlContent .= '<div class="ff-field-label" style="font-weight: 600; margin-bottom: 5px; color: #333;">' . htmlspecialchars($label, ENT_QUOTES, 'UTF-8') . '</div>';
                    $htmlContent .= '<div class="ff-field-value" style="color: #666; word-wrap: break-word;">';
                    $htmlContent .= '<ul style="margin: 0; padding-left: 20px;">';
                    foreach ($fieldValue as $item) {
                        if ($item !== '' && $item !== null) {
                            $htmlContent .= '<li style="margin-bottom: 5px;">' . htmlspecialchars($item, ENT_QUOTES, 'UTF-8') . '</li>';
                        }
                    }
                    $htmlContent .= '</ul>';
                    $htmlContent .= '</div>';
                    $htmlContent .= '</div>';
                } else {
                    $formattedValue = $this->formatFieldValue($fieldValue, $field);
                    
                    $htmlContent .= '<div class="ff-field-display" style="margin-bottom: 15px;">';
                    $htmlContent .= '<div class="ff-field-label" style="font-weight: 600; margin-bottom: 5px; color: #333;">' . htmlspecialchars($label, ENT_QUOTES, 'UTF-8') . '</div>';
                    $htmlContent .= '<div class="ff-field-value" style="color: #666; word-wrap: break-word;">' . htmlspecialchars($formattedValue, ENT_QUOTES, 'UTF-8') . '</div>';
                    $htmlContent .= '</div>';
                }
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
            if ($value === '' || $value === null) {
                continue;
            }

            if (is_array($value)) {
                $field = $this->findFieldByName($fields, $key);
                $rawField = Arr::get($field, 'raw');
                $subFields = Arr::get($rawField, 'fields', []);
                if (empty($subFields)) {
                    $subFields = Arr::get($field, 'fields', []);
                }
                
                if (!empty($subFields)) {
                    $formatted[$key] = $value;
                } else {
                    if (count($value) === 1 && isset($value[0])) {
                        $formatted[$key] = $value[0];
                    } else {
                        $formatted[$key] = $value;
                    }
                }
            } else {
                $formatted[$key] = $value;
            }
        }

        return $formatted;
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
        if (isset($fields[$fieldName])) {
            return $fields[$fieldName];
        }
        
        foreach ($fields as $field) {
            $rawName = Arr::get($field, 'raw.attributes.name');
            if ($rawName === $fieldName) {
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
            $adminLabel = Arr::get($field, 'admin_label');
            if ($adminLabel) {
                return $adminLabel;
            }
            
            $rawAdminLabel = Arr::get($field, 'raw.settings.admin_field_label');
            if ($rawAdminLabel) {
                return $rawAdminLabel;
            }
            
            $rawLabel = Arr::get($field, 'raw.settings.label');
            if ($rawLabel) {
                return $rawLabel;
            }
            
            $label = Arr::get($field, 'settings.label');
            if ($label) {
                return $label;
            }
        }

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