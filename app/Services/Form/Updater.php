<?php

namespace FluentForm\App\Services\Form;

use Exception;
use FluentForm\App\Models\Form;
use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\FormMeta;
use FluentForm\Framework\Support\Arr;
use FluentForm\App\Modules\Form\FormFieldsParser;

class Updater
{
    public function update($attributes = [])
    {
        $formId = Arr::get($attributes, 'form_id');
        $formFields = Arr::get($attributes, 'formFields');
        $status = Arr::get($attributes, 'status', 'published');
        $title = sanitize_text_field(Arr::get($attributes, 'title'));
      
        $this->validate([
            'title'      => $title,
            'formFields' => $formFields,
        ]);

        try {
            $form = Form::findOrFail($formId);
        } catch (Exception $e) {
            throw new \Exception("The form couldn't be found.");
        }

        $data = [
            'title'      => $title,
            'status'     => $status,
            'updated_at' => current_time('mysql'),
        ];

        if ($formFields) {
            $formFields = apply_filters_deprecated(
                'fluentform_form_fields_update',
                [
                    $formFields,
                    $formId
                ],
                FLUENTFORM_FRAMEWORK_UPGRADE,
                'fluentform/form_fields_update',
                'Use fluentform/form_fields_update instead of fluentform_form_fields_update.'
            );
            $formFields = apply_filters('fluentform/form_fields_update', $formFields, $formId);
            $formFields = $this->sanitizeFields($formFields);
            $data['form_fields'] = $formFields;
            /**
             * Fires before a Form is updated.
             * @since 5.2.1
             */
            do_action('fluentform/before_updating_form', $form, $data);
    
            $form->fill($data);

            if (FormFieldsParser::hasPaymentFields($form)) {
                $data['has_payment'] = 1;
            } elseif ($form->has_payment) {
                $data['has_payment'] = 0;
            }

            $this->updatePrimaryEmail($form);
            
        }

        $form->fill($data)->save();

        return $form;
    }

    private function validate($attributes)
    {
        if ($attributes['formFields']) {
            $duplicates = Helper::getDuplicateFieldNames($attributes['formFields']);

            if ($duplicates) {
                $duplicateString = implode(', ', $duplicates);

                throw new Exception(
                    sprintf('Name attribute %s has duplicate value.', $duplicateString)
                );
            }
        }

        if (!$attributes['title']) {
            throw new Exception('The title field is required.');
        }
    }

    private function sanitizeFields($formFields)
    {
        if (fluentformCanUnfilteredHTML()) {
            return $formFields;
        }
    
        $fieldsArray = json_decode($formFields, true);

        if (isset($fieldsArray['submitButton'])) {
            $fieldsArray['submitButton']['settings']['button_ui']['text'] = fluentform_sanitize_html(
                $fieldsArray['submitButton']['settings']['button_ui']['text']
            );

            if (!empty($fieldsArray['submitButton']['settings']['button_ui']['img_url'])) {
                $fieldsArray['submitButton']['settings']['button_ui']['img_url'] = sanitize_url(
                    $fieldsArray['submitButton']['settings']['button_ui']['img_url']
                );
            }
        }
        $fieldsArray['fields'] = $this->sanitizeFieldMaps($fieldsArray['fields']);
        $fieldsArray['fields'] = $this->sanitizeCustomSubmit($fieldsArray['fields']);
        

        return json_encode($fieldsArray);
    }

    private function sanitizeFieldMaps($fields)
    {
        if (!is_array($fields)) {
            return $fields;
        }

        $attributesMap = [
            'name'        => 'sanitize_key',
            'value'       => 'sanitize_textarea_field',
            'id'          => 'sanitize_key',
            'class'       => 'sanitize_text_field',
            'placeholder' => 'sanitize_text_field',
        ];

        $attributesKeys = array_keys($attributesMap);

        $settingsMap = [
            'container_class'           => 'sanitize_text_field',
            'label'                     => 'fluentform_sanitize_html',
            'tnc_html'                  => 'fluentform_sanitize_html',
            'label_placement'           => 'sanitize_text_field',
            'help_message'              => 'wp_kses_post',
            'admin_field_label'         => 'sanitize_text_field',
            'prefix_label'              => 'sanitize_text_field',
            'suffix_label'              => 'sanitize_text_field',
            'unique_validation_message' => 'sanitize_text_field',
            'advanced_options'          => 'fluentform_options_sanitize',
            'html_codes'                => 'fluentform_sanitize_html',
            'description'               => 'fluentform_sanitize_html',
        ];
      

        $settingsKeys = array_keys($settingsMap);

        $stylePrefMap = [
            'layout'   => 'sanitize_key',
            'media'    => 'sanitize_url',
            'alt_text' => 'sanitize_text_field',
        ];
        $stylePrefKeys = array_keys($stylePrefMap);
        foreach ($fields as $fieldIndex => &$field) {
            $element = Arr::get($field, 'element');
            
            if ('container' == $element) {
                $columns = $field['columns'];
                foreach ($columns as $columnIndex => $column) {
                    $fields[$fieldIndex]['columns'][$columnIndex]['fields'] = $this->sanitizeFieldMaps($column['fields']);
                }
                continue;
            }

            if ('welcome_screen' == $element) {
                if ($value = Arr::get($field, 'settings.button_ui.text')) {
                    $field['settings']['button_ui']['text'] = sanitize_text_field($value);
                }
            }
            

            if (!empty($field['attributes'])) {
                $attributes = array_filter(Arr::only($field['attributes'], $attributesKeys));

                foreach ($attributes as $key => $value) {
                    $fields[$fieldIndex]['attributes'][$key] = call_user_func($attributesMap[$key], $value);
                }
            }

            if (!empty($field['settings'])) {
                $settings = array_filter(Arr::only($field['settings'], array_values($settingsKeys)));
                foreach ($settings as $key => $value) {
                    $fields[$fieldIndex]['settings'][$key] = call_user_func($settingsMap[$key], $value);
                }
            }
            /*
            * Handle Name or address fields
            */
            if (!empty($field['fields'])) {
                $fields[$fieldIndex]['fields'] = $this->sanitizeFieldMaps($field['fields']);
                continue;
            }
            
            if (!empty($field['style_pref'])) {
                $settings = array_filter(Arr::only($field['style_pref'], $stylePrefKeys));

                foreach ($settings as $key => $value) {
                    $fields[$fieldIndex]['style_pref'][$key] = call_user_func($stylePrefMap[$key], $value);
                }
            }
    
            $validationRules = Arr::get($field, 'settings.validation_rules');
            if (!empty($validationRules)) {
                foreach ($validationRules as $key => $rule) {
                    if (isset($rule['message'])) {
                        $message = $rule['message'];
                        $field['settings']['validation_rules'][$key]['message'] = wp_kses_post($message);
                        continue;
                    }
                }
            }
        }
        
        return $fields;
    }

    private function updatePrimaryEmail($form)
    {
        $emailInputs = FormFieldsParser::getElement($form, ['input_email'], ['element', 'attributes']);

        if ($emailInputs) {
            $emailInput = array_shift($emailInputs);
            $emailInputName = Arr::get($emailInput, 'attributes.name');
        } else {
            $emailInputName = '';
        }

        FormMeta::persist($form->id, '_primary_email_field', $emailInputName);
    }
    
    private function sanitizeCustomSubmit($fields)
    {
        $customSubmitSanitizationMap = [
            'hover_styles'  => [
                'backgroundColor' => [$this, 'sanitizeRgbColor'],
                'borderColor'     => [$this, 'sanitizeRgbColor'],
                'color'           => [$this, 'sanitizeRgbColor'],
                'borderRadius'    => 'sanitize_text_field',
                'minWidth'        => [$this, 'sanitizeMinWidth']
            ],
            'normal_styles' => [
                'backgroundColor' => [$this, 'sanitizeRgbColor'],
                'borderColor'     => [$this, 'sanitizeRgbColor'],
                'color'           => [$this, 'sanitizeRgbColor'],
                'borderRadius'    => 'sanitize_text_field',
                'minWidth'        => [$this, 'sanitizeMinWidth']
            ],
            'button_ui'     => [
                'type'    => 'sanitize_text_field',
                'text'    => 'sanitize_text_field',
                'img_url' => 'esc_url_raw',
            ],
        ];
        foreach ($fields as $fieldIndex => $field) {
            $element = Arr::get($field, 'element');
            
            if ('custom_submit_button' == $element) {
                $styleAttr = ['hover_styles', 'normal_styles', 'button_ui'];
                foreach ($styleAttr as $attr) {
                    if ($styleConfigs = Arr::get($field, 'settings.' . $attr)) {
                        foreach ($styleConfigs as $key => $value) {
                            if (isset($customSubmitSanitizationMap[$attr][$key])) {
                                $sanitizeFunction = $customSubmitSanitizationMap[$attr][$key];
                                $fields[$fieldIndex]['settings'][$attr][$key] = $sanitizeFunction($value);
                            }
                        }
                    }
                }
            }
            elseif ('container' == $element) {
                $columns = $field['columns'];
                foreach ($columns as $columnIndex => $column) {
                    $fields[$fieldIndex]['columns'][$columnIndex]['fields'] = $this->sanitizeCustomSubmit($column['fields']);
                }
                return $fields;
            }
        }
        return $fields;
    }
    
    public function sanitizeMinWidth($value)
    {
        if (is_string($value) && preg_match('/^\d+%$/', $value)) {
            return $value;
        }
        return '';
    }
    
    public function sanitizeRgbColor($value) {
        if (preg_match('/^rgba?\((\d{1,3}\s*,\s*){2,3}(0|1|0?\.\d+)\)$/', $value)) {
            return $value;
        }
        return '';
    }
    
}
