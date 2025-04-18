<?php

namespace FluentForm\App\Services\Blocks;

use FluentForm\App\Helpers\Helper;
use FluentForm\Framework\Support\Arr;

/**
 * GutenbergBlock class for handling Fluent Forms Gutenberg block functionality
 *
 * @since 1.0.0
 */
class GutenbergBlock
{
    /**
     * Helper method to generate CSS rule
     *
     * @param string $selector CSS selector
     * @param string $property CSS property
     * @param string $value CSS value
     * @param string $suffix Optional suffix for the value (e.g., 'px')
     * @return string Generated CSS rule
     */
    private static function generateCssRule($selector, $property, $value, $suffix = '')
    {
        return "{$selector} { {$property}: {$value}{$suffix}; }\n";
    }

    /**
     * Helper method to process typography settings
     *
     * @param array $typo Typography settings
     * @param string $selector CSS selector
     * @return string Generated CSS rules
     */
    private static function processTypography($typo, $selector)
    {
        $css = '';


        // Process font size
        if ($fontSize = Arr::get($typo, 'size.lg')) {
            $css .= self::generateCssRule($selector, 'font-size', $fontSize, 'px');
        }

        // Process font weight
        if ($fontWeight = Arr::get($typo, 'weight')) {
            $css .= self::generateCssRule($selector, 'font-weight', $fontWeight);
        }

        // Process line height
        if ($lineHeight = Arr::get($typo, 'lineHeight')) {
            $css .= self::generateCssRule($selector, 'line-height', $lineHeight);
        }

        // Process letter spacing
        if ($letterSpacing = Arr::get($typo, 'letterSpacing')) {
            $css .= self::generateCssRule($selector, 'letter-spacing', $letterSpacing, 'px');
        }

        // Process text transform
        if ($textTransform = Arr::get($typo, 'textTransform')) {
            $css .= self::generateCssRule($selector, 'text-transform', $textTransform);
        }

        return $css;
    }

    /**
     * Helper method to process spacing settings
     *
     * @param array $spacing Spacing settings
     * @param string $selector CSS selector
     * @param string $device Device type (desktop, tablet, mobile)
     * @param string $unit Unit type (px, em, %)
     * @return string Generated CSS rules
     */
    private static function processSpacing($spacing, $selector, $device = 'desktop', $unit = 'px')
    {
        $css = '';
        $deviceValues = Arr::get($spacing, $device, []);

        if (empty($deviceValues)) {
            return $css;
        }

        // Start building CSS rules for this selector
        $rules = [];

        // Process padding top
        if (isset($deviceValues['top']) && $deviceValues['top'] !== '' && $deviceValues['top'] !== 0) {
            $rules[] = 'padding-top: ' . $deviceValues['top'] . $unit;
        }

        // Process padding right
        if (isset($deviceValues['right']) && $deviceValues['right'] !== '' && $deviceValues['right'] !== 0) {
            $rules[] = 'padding-right: ' . $deviceValues['right'] . $unit;
        }

        // Process padding bottom
        if (isset($deviceValues['bottom']) && $deviceValues['bottom'] !== '' && $deviceValues['bottom'] !== 0) {
            $rules[] = 'padding-bottom: ' . $deviceValues['bottom'] . $unit;
        }

        // Process padding left
        if (isset($deviceValues['left']) && $deviceValues['left'] !== '' && $deviceValues['left'] !== 0) {
            $rules[] = 'padding-left: ' . $deviceValues['left'] . $unit;
        }

        // Only generate CSS if we have rules
        if (!empty($rules)) {
            $css = $selector . ' { ' . implode('; ', $rules) . '; }' . "\n";
        }

        return $css;
    }

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
        $formId = Arr::get($atts, 'formId');

        if (empty($formId)) {
            return '';
        }


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

        // Custom CSS for block styling
        $customCSS = '';
        $inlineStyle = '';

        // Define common selectors
        $labelSelector = ".ff_guten_block.ff_guten_block-{$formId} .ff-el-input--label label";
        $inputSelectors = [
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-control",
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-check-label",
            ".ff_guten_block.ff_guten_block-{$formId} .ff_t_c",
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-check-input"
        ];
        $inputSelectorsStr = implode(', ', $inputSelectors);

        $inputBGSelectors = [
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-control",
            ".ff_guten_block.ff_guten_block-{$formId} .select2-container--default .select2-selection--multiple",
            ".ff_guten_block.ff_guten_block-{$formId} .select2-container--default .select2-selection--single",
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-check-input"
        ];
        $inputBGSelectorsStr = implode(', ', $inputBGSelectors);

        $buttonSelectors = [
            ".ff_guten_block.ff_guten_block-{$formId} .ff-btn-submit",
            ".ff_guten_block.ff_guten_block-{$formId} .ff_upload_btn"
        ];
        $buttonSelectorsStr = implode(', ', $buttonSelectors);

        // Process label color
        if ($labelColor = Arr::get($atts, 'labelColor')) {
            $customCSS .= self::generateCssRule($labelSelector, 'color', $labelColor);
        }

        // Process input text color
        if ($inputTextColor = Arr::get($atts, 'inputTextColor')) {
            $customCSS .= self::generateCssRule($inputSelectorsStr, 'color', $inputTextColor);
        }

        // Process input background color
        if ($inputBackgroundColor = Arr::get($atts, 'inputBackgroundColor')) {
            $customCSS .= self::generateCssRule($inputBGSelectorsStr, 'background-color', $inputBackgroundColor);
        }

        // Process button text color
        if ($buttonColor = Arr::get($atts, 'buttonColor')) {
            $customCSS .= self::generateCssRule($buttonSelectorsStr, 'color', $buttonColor);
        }

        // Process button background color
        if ($buttonBGColor = Arr::get($atts, 'buttonBGColor')) {
            $customCSS .= self::generateCssRule($buttonSelectorsStr, 'background-color', $buttonBGColor);
        }

        // Process button hover text color
        if ($buttonHoverColor = Arr::get($atts, 'buttonHoverColor')) {
            $customCSS .= self::generateCssRule($buttonSelectorsStr . ":hover, " . $buttonSelectorsStr . ":focus", 'color', $buttonHoverColor);
        }

        // Process button hover background color
        if ($buttonHoverBGColor = Arr::get($atts, 'buttonHoverBGColor')) {
            $customCSS .= self::generateCssRule($buttonSelectorsStr . ":hover, " . $buttonSelectorsStr . ":focus", 'background-color', $buttonHoverBGColor);
        }

        // Process label typography
        $labelTypo = Arr::get($atts, 'labelTypography', []);

        if (!empty($labelTypo)) {

            $customCSS .= self::processTypography($labelTypo, $labelSelector);
        }

        // Process input typography
        $inputTypo = Arr::get($atts, 'inputTypography', []);

        if (!empty($inputTypo)) {
            $customCSS .= self::processTypography($inputTypo, $inputBGSelectorsStr);
        }

        // Process input spacing
        $inputSpacing = Arr::get($atts, 'inputSpacing', []);

        if (!empty($inputSpacing)) {
            // Get the unit from the spacing object or default to px
            $globalUnit = Arr::get($inputSpacing, 'unit', 'px');

            // Apply desktop spacing to input fields (no media query needed)
            $desktopUnit = Arr::get($inputSpacing, 'desktop.unit', $globalUnit);
            $desktopCSS = self::processSpacing($inputSpacing, $inputBGSelectorsStr, 'desktop', $desktopUnit);
            if ($desktopCSS) {
                $customCSS .= $desktopCSS;
            }

            // Apply tablet spacing with media query
            if (Arr::has($inputSpacing, 'tablet')) {
                $tabletUnit = Arr::get($inputSpacing, 'tablet.unit', $globalUnit);
                $tabletCSS = self::processSpacing($inputSpacing, $inputBGSelectorsStr, 'tablet', $tabletUnit);
                if ($tabletCSS) {
                    $customCSS .= '@media (max-width: 768px) and (min-width: 481px) { ' . $tabletCSS . ' }';
                }
            }

            // Apply mobile spacing with media query
            if (Arr::has($inputSpacing, 'mobile')) {
                $mobileUnit = Arr::get($inputSpacing, 'mobile.unit', $globalUnit);
                $mobileCSS = self::processSpacing($inputSpacing, $inputBGSelectorsStr, 'mobile', $mobileUnit);
                if ($mobileCSS) {
                    $customCSS .= '@media (max-width: 480px) { ' . $mobileCSS . ' }';
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
        $formOutput = do_shortcode('[fluentform theme="'. $themeStyle .'" css_classes="' . $className . ' ff_guten_block ff_guten_block-' . $formId . '" id="' . $formId . '"  type="' . $type . '"]');

        if ($formOutput) {
            // Add a hidden debug comment to help troubleshoot attribute passing
            if ($inlineStyle) {
                $debugAttrs = [
                    'formId' => $formId,
                    'labelColor' => $labelColor ?: 'empty',
                    'inputTextColor' => $inputTextColor ?: 'empty',
                    'inputBackgroundColor' => $inputBackgroundColor ?: 'empty',
                    'buttonColor' => $buttonColor ?: 'empty',
                    'inputSpacing' => !empty($inputSpacing) ? 'set' : 'empty'
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
