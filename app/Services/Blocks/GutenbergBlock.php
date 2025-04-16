<?php

namespace FluentForm\App\Services\Blocks;

use FluentForm\App\Helpers\Helper;
use FluentForm\Framework\Helpers\ArrayHelper;

/**
 * GutenbergBlock class for handling Fluent Forms Gutenberg block functionality
 *
 * @since 1.0.0
 */
class GutenbergBlock
{
    /**
     * Register the Gutenberg block
     *
     * @return void
     */
    public static function register()
    {
        if (!function_exists('register_block_type')) {
            return;
        }

        register_block_type('fluentfom/guten-block', [
            'render_callback' => [self::class, 'render'],
            'attributes'      => [
                'formId'               => [
                    'type' => 'string',
                ],
                'className'            => [
                    'type' => 'string',
                ],
                'themeStyle'           => [
                    'type'    => 'string',
                ],
                'isConversationalForm' => [
                    'type'    => 'boolean',
                    'default' => false,
                ],
                'isThemeChange'        => [
                    'type'    => 'boolean',
                    'default' => false,
                ],
                // Border styles
                'inputBorder'          => [
                    'type'    => 'object',
                ],
                'inputBorderHover'     => [
                    'type'    => 'object',
                ],
                // Typography and colors
                'labelColor'           => [
                    'type'    => 'string',
                ],
                'inputTextColor'      => [
                    'type'    => 'string',
                ],
                'inputBackgroundColor' => [
                    'type'    => 'string',
                ],
                'labelTypography'      => [
                    'type'    => 'object',
                ],
                'inputTypography'      => [
                    'type'    => 'object',
                ],
                'inputSpacing'         => [
                    'type'    => 'object',
                ],
                // Button styles
                'buttonColor'          => [
                    'type'    => 'string',
                ],
                'buttonBGColor'        => [
                    'type'    => 'string',
                ],
                'buttonHoverColor'     => [
                    'type'    => 'string',
                ],
                'buttonHoverBGColor'   => [
                    'type'    => 'string',
                ],
            ],
            ]);
    }

    /**
     * Render the Gutenberg block
     *
     * @param array $atts Block attributes
     * @return string Rendered block HTML
     */
    public static function render($atts)
    {
        $formId = ArrayHelper::get($atts, 'formId');

        if (empty($formId)) {
            return '';
        }

        $className = ArrayHelper::get($atts, 'className');

        if ($className) {
            $classes = explode(' ', $className);
            $className = '';
            if (!empty($classes)) {
                foreach ($classes as $class) {
                    $className .= sanitize_html_class($class) . ' ';
                }
            }
        }

        $themeStyle = sanitize_text_field(ArrayHelper::get($atts, 'themeStyle', ''));
        $type = Helper::isConversionForm($formId) ? 'conversational' : '';

        // Custom CSS for block styling
        $customCSS = '';
        $inlineStyle = '';

        // Process label color
        $labelColor = ArrayHelper::get($atts, 'labelColor');
        if ($labelColor) {
            $customCSS .= ".ff_guten_block.ff_guten_block-{$formId} .ff-el-input--label label { color: {$labelColor}; }\n";
        }

        // Process input text color
        $inputTextColor = ArrayHelper::get($atts, 'inputTextColor');
        if ($inputTextColor) {
            $inputSelectors = [
                ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-control",
                ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-check-label",
                ".ff_guten_block.ff_guten_block-{$formId} .ff_t_c",
                ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-check-input"
            ];
            $inputSelectorsStr = implode(', ', $inputSelectors);
            $customCSS .= $inputSelectorsStr . " { color: {$inputTextColor}; }\n";
        }

        // Process input background color
        $inputBackgroundColor = ArrayHelper::get($atts, 'inputBackgroundColor');
        if ($inputBackgroundColor) {
            $inputBGSelectors = [
                ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-control",
                ".ff_guten_block.ff_guten_block-{$formId} .select2-container--default .select2-selection--multiple",
                ".ff_guten_block.ff_guten_block-{$formId} .select2-container--default .select2-selection--single",
                ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-check-input"
            ];
            $inputBGSelectorsStr = implode(', ', $inputBGSelectors);
            $customCSS .= $inputBGSelectorsStr . " { background-color: {$inputBackgroundColor}; }\n";
        }

        // Process button text color
        $buttonColor = ArrayHelper::get($atts, 'buttonColor');
        if ($buttonColor) {
            $buttonSelectors = [
                ".ff_guten_block.ff_guten_block-{$formId} .ff-btn-submit",
                ".ff_guten_block.ff_guten_block-{$formId} .ff_upload_btn"
            ];
            $buttonSelectorsStr = implode(', ', $buttonSelectors);
            $customCSS .= $buttonSelectorsStr . " { color: {$buttonColor}; }\n";
        }

        // Process button background color
        $buttonBGColor = ArrayHelper::get($atts, 'buttonBGColor');
        if ($buttonBGColor) {
            $buttonSelectors = [
                ".ff_guten_block.ff_guten_block-{$formId} .ff-btn-submit",
                ".ff_guten_block.ff_guten_block-{$formId} .ff_upload_btn"
            ];
            $buttonSelectorsStr = implode(', ', $buttonSelectors);
            $customCSS .= $buttonSelectorsStr . " { background-color: {$buttonBGColor}; }\n";
        }

        // Process button hover text color
        $buttonHoverColor = ArrayHelper::get($atts, 'buttonHoverColor');
        if ($buttonHoverColor) {
            $buttonSelectors = [
                ".ff_guten_block.ff_guten_block-{$formId} .ff-btn-submit",
                ".ff_guten_block.ff_guten_block-{$formId} .ff_upload_btn"
            ];
            $buttonSelectorsStr = implode(', ', $buttonSelectors);
            $customCSS .= $buttonSelectorsStr . ":hover, " . $buttonSelectorsStr . ":focus { color: {$buttonHoverColor}; }\n";
        }

        // Process button hover background color
        $buttonHoverBGColor = ArrayHelper::get($atts, 'buttonHoverBGColor');
        if ($buttonHoverBGColor) {
            $buttonSelectors = [
                ".ff_guten_block.ff_guten_block-{$formId} .ff-btn-submit",
                ".ff_guten_block.ff_guten_block-{$formId} .ff_upload_btn"
            ];
            $buttonSelectorsStr = implode(', ', $buttonSelectors);
            $customCSS .= $buttonSelectorsStr . ":hover, " . $buttonSelectorsStr . ":focus { background-color: {$buttonHoverBGColor}; }\n";
        }

        // Add the custom CSS inline with the form
        if ($customCSS) {
            // Create a unique ID for this form's styles
            $styleId = 'fluentform-block-styles-' . $formId;

            // Add the styles inline with the form
            $inlineStyle = '<style id="' . esc_attr($styleId) . '">' . $customCSS . '</style>';
        }

        // Return the form with inline styles
        $formOutput = do_shortcode('[fluentform theme="'. $themeStyle .'" css_classes="' . $className . ' ff_guten_block ff_guten_block-' . $formId . '" id="' . $formId . '"  type="' . $type . '"]');

        if ($formOutput) {
            // Add a hidden debug comment to help troubleshoot attribute passing
            if ($inlineStyle) {
                $debugInfo = '<!-- FluentForm Block Attributes: ' .
                             'formId: ' . $formId . ', ' .
                             'labelColor: ' . (empty($labelColor) ? 'empty' : $labelColor) . ', ' .
                             'inputTextColor: ' . (empty($inputTextColor) ? 'empty' : $inputTextColor) . ', ' .
                             'inputBackgroundColor: ' . (empty($inputBackgroundColor) ? 'empty' : $inputBackgroundColor) . ', ' .
                             'buttonColor: ' . (empty($buttonColor) ? 'empty' : $buttonColor) . ' -->';
                return $inlineStyle . $debugInfo . $formOutput;
            }
            return $formOutput;
        }

        return '';
    }
}
