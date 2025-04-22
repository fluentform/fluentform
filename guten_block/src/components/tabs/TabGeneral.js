import { Component } from "react";

const { useState, useRef, useEffect, memo } = wp.element;
const { __ } = wp.i18n;
const { PanelBody, SelectControl } = wp.components;

// Custom components
import FluentTypography from "../controls/FluentTypography";
import FluentColorPicker from "../controls/FluentColorPicker";
import FluentSpaceControl from "../controls/FluentSpaceControl";
import FluentBorderControl from "../controls/FluentBorderControl";

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
 * Updates typography settings with only changed values to avoid unnecessary rerenders
 * @param {Object} changedTypo - Object containing only the changed typography property
 * @param {Object} currentAttributes - Current attributes object
 * @param {string} typographyKey - Key for the typography attribute to update
 * @returns {Object} The updated typography object or empty object for reset
 */
const getUpdatedTypography = (changedTypo, currentAttributes, typographyKey) => {
    // Check if this is a reset operation
    if (changedTypo.reset) {
        return {};
    }

    // Create a new typography object based on current attributes
    const updatedTypography = {...currentAttributes[typographyKey] || {}};

    // Get the property that changed (there should be only one)
    const changedProperty = Object.keys(changedTypo)[0];
    const newValue = changedTypo[changedProperty];

    // Update only the changed property
    switch (changedProperty) {
        case 'fontSize':
            updatedTypography.size = {lg: newValue};
            break;
        case 'fontWeight':
            updatedTypography.weight = newValue;
            break;
        case 'lineHeight':
            updatedTypography.lineHeight = newValue;
            break;
        case 'letterSpacing':
            updatedTypography.letterSpacing = newValue;
            break;
        case 'textTransform':
            updatedTypography.textTransform = newValue;
            break;
    }
    return updatedTypography;
};

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
    const handleTypographyChange = (changedTypo) => {
        const updatedTypography = getUpdatedTypography(
          changedTypo,
          attributes,
          'labelTypography'
        );

        updateStyles({ labelTypography: updatedTypography });
    };

    return (
      <PanelBody title={__("Label Styles")} initialOpen={true}>
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
            onChange={handleTypographyChange}
          />
      </PanelBody>
    );
};

/**
 * Component for input and textarea styling options
 */
const InputStylesPanel = ({ attributes, updateStyles }) => {
    const handleTypographyChange = (changedTypo) => {
        const updatedTypography = getUpdatedTypography(
          changedTypo,
          attributes,
          'inputTypography'
        );
        updateStyles({
            inputTypography: updatedTypography
        });
    };

    const handleBorderChange = (value) => {

        // Update the new border object
        const styleUpdates = { inputBorder: value };


        // Update all styles at once
        updateStyles(styleUpdates);
    };

    const handleHoverBorderChange = (value) => {
        // Update the hover border object
        const styleUpdates = { inputBorderHover: value };

        // Update all styles at once
        updateStyles(styleUpdates);
    };

    // Default border values
    const defaultBorder = {
        top: { width: 1, style: 'solid', color: attributes.inputTABorderColor || '#dddddd' },
        right: { width: 1, style: 'solid', color: attributes.inputTABorderColor || '#dddddd' },
        bottom: { width: 1, style: 'solid', color: attributes.inputTABorderColor || '#dddddd' },
        left: { width: 1, style: 'solid', color: attributes.inputTABorderColor || '#dddddd' },
        linked: true,
        radius: {
            topLeft: attributes.inputTABorderRadius || 0,
            topRight: attributes.inputTABorderRadius || 0,
            bottomRight: attributes.inputTABorderRadius || 0,
            bottomLeft: attributes.inputTABorderRadius || 0,
            linked: true
        },
        custom_border: false
    };

    // Default spacing values
    const defaultSpacing = {
        top: '',
        right: '',
        bottom: '',
        left: ''
    };

    return (
      <PanelBody title={__("Input & Textarea")} initialOpen={false}>
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
            onChange={handleTypographyChange}
          />

          <FluentSpaceControl
            label="Spacing"
            values={attributes.inputSpacing}
            onChange={(value) => updateStyles({ inputSpacing: value })}
          />

          <FluentBorderControl
            value={attributes.inputBorder || defaultBorder}
            hoverValue={attributes.inputBorderHover || defaultBorder}
            spacingValue={attributes.inputSpacing || defaultSpacing}
            spacingHoverValue={attributes.inputSpacingHover || defaultSpacing}
            onChange={handleBorderChange}
            onHoverChange={handleHoverBorderChange}
            onSpacingChange={(value) => updateStyles({ inputSpacing: value })}
            onSpacingHoverChange={(value) => updateStyles({ inputSpacingHover: value })}
            colors={DEFAULT_COLORS}
            showRadius={true}
            showBorderControls={true}
            showHoverControls={true}
            className="fluent-form-style-control"
          />
      </PanelBody>
    );
};

/**
 * Component for button styling options
 */
const ButtonStylesPanel = ({ attributes, updateStyles }) => {
    return (
      <PanelBody title={__('Button Styles')} initialOpen={false}>
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

          <FluentColorPicker
            label="Hover Text Color"
            value={attributes.buttonHoverColor}
            onChange={(value) => updateStyles({buttonHoverColor: value})}
            defaultColor="#ffffff"
          />

          <FluentColorPicker
            label="Hover Background Color"
            value={attributes.buttonHoverBGColor}
            onChange={(value) => updateStyles({buttonHoverBGColor: value})}
            defaultColor="#66b1ff"
          />
      </PanelBody>
    );
};

/**
 * Component for placeholder styling options
 */
const PlaceHolderStylesPanel = ({ attributes, updateStyles }) => {
    const handleTypographyChange = (changedTypo) => {
        const updatedTypography = getUpdatedTypography(
            changedTypo,
            attributes,
            'placeholderTypography'
        );
        updateStyles({
            placeholderTypography: updatedTypography
        });
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
            onChange={handleTypographyChange}
          />

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

          <ButtonStylesPanel
            attributes={attributes}
            updateStyles={updateStyles}
          />
      </>
    );
};

/**
 * Compare function to determine if component should update
 */
function areEqual(prevProps, nextProps) {
    const { attributes: prevAttrs } = prevProps;
    const { attributes: nextAttrs } = nextProps;

    // List of attributes to check for changes
    const attrsToCheck = [
        'labelColor', 'inputTextColor', 'inputBackgroundColor',
        'buttonColor', 'buttonBGColor', 'buttonHoverColor', 'buttonHoverBGColor',
        'labelTypography', 'inputTypography', 'inputSpacing', 'inputBorder', 'inputBorderHover',
        'placeholderColor', 'placeholderFocusColor', 'placeholderTypography'
    ];

    // Check if any of these attributes have changed
    for (const attr of attrsToCheck) {
        if (JSON.stringify(prevAttrs[attr]) !== JSON.stringify(nextAttrs[attr])) {
            return false; // Props are not equal, should update
        }
    }

    // Check if state props have changed
    if (prevProps.state.customizePreset !== nextProps.state.customizePreset ||
      prevProps.state.selectedPreset !== nextProps.state.selectedPreset) {
        return false;
    }

    return true; // Props are equal, no need to update
}

export default memo(TabGeneral, areEqual);
