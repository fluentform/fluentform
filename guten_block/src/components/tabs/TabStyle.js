/**
 * Fluent Forms Gutenberg Block Style Tab Component
 */
const { __ } = wp.i18n;
const {
    PanelBody,
    TextControl,
} = wp.components;

// Import custom components
import FluentTypography from '../controls/FluentTypography';
import FluentColorPicker from '../controls/FluentColorPicker';
import FluentSpaceControl from '../controls/FluentSpaceControl';



const TabStyle = ({ attributes, setAttributes }) => {
    return (
        <>
            <PanelBody title={__("Label")} initialOpen={true}>
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
                                size: { lg: newTypo.fontSize },
                                weight: newTypo.fontWeight,
                                lineHeight: newTypo.lineHeight,
                                letterSpacing: newTypo.letterSpacing,
                                textTransform: newTypo.textTransform,
                                family: newTypo.fontFamily
                            }
                        });
                    }}
                />

                <FluentColorPicker
                    label="Color"
                    value={attributes.labelColor}
                    onChange={(value) => setAttributes({ labelColor: value })}
                    defaultColor="#333333"
                />

                <FluentSpaceControl
                    label="Space"
                    values={attributes.labelSpacing}
                    onChange={(value) => setAttributes({ labelSpacing: value })}
                />
            </PanelBody>

            <PanelBody title={__("Input/Textarea/Select")} initialOpen={false}>
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
                                size: { lg: newTypo.fontSize },
                                weight: newTypo.fontWeight,
                                lineHeight: newTypo.lineHeight,
                                letterSpacing: newTypo.letterSpacing,
                                textTransform: newTypo.textTransform,
                                family: newTypo.fontFamily
                            }
                        });
                    }}
                />

                <FluentColorPicker
                    label="Text Color"
                    value={attributes.inputTAColor}
                    onChange={(value) => setAttributes({ inputTAColor: value })}
                    defaultColor="#333333"
                />

                <FluentColorPicker
                    label="Background Color"
                    value={attributes.inputTABGColor}
                    onChange={(value) => setAttributes({ inputTABGColor: value })}
                    defaultColor="#ffffff"
                />

                <FluentColorPicker
                    label="Border Color"
                    value={attributes.inputTABorderColor}
                    onChange={(value) => setAttributes({ inputTABorderColor: value })}
                    defaultColor="#dddddd"
                />

            </PanelBody>

            <PanelBody title={__("Placeholder")} initialOpen={false}>
                <FluentTypography
                    label="Typography"
                    settings={{
                        fontSize: attributes.placeholderTypo?.size?.lg || '',
                        fontWeight: attributes.placeholderTypo?.weight || '400',
                        fontStyle: attributes.placeholderFontStyle || 'normal'
                    }}
                    onChange={(newTypo) => {
                        setAttributes({
                            placeholderTypo: {
                                ...attributes.placeholderTypo,
                                size: { lg: newTypo.fontSize },
                                weight: newTypo.fontWeight
                            },
                            placeholderFontStyle: newTypo.fontStyle
                        });
                    }}
                />

                <FluentColorPicker
                    label="Color"
                    value={attributes.placeholderColor}
                    onChange={(value) => setAttributes({ placeholderColor: value })}
                    defaultColor="#999999"
                />
            </PanelBody>

            <PanelBody title={__("Radio & Checkbox")} initialOpen={false}>
                <FluentColorPicker
                    label="Border Color"
                    value={attributes.radioCheckboxColor}
                    onChange={(value) => setAttributes({ radioCheckboxColor: value })}
                    defaultColor="#dddddd"
                />

                <FluentColorPicker
                    label="Selected/Checked Color"
                    value={attributes.radioCheckboxSelectedColor}
                    onChange={(value) => setAttributes({ radioCheckboxSelectedColor: value })}
                    defaultColor="#4285F4"
                />

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', marginTop: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <label className="ffblock-label">Size (px)</label>
                        <TextControl
                            type="number"
                            value={attributes.radioCheckboxSize || ''}
                            onChange={(value) => setAttributes({ radioCheckboxSize: value })}
                            min={10}
                            max={30}
                        />
                    </div>

                    <div style={{ flex: 1 }}>
                        <label className="ffblock-label">Border Width (px)</label>
                        <TextControl
                            type="number"
                            value={attributes.radioCheckboxBorderWidth || ''}
                            onChange={(value) => setAttributes({ radioCheckboxBorderWidth: value })}
                            min={1}
                            max={5}
                        />
                    </div>
                </div>
            </PanelBody>

            <PanelBody title={__("Submit Button")} initialOpen={false}>
                <FluentTypography
                    label="Typography"
                    settings={{
                        fontSize: attributes.buttonTypo?.size?.lg || '',
                        fontWeight: attributes.buttonTypo?.weight || '400',
                        lineHeight: attributes.buttonTypo?.lineHeight || '',
                        letterSpacing: attributes.buttonTypo?.letterSpacing || '',
                        textTransform: attributes.buttonTypo?.textTransform || 'none',
                        fontFamily: attributes.buttonTypo?.family || ''
                    }}
                    onChange={(newTypo) => {
                        setAttributes({
                            buttonTypo: {
                                ...attributes.buttonTypo,
                                size: { lg: newTypo.fontSize },
                                weight: newTypo.fontWeight,
                                lineHeight: newTypo.lineHeight,
                                letterSpacing: newTypo.letterSpacing,
                                textTransform: newTypo.textTransform,
                                family: newTypo.fontFamily
                            }
                        });
                    }}
                />

                <FluentColorPicker
                    label="Text Color"
                    value={attributes.buttonTextColor}
                    onChange={(value) => setAttributes({ buttonTextColor: value })}
                    defaultColor="#ffffff"
                />

                <FluentColorPicker
                    label="Background Color"
                    value={attributes.buttonBGColor}
                    onChange={(value) => setAttributes({ buttonBGColor: value })}
                    defaultColor="#4285F4"
                />

                <FluentColorPicker
                    label="Hover Background Color"
                    value={attributes.buttonHoverBGColor}
                    onChange={(value) => setAttributes({ buttonHoverBGColor: value })}
                    defaultColor="#0d6efd"
                />

                <FluentColorPicker
                    label="Border Color"
                    value={attributes.buttonBorderColor}
                    onChange={(value) => setAttributes({ buttonBorderColor: value })}
                    defaultColor="#4285F4"
                />

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', marginTop: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <label className="ffblock-label">Border Width (px)</label>
                        <TextControl
                            type="number"
                            value={attributes.buttonBorderWidth || ''}
                            onChange={(value) => setAttributes({ buttonBorderWidth: value })}
                            min={0}
                            max={10}
                        />
                    </div>

                    <div style={{ flex: 1 }}>
                        <label className="ffblock-label">Border Radius (px)</label>
                        <TextControl
                            type="number"
                            value={attributes.buttonBorderRadius || ''}
                            onChange={(value) => setAttributes({ buttonBorderRadius: value })}
                            min={0}
                            max={50}
                        />
                    </div>
                </div>

                <FluentSpaceControl
                    label="Padding"
                    values={attributes.buttonPadding}
                    onChange={(value) => setAttributes({ buttonPadding: value })}
                />
            </PanelBody>
        </>
    );
};

export default TabStyle;
