<?php

namespace FluentForm\App\Modules\Form;

use FluentForm\App\Helpers\Helper;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;

class DefaultStyleApplicator
{
    public function __construct()
    {
        add_action('fluentform/inserted_new_form', [$this, 'applyDefaultStyles'], 10, 2);
    }

    /**
     * Apply default style template to newly created forms
     *
     * @param int $formId The ID of the newly created form
     * @param array $formData The form data
     * @return void
     */
    public function applyDefaultStyles($formId, $formData)
    {
        // Get the default style template settings
        $defaultTemplate = get_option('_fluentform_default_style_template');

        // If default template is not enabled or doesn't exist, return early
        if (!$defaultTemplate || !is_array($defaultTemplate) || Arr::get($defaultTemplate, 'enabled') !== 'yes') {
            return;
        }

        // Apply custom CSS if available
        $customCss = Arr::get($defaultTemplate, 'custom_css', '');
        if ($customCss && fluentformCanUnfilteredHTML()) {
            // Replace FF_ID and {form_id} placeholders with actual form ID
            $customCss = str_replace('{form_id}', $formId, $customCss);
            $customCss = str_replace('FF_ID', $formId, $customCss);
            Helper::setFormMeta($formId, '_custom_form_css', $customCss);
        }

        // Apply custom JS if available
        $customJs = Arr::get($defaultTemplate, 'custom_js', '');
        if ($customJs && fluentformCanUnfilteredHTML()) {
            Helper::setFormMeta($formId, '_custom_form_js', $customJs);
        }

        // Apply form styler settings if enabled and available
        $stylerEnabled = Arr::get($defaultTemplate, 'styler_enabled', 'no');
        if ($stylerEnabled === 'yes') {
            // Apply styler theme
            $stylerTheme = Arr::get($defaultTemplate, 'styler_theme', '');
            if ($stylerTheme) {
                Helper::setFormMeta($formId, '_ff_selected_style', $stylerTheme);
            }

            // Apply styler styles
            $stylerStyles = Arr::get($defaultTemplate, 'styler_styles', []);
            if ($stylerStyles && is_array($stylerStyles) && !empty($stylerStyles)) {
                Helper::setFormMeta($formId, '_ff_form_styles', $stylerStyles);
            }
        }
    }
}

