<?php

namespace FluentForm\App\Services\Blocks;

use FluentForm\Framework\Support\Arr;
use FluentForm\App\Helpers\Helper;
use FluentFormPro\classes\FormStyler;

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
     * Process preset styles for the block
     *
     * @param array  $atts   Block attributes
     * @param string $formId Form ID
     *
     * @return string Generated CSS for preset styles
     */
    public static function processPresetStyles($atts, $formId)
    {
        $selectedPreset = Arr::get($atts, 'selectedPreset', '');
        $customizePreset = Arr::get($atts, 'customizePreset', false);
        $presetStyles = Arr::get($atts, 'presetStyles', []);

        if (empty($selectedPreset) && empty($presetStyles)) {
            return '';
        }

        if (!class_exists('FluentFormPro\classes\FormStyler')) {
            return '';
        }

        $formStyler = new FormStyler();
        $presets = $formStyler->getPresets();

        $css = '';

        if ($customizePreset && !empty($presetStyles)) {
            // Use customized preset styles
            $css = self::generatePresetCSS($presetStyles, $formId);
        } elseif (!empty($selectedPreset) && isset($presets[$selectedPreset])) {
            // Use selected preset
            $presetData = $presets[$selectedPreset];
            $styles = Arr::get($presetData, 'style', '{}');
            
            if (is_string($styles) && Helper::isJson($styles)) {
                $styles = json_decode($styles, true);
                $css = self::generatePresetCSS($styles, $formId);
            }
        }

        return $css;
    }

    /**
     * Generate CSS from preset styles
     *
     * @param array  $styles Preset styles
     * @param string $formId Form ID
     *
     * @return string Generated CSS
     */
    private static function generatePresetCSS($styles, $formId)
    {
        if (empty($styles)) {
            return '';
        }

        $baseSelector = '.ff_guten_block.ff_guten_block-' . $formId;
        $css = '';

        // Process container styles
        if (isset($styles['container_styles'])) {
            $containerStyles = $styles['container_styles'];
            $css .= self::processPresetContainerStyles($containerStyles, $baseSelector);
        }

        // Process label styles
        if (isset($styles['label_styles'])) {
            $labelStyles = $styles['label_styles'];
            $css .= self::processPresetLabelStyles($labelStyles, $baseSelector);
        }

        // Process input styles
        if (isset($styles['input_styles'])) {
            $inputStyles = $styles['input_styles'];
            $css .= self::processPresetInputStyles($inputStyles, $baseSelector);
        }

        // Process button styles
        if (isset($styles['submit_button_style'])) {
            $buttonStyles = $styles['submit_button_style'];
            $css .= self::processPresetButtonStyles($buttonStyles, $baseSelector);
        }

        return $css;
    }

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
    public static function generateCssRule($selector, $property, $value, $suffix = '', $important = false)
    {
        if (empty($value) && $value !== '0') {
            return '';
        }

        if (is_array($value)) {
            $value = implode(' ', $value);
        }

        $importantFlag = $important ? ' !important' : '';
        return "{$selector} { {$property}: {$value}{$suffix}{$importantFlag}; }\n";
    }

    /**
     * Generate CSS rule for individual custom styles (with higher specificity)
     *
     * @param string $selector CSS selector
     * @param string $property CSS property
     * @param string $value    CSS value
     * @param string $suffix   Optional suffix for the value (e.g., 'px')
     *
     * @return string Generated CSS rule with !important
     */
    public static function generateCustomCssRule($selector, $property, $value, $suffix = '')
    {
        if (empty($value) && $value !== '0') {
            return '';
        }

        if (is_array($value)) {
            $value = implode(' ', $value);
        }

        return "{$selector} { {$property}: {$value}{$suffix} !important; }\n";
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

        // Extract styles from the consolidated styles attribute
        $styles = Arr::get($atts, 'styles', []);

        if (empty($styles)) {
            return $css;
        }

        // Define all selectors using the form ID for consistency
        // Base selector
        $containerSelector = ".ff_guten_block.ff_guten_block-{$formId}";

        // Label selectors
        $labelSelectors = [
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-input--label label",
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-check-label"
        ];
        $labelSelector = implode(', ', $labelSelectors);

        // Input selectors (textual inputs only: inputs where user types + textarea/select)
        $inputSelectors = [
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-control",
            ".ff_guten_block.ff_guten_block-{$formId} textarea",
            ".ff_guten_block.ff_guten_block-{$formId} select"
        ];
        $inputSelectorsStr = implode(', ', $inputSelectors);

        // Input background selectors (textual inputs only)
        $inputBGSelectors = [
            ".ff_guten_block.ff_guten_block-{$formId} .ff-el-form-control",
            ".ff_guten_block.ff_guten_block-{$formId} .select2-container--default .select2-selection--multiple",
            ".ff_guten_block.ff_guten_block-{$formId} .select2-container--default .select2-selection--single"
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
        $css .= self::processContainerStyles($styles, $selectors);

        // Process form field styles
        $css .= self::processFieldStyles($styles, $selectors);

        // Process button styles
        $css .= self::processButtonStyles($styles, $selectors);

        // Process message styles
        $css .= self::processMessageStyles($styles, $selectors);

        // Process responsive visibility
        $css .= self::processResponsiveVisibility($styles, $selectors);

        return $css;
    }

    /**
     * Process container styles
     *
     * @param array $styles Consolidated styles object
     * @param array $selectors Array of CSS selectors
     * @return string Generated CSS
     */
    public static function processContainerStyles($styles, $selectors)
    {
        $containerSelector = $selectors['container'];
        $css = '';

        // Process form width
        if ($formWidth = Arr::get($styles, 'formWidth')) {
            $css .= self::generateCssRule($containerSelector, 'width', $formWidth, '%');
        }

        // Process form alignment
        if ($formAlignment = Arr::get($styles, 'formAlignment')) {
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
        $css .= self::processBackground($styles, $containerSelector);

        // Process text color
        if ($textColor = Arr::get($styles, 'textColor')) {
            $css .= self::generateCssRule($containerSelector, 'color', $textColor);
        }

        // Process container padding
        $containerPadding = Arr::get($styles, 'containerPadding', []);
        if (!empty($containerPadding)) {
            $css .= self::processSpacing($containerPadding, $containerSelector, 'padding');
        }

        // Process container margin
        $containerMargin = Arr::get($styles, 'containerMargin', []);
        if (!empty($containerMargin)) {
            $css .= self::processSpacing($containerMargin, $containerSelector, 'margin');
        }

        // Process box shadow
        $enableBoxShadow = (bool) Arr::get($styles, 'enableBoxShadow', false);
        if ($enableBoxShadow) {
            $boxShadow = [
                'Position' => Arr::get($styles, 'boxShadowPosition', 'outline'),
                'Horizontal' => Arr::get($styles, 'boxShadowHorizontal', ''),
                'HorizontalUnit' => Arr::get($styles, 'boxShadowHorizontalUnit', 'px'),
                'Vertical' => Arr::get($styles, 'boxShadowVertical', ''),
                'VerticalUnit' => Arr::get($styles, 'boxShadowVerticalUnit', 'px'),
                'Blur' => Arr::get($styles, 'boxShadowBlur', ''),
                'BlurUnit' => Arr::get($styles, 'boxShadowBlurUnit', 'px'),
                'Spread' => Arr::get($styles, 'boxShadowSpread', ''),
                'SpreadUnit' => Arr::get($styles, 'boxShadowSpreadUnit', 'px'),
                'Color' => Arr::get($styles, 'boxShadowColor', ''),
            ];

            $css .= self::generateBoxShadow($containerSelector, $boxShadow);
        }

        // Process container box shadow (alternative attribute)
        $containerBoxShadow = Arr::get($styles, 'containerBoxShadow', []);
        if (!empty($containerBoxShadow) && Arr::get($containerBoxShadow, 'enable', false)) {
            $inset = Arr::get($containerBoxShadow, 'inset', false) ? 'inset ' : '';
            $horizontal = Arr::get($containerBoxShadow, 'horizontal', 0);
            $vertical = Arr::get($containerBoxShadow, 'vertical', 0);
            $blur = Arr::get($containerBoxShadow, 'blur', 0);
            $spread = Arr::get($containerBoxShadow, 'spread', 0);
            $color = Arr::get($containerBoxShadow, 'color', 'rgba(0,0,0,0.5)');
            
            $boxShadowValue = "{$inset}{$horizontal}px {$vertical}px {$blur}px {$spread}px {$color}";
            $css .= self::generateCssRule($containerSelector, 'box-shadow', $boxShadowValue);
        }

        // Process container box shadow hover
        $containerBoxShadowHover = Arr::get($styles, 'containerBoxShadowHover', []);
        if (!empty($containerBoxShadowHover) && Arr::get($containerBoxShadowHover, 'enable', false)) {
            $inset = Arr::get($containerBoxShadowHover, 'inset', false) ? 'inset ' : '';
            $horizontal = Arr::get($containerBoxShadowHover, 'horizontal', 0);
            $vertical = Arr::get($containerBoxShadowHover, 'vertical', 0);
            $blur = Arr::get($containerBoxShadowHover, 'blur', 0);
            $spread = Arr::get($containerBoxShadowHover, 'spread', 0);
            $color = Arr::get($containerBoxShadowHover, 'color', 'rgba(0,0,0,0.5)');
            
            $boxShadowValue = "{$inset}{$horizontal}px {$vertical}px {$blur}px {$spread}px {$color}";
            $css .= self::generateCssRule($containerSelector . ':hover', 'box-shadow', $boxShadowValue);
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
     * @param array $styles Consolidated styles object
     * @param array $selectors Array of CSS selectors
     * @return string Generated CSS
     */
    public static function processFieldStyles($styles, $selectors)
    {
        $css = '';

        // Extract selectors
        $containerSelector = $selectors['container'];
        $labelSelector = $selectors['label'];
        $inputSelector = $selectors['input'];
        $inputBGSelectorsStr = $selectors['inputBG'] ?? $inputSelector;
        $formId = $selectors['formId'];
        $inputTypes = $selectors['inputTypes'] ?? ['.ff-el-form-control', 'textarea', 'select'];
        $placeholderPseudos = $selectors['placeholderPseudos'] ?? [
            '::placeholder',
            '::-webkit-input-placeholder',
            '::-moz-placeholder',
            ':-ms-input-placeholder',
            ':-moz-placeholder'
        ];

        // Asterisk selector
        $asteriskSelector = ".fluentform-guten-wrapper .ff_guten_block.ff_guten_block-{$formId} .ff-el-input--label.ff-el-is-required label::after";

        // Apply label color if set
        if ($labelColor = Arr::get($styles, 'labelColor')) {
            $css .= self::generateCustomCssRule($labelSelector, 'color', $labelColor);
        }

        if ($labelTypography = Arr::get($styles, 'labelTypography')) {
            $css .= self::processTypography($labelTypography, $labelSelector);
        }

        if ($asteriskColor = Arr::get($styles, 'asteriskColor')) {
            $css .= self::generateCssRule($asteriskSelector, 'color', $asteriskColor);
        }

        // Text and background colors
        if ($inputTextColor = Arr::get($styles, 'inputTextColor')) {
            $css .= self::generateCustomCssRule($inputSelector, 'color', $inputTextColor);
        }

        if ($inputBgColor = Arr::get($styles, 'inputBackgroundColor')) {
            $css .= self::generateCustomCssRule($inputBGSelectorsStr, 'background-color', $inputBgColor);
        }

        // Typography
        if ($inputTypography = Arr::get($styles, 'inputTypography')) {
            $css .= self::processTypography($inputTypography, $inputSelector);
        }

        // Input spacing
        $inputSpacing = Arr::get($styles, 'inputSpacing', []);
        if (!empty($inputSpacing)) {
            $css .= self::processSpacing($inputSpacing, $inputSelector, 'padding');
        }

        // Input Border - NORMAL
        $enableInputBorder = Arr::get($styles, 'enableInputBorder', false);
        if ($enableInputBorder) {
            $inputBorder = Arr::get($styles, 'inputBorder', []);
            if (!empty($inputBorder)) {
                $css .= self::processBorder($inputBorder, $inputSelector, false);
            }
        }

        // Input Border - FOCUS/HOVER
        $inputBorderHover = Arr::get($styles, 'inputBorderHover', []);
        if (!empty($inputBorderHover)) {
            $css .= self::processBorder($inputBorderHover, $inputSelector, true);
        }

        // Process placeholder typography
        $placeholderTypo = Arr::get($styles, 'placeholderTypography', []);
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

        return $css;
    }

    /**
     * Process button styles
     *
     * @param array $styles Consolidated styles object
     * @param array $selectors Array of CSS selectors
     * @return string Generated CSS
     */
    public static function processButtonStyles($styles, $selectors)
    {
        $css = '';

        // Extract selectors
        $containerSelector = $selectors['container'];
        $buttonSelector = $selectors['button'];
        $formId = $selectors['formId'];

        // Generate hover selectors
        $buttonHoverSelector = self::generateHoverSelectors($buttonSelector);

        // Button alignment
        if ($buttonAlignment = Arr::get($styles, 'buttonAlignment')) {
            $css .= self::generateCssRule(
                $containerSelector . ' .ff_submit_btn_wrapper',
                'text-align',
                $buttonAlignment
            );
        }

        // Common Button Width (applies to both normal and hover states)
        if ($buttonWidth = Arr::get($styles, 'buttonWidth')) {
            $css .= self::generateCssRule($buttonSelector, 'width', $buttonWidth, '%');
        }

        // NORMAL STATE STYLES
        // Button colors
        if ($buttonColor = Arr::get($styles, 'buttonColor')) {
            $css .= self::generateCssRule($buttonSelector, 'color', $buttonColor, '', true);
        }

        if ($buttonBgColor = Arr::get($styles, 'buttonBGColor')) {
            $css .= self::generateCssRule($buttonSelector, 'background-color', $buttonBgColor, '', true);
        }

        // Button typography
        if ($buttonTypography = Arr::get($styles, 'buttonTypography')) {
            $css .= self::processTypography($buttonTypography, $buttonSelector);
        }

        // Button spacing
        $buttonPadding = Arr::get($styles, 'buttonPadding', []);
        if (!empty($buttonPadding)) {
            $css .= self::processSpacing($buttonPadding, $buttonSelector, 'padding');
        }

        $buttonMargin = Arr::get($styles, 'buttonMargin', []);
        if (!empty($buttonMargin)) {
            $css .= self::processSpacing($buttonMargin, $buttonSelector, 'margin');
        }

        // Button border
        $buttonBorder = Arr::get($styles, 'buttonBorder', []);
        if (!empty($buttonBorder)) {
            $css .= self::processBorder($buttonBorder, $buttonSelector, false);
        }

        // HOVER STATE STYLES
        if ($buttonHoverColor = Arr::get($styles, 'buttonHoverColor')) {
            $css .= self::generateCssRule($buttonHoverSelector, 'color', $buttonHoverColor, '', true);
        }

        if ($buttonHoverBgColor = Arr::get($styles, 'buttonHoverBGColor')) {
            $css .= self::generateCssRule($buttonHoverSelector, 'background-color', $buttonHoverBgColor, '', true);
        }

        // Button hover border
        $buttonBorderHover = Arr::get($styles, 'buttonBorderHover', []);
        if (!empty($buttonBorderHover)) {
            $css .= self::processBorder($buttonBorderHover, $buttonSelector, true);
        }

        // Button box shadow
        $enableButtonBoxShadow = (bool) Arr::get($styles, 'enableButtonBoxShadow', false);
        if ($enableButtonBoxShadow) {
            $buttonBoxShadow = [
                'Position' => Arr::get($styles, 'buttonBoxShadowPosition', 'outline'),
                'Horizontal' => Arr::get($styles, 'buttonBoxShadowHorizontal', ''),
                'HorizontalUnit' => Arr::get($styles, 'buttonBoxShadowHorizontalUnit', 'px'),
                'Vertical' => Arr::get($styles, 'buttonBoxShadowVertical', ''),
                'VerticalUnit' => Arr::get($styles, 'buttonBoxShadowVerticalUnit', 'px'),
                'Blur' => Arr::get($styles, 'buttonBoxShadowBlur', ''),
                'BlurUnit' => Arr::get($styles, 'buttonBoxShadowBlurUnit', 'px'),
                'Spread' => Arr::get($styles, 'buttonBoxShadowSpread', ''),
                'SpreadUnit' => Arr::get($styles, 'buttonBoxShadowSpreadUnit', 'px'),
                'Color' => Arr::get($styles, 'buttonBoxShadowColor', ''),
            ];

            $css .= self::generateBoxShadow($buttonSelector, $buttonBoxShadow);
        }

        // Process legacy button box shadow format
        $buttonBoxShadowLegacy = Arr::get($styles, 'buttonBoxShadow', []);

        // Always add a box shadow for testing
        if ($buttonHoverBgColor) {
            $css .= self::generateCssRule($buttonHoverSelector, 'box-shadow', '0 0 10px 0 rgba(0,0,0,0.3)', '');
        }

        // Process the actual buttonBoxShadowLegacy settings if they exist
        if (!empty($buttonBoxShadowLegacy) && Arr::get($buttonBoxShadowLegacy, 'enable', false)) {
            // Process the actual buttonBoxShadowLegacy settings
            $inset = Arr::get($buttonBoxShadowLegacy, 'inset', false) ? 'inset ' : '';
            $horizontal = Arr::get($buttonBoxShadowLegacy, 'horizontal', 0);
            $vertical = Arr::get($buttonBoxShadowLegacy, 'vertical', 0);
            $blur = Arr::get($buttonBoxShadowLegacy, 'blur', 0);
            $spread = Arr::get($buttonBoxShadowLegacy, 'spread', 0);
            $color = Arr::get($buttonBoxShadowLegacy, 'color', 'rgba(0,0,0,0.5)');

            $shadowValue = $inset . $horizontal . 'px ' . $vertical . 'px ' . $blur . 'px ' . $spread . 'px ' . $color;
            $css .= self::generateCssRule($buttonSelector, 'box-shadow', $shadowValue, '');
        }

        // HOVER STATE - Button box shadow
        $enableButtonHoverBoxShadow = (bool) Arr::get($styles, 'enableButtonHoverBoxShadow', false);
        if ($enableButtonHoverBoxShadow) {
            $boxShadow = [
                'Position' => Arr::get($styles, 'buttonHoverBoxShadowPosition', 'outline'),
                'Horizontal' => Arr::get($styles, 'buttonHoverBoxShadowHorizontal', ''),
                'HorizontalUnit' => Arr::get($styles, 'buttonHoverBoxShadowHorizontalUnit', 'px'),
                'Vertical' => Arr::get($styles, 'buttonHoverBoxShadowVertical', ''),
                'VerticalUnit' => Arr::get($styles, 'buttonHoverBoxShadowVerticalUnit', 'px'),
                'Blur' => Arr::get($styles, 'buttonHoverBoxShadowBlur', ''),
                'BlurUnit' => Arr::get($styles, 'buttonHoverBoxShadowBlurUnit', 'px'),
                'Spread' => Arr::get($styles, 'buttonHoverBoxShadowSpread', ''),
                'SpreadUnit' => Arr::get($styles, 'buttonHoverBoxShadowSpreadUnit', 'px'),
                'Color' => Arr::get($styles, 'buttonHoverBoxShadowColor', ''),
            ];

            $css .= self::generateBoxShadow($buttonHoverSelector, $boxShadow);
        }

        // Process legacy button box shadow hover format
        $buttonBoxShadowHover = Arr::get($styles, 'buttonBoxShadowHover', []);

        // Always add a box shadow for testing
        if ($buttonHoverBgColor) {
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

        // Error message styles (Inline Error Message)
        $errorSelector = $containerSelector . ' .ff-el-is-error .ff-el-form-control';
        $errorLabelSelector = $containerSelector . ' .ff-el-is-error label';
        $errorMessageSelector = $containerSelector . ' .ff-el-is-error .text-danger';

        if ($errorColor = Arr::get($atts, 'errorMessageColor')) {
            $css .= self::generateCssRule($errorMessageSelector, 'color', $errorColor);
        }

        if ($errorBgColor = Arr::get($atts, 'errorMessageBgColor')) {
            $css .= self::generateCssRule($errorMessageSelector, 'background-color', $errorBgColor);
        }

        if ($alignment = Arr::get($atts, 'errorMessageAlignment')) {
            $css .= self::generateCssRule($errorMessageSelector, 'text-align', $alignment);
        }

        // Success message styles
        $successSelector = $containerSelector . ' .ff_form_submission_message';

        if ($successColor = Arr::get($atts, 'successMessageColor')) {
            $css .= self::generateCssRule($successSelector, 'color', $successColor);
        }

        if ($successBgColor = Arr::get($atts, 'successMessageBgColor')) {
            $css .= self::generateCssRule($successSelector, 'background-color', $successBgColor);
        }

        if ($alignment = Arr::get($atts, 'successMessageAlignment')) {
            $css .= self::generateCssRule($successSelector, 'text-align', $alignment);
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

        if ($alignment = Arr::get($atts, 'submitErrorMessageAlignment')) {
            $css .= self::generateCssRule($submitErrorSelector, 'text-align', $alignment);
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
//            $css .= "    {$containerSelector} { display: none !important; }\n";
            $css .= "}\n";
        }

        // Tablet visibility
        if (Arr::get($atts, 'hideOnTablet', false)) {
            $css .= "@media (min-width: " . self::MOBILE_BREAKPOINT . ") and (max-width: " . self::TABLET_BREAKPOINT . ") {\n";
//            $css .= "    {$containerSelector} { display: none !important; }\n";
            $css .= "}\n";
        }

        // Mobile visibility
        if (Arr::get($atts, 'hideOnMobile', false)) {
            $css .= "@media (max-width: " . self::MOBILE_BREAKPOINT . ") {\n";
//            $css .= "    {$containerSelector} { display: none !important; }\n";
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

        // Process background overlay color
        $backgroundOverlayColor = Arr::get($atts, 'backgroundOverlayColor', '');
        $backgroundOverlayOpacity = Arr::get($atts, 'backgroundOverlayOpacity', 0.5);
        
        if (!empty($backgroundOverlayColor)) {
            // Create overlay using ::before pseudo-element
            $overlaySelector = $selector . '::before';
            $css .= self::generateCssRule($overlaySelector, 'content', '""');
            $css .= self::generateCssRule($overlaySelector, 'position', 'absolute');
            $css .= self::generateCssRule($overlaySelector, 'top', '0');
            $css .= self::generateCssRule($overlaySelector, 'left', '0');
            $css .= self::generateCssRule($overlaySelector, 'right', '0');
            $css .= self::generateCssRule($overlaySelector, 'bottom', '0');
            $css .= self::generateCssRule($overlaySelector, 'background-color', $backgroundOverlayColor);
            $css .= self::generateCssRule($overlaySelector, 'opacity', $backgroundOverlayOpacity);
            $css .= self::generateCssRule($overlaySelector, 'pointer-events', 'none');
            $css .= self::generateCssRule($overlaySelector, 'z-index', '1');
            
            // Ensure the container has relative positioning for the overlay
            $css .= self::generateCssRule($selector, 'position', 'relative');
        }

        return $css;
    }

    /**
     * Process container styles from preset
     *
     * @param array  $containerStyles Container styles
     * @param string $baseSelector    Base CSS selector
     *
     * @return string Generated CSS
     */
    private static function processPresetContainerStyles($containerStyles, $baseSelector)
    {
        $css = '';
        $selector = $baseSelector;

        // Background color
        if (isset($containerStyles['backgroundColor']['value']) && !empty($containerStyles['backgroundColor']['value'])) {
            $css .= self::generateCssRule($selector, 'background-color', $containerStyles['backgroundColor']['value']);
        }

        // Text color
        if (isset($containerStyles['color']['value']) && !empty($containerStyles['color']['value'])) {
            $css .= self::generateCssRule($selector, 'color', $containerStyles['color']['value']);
        }

        // Margin
        if (isset($containerStyles['margin']['value'])) {
            $margin = $containerStyles['margin']['value'];
            if (isset($margin['top']) && $margin['top'] !== '') {
                $css .= self::generateCssRule($selector, 'margin-top', $margin['top'], 'px');
            }
            if (isset($margin['bottom']) && $margin['bottom'] !== '') {
                $css .= self::generateCssRule($selector, 'margin-bottom', $margin['bottom'], 'px');
            }
            if (isset($margin['left']) && $margin['left'] !== '') {
                $css .= self::generateCssRule($selector, 'margin-left', $margin['left'], 'px');
            }
            if (isset($margin['right']) && $margin['right'] !== '') {
                $css .= self::generateCssRule($selector, 'margin-right', $margin['right'], 'px');
            }
        }

        // Padding
        if (isset($containerStyles['padding']['value'])) {
            $padding = $containerStyles['padding']['value'];
            if (isset($padding['top']) && $padding['top'] !== '') {
                $css .= self::generateCssRule($selector, 'padding-top', $padding['top'], 'px');
            }
            if (isset($padding['bottom']) && $padding['bottom'] !== '') {
                $css .= self::generateCssRule($selector, 'padding-bottom', $padding['bottom'], 'px');
            }
            if (isset($padding['left']) && $padding['left'] !== '') {
                $css .= self::generateCssRule($selector, 'padding-left', $padding['left'], 'px');
            }
            if (isset($padding['right']) && $padding['right'] !== '') {
                $css .= self::generateCssRule($selector, 'padding-right', $padding['right'], 'px');
            }
        }

        return $css;
    }

    /**
     * Process label styles from preset
     * @param array  $labelStyles Label styles
     * @param string $baseSelector Base CSS selector
     *
     * @return string Generated CSS
     */
    private static function processPresetLabelStyles($labelStyles, $baseSelector)
    {
        $css = '';
        $selector = $baseSelector . ' .ff-el-input--label label';

        // Label color
        if (isset($labelStyles['color']['value']) && !empty($labelStyles['color']['value'])) {
            $css .= self::generateCssRule($selector, 'color', $labelStyles['color']['value']);
        }

        // Label typography
        if (isset($labelStyles['typography']['value'])) {
            $typography = $labelStyles['typography']['value'];
            $css .= self::processTypography($typography, $selector);
        }

        return $css;
    }

    /**
     * Process input styles from preset
     *
     * @param array  $inputStyles Input styles
     * @param string $baseSelector Base CSS selector
     *
     * @return string Generated CSS
     */
    private static function processPresetInputStyles($inputStyles, $baseSelector)
    {
        $css = '';
        $inputSelector = $baseSelector . ' .ff-el-form-control, ' . $baseSelector . ' input, ' . $baseSelector . ' textarea, ' . $baseSelector . ' select';

        if (isset($inputStyles['all_tabs']['tabs'])) {
            $tabs = $inputStyles['all_tabs']['tabs'];

            // Normal state
            if (isset($tabs['normal']['value'])) {
                $normalStyles = $tabs['normal']['value'];
                $css .= self::processInputStateStyles($normalStyles, $inputSelector);
            }

            // Focus state
            if (isset($tabs['focus']['value'])) {
                $focusStyles = $tabs['focus']['value'];
                $focusSelector = $inputSelector . ':focus';
                $css .= self::processInputStateStyles($focusStyles, $focusSelector);
            }
        }

        return $css;
    }

    /**
     * Process input state styles (normal/focus)
     *
     * @param array  $styles Input state styles
     * @param string $selector CSS selector
     *
     * @return string Generated CSS
     */
    private static function processInputStateStyles($styles, $selector)
    {
        $css = '';

        // Background color
        if (isset($styles['backgroundColor']['value']) && !empty($styles['backgroundColor']['value'])) {
            $css .= self::generateCssRule($selector, 'background-color', $styles['backgroundColor']['value']);
        }

        // Text color
        if (isset($styles['color']['value']) && !empty($styles['color']['value'])) {
            $css .= self::generateCssRule($selector, 'color', $styles['color']['value']);
        }

        // Typography
        if (isset($styles['typography']['value'])) {
            $css .= self::processTypography($styles['typography']['value'], $selector);
        }

        // Border
        if (isset($styles['border']['value']) && isset($styles['border']['value']['status']) && $styles['border']['value']['status'] === 'yes') {
            $border = $styles['border']['value'];
            $css .= self::processBorder($border, $selector, false);
        }

        return $css;
    }

    /**
     * Process button styles from preset
     *
     * @param array  $buttonStyles Button styles
     * @param string $baseSelector Base CSS selector
     *
     * @return string Generated CSS
     */
    private static function processPresetButtonStyles($buttonStyles, $baseSelector)
    {
        $css = '';
        $buttonSelector = $baseSelector . ' .ff-btn-submit';

        if (isset($buttonStyles['all_tabs']['tabs'])) {
            $tabs = $buttonStyles['all_tabs']['tabs'];

            // Normal state
            if (isset($tabs['normal']['value'])) {
                $normalStyles = $tabs['normal']['value'];
                $css .= self::processButtonStateStyles($normalStyles, $buttonSelector);
            }

            // Hover state
            if (isset($tabs['hover']['value'])) {
                $hoverStyles = $tabs['hover']['value'];
                $hoverSelector = $buttonSelector . ':hover';
                $css .= self::processButtonStateStyles($hoverStyles, $hoverSelector);
            }
        }

        return $css;
    }

    /**
     * Process button state styles (normal/hover)
     *
     * @param array  $styles Button state styles
     * @param string $selector CSS selector
     *
     * @return string Generated CSS
     */
    private static function processButtonStateStyles($styles, $selector)
    {
        $css = '';

        // Background color
        if (isset($styles['backgroundColor']['value']) && !empty($styles['backgroundColor']['value'])) {
            $css .= self::generateCssRule($selector, 'background-color', $styles['backgroundColor']['value'], '', true);
        }

        // Text color
        if (isset($styles['color']['value']) && !empty($styles['color']['value'])) {
            $css .= self::generateCssRule($selector, 'color', $styles['color']['value'], '', true);
        }

        // Typography
        if (isset($styles['typography']['value'])) {
            $css .= self::processTypography($styles['typography']['value'], $selector);
        }

        // Border
        if (isset($styles['border']['value']) && isset($styles['border']['value']['status']) && $styles['border']['value']['status'] === 'yes') {
            $border = $styles['border']['value'];
            $css .= self::processBorder($border, $selector, false);
        }

        return $css;
    }
}