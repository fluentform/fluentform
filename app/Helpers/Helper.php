<?php

namespace FluentForm\App\Helpers;

use FluentForm\Framework\Helpers\ArrayHelper;

class Helper
{
    public static $tabIndex = 0;

    public static $formInstance = 0;

    public static $loadedForms = [];

    public static $tabIndexStatus = 'na';

    /**
     * Sanitize form inputs recursively.
     *
     * @param $input
     *
     * @return string $input
     */
    public static function sanitizer($input, $attribute = null, $fields = [])
    {
        if (is_string($input)) {
            if ('textarea' === ArrayHelper::get($fields, $attribute . '.element')) {
                $input = sanitize_textarea_field($input);
            } else {
                $input = sanitize_text_field($input);
            }
        } elseif (is_array($input)) {
            foreach ($input as $key => &$value) {
                $attribute = $attribute ? $attribute . '[' . $key . ']' : $key;

                $value = static::sanitizer($value, $attribute, $fields);

                $attribute = null;
            }
        }

        return $input;
    }

    public static function makeMenuUrl($page = 'fluent_forms_settings', $component = null)
    {
        $baseUrl = admin_url('admin.php?page=' . $page);

        $hash = ArrayHelper::get($component, 'hash', '');
        if ($hash) {
            $baseUrl = $baseUrl . '#' . $hash;
        }

        $query = ArrayHelper::get($component, 'query');

        if ($query) {
            $paramString = http_build_query($query);
            if ($hash) {
                $baseUrl .= '?' . $paramString;
            } else {
                $baseUrl .= '&' . $paramString;
            }
        }

        return $baseUrl;
    }

    public static function getHtmlElementClass($value1, $value2, $class = 'active', $default = '')
    {
        return $value1 === $value2 ? $class : $default;
    }

    /**
     * Determines if the given string is a valid json.
     *
     * @param $string
     *
     * @return bool
     */
    public static function isJson($string)
    {
        json_decode($string);

        return JSON_ERROR_NONE === json_last_error();
    }

    public static function isSlackEnabled()
    {
        $globalModules = get_option('fluentform_global_modules_status');

        return $globalModules && isset($globalModules['slack']) && 'yes' == $globalModules['slack'];
    }

    public static function getEntryStatuses($form_id = false)
    {
        $statuses = apply_filters('fluentform_entry_statuses_core', [
            'unread'    => 'Unread',
            'read'      => 'Read',
            'favorites' => 'Favorites',
        ], $form_id);
        $statuses['trashed'] = 'Trashed';

        return $statuses;
    }

    public static function getReportableInputs()
    {
        return apply_filters('fluentform_reportable_inputs', [
            'select',
            'input_radio',
            'input_checkbox',
            'ratings',
            'net_promoter',
            'select_country',
            'net_promoter_score',
        ]);
    }

    public static function getSubFieldReportableInputs()
    {
        return apply_filters('fluentform_subfield_reportable_inputs', [
            'tabular_grid',
        ]);
    }

    public static function getFormMeta($formId, $metaKey, $default = '')
    {
        $meta = wpFluent()->table('fluentform_form_meta')
            ->where('meta_key', $metaKey)
            ->where('form_id', $formId)
            ->first();

        if (!$meta || !$meta->value) {
            return $default;
        }

        $metaValue = $meta->value;
        // decode the JSON data
        $result = json_decode($metaValue, true);

        if (JSON_ERROR_NONE == json_last_error()) {
            return $result;
        }

        return $metaValue;
    }

    public static function setFormMeta($formId, $metaKey, $value)
    {
        $meta = wpFluent()->table('fluentform_form_meta')
            ->where('meta_key', $metaKey)
            ->where('form_id', $formId)
            ->first();

        if (is_array($value) || is_object($value)) {
            $value = json_encode($value);
        }

        if (!$meta) {
            $insetid = wpFluent()->table('fluentform_form_meta')
                ->insertGetId([
                    'meta_key' => $metaKey,
                    'form_id'  => $formId,
                    'value'    => $value,
                ]);

            return $insetid;
        } else {
            wpFluent()->table('fluentform_form_meta')
                ->where('id', $meta->id)
                ->update([
                    'value' => $value,
                ]);
        }

        return $meta->id;
    }

    public static function getSubmissionMeta($submissionId, $metaKey, $default = false)
    {
        $meta = wpFluent()->table('fluentform_submission_meta')
            ->where('response_id', $submissionId)
            ->where('meta_key', $metaKey)
            ->first();

        if ($meta && $meta->value) {
            return maybe_unserialize($meta->value);
        }

        return $default;
    }

    public static function setSubmissionMeta($submissionId, $metaKey, $value, $formId = false)
    {
        $value = maybe_serialize($value);

        // check if submission exist
        $meta = wpFluent()->table('fluentform_submission_meta')
            ->where('response_id', $submissionId)
            ->where('meta_key', $metaKey)
            ->first();

        if ($meta) {
            wpFluent()->table('fluentform_submission_meta')
                ->where('id', $meta->id)
                ->insert([
                    'value'      => $value,
                    'updated_at' => current_time('mysql'),
                ]);

            return $meta->id;
        }

        if (!$formId) {
            $submission = wpFluent()->table('fluentform_submissions')
                ->find($submissionId);
            if ($submission) {
                $formId = $submission->form_id;
            }
        }

        return wpFluent()->table('fluentform_submission_meta')
            ->insertGetId([
                'response_id' => $submissionId,
                'form_id'     => $formId,
                'meta_key'    => $metaKey,
                'value'       => $value,
                'created_at'  => current_time('mysql'),
                'updated_at'  => current_time('mysql'),
            ]);
    }

    public static function isEntryAutoDeleteEnabled($formId)
    {
        $settings = wpFluent()->table('fluentform_form_meta')
            ->where('form_id', $formId)
            ->where('meta_key', 'formSettings')
            ->first();

        if (!$settings) {
            return false;
        }

        $formSettings = json_decode($settings->value, true);

        if ($formSettings && 'yes' == ArrayHelper::get($formSettings, 'delete_entry_on_submission')) {
            return true;
        }

        return false;
    }

    public static function formExtraCssClass($form)
    {
        if (!$form->settings) {
            $settings = wpFluent()->table('fluentform_form_meta')
                ->where('form_id', $form->id)
                ->where('meta_key', 'formSettings')
                ->first();

            $formSettings = json_decode($settings->value, true);
        } else {
            $formSettings = $form->settings;
        }

        if (!$formSettings) {
            return '';
        }

        if ($formSettings && $extraClass = ArrayHelper::get($formSettings, 'form_extra_css_class')) {
            return esc_attr($extraClass);
        }

        return '';
    }

    public static function getNextTabIndex($increment = 1)
    {
        if (static::isTabIndexEnabled()) {
            static::$tabIndex += $increment;

            return static::$tabIndex;
        }

        return '';
    }

    public static function getFormInstaceClass($formId)
    {
        static::$formInstance += 1;

        return 'ff_form_instance_' . $formId . '_' . static::$formInstance;
    }

    public static function resetTabIndex()
    {
        static::$tabIndex = 0;
    }

    public static function isFluentAdminPage()
    {
        $fluentPages = [
            'fluent_forms',
            'fluent_forms_all_entries',
            'fluent_forms_transfer',
            'fluent_forms_settings',
            'fluent_forms_add_ons',
            'fluent_forms_docs',
            'fluent_forms_payment_entries',
            'fluent_forms_smtp',
            'fluent_forms_add_new_form',
        ];

        $status = true;

        $page = wpFluentForm('request')->get('page');

        if (!$page || !in_array($page, $fluentPages)) {
            $status = false;
        }

        return apply_filters('fluentform_is_admin_page', $status);
    }

    public static function getShortCodeIds($content, $tag = 'fluentform', $selector = 'id')
    {
        if (false === strpos($content, '[')) {
            return [];
        }

        preg_match_all('/' . get_shortcode_regex() . '/', $content, $matches, PREG_SET_ORDER);
        if (empty($matches)) {
            return [];
        }

        $ids = [];

        foreach ($matches as $shortcode) {
            if (count($shortcode) >= 2 && $tag === $shortcode[2]) {
                // Replace braces with empty string.
                $parsedCode = str_replace(['[', ']', '&#91;', '&#93;'], '', $shortcode[0]);

                $result = shortcode_parse_atts($parsedCode);

                if (!empty($result[$selector])) {
                    $ids[$result[$selector]] = $result[$selector];
                }
            }
        }

        return $ids;
    }

    public static function isTabIndexEnabled()
    {
        if ('na' == static::$tabIndexStatus) {
            $globalSettings = get_option('_fluentform_global_form_settings');
            static::$tabIndexStatus = 'yes' == ArrayHelper::get($globalSettings, 'misc.tabIndex');
        }

        return static::$tabIndexStatus;
    }

    public static function isMultiStepForm($formId)
    {
        $form = wpFluent()->table('fluentform_forms')->find($formId);
        $fields = json_decode($form->form_fields, true);

        if (ArrayHelper::get($fields, 'stepsWrapper')) {
            return true;
        }

        return false;
    }

    public static function hasFormElement($formId, $elementName)
    {
        $form = wpFluent()->table('fluentform_forms')->find($formId);
        $fieldsJson = $form->form_fields;

        return false != strpos($fieldsJson, '"element":"' . $elementName . '"');
    }

    public static function isUniqueValidation($validation, $field, $formData, $fields, $form)
    {
        if ('yes' == ArrayHelper::get($field, 'raw.settings.is_unique')) {
            $fieldName = ArrayHelper::get($field, 'name');
            if ($inputValue = ArrayHelper::get($formData, $fieldName)) {
                $exist = wpFluent()->table('fluentform_entry_details')
                    ->where('form_id', $form->id)
                    ->where('field_name', $fieldName)
                    ->where('field_value', $inputValue)
                    ->first();
                if ($exist) {
                    return [
                        'unique' => ArrayHelper::get($field, 'raw.settings.unique_validation_message'),
                    ];
                }
            }
        }

        return $validation;
    }

    public static function getNumericFormatters()
    {
        return apply_filters('fluentform_numeric_styles', [
            'none' => [
                'value' => '',
                'label' => 'None',
            ],
            'comma_dot_style' => [
                'value'    => 'comma_dot_style',
                'label'    => __('US Style with Decimal (EX: 123,456.00)', 'fluentform'),
                'settings' => [
                    'decimal'   => '.',
                    'separator' => ',',
                    'precision' => 2,
                    'symbol'    => '',
                ],
            ],
            'dot_comma_style_zero' => [
                'value'    => 'dot_comma_style_zero',
                'label'    => __('US Style without Decimal (Ex: 123,456,789)', 'fluentform'),
                'settings' => [
                    'decimal'   => '.',
                    'separator' => ',',
                    'precision' => 0,
                    'symbol'    => '',
                ],
            ],
            'dot_comma_style' => [
                'value'    => 'dot_comma_style',
                'label'    => __('EU Style with Decimal (Ex: 123.456,00)', 'fluentform'),
                'settings' => [
                    'decimal'   => ',',
                    'separator' => '.',
                    'precision' => 2,
                    'symbol'    => '',
                ],
            ],
            'comma_dot_style_zero' => [
                'value'    => 'comma_dot_style_zero',
                'label'    => __('EU Style without Decimal (EX: 123.456.789)', 'fluentform'),
                'settings' => [
                    'decimal'   => ',',
                    'separator' => '.',
                    'precision' => 0,
                    'symbol'    => '',
                ],
            ],
        ]);
    }

    public static function getNumericValue($input, $formatterName)
    {
        $formatters = static::getNumericFormatters();
        if (empty($formatters[$formatterName]['settings'])) {
            return $input;
        }
        $settings = $formatters[$formatterName]['settings'];
        $number = floatval(str_replace($settings['decimal'], '.', preg_replace('/[^\d' . preg_quote($settings['decimal']) . ']/', '', $input)));

        return number_format($number, $settings['precision'], '.', '');
    }

    public static function getNumericFormatted($input, $formatterName)
    {
        if (!is_numeric($input)) {
            return $input;
        }
        $formatters = static::getNumericFormatters();
        if (empty($formatters[$formatterName]['settings'])) {
            return $input;
        }
        $settings = $formatters[$formatterName]['settings'];

        return number_format($input, $settings['precision'], $settings['decimal'], $settings['separator']);
    }

    public static function getDuplicateFieldNames($fields)
    {
        $fields = json_decode($fields, true);
        $items = $fields['fields'];
        $inputNames = static::getFieldNamesStatuses($items);
        $uniqueNames = array_unique($inputNames);

        if (count($inputNames) == count($uniqueNames)) {
            return [];
        }

        return array_diff_assoc($inputNames, $uniqueNames);
    }

    protected static function getFieldNamesStatuses($fields)
    {
        $names = [];

        foreach ($fields as $field) {
            if ('container' == ArrayHelper::get($field, 'element')) {
                $columns = ArrayHelper::get($field, 'columns', []);
                foreach ($columns as $column) {
                    $columnInputs = static::getFieldNamesStatuses(ArrayHelper::get($column, 'fields', []));
                    $names = array_merge($names, $columnInputs);
                }
            } else {
                if ($name = ArrayHelper::get($field, 'attributes.name')) {
                    $names[] = $name;
                }
            }
        }

        return $names;
    }

    public static function isConversionForm($formId)
    {
        static $cache = [];
        if (isset($cache[$formId])) {
            return $cache[$formId];
        }

        $cache[$formId] = 'yes' == static::getFormMeta($formId, 'is_conversion_form');

        return $cache[$formId];
    }

    public static function getPreviewUrl($formId, $type = '')
    {
        if ('conversational' == $type) {
            return static::getConversionUrl($formId);
        } elseif ('classic' == $type) {
            return site_url('?fluent_forms_pages=1&design_mode=1&preview_id=' . $formId) . '#ff_preview';
        } else {
            if (static::isConversionForm($formId)) {
                return static::getConversionUrl($formId);
            }
        }

        return site_url('?fluent_forms_pages=1&design_mode=1&preview_id=' . $formId) . '#ff_preview';
    }

    public static function getFormAdminPermalink($route, $form)
    {
        $baseUrl = admin_url('admin.php?page=fluent_forms');

        return $baseUrl . '&route=' . $route . '&form_id=' . $form->id;
    }

    public static function getFormSettingsUrl($form)
    {
        $baseUrl = admin_url('admin.php?page=fluent_forms');

        return $baseUrl . '&form_id=' . $form->id . '&route=settings&sub_route=form_settings#basic_settings';
    }

    private static function getConversionUrl($formId)
    {
        $meta = static::getFormMeta($formId, 'ffc_form_settings_meta', []);
        $key = ArrayHelper::get($meta, 'share_key', '');
        $paramKey = apply_filters('fluentform_conversational_url_slug', 'fluent-form');
        if ('form' == $paramKey) {
            $paramKey = 'fluent-form';
        }
        if ($key) {
            return site_url('?' . $paramKey . '=' . $formId . '&form=' . $key);
        }

        return site_url('?' . $paramKey . '=' . $formId);
    }

    public static function fileUploadLocations()
    {
        $locations = [
            [
                'value' => 'default',
                'label' => __('Fluentforms Default', 'fluentform'),
            ],
            [
                'value' => 'wp_media',
                'label' => __('Media Library', 'fluentform'),
            ],
        ];

        return apply_filters('fluentform_file_upload_options', $locations);
    }

    private function unreadCount($formId)
    {
        return wpFluent()->table('fluentform_submissions')
            ->where('status', 'unread')
            ->where('form_id', $formId)
            ->count();
    }

    public static function getForms()
    {
        $ff_list = wpFluent()->table('fluentform_forms')
            ->select(['id', 'title'])
            ->orderBy('id', 'DESC')
            ->get();

        $forms = [];

        if ($ff_list) {
            $forms[0] = esc_html__('Select a Fluent Forms', 'fluentform');
            foreach ($ff_list as $form) {
                $forms[$form->id] = esc_html($form->title) . ' (' . $form->id . ')';
            }
        } else {
            $forms[0] = esc_html__('Create a Form First', 'fluentform');
        }

        return $forms;
    }

    public static function replaceBrTag($content, $with = '')
    {
        if (is_array($content)) {
            foreach ($content as $key => $value) {
                $content[$key] = static::replaceBrTag($value, $with);
            }
        } elseif (static::hasBrTag($content)) {
            $content = str_replace('<br />', $with, $content);
        }

        return $content;
    }

    public static function hasBrTag($content)
    {
        return is_string($content) && false !== strpos($content, '<br />');
    }

    public static function sanitizeForCSV($content)
    {
        $formulas = ['=', '-', '+', '@', "\t", "\r"];

        if (Str::startsWith($content, $formulas)) {
            $content = "'" . $content;
        }

        return $content;
    }

    public static function getForm($id)
    {
        return wpFluent()->table('fluentform_forms')->where('id', $id)->first();
    }

    public static function shouldHidePassword($formId)
    {
        return apply_filters('fluentform_truncate_password_values', true, $formId) &&
        (
            (defined('FLUENTFORM_RENDERING_ENTRIES') && FLUENTFORM_RENDERING_ENTRIES) ||
            (defined('FLUENTFORM_RENDERING_ENTRY') && FLUENTFORM_RENDERING_ENTRY) ||
            (defined('FLUENTFORM_EXPORTING_ENTRIES') && FLUENTFORM_EXPORTING_ENTRIES)
        );
    }

    // make tabular-grid value markdown format
    public static function getTabularGridMarkdownValue($girdData, $field, $rowJoiner = '<br />', $colJoiner = ', ')
    {
        $girdRows = ArrayHelper::get($field, 'raw.settings.grid_rows', '');
        $girdCols = ArrayHelper::get($field, 'raw.settings.grid_columns', '');
        $value = '';
        foreach ($girdData as $row => $column) {
            if ($girdRows && isset($girdRows[$row])) {
                $row = $girdRows[$row];
            }
            $value .= '- *' . $row . '* :  ';
            if (is_array($column)) {
                foreach ($column as $index => $item) {
                    $_colJoiner = $colJoiner;
                    if ($girdCols && isset($girdCols[$item])) {
                        $item = $girdCols[$item];
                    }
                    if ($index == (count($column) - 1)) {
                        $_colJoiner = '';
                    }
                    $value .= $item . $_colJoiner;
                }
            } else {
                if ($girdCols && isset($girdCols[$column])) {
                    $column = $girdCols[$column];
                }
                $value .= $column;
            }
            $value .= $rowJoiner;
        }

        return $value;
    }

    public static function getInputNameFromShortCode($value)
    {
        preg_match('/{+(.*?)}/', $value, $matches);
        if ($matches && false !== strpos($matches[1], 'inputs.')) {
            return substr($matches[1], strlen('inputs.'));
        }

        return '';
    }

    public static function getRestInfo()
    {
        $config = wpFluentForm('config');

        $namespace = $config->get('app.rest_namespace');
        $version = $config->get('app.rest_version');
        $restUrl = rest_url($namespace . '/' . $version);
        $restUrl = rtrim($restUrl, '/\\');

        return [
            'base_url'  => esc_url_raw(rest_url()),
            'url'       => $restUrl,
            'nonce'     => wp_create_nonce('wp_rest'),
            'namespace' => $namespace,
            'version'   => $version,
        ];
    }

    public static function getLogInitiator($action, $type = 'log')
    {
        if ('log' === $type) {
            $title = ucwords(implode(' ', preg_split('/(?=[A-Z])/', $action)));
        } else {
            $title = ucwords(
                str_replace(
                    ['fluentform_integration_notify_', 'fluentform_', '_notification_feed', '_'],
                    ['', '', '', ' '],
                    $action
                )
            );
        }

        return $title;
    }
}
