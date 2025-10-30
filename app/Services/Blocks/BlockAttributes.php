<?php

namespace FluentForm\App\Services\Blocks;

/**
 * BlockAttributes class for defining Gutenberg block attributes
 * @since 1.0.0
 */
class BlockAttributes
{
    /**
     * Get all attributes for the Fluent Forms Gutenberg block
     *
     * @return array Block attributes configuration
     */
    public static function getAttributes()
    {
        return array_merge(
            self::getFormAttributes(),
            self::getTypographyAttributes(),
            self::getColorAttributes(),
            self::getBorderAttributes(),
            self::getBackgroundAttributes(),
            self::getSpacingAttributes(),
            self::getButtonAttributes(),
            self::getMessageAttributes(),
            self::getAdvancedAttributes()
        );
    }

    /**
     * Get form specific attributes
     *
     * @return array Form specific attributes
     */
    public static function getFormAttributes()
    {
        return [
            'formId' => [
                'type' => 'string',
                'default' => '',
            ],
            'className' => [
                'type' => 'string',
                'default' => '',
            ],
            'themeStyle' => [
                'type' => 'string',
                'default' => '',
            ],
            'selectedPreset' => [
                'type' => 'string',
                'default' => '',
            ],
            'customizePreset' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'presetStyles' => [
                'type' => 'object',
                'default' => [],
            ],
            'isConversationalForm' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'isThemeChange' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'customCssClass' => [
                'type' => 'string',
                'default' => '',
            ]
        ];
    }

    /**
     * Get typography related attributes
     *
     * @return array Typography related attributes
     */
    public static function getTypographyAttributes()
    {
        return [
            'labelTypography' => [
                'type' => 'object',
                'default' => [],
            ],
            'inputTypography' => [
                'type' => 'object',
                'default' => [],
            ],
            'buttonTypography' => [
                'type' => 'object',
                'default' => [],
            ],
            'placeholderTypography' => [
                'type' => 'object',
                'default' => [],
            ],
            'radioCheckboxTypography' => [
                'type' => 'object',
                'default' => [],
            ],
        ];
    }

    /**
     * Get color related attributes
     *
     * @return array Color related attributes
     */
    public static function getColorAttributes()
    {
        return [
            'textColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'backgroundColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'labelColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'inputTextColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'inputBackgroundColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'placeholderColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'placeholderFocusColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonBGColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonHoverColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonHoverBGColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'radioCheckboxItemsColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'radioCheckboxLabelColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'checkboxSize' => [
                'type' => 'string',
                'default' => '',
            ],
            'checkboxBorderColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'checkboxBgColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'checkboxCheckedColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'radioSize' => [
                'type' => 'string',
                'default' => '',
            ],
            'radioBorderColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'radioBgColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'radioCheckedColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'errorMessageColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'errorMessageBgColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'successMessageColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'successMessageBgColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'submitErrorMessageColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'submitErrorMessageBgColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'gradientColor1' => [
                'type' => 'string',
                'default' => '',
            ],
            'gradientColor2' => [
                'type' => 'string',
                'default' => '',
            ],
            'backgroundOverlayColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'boxShadowColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'asteriskColor' => [
                'type' => 'string',
                'default' => '',
            ],
            // Focus state colors
            'inputTextFocusColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'inputBackgroundFocusColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'inputFocusSpacing' => [
                'type' => 'object',
                'default' => [],
            ],
        ];
    }

    /**
     * Get border related attributes
     *
     * @return array Border related attributes
     */
    public static function getBorderAttributes()
    {
        return [
            'inputBorder' => [
                'type' => 'object',
                'default' => [],
            ],
            'inputBorderHover' => [
                'type' => 'object',
                'default' => [],
            ],
            'formBorder' => [
                'type' => 'object',
                'default' => [],
            ],
            'enableFormBorder' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'borderType' => [
                'type' => 'string',
                'default' => 'solid',
            ],
            'borderColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'borderWidth' => [
                'type' => 'object',
                'default' => [],
            ],
            'borderRadius' => [
                'type' => 'object',
                'default' => [],
            ],
            // Button border
            'enableButtonBorder' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'buttonBorderType' => [
                'type' => 'string',
                'default' => 'solid',
            ],
            'buttonBorderColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonBorderWidth' => [
                'type' => 'object',
                'default' => [],
            ],
            'buttonBorderRadius' => [
                'type' => 'object',
                'default' => [],
            ],
            // Input focus borders
            'enableInputBorder' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'inputBorderType' => [
                'type' => 'string',
                'default' => 'solid',
            ],
            'inputBorderColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'inputBorderWidth' => [
                'type' => 'object',
                'default' => [],
            ],
            'inputBorderRadius' => [
                'type' => 'object',
                'default' => [],
            ],
            'enableInputBorderFocus' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'inputBorderTypeFocus' => [
                'type' => 'string',
                'default' => 'solid',
            ],
            'inputBorderColorFocus' => [
                'type' => 'string',
                'default' => '',
            ],
            'inputBorderWidthFocus' => [
                'type' => 'object',
                'default' => [],
            ],
            'inputBorderRadiusFocus' => [
                'type' => 'object',
                'default' => [],
            ],
        ];
    }

    /**
     * Get background related attributes
     *
     * @return array Background related attributes
     */
    public static function getBackgroundAttributes()
    {
        return [
            'backgroundType' => [
                'type' => 'string',
                'default' => 'classic',
            ],
            'backgroundImage' => [
                'type' => 'string',
                'default' => '',
            ],
            'backgroundImageId' => [
                'type' => 'number',
                'default' => 0,
            ],
            'backgroundSize' => [
                'type' => 'string',
                'default' => 'cover',
            ],
            'backgroundPosition' => [
                'type' => 'string',
                'default' => 'center center',
            ],
            'backgroundRepeat' => [
                'type' => 'string',
                'default' => 'no-repeat',
            ],
            'backgroundAttachment' => [
                'type' => 'string',
                'default' => 'scroll',
            ],
            'gradientType' => [
                'type' => 'string',
                'default' => 'linear',
            ],
            'gradientAngle' => [
                'type' => 'number',
                'default' => 90,
            ],
            'backgroundOverlayOpacity' => [
                'type' => 'number',
                'default' => 0.5,
            ],
        ];
    }

    /**
     * Get spacing related attributes
     *
     * @return array Spacing related attributes
     */
    public static function getSpacingAttributes()
    {
        return [
            'containerPadding' => [
                'type' => 'object',
                'default' => [],
            ],
            'containerMargin' => [
                'type' => 'object',
                'default' => [],
            ],
            'containerBoxShadow' => [
                'type' => 'object',
                'default' => [],
            ],
            'containerBoxShadowHover' => [
                'type' => 'object',
                'default' => [],
            ],
            'inputSpacing' => [
                'type' => 'object',
                'default' => [],
            ],
            'inputSpacingHover' => [
                'type' => 'object',
                'default' => [],
            ],
            'buttonPadding' => [
                'type' => 'object',
                'default' => [],
            ],
            'buttonMargin' => [
                'type' => 'object',
                'default' => [],
            ],
            'formWidth' => [
                    'type' => 'string',
                'default' => '',
            ],
            'formAlignment' => [
                'type' => 'string',
                'default' => '',
            ],
        ];
    }

    /**
     * Get button related attributes
     *
     * @return array Button related attributes
     */
    public static function getButtonAttributes()
    {
        return [
            // Common button attributes
            'buttonWidth' => [
                'type' => 'number',
            ],
            'buttonAlignment' => [
                'type' => 'string',
                'default' => 'left',
            ],

            // Normal state button attributes
            'buttonTypography' => [
                'type' => 'object',
                'default' => [],
            ],
            'buttonPadding' => [
                'type' => 'object',
                'default' => [],
            ],
            'buttonMargin' => [
                'type' => 'object',
                'default' => [],
            ],
            'enableButtonBorder' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'buttonBorderType' => [
                'type' => 'string',
                'default' => 'solid',
            ],
            'buttonBorderColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonBorderWidth' => [
                'type' => 'object',
                'default' => [],
            ],
            'buttonBorderRadius' => [
                'type' => 'object',
                'default' => [],
            ],
            'enableButtonBoxShadow' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'buttonBoxShadowColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonBoxShadowPosition' => [
                'type' => 'string',
                'default' => 'outline',
            ],
            'buttonBoxShadowHorizontal' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonBoxShadowHorizontalUnit' => [
                'type' => 'string',
                'default' => 'px',
            ],
            'buttonBoxShadowVertical' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonBoxShadowVerticalUnit' => [
                'type' => 'string',
                'default' => 'px',
            ],
            'buttonBoxShadowBlur' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonBoxShadowBlurUnit' => [
                'type' => 'string',
                'default' => 'px',
            ],
            'buttonBoxShadowSpread' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonBoxShadowSpreadUnit' => [
                'type' => 'string',
                'default' => 'px',
            ],

            // Hover state button attributes
            'buttonHoverTypography' => [
                'type' => 'object',
                'default' => [],
            ],
            'buttonHoverPadding' => [
                'type' => 'object',
                'default' => [],
            ],
            'buttonHoverMargin' => [
                'type' => 'object',
                'default' => [],
            ],
            'enableButtonHoverBorder' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'buttonHoverBorderType' => [
                'type' => 'string',
                'default' => 'solid',
            ],
            'buttonHoverBorderColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonHoverBorderWidth' => [
                'type' => 'object',
                'default' => [],
            ],
            'buttonHoverBorderRadius' => [
                'type' => 'object',
                'default' => [],
            ],
            'enableButtonHoverBoxShadow' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'buttonHoverBoxShadowColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonHoverBoxShadowPosition' => [
                'type' => 'string',
                'default' => 'outline',
            ],
            'buttonHoverBoxShadowHorizontal' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonHoverBoxShadowHorizontalUnit' => [
                'type' => 'string',
                'default' => 'px',
            ],
            'buttonHoverBoxShadowVertical' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonHoverBoxShadowVerticalUnit' => [
                'type' => 'string',
                'default' => 'px',
            ],
            'buttonHoverBoxShadowBlur' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonHoverBoxShadowBlurUnit' => [
                'type' => 'string',
                'default' => 'px',
            ],
            'buttonHoverBoxShadowSpread' => [
                'type' => 'string',
                'default' => '',
            ],
            'buttonHoverBoxShadowSpreadUnit' => [
                'type' => 'string',
                'default' => 'px',
            ],
        ];
    }

    /**
     * Get message related attributes
     *
     * @return array Message related attributes
     */
    public static function getMessageAttributes()
    {
        return [
            'errorMessageAlignment' => [
                'type' => 'string',
                'default' => '',
            ],
            'successMessageAlignment' => [
                'type' => 'string',
                'default' => '',
            ],
            'submitErrorMessageAlignment' => [
                'type' => 'string',
                'default' => '',
            ],
        ];
    }

    /**
     * Get advanced attributes
     *
     * @return array Advanced attributes
     */
    public static function getAdvancedAttributes()
    {
        return [
            'radioCheckboxItemsSize' => [
                'type' => 'number',
            ],
            'customCss' => [
                'type' => 'string',
                'default' => '',
            ],
            'hideOnDesktop' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'hideOnTablet' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'hideOnMobile' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'zIndex' => [
                'type' => 'string',
                'default' => '',
            ],
            // Input box shadow focus
            'enableInputBoxShadow' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'inputBoxShadowColor' => [
                'type' => 'string',
                'default' => '',
            ],
            'inputBoxShadowPosition' => [
                'type' => 'string',
                'default' => 'outline',
            ],
            'inputBoxShadowHorizontal' => [
                'type' => 'string',
                'default' => '',
            ],
            'inputBoxShadowHorizontalUnit' => [
                'type' => 'string',
                'default' => 'px',
            ],
            'inputBoxShadowVertical' => [
                'type' => 'string',
                'default' => '',
            ],
            'inputBoxShadowVerticalUnit' => [
                'type' => 'string',
                'default' => 'px',
            ],
            'inputBoxShadowBlur' => [
                'type' => 'string',
                'default' => '',
            ],
            'inputBoxShadowBlurUnit' => [
                'type' => 'string',
                'default' => 'px',
            ],
            'inputBoxShadowSpread' => [
                'type' => 'string',
                'default' => '',
            ],
            'inputBoxShadowSpreadUnit' => [
                'type' => 'string',
                'default' => 'px',
            ],
            'enableInputBoxShadowFocus' => [
                'type' => 'boolean',
                'default' => false,
            ],
            'inputBoxShadowColorFocus' => [
                'type' => 'string',
                'default' => '',
            ],
            'inputBoxShadowPositionFocus' => [
                'type' => 'string',
                'default' => 'outline',
            ],
            'inputBoxShadowHorizontalFocus' => [
                'type' => 'string',
                'default' => '',
            ],
            'inputBoxShadowHorizontalUnitFocus' => [
                'type' => 'string',
                'default' => 'px',
            ],
            'inputBoxShadowVerticalFocus' => [
                'type' => 'string',
                'default' => '',
            ],
            'inputBoxShadowVerticalUnitFocus' => [
                'type' => 'string',
                'default' => 'px',
            ],
            'inputBoxShadowBlurFocus' => [
                'type' => 'string',
                'default' => '',
            ],
            'inputBoxShadowBlurUnitFocus' => [
                'type' => 'string',
                'default' => 'px',
            ],
            'inputBoxShadowSpreadFocus' => [
                'type' => 'string',
                'default' => '',
            ],
            'inputBoxShadowSpreadUnitFocus' => [
                'type' => 'string',
                'default' => 'px',
            ],
        ];
    }

    /**
     * Check if any style attributes are present in the given attributes
     *
     * @param array $atts Block attributes to check
     * @return bool True if style attributes exist, false otherwise
     */
    public static function hasStyleAttributes($atts)
    {
        $styleAttributes = array_merge(
            array_keys(self::getTypographyAttributes()),
            array_keys(self::getColorAttributes()),
            array_keys(self::getBorderAttributes()),
            array_keys(self::getSpacingAttributes()),
            array_keys(self::getButtonAttributes()),
            array_keys(self::getMessageAttributes())
        );

        return !empty(array_filter($atts, function($value, $key) use ($styleAttributes) {
            return in_array($key, $styleAttributes) && !empty($value);
        }, ARRAY_FILTER_USE_BOTH));
    }
}
