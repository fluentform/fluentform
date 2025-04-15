import FluentTypography from "../controls/FluentTypography";
import FluentColorPicker from "../controls/FluentColorPicker";
import FluentSpaceControl from "../controls/FluentSpaceControl";
import MyBorderBoxControl from "../controls/MyBorderBoxControl";
const { useState, useRef, useEffect } = wp.element;
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


const TabGeneral = ({attributes, setAttributes, state, handlePresetChange, toggleCustomizePreset}) => {
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
                        // Update the selected preset in the parent component
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
                    onChange={(value) => setAttributes({labelColor: value})}
                    defaultColor=""
                />
                <FluentTypography
                    label="Typography"
                    settings={{
                        fontSize: attributes.labelTypo?.size?.lg || '',
                        fontWeight: attributes.labelTypo?.weight || '400',
                        lineHeight: attributes.labelTypo?.lineHeight || '',
                        letterSpacing: attributes.labelTypo?.letterSpacing || '',
                        textTransform: attributes.labelTypo?.textTransform || 'none',
                        fontFamily: attributes.labelTypo?.family || ''
                    }}
                    onChange={(newTypo) => {
                        setAttributes({
                            labelTypo: {
                                ...attributes.labelTypo,
                                size: {lg: newTypo.fontSize},
                                weight: newTypo.fontWeight,
                                lineHeight: newTypo.lineHeight,
                                letterSpacing: newTypo.letterSpacing,
                                textTransform: newTypo.textTransform,
                                family: newTypo.fontFamily
                            }
                        });
                    }}
                />

            </PanelBody>
            <PanelBody title={__("Input & Textarea")} initialOpen={false}>


                <FluentColorPicker
                    label="Text Color"
                    value={attributes.inputTAColor}
                    onChange={(value) => setAttributes({inputTAColor: value})}
                    defaultColor="#333333"
                />

                <FluentColorPicker
                    label="Background Color"
                    value={attributes.inputTABGColor}
                    onChange={(value) => setAttributes({inputTABGColor: value})}
                    defaultColor="#ffffff"
                />
                <FluentTypography
                    label="Typography"
                    settings={{
                        fontSize: attributes.inputTATypo?.size?.lg || '',
                        fontWeight: attributes.inputTATypo?.weight || '400',
                        lineHeight: attributes.inputTATypo?.lineHeight || '',
                        letterSpacing: attributes.inputTATypo?.letterSpacing || '',
                        textTransform: attributes.inputTATypo?.textTransform || 'none',
                        fontFamily: attributes.inputTATypo?.family || ''
                    }}
                    onChange={(newTypo) => {
                        setAttributes({
                            inputTATypo: {
                                ...attributes.inputTATypo,
                                size: {lg: newTypo.fontSize},
                                weight: newTypo.fontWeight,
                                lineHeight: newTypo.lineHeight,
                                letterSpacing: newTypo.letterSpacing,
                                textTransform: newTypo.textTransform,
                                family: newTypo.fontFamily
                            }
                        });
                    }}
                />

                <FluentSpaceControl
                    label="Spacing"
                    values={attributes.inputSpacing}
                    onChange={(value) => setAttributes({ inputSpacing: value })}
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
                        setAttributes({ inputBorder: value });

                        // For backward compatibility, also update the old attributes
                        // Only update if the properties exist to avoid errors
                        const backwardCompatProps = {};

                        if (value?.top?.width) {
                            backwardCompatProps.inputTABorderWidth = value.top.width;
                        }

                        if (value?.radius?.topLeft !== undefined) {
                            backwardCompatProps.inputTABorderRadius = value.radius.topLeft;
                        }

                        if (value?.top?.color) {
                            backwardCompatProps.inputTABorderColor = value.top.color;
                        }

                        if (Object.keys(backwardCompatProps).length > 0) {
                            setAttributes(backwardCompatProps);
                        }
                    }}
                    onHoverChange={(value) => {
                        // Update the hover border object
                        setAttributes({ inputBorderHover: value });

                        // For backward compatibility, also update the old hover attributes
                        const backwardCompatProps = {};

                        if (value?.top?.width) {
                            backwardCompatProps.inputTABorderWidthHover = value.top.width;
                        }

                        if (value?.radius?.topLeft !== undefined) {
                            backwardCompatProps.inputTABorderRadiusHover = value.radius.topLeft;
                        }

                        if (value?.top?.color) {
                            backwardCompatProps.inputTABorderColorHover = value.top.color;
                        }

                        if (Object.keys(backwardCompatProps).length > 0) {
                            setAttributes(backwardCompatProps);
                        }
                    }}
                    onSpacingChange={(value) => {
                        setAttributes({ inputSpacing: value });
                    }}
                    onSpacingHoverChange={(value) => {
                        setAttributes({ inputSpacingHover: value });
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

        </>
    );
};

export default TabGeneral;
