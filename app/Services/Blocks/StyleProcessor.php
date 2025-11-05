<?php

namespace FluentForm\App\Services\Blocks;

use FluentForm\Framework\Helpers\ArrayHelper as Arr;
use FluentForm\App\Helpers\Helper;

/**
 * StyleProcessor class for processing different style themes for Fluent Forms Gutenberg blocks
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

        if (!Helper::hasPro() || !class_exists('FluentFormPro\classes\FormStyler')) {
            return '';
        }

        $formStyler = new \FluentFormPro\classes\FormStyler();
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
     * Process border settings for all devices with new structured format
     *
     * @param array $border Border settings with new structure
     * @param string $selector CSS selector
     * @param boolean $isHover Whether this is for hover/focus state
     *
     * @return string Generated CSS rules
     */
    public static function processBorder($border, $selector, $isHover = false)
    {
        $css = '';

        if (empty($border) || !Arr::isTrue($border, 'enable') || !Arr::get($border, 'color')) {
            return $css;
        }

        // Get border properties
        $borderType = Arr::get($border, 'type', 'solid');
        $borderColor = Arr::get($border, 'color', '');
        $borderWidth = Arr::get($border, 'width', []);
        $borderRadius = Arr::get($border, 'radius', []);

        // Generate base styles (desktop)
        $desktopRules = [];
        
        // Add border type and color
        if ($borderType) {
            $desktopRules[] = 'border-style: ' . $borderType;
        }
        if ($borderColor) {
            $desktopRules[] = 'border-color: ' . $borderColor;
        }

        // Add border width rules
        if (!empty($borderWidth)) {
            $widthRules = self::getBorderWidthRules($borderWidth);
            $desktopRules = array_merge($desktopRules, $widthRules);
        }

        // Add border radius rules
        if (!empty($borderRadius)) {
            $radiusRules = self::getBorderRadiusRules($borderRadius);
            $desktopRules = array_merge($desktopRules, $radiusRules);
        }

        // Apply desktop styles
        if (!empty($desktopRules)) {
            if ($isHover) {
                $hoverSelector = self::generateHoverSelectors($selector);
                $css .= $hoverSelector . ' { ' . implode('; ', $desktopRules) . '; }' . "\n";
            } else {
                $css .= $selector . ' { ' . implode('; ', $desktopRules) . '; }' . "\n";
            }
        }

        // Handle tablet styles (only if different from desktop)
        if (isset($borderWidth['tablet']) || isset($borderRadius['tablet'])) {
            $tabletRules = [];
            
            // Check width differences
            if (isset($borderWidth['tablet'])) {
                $desktopWidth = isset($borderWidth['desktop']) ? $borderWidth['desktop'] : [];
                $tabletWidth = $borderWidth['tablet'];
                
                if (!self::areSpacingValuesEqual($desktopWidth, $tabletWidth)) {
                    $widthRules = self::getBorderWidthRules($borderWidth, 'tablet');
                    $tabletRules = array_merge($tabletRules, $widthRules);
                }
            }
            
            // Check radius differences
            if (isset($borderRadius['tablet'])) {
                $desktopRadius = isset($borderRadius['desktop']) ? $borderRadius['desktop'] : [];
                $tabletRadius = $borderRadius['tablet'];
                
                if (!self::areSpacingValuesEqual($desktopRadius, $tabletRadius)) {
                    $radiusRules = self::getBorderRadiusRules($borderRadius, 'tablet');
                    $tabletRules = array_merge($tabletRules, $radiusRules);
                }
            }

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

        // Handle mobile styles (only if different from desktop)
        if (isset($borderWidth['mobile']) || isset($borderRadius['mobile'])) {
            $mobileRules = [];
            
            // Check width differences
            if (isset($borderWidth['mobile'])) {
                $desktopWidth = isset($borderWidth['desktop']) ? $borderWidth['desktop'] : [];
                $mobileWidth = $borderWidth['mobile'];
                
                if (!self::areSpacingValuesEqual($desktopWidth, $mobileWidth)) {
                    $widthRules = self::getBorderWidthRules($borderWidth, 'mobile');
                    $mobileRules = array_merge($mobileRules, $widthRules);
                }
            }
            
            // Check radius differences
            if (isset($borderRadius['mobile'])) {
                $desktopRadius = isset($borderRadius['desktop']) ? $borderRadius['desktop'] : [];
                $mobileRadius = $borderRadius['mobile'];
                
                if (!self::areSpacingValuesEqual($desktopRadius, $mobileRadius)) {
                    $radiusRules = self::getBorderRadiusRules($borderRadius, 'mobile');
                    $mobileRules = array_merge($mobileRules, $radiusRules);
                }
            }

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
     * Get border width CSS rules for a specific device
     *
     * @param array $borderWidth Border width settings
     * @param string $device Device type (desktop, tablet, mobile)
     *
     * @return array Array of CSS rules
     */
    private static function getBorderWidthRules($borderWidth, $device = 'desktop')
    {
        $rules = [];
        $values = isset($borderWidth[$device]) ? $borderWidth[$device] : $borderWidth;
        
        if (empty($values)) {
            return $rules;
        }

        $unit = Arr::get($values, 'unit', 'px');
        $linked = Arr::get($values, 'linked', true);

        if ($linked && isset($values['top']) && $values['top'] !== '' && $values['top'] !== null) {
            $rules[] = 'border-width: ' . $values['top'] . $unit;
        } else {
            // Individual border widths
            if (isset($values['top']) && $values['top'] !== '' && $values['top'] !== null) {
                $rules[] = 'border-top-width: ' . $values['top'] . $unit;
            }
            if (isset($values['right']) && $values['right'] !== '' && $values['right'] !== null) {
                $rules[] = 'border-right-width: ' . $values['right'] . $unit;
            }
            if (isset($values['bottom']) && $values['bottom'] !== '' && $values['bottom'] !== null) {
                $rules[] = 'border-bottom-width: ' . $values['bottom'] . $unit;
            }
            if (isset($values['left']) && $values['left'] !== '' && $values['left'] !== null) {
                $rules[] = 'border-left-width: ' . $values['left'] . $unit;
            }
        }

        return $rules;
    }

    /**
     * Get border radius CSS rules for a specific device
     *
     * @param array $borderRadius Border radius settings
     * @param string $device Device type (desktop, tablet, mobile)
     *
     * @return array Array of CSS rules
     */
    private static function getBorderRadiusRules($borderRadius, $device = 'desktop')
    {
        $rules = [];
        $values = isset($borderRadius[$device]) ? $borderRadius[$device] : $borderRadius;
        
        if (empty($values)) {
            return $rules;
        }

        $unit = Arr::get($values, 'unit', 'px');
        $linked = Arr::get($values, 'linked', true);

        if ($linked && isset($values['top']) && $values['top'] !== '' && $values['top'] !== null) {
            $rules[] = 'border-radius: ' . $values['top'] . $unit;
        } else {
            // Individual border radius values (top=top-left, right=top-right, bottom=bottom-right, left=bottom-left)
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

        return $rules;
    }

    /**
     * Compare two spacing value arrays to check if they are equal
     *
     * @param array $values1 First spacing values
     * @param array $values2 Second spacing values
     *
     * @return bool True if values are equal
     */
    private static function areSpacingValuesEqual($values1, $values2)
    {
        if (empty($values1) && empty($values2)) {
            return true;
        }
        
        if (empty($values1) || empty($values2)) {
            return false;
        }

        $keys = ['top', 'right', 'bottom', 'left'];
        
        foreach ($keys as $key) {
            $val1 = Arr::get($values1, $key, '');
            $val2 = Arr::get($values2, $key, '');
            
            if ('' !== $val2 && $val1 !== $val2) {
                return false;
            }
        }
        
        return true;
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