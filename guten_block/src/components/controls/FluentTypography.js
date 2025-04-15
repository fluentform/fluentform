/**
 * Fluent Forms Custom Typography Control Component
 */
const {
    Button,
    Flex,
    Popover,
    SelectControl,
    RangeControl
} = wp.components;
const { useState } = wp.element;

// Custom Typography Control Component
const FluentTypography = ({ label, settings, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Default values
    const {
        fontSize = '',
        fontWeight = '400',
        lineHeight = '',
        letterSpacing = '',
        textTransform = 'none',
        fontFamily = ''
    } = settings || {};

    // Font options
    const fontOptions = [
        { value: '', label: 'Default', key: 'default-font' },
        { value: 'Arial, sans-serif', label: 'Arial', key: 'arial-font' },
        { value: 'Helvetica, sans-serif', label: 'Helvetica', key: 'helvetica-font' },
        { value: 'Georgia, serif', label: 'Georgia', key: 'georgia-font' },
        { value: '"Times New Roman", serif', label: 'Times New Roman', key: 'times-font' },
        { value: 'Verdana, sans-serif', label: 'Verdana', key: 'verdana-font' }
    ];

    const fontWeightOptions = [
        { value: '300', label: 'Light (300)', key: 'light-weight' },
        { value: '400', label: 'Regular (400)', key: 'regular-weight' },
        { value: '500', label: 'Medium (500)', key: 'medium-weight' },
        { value: '600', label: 'Semi Bold (600)', key: 'semibold-weight' },
        { value: '700', label: 'Bold (700)', key: 'bold-weight' },
        { value: '800', label: 'Extra Bold (800)', key: 'extrabold-weight' }
    ];

    const textTransformOptions = [
        { value: 'none', label: 'None', key: 'none-transform' },
        { value: 'capitalize', label: 'Capitalize', key: 'capitalize-transform' },
        { value: 'uppercase', label: 'UPPERCASE', key: 'uppercase-transform' },
        { value: 'lowercase', label: 'lowercase', key: 'lowercase-transform' }
    ];

    const togglePopover = () => setIsOpen(!isOpen);

    const updateSetting = (property, value) => {
        onChange({
            ...settings,
            [property]: value
        });
    };

    // Preview style
    const previewStyle = {
        fontFamily: fontFamily || 'inherit',
        fontSize: fontSize ? `${fontSize}px` : 'inherit',
        fontWeight,
        lineHeight: lineHeight || 'normal',
        letterSpacing: letterSpacing ? `${letterSpacing}px` : 'normal',
        textTransform
    };

    return (
        <div className="ffblock-control-field ffblock-control-typography-wrap">
            <Flex align="center" justify="space-between">
                <span className="ffblock-label">{label}</span>
                <Button
                    icon="edit"
                    isSmall
                    onClick={togglePopover}
                    className="fluent-typography-edit-btn"
                />
            </Flex>

            {/* Typography preview */}
            <div className="fluent-typography-preview" style={previewStyle}>
                {fontSize ? `${fontSize}px` : '16px'} / {fontWeight} / {fontFamily || 'Default'}
            </div>

            {isOpen && (
                <Popover
                    className="fluent-typography-popover"
                    onClose={togglePopover}
                    position="bottom center"
                >
                    <div style={{ width: '300px', padding: '16px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Typography Settings</h3>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px' }}>Font Family</label>
                            <SelectControl
                                value={fontFamily}
                                options={fontOptions}
                                onChange={(value) => updateSetting('fontFamily', value)}
                            />
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px' }}>Font Size (px)</label>
                            <RangeControl
                                value={fontSize ? parseInt(fontSize) : ''}
                                min={8}
                                max={72}
                                onChange={(value) => updateSetting('fontSize', value)}
                            />
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px' }}>Font Weight</label>
                            <SelectControl
                                value={fontWeight}
                                options={fontWeightOptions}
                                onChange={(value) => updateSetting('fontWeight', value)}
                            />
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px' }}>Line Height</label>
                            <RangeControl
                                value={lineHeight ? parseFloat(lineHeight) : ''}
                                min={0.1}
                                max={3}
                                step={0.1}
                                onChange={(value) => updateSetting('lineHeight', value)}
                            />
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px' }}>Letter Spacing (px)</label>
                            <RangeControl
                                value={letterSpacing ? parseFloat(letterSpacing) : 0}
                                min={-5}
                                max={10}
                                step={0.1}
                                onChange={(value) => updateSetting('letterSpacing', value)}
                            />
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', marginBottom: '4px' }}>Text Transform</label>
                            <SelectControl
                                value={textTransform}
                                options={textTransformOptions}
                                onChange={(value) => updateSetting('textTransform', value)}
                            />
                        </div>
                    </div>
                </Popover>
            )}
        </div>
    );
};

export default FluentTypography;
