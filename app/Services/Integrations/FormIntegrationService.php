<?php

namespace FluentForm\App\Services\Integrations;

use FluentForm\App\Models\Form;
use FluentForm\App\Models\FormMeta;
use FluentForm\App\Models\Submission;
use FluentForm\App\Modules\Form\FormFieldsParser;
use FluentForm\App\Services\FormBuilder\ShortCodeParser;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;

class FormIntegrationService
{
    public function find($attr)
    {
        $formId = intval(Arr::get($attr, 'form_id'));
        $integrationId = intval(Arr::get($attr, 'integration_id'));
        $integrationName = sanitize_text_field(Arr::get($attr, 'integration_name'));
        
        $settings = [
            'conditionals' => [
                'conditions' => [],
                'status'     => false,
                'type'       => 'all',
            ],
            'enabled'      => true,
            'list_id'      => '',
            'list_name'    => '',
            'name'         => '',
            'merge_fields' => [],
        ];
        
        $mergeFields = false;
        if ($integrationId) {
            $feed = FormMeta::where(['form_id' => $formId, 'id' => $integrationId])->first();
            
            
            if ($feed->value) {
                $settings = json_decode($feed->value, true);
                $settings = apply_filters_deprecated(
                    'fluentform_get_integration_values_' . $integrationName,
                    [
                        $settings,
                        $feed,
                        $formId
                    ],
                    FLUENTFORM_FRAMEWORK_UPGRADE,
                    'fluentform/get_integration_values_' . $integrationName,
                    'Use fluentform/get_integration_values_' . $integrationName . ' instead of fluentform_get_integration_values_' . $integrationName
                );
                $settings = apply_filters('fluentform/get_integration_values_' . $integrationName, $settings, $feed, $formId);
                if (!empty($settings['list_id'])) {
                    $mergeFields = apply_filters_deprecated(
                        'fluentform_get_integration_merge_fields_' . $integrationName,
                        [
                            false,
                            $settings['list_id'],
                            $formId
                        ],
                        FLUENTFORM_FRAMEWORK_UPGRADE,
                        'fluentform/get_integration_merge_fields_' . $integrationName,
                        'Use fluentform/get_integration_merge_fields_' . $integrationName . ' instead of fluentform_get_integration_merge_fields_' . $integrationName
                    );
                    $mergeFields = apply_filters('fluentform/get_integration_merge_fields_' . $integrationName, false, $settings['list_id'], $formId);
                }
            }
        } else {
            $settings = apply_filters_deprecated(
                'fluentform_get_integration_defaults_' . $integrationName,
                [
                    false,
                    $formId
                ],
                FLUENTFORM_FRAMEWORK_UPGRADE,
                'fluentform/get_integration_defaults_' . $integrationName,
                'Use fluentform/get_integration_defaults_' . $integrationName . ' instead of fluentform_get_integration_defaults_' . $integrationName
            );
            $settings = apply_filters('fluentform/get_integration_defaults_' . $integrationName, $settings, $formId);
        }
        
        if ('true' == $settings['enabled']) {
            $settings['enabled'] = true;
        } elseif ('false' == $settings['enabled'] || $settings['enabled']) {
            $settings['enabled'] = false;
        }
        $settings = apply_filters_deprecated(
            'fluentform_get_integration_settings_fields_' . $integrationName,
            [
                $settings,
                $formId,
                $settings
            ],
            FLUENTFORM_FRAMEWORK_UPGRADE,
            'fluentform/get_integration_settings_fields_' . $integrationName,
            'Use fluentform/get_integration_settings_fields_' . $integrationName . ' instead of fluentform_get_integration_settings_fields_' . $integrationName
        );
        $settingsFields = apply_filters('fluentform/get_integration_settings_fields_' . $integrationName, $settings, $formId, $settings);
        
        return ([
            'settings'        => $settings,
            'settings_fields' => $settingsFields,
            'merge_fields'    => $mergeFields,
        ]);
    }
    
    public function update($attr)
    {
        $formId = intval(Arr::get($attr, 'form_id'));
        $integrationId = intval(Arr::get($attr, 'integration_id'));
        $integrationName = sanitize_text_field(Arr::get($attr, 'integration_name'));
        $dataType = sanitize_text_field(Arr::get($attr, 'data_type'));
        $status = Arr::get($attr, 'status', true);
        $metaValue = Arr::get($attr, 'integration');
        
        
        if ('stringify' == $dataType) {
            $metaValue = \json_decode($metaValue, true);
        } else {
            $metaValue = wp_unslash($metaValue);
        }
        $isUpdatingStatus = empty($metaValue);
        
        if ($isUpdatingStatus) {
            $integrationData = FormMeta::findOrFail($integrationId);
            $metaValue = \json_decode($integrationData->value, true);
            $metaValue['enabled'] = $status;
            $metaKey = $integrationData->meta_key;
        } else {
            if (empty($metaValue['name'])) {
                $errors['name'] = [__('Feed name is required', 'fluentform')];
                wp_send_json_error([
                    'message' => __('Validation Failed! Feed name is required', 'fluentform'),
                    'errors'  => $errors
                ], 423);
            }
            $metaValue = apply_filters_deprecated(
                'fluentform_save_integration_value_' . $integrationName,
                [
                    $metaValue,
                    $integrationId,
                    $formId
                ],
                FLUENTFORM_FRAMEWORK_UPGRADE,
                'fluentform/save_integration_value_' . $integrationName,
                'Use fluentform/save_integration_value_' . $integrationName . ' instead of fluentform_save_integration_value_' . $integrationName
            );
            $metaValue = apply_filters('fluentform/save_integration_value_' . $integrationName, $metaValue,
                $integrationId, $formId);
            $metaKey = $integrationName . '_feeds';
        }
        $data = [
            'form_id'  => $formId,
            'meta_key' => $metaKey,
            'value'    => \json_encode($metaValue),
        ];
        $data = apply_filters_deprecated(
            'fluentform_save_integration_settings_' . $integrationName,
            [
                $data,
                $integrationId
            ],
            FLUENTFORM_FRAMEWORK_UPGRADE,
            'fluentform/save_integration_settings_' . $integrationName,
            'Use fluentform/save_integration_settings_' . $integrationName . ' instead of fluentform_save_integration_settings_' . $integrationName
        );
        $data = apply_filters('fluentform/save_integration_settings_' . $integrationName, $data, $integrationId);
        $created = false;
        if ($integrationId) {
            FormMeta::where('form_id', $formId)
                ->where('id', $integrationId)
                ->update($data);
        } else {
            $integrationId = FormMeta::insertGetId($data);
            $created = true;
        }
        
        
        return ([
            'message'          => __('Integration successfully saved', 'fluentform'),
            'integration_id'   => $integrationId,
            'integration_name' => $integrationName,
            'created'          => $created,
        ]);
    }
    
    public function get($formId)
    {
        $notificationKeys = apply_filters_deprecated(
            'fluentform_global_notification_types',
            [
                [],
                $formId
            ],
            FLUENTFORM_FRAMEWORK_UPGRADE,
            'fluentform/global_notification_types',
            'Use fluentform/global_notification_types instead of fluentform_global_notification_types.'
        );
        $notificationKeys = apply_filters('fluentform/global_notification_types', $notificationKeys, $formId);
        $feeds = [];
        if ($notificationKeys) {
            $feeds = FormMeta::whereIn('meta_key', $notificationKeys)->where('form_id', $formId)->get();
        }
        $formattedFeeds = [];
      
        if (!empty($feeds)) {
            foreach ($feeds as $feed) {
                $data = json_decode($feed->value, true);
                $enabled = $data['enabled'];
                if ($enabled && 'true' == $enabled) {
                    $enabled = true;
                } elseif ('false' == $enabled) {
                    $enabled = false;
                }
                $feedData = [
                    'id'       => $feed->id,
                    'name'     => Arr::get($data, 'name'),
                    'enabled'  => $enabled,
                    'provider' => $feed->meta_key,
                    'feed'     => $data,
                ];
                $feedData = apply_filters_deprecated(
                    'fluentform_global_notification_feed_' . $feed->meta_key,
                    [
                        $feedData,
                        $formId
                    ],
                    FLUENTFORM_FRAMEWORK_UPGRADE,
                    'fluentform/global_notification_feed_' . $feed->meta_key,
                    'Use fluentform/global_notification_feed_' . $feed->meta_key . ' instead of fluentform_global_notification_feed_' . $feed->meta_key
                );
                $feedData = apply_filters('fluentform/global_notification_feed_' . $feed->meta_key, $feedData,
                    $formId);
                $formattedFeeds[] = $feedData;
            }
        }
        $availableIntegrations = apply_filters_deprecated(
            'fluentform_get_available_form_integrations',
            [
                [],
                $formId
            ],
            FLUENTFORM_FRAMEWORK_UPGRADE,
            'fluentform/get_available_form_integrations',
            'Use fluentform/get_available_form_integrations instead of fluentform_get_available_form_integrations.'
        );
        $availableIntegrations = apply_filters('fluentform/get_available_form_integrations', $availableIntegrations, $formId);
        
        return ([
            'feeds'                  => $formattedFeeds,
            'available_integrations' => $availableIntegrations,
            'all_module_config_url'  => admin_url('admin.php?page=fluent_forms_add_ons'),
        ]);
    }
    
    public function delete($id)
    {
        FormMeta::where('id',$id)->delete();
    }

    public function sendTestData($attr)
    {
        $formId = intval(Arr::get($attr, 'form_id'));
        $integrationId = intval(Arr::get($attr, 'integration_id'));
        $integrationName = sanitize_text_field(Arr::get($attr, 'integration_name'));
        $dataType = sanitize_text_field(Arr::get($attr, 'data_type'));
        $feedSettings = Arr::get($attr, 'integration');

        if ('stringify' == $dataType) {
            $feedSettings = \json_decode($feedSettings, true);
        }

        $form = Form::find($formId);
        if (!$form) {
            return [
                'status'  => false,
                'message' => __('Form not found', 'fluentform'),
            ];
        }

        // Generate sample form data
        $sampleData = $this->generateSampleFormData($form);
        $sampleData = apply_filters('fluentform/integration_test_sample_data', $sampleData, $form, $integrationName);

        $tempEntry = null;
        try {
            // Create temporary submission for ShortCodeParser
            $tempEntry = Submission::create([
                'form_id'     => $formId,
                'response'    => \json_encode($sampleData),
                'status'      => 'test',
                'source_url'  => admin_url(),
                'serial_number' => 0,
                'created_at'  => current_time('mysql'),
                'updated_at'  => current_time('mysql'),
            ]);

            // Get the feed meta key
            $feed = FormMeta::where(['form_id' => $formId, 'id' => $integrationId])->first();
            if (!$feed) {
                return [
                    'status'  => false,
                    'message' => __('Integration feed not found. Please save the feed first.', 'fluentform'),
                ];
            }

            $metaKey = $feed->meta_key;

            // Process feed values through ShortCodeParser (same as real flow)
            $parsedSettings = $feedSettings;
            if (!empty($parsedSettings)) {
                $parsedSettings = \json_decode(
                    ShortCodeParser::parse(
                        \json_encode($parsedSettings),
                        $tempEntry->id,
                        $sampleData,
                        $form,
                        false,
                        true
                    ),
                    true
                );
            }

            // Capture integration action result
            $actionResult = [
                'status'  => false,
                'message' => __('No response from integration', 'fluentform'),
            ];

            add_action('fluentform/integration_action_result', function ($feed, $status, $message) use (&$actionResult) {
                $actionResult = [
                    'status'  => $status === 'success',
                    'message' => $message,
                ];
            }, 10, 3);

            // Build the feed object as the notify method expects
            $feedData = [
                'meta_key' => $metaKey,
                'settings' => $feedSettings,
            ];
            $feedData = apply_filters('fluentform/global_notification_feed_' . $metaKey, $feedData, $formId);

            // Fire the integration notification synchronously
            do_action('fluentform/integration_notify_' . $metaKey, $feedData, $sampleData, $tempEntry, $form);

            return [
                'status'    => $actionResult['status'],
                'message'   => $actionResult['message'],
                'sent_data' => [
                    'sample_form_data' => $sampleData,
                    'parsed_settings'  => $parsedSettings,
                ],
            ];
        } finally {
            // Always delete temp submission
            if ($tempEntry && $tempEntry->id) {
                Submission::where('id', $tempEntry->id)->delete();
            }
        }
    }

    public function generateSampleFormData($form)
    {
        $fields = FormFieldsParser::getEntryInputs($form, ['admin_label', 'raw']);
        $sampleData = [];

        foreach ($fields as $fieldName => $field) {
            $type = Arr::get($field, 'raw.attributes.type', 'text');
            $element = Arr::get($field, 'raw.element', '');

            switch (true) {
                case $type === 'email' || strpos($fieldName, 'email') !== false:
                    $sampleData[$fieldName] = 'test@example.com';
                    break;
                case $element === 'input_name' || strpos($fieldName, 'name') !== false:
                    if (strpos($fieldName, 'first') !== false) {
                        $sampleData[$fieldName] = 'John';
                    } elseif (strpos($fieldName, 'last') !== false) {
                        $sampleData[$fieldName] = 'Doe';
                    } else {
                        $sampleData[$fieldName] = 'John Doe';
                    }
                    break;
                case $type === 'number' || $element === 'input_number':
                    $sampleData[$fieldName] = 42;
                    break;
                case $type === 'tel' || strpos($fieldName, 'phone') !== false:
                    $sampleData[$fieldName] = '+1-555-0100';
                    break;
                case $type === 'url' || strpos($fieldName, 'website') !== false || strpos($fieldName, 'url') !== false:
                    $sampleData[$fieldName] = 'https://example.com';
                    break;
                case $element === 'textarea':
                    $sampleData[$fieldName] = 'This is sample test data from Fluent Forms integration test.';
                    break;
                case $element === 'select' || $element === 'input_radio':
                    $options = Arr::get($field, 'raw.settings.advanced_options', []);
                    if (!empty($options) && isset($options[0]['value'])) {
                        $sampleData[$fieldName] = $options[0]['value'];
                    } else {
                        $sampleData[$fieldName] = 'Option 1';
                    }
                    break;
                case $element === 'input_checkbox':
                    $options = Arr::get($field, 'raw.settings.advanced_options', []);
                    if (!empty($options) && isset($options[0]['value'])) {
                        $sampleData[$fieldName] = [$options[0]['value']];
                    } else {
                        $sampleData[$fieldName] = ['Option 1'];
                    }
                    break;
                case $element === 'input_date':
                    $sampleData[$fieldName] = date('Y-m-d');
                    break;
                case $element === 'input_hidden':
                    $sampleData[$fieldName] = 'hidden_test_value';
                    break;
                case strpos($fieldName, 'address') !== false || $element === 'address':
                    $sampleData[$fieldName] = '123 Test Street';
                    break;
                case strpos($fieldName, 'city') !== false:
                    $sampleData[$fieldName] = 'Test City';
                    break;
                case strpos($fieldName, 'state') !== false:
                    $sampleData[$fieldName] = 'CA';
                    break;
                case strpos($fieldName, 'zip') !== false || strpos($fieldName, 'postal') !== false:
                    $sampleData[$fieldName] = '90210';
                    break;
                case strpos($fieldName, 'country') !== false:
                    $sampleData[$fieldName] = 'US';
                    break;
                case strpos($fieldName, 'company') !== false || strpos($fieldName, 'organization') !== false:
                    $sampleData[$fieldName] = 'Test Company';
                    break;
                default:
                    $sampleData[$fieldName] = 'Test Value';
                    break;
            }
        }

        return $sampleData;
    }

}
