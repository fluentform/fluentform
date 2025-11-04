
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
                                    border={attributes.styles.inputBorder || {}}
                                    onChange={(borderObj) => updateStyles({ inputBorder: borderObj })}
                                />

                                <FluentBoxShadowControl
                                    label={__("Box Shadow")}
                                    shadow={attributes.styles.inputBoxShadow || {}}
                                    onChange={(shadowObj) => updateStyles({ inputBoxShadow: shadowObj })}
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
                                    border={attributes.styles.inputBorderFocus || {}}
                                    onChange={(borderObj) => updateStyles({ inputBorderFocus: borderObj })}
                                />

                                <FluentBoxShadowControl
                                    label={__("Box Shadow")}
                                    shadow={attributes.styles.inputBoxShadowFocus || {}}
                                    onChange={(shadowObj) => updateStyles({ inputBoxShadowFocus: shadowObj })}
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
                                  shadow={attributes.styles.buttonBoxShadow || {}}
                                  onChange={(shadowObj) => updateStyles({ buttonBoxShadow: shadowObj })}
                              />

                              {/* Button Border */}
                              <FluentBorderControl
                                  label={__("Border")}
                                  border={attributes.styles.buttonBorder || {}}
                                  onChange={(borderObj) => updateStyles({ buttonBorder: borderObj })}
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
                                  shadow={attributes.styles.buttonHoverBoxShadow || {}}
                                  onChange={(shadowObj) => updateStyles({ buttonHoverBoxShadow: shadowObj })}
                              />

                              {/* Button Hover Border */}
                              <FluentBorderControl
                                  label={__("Border")}
                                  border={attributes.styles.buttonHoverBorder || {}}
                                  onChange={(borderObj) => updateStyles({ buttonHoverBorder: borderObj })}
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
    'inputBoxShadow',
    'inputBoxShadowFocus',

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
    'buttonBorder',

    // Hover Button attributes
    'buttonHoverColor',
    'buttonHoverBGColor',
    'buttonHoverTypography',
    'buttonHoverPadding',
    'buttonHoverMargin',
    'buttonHoverBoxShadow',
    'buttonHoverBorder'
];

export default memo(TabGeneral, (prevProps, nextProps) => {
    return arePropsEqual(prevProps, nextProps, GENERAL_TAB_ATTRIBUTES, true);
});
