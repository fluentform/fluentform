
const { useState, useRef, useEffect, memo } = wp.element;
const { __ } = wp.i18n;
const { PanelBody, SelectControl, PanelRow, RangeControl, TabPanel } = wp.components;
const { useSelect } = wp.data;

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
            value={attributes.styles.labelColor}
            onChange={(value) => updateStyles({labelColor: value})}
            defaultColor=""
          />
          <FluentTypography
            label="Typography"
            settings={{
                fontSize: attributes.styles.labelTypography?.size?.lg || '',
                fontWeight: attributes.styles.labelTypography?.weight || '400',
                lineHeight: attributes.styles.labelTypography?.lineHeight || '',
                letterSpacing: attributes.styles.labelTypography?.letterSpacing || '',
                textTransform: attributes.styles.labelTypography?.textTransform || 'none'
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
                                    key="input-text-color-normal"
                                    label="Text Color"
                                    value={attributes.styles?.inputTextColor || ''}
                                    onChange={(value) => {
                                        updateStyles({ inputTextColor: value });
                                    }}
                                    defaultColor=""
                                />

                                <FluentColorPicker
                                    key="input-bg-color-normal"
                                    label="Background Color"
                                    value={attributes.styles?.inputBackgroundColor || ''}
                                    styles={attributes.styles}
                                    onChange={(value) => {
                                        updateStyles({ inputBackgroundColor: value });
                                    }}
                                    defaultColor=""
                                />

                                <FluentTypography
                                    label="Typography"
                                    settings={{
                                        fontSize: attributes.styles.inputTypography?.size?.lg || '',
                                        fontWeight: attributes.styles.inputTypography?.weight || '400',
                                        lineHeight: attributes.styles.inputTypography?.lineHeight || '',
                                        letterSpacing: attributes.styles.inputTypography?.letterSpacing || '',
                                        textTransform: attributes.styles.inputTypography?.textTransform || 'none'
                                    }}
                                    onChange={(changedTypo) => handleTypographyChange(changedTypo, 'inputTypography')}
                                />

                                <FluentSpaceControl
                                    label="Spacing"
                                    values={attributes.styles.inputSpacing}
                                    onChange={(value) => updateStyles({ inputSpacing: value })}
                                />

                                <FluentBorderControl
                                    label={__("Border")}
                                    enabled={attributes.styles.enableInputBorder || false}
                                    onToggle={(value) => updateStyles({ enableInputBorder: value })}
                                    borderType={attributes.styles.inputBorderType}
                                    onBorderTypeChange={(value) => updateStyles({ inputBorderType: value })}
                                    borderColor={attributes.styles.inputBorderColor}
                                    onBorderColorChange={(value) => updateStyles({ inputBorderColor: value })}
                                    borderWidth={attributes.styles.inputBorderWidth}
                                    onBorderWidthChange={(value) => updateStyles({ inputBorderWidth: value })}
                                    borderRadius={attributes.styles.inputBorderRadius}
                                    onBorderRadiusChange={(value) => updateStyles({ inputBorderRadius: value })}
                                />

                                <FluentBoxShadowControl
                                    label={__("Box Shadow")}
                                    enabled={attributes.styles.enableInputBoxShadow || false}
                                    onToggle={(value) => updateStyles({ enableInputBoxShadow: value })}
                                    color={attributes.styles.inputBoxShadowColor}
                                    onColorChange={(value) => updateStyles({ inputBoxShadowColor: value })}
                                    position={attributes.styles.inputBoxShadowPosition}
                                    onPositionChange={(value) => updateStyles({ inputBoxShadowPosition: value })}
                                    horizontal={attributes.styles.inputBoxShadowHorizontal}
                                    onHorizontalChange={(value) => updateStyles({ inputBoxShadowHorizontal: value })}
                                    horizontalUnit={attributes.styles.inputBoxShadowHorizontalUnit}
                                    onHorizontalUnitChange={(value) => updateStyles({ inputBoxShadowHorizontalUnit: value })}
                                    vertical={attributes.styles.inputBoxShadowVertical}
                                    onVerticalChange={(value) => updateStyles({ inputBoxShadowVertical: value })}
                                    verticalUnit={attributes.styles.inputBoxShadowVerticalUnit}
                                    onVerticalUnitChange={(value) => updateStyles({ inputBoxShadowVerticalUnit: value })}
                                    blur={attributes.styles.inputBoxShadowBlur}
                                    onBlurChange={(value) => updateStyles({ inputBoxShadowBlur: value })}
                                    blurUnit={attributes.styles.inputBoxShadowBlurUnit}
                                    onBlurUnitChange={(value) => updateStyles({ inputBoxShadowBlurUnit: value })}
                                    spread={attributes.styles.inputBoxShadowSpread}
                                    onSpreadChange={(value) => updateStyles({ inputBoxShadowSpread: value })}
                                    spreadUnit={attributes.styles.inputBoxShadowSpreadUnit}
                                    onSpreadUnitChange={(value) => updateStyles({ inputBoxShadowSpreadUnit: value })}
                                />
                            </>
                        );
                    } else if (tab.name === 'focus') {
                        return (
                            <>
                                <FluentColorPicker
                                    key="input-text-color-focus"
                                    label="Text Color"
                                    value={attributes.styles.inputTextFocusColor || ''}
                                    onChange={(value) => {
                                        updateStyles({ inputTextFocusColor: value });
                                    }}
                                    defaultColor=""
                                />

                                <FluentColorPicker
                                    key="input-bg-color-focus"
                                    label="Background Color"
                                    value={attributes.styles?.inputBackgroundFocusColor || ''}
                                    onChange={(value) => {
                                        updateStyles({ inputBackgroundFocusColor: value });
                                    }}
                                    defaultColor=""
                                />

                                <FluentSpaceControl
                                    label="Spacing"
                                    values={attributes.styles.inputFocusSpacing}
                                    onChange={(value) => updateStyles({ inputFocusSpacing: value })}
                                />

                                <FluentBorderControl
                                    label={__("Border")}
                                    enabled={attributes.styles.enableInputBorderFocus || false}
                                    onToggle={(value) => updateStyles({ enableInputBorderFocus: value })}
                                    borderType={attributes.styles.inputBorderTypeFocus}
                                    onBorderTypeChange={(value) => updateStyles({ inputBorderTypeFocus: value })}
                                    borderColor={attributes.styles.inputBorderColorFocus}
                                    onBorderColorChange={(value) => updateStyles({ inputBorderColorFocus: value })}
                                    borderWidth={attributes.styles.inputBorderWidthFocus}
                                    onBorderWidthChange={(value) => updateStyles({ inputBorderWidthFocus: value })}
                                    borderRadius={attributes.styles.inputBorderRadiusFocus}
                                    onBorderRadiusChange={(value) => updateStyles({ inputBorderRadiusFocus: value })}
                                />

                                <FluentBoxShadowControl
                                    label={__("Box Shadow")}
                                    enabled={attributes.styles.enableInputBoxShadowFocus || false}
                                    onToggle={(value) => updateStyles({ enableInputBoxShadowFocus: value })}
                                    color={attributes.styles.inputBoxShadowColorFocus}
                                    onColorChange={(value) => updateStyles({ inputBoxShadowColorFocus: value })}
                                    position={attributes.styles.inputBoxShadowPositionFocus}
                                    onPositionChange={(value) => updateStyles({ inputBoxShadowPositionFocus: value })}
                                    horizontal={attributes.styles.inputBoxShadowHorizontalFocus}
                                    onHorizontalChange={(value) => updateStyles({ inputBoxShadowHorizontalFocus: value })}
                                    horizontalUnit={attributes.styles.inputBoxShadowHorizontalUnitFocus}
                                    onHorizontalUnitChange={(value) => updateStyles({ inputBoxShadowHorizontalUnitFocus: value })}
                                    vertical={attributes.styles.inputBoxShadowVerticalFocus}
                                    onVerticalChange={(value) => updateStyles({ inputBoxShadowVerticalFocus: value })}
                                    verticalUnit={attributes.styles.inputBoxShadowVerticalUnitFocus}
                                    onVerticalUnitChange={(value) => updateStyles({ inputBoxShadowVerticalUnitFocus: value })}
                                    blur={attributes.styles.inputBoxShadowBlurFocus}
                                    onBlurChange={(value) => updateStyles({ inputBoxShadowBlurFocus: value })}
                                    blurUnit={attributes.styles.inputBoxShadowBlurUnitFocus}
                                    onBlurUnitChange={(value) => updateStyles({ inputBoxShadowBlurUnitFocus: value })}
                                    spread={attributes.styles.inputBoxShadowSpreadFocus}
                                    onSpreadChange={(value) => updateStyles({ inputBoxShadowSpreadFocus: value })}
                                    spreadUnit={attributes.styles.inputBoxShadowSpreadUnitFocus}
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
                  value={attributes.styles.buttonAlignment}
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
            value={attributes.styles.buttonWidth}
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
                                value={attributes.styles.buttonColor}
                                onChange={(value) => updateStyles({buttonColor: value})}
                                defaultColor="#ffffff"
                              />

                              <FluentColorPicker
                                label="Background Color"
                                value={attributes.styles.buttonBGColor}
                                onChange={(value) => updateStyles({buttonBGColor: value})}
                                defaultColor="#409EFF"
                              />

                              {/* Typography */}
                              <FluentTypography
                                label="Typography"
                                settings={{
                                    fontSize: attributes.styles.buttonTypography?.size?.lg || '',
                                    fontWeight: attributes.styles.buttonTypography?.weight || '500',
                                    lineHeight: attributes.styles.buttonTypography?.lineHeight || '',
                                    letterSpacing: attributes.styles.buttonTypography?.letterSpacing || '',
                                    textTransform: attributes.styles.buttonTypography?.textTransform || 'none'
                                }}
                                onChange={(changedTypo) => handleTypographyChange(changedTypo, 'buttonTypography')}
                              />

                              {/* Padding */}
                              <FluentSpaceControl
                                label="Padding"
                                values={attributes.styles.buttonPadding}
                                onChange={(value) => updateStyles({ buttonPadding: value })}
                              />

                              {/* Margin */}
                              <FluentSpaceControl
                                label="Margin"
                                values={attributes.styles.buttonMargin}
                                onChange={(value) => updateStyles({ buttonMargin: value })}
                              />

                              {/* Box Shadow */}
                              <FluentBoxShadowControl
                                  label={__("Box Shadow")}
                                  enabled={attributes.styles.enableButtonBoxShadow || false}
                                  onToggle={(value) => updateStyles({ enableButtonBoxShadow: value })}
                                  color={attributes.styles.buttonBoxShadowColor}
                                  onColorChange={(value) => updateStyles({ buttonBoxShadowColor: value })}
                                  position={attributes.styles.buttonBoxShadowPosition}
                                  onPositionChange={(value) => updateStyles({ buttonBoxShadowPosition: value })}
                                  horizontal={attributes.styles.buttonBoxShadowHorizontal}
                                  onHorizontalChange={(value) => updateStyles({ buttonBoxShadowHorizontal: value })}
                                  horizontalUnit={attributes.styles.buttonBoxShadowHorizontalUnit}
                                  onHorizontalUnitChange={(value) => updateStyles({ buttonBoxShadowHorizontalUnit: value })}
                                  vertical={attributes.styles.buttonBoxShadowVertical}
                                  onVerticalChange={(value) => updateStyles({ buttonBoxShadowVertical: value })}
                                  verticalUnit={attributes.styles.buttonBoxShadowVerticalUnit}
                                  onVerticalUnitChange={(value) => updateStyles({ buttonBoxShadowVerticalUnit: value })}
                                  blur={attributes.styles.buttonBoxShadowBlur}
                                  onBlurChange={(value) => updateStyles({ buttonBoxShadowBlur: value })}
                                  blurUnit={attributes.styles.buttonBoxShadowBlurUnit}
                                  onBlurUnitChange={(value) => updateStyles({ buttonBoxShadowBlurUnit: value })}
                                  spread={attributes.styles.buttonBoxShadowSpread}
                                  onSpreadChange={(value) => updateStyles({ buttonBoxShadowSpread: value })}
                                  spreadUnit={attributes.styles.buttonBoxShadowSpreadUnit}
                                  onSpreadUnitChange={(value) => updateStyles({ buttonBoxShadowSpreadUnit: value })}
                              />

                              {/* Button Border */}
                              <FluentBorderControl
                                  label={__("Border")}
                                  enabled={attributes.styles.enableButtonBorder || false}
                                  onToggle={(value) => updateStyles({ enableButtonBorder: value })}
                                  borderType={attributes.styles.buttonBorderType}
                                  onBorderTypeChange={(value) => updateStyles({ buttonBorderType: value })}
                                  borderColor={attributes.styles.buttonBorderColor}
                                  onBorderColorChange={(value) => updateStyles({ buttonBorderColor: value })}
                                  borderWidth={attributes.styles.buttonBorderWidth}
                                  onBorderWidthChange={(value) => updateStyles({ buttonBorderWidth: value })}
                                  borderRadius={attributes.styles.buttonBorderRadius}
                                  onBorderRadiusChange={(value) => updateStyles({ buttonBorderRadius: value })}
                              />
                          </>
                      );
                  } else if (tab.name === 'hover') {
                      return (
                          <>
                              <FluentColorPicker
                                label="Text Color"
                                value={attributes.styles.buttonHoverColor}
                                onChange={(value) => updateStyles({buttonHoverColor: value})}
                                defaultColor="#ffffff"
                              />

                              <FluentColorPicker
                                label="Background Color"
                                value={attributes.styles.buttonHoverBGColor}
                                onChange={(value) => updateStyles({buttonHoverBGColor: value})}
                                defaultColor="#66b1ff"
                              />

                              {/* Typography */}
                              <FluentTypography
                                label="Typography"
                                settings={{
                                    fontSize: attributes.styles.buttonHoverTypography?.size?.lg || '',
                                    fontWeight: attributes.styles.buttonHoverTypography?.weight || '500',
                                    lineHeight: attributes.styles.buttonHoverTypography?.lineHeight || '',
                                    letterSpacing: attributes.styles.buttonHoverTypography?.letterSpacing || '',
                                    textTransform: attributes.styles.buttonHoverTypography?.textTransform || 'none'
                                }}
                                onChange={(changedTypo) => handleTypographyChange(changedTypo, 'buttonHoverTypography')}
                              />

                              {/* Padding */}
                              <FluentSpaceControl
                                label="Padding"
                                values={attributes.styles.buttonHoverPadding}
                                onChange={(value) => updateStyles({ buttonHoverPadding: value })}
                              />

                              {/* Margin */}
                              <FluentSpaceControl
                                label="Margin"
                                values={attributes.styles.buttonHoverMargin}
                                onChange={(value) => updateStyles({ buttonHoverMargin: value })}
                              />

                              {/* Box Shadow */}
                              <FluentBoxShadowControl
                                  label={__("Box Shadow")}
                                  enabled={attributes.styles.enableButtonHoverBoxShadow || false}
                                  onToggle={(value) => updateStyles({ enableButtonHoverBoxShadow: value })}
                                  color={attributes.styles.buttonHoverBoxShadowColor}
                                  onColorChange={(value) => updateStyles({ buttonHoverBoxShadowColor: value })}
                                  position={attributes.styles.buttonHoverBoxShadowPosition}
                                  onPositionChange={(value) => updateStyles({ buttonHoverBoxShadowPosition: value })}
                                  horizontal={attributes.styles.buttonHoverBoxShadowHorizontal}
                                  onHorizontalChange={(value) => updateStyles({ buttonHoverBoxShadowHorizontal: value })}
                                  horizontalUnit={attributes.styles.buttonHoverBoxShadowHorizontalUnit}
                                  onHorizontalUnitChange={(value) => updateStyles({ buttonHoverBoxShadowHorizontalUnit: value })}
                                  vertical={attributes.styles.buttonHoverBoxShadowVertical}
                                  onVerticalChange={(value) => updateStyles({ buttonHoverBoxShadowVertical: value })}
                                  verticalUnit={attributes.styles.buttonHoverBoxShadowVerticalUnit}
                                  onVerticalUnitChange={(value) => updateStyles({ buttonHoverBoxShadowVerticalUnit: value })}
                                  blur={attributes.styles.buttonHoverBoxShadowBlur}
                                  onBlurChange={(value) => updateStyles({ buttonHoverBoxShadowBlur: value })}
                                  blurUnit={attributes.styles.buttonHoverBoxShadowBlurUnit}
                                  onBlurUnitChange={(value) => updateStyles({ buttonHoverBoxShadowBlurUnit: value })}
                                  spread={attributes.styles.buttonHoverBoxShadowSpread}
                                  onSpreadChange={(value) => updateStyles({ buttonHoverBoxShadowSpread: value })}
                                  spreadUnit={attributes.styles.buttonHoverBoxShadowSpreadUnit}
                                  onSpreadUnitChange={(value) => updateStyles({ buttonHoverBoxShadowSpreadUnit: value })}
                              />

                              {/* Button Border */}
                              <FluentBorderControl
                                  label={__("Border")}
                                  enabled={attributes.styles.enableButtonHoverBorder || false}
                                  onToggle={(value) => updateStyles({ enableButtonHoverBorder: value })}
                                  borderType={attributes.styles.buttonHoverBorderType}
                                  onBorderTypeChange={(value) => updateStyles({ buttonHoverBorderType: value })}
                                  borderColor={attributes.styles.buttonHoverBorderColor}
                                  onBorderColorChange={(value) => updateStyles({ buttonHoverBorderColor: value })}
                                  borderWidth={attributes.styles.buttonHoverBorderWidth}
                                  onBorderWidthChange={(value) => updateStyles({ buttonHoverBorderWidth: value })}
                                  borderRadius={attributes.styles.buttonHoverBorderRadius}
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
            value={attributes.styles.placeholderColor}
            onChange={(value) => updateStyles({placeholderColor: value})}
            defaultColor=""
          />

          <FluentTypography
            label="Typography"
            settings={{
                fontSize: attributes.styles.placeholderTypography?.size?.lg || '',
                fontWeight: attributes.styles.placeholderTypography?.weight || '400',
                lineHeight: attributes.styles.placeholderTypography?.lineHeight || '',
                letterSpacing: attributes.styles.placeholderTypography?.letterSpacing || '',
                textTransform: attributes.styles.placeholderTypography?.textTransform || 'none'
            }}
            onChange={(changedTypo) => handleTypographyChange(changedTypo, 'placeholderTypography')}
          />

      </PanelBody>
    );
}

const RadioCheckBoxStylesPanel = ({ attributes, updateStyles }) => {
    // Use local state to ensure the UI updates immediately
    const [localSize, setLocalSize] = useState(attributes.styles.radioCheckboxItemsSize || 15);

    // Update local state when the attribute changes from outside
    useEffect(() => {
        if (attributes.styles.radioCheckboxItemsSize !== undefined && attributes.styles.radioCheckboxItemsSize !== localSize) {
            setLocalSize(attributes.styles.radioCheckboxItemsSize);
        }
    }, [attributes.styles.radioCheckboxItemsSize]);

    // Handle size change with immediate UI update
    const handleSizeChange = (value) => {
        // Update local state for immediate UI feedback
        setLocalSize(value);
        // Update the actual attribute
        updateStyles({radioCheckboxItemsSize: value});
    };

    return (
        <PanelBody title={__('Radio & Checkbox Styles')} initialOpen={false}>
            {/* Label Text Styles */}
            <FluentColorPicker
                label="Items Color"
                value={attributes.styles.radioCheckboxItemsColor}
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
const TabGeneral = ({ setAttributes, updateStyles, state, handlePresetChange }) => {
    const attributes = useSelect((select) => {
        return select('core/block-editor').getSelectedBlock().attributes;
    });
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