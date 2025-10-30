/**
 * Fluent Forms Custom Typography Control Component
 */
const {
    Button,
    Flex,
    Popover,
    FontSizePicker,
    SelectControl
} = wp.components;
const { useState, useEffect } = wp.element;

/**
 * Typography control component for Fluent Forms
 *
 * @param {Object} props Component properties
 * @param {string} props.label Label for the control
 * @param {Object} props.settings Typography settings object
 * @param {Function} props.onChange Callback when settings change
 * @returns {JSX.Element} Typography control component
 */
const FluentTypography = ({ label, settings, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Local state for typography properties
    const [localFontSize, setLocalFontSize] = useState(settings.fontSize || '');
    const [localFontWeight, setLocalFontWeight] = useState(settings.fontWeight || '400');
    const [localLineHeight, setLocalLineHeight] = useState(settings.lineHeight || '');
    const [localLetterSpacing, setLocalLetterSpacing] = useState(settings.letterSpacing || '');
    const [localTextTransform, setLocalTextTransform] = useState(settings.textTransform || 'none');

    // Update local state when settings change
    useEffect(() => {
        setLocalFontSize(settings.fontSize || '');
        setLocalFontWeight(settings.fontWeight || '400');
        setLocalLineHeight(settings.lineHeight || '');
        setLocalLetterSpacing(settings.letterSpacing || '');
        setLocalTextTransform(settings.textTransform || 'none');
    }, [settings]);

    // Default values and options
    const defaultValues = {
        fontSize: '',
        fontWeight: '400',
        lineHeight: '',
        letterSpacing: '',
        textTransform: 'none',
    };

    const fontWeightOptions = [
        { value: '300', label: 'Light (300)' },
        { value: '400', label: 'Regular (400)' },
        { value: '500', label: 'Medium (500)' },
        { value: '600', label: 'Semi Bold (600)' },
        { value: '700', label: 'Bold (700)' },
        { value: '800', label: 'Extra Bold (800)' }
    ];

    const textTransformOptions = [
        { value: 'none', label: 'None' },
        { value: 'capitalize', label: 'Capitalize' },
        { value: 'uppercase', label: 'UPPERCASE' },
        { value: 'lowercase', label: 'lowercase' }
    ];

    // Toggle popover
    const togglePopover = () => setIsOpen(!isOpen);

    /**
     * Update a typography setting
     *
     * @param {string} property Property to update
     * @param {any} value New value
     */
    const updateSetting = (property, value) => {
        // Update local state based on property
        switch (property) {
            case 'fontSize': setLocalFontSize(value); break;
            case 'fontWeight': setLocalFontWeight(value); break;
            case 'lineHeight': setLocalLineHeight(value); break;
            case 'letterSpacing': setLocalLetterSpacing(value); break;
            case 'textTransform': setLocalTextTransform(value); break;
        }

        // Call onChange with only the changed property
        onChange({
            [property]: value
        });
    };



    /**
     * Check if any typography settings have changed from defaults
     *
     * @returns {boolean} True if any setting has changed
     */
    const isFontChanged = () => {
        // Check if any property has a non-default value
        return (
            (localFontSize !== '' && localFontSize != null) ||
            localFontWeight !== defaultValues.fontWeight ||
            (localLineHeight !== '' && localLineHeight != null) ||
            (localLetterSpacing !== '' && localLetterSpacing != null) ||
            localTextTransform !== defaultValues.textTransform
        );
    };

    /**
     * Reset all typography settings to defaults
     */
    const resetToDefault = () => {
        // Create reset values object with a special reset flag
        const resetValues = {
            reset: true,
            ...defaultValues
        };

        // Update local state
        setLocalFontSize(defaultValues.fontSize);
        setLocalFontWeight(defaultValues.fontWeight);
        setLocalLineHeight(defaultValues.lineHeight);
        setLocalLetterSpacing(defaultValues.letterSpacing);
        setLocalTextTransform(defaultValues.textTransform);

        // Close the popover if it's open
        if (isOpen) {
            setIsOpen(false);
        }

        // Call onChange with reset values
        onChange(resetValues);
    };

    return (
      <div className="ffblock-control-field ffblock-control-typography-wrap">
          <Flex align="center" justify="space-between">
              <span className="ffblock-label">{label}</span>
              <div className="ffblock-flex-gap">
                  {isFontChanged() && (
                    <Button
                      icon="image-rotate"
                      isSmall
                      onClick={resetToDefault}
                      label="Reset to default"
                      className="ffblock-reset-button"
                    />
                  )}
                  <Button
                    icon="edit"
                    isSmall
                    onClick={togglePopover}
                    className="fluent-typography-edit-btn"
                  />
              </div>
          </Flex>

          {isOpen && (
            <Popover
              className="fluent-typography-popover"
              onClose={togglePopover}
              position="bottom center"
              key="typo-popover"
            >
                <div className="ffblock-popover-content">
                    <FontSizePicker
                        fontSizes={[
                            { name: 'Small', slug: 'small', size: 12 },
                            { name: 'Medium', slug: 'medium', size: 16 },
                            { name: 'Large', slug: 'large', size: 24 },
                            { name: 'Extra Large', slug: 'x-large', size: 32 }
                        ]}
                        value={localFontSize}
                        onChange={(value) => updateSetting('fontSize', value)}
                        withSlider={true}
                    />

                    <SelectControl
                        label="Font Weight"
                        value={localFontWeight}
                        options={fontWeightOptions}
                        onChange={(value) => updateSetting('fontWeight', value)}
                    />
                </div>
            </Popover>
          )}
      </div>
    );
};

export default FluentTypography;
