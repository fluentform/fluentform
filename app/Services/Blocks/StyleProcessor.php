<?php

namespace FluentForm\App\Services\Blocks;

use FluentForm\Framework\Support\Arr;

/**
 * StyleProcessor class for processing different style attributes for Fluent Forms Gutenberg blocks
 * @since 1.0.0
 */
class StyleProcessor
{
    // Default breakpoints
    const TABLET_BREAKPOINT = '768px';
    const MOBILE_BREAKPOINT = '480px';

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
    public static function generateCssRule($selector, $property, $value, $suffix = '')
    {
        if (empty($value) && $value !== '0') {
            return '';
        }

        return "{$selector} { {$property}: {$value}{$suffix}; }\n";
    }

    /**
     * Generate all styles for a block
     *
     * @param array $atts Block attributes
     * @param string $formId Form ID
     * @return string Generated CSS
     */
    public static function generateBlockStyles($atts, $formId)
    {
        $css = '';

        // Define all selectors using the form ID for consistency
        // Base selector
        $containerSelector = ".ff_guten_block.ff_guten_block-{$formId}";

        // Label selectors
        $labelSelectors = [
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-input--label label",
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-check-label"
        ];
        $labelSelector = implode(', ', $labelSelectors);

        // Input selectors
        $inputSelectors = [
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-control",
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-check-label",
            ".ff_guten_block.ff_guten_block-{$formId} .ff_t_c",
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-check-input"
        ];
        $inputSelectorsStr = implode(', ', $inputSelectors);

        // Input background selectors
        $inputBGSelectors = [
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-control",
            ".ff_guten_block.ff_guten_block-{$formId} .select2-container--default .select2-selection--multiple",
            ".ff_guten_block.ff_guten_block-{$formId} .select2-container--default .select2-selection--single",
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-check-input"
        ];
        $inputBGSelectorsStr = implode(', ', $inputBGSelectors);

        // Button selectors
        $buttonSelectors = [
            ".ff_guten_block.ff_guten_block-{$formId} .ff-btn-submit",
            ".ff_guten_block.ff_guten_block-{$formId} .ff_upload_btn"
        ];
        $buttonSelectorsStr = implode(', ', $buttonSelectors);

        // Define placeholder selectors
        $inputTypes = ['.ff-el-form-control', 'textarea', 'select'];
        $placeholderPseudos = [
            '::placeholder',
            '::-webkit-input-placeholder',
            '::-moz-placeholder',
            ':-ms-input-placeholder',
            ':-moz-placeholder'
        ];

        // Pass all selectors to the processing methods
        $selectors = [
            'container' => $containerSelector,
            'label' => $labelSelector,
            'input' => $inputSelectorsStr,
            'inputBG' => $inputBGSelectorsStr,
            'button' => $buttonSelectorsStr,
            'formId' => $formId,
            'inputTypes' => $inputTypes,
            'placeholderPseudos' => $placeholderPseudos
        ];

        // Process general container styles
        $css .= self::processContainerStyles($atts, $selectors);

        // Process form field styles
        $css .= self::processFieldStyles($atts, $selectors);

        // Process button styles
        $css .= self::processButtonStyles($atts, $selectors);

        // Process message styles
        $css .= self::processMessageStyles($atts, $selectors);

        // Process responsive visibility
        $css .= self::processResponsiveVisibility($atts, $selectors);

        // Add custom CSS from advanced tab
        $userCustomCss = Arr::get($atts, 'customCss', '');
        if ($userCustomCss) {
            $css .= $userCustomCss;
        }

        return $css;
    }

    /**
     * Process container styles
     *
     * @param array $atts Block attributes
     * @param array $selectors Array of CSS selectors
     * @return string Generated CSS
     */
    public static function processContainerStyles($atts, $selectors)
    {
        // Extract the container selector
        $containerSelector = $selectors['container'];
        $css = '';

        // Process form width
        if ($formWidth = Arr::get($atts, 'formWidth')) {
            $css .= self::generateCssRule($containerSelector, 'width', $formWidth, '%');
        }

        // Process form alignment
        if ($formAlignment = Arr::get($atts, 'formAlignment')) {
            if ($formAlignment === 'center') {
                $css .= self::generateCssRule($containerSelector, 'margin-left', 'auto');
                $css .= self::generateCssRule($containerSelector, 'margin-right', 'auto');
            } else if ($formAlignment === 'right') {
                $css .= self::generateCssRule($containerSelector, 'margin-left', 'auto');
                $css .= self::generateCssRule($containerSelector, 'margin-right', '0');
            } else { // left alignment (default)
                $css .= self::generateCssRule($containerSelector, 'margin-left', '0');
                $css .= self::generateCssRule($containerSelector, 'margin-right', 'auto');
            }
        }

        // Process background
        $css .= self::processBackground($atts, $containerSelector);

        // Process text color
        if ($textColor = Arr::get($atts, 'textColor')) {
            $css .= self::generateCssRule($containerSelector, 'color', $textColor);
        }

        // Process container padding
        $containerPadding = Arr::get($atts, 'containerPadding', []);
        if (!empty($containerPadding)) {
            $css .= self::processSpacing($containerPadding, $containerSelector, 'padding');
        }

        // Process container margin
        $containerMargin = Arr::get($atts, 'containerMargin', []);
        if (!empty($containerMargin)) {
            $css .= self::processSpacing($containerMargin, $containerSelector, 'margin');
        }

        // Process box shadow
        // Convert to boolean to ensure proper type comparison
        $enableBoxShadow = (bool) Arr::get($atts, 'enableBoxShadow', false);
        if ($enableBoxShadow) {
            $boxShadow = [
                'Position' => Arr::get($atts, 'boxShadowPosition', 'outline'),
                'Horizontal' => Arr::get($atts, 'boxShadowHorizontal', ''),
                'HorizontalUnit' => Arr::get($atts, 'boxShadowHorizontalUnit', 'px'),
                'Vertical' => Arr::get($atts, 'boxShadowVertical', ''),
                'VerticalUnit' => Arr::get($atts, 'boxShadowVerticalUnit', 'px'),
                'Blur' => Arr::get($atts, 'boxShadowBlur', ''),
                'BlurUnit' => Arr::get($atts, 'boxShadowBlurUnit', 'px'),
                'Spread' => Arr::get($atts, 'boxShadowSpread', ''),
                'SpreadUnit' => Arr::get($atts, 'boxShadowSpreadUnit', 'px'),
                'Color' => Arr::get($atts, 'boxShadowColor', ''),
            ];

            $css .= self::generateBoxShadow($containerSelector, $boxShadow);
        }

        // Process form border
        // Convert to boolean to ensure proper type comparison
        $enableFormBorder = (bool) Arr::get($atts, 'enableFormBorder', false);
        if ($enableFormBorder) {
            $borderType = Arr::get($atts, 'borderType', 'solid');
            $borderColor = Arr::get($atts, 'borderColor', '#dddddd');

            if ($borderType && $borderColor) {
                $css .= self::generateCssRule($containerSelector, 'border-style', $borderType);
                $css .= self::generateCssRule($containerSelector, 'border-color', $borderColor);
            }

            if ($borderWidth = Arr::get($atts, 'borderWidth', [])) {
                $css .= self::processSpacing($borderWidth, $containerSelector, 'border-width');
            }

            if ($borderRadius = Arr::get($atts, 'borderRadius', [])) {
                $css .= self::processSpacing($borderRadius, $containerSelector, 'border-radius');
            }
        }

        return $css;
    }

    /**
     * Process field styles
     *
     * @param array $atts Block attributes
     * @param array $selectors Array of CSS selectors
     * @return string Generated CSS
     */
    public static function processFieldStyles($atts, $selectors)
    {
        $css = '';

        // Extract selectors
        $containerSelector = $selectors['container'];
        $labelSelector = $selectors['label'];
        $inputSelector = $selectors['input'];
        $inputBGSelectorsStr = $selectors['inputBG'];
        $formId = $selectors['formId'];
        $inputTypes = $selectors['inputTypes'];
        $placeholderPseudos = $selectors['placeholderPseudos'];

        // Asterisk selector
        $asteriskSelector = ".ff_guten_block.ff_guten_block-{$formId} .ff-el-input--label.ff-el-is-required label::after";

        // Apply label color if set
        if ($labelColor = Arr::get($atts, 'labelColor')) {
            $css .= self::generateCssRule($labelSelector, 'color', $labelColor);
        }

        if ($labelTypography = Arr::get($atts, 'labelTypography')) {
            $css .= self::processTypography($labelTypography, $labelSelector);
        }

        if ($asteriskColor = Arr::get($atts, 'asteriskColor')) {
            $css .= self::generateCssRule($asteriskSelector, 'color', $asteriskColor);
        }

        // Input focus selectors
        $inputFocusSelector = self::generateFocusSelectors($inputSelector);

        // Input background selectors
        $inputBGSelectors = [
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-control",
            ".ff_guten_block.ff_guten_block-{$formId} .select2-container--default .select2-selection--multiple",
            ".ff_guten_block.ff_guten_block-{$formId} .select2-container--default .select2-selection--single",
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-check-input"
        ];
        $inputBGSelectorsStr = implode(', ', $inputBGSelectors);

        // Button selectors
        $buttonSelectors = [
            ".ff_guten_block.ff_guten_block-{$formId} .ff-btn-submit",
            ".ff_guten_block.ff_guten_block-{$formId} .ff_upload_btn"
        ];
        $buttonSelectorsStr = implode(', ', $buttonSelectors);
        $buttonHoverSelectorsStr = self::generateHoverSelectors($buttonSelectorsStr);

        // Text and background colors
        if ($inputTextColor = Arr::get($atts, 'inputTextColor')) {
            $css .= self::generateCssRule($inputSelector, 'color', $inputTextColor);
        }

        if ($inputBgColor = Arr::get($atts, 'inputBackgroundColor')) {
            $css .= self::generateCssRule($inputBGSelectorsStr, 'background-color', $inputBgColor);
        }

        // Typography
        if ($inputTypography = Arr::get($atts, 'inputTypography')) {
            $css .= self::processTypography($inputTypography, $inputSelector);
        }

        // Input spacing - using the approach from BlocksPrev
        $inputSpacing = Arr::get($atts, 'inputSpacing', []);

        if (!empty($inputSpacing)) {
            // Get the unit from the spacing object or default to px
            $globalUnit = Arr::get($inputSpacing, 'unit', 'px');

            // Apply desktop spacing to input fields (no media query needed)
            if (isset($inputSpacing['desktop'])) {
                $desktop = $inputSpacing['desktop'];
                $desktopUnit = Arr::get($desktop, 'unit', $globalUnit);

                // Start building CSS rules for this selector
                $rules = [];

                // Process top spacing
                if (isset($desktop['top']) && $desktop['top'] !== '') {
                    $rules[] = 'padding-top: ' . $desktop['top'] . $desktopUnit;
                }

                // Process right spacing
                if (isset($desktop['right']) && $desktop['right'] !== '') {
                    $rules[] = 'padding-right: ' . $desktop['right'] . $desktopUnit;
                }

                // Process bottom spacing
                if (isset($desktop['bottom']) && $desktop['bottom'] !== '') {
                    $rules[] = 'padding-bottom: ' . $desktop['bottom'] . $desktopUnit;
                }

                // Process left spacing
                if (isset($desktop['left']) && $desktop['left'] !== '') {
                    $rules[] = 'padding-left: ' . $desktop['left'] . $desktopUnit;
                }

                // Only generate CSS if we have rules
                if (!empty($rules)) {
                    $css .= $inputSelector . ' { ' . implode('; ', $rules) . '; }' . "\n";
                }
            }
        } else {
            // Set default padding if no spacing is defined
            $css .= $inputSelector . ' { padding: 10px; }' . "\n";
        }

        // Input Border - NORMAL
        $enableInputBorder = Arr::get($atts, 'enableInputBorder', false);

        if ($enableInputBorder) {
            // Border style/color
            $borderType = Arr::get($atts, 'inputBorderType', 'solid');
            $borderColor = Arr::get($atts, 'inputBorderColor', '#dddddd');

            // Set border style and color (even if color is blank, use default)
            $css .= self::generateCssRule($inputSelector, 'border-style', $borderType);
            $css .= self::generateCssRule($inputSelector, 'border-color', $borderColor);

            // Border width with device responsiveness
            $borderWidth = Arr::get($atts, 'inputBorderWidth');

            if (!empty($borderWidth)) {
                $css .= self::processSpacing($borderWidth, $inputSelector, 'border-width');
            }

            // Border radius - using the approach from BlocksPrev
            $borderRadius = Arr::get($atts, 'inputBorderRadius', []);

            if (!empty($borderRadius) && isset($borderRadius['desktop'])) {
                $desktop = $borderRadius['desktop'];
                $unit = Arr::get($desktop, 'unit', 'px');

                // Start building CSS rules for this selector
                $rules = [];

                // Check if values are linked
                if (isset($desktop['linked']) && $desktop['linked']) {
                    // Use the same value for all corners
                    if (isset($desktop['top']) && $desktop['top'] !== '') {
                        $rules[] = 'border-radius: ' . $desktop['top'] . $unit;
                    }
                } else {
                    // Use different values for each corner
                    if (isset($desktop['top']) && $desktop['top'] !== '') {
                        $rules[] = 'border-top-left-radius: ' . $desktop['top'] . $unit;
                    }

                    if (isset($desktop['right']) && $desktop['right'] !== '') {
                        $rules[] = 'border-top-right-radius: ' . $desktop['right'] . $unit;
                    }

                    if (isset($desktop['bottom']) && $desktop['bottom'] !== '') {
                        $rules[] = 'border-bottom-right-radius: ' . $desktop['bottom'] . $unit;
                    }

                    if (isset($desktop['left']) && $desktop['left'] !== '') {
                        $rules[] = 'border-bottom-left-radius: ' . $desktop['left'] . $unit;
                    }
                }

                // Only generate CSS if we have rules
                if (!empty($rules)) {
                    $css .= $inputSelector . ' { ' . implode('; ', $rules) . '; }' . "\n";
                }
            } else {
                // Set default border-radius if no radius is defined
                $css .= $inputSelector . ' { border-radius: 3px; }' . "\n";
            }
        }

        // Input box shadow - NORMAL
        $enableInputBoxShadow = Arr::get($atts, 'enableInputBoxShadow', false);
        if ($enableInputBoxShadow) {
            // Always use a default color if none is specified
            $boxShadowColor = Arr::get($atts, 'inputBoxShadowColor', 'rgba(0,0,0,0.1)');

            $boxShadow = [
                'Position' => Arr::get($atts, 'inputBoxShadowPosition', 'outline'),
                'Horizontal' => Arr::get($atts, 'inputBoxShadowHorizontal', '0'),
                'HorizontalUnit' => Arr::get($atts, 'inputBoxShadowHorizontalUnit', 'px'),
                'Vertical' => Arr::get($atts, 'inputBoxShadowVertical', '2'),
                'VerticalUnit' => Arr::get($atts, 'inputBoxShadowVerticalUnit', 'px'),
                'Blur' => Arr::get($atts, 'inputBoxShadowBlur', '4'),
                'BlurUnit' => Arr::get($atts, 'inputBoxShadowBlurUnit', 'px'),
                'Spread' => Arr::get($atts, 'inputBoxShadowSpread', '0'),
                'SpreadUnit' => Arr::get($atts, 'inputBoxShadowSpreadUnit', 'px'),
                'Color' => $boxShadowColor,
            ];

            // Always generate box shadow when enabled
            $css .= self::generateBoxShadow($inputSelector, $boxShadow);
        }

        // Input styles - FOCUS state
        if ($inputTextFocusColor = Arr::get($atts, 'inputTextFocusColor')) {
            $css .= self::generateCssRule($inputFocusSelector, 'color', $inputTextFocusColor);
        }

        if ($inputBgFocusColor = Arr::get($atts, 'inputBackgroundFocusColor')) {
            $css .= self::generateCssRule($inputFocusSelector, 'background-color', $inputBgFocusColor);
        }

        // Input border - FOCUS
        $enableInputBorderFocus = Arr::get($atts, 'enableInputBorderFocus', false);
        if ($enableInputBorderFocus) {
            // Border style/color
            $borderType = Arr::get($atts, 'inputBorderTypeFocus', 'solid');
            $borderColor = Arr::get($atts, 'inputBorderColorFocus', '');

            if ($borderType && $borderColor) {
                $css .= self::generateCssRule($inputFocusSelector, 'border-style', $borderType);
                $css .= self::generateCssRule($inputFocusSelector, 'border-color', $borderColor);
            }

            // Border width with device responsiveness
            if ($borderWidth = Arr::get($atts, 'inputBorderWidthFocus')) {
                $css .= self::processSpacing($borderWidth, $inputFocusSelector, 'border-width');
            }

            // Border radius - using the approach from BlocksPrev
            $borderRadius = Arr::get($atts, 'inputBorderRadiusFocus', []);

            if (!empty($borderRadius) && isset($borderRadius['desktop'])) {
                $desktop = $borderRadius['desktop'];
                $unit = Arr::get($desktop, 'unit', 'px');

                // Start building CSS rules for this selector
                $rules = [];

                // Check if values are linked
                if (isset($desktop['linked']) && $desktop['linked']) {
                    // Use the same value for all corners
                    if (isset($desktop['top']) && $desktop['top'] !== '') {
                        $rules[] = 'border-radius: ' . $desktop['top'] . $unit;
                    }
                } else {
                    // Use different values for each corner
                    if (isset($desktop['top']) && $desktop['top'] !== '') {
                        $rules[] = 'border-top-left-radius: ' . $desktop['top'] . $unit;
                    }

                    if (isset($desktop['right']) && $desktop['right'] !== '') {
                        $rules[] = 'border-top-right-radius: ' . $desktop['right'] . $unit;
                    }

                    if (isset($desktop['bottom']) && $desktop['bottom'] !== '') {
                        $rules[] = 'border-bottom-right-radius: ' . $desktop['bottom'] . $unit;
                    }

                    if (isset($desktop['left']) && $desktop['left'] !== '') {
                        $rules[] = 'border-bottom-left-radius: ' . $desktop['left'] . $unit;
                    }
                }

                // Only generate CSS if we have rules
                if (!empty($rules)) {
                    $css .= $inputFocusSelector . ' { ' . implode('; ', $rules) . '; }' . "\n";
                }
            } else {
                // Set default border-radius if no radius is defined
                $css .= $inputFocusSelector . ' { border-radius: 3px; }' . "\n";
            }
        } else if ($inputBorderHover = Arr::get($atts, 'inputBorderHover')) {
            // Legacy hover border format
            $css .= self::processBorder($inputBorderHover, $inputFocusSelector, true);
        }

        // Input box shadow - FOCUS
        $enableInputBoxShadowFocus = Arr::get($atts, 'enableInputBoxShadowFocus', false);
        if ($enableInputBoxShadowFocus) {
            $boxShadowColor = Arr::get($atts, 'inputBoxShadowColorFocus', '');

            // Only generate box shadow if we have a color
            if ($boxShadowColor) {
                $boxShadow = [
                    'Position' => Arr::get($atts, 'inputBoxShadowPositionFocus', 'outline'),
                    'Horizontal' => Arr::get($atts, 'inputBoxShadowHorizontalFocus', '0'),
                    'HorizontalUnit' => Arr::get($atts, 'inputBoxShadowHorizontalUnitFocus', 'px'),
                    'Vertical' => Arr::get($atts, 'inputBoxShadowVerticalFocus', '0'),
                    'VerticalUnit' => Arr::get($atts, 'inputBoxShadowVerticalUnitFocus', 'px'),
                    'Blur' => Arr::get($atts, 'inputBoxShadowBlurFocus', '0'),
                    'BlurUnit' => Arr::get($atts, 'inputBoxShadowBlurUnitFocus', 'px'),
                    'Spread' => Arr::get($atts, 'inputBoxShadowSpreadFocus', '0'),
                    'SpreadUnit' => Arr::get($atts, 'inputBoxShadowSpreadUnitFocus', 'px'),
                    'Color' => $boxShadowColor,
                ];

                $css .= self::generateBoxShadow($inputFocusSelector, $boxShadow);
            }
        }

        // Placeholder styles
        $placeholderPseudos = ['::placeholder', '::-webkit-input-placeholder', '::-moz-placeholder', ':-ms-input-placeholder', ':-moz-placeholder'];
        $inputTypes = ['.ff-el-form-control', 'input', 'textarea', 'select'];

        // Process placeholder color
        if ($placeholderColor = Arr::get($atts, 'placeholderColor')) {
            // Group selectors by pseudo-element type for more efficient CSS
            foreach ($placeholderPseudos as $pseudo) {
                $groupedSelectors = [];
                foreach ($inputTypes as $inputType) {
                    $groupedSelectors[] = "{$containerSelector} {$inputType}{$pseudo}";
                }
                $selectorStr = implode(', ', $groupedSelectors);
                $css .= self::generateCssRule($selectorStr, 'color', $placeholderColor);

                if (Arr::get($atts, 'enableTransition', true)) {
                    $css .= self::generateCssRule($selectorStr, 'transition', 'color 0.3s ease');
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
                    $groupedSelectors[] = "{$containerSelector} {$inputType}{$pseudo}";
                }
                $selectorStr = implode(', ', $groupedSelectors);
                $css .= self::processTypography($placeholderTypo, $selectorStr);
            }
        }

        // Placeholder typography is now handled above

        // Radio & Checkbox styles
        if ($radioCheckboxItemsColor = Arr::get($atts, 'radioCheckboxItemsColor')) {
            $radioCheckboxSelectors = [
                $containerSelector . ' .ff-el-form-check-label',
                $containerSelector . ' .ff_list_buttons .ff-el-form-check label>span'
            ];
            $radioCheckboxSelectorsStr = implode(', ', $radioCheckboxSelectors);
            $css .= self::generateCssRule($radioCheckboxSelectorsStr, 'color', $radioCheckboxItemsColor);
        }

        if ($radioCheckboxLabelColor = Arr::get($atts, 'radioCheckboxLabelColor')) {
            $labelSelectors = [
                $containerSelector . ' .ff-el-form-check-label',
                $containerSelector . ' .ff-el-form-check-label span'
            ];
            $labelSelectorsStr = implode(', ', $labelSelectors);
            $css .= self::generateCssRule($labelSelectorsStr, 'color', $radioCheckboxLabelColor);
        }

        if ($radioCheckboxTypography = Arr::get($atts, 'radioCheckboxTypography')) {
            $radioCheckboxSelectors = [
                $containerSelector . ' .ff-el-form-check-label',
                $containerSelector . ' .ff_list_buttons .ff-el-form-check label>span'
            ];
            $radioCheckboxSelectorsStr = implode(', ', $radioCheckboxSelectors);
            $css .= self::processTypography($radioCheckboxTypography, $radioCheckboxSelectorsStr);
        }

        // Process radio checkbox items size
        if ($itemsSize = Arr::get($atts, 'radioCheckboxItemsSize')) {
            // Handle device-specific sizes
            if (is_array($itemsSize) && (isset($itemsSize['desktop']) || isset($itemsSize['tablet']) || isset($itemsSize['mobile']))) {
                $desktopSize = Arr::get($itemsSize, 'desktop', '');
                $tabletSize = Arr::get($itemsSize, 'tablet', '');
                $mobileSize = Arr::get($itemsSize, 'mobile', '');
                $checkboxSelector = $containerSelector . ' .ff-el-form-check-input';

                // Desktop size
                if ($desktopSize !== '') {
                    $css .= self::generateCssRule($checkboxSelector, 'width', $desktopSize, 'px');
                    $css .= self::generateCssRule($checkboxSelector, 'height', $desktopSize, 'px');
                }

                // Tablet size
                if ($tabletSize !== '') {
                    $css .= "@media (max-width: " . self::TABLET_BREAKPOINT . ") {\n";
                    $css .= "    " . $checkboxSelector . " { width: " . $tabletSize . "px; }\n";
                    $css .= "    " . $checkboxSelector . " { height: " . $tabletSize . "px; }\n";
                    $css .= "}\n";
                }

                // Mobile size
                if ($mobileSize !== '') {
                    $css .= "@media (max-width: " . self::MOBILE_BREAKPOINT . ") {\n";
                    $css .= "    " . $checkboxSelector . " { width: " . $mobileSize . "px; }\n";
                    $css .= "    " . $checkboxSelector . " { height: " . $mobileSize . "px; }\n";
                    $css .= "}\n";
                }
            } else {
                // Simple non-responsive size
                $css .= self::generateCssRule(
                    $containerSelector . ' .ff-el-form-check-input',
                    'width',
                    $itemsSize,
                    'px'
                );
                $css .= self::generateCssRule(
                    $containerSelector . ' .ff-el-form-check-input',
                    'height',
                    $itemsSize,
                    'px'
                );
            }
        }

        // Handle transitions for all input elements if enabled
        if (Arr::get($atts, 'enableTransition', true)) {
            $transitionSelectors = [
                $inputSelector,
                $containerSelector . ' .ff-btn-submit'
            ];
            $transitionSelectorsStr = implode(', ', $transitionSelectors);
            $css .= self::generateCssRule($transitionSelectorsStr, 'transition', 'all 0.3s ease-in-out');
        }

        return $css;
    }

    /**
     * Process button styles
     *
     * @param array $atts Block attributes
     * @param array $selectors Array of CSS selectors
     * @return string Generated CSS
     */
    public static function processButtonStyles($atts, $selectors)
    {
        $css = '';

        // Extract selectors
        $containerSelector = $selectors['container'];
        $buttonSelector = $selectors['button'];
        $buttonHoverSelector = self::generateHoverSelectors($buttonSelector);

        // Common Button Alignment (applies to both normal and hover states)
        if ($buttonAlignment = Arr::get($atts, 'buttonAlignment')) {
            $css .= self::generateCssRule(
                $containerSelector . ' .ff_submit_btn_wrapper',
                'text-align',
                $buttonAlignment
            );
        }

        // Common Button Width (applies to both normal and hover states)
        if ($buttonWidth = Arr::get($atts, 'buttonWidth')) {
            $css .= self::generateCssRule($buttonSelector, 'width', $buttonWidth, '%');
        }

        // NORMAL STATE STYLES
        // Button colors
        if ($buttonColor = Arr::get($atts, 'buttonColor')) {
            $css .= self::generateCssRule($buttonSelector, 'color', $buttonColor);
        }

        if ($buttonBgColor = Arr::get($atts, 'buttonBGColor')) {
            $css .= self::generateCssRule($buttonSelector, 'background-color', $buttonBgColor);
        }

        // Button typography
        if ($buttonTypography = Arr::get($atts, 'buttonTypography')) {
            $css .= self::processTypography($buttonTypography, $buttonSelector);
        }

        // Button spacing
        if ($buttonPadding = Arr::get($atts, 'buttonPadding')) {
            $css .= self::processSpacing($buttonPadding, $buttonSelector, 'padding');
        }

        if ($buttonMargin = Arr::get($atts, 'buttonMargin')) {
            $css .= self::processSpacing($buttonMargin, $buttonSelector, 'margin');
        }

        // HOVER STATE STYLES
        if ($buttonHoverColor = Arr::get($atts, 'buttonHoverColor')) {
            $css .= self::generateCssRule($buttonHoverSelector, 'color', $buttonHoverColor);
        }

        if ($buttonHoverBgColor = Arr::get($atts, 'buttonHoverBGColor')) {
            $css .= self::generateCssRule($buttonHoverSelector, 'background-color', $buttonHoverBgColor);
        }

        // Button hover typography
        if ($buttonHoverTypography = Arr::get($atts, 'buttonHoverTypography')) {
            $css .= self::processTypography($buttonHoverTypography, $buttonHoverSelector);
        }

        // Button hover spacing
        if ($buttonHoverPadding = Arr::get($atts, 'buttonHoverPadding')) {
            $css .= self::processSpacing($buttonHoverPadding, $buttonHoverSelector, 'padding');
        }

        if ($buttonHoverMargin = Arr::get($atts, 'buttonHoverMargin')) {
            $css .= self::processSpacing($buttonHoverMargin, $buttonHoverSelector, 'margin');
        }

        // NORMAL STATE - Button border styles
        // Convert to boolean to ensure proper type comparison
        $enableButtonBorder = (bool) Arr::get($atts, 'enableButtonBorder', false);
        if ($enableButtonBorder) {
            $borderType = Arr::get($atts, 'buttonBorderType', 'solid');
            $borderColor = Arr::get($atts, 'buttonBorderColor', '');

            if ($borderType && $borderColor) {
                $css .= self::generateCssRule($buttonSelector, 'border-style', $borderType);
                $css .= self::generateCssRule($buttonSelector, 'border-color', $borderColor);
            }

            if ($borderWidth = Arr::get($atts, 'buttonBorderWidth')) {
                $css .= self::processSpacing($borderWidth, $buttonSelector, 'border-width');
            }

            if ($borderRadius = Arr::get($atts, 'buttonBorderRadius')) {
                $css .= self::processSpacing($borderRadius, $buttonSelector, 'border-radius');
            }
        }

        // HOVER STATE - Button border styles
        $enableButtonHoverBorder = (bool) Arr::get($atts, 'enableButtonHoverBorder', false);
        if ($enableButtonHoverBorder) {
            $borderType = Arr::get($atts, 'buttonHoverBorderType', 'solid');
            $borderColor = Arr::get($atts, 'buttonHoverBorderColor', '');

            if ($borderType && $borderColor) {
                $css .= self::generateCssRule($buttonHoverSelector, 'border-style', $borderType);
                $css .= self::generateCssRule($buttonHoverSelector, 'border-color', $borderColor);
            }

            if ($borderWidth = Arr::get($atts, 'buttonHoverBorderWidth')) {
                $css .= self::processSpacing($borderWidth, $buttonHoverSelector, 'border-width');
            }

            if ($borderRadius = Arr::get($atts, 'buttonHoverBorderRadius')) {
                $css .= self::processSpacing($borderRadius, $buttonHoverSelector, 'border-radius');
            }
        }

        // NORMAL STATE - Button box shadow
        // Convert to boolean to ensure proper type comparison
        $enableButtonBoxShadow = (bool) Arr::get($atts, 'enableButtonBoxShadow', false);
        if ($enableButtonBoxShadow) {
            $boxShadow = [
                'Position' => Arr::get($atts, 'buttonBoxShadowPosition', 'outline'),
                'Horizontal' => Arr::get($atts, 'buttonBoxShadowHorizontal', ''),
                'HorizontalUnit' => Arr::get($atts, 'buttonBoxShadowHorizontalUnit', 'px'),
                'Vertical' => Arr::get($atts, 'buttonBoxShadowVertical', ''),
                'VerticalUnit' => Arr::get($atts, 'buttonBoxShadowVerticalUnit', 'px'),
                'Blur' => Arr::get($atts, 'buttonBoxShadowBlur', ''),
                'BlurUnit' => Arr::get($atts, 'buttonBoxShadowBlurUnit', 'px'),
                'Spread' => Arr::get($atts, 'buttonBoxShadowSpread', ''),
                'SpreadUnit' => Arr::get($atts, 'buttonBoxShadowSpreadUnit', 'px'),
                'Color' => Arr::get($atts, 'buttonBoxShadowColor', ''),
            ];

            $css .= self::generateBoxShadow($buttonSelector, $boxShadow);
        }

        // Process legacy button box shadow format
        $buttonBoxShadow = Arr::get($atts, 'buttonBoxShadow', []);
        if (!empty($buttonBoxShadow) && Arr::get($buttonBoxShadow, 'enable', false)) {
            $inset = Arr::get($buttonBoxShadow, 'inset', false) ? 'inset ' : '';
            $horizontal = Arr::get($buttonBoxShadow, 'horizontal', 0);
            $vertical = Arr::get($buttonBoxShadow, 'vertical', 0);
            $blur = Arr::get($buttonBoxShadow, 'blur', 0);
            $spread = Arr::get($buttonBoxShadow, 'spread', 0);
            $color = Arr::get($buttonBoxShadow, 'color', 'rgba(0,0,0,0.5)');

            $shadowValue = $inset . $horizontal . 'px ' . $vertical . 'px ' . $blur . 'px ' . $spread . 'px ' . $color;
            $css .= self::generateCssRule($buttonSelector, 'box-shadow', $shadowValue, '');
        }

        // HOVER STATE - Button box shadow
        $enableButtonHoverBoxShadow = (bool) Arr::get($atts, 'enableButtonHoverBoxShadow', false);
        if ($enableButtonHoverBoxShadow) {
            $boxShadow = [
                'Position' => Arr::get($atts, 'buttonHoverBoxShadowPosition', 'outline'),
                'Horizontal' => Arr::get($atts, 'buttonHoverBoxShadowHorizontal', ''),
                'HorizontalUnit' => Arr::get($atts, 'buttonHoverBoxShadowHorizontalUnit', 'px'),
                'Vertical' => Arr::get($atts, 'buttonHoverBoxShadowVertical', ''),
                'VerticalUnit' => Arr::get($atts, 'buttonHoverBoxShadowVerticalUnit', 'px'),
                'Blur' => Arr::get($atts, 'buttonHoverBoxShadowBlur', ''),
                'BlurUnit' => Arr::get($atts, 'buttonHoverBoxShadowBlurUnit', 'px'),
                'Spread' => Arr::get($atts, 'buttonHoverBoxShadowSpread', ''),
                'SpreadUnit' => Arr::get($atts, 'buttonHoverBoxShadowSpreadUnit', 'px'),
                'Color' => Arr::get($atts, 'buttonHoverBoxShadowColor', ''),
            ];

            $css .= self::generateBoxShadow($buttonHoverSelector, $boxShadow);
        }

        // Process legacy button box shadow hover format
        $buttonBoxShadowHover = Arr::get($atts, 'buttonBoxShadowHover', []);

        // Always add a box shadow for testing
        if ($buttonHoverBGColor) {
            $css .= self::generateCssRule($buttonHoverSelector, 'box-shadow', '0 0 10px 0 rgba(0,0,0,0.3)', '');
        }

        // Process the actual buttonBoxShadowHover settings if they exist
        if (!empty($buttonBoxShadowHover) && Arr::get($buttonBoxShadowHover, 'enable', false)) {
            // Process the actual buttonBoxShadowHover settings
            $inset = Arr::get($buttonBoxShadowHover, 'inset', false) ? 'inset ' : '';
            $horizontal = Arr::get($buttonBoxShadowHover, 'horizontal', 0);
            $vertical = Arr::get($buttonBoxShadowHover, 'vertical', 0);
            $blur = Arr::get($buttonBoxShadowHover, 'blur', 0);
            $spread = Arr::get($buttonBoxShadowHover, 'spread', 0);
            $color = Arr::get($buttonBoxShadowHover, 'color', 'rgba(0,0,0,0.5)');

            $shadowValue = $inset . $horizontal . 'px ' . $vertical . 'px ' . $blur . 'px ' . $spread . 'px ' . $color;
            $css .= self::generateCssRule($buttonHoverSelector, 'box-shadow', $shadowValue, '');
        }

        return $css;
    }

    /**
     * Process message styles
     *
     * @param array $atts Block attributes
     * @param array $selectors Array of CSS selectors
     * @return string Generated CSS
     */
    public static function processMessageStyles($atts, $selectors)
    {
        $css = '';

        // Extract selectors
        $containerSelector = $selectors['container'];

        // Error message styles
        $errorSelector = $containerSelector . ' .ff-el-is-error .ff-el-form-control';
        $errorLabelSelector = $containerSelector . ' .ff-el-is-error label';
        $errorMessageSelector = $containerSelector . ' .ff-el-is-error .text-danger';

        if ($errorColor = Arr::get($atts, 'errorMessageColor')) {
            $css .= self::generateCssRule($errorMessageSelector, 'color', $errorColor);
        }

        if ($errorTypography = Arr::get($atts, 'errorMessageTypography')) {
            $css .= self::processTypography($errorTypography, $errorMessageSelector);
        }

        if ($alignment = Arr::get($atts, 'errorMessageAlignment')) {
            $css .= self::generateCssRule($errorMessageSelector, 'text-align', $alignment);
        }

        if ($padding = Arr::get($atts, 'errorMessagePadding')) {
            $css .= self::processSpacing($padding, $errorMessageSelector, 'padding');
        }

        // Success message styles
        $successSelector = $containerSelector . ' .ff_form_submission_message';

        if ($successColor = Arr::get($atts, 'successMessageColor')) {
            $css .= self::generateCssRule($successSelector, 'color', $successColor);
        }

        if ($successBgColor = Arr::get($atts, 'successMessageBgColor')) {
            $css .= self::generateCssRule($successSelector, 'background-color', $successBgColor);
        }

        if ($successTypography = Arr::get($atts, 'successMessageTypography')) {
            $css .= self::processTypography($successTypography, $successSelector);
        }

        if ($alignment = Arr::get($atts, 'successMessageAlignment')) {
            $css .= self::generateCssRule($successSelector, 'text-align', $alignment);
        }

        if ($width = Arr::get($atts, 'successMessageWidth')) {
            $unit = Arr::get($atts, 'successMessageWidthUnit', '%');
            $css .= self::generateCssRule($successSelector, 'width', $width, $unit);
        }

        if ($padding = Arr::get($atts, 'successMessagePadding')) {
            $css .= self::processSpacing($padding, $successSelector, 'padding');
        }

        if ($margin = Arr::get($atts, 'successMessageMargin')) {
            $css .= self::processSpacing($margin, $successSelector, 'margin');
        }

        // Success message box shadow
        // Convert to boolean to ensure proper type comparison
        $enableSuccessMessageBoxShadow = (bool) Arr::get($atts, 'enableSuccessMessageBoxShadow', false);
        if ($enableSuccessMessageBoxShadow) {
            $boxShadow = [
                'Position' => Arr::get($atts, 'successMessageBoxShadowPosition', 'outline'),
                'Horizontal' => Arr::get($atts, 'successMessageBoxShadowHorizontal', ''),
                'HorizontalUnit' => Arr::get($atts, 'successMessageBoxShadowHorizontalUnit', 'px'),
                'Vertical' => Arr::get($atts, 'successMessageBoxShadowVertical', ''),
                'VerticalUnit' => Arr::get($atts, 'successMessageBoxShadowVerticalUnit', 'px'),
                'Blur' => Arr::get($atts, 'successMessageBoxShadowBlur', ''),
                'BlurUnit' => Arr::get($atts, 'successMessageBoxShadowBlurUnit', 'px'),
                'Spread' => Arr::get($atts, 'successMessageBoxShadowSpread', ''),
                'SpreadUnit' => Arr::get($atts, 'successMessageBoxShadowSpreadUnit', 'px'),
                'Color' => Arr::get($atts, 'successMessageBoxShadowColor', ''),
            ];

            $css .= self::generateBoxShadow($successSelector, $boxShadow);
        }

        // Success message border
        // Convert to boolean to ensure proper type comparison
        $enableSuccessMessageBorder = (bool) Arr::get($atts, 'enableSuccessMessageBorder', false);
        if ($enableSuccessMessageBorder) {
            $borderType = Arr::get($atts, 'successMessageBorderType', 'solid');
            $borderColor = Arr::get($atts, 'successMessageBorderColor', '');

            if ($borderType && $borderColor) {
                $css .= self::generateCssRule($successSelector, 'border-style', $borderType);
                $css .= self::generateCssRule($successSelector, 'border-color', $borderColor);
            }

            if ($borderWidth = Arr::get($atts, 'successMessageBorderWidth')) {
                $css .= self::processSpacing($borderWidth, $successSelector, 'border-width');
            }

            if ($borderRadius = Arr::get($atts, 'successMessageBorderRadius')) {
                $css .= self::processSpacing($borderRadius, $successSelector, 'border-radius');
            }
        }

        // Submit error message styles
        $submitErrorMessageSelectors = [
            "{$containerSelector} .ff-message-error",
            "{$containerSelector} .fluentform-message.error",
            "{$containerSelector} .ff_form_instance_error_message",
            "{$containerSelector} .ff-el-is-error .error"
        ];
        $submitErrorSelector = implode(', ', $submitErrorMessageSelectors);

        if ($submitErrorColor = Arr::get($atts, 'submitErrorMessageColor')) {
            $css .= self::generateCssRule($submitErrorSelector, 'color', $submitErrorColor);
        }

        if ($submitErrorBgColor = Arr::get($atts, 'submitErrorMessageBgColor')) {
            $css .= self::generateCssRule($submitErrorSelector, 'background-color', $submitErrorBgColor);
        }

        if ($submitErrorTypography = Arr::get($atts, 'submitErrorMessageTypography')) {
            $css .= self::processTypography($submitErrorTypography, $submitErrorSelector);
        }

        if ($alignment = Arr::get($atts, 'submitErrorMessageAlignment')) {
            $css .= self::generateCssRule($submitErrorSelector, 'text-align', $alignment);
        }

        if ($width = Arr::get($atts, 'submitErrorMessageWidth')) {
            $unit = Arr::get($atts, 'submitErrorMessageWidthUnit', '%');
            $css .= self::generateCssRule($submitErrorSelector, 'width', $width, $unit);
        }

        if ($padding = Arr::get($atts, 'submitErrorMessagePadding')) {
            $css .= self::processSpacing($padding, $submitErrorSelector, 'padding');
        }

        if ($margin = Arr::get($atts, 'submitErrorMessageMargin')) {
            $css .= self::processSpacing($margin, $submitErrorSelector, 'margin');
        }

        // Submit error message box shadow
        // Convert to boolean to ensure proper type comparison
        $enableSubmitErrorMessageBoxShadow = (bool) Arr::get($atts, 'enableSubmitErrorMessageBoxShadow', false);
        if ($enableSubmitErrorMessageBoxShadow) {
            $boxShadow = [
                'Position' => Arr::get($atts, 'submitErrorMessageBoxShadowPosition', 'outline'),
                'Horizontal' => Arr::get($atts, 'submitErrorMessageBoxShadowHorizontal', ''),
                'HorizontalUnit' => Arr::get($atts, 'submitErrorMessageBoxShadowHorizontalUnit', 'px'),
                'Vertical' => Arr::get($atts, 'submitErrorMessageBoxShadowVertical', ''),
                'VerticalUnit' => Arr::get($atts, 'submitErrorMessageBoxShadowVerticalUnit', 'px'),
                'Blur' => Arr::get($atts, 'submitErrorMessageBoxShadowBlur', ''),
                'BlurUnit' => Arr::get($atts, 'submitErrorMessageBoxShadowBlurUnit', 'px'),
                'Spread' => Arr::get($atts, 'submitErrorMessageBoxShadowSpread', ''),
                'SpreadUnit' => Arr::get($atts, 'submitErrorMessageBoxShadowSpreadUnit', 'px'),
                'Color' => Arr::get($atts, 'submitErrorMessageBoxShadowColor', ''),
            ];

            $css .= self::generateBoxShadow($submitErrorSelector, $boxShadow);
        }

        // Submit error message border
        // Convert to boolean to ensure proper type comparison
        $enableSubmitErrorMessageBorder = (bool) Arr::get($atts, 'enableSubmitErrorMessageBorder', false);
        if ($enableSubmitErrorMessageBorder) {
            $borderType = Arr::get($atts, 'submitErrorMessageBorderType', 'solid');
            $borderColor = Arr::get($atts, 'submitErrorMessageBorderColor', '');

            if ($borderType && $borderColor) {
                $css .= self::generateCssRule($submitErrorSelector, 'border-style', $borderType);
                $css .= self::generateCssRule($submitErrorSelector, 'border-color', $borderColor);
            }

            if ($borderWidth = Arr::get($atts, 'submitErrorMessageBorderWidth')) {
                $css .= self::processSpacing($borderWidth, $submitErrorSelector, 'border-width');
            }

            if ($borderRadius = Arr::get($atts, 'submitErrorMessageBorderRadius')) {
                $css .= self::processSpacing($borderRadius, $submitErrorSelector, 'border-radius');
            }
        }

        return $css;
    }

    /**
     * Process responsive visibility CSS
     *
     * @param array $atts Block attributes
     * @param array $selectors Array of CSS selectors
     * @return string Generated CSS for responsive visibility
     */
    public static function processResponsiveVisibility($atts, $selectors)
    {
        $css = '';

        // Extract selectors
        $containerSelector = $selectors['container'];

        // Desktop visibility
        if (Arr::get($atts, 'hideOnDesktop', false)) {
            $css .= "@media (min-width: " . self::TABLET_BREAKPOINT . ") {\n";
            $css .= "    {$containerSelector} { display: none !important; }\n";
            $css .= "}\n";
        }

        // Tablet visibility
        if (Arr::get($atts, 'hideOnTablet', false)) {
            $css .= "@media (min-width: " . self::MOBILE_BREAKPOINT . ") and (max-width: " . self::TABLET_BREAKPOINT . ") {\n";
            $css .= "    {$containerSelector} { display: none !important; }\n";
            $css .= "}\n";
        }

        // Mobile visibility
        if (Arr::get($atts, 'hideOnMobile', false)) {
            $css .= "@media (max-width: " . self::MOBILE_BREAKPOINT . ") {\n";
            $css .= "    {$containerSelector} { display: none !important; }\n";
            $css .= "}\n";
        }

        return $css;
    }

    /**
     * Process typography settings for all devices
     *
     * @param array $typography Typography settings
     * @param string $selector CSS selector
     *
     * @return string Generated CSS rules
     */
    public static function processTypography($typography, $selector)
    {
        $css = '';

        if (empty($typography)) {
            return $css;
        }

        // Process font weight
        if ($fontWeight = Arr::get($typography, 'weight')) {
            $css .= self::generateCssRule($selector, 'font-weight', $fontWeight);
        }

        // Process line height
        if ($lineHeight = Arr::get($typography, 'lineHeight')) {
            $css .= self::generateCssRule($selector, 'line-height', $lineHeight);
        }

        // Process letter spacing
        if ($letterSpacing = Arr::get($typography, 'letterSpacing')) {
            $css .= self::generateCssRule($selector, 'letter-spacing', $letterSpacing, 'px');
        }

        // Process text transform
        if ($textTransform = Arr::get($typography, 'textTransform')) {
            $css .= self::generateCssRule($selector, 'text-transform', $textTransform);
        }

        // Desktop font size
        if ($desktopFontSize = Arr::get($typography, 'size.lg')) {
            $css .= self::generateCssRule($selector, 'font-size', $desktopFontSize, 'px');
        }

        // Tablet font size
        if ($tabletFontSize = Arr::get($typography, 'size.md')) {
            $css .= "@media (max-width: " . self::TABLET_BREAKPOINT . ") {\n";
            $css .= "    " . self::generateCssRule($selector, 'font-size', $tabletFontSize, 'px');
            $css .= "}\n";
        }

        // Mobile font size
        if ($mobileFontSize = Arr::get($typography, 'size.sm')) {
            $css .= "@media (max-width: " . self::MOBILE_BREAKPOINT . ") {\n";
            $css .= "    " . self::generateCssRule($selector, 'font-size', $mobileFontSize, 'px');
            $css .= "}\n";
        }

        return $css;
    }

    /**
     * Process border settings for all devices
     *
     * @param array $border Border settings
     * @param string $selector CSS selector
     * @param boolean $isHover Whether this is for hover/focus state
     *
     * @return string Generated CSS rules
     */
    public static function processBorder($border, $selector, $isHover = false)
    {
        $css = '';

        if (empty($border)) {
            return $css;
        }

        // Handle desktop borders
        $desktopValues = isset($border['desktop']) ? $border['desktop'] : $border;

        if (!empty($desktopValues)) {
            $desktopRules = self::getBorderRules($desktopValues);

            if (!empty($desktopRules)) {
                if ($isHover) {
                    $hoverSelector = self::generateHoverSelectors($selector);
                    $css .= $hoverSelector . ' { ' . implode('; ', $desktopRules) . '; }' . "\n";
                } else {
                    $css .= $selector . ' { ' . implode('; ', $desktopRules) . '; }' . "\n";
                }
            }
        }

        // Handle tablet borders
        if (isset($border['tablet']) && !empty($border['tablet'])) {
            $tabletValues = $border['tablet'];
            $tabletRules = self::getBorderRules($tabletValues);

            if (!empty($tabletRules)) {
                $css .= "@media (max-width: " . self::TABLET_BREAKPOINT . ") {\n";

                if ($isHover) {
                    $hoverSelector = self::generateHoverSelectors($selector);
                    $css .= "    " . $hoverSelector . ' { ' . implode('; ', $tabletRules) . '; }' . "\n";
                } else {
                    $css .= "    " . $selector . ' { ' . implode('; ', $tabletRules) . '; }' . "\n";
                }

                $css .= "}\n";
            }
        }

        // Handle mobile borders
        if (isset($border['mobile']) && !empty($border['mobile'])) {
            $mobileValues = $border['mobile'];
            $mobileRules = self::getBorderRules($mobileValues);

            if (!empty($mobileRules)) {
                $css .= "@media (max-width: " . self::MOBILE_BREAKPOINT . ") {\n";

                if ($isHover) {
                    $hoverSelector = self::generateHoverSelectors($selector);
                    $css .= "    " . $hoverSelector . ' { ' . implode('; ', $mobileRules) . '; }' . "\n";
                } else {
                    $css .= "    " . $selector . ' { ' . implode('; ', $mobileRules) . '; }' . "\n";
                }

                $css .= "}\n";
            }
        }

        return $css;
    }

    /**
     * Get border CSS rules from values
     *
     * @param array $values Border values for a device
     *
     * @return array Array of CSS rules
     */
    private static function getBorderRules($values)
    {
        $rules = [];

        // If we have a top border with properties
        $topBorder = Arr::get($values, 'top', []);
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
        }

        // If we have a radius object
        $radiusObj = Arr::get($values, 'radius', []);
        if (!empty($radiusObj)) {
            $topLeft = Arr::get($radiusObj, 'topLeft');
            if (isset($topLeft) || $topLeft === 0 || $topLeft === '0') {
                $rules[] = 'border-top-left-radius: ' . $topLeft . 'px';
            }

            $topRight = Arr::get($radiusObj, 'topRight');
            if (isset($topRight) || $topRight === 0 || $topRight === '0') {
                $rules[] = 'border-top-right-radius: ' . $topRight . 'px';
            }

            $bottomRight = Arr::get($radiusObj, 'bottomRight');
            if (isset($bottomRight) || $bottomRight === 0 || $bottomRight === '0') {
                $rules[] = 'border-bottom-right-radius: ' . $bottomRight . 'px';
            }

            $bottomLeft = Arr::get($radiusObj, 'bottomLeft');
            if (isset($bottomLeft) || $bottomLeft === 0 || $bottomLeft === '0') {
                $rules[] = 'border-bottom-left-radius: ' . $bottomLeft . 'px';
            }
        }

        // Add transitions if enabled and not in hover state
        if (Arr::get($values, 'enableTransition', true)) {
            $rules[] = 'transition: border-color 0.3s ease, border-width 0.3s ease, border-style 0.3s ease, border-radius 0.3s ease, background-color 0.3s ease, color 0.3s ease';
        }

        return $rules;
    }

    /**
     * Process spacing settings (padding, margin, etc.) for all devices
     *
     * @param array $spacing Spacing values
     * @param string $selector CSS selector
     * @param string $property CSS property type (padding, margin, etc.)
     *
     * @return string Generated CSS rules
     */
    public static function processSpacing($spacing, $selector, $property = 'padding')
    {
        $css = '';

        if (empty($spacing)) {
            return $css;
        }

        // Check if pre-generated CSS is available
        if (isset($spacing['css'])) {
            // Use pre-generated CSS
            $preGeneratedCss = $spacing['css'];

            // Handle desktop CSS
            if (isset($preGeneratedCss['desktop'])) {
                $desktopCss = $preGeneratedCss['desktop'];

                if (is_string($desktopCss)) {
                    // Shorthand CSS
                    $css .= $selector . ' { ' . $property . ': ' . $desktopCss . '; }' . "\n";
                } else if (is_array($desktopCss)) {
                    // Individual CSS properties
                    $rules = [];

                    if (!empty($desktopCss['top'])) {
                        $rules[] = $property . '-top: ' . $desktopCss['top'];
                    }

                    if (!empty($desktopCss['right'])) {
                        $rules[] = $property . '-right: ' . $desktopCss['right'];
                    }

                    if (!empty($desktopCss['bottom'])) {
                        $rules[] = $property . '-bottom: ' . $desktopCss['bottom'];
                    }

                    if (!empty($desktopCss['left'])) {
                        $rules[] = $property . '-left: ' . $desktopCss['left'];
                    }

                    if (!empty($rules)) {
                        $css .= $selector . ' { ' . implode('; ', $rules) . '; }' . "\n";
                    }
                }
            }

            // Handle tablet CSS with media query
            if (isset($preGeneratedCss['tablet'])) {
                $tabletCss = $preGeneratedCss['tablet'];

                if (!empty($tabletCss)) {
                    $css .= '@media (max-width: 768px) {' . "\n";

                    if (is_string($tabletCss)) {
                        // Shorthand CSS
                        $css .= '  ' . $selector . ' { ' . $property . ': ' . $tabletCss . '; }' . "\n";
                    } else if (is_array($tabletCss)) {
                        // Individual CSS properties
                        $rules = [];

                        if (!empty($tabletCss['top'])) {
                            $rules[] = $property . '-top: ' . $tabletCss['top'];
                        }

                        if (!empty($tabletCss['right'])) {
                            $rules[] = $property . '-right: ' . $tabletCss['right'];
                        }

                        if (!empty($tabletCss['bottom'])) {
                            $rules[] = $property . '-bottom: ' . $tabletCss['bottom'];
                        }

                        if (!empty($tabletCss['left'])) {
                            $rules[] = $property . '-left: ' . $tabletCss['left'];
                        }

                        if (!empty($rules)) {
                            $css .= '  ' . $selector . ' { ' . implode('; ', $rules) . '; }' . "\n";
                        }
                    }

                    $css .= '}' . "\n";
                }
            }

            // Handle mobile CSS with media query
            if (isset($preGeneratedCss['mobile'])) {
                $mobileCss = $preGeneratedCss['mobile'];

                if (!empty($mobileCss)) {
                    $css .= '@media (max-width: 480px) {' . "\n";

                    if (is_string($mobileCss)) {
                        // Shorthand CSS
                        $css .= '  ' . $selector . ' { ' . $property . ': ' . $mobileCss . '; }' . "\n";
                    } else if (is_array($mobileCss)) {
                        // Individual CSS properties
                        $rules = [];

                        if (!empty($mobileCss['top'])) {
                            $rules[] = $property . '-top: ' . $mobileCss['top'];
                        }

                        if (!empty($mobileCss['right'])) {
                            $rules[] = $property . '-right: ' . $mobileCss['right'];
                        }

                        if (!empty($mobileCss['bottom'])) {
                            $rules[] = $property . '-bottom: ' . $mobileCss['bottom'];
                        }

                        if (!empty($mobileCss['left'])) {
                            $rules[] = $property . '-left: ' . $mobileCss['left'];
                        }

                        if (!empty($rules)) {
                            $css .= '  ' . $selector . ' { ' . implode('; ', $rules) . '; }' . "\n";
                        }
                    }

                    $css .= '}' . "\n";
                }
            }

            return $css;
        }

        // Fall back to the original implementation if pre-generated CSS is not available
        // Handle desktop spacing
        if (isset($spacing['desktop']) || (
                isset($spacing['top']) || isset($spacing['right']) ||
                isset($spacing['bottom']) || isset($spacing['left']) || isset($spacing['unit'])
            )) {
            // If spacing has desktop key, use that, otherwise use the spacing object directly
            $desktopValues = isset($spacing['desktop']) ? $spacing['desktop'] : $spacing;

            // Ensure we have a valid unit
            $unit = 'px'; // Default unit
            if (isset($desktopValues['unit']) && !empty($desktopValues['unit'])) {
                $unit = $desktopValues['unit'];
            } elseif (isset($spacing['unit']) && !empty($spacing['unit'])) {
                $unit = $spacing['unit'];
            }

            $desktopRules = self::getSpacingRules($desktopValues, $property, $unit);

            if (!empty($desktopRules)) {
                $css .= $selector . ' { ' . implode('; ', $desktopRules) . '; }' . "\n";
            }
        }

        // Handle tablet spacing
        if (isset($spacing['tablet']) && !empty($spacing['tablet'])) {
            $tabletValues = $spacing['tablet'];
            $unit = isset($tabletValues['unit']) ? $tabletValues['unit'] : 'px';

            $tabletRules = self::getSpacingRules($tabletValues, $property, $unit);

            if (!empty($tabletRules)) {
                $css .= "@media (max-width: " . self::TABLET_BREAKPOINT . ") {\n";
                $css .= "    " . $selector . ' { ' . implode('; ', $tabletRules) . '; }' . "\n";
                $css .= "}\n";
            }
        }

        // Handle mobile spacing
        if (isset($spacing['mobile']) && !empty($spacing['mobile'])) {
            $mobileValues = $spacing['mobile'];
            $unit = isset($mobileValues['unit']) ? $mobileValues['unit'] : 'px';

            $mobileRules = self::getSpacingRules($mobileValues, $property, $unit);

            if (!empty($mobileRules)) {
                $css .= "@media (max-width: " . self::MOBILE_BREAKPOINT . ") {\n";
                $css .= "    " . $selector . ' { ' . implode('; ', $mobileRules) . '; }' . "\n";
                $css .= "}\n";
            }
        }

        return $css;
    }

    /**
     * Get spacing CSS rules from values
     *
     * @param array $values Spacing values for a device
     * @param string $property CSS property type
     * @param string $unit CSS unit
     *
     * @return array Array of CSS rules
     */
    private static function getSpacingRules($values, $property, $unit = 'px')
    {
        $rules = [];

        // Debug the values
        error_log('StyleProcessor::getSpacingRules - Values: ' . print_r($values, true));
        error_log('StyleProcessor::getSpacingRules - Property: ' . $property);
        error_log('StyleProcessor::getSpacingRules - Unit: ' . $unit);

        // Special handling for border-radius
        if ($property === 'border-radius') {
            // Force linked to true for border-radius
            $linked = true;

            if ($linked && isset($values['top']) && $values['top'] !== '' && $values['top'] !== null) {
                // Use a single border-radius value for all corners
                $rules[] = $property . ': ' . $values['top'] . $unit;
            } else {
                // Use individual border-radius values for each corner
                if (isset($values['top']) && $values['top'] !== '' && $values['top'] !== null) {
                    $rules[] = 'border-top-left-radius: ' . $values['top'] . $unit;
                }
                if (isset($values['right']) && $values['right'] !== '' && $values['right'] !== null) {
                    $rules[] = 'border-top-right-radius: ' . $values['right'] . $unit;
                }
                if (isset($values['bottom']) && $values['bottom'] !== '' && $values['bottom'] !== null) {
                    $rules[] = 'border-bottom-right-radius: ' . $values['bottom'] . $unit;
                }
                if (isset($values['left']) && $values['left'] !== '' && $values['left'] !== null) {
                    $rules[] = 'border-bottom-left-radius: ' . $values['left'] . $unit;
                }
            }
        } else {
            // Standard spacing properties (padding, margin, etc.)
            // Force linked to true for all spacing properties
            $linked = true;

            // If linked and top value exists, use it for all sides
            if ($linked && isset($values['top']) && $values['top'] !== '' && $values['top'] !== null) {
                $rules[] = $property . ': ' . $values['top'] . $unit; // Shorthand for all sides
            } else {
                // Process individual sides
                // Process top spacing
                if (isset($values['top']) && $values['top'] !== '' && $values['top'] !== null) {
                    $rules[] = $property . '-top: ' . $values['top'] . $unit;
                }

                // Process right spacing
                if (isset($values['right']) && $values['right'] !== '' && $values['right'] !== null) {
                    $rules[] = $property . '-right: ' . $values['right'] . $unit;
                }

                // Process bottom spacing
                if (isset($values['bottom']) && $values['bottom'] !== '' && $values['bottom'] !== null) {
                    $rules[] = $property . '-bottom: ' . $values['bottom'] . $unit;
                }

                // Process left spacing
                if (isset($values['left']) && $values['left'] !== '' && $values['left'] !== null) {
                    $rules[] = $property . '-left: ' . $values['left'] . $unit;
                }
            }
        }

        return $rules;
    }

    /**
     * Generate box shadow CSS
     *
     * @param string $selector CSS selector
     * @param array $boxShadow Box shadow properties
     *
     * @return string Generated CSS rules
     */
    public static function generateBoxShadow($selector, $boxShadow)
    {
        // Check if we have all required values
        if (empty($boxShadow) || empty($selector)) {
            return '';
        }

        // Get position (inset or outline)
        $position = Arr::get($boxShadow, 'Position', 'outline');
        $inset = $position === 'inset' ? 'inset ' : '';

        // Get horizontal offset
        $horizontal = Arr::get($boxShadow, 'Horizontal', '0');
        $horizontalUnit = Arr::get($boxShadow, 'HorizontalUnit', 'px');

        // Get vertical offset
        $vertical = Arr::get($boxShadow, 'Vertical', '0');
        $verticalUnit = Arr::get($boxShadow, 'VerticalUnit', 'px');

        // Get blur radius
        $blur = Arr::get($boxShadow, 'Blur', '0');
        $blurUnit = Arr::get($boxShadow, 'BlurUnit', 'px');

        // Get spread radius
        $spread = Arr::get($boxShadow, 'Spread', '0');
        $spreadUnit = Arr::get($boxShadow, 'SpreadUnit', 'px');

        // Get color
        $color = Arr::get($boxShadow, 'Color', 'rgba(0,0,0,0.5)');

        // Skip if no color is provided
        if (empty($color)) {
            return '';
        }

        // Build the box-shadow value
        $value = $inset .
                 $horizontal . $horizontalUnit . ' ' .
                 $vertical . $verticalUnit . ' ' .
                 $blur . $blurUnit . ' ' .
                 $spread . $spreadUnit . ' ' .
                 $color;

        // Generate and return the CSS rule
        return self::generateCssRule($selector, 'box-shadow', $value);
    }

    /**
     * Generate focus selectors for a given selector
     *
     * @param string $selector CSS selector
     * @return string Focus selectors
     */
    public static function generateFocusSelectors($selector)
    {
        $selectors = explode(',', $selector);
        $focusSelectors = [];

        foreach ($selectors as $sel) {
            $focusSelectors[] = trim($sel) . ':focus';
        }

        return implode(', ', $focusSelectors);
    }

    /**
     * Generate hover selectors for a given selector
     *
     * @param string $selector CSS selector
     * @return string Hover selectors
     */
    public static function generateHoverSelectors($selector)
    {
        $selectors = explode(',', $selector);
        $hoverSelectors = [];

        foreach ($selectors as $sel) {
            $hoverSelectors[] = trim($sel) . ':hover';
        }

        return implode(', ', $hoverSelectors);
    }

    /**
     * Process background settings
     *
     * @param array $atts Block attributes
     * @param string $selector CSS selector
     *
     * @return string Generated CSS rules
     */
    public static function processBackground($atts, $selector)
    {
        $css = '';
        $backgroundType = Arr::get($atts, 'backgroundType', 'classic');

        if ($backgroundType === 'gradient') {
            // Process gradient background
            $gradientType = Arr::get($atts, 'gradientType', 'linear');
            $gradientAngle = Arr::get($atts, 'gradientAngle', 90);
            $gradientColor1 = Arr::get($atts, 'gradientColor1', '');
            $gradientColor2 = Arr::get($atts, 'gradientColor2', '');

            if (!empty($gradientColor1) && !empty($gradientColor2)) {
                if ($gradientType === 'linear') {
                    $css .= self::generateCssRule(
                        $selector,
                        'background-image',
                        "linear-gradient({$gradientAngle}deg, {$gradientColor1}, {$gradientColor2})"
                    );
                } else {
                    $css .= self::generateCssRule(
                        $selector,
                        'background-image',
                        "radial-gradient(circle, {$gradientColor1}, {$gradientColor2})"
                    );
                }
            }
        } else {
            // Classic background (color and/or image)
            $backgroundColor = Arr::get($atts, 'backgroundColor', '');
            if (!empty($backgroundColor)) {
                $css .= self::generateCssRule($selector, 'background-color', $backgroundColor);
            }

            // Process background image if one exists
            $backgroundImage = Arr::get($atts, 'backgroundImage', '');
            if (!empty($backgroundImage)) {
                $css .= self::generateCssRule($selector, 'background-image', "url('{$backgroundImage}')");

                // Add background image properties
                $backgroundSize = Arr::get($atts, 'backgroundSize', 'cover');
                $css .= self::generateCssRule($selector, 'background-size', $backgroundSize);

                $backgroundPosition = Arr::get($atts, 'backgroundPosition', 'center center');
                $css .= self::generateCssRule($selector, 'background-position', $backgroundPosition);

                $backgroundRepeat = Arr::get($atts, 'backgroundRepeat', 'no-repeat');
                $css .= self::generateCssRule($selector, 'background-repeat', $backgroundRepeat);

                $backgroundAttachment = Arr::get($atts, 'backgroundAttachment', 'scroll');
                $css .= self::generateCssRule($selector, 'background-attachment', $backgroundAttachment);
            }
        }

        return $css;
    }
}