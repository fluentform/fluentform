import FluentTypography from "../controls/FluentTypography";
import FluentColorPicker from "../controls/FluentColorPicker";
import FluentSpaceControl from "../controls/FluentSpaceControl";
import MyBorderBoxControl from "../controls/MyBorderBoxControl";
const { useState, useRef, useEffect, memo } = wp.element;
/**
 * Fluent Forms Gutenberg Block General Tab Component
 */
const {__} = wp.i18n;
const {
    PanelBody,
    SelectControl,
    ToggleControl,
    TextControl,
    BorderControl
} = wp.components;


// Use memo to prevent unnecessary re-renders
const TabGeneral = memo(({attributes, setAttributes, updateStyles, state, handlePresetChange, toggleCustomizePreset}) => {
    const {customizePreset} = state;
    const config = window.fluentform_block_vars;
    const presets = config.style_presets;
    return (
        <>
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

                    onChange={(newTypo) => {
                        // Determine which property was changed by comparing with previous values
                        const prevTypo = {
                            fontSize: attributes.labelTypography?.size?.lg || '',
                            fontWeight: attributes.labelTypography?.weight || '400',
                            lineHeight: attributes.labelTypography?.lineHeight || '',
                            letterSpacing: attributes.labelTypography?.letterSpacing || '',
                            textTransform: attributes.labelTypography?.textTransform || 'none'
                        };

                        // Check if this is a reset operation
                        const isReset = !newTypo.fontSize && newTypo.fontWeight === '400' &&
                                      !newTypo.lineHeight && !newTypo.letterSpacing &&
                                      newTypo.textTransform === 'none';

                        if (isReset) {
                            // For reset, create an empty object
                            updateStyles({
                                labelTypography: {}
                            });
                            return;
                        }

                        // Create a new typography object with only the changed properties
                        const updatedTypography = {...attributes.labelTypography};

                        // Only update properties that have changed
                        if (newTypo.fontSize !== prevTypo.fontSize) {
                            updatedTypography.size = {lg: newTypo.fontSize};
                        }

                        if (newTypo.fontWeight !== prevTypo.fontWeight) {
                            updatedTypography.weight = newTypo.fontWeight;
                        }

                        if (newTypo.lineHeight !== prevTypo.lineHeight) {
                            updatedTypography.lineHeight = newTypo.lineHeight;
                        }

                        if (newTypo.letterSpacing !== prevTypo.letterSpacing) {
                            updatedTypography.letterSpacing = newTypo.letterSpacing;
                        }

                        if (newTypo.textTransform !== prevTypo.textTransform) {
                            updatedTypography.textTransform = newTypo.textTransform;
                        }

                        // Update styles with the new typography object
                        updateStyles({
                            labelTypography: updatedTypography
                        });
                    }}
                />

            </PanelBody>
            <PanelBody title={__("Input & Textarea")} initialOpen={false}>


                <FluentColorPicker
                    label="Text Color"
                    value={attributes.inputTAColor}
                    onChange={(value) => updateStyles({inputTAColor: value})}
                    defaultColor="#333333"
                />

                <FluentColorPicker
                    label="Background Color"
                    value={attributes.inputTABGColor}
                    onChange={(value) => updateStyles({inputTABGColor: value})}
                    defaultColor="#ffffff"
                />
                <FluentTypography
                    label="Typography"
                    settings={{
                        fontSize: attributes.inputTATypo?.size?.lg || '',
                        fontWeight: attributes.inputTATypo?.weight || '400',
                        lineHeight: attributes.inputTATypo?.lineHeight || '',
                        letterSpacing: attributes.inputTATypo?.letterSpacing || '',
                        textTransform: attributes.inputTATypo?.textTransform || 'none'
                    }}

                    onChange={(newTypo) => {
                        // Determine which property was changed by comparing with previous values
                        const prevTypo = {
                            fontSize: attributes.inputTATypo?.size?.lg || '',
                            fontWeight: attributes.inputTATypo?.weight || '400',
                            lineHeight: attributes.inputTATypo?.lineHeight || '',
                            letterSpacing: attributes.inputTATypo?.letterSpacing || '',
                            textTransform: attributes.inputTATypo?.textTransform || 'none'
                        };

                        // Check if this is a reset operation
                        const isReset = !newTypo.fontSize && newTypo.fontWeight === '400' &&
                                      !newTypo.lineHeight && !newTypo.letterSpacing &&
                                      newTypo.textTransform === 'none';

                        if (isReset) {
                            // For reset, create an empty object
                            updateStyles({
                                inputTATypo: {}
                            });
                            return;
                        }

                        // Create a new typography object with only the changed properties
                        const updatedTypography = {...attributes.inputTATypo};

                        // Only update properties that have changed
                        if (newTypo.fontSize !== prevTypo.fontSize) {
                            updatedTypography.size = {lg: newTypo.fontSize};
                        }

                        if (newTypo.fontWeight !== prevTypo.fontWeight) {
                            updatedTypography.weight = newTypo.fontWeight;
                        }

                        if (newTypo.lineHeight !== prevTypo.lineHeight) {
                            updatedTypography.lineHeight = newTypo.lineHeight;
                        }

                        if (newTypo.letterSpacing !== prevTypo.letterSpacing) {
                            updatedTypography.letterSpacing = newTypo.letterSpacing;
                        }

                        if (newTypo.textTransform !== prevTypo.textTransform) {
                            updatedTypography.textTransform = newTypo.textTransform;
                        }

                        // Update styles with the new typography object
                        updateStyles({
                            inputTATypo: updatedTypography
                        });
                    }}
                />

                <FluentSpaceControl
                    label="Spacing"
                    values={attributes.inputSpacing}
                    onChange={(value) => updateStyles({ inputSpacing: value })}
                />

                <MyBorderBoxControl
                    label="Style Settings"
                    value={attributes.inputBorder || {
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
                        }
                    }}
                    hoverValue={attributes.inputBorderHover || {
                        top: { width: 1, style: 'solid', color: attributes.inputTABorderColorHover || '#72aee6' },
                        right: { width: 1, style: 'solid', color: attributes.inputTABorderColorHover || '#72aee6' },
                        bottom: { width: 1, style: 'solid', color: attributes.inputTABorderColorHover || '#72aee6' },
                        left: { width: 1, style: 'solid', color: attributes.inputTABorderColorHover || '#72aee6' },
                        linked: true,
                        radius: {
                            topLeft: attributes.inputTABorderRadiusHover || 0,
                            topRight: attributes.inputTABorderRadiusHover || 0,
                            bottomRight: attributes.inputTABorderRadiusHover || 0,
                            bottomLeft: attributes.inputTABorderRadiusHover || 0,
                            linked: true
                        }
                    }}
                    spacingValue={attributes.inputSpacing || {
                        top: '10px',
                        right: '10px',
                        bottom: '10px',
                        left: '10px'
                    }}
                    spacingHoverValue={attributes.inputSpacingHover || {
                        top: '10px',
                        right: '10px',
                        bottom: '10px',
                        left: '10px'
                    }}
                    onChange={(value) => {
                        // Update the new border object
                        const styleUpdates = { inputBorder: value };

                        // For backward compatibility, also update the old attributes
                        // Only update if the properties exist to avoid errors
                        if (value?.top?.width) {
                            styleUpdates.inputTABorderWidth = value.top.width;
                        }

                        if (value?.radius?.topLeft !== undefined) {
                            styleUpdates.inputTABorderRadius = value.radius.topLeft;
                        }

                        if (value?.top?.color) {
                            styleUpdates.inputTABorderColor = value.top.color;
                        }

                        // Update all styles at once
                        updateStyles(styleUpdates);
                    }}
                    onHoverChange={(value) => {
                        // Update the hover border object
                        const styleUpdates = { inputBorderHover: value };

                        // For backward compatibility, also update the old hover attributes
                        if (value?.top?.width) {
                            styleUpdates.inputTABorderWidthHover = value.top.width;
                        }

                        if (value?.radius?.topLeft !== undefined) {
                            styleUpdates.inputTABorderRadiusHover = value.radius.topLeft;
                        }

                        if (value?.top?.color) {
                            styleUpdates.inputTABorderColorHover = value.top.color;
                        }

                        // Update all styles at once
                        updateStyles(styleUpdates);
                    }}
                    onSpacingChange={(value) => {
                        updateStyles({ inputSpacing: value });
                    }}
                    onSpacingHoverChange={(value) => {
                        updateStyles({ inputSpacingHover: value });
                    }}
                    colors={[
                        { name: 'Theme Blue', color: '#72aee6' },
                        { name: 'Theme Red', color: '#e65054' },
                        { name: 'Theme Green', color: '#68de7c' },
                        { name: 'Black', color: '#000000' },
                        { name: 'White', color: '#ffffff' },
                        { name: 'Gray', color: '#dddddd' }
                    ]}
                    showRadius={true}
                    showBorderControls={true}
                    showSpacingControls={true}
                    showHoverControls={true}
                    className="fluent-form-style-control"
                />

            </PanelBody>

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

        </>
    );
});

// Use areEqual function to determine if component should update
function areEqual(prevProps, nextProps) {
    // Only re-render if specific props have changed
    const { attributes: prevAttrs } = prevProps;
    const { attributes: nextAttrs } = nextProps;

    // List of attributes to check for changes
    const attrsToCheck = [
        'labelColor', 'inputTAColor', 'inputTABGColor',
        'buttonColor', 'buttonBGColor', 'buttonHoverColor', 'buttonHoverBGColor',
        'labelTypography', 'inputTATypo', 'inputSpacing', 'inputBorder', 'inputBorderHover'
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
