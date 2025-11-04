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
            self::getStylesAttribute()
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
     * Get the consolidated styles attribute
     *
     * @return array Styles attribute configuration
     */
    public static function getStylesAttribute()
    {
        return [
            'styles' => [
                'type' => 'object',
                'default' => array_merge(
                    self::getTypographyAttributes(),
                    self::getColorAttributes(),
                    self::getBorderAttributes(),
                    self::getBoxShadowAttributes(),
                    self::getBackgroundAttributes(),
                    self::getSpacingAttributes(),
                    self::getButtonAttributes(),
                    self::getMessageAttributes(),
                    self::getAdvancedAttributes()
                ),
            ],
        ];
    }

    public static function getBoxShadowAttributes() {
        return [
            // Input box shadow focus
            'enableInputBoxShadow' => false,
            'inputBoxShadowColor' => '',
            'inputBoxShadowPosition' => 'outline',
            'inputBoxShadowHorizontal' => '',
            'inputBoxShadowHorizontalUnit' => 'px',
            'inputBoxShadowVertical' => '',
            'inputBoxShadowVerticalUnit' => 'px',
            'inputBoxShadowBlur' => '',
            'inputBoxShadowBlurUnit' => 'px',
            'inputBoxShadowSpread' => '',
            'inputBoxShadowSpreadUnit' => 'px',
            'enableInputBoxShadowFocus' => false,
            'inputBoxShadowColorFocus' => '',
            'inputBoxShadowPositionFocus' => 'outline',
            'inputBoxShadowHorizontalFocus' => '',
            'inputBoxShadowHorizontalUnitFocus' => 'px',
            'inputBoxShadowVerticalFocus' => '',
            'inputBoxShadowVerticalUnitFocus' => 'px',
            'inputBoxShadowBlurFocus' => '',
            'inputBoxShadowBlurUnitFocus' => 'px',
            'inputBoxShadowSpreadFocus' => '',
            'inputBoxShadowSpreadUnitFocus' => 'px',
            // Container box shadow
            'enableBoxShadow' => false,
            'boxShadowColor' => '',
            'boxShadowPosition' => 'outline',
            'boxShadowHorizontal' => '',
            'boxShadowHorizontalUnit' => 'px',
            'boxShadowVertical' => '',
            'boxShadowVerticalUnit' => 'px',
            'boxShadowBlur' => '',
            'boxShadowBlurUnit' => 'px',
            'boxShadowSpread' => '',
            'boxShadowSpreadUnit' => 'px',
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
            'labelTypography' => [],
            'inputTypography' => [],
            'buttonTypography' => [],
            'placeholderTypography' => [],
            'radioCheckboxTypography' => [],
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
            'textColor' => '',
            'backgroundColor' => '',
            'labelColor' => '',
            'inputTextColor' => '',
            'inputBackgroundColor' => '',
            'placeholderColor' => '',
            'placeholderFocusColor' => '',
            'buttonColor' => '',
            'buttonBGColor' => '',
            'buttonHoverColor' => '',
            'buttonHoverBGColor' => '',
            'radioCheckboxItemsColor' => '',
            'radioCheckboxLabelColor' => '',
            'checkboxSize' => '',
            'checkboxBorderColor' => '',
            'checkboxBgColor' => '',
            'checkboxCheckedColor' => '',
            'radioSize' => '',
            'radioBorderColor' => '',
            'radioBgColor' => '',
            'radioCheckedColor' => '',
            'errorMessageColor' => '',
            'errorMessageBgColor' => '',
            'successMessageColor' => '',
            'successMessageBgColor' => '',
            'submitErrorMessageColor' => '',
            'submitErrorMessageBgColor' => '',
            'gradientColor1' => '',
            'gradientColor2' => '',
            'backgroundOverlayColor' => '',
            'boxShadowColor' => '',
            'asteriskColor' => '',
            // Focus state colors
            'inputTextFocusColor' => '',
            'inputBackgroundFocusColor' => '',
            'inputFocusSpacing' => [],
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
            // Input border
            'enableInputBorder' => false,
            'inputBorderType' => 'solid',
            'inputBorderColor' => '',
            'inputBorder' => [],
            'inputBorderRadius' => [],
            'inputBorderWidth' => [],
            'inputBorderHover' => [],
            'formBorder' => [],
            'enableFormBorder' => false,
            'borderType' => 'solid',
            'borderColor' => '',
            'borderWidth' => [],
            'borderRadius' => [],
            // Button border
            'enableButtonBorder' => false,
            'buttonBorderType' => 'solid',
            'buttonBorderColor' => '',
            'buttonBorderWidth' => [],
            'buttonBorderRadius' => [],
            // Input focus borders
            'enableInputBorderFocus' => false,
            'inputBorderTypeFocus' => 'solid',
            'inputBorderColorFocus' => '',
            'inputBorderWidthFocus' => [],
            'inputBorderRadiusFocus' => [],
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
            'backgroundType' => 'classic',
            'backgroundImage' => '',
            'backgroundImageId' => 0,
            'backgroundSize' => 'cover',
            'backgroundPosition' => 'center center',
            'backgroundRepeat' => 'no-repeat',
            'backgroundAttachment' => 'scroll',
            'gradientType' => 'linear',
            'gradientAngle' => 90,
            'backgroundOverlayOpacity' => 0.5,
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
            'containerPadding' => [],
            'containerMargin' => [],
            'containerBoxShadow' => [],
            'containerBoxShadowHover' => [],
            'inputSpacing' => [],
            'inputSpacingHover' => [],
            'buttonPadding' => [],
            'buttonMargin' => [],
            'formWidth' => '',
            'formAlignment' => '',
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
            'buttonWidth' => '',
            'buttonAlignment' => 'left',

            // Normal state button attributes
            'buttonTypography' => [],
            'buttonPadding' => [],
            'buttonMargin' => [],
            'buttonBorderType' => 'solid',
            'buttonBorderColor' => '',
            'buttonBorderWidth' => [],
            'buttonBorderRadius' => [],
            'enableButtonBoxShadow' => false,
            'buttonBoxShadowColor' => '',
            'buttonBoxShadowPosition' => 'outline',
            'buttonBoxShadowHorizontal' => '',
            'buttonBoxShadowHorizontalUnit' => 'px',
            'buttonBoxShadowVertical' => '',
            'buttonBoxShadowVerticalUnit' => 'px',
            'buttonBoxShadowBlur' => '',
            'buttonBoxShadowBlurUnit' => 'px',
            'buttonBoxShadowSpread' => '',
            'buttonBoxShadowSpreadUnit' => 'px',

            // Hover state button attributes
            'buttonHoverTypography' => [],
            'buttonHoverPadding' => [],
            'buttonHoverMargin' => [],
            'enableButtonHoverBorder' => false,
            'buttonHoverBorderType' => 'solid',
            'buttonHoverBorderColor' => '',
            'buttonHoverBorderWidth' => [],
            'buttonHoverBorderRadius' => [],
            'enableButtonHoverBoxShadow' => false,
            'buttonHoverBoxShadowColor' => '',
            'buttonHoverBoxShadowPosition' => 'outline',
            'buttonHoverBoxShadowHorizontal' => '',
            'buttonHoverBoxShadowHorizontalUnit' => 'px',
            'buttonHoverBoxShadowVertical' => '',
            'buttonHoverBoxShadowVerticalUnit' => 'px',
            'buttonHoverBoxShadowBlur' => '',
            'buttonHoverBoxShadowBlurUnit' => 'px',
            'buttonHoverBoxShadowSpread' => '',
            'buttonHoverBoxShadowSpreadUnit' => 'px',
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
            'errorMessageAlignment' => '',
            'successMessageAlignment' => '',
            'submitErrorMessageAlignment' => '',
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
            'radioCheckboxItemsSize' => '',
            'customCss' => '',
            'hideOnDesktop' => false,
            'hideOnTablet' => false,
            'hideOnMobile' => false,
            'zIndex' => '',
        ];
    }
}
