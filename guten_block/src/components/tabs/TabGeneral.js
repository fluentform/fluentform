
const { useState, useRef, useEffect, memo } = wp.element;
const { __ } = wp.i18n;
const { PanelBody, SelectControl, PanelRow, RangeControl, TabPanel } = wp.components;

// Custom components
import FluentTypography from "../controls/FluentTypography";
import FluentColorPicker from "../controls/FluentColorPicker";
import FluentSpaceControl from "../controls/FluentSpaceControl";
import FluentBorderControl from "../controls/FluentBorderControl";
import FluentBoxShadowControl from "../controls/FluentBoxShadowControl";
import FluentAlignmentControl from "../controls/FluentAlignmentControl";
import FluentSeparator from "../controls/FluentSeparator";
import { getUpdatedTypography } from "../utils/TypographyUtils";
import { arePropsEqual } from '../utils/ComponentUtils';

// Constants
const DEFAULT_COLORS = [
    { name: 'Theme Blue', color: '#72aee6' },
    { name: 'Theme Red', color: '#e65054' },
    { name: 'Theme Green', color: '#68de7c' },
    { name: 'Black', color: '#000000' },
    { name: 'White', color: '#ffffff' },
    { name: 'Gray', color: '#dddddd' }
];

/**
 * Component for form style template selection
 */
const StyleTemplatePanel = ({ attributes, setAttributes, handlePresetChange }) => {
    const config = window.fluentform_block_vars;
    const presets = config.style_presets;

    return (
      <PanelBody title={__("Form Style Template")} initialOpen={true}>
          <SelectControl
            label={__("Choose a Template")}
            value={attributes.themeStyle}
            options={presets}
            onChange={themeStyle => {
                setAttributes({
                    themeStyle,
                    isThemeChange: true,
                });
                if (handlePresetChange) {
                    handlePresetChange(themeStyle);
                }
            }}
          />
      </PanelBody>
    );
};

/**
 * Component for label styling options
 */
const LabelStylesPanel = ({ attributes, updateStyles }) => {
    const handleTypographyChange = (changedTypo, key) => {
        const updatedTypography = getUpdatedTypography(
            changedTypo,
            attributes,
            key
        );

        updateStyles({ [key]: updatedTypography });
    };

    return (
      <PanelBody title={__("Label Styles")} initialOpen={false}>
          <FluentColorPicker
            label="Color"
            value={attributes.labelColor}
            onChange={(value) => updateStyles({labelColor: value})}
            defaultColor=""
          />
          <FluentTypography
            label="Typography"
            settings={{
                fontSize: attributes.labelTypography?.size?.lg || '',
                fontWeight: attributes.labelTypography?.weight || '400',
                lineHeight: attributes.labelTypography?.lineHeight || '',
                letterSpacing: attributes.labelTypography?.letterSpacing || '',
                textTransform: attributes.labelTypography?.textTransform || 'none'
            }}
            onChange={(changedTypo) => handleTypographyChange(changedTypo, 'labelTypography')}
          />
      </PanelBody>
    );
};

/**
 * Component for input and textarea styling options
 */
const InputStylesPanel = ({ attributes, updateStyles }) => {
    const handleTypographyChange = (changedTypo, key) => {
        const updatedTypography = getUpdatedTypography(
          changedTypo,
          attributes,
          key
        );

        updateStyles({ [key]: updatedTypography });
    };

    return (
        <PanelBody title={__("Input & Textarea")} initialOpen={false}>
            <TabPanel
                className="input-styles-tabs"
                activeClass="is-active"
                tabs={[
                    { name: 'normal', title: __('Normal'), className: 'tab-normal' },
                    { name: 'focus', title: __('Focus'), className: 'tab-focus' },
                ]}
            >
                {(tab) => {
                    if (tab.name === 'normal') {
                        return (
                            <>
                                <FluentColorPicker
                                    label="Text Color"
                                    value={attributes.inputTextColor}
                                    onChange={(value) => updateStyles({
                                        inputTextColor: value
                                    })}
                                    defaultColor=""
                                />

                                <FluentColorPicker
                                    label="Background Color"
                                    value={attributes.inputBackgroundColor}
                                    onChange={(value) => updateStyles({
                                        inputBackgroundColor: value
                                    })}
                                    defaultColor=""
                                />

                                <FluentTypography
                                    label="Typography"
                                    settings={{
                                        fontSize: attributes.inputTypography?.size?.lg || '',
                                        fontWeight: attributes.inputTypography?.weight || '400',
                                        lineHeight: attributes.inputTypography?.lineHeight || '',
                                        letterSpacing: attributes.inputTypography?.letterSpacing || '',
                                        textTransform: attributes.inputTypography?.textTransform || 'none'
                                    }}
                                    onChange={(changedTypo) => handleTypographyChange(changedTypo, 'inputTypography')}
                                />

                                <FluentSpaceControl
                                    label="Spacing"
                                    values={attributes.inputSpacing}
                                    onChange={(value) => updateStyles({ inputSpacing: value })}
                                />

                                <FluentBorderControl
                                    label={__("Border")}
                                    enabled={attributes.enableInputBorder || false}
                                    onToggle={(value) => updateStyles({ enableInputBorder: value })}
                                    borderType={attributes.inputBorderType}
                                    onBorderTypeChange={(value) => updateStyles({ inputBorderType: value })}
                                    borderColor={attributes.inputBorderColor}
                                    onBorderColorChange={(value) => updateStyles({ inputBorderColor: value })}
                                    borderWidth={attributes.inputBorderWidth}
                                    onBorderWidthChange={(value) => updateStyles({ inputBorderWidth: value })}
                                    borderRadius={attributes.inputBorderRadius}
                                    onBorderRadiusChange={(value) => updateStyles({ inputBorderRadius: value })}
                                />

                                <FluentBoxShadowControl
                                    label={__("Box Shadow")}
                                    enabled={attributes.enableInputBoxShadow || false}
                                    onToggle={(value) => updateStyles({ enableInputBoxShadow: value })}
                                    color={attributes.inputBoxShadowColor}
                                    onColorChange={(value) => updateStyles({ inputBoxShadowColor: value })}
                                    position={attributes.inputBoxShadowPosition}
                                    onPositionChange={(value) => updateStyles({ inputBoxShadowPosition: value })}
                                    horizontal={attributes.inputBoxShadowHorizontal}
                                    onHorizontalChange={(value) => updateStyles({ inputBoxShadowHorizontal: value })}
                                    horizontalUnit={attributes.inputBoxShadowHorizontalUnit}
                                    onHorizontalUnitChange={(value) => updateStyles({ inputBoxShadowHorizontalUnit: value })}
                                    vertical={attributes.inputBoxShadowVertical}
                                    onVerticalChange={(value) => updateStyles({ inputBoxShadowVertical: value })}
                                    verticalUnit={attributes.inputBoxShadowVerticalUnit}
                                    onVerticalUnitChange={(value) => updateStyles({ inputBoxShadowVerticalUnit: value })}
                                    blur={attributes.inputBoxShadowBlur}
                                    onBlurChange={(value) => updateStyles({ inputBoxShadowBlur: value })}
                                    blurUnit={attributes.inputBoxShadowBlurUnit}
                                    onBlurUnitChange={(value) => updateStyles({ inputBoxShadowBlurUnit: value })}
                                    spread={attributes.inputBoxShadowSpread}
                                    onSpreadChange={(value) => updateStyles({ inputBoxShadowSpread: value })}
                                    spreadUnit={attributes.inputBoxShadowSpreadUnit}
                                    onSpreadUnitChange={(value) => updateStyles({ inputBoxShadowSpreadUnit: value })}
                                />
                            </>
                        );
                    } else if (tab.name === 'focus') {
                        return (
                            <>
                                <FluentColorPicker
                                    label="Text Color"
                                    value={attributes.inputTextFocusColor}
                                    onChange={(value) => updateStyles({
                                        inputTextFocusColor: value
                                    })}
                                    defaultColor=""
                                />

                                <FluentColorPicker
                                    label="Background Color"
                                    value={attributes.inputBackgroundFocusColor}
                                    onChange={(value) => updateStyles({
                                        inputBackgroundFocusColor: value
                                    })}
                                    defaultColor=""
                                />

                                <FluentSpaceControl
                                    label="Spacing"
                                    values={attributes.inputFocusSpacing}
                                    onChange={(value) => updateStyles({ inputFocusSpacing: value })}
                                />

                                <FluentBorderControl
                                    label={__("Border")}
                                    enabled={attributes.enableInputBorderFocus || false}
                                    onToggle={(value) => updateStyles({ enableInputBorderFocus: value })}
                                    borderType={attributes.inputBorderTypeFocus}
                                    onBorderTypeChange={(value) => updateStyles({ inputBorderTypeFocus: value })}
                                    borderColor={attributes.inputBorderColorFocus}
                                    onBorderColorChange={(value) => updateStyles({ inputBorderColorFocus: value })}
                                    borderWidth={attributes.inputBorderWidthFocus}
                                    onBorderWidthChange={(value) => updateStyles({ inputBorderWidthFocus: value })}
                                    borderRadius={attributes.inputBorderRadiusFocus}
                                    onBorderRadiusChange={(value) => updateStyles({ inputBorderRadiusFocus: value })}
                                />

                                <FluentBoxShadowControl
                                    label={__("Box Shadow")}
                                    enabled={attributes.enableInputBoxShadowFocus || false}
                                    onToggle={(value) => updateStyles({ enableInputBoxShadowFocus: value })}
                                    color={attributes.inputBoxShadowColorFocus}
                                    onColorChange={(value) => updateStyles({ inputBoxShadowColorFocus: value })}
                                    position={attributes.inputBoxShadowPositionFocus}
                                    onPositionChange={(value) => updateStyles({ inputBoxShadowPositionFocus: value })}
                                    horizontal={attributes.inputBoxShadowHorizontalFocus}
                                    onHorizontalChange={(value) => updateStyles({ inputBoxShadowHorizontalFocus: value })}
                                    horizontalUnit={attributes.inputBoxShadowHorizontalUnitFocus}
                                    onHorizontalUnitChange={(value) => updateStyles({ inputBoxShadowHorizontalUnitFocus: value })}
                                    vertical={attributes.inputBoxShadowVerticalFocus}
                                    onVerticalChange={(value) => updateStyles({ inputBoxShadowVerticalFocus: value })}
                                    verticalUnit={attributes.inputBoxShadowVerticalUnitFocus}
                                    onVerticalUnitChange={(value) => updateStyles({ inputBoxShadowVerticalUnitFocus: value })}
                                    blur={attributes.inputBoxShadowBlurFocus}
                                    onBlurChange={(value) => updateStyles({ inputBoxShadowBlurFocus: value })}
                                    blurUnit={attributes.inputBoxShadowBlurUnitFocus}
                                    onBlurUnitChange={(value) => updateStyles({ inputBoxShadowBlurUnitFocus: value })}
                                    spread={attributes.inputBoxShadowSpreadFocus}
                                    onSpreadChange={(value) => updateStyles({ inputBoxShadowSpreadFocus: value })}
                                    spreadUnit={attributes.inputBoxShadowSpreadUnitFocus}
                                    onSpreadUnitChange={(value) => updateStyles({ inputBoxShadowSpreadUnitFocus: value })}
                                />
                            </>
                        );
                    }
                    return null;
                }}
            </TabPanel>
        </PanelBody>
    );
};

/**
 * Component for button styling options
 */
const ButtonStylesPanel = ({ attributes, updateStyles }) => {
    const handleTypographyChange = (changedTypo, key) => {
        const updatedTypography = getUpdatedTypography(
            changedTypo,
            attributes,
            key
        );

        updateStyles({ [key]: updatedTypography });
    };

    const handleBoxShadowChange = (value) => {
        updateStyles({ buttonBoxShadow: value });
    };

    const handleBoxShadowHoverChange = (value) => {
        updateStyles({ buttonBoxShadowHover: value });
    };

    return (
      <PanelBody title={__('Button Styles')} initialOpen={false}>

          {/* Common Button Alignment */}
          <div>
              <span className="ffblock-label">{__('Alignment')}</span>
              <FluentAlignmentControl
                  value={attributes.buttonAlignment}
                  onChange={(value) => updateStyles({buttonAlignment: value})}
                  options={[
                      { value: 'left', icon: 'editor-alignleft', label: __('Left') },
                      { value: 'center', icon: 'editor-aligncenter', label: __('Center') },
                      { value: 'right', icon: 'editor-alignright', label: __('Right') }
                  ]}
              />
          </div>

          {/* Common Button Width */}
          <RangeControl
            label={__('Width (%)')}
            value={attributes.buttonWidth}
            onChange={(value) => updateStyles({buttonWidth: value})}
            min={0}
            max={100}
            allowReset
            initialPosition={0}
            help={__('Set to 0 for auto width')}
          />

          {/* Tabs for Normal and Hover states */}
          <TabPanel
              className="button-styles-tabs"
              activeClass="is-active"
              tabs={[
                  { name: 'normal', title: __('Normal'), className: 'tab-normal' },
                  { name: 'hover', title: __('Hover'), className: 'tab-hover' },
              ]}
          >
              {(tab) => {
                  if (tab.name === 'normal') {
                      return (
                          <>
                              <FluentColorPicker
                                label="Text Color"
                                value={attributes.buttonColor}
                                onChange={(value) => updateStyles({buttonColor: value})}
                                defaultColor="#ffffff"
                              />

                              <FluentColorPicker
                                label="Background Color"
                                value={attributes.buttonBGColor}
                                onChange={(value) => updateStyles({buttonBGColor: value})}
                                defaultColor="#409EFF"
                              />

                              {/* Typography */}
                              <FluentTypography
                                label="Typography"
                                settings={{
                                    fontSize: attributes.buttonTypography?.size?.lg || '',
                                    fontWeight: attributes.buttonTypography?.weight || '500',
                                    lineHeight: attributes.buttonTypography?.lineHeight || '',
                                    letterSpacing: attributes.buttonTypography?.letterSpacing || '',
                                    textTransform: attributes.buttonTypography?.textTransform || 'none'
                                }}
                                onChange={(changedTypo) => handleTypographyChange(changedTypo, 'buttonTypography')}
                              />

                              {/* Padding */}
                              <FluentSpaceControl
                                label="Padding"
                                values={attributes.buttonPadding}
                                onChange={(value) => updateStyles({ buttonPadding: value })}
                              />

                              {/* Margin */}
                              <FluentSpaceControl
                                label="Margin"
                                values={attributes.buttonMargin}
                                onChange={(value) => updateStyles({ buttonMargin: value })}
                              />

                              {/* Box Shadow */}
                              <FluentBoxShadowControl
                                  label={__("Box Shadow")}
                                  enabled={attributes.enableButtonBoxShadow || false}
                                  onToggle={(value) => updateStyles({ enableButtonBoxShadow: value })}
                                  color={attributes.buttonBoxShadowColor}
                                  onColorChange={(value) => updateStyles({ buttonBoxShadowColor: value })}
                                  position={attributes.buttonBoxShadowPosition}
                                  onPositionChange={(value) => updateStyles({ buttonBoxShadowPosition: value })}
                                  horizontal={attributes.buttonBoxShadowHorizontal}
                                  onHorizontalChange={(value) => updateStyles({ buttonBoxShadowHorizontal: value })}
                                  horizontalUnit={attributes.buttonBoxShadowHorizontalUnit}
                                  onHorizontalUnitChange={(value) => updateStyles({ buttonBoxShadowHorizontalUnit: value })}
                                  vertical={attributes.buttonBoxShadowVertical}
                                  onVerticalChange={(value) => updateStyles({ buttonBoxShadowVertical: value })}
                                  verticalUnit={attributes.buttonBoxShadowVerticalUnit}
                                  onVerticalUnitChange={(value) => updateStyles({ buttonBoxShadowVerticalUnit: value })}
                                  blur={attributes.buttonBoxShadowBlur}
                                  onBlurChange={(value) => updateStyles({ buttonBoxShadowBlur: value })}
                                  blurUnit={attributes.buttonBoxShadowBlurUnit}
                                  onBlurUnitChange={(value) => updateStyles({ buttonBoxShadowBlurUnit: value })}
                                  spread={attributes.buttonBoxShadowSpread}
                                  onSpreadChange={(value) => updateStyles({ buttonBoxShadowSpread: value })}
                                  spreadUnit={attributes.buttonBoxShadowSpreadUnit}
                                  onSpreadUnitChange={(value) => updateStyles({ buttonBoxShadowSpreadUnit: value })}
                              />

                              {/* Button Border */}
                              <FluentBorderControl
                                  label={__("Border")}
                                  enabled={attributes.enableButtonBorder || false}
                                  onToggle={(value) => updateStyles({ enableButtonBorder: value })}
                                  borderType={attributes.buttonBorderType}
                                  onBorderTypeChange={(value) => updateStyles({ buttonBorderType: value })}
                                  borderColor={attributes.buttonBorderColor}
                                  onBorderColorChange={(value) => updateStyles({ buttonBorderColor: value })}
                                  borderWidth={attributes.buttonBorderWidth}
                                  onBorderWidthChange={(value) => updateStyles({ buttonBorderWidth: value })}
                                  borderRadius={attributes.buttonBorderRadius}
                                  onBorderRadiusChange={(value) => updateStyles({ buttonBorderRadius: value })}
                              />
                          </>
                      );
                  } else if (tab.name === 'hover') {
                      return (
                          <>
                              <FluentColorPicker
                                label="Text Color"
                                value={attributes.buttonHoverColor}
                                onChange={(value) => updateStyles({buttonHoverColor: value})}
                                defaultColor="#ffffff"
                              />

                              <FluentColorPicker
                                label="Background Color"
                                value={attributes.buttonHoverBGColor}
                                onChange={(value) => updateStyles({buttonHoverBGColor: value})}
                                defaultColor="#66b1ff"
                              />

                              {/* Typography */}
                              <FluentTypography
                                label="Typography"
                                settings={{
                                    fontSize: attributes.buttonHoverTypography?.size?.lg || '',
                                    fontWeight: attributes.buttonHoverTypography?.weight || '500',
                                    lineHeight: attributes.buttonHoverTypography?.lineHeight || '',
                                    letterSpacing: attributes.buttonHoverTypography?.letterSpacing || '',
                                    textTransform: attributes.buttonHoverTypography?.textTransform || 'none'
                                }}
                                onChange={(changedTypo) => handleTypographyChange(changedTypo, 'buttonHoverTypography')}
                              />

                              {/* Padding */}
                              <FluentSpaceControl
                                label="Padding"
                                values={attributes.buttonHoverPadding}
                                onChange={(value) => updateStyles({ buttonHoverPadding: value })}
                              />

                              {/* Margin */}
                              <FluentSpaceControl
                                label="Margin"
                                values={attributes.buttonHoverMargin}
                                onChange={(value) => updateStyles({ buttonHoverMargin: value })}
                              />

                              {/* Box Shadow */}
                              <FluentBoxShadowControl
                                  label={__("Box Shadow")}
                                  enabled={attributes.enableButtonHoverBoxShadow || false}
                                  onToggle={(value) => updateStyles({ enableButtonHoverBoxShadow: value })}
                                  color={attributes.buttonHoverBoxShadowColor}
                                  onColorChange={(value) => updateStyles({ buttonHoverBoxShadowColor: value })}
                                  position={attributes.buttonHoverBoxShadowPosition}
                                  onPositionChange={(value) => updateStyles({ buttonHoverBoxShadowPosition: value })}
                                  horizontal={attributes.buttonHoverBoxShadowHorizontal}
                                  onHorizontalChange={(value) => updateStyles({ buttonHoverBoxShadowHorizontal: value })}
                                  horizontalUnit={attributes.buttonHoverBoxShadowHorizontalUnit}
                                  onHorizontalUnitChange={(value) => updateStyles({ buttonHoverBoxShadowHorizontalUnit: value })}
                                  vertical={attributes.buttonHoverBoxShadowVertical}
                                  onVerticalChange={(value) => updateStyles({ buttonHoverBoxShadowVertical: value })}
                                  verticalUnit={attributes.buttonHoverBoxShadowVerticalUnit}
                                  onVerticalUnitChange={(value) => updateStyles({ buttonHoverBoxShadowVerticalUnit: value })}
                                  blur={attributes.buttonHoverBoxShadowBlur}
                                  onBlurChange={(value) => updateStyles({ buttonHoverBoxShadowBlur: value })}
                                  blurUnit={attributes.buttonHoverBoxShadowBlurUnit}
                                  onBlurUnitChange={(value) => updateStyles({ buttonHoverBoxShadowBlurUnit: value })}
                                  spread={attributes.buttonHoverBoxShadowSpread}
                                  onSpreadChange={(value) => updateStyles({ buttonHoverBoxShadowSpread: value })}
                                  spreadUnit={attributes.buttonHoverBoxShadowSpreadUnit}
                                  onSpreadUnitChange={(value) => updateStyles({ buttonHoverBoxShadowSpreadUnit: value })}
                              />

                              {/* Button Border */}
                              <FluentBorderControl
                                  label={__("Border")}
                                  enabled={attributes.enableButtonHoverBorder || false}
                                  onToggle={(value) => updateStyles({ enableButtonHoverBorder: value })}
                                  borderType={attributes.buttonHoverBorderType}
                                  onBorderTypeChange={(value) => updateStyles({ buttonHoverBorderType: value })}
                                  borderColor={attributes.buttonHoverBorderColor}
                                  onBorderColorChange={(value) => updateStyles({ buttonHoverBorderColor: value })}
                                  borderWidth={attributes.buttonHoverBorderWidth}
                                  onBorderWidthChange={(value) => updateStyles({ buttonHoverBorderWidth: value })}
                                  borderRadius={attributes.buttonHoverBorderRadius}
                                  onBorderRadiusChange={(value) => updateStyles({ buttonHoverBorderRadius: value })}
                              />
                          </>
                      );
                  }
                  return null;
              }}
          </TabPanel>
      </PanelBody>
    );
};

/**
 * Component for placeholder styling options
 */
const PlaceHolderStylesPanel = ({ attributes, updateStyles }) => {
    const handleTypographyChange = (changedTypo, key) => {
        const updatedTypography = getUpdatedTypography(
            changedTypo,
            attributes,
            key
        );

        updateStyles({ [key]: updatedTypography });
    };

    return (
      <PanelBody title={__('Placeholder Styles')} initialOpen={false}>
          <FluentColorPicker
            label="Text Color"
            value={attributes.placeholderColor}
            onChange={(value) => updateStyles({placeholderColor: value})}
            defaultColor=""
          />

          <FluentTypography
            label="Typography"
            settings={{
                fontSize: attributes.placeholderTypography?.size?.lg || '',
                fontWeight: attributes.placeholderTypography?.weight || '400',
                lineHeight: attributes.placeholderTypography?.lineHeight || '',
                letterSpacing: attributes.placeholderTypography?.letterSpacing || '',
                textTransform: attributes.placeholderTypography?.textTransform || 'none'
            }}
            onChange={(changedTypo) => handleTypographyChange(changedTypo, 'placeholderTypography')}
          />

      </PanelBody>
    );
}

const RadioCheckBoxStylesPanel = ({ attributes, updateStyles }) => {
    // Use local state to ensure the UI updates immediately
    const [localSize, setLocalSize] = useState(attributes.radioCheckboxItemsSize || 15);

    // Update local state when the attribute changes from outside
    useEffect(() => {
        if (attributes.radioCheckboxItemsSize !== undefined && attributes.radioCheckboxItemsSize !== localSize) {
            setLocalSize(attributes.radioCheckboxItemsSize);
        }
    }, [attributes.radioCheckboxItemsSize]);

    // Handle size change with immediate UI update
    const handleSizeChange = (value) => {
        // Update local state for immediate UI feedback
        setLocalSize(value);
        // Update the actual attribute
        updateStyles({radioCheckboxItemsSize: value});
        // Log for debugging
        console.log('Radio/Checkbox size changed to:', value);
    };

    return (
        <PanelBody title={__('Radio & Checkbox Styles')} initialOpen={false}>
            {/* Label Text Styles */}
            <FluentColorPicker
                label="Items Color"
                value={attributes.radioCheckboxItemsColor}
                onChange={(value) => updateStyles({radioCheckboxItemsColor: value})}
                defaultColor=""
            />
            <div className="ffblock-control-field">
                <span className="ffblock-label">Size (px)</span>
                <RangeControl
                    value={localSize} // Use local state for immediate UI feedback
                    min={1}
                    max={30}
                    step={1}
                    onChange={handleSizeChange}
                />
            </div>
        </PanelBody>
    );
}

/**
 * Main TabGeneral component
 */
const TabGeneral = ({ attributes, setAttributes, updateStyles, state, handlePresetChange }) => {
    return (
      <>
          <StyleTemplatePanel
            attributes={attributes}
            setAttributes={setAttributes}
            handlePresetChange={handlePresetChange}
          />


          <LabelStylesPanel
            attributes={attributes}
            updateStyles={updateStyles}
          />


          <InputStylesPanel
            attributes={attributes}
            updateStyles={updateStyles}
          />


          <PlaceHolderStylesPanel
            attributes={attributes}
            updateStyles={updateStyles}
          />


          <RadioCheckBoxStylesPanel
            attributes={attributes}
            updateStyles={updateStyles}
          />

          <ButtonStylesPanel
            attributes={attributes}
            updateStyles={updateStyles}
          />
      </>
    );
};

const GENERAL_TAB_ATTRIBUTES = [
    // Label attributes
    'labelColor',
    'labelTypography',

    // Input attributes
    'inputTextColor',
    'inputBackgroundColor',
    'inputTypography',
    'inputSpacing',
    'inputBorder',
    'inputBorderHover',
    'inputTextFocusColor',
    'inputBackgroundFocusColor',
    'inputFocusSpacing',
    'enableInputBorder',
    'inputBorderType',
    'inputBorderColor',
    'inputBorderWidth',
    'inputBorderRadius',
    'enableInputBorderFocus',
    'inputBorderTypeFocus',
    'inputBorderColorFocus',
    'inputBorderWidthFocus',
    'inputBorderRadiusFocus',
    'enableInputBoxShadow',
    'inputBoxShadowColor',
    'inputBoxShadowPosition',
    'inputBoxShadowHorizontal',
    'inputBoxShadowHorizontalUnit',
    'inputBoxShadowVertical',
    'inputBoxShadowVerticalUnit',
    'inputBoxShadowBlur',
    'inputBoxShadowBlurUnit',
    'inputBoxShadowSpread',
    'inputBoxShadowSpreadUnit',
    'enableInputBoxShadowFocus',
    'inputBoxShadowColorFocus',
    'inputBoxShadowPositionFocus',
    'inputBoxShadowHorizontalFocus',
    'inputBoxShadowHorizontalUnitFocus',
    'inputBoxShadowVerticalFocus',
    'inputBoxShadowVerticalUnitFocus',
    'inputBoxShadowBlurFocus',
    'inputBoxShadowBlurUnitFocus',
    'inputBoxShadowSpreadFocus',
    'inputBoxShadowSpreadUnitFocus',

    // Placeholder attributes
    'placeholderColor',
    'placeholderFocusColor',
    'placeholderTypography',

    // Radio/Checkbox attributes
    'radioCheckboxLabelColor',
    'radioCheckboxTypography',
    'radioCheckboxItemsColor',
    'radioCheckboxItemsSize',
    'checkboxSize',
    'checkboxBorderColor',
    'checkboxBgColor',
    'checkboxCheckedColor',
    'radioSize',
    'radioBorderColor',
    'radioBgColor',
    'radioCheckedColor',

    // Common Button attributes
    'buttonWidth',
    'buttonAlignment',

    // Normal Button attributes
    'buttonColor',
    'buttonBGColor',
    'buttonTypography',
    'buttonPadding',
    'buttonMargin',
    'buttonBoxShadow',
    'enableButtonBoxShadow',
    'buttonBoxShadowColor',
    'buttonBoxShadowPosition',
    'buttonBoxShadowHorizontal',
    'buttonBoxShadowHorizontalUnit',
    'buttonBoxShadowVertical',
    'buttonBoxShadowVerticalUnit',
    'buttonBoxShadowBlur',
    'buttonBoxShadowBlurUnit',
    'buttonBoxShadowSpread',
    'buttonBoxShadowSpreadUnit',
    'enableButtonBorder',
    'buttonBorderType',
    'buttonBorderColor',
    'buttonBorderWidth',
    'buttonBorderRadius',

    // Hover Button attributes
    'buttonHoverColor',
    'buttonHoverBGColor',
    'buttonHoverTypography',
    'buttonHoverPadding',
    'buttonHoverMargin',
    'buttonBoxShadowHover',
    'buttonBoxShadowHoverColor',
    'buttonBoxShadowHoverPosition',
    'enableButtonHoverBoxShadow',
    'buttonHoverBoxShadowColor',
    'buttonHoverBoxShadowPosition',
    'buttonHoverBoxShadowHorizontal',
    'buttonHoverBoxShadowHorizontalUnit',
    'buttonHoverBoxShadowVertical',
    'buttonHoverBoxShadowVerticalUnit',
    'buttonHoverBoxShadowBlur',
    'buttonHoverBoxShadowBlurUnit',
    'buttonHoverBoxShadowSpread',
    'buttonHoverBoxShadowSpreadUnit',
    'enableButtonHoverBorder',
    'buttonHoverBorderType',
    'buttonHoverBorderColor',
    'buttonHoverBorderWidth',
    'buttonHoverBorderRadius'
];

export default memo(TabGeneral, (prevProps, nextProps) => {
    return arePropsEqual(prevProps, nextProps, GENERAL_TAB_ATTRIBUTES, true);
});