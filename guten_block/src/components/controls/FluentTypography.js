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
const { useState, useEffect, useRef } = wp.element;

// Custom Typography Control Component
const FluentTypography = ({ label, settings, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Create local state for each typography property
    const [localFontSize, setLocalFontSize] = useState(settings.fontSize || '');
    const [localFontWeight, setLocalFontWeight] = useState(settings.fontWeight || '400');
    const [localLineHeight, setLocalLineHeight] = useState(settings.lineHeight || '');
    const [localLetterSpacing, setLocalLetterSpacing] = useState(settings.letterSpacing || '');
    const [localTextTransform, setLocalTextTransform] = useState(settings.textTransform || 'none');

    // Update local state when settings change
    useEffect(() => {
        console.log('Settings changed:', settings);
        setLocalFontSize(settings.fontSize || '');
        setLocalFontWeight(settings.fontWeight || '400');
        setLocalLineHeight(settings.lineHeight || '');
        setLocalLetterSpacing(settings.letterSpacing || '');
        setLocalTextTransform(settings.textTransform || 'none');
    }, [settings]);

    // Define default values in one place
    const defaultValues = {
        fontSize: '',
        fontWeight: '400',
        lineHeight: '',
        letterSpacing: '',
        textTransform: 'none',
    };

    // Use defaults for any missing properties
    const {
        fontSize = defaultValues.fontSize,
        fontWeight = defaultValues.fontWeight,
        lineHeight = defaultValues.lineHeight,
        letterSpacing = defaultValues.letterSpacing,
        textTransform = defaultValues.textTransform,
    } = settings || {};
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

    // Toggle popover
    const togglePopover = () => setIsOpen(!isOpen);

    const updateSetting = (property, value) => {
        // Update local state based on property
        switch (property) {
            case 'fontSize':
                setLocalFontSize(value);
                break;
            case 'fontWeight':
                setLocalFontWeight(value);
                break;
            case 'lineHeight':
                setLocalLineHeight(value);
                break;
            case 'letterSpacing':
                setLocalLetterSpacing(value);
                break;
            case 'textTransform':
                setLocalTextTransform(value);
                break;
        }

        // Call onChange with updated values
        onChange({
            ...settings,
            [property]: value
        });
    };

    const [forceUpdateKey, setForceUpdateKey] = useState(0);

    useEffect(() => {
        setForceUpdateKey(prev => prev + 1);
    }, [settings]);


    // Improved isFontChanged function that compares current values with default values
    const isFontChanged = () => {
        // Helper function to normalize values for comparison
        const normalizeValue = (value) => {
            if (value === undefined || value === null) return '';
            return String(value).trim();
        };

        // Check if fontSize is set and different from default
        const hasFontSizeChanged = localFontSize !== '' && localFontSize !== undefined && localFontSize !== null;

        // Check if other properties have changed
        const hasFontWeightChanged = normalizeValue(localFontWeight) !== normalizeValue(defaultValues.fontWeight);
        const hasLineHeightChanged = localLineHeight !== '' && localLineHeight !== undefined && localLineHeight !== null;
        const hasLetterSpacingChanged = localLetterSpacing !== '' && localLetterSpacing !== undefined && localLetterSpacing !== null;
        const hasTextTransformChanged = normalizeValue(localTextTransform) !== normalizeValue(defaultValues.textTransform);

        // Return true if any property has changed
        return hasFontSizeChanged || hasFontWeightChanged || hasLineHeightChanged ||
               hasLetterSpacingChanged || hasTextTransformChanged;
    };

    // Reset all typography settings to defaults
    const resetToDefault = () => {
        // Log the reset action for debugging
        console.log('Resetting typography to defaults');

        // Create a new object with default values
        const resetValues = {
            fontSize: '',
            fontWeight: '400',
            lineHeight: '',
            letterSpacing: '',
            textTransform: 'none'
        };

        // Update local state
        setLocalFontSize('');
        setLocalFontWeight('400');
        setLocalLineHeight('');
        setLocalLetterSpacing('');
        setLocalTextTransform('none');

        // Close the popover if it's open
        if (isOpen) {
            setIsOpen(false);
        }

        // Call onChange with reset values
        onChange(resetValues);
    };

    // Preview style
    const previewStyle = {
        fontSize: localFontSize ? `${localFontSize}px` : 'inherit',
        fontWeight: localFontWeight,
        lineHeight: localLineHeight || 'normal',
        letterSpacing: localLetterSpacing ? `${localLetterSpacing}px` : 'normal',
        textTransform: localTextTransform
    };

    return (
      <div className="ffblock-control-field ffblock-control-typography-wrap">
          <Flex align="center" justify="space-between">
              <span className="ffblock-label">{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isFontChanged() && (
                    <Button
                      icon="image-rotate"
                      isSmall
                      onClick={resetToDefault}
                      label="Reset to default"
                      className="ffblock-color-reset-button"
                      style={{ padding: '2px' }}
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

          {/* Typography preview */}
          <div className="fluent-typography-preview" style={previewStyle}>
              {localFontSize ? `${localFontSize}px` : '16px'} / {localFontWeight}
          </div>

          {isOpen && (
            <Popover
              className="fluent-typography-popover"
              onClose={togglePopover}
              position="bottom center"
              key="typo-popover"
            >
                <div style={{ width: '270px', padding: '15px' }}>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Font Size (px)</label>
                        <RangeControl
                          value={localFontSize ? parseInt(localFontSize) : undefined}
                          min={8}
                          max={72}
                          onChange={(value) => {
                              console.log('Font size changed:', value);
                              updateSetting('fontSize', value);
                          }}
                        />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Font Weight</label>
                        <SelectControl
                          value={localFontWeight}
                          options={fontWeightOptions}
                          onChange={(value) => updateSetting('fontWeight', value)}
                        />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Line Height</label>
                        <RangeControl
                          value={localLineHeight ? parseFloat(localLineHeight) : undefined}
                          min={0.1}
                          max={3}
                          step={0.1}
                          onChange={(value) => updateSetting('lineHeight', value)}
                        />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Letter Spacing (px)</label>
                        <RangeControl
                          value={localLetterSpacing ? parseFloat(localLetterSpacing) : undefined}
                          min={-5}
                          max={10}
                          step={0.1}
                          onChange={(value) => updateSetting('letterSpacing', value)}
                        />
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>Text Transform</label>
                        <SelectControl
                          value={localTextTransform}
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
