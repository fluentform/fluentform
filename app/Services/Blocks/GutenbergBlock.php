<?php

namespace FluentForm\App\Services\Blocks;

use FluentForm\App\Helpers\Helper;
use FluentForm\Framework\Support\Arr;

/**
 * GutenbergBlock class for handling Fluent Forms Gutenberg block functionality
 * @since 1.0.0
 */
class GutenbergBlock
{
    /**
     * Register the Gutenberg block
     * @return void
     */
    public static function register()
    {
        if (!function_exists('register_block_type')) {
            return;
        }

        register_block_type('fluentfom/guten-block', [
            'render_callback' => [self::class, 'render'],
            'attributes'      => BlockAttributes::getAttributes()
        ]);
    }

    /**
     * Render the Gutenberg block
     *
     * @param array $atts Block attributes
     *
     * @return string Rendered block HTML
     */
    public static function render($atts)
    {
        $formId = Arr::get($atts, 'formId');

        if (empty($formId)) {
            return '';
        }

        // Define selectors for various form elements
        $baseSelector = '.ff_guten_block.ff_guten_block-' . $formId;
        $buttonSelectorsStr = $baseSelector . ' .ff-btn-submit';
        $labelSelector = $baseSelector . ' .ff-el-input--label label';
        $inputTypes = ['.ff-el-form-control', 'input', 'textarea', 'select'];
        $inputBGSelectorsStr = $baseSelector . ' ' . implode(', ' . $baseSelector . ' ', $inputTypes);
        $placeholderPseudos = ['::placeholder', '::-webkit-input-placeholder', '::-moz-placeholder', ':-ms-input-placeholder', ':-moz-placeholder'];

        $className = Arr::get($atts, 'className');

        if ($className) {
            $classes = explode(' ', $className);
            $className = '';
            if (!empty($classes)) {
                foreach ($classes as $class) {
                    $className .= sanitize_html_class($class) . ' ';
                }
            }
        }

        $themeStyle = sanitize_text_field(Arr::get($atts, 'themeStyle', ''));
        $type = Helper::isConversionForm($formId) ? 'conversational' : '';

        // Generate custom CSS using the StyleProcessor
        $customCSS = StyleProcessor::generateBlockStyles($atts, $formId);

        // Custom CSS for block styling
        $inlineStyle = '';

        // Process button padding
        $buttonPadding = Arr::get($atts, 'buttonPadding', []);
        if (!empty($buttonPadding)) {
            $customCSS .= StyleProcessor::processSpacing($buttonPadding, $buttonSelectorsStr, 'padding');
        }

        // Process button margin
        $buttonMargin = Arr::get($atts, 'buttonMargin', []);
        if (!empty($buttonMargin)) {
            $customCSS .= StyleProcessor::processSpacing($buttonMargin, $buttonSelectorsStr, 'margin');
        }

        // Button box shadow and hover are now handled in StyleProcessor

        // Process label typography
        $labelTypo = Arr::get($atts, 'labelTypography', []);

        if (!empty($labelTypo)) {
            $customCSS .= StyleProcessor::processTypography($labelTypo, $labelSelector);
        }

        // Process input typography
        $inputTypo = Arr::get($atts, 'inputTypography', []);

        if (!empty($inputTypo)) {
            $customCSS .= StyleProcessor::processTypography($inputTypo, $inputBGSelectorsStr);
        }

        // Process placeholder styles - now handled in StyleProcessor


        // Process placeholder typography - now handled in StyleProcessor

        // Process input spacing
        $inputSpacing = Arr::get($atts, 'inputSpacing', []);
        if (!empty($inputSpacing)) {
            $customCSS .= StyleProcessor::processSpacing($inputSpacing, $inputBGSelectorsStr, 'padding');
        }

        // Process input border
        $inputBorder = Arr::get($atts, 'inputBorder', []);
        $inputBorderHover = Arr::get($atts, 'inputBorderHover', []);

        // Get the custom_border flag - default to false if not set
        // This ensures that if no data is saved for custom_border, it defaults to false
        $customBorderEnabled = Arr::get($inputBorder, 'custom_border', false);

        // Check if custom_border is truthy (true, 'true', 1, etc.) but not falsey values ('false', '0', etc.)
        // This handles various data types that might come from the client
        $isBorderEnabled = $customBorderEnabled && $customBorderEnabled !== 'false' && $customBorderEnabled !== '0';

        // Apply border styles if inputBorder is not empty and custom_border is enabled
        if (!empty($inputBorder) && $isBorderEnabled) {
            $borderCSS = StyleProcessor::processBorder($inputBorder, $inputBGSelectorsStr, false);
            if ($borderCSS) {
                $customCSS .= $borderCSS;
            }

            if (!empty($inputBorderHover)) {
                $borderHoverCSS = StyleProcessor::processBorder($inputBorderHover, $inputBGSelectorsStr, true);
                if ($borderHoverCSS) {
                    $customCSS .= $borderHoverCSS;
                }
            }
        }

        // Add the custom CSS inline with the form
        if ($customCSS) {
            // Create a unique ID for this form's styles
            $styleId = 'fluentform-block-styles-' . $formId;

            // Add the styles inline with the form
            $inlineStyle = '<style id="' . esc_attr($styleId) . '">' . $customCSS . '</style>';
        }

        // Return the form with inline styles
        $formOutput = do_shortcode('[fluentform theme="' . $themeStyle . '" css_classes="' . $className . ' ff_guten_block ff_guten_block-' . $formId . '" id="' . $formId . '"  type="' . $type . '"]');

        if ($formOutput) {
            // Add a hidden debug comment to help troubleshoot attribute passing
            if ($inlineStyle) {
                $debugAttrs = [
                    'formId'      => $formId,
                    'spacing'     => !empty($inputSpacing) ? 'yes' : 'no',
                    'border'      => !empty($inputBorder) && $isBorderEnabled ? 'yes' : 'no',
                    'hover'       => !empty($inputBorderHover) ? 'yes' : 'no',
                    'placeholder' => !empty($placeholderColor) || !empty($placeholderFocusColor) || !empty($placeholderTypo) ? 'yes' : 'no'
                ];

                $debugParts = [];
                foreach ($debugAttrs as $key => $value) {
                    $debugParts[] = $key . ': ' . $value;
                }

                $debugInfo = '<!-- FluentForm Block Attributes: ' . implode(', ', $debugParts) . ' -->';
                return $inlineStyle . $debugInfo . $formOutput;
            }
            return $formOutput;
        }

        return '';
    }
}