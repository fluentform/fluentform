<?php

namespace FluentForm\App\Modules\MCP\Tools;

defined('ABSPATH') || exit;

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Modules\MCP\Support\ErrorCodes;
use FluentForm\App\Modules\MCP\Support\FormAccess;
use FluentForm\App\Modules\MCP\Support\MCPHelper;
use FluentForm\App\Modules\MCP\Support\Mutation;
use FluentForm\App\Modules\MCP\Support\PermissionGate;
use FluentForm\App\Services\Settings\Customizer;

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
                'permission_callback' => function () {
                    return PermissionGate::can('fluentform_forms_manager');
                },
                'annotations' => ['readonly' => true],
                'advanced'    => true,
            ],

            'fluentform/update-form-styling' => [
                'label'       => __('Update Form Styling', 'fluentform'),
                'group'       => __('Design', 'fluentform'),
                'description' => __('Update a form\'s styling. styler_theme (preset id) and styler_styles (structured object) are always writable. Custom css/js are written only if you hold the unfiltered_html capability; otherwise the call returns unfiltered_html_required and changes nothing. Pass only the keys you want to change. Requires form_id.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'form_id'       => ['type' => 'integer', 'description' => 'Required. The form to restyle.'],
                        'styler_theme'  => ['type' => 'string', 'description' => 'Theme preset id (e.g. ffs_default).'],
                        'styler_styles' => ['type' => 'object', 'description' => 'Structured styler styles object.'],
                        'css'           => ['type' => 'string', 'description' => 'Custom CSS (requires unfiltered_html).'],
                        'js'            => ['type' => 'string', 'description' => 'Custom JS (requires unfiltered_html).'],
                    ],
                    'required' => ['form_id'],
                ],
                'execute_callback'    => [self::class, 'updateStyling'],
                'permission_callback' => function () {
                    return PermissionGate::can('fluentform_forms_manager');
                },
                'advanced' => true,
            ],
        ];
    }

    public static function getStyling($params = [])
    {
        $form = FormAccess::resolveForm(isset($params['form_id']) ? $params['form_id'] : 0);
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
                'styler_theme'  => isset($styling['styler_theme']) ? $styling['styler_theme'] : null,
                'styler_styles' => isset($styling['styler_styles']) ? $styling['styler_styles'] : null,
                'css'           => isset($styling['css']) ? $styling['css'] : null,
                'js'            => isset($styling['js']) ? $styling['js'] : null,
            ]
        );
    }

    public static function updateStyling($params = [])
    {
        $form = FormAccess::resolveForm(isset($params['form_id']) ? $params['form_id'] : 0);
        if (is_wp_error($form)) {
            return $form;
        }
        $formId = (int) $form->id;

        $hasTheme  = array_key_exists('styler_theme', $params);
        $hasStyles = array_key_exists('styler_styles', $params);
        $hasCss    = array_key_exists('css', $params);
        $hasJs     = array_key_exists('js', $params);

        if (!$hasTheme && !$hasStyles && !$hasCss && !$hasJs) {
            return MCPHelper::error(ErrorCodes::MISSING_PARAM, __('Provide at least one of: styler_theme, styler_styles, css, js.', 'fluentform'), ['fields' => ['styler_theme', 'styler_styles', 'css', 'js']]);
        }

        // CSS/JS writes require unfiltered_html — the WP-standard gate the styler
        // enforces. Pre-check so the agent gets a structured error instead of the
        // raw exception Customizer::store() throws, and nothing is persisted.
        if (($hasCss || $hasJs) && !fluentformCanUnfilteredHTML()) {
            return MCPHelper::error(ErrorCodes::UNFILTERED_HTML_REQUIRED, __('Saving custom CSS or JS requires the unfiltered_html capability.', 'fluentform'), ['fields' => ['css', 'js']]);
        }

        return Mutation::run('fluentform/update-form-styling', $params, function () use ($formId, $form, $params, $hasTheme, $hasStyles, $hasCss, $hasJs) {
            $changed = [];

            if ($hasTheme) {
                Helper::setFormMeta($formId, '_ff_selected_style', sanitize_text_field($params['styler_theme']));
                $changed[] = 'styler_theme';
            }

            if ($hasStyles) {
                $styles = is_array($params['styler_styles']) ? fluentFormSanitizer($params['styler_styles']) : [];
                Helper::setFormMeta($formId, '_ff_form_styles', $styles);
                $changed[] = 'styler_styles';
            }

            if ($hasCss || $hasJs) {
                // Customizer::store writes both keys, so preserve the unchanged side.
                $existing = (new Customizer())->get($formId, ['_custom_form_css', '_custom_form_js']);
                (new Customizer())->store([
                    'form_id' => $formId,
                    'css'     => $hasCss ? (string) $params['css'] : (isset($existing['css']) ? $existing['css'] : ''),
                    'js'      => $hasJs ? (string) $params['js'] : (isset($existing['js']) ? $existing['js'] : ''),
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
