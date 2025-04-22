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
     * Helper method to generate CSS rule
     *
     * @param string $selector CSS selector
     * @param string $property CSS property
     * @param string $value    CSS value
     * @param string $suffix   Optional suffix for the value (e.g., 'px')
     *
     * @return string Generated CSS rule
     */
    private static function generateCssRule($selector, $property, $value, $suffix = '')
    {
        return "{$selector} { {$property}: {$value}{$suffix}; }\n";
    }

    /**
     * Helper method to process typography settings
     *
     * @param array $typo      Typography settings
     * @param string $selector CSS selector
     *
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
     * @param array $spacing   Spacing settings
     * @param string $selector CSS selector
     * @param string $device   Device type (desktop, tablet, mobile)
     * @param string $unit     Unit type (px, em, %)
     *
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
     * Helper method to process border settings
     *
     * @param array $border    Border settings
     * @param string $selector CSS selector
     * @param boolean $isHover Whether this is for hover state
     *
     * @return string Generated CSS rules
     */
    private static function processBorder($border, $selector, $isHover = false)
    {
        $css = '';

        if (empty($border)) {
            return $css;
        }

        // Start building CSS rules for this selector
        $rules = [];

        // Process border width, style, and color
        // Check if we have individual border sides or a single border object
        $topBorder = Arr::get($border, 'top', []);
        $rightBorder = Arr::get($border, 'right', []);
        $bottomBorder = Arr::get($border, 'bottom', []);
        $leftBorder = Arr::get($border, 'left', []);

        // Check if we have any border properties
        if (!empty($topBorder)) {
            // Border width
            $borderWidth = Arr::get($topBorder, 'width');
            if (!empty($borderWidth)) {
                // Remove 'px' suffix if it already exists
                $borderWidth = str_replace('px', '', $borderWidth);
                $rules[] = 'border-width: ' . $borderWidth . 'px';
            }

            // Border style
            $borderStyle = Arr::get($topBorder, 'style');
            if (!empty($borderStyle)) {
                $rules[] = 'border-style: ' . $borderStyle;
            }

            // Border color
            $borderColor = Arr::get($topBorder, 'color');
            if (!empty($borderColor)) {
                $rules[] = 'border-color: ' . $borderColor;
            }
        } else {
            // Check if we have a color property directly on the border object
            $borderColor = Arr::get($border, 'color');
            if (!empty($borderColor)) {
                $rules[] = 'border-color: ' . $borderColor;
            }

            // Check if we have a width property directly on the border object
            $borderWidth = Arr::get($border, 'width');
            if (!empty($borderWidth)) {
                // Remove 'px' suffix if it already exists
                $borderWidth = str_replace('px', '', $borderWidth);
                $rules[] = 'border-width: ' . $borderWidth . 'px';
            }

            // Check if we have a style property directly on the border object
            $borderStyle = Arr::get($border, 'style');
            if (!empty($borderStyle)) {
                $rules[] = 'border-style: ' . $borderStyle;
            }
        }

        // Process border radius - always process radius if it exists, even if other border properties don't
        $radius = Arr::get($border, 'radius', []);
        // Use isset instead of !empty to catch zero values
        if (isset($radius) && is_array($radius)) {
            $isLinked = Arr::get($radius, 'linked', false);

            if ($isLinked) {
                // If all corners are linked, use a single border-radius property
                $topLeft = Arr::get($radius, 'topLeft');
                // Check if the value is set (including zero)
                if (isset($topLeft) || $topLeft === 0 || $topLeft === '0') {
                    $rules[] = 'border-radius: ' . $topLeft . 'px';
                }
            } else {
                // Individual corner radii
                $radiusRules = [];

                $topLeft = Arr::get($radius, 'topLeft');
                // Check if the value is set (including zero)
                if (isset($topLeft) || $topLeft === 0 || $topLeft === '0') {
                    $radiusRules[] = 'border-top-left-radius: ' . $topLeft . 'px';
                }

                $topRight = Arr::get($radius, 'topRight');
                // Check if the value is set (including zero)
                if (isset($topRight) || $topRight === 0 || $topRight === '0') {
                    $radiusRules[] = 'border-top-right-radius: ' . $topRight . 'px';
                }

                $bottomRight = Arr::get($radius, 'bottomRight');
                // Check if the value is set (including zero)
                if (isset($bottomRight) || $bottomRight === 0 || $bottomRight === '0') {
                    $radiusRules[] = 'border-bottom-right-radius: ' . $bottomRight . 'px';
                }

                $bottomLeft = Arr::get($radius, 'bottomLeft');
                // Check if the value is set (including zero)
                if (isset($bottomLeft) || $bottomLeft === 0 || $bottomLeft === '0') {
                    $radiusRules[] = 'border-bottom-left-radius: ' . $bottomLeft . 'px';
                }

                $rules = array_merge($rules, $radiusRules);
            }
        }

        // Only generate CSS if we have rules
        if (!empty($rules)) {
            if ($isHover) {
                // For hover styles, use :hover and :focus pseudo-classes
                // Split the selector by commas and add :hover and :focus to each part
                $selectorParts = explode(',', $selector);
                $hoverSelectors = [];

                foreach ($selectorParts as $part) {
                    $part = trim($part);
                    $hoverSelectors[] = $part . ':hover';
                    $hoverSelectors[] = $part . ':focus';
                }

                $hoverSelector = implode(', ', $hoverSelectors);
                $css = $hoverSelector . ' { ' . implode('; ', $rules) . '; }' . "\n";
            } else {
                // For normal styles, use the selector as is
                // Add transition if enabled
                if (Arr::get($border, 'enableTransition', true)) {
                    $rules[] = 'transition: border-color 0.3s ease, border-width 0.3s ease, border-style 0.3s ease, border-radius 0.3s ease, background-color 0.3s ease, color 0.3s ease';
                }
                $css = $selector . ' { ' . implode('; ', $rules) . '; }' . "\n";
            }
        }

        return $css;
    }

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
            'attributes'      => [
                'formId'                => [
                    'type' => 'string',
                ],
                'className'             => [
                    'type' => 'string',
                ],
                'themeStyle'            => [
                    'type' => 'string',
                ],
                'isConversationalForm'  => [
                    'type'    => 'boolean',
                    'default' => false,
                ],
                'isThemeChange'         => [
                    'type'    => 'boolean',
                    'default' => false,
                ],
                // Border styles
                'inputBorder'           => [
                    'type' => 'object',
                ],
                'inputBorderHover'      => [
                    'type' => 'object',
                ],
                // Typography and colors
                'labelColor'            => [
                    'type' => 'string',
                ],
                'inputTextColor'        => [
                    'type' => 'string',
                ],
                'inputBackgroundColor'  => [
                    'type' => 'string',
                ],
                'labelTypography'       => [
                    'type' => 'object',
                ],
                'inputTypography'       => [
                    'type' => 'object',
                ],
                'inputSpacing'          => [
                    'type' => 'object',
                ],
                // Button styles
                'buttonColor'           => [
                    'type' => 'string',
                ],
                'buttonBGColor'         => [
                    'type' => 'string',
                ],
                'buttonHoverColor'      => [
                    'type' => 'string',
                ],
                'buttonHoverBGColor'    => [
                    'type' => 'string',
                ],
                'enableTransition'      => [
                    'type'    => 'boolean',
                    'default' => true,
                ],
                // Placeholder styles
                'placeholderColor'      => [
                    'type' => 'string',
                ],
                'placeholderFocusColor' => [
                    'type' => 'string',
                ],
                'placeholderTypography' => [
                    'type' => 'object',
                ],
            ],
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

        // Define base selector and placeholder pseudo-elements
        $baseSelector = ".ff_guten_block.ff_guten_block-{$formId}";
        $inputTypes = ['.ff-el-form-control', 'textarea', 'select'];
        $placeholderPseudos = [
            '::placeholder',
            '::-webkit-input-placeholder',
            '::-moz-placeholder',
            ':-ms-input-placeholder',
            ':-moz-placeholder'
        ];

        // Process label color
        if ($labelColor = Arr::get($atts, 'labelColor')) {
            $customCSS .= self::generateCssRule($labelSelector, 'color', $labelColor);
        }

        // Process input text color
        if ($inputTextColor = Arr::get($atts, 'inputTextColor')) {
            $customCSS .= self::generateCssRule($inputSelectorsStr, 'color', $inputTextColor);

            // Add transition for smooth hover effects if enabled
            if (Arr::get($atts, 'enableTransition', true)) {
                $customCSS .= self::generateCssRule($inputSelectorsStr, 'transition',
                    'color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease, border-width 0.3s ease, border-radius 0.3s ease');
            }
        }

        // Process input background color
        if ($inputBackgroundColor = Arr::get($atts, 'inputBackgroundColor')) {
            $customCSS .= self::generateCssRule($inputBGSelectorsStr, 'background-color', $inputBackgroundColor);
        }

        // Process button text color
        if ($buttonColor = Arr::get($atts, 'buttonColor')) {
            $customCSS .= self::generateCssRule($buttonSelectorsStr, 'color', $buttonColor);

            // Add transition for smooth hover effects if enabled
            if (Arr::get($atts, 'enableTransition', true)) {
                $customCSS .= self::generateCssRule($buttonSelectorsStr, 'transition',
                    'color 0.3s ease, background-color 0.3s ease, border-color 0.3s ease');
            }
        }

        // Process button background color
        if ($buttonBGColor = Arr::get($atts, 'buttonBGColor')) {
            $customCSS .= self::generateCssRule($buttonSelectorsStr, 'background-color', $buttonBGColor);
        }

        // Process button hovers text color
        if ($buttonHoverColor = Arr::get($atts, 'buttonHoverColor')) {
            $customCSS .= self::generateCssRule($buttonSelectorsStr . ":hover, " . $buttonSelectorsStr . ":focus",
                'color', $buttonHoverColor);
        }

        // Process button hover background color
        if ($buttonHoverBGColor = Arr::get($atts, 'buttonHoverBGColor')) {
            $customCSS .= self::generateCssRule($buttonSelectorsStr . ":hover, " . $buttonSelectorsStr . ":focus",
                'background-color', $buttonHoverBGColor);
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

        // Process placeholder styles - handle both set and reset cases
        if (Arr::has($atts, 'placeholderColor')) {
            $placeholderColor = Arr::get($atts, 'placeholderColor');
            // Group selectors by pseudo-element type for more efficient CSS
            foreach ($placeholderPseudos as $pseudo) {
                $groupedSelectors = [];
                foreach ($inputTypes as $inputType) {
                    $groupedSelectors[] = "{$baseSelector} {$inputType}{$pseudo}";
                }
                $selectorStr = implode(', ', $groupedSelectors);

                if (!empty($placeholderColor)) {
                    $customCSS .= self::generateCssRule($selectorStr, 'color', $placeholderColor);
                }

                if (Arr::get($atts, 'enableTransition', true)) {
                    $customCSS .= self::generateCssRule($selectorStr, 'transition', 'color 0.3s ease');
                }
            }
        }


        // Process placeholder typography
        $placeholderTypo = Arr::get($atts, 'placeholderTypography', []);

        if (!empty($placeholderTypo)) {
            // Apply typography to grouped selectors
            foreach ($placeholderPseudos as $pseudo) {
                $groupedSelectors = [];
                foreach ($inputTypes as $inputType) {
                    $groupedSelectors[] = "{$baseSelector} {$inputType}{$pseudo}";
                }
                $selectorStr = implode(', ', $groupedSelectors);
                $customCSS .= self::processTypography($placeholderTypo, $selectorStr);
            }
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
            $borderCSS = self::processBorder($inputBorder, $inputBGSelectorsStr, false);
            if ($borderCSS) {
                $customCSS .= $borderCSS;
            }

            if (!empty($inputBorderHover)) {
                $borderHoverCSS = self::processBorder($inputBorderHover, $inputBGSelectorsStr, true);
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
