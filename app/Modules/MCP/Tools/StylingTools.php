<?php

namespace FluentForm\App\Modules\MCP\Tools;

defined('ABSPATH') || exit;

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Modules\MCP\Support\ErrorCodes;
use FluentForm\App\Modules\MCP\Support\FormAccess;
use FluentForm\App\Modules\MCP\Support\MCPHelper;
use FluentForm\App\Modules\MCP\Support\Mutation;
use FluentForm\App\Services\Settings\Customizer;
use FluentForm\Framework\Support\Arr;

/**
 * Form styling tools (advanced opt-in).
 *
 * Read/write a form's theme preset, structured styler styles, and custom CSS/JS.
 * Theme and structured styles are always writable; custom CSS/JS write only when
 * the user holds unfiltered_html — the same gate the admin styler enforces.
 */
class StylingTools
{
    const STYLE_META = ['_ff_selected_style', '_ff_form_styles', '_custom_form_css', '_custom_form_js'];

    public static function definitions()
    {
        return [
            'fluentform/get-form-styling' => [
                'label'       => __('Get Form Styling', 'fluentform'),
                'group'       => __('Design', 'fluentform'),
                'description' => __('Read a form\'s styling: theme preset (styler_theme), structured styles (styler_styles), and any custom CSS/JS. Requires form_id.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'form_id' => ['type' => 'integer', 'description' => 'Required. The form to read styling for.'],
                    ],
                    'required' => ['form_id'],
                ],
                'execute_callback'    => [self::class, 'getStyling'],
                'capability'          => 'fluentform_forms_manager',
                'annotations' => ['readonly' => true],
                'advanced'    => true,
            ],

            'fluentform/update-form-styling' => [
                'label'       => __('Update Form Styling', 'fluentform'),
                'group'       => __('Design', 'fluentform'),
                'description' => __('Update a form\'s styling. styler_theme (preset id) is always writable. Custom css/js are written only if you hold the unfiltered_html capability; otherwise the call returns unfiltered_html_required and changes nothing. Pass only the keys you want to change. Requires form_id. (Structured styler_styles are read-only via get-form-styling; edit them in the form styler UI.)', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'form_id'      => ['type' => 'integer', 'description' => 'Required. The form to restyle.'],
                        'styler_theme' => ['type' => 'string', 'description' => 'Theme preset id (e.g. ffs_default).'],
                        'css'          => ['type' => 'string', 'description' => 'Custom CSS (requires unfiltered_html).'],
                        'js'           => ['type' => 'string', 'description' => 'Custom JS (requires unfiltered_html).'],
                    ],
                    'required' => ['form_id'],
                    // Unknown keys (e.g. styler_styles) must fail loudly, not be
                    // silently dropped — agents need the signal.
                    'additionalProperties' => false,
                ],
                'execute_callback'    => [self::class, 'updateStyling'],
                'capability'          => 'fluentform_forms_manager',
                'advanced' => true,
            ],
        ];
    }

    /**
     * The structured styles a preset id maps to, from the Pro styler when
     * available, else the free fallback presets — same source
     * DefaultStyleApplicator uses. Null when the preset is unknown.
     */
    private static function presetStyles($theme)
    {
        if (class_exists('\FluentFormPro\classes\FormStyler')) {
            $presets = (new \FluentFormPro\classes\FormStyler())->getPresets();
        } else {
            $presets = [
                'ffs_default'       => ['style' => '[]'],
                'ffs_inherit_theme' => ['style' => '{}'],
            ];
        }

        if (!isset($presets[$theme]['style'])) {
            return null;
        }

        $styles = json_decode($presets[$theme]['style'], true);

        return is_array($styles) ? $styles : null;
    }

    public static function getStyling($params = [])
    {
        $form = FormAccess::resolveForm($params);
        if (is_wp_error($form)) {
            return $form;
        }
        $formId = (int) $form->id;

        $styling = (new Customizer())->get($formId, self::STYLE_META);

        return MCPHelper::envelope(
            sprintf(
                /* translators: %s: form title */
                __('Styling for "%s" loaded.', 'fluentform'),
                $form->title
            ),
            [
                'form_id'       => $formId,
                'styler_theme'  => Arr::get($styling, 'styler_theme'),
                'styler_styles' => Arr::get($styling, 'styler_styles'),
                'css'           => Arr::get($styling, 'css'),
                'js'            => Arr::get($styling, 'js'),
            ]
        );
    }

    public static function updateStyling($params = [])
    {
        $form = FormAccess::resolveForm($params);
        if (is_wp_error($form)) {
            return $form;
        }
        $formId = (int) $form->id;

        $hasTheme = array_key_exists('styler_theme', $params);
        $hasCss   = array_key_exists('css', $params);
        $hasJs    = array_key_exists('js', $params);

        if (!$hasTheme && !$hasCss && !$hasJs) {
            return MCPHelper::error(ErrorCodes::MISSING_PARAM, __('Provide at least one of: styler_theme, css, js.', 'fluentform'), ['fields' => ['styler_theme', 'css', 'js']]);
        }

        // CSS/JS writes require unfiltered_html — the WP-standard gate the styler
        // enforces. Pre-check so the agent gets a structured error instead of the
        // raw exception Customizer::store() throws, and nothing is persisted.
        if (($hasCss || $hasJs) && !fluentformCanUnfilteredHTML()) {
            return MCPHelper::error(ErrorCodes::UNFILTERED_HTML_REQUIRED, __('Saving custom CSS or JS requires the unfiltered_html capability.', 'fluentform'), ['fields' => ['css', 'js']]);
        }

        return Mutation::run('fluentform/update-form-styling', $params, function () use ($formId, $form, $params, $hasTheme, $hasCss, $hasJs) {
            $changed = [];

            if ($hasTheme) {
                $theme = sanitize_text_field($params['styler_theme']);
                Helper::setFormMeta($formId, '_ff_selected_style', $theme);
                // Mirror DefaultStyleApplicator: apply the preset's structured
                // styles too, so get-form-styling reads back what will render
                // instead of the previous theme's stale styles.
                $presetStyles = self::presetStyles($theme);
                if (null !== $presetStyles) {
                    Helper::setFormMeta($formId, '_ff_form_styles', $presetStyles);
                }
                $changed[] = 'styler_theme';
            }

            if ($hasCss || $hasJs) {
                // Customizer::store writes both keys, so preserve the unchanged side.
                $existing = (new Customizer())->get($formId, ['_custom_form_css', '_custom_form_js']);
                (new Customizer())->store([
                    'form_id' => $formId,
                    'css'     => $hasCss ? (string) $params['css'] : Arr::get($existing, 'css', ''),
                    'js'      => $hasJs ? (string) $params['js'] : Arr::get($existing, 'js', ''),
                ]);
                if ($hasCss) {
                    $changed[] = 'css';
                }
                if ($hasJs) {
                    $changed[] = 'js';
                }
            }

            return MCPHelper::envelope(
                sprintf(
                    /* translators: %s: form title */
                    __('Styling for "%s" updated.', 'fluentform'),
                    $form->title
                ),
                ['form_id' => $formId, 'updated' => $changed]
            );
        }, ['form_id' => $formId]);
    }
}
