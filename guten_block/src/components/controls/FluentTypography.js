const { Button, Flex, Popover, FontSizePicker, SelectControl, RangeControl } = wp.components;
const { useState, useEffect, useMemo, memo } = wp.element;
import { arePropsEqual } from '../utils/ComponentUtils';

const FluentTypography = ({ label, typography = {}, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [typoValues, setTypoValues] = useState({
        fontSize: '',
        fontWeight: '',
        lineHeight: '',
        letterSpacing: '',
        textTransform: ''
    });

    useEffect(() => {
        setTypoValues({
            fontSize: typography?.fontSize || '',
            fontWeight: typography?.fontWeight || '',
            lineHeight: typography?.lineHeight || '',
            letterSpacing: typography?.letterSpacing || '',
            textTransform: typography?.textTransform || ''
        });
    }, [typography]);

    const fontWeightOptions = [
        { value: '', label: 'Select' },
        { value: '300', label: 'Light (300)' },
        { value: '400', label: 'Regular (400)' },
        { value: '500', label: 'Medium (500)' },
        { value: '600', label: 'Semi Bold (600)' },
        { value: '700', label: 'Bold (700)' },
        { value: '800', label: 'Extra Bold (800)' }
    ];

    const textTransformOptions = [
        { value: '', label: 'Select' },
        { value: 'none', label: 'None' },
        { value: 'capitalize', label: 'Capitalize' },
        { value: 'uppercase', label: 'UPPERCASE' },
        { value: 'lowercase', label: 'lowercase' }
    ];

    const togglePopover = () => setIsOpen(!isOpen);

    const updateSetting = (updatedProperties) => {
        const updatedTypography = { 
            ...typography,
            ...updatedProperties
        };

        onChange(updatedTypography);
    };

    const isFontChanged = useMemo(() => {
        return (
            (typoValues.fontSize !== '' && typoValues.fontSize != null) ||
            (typoValues.fontWeight !== '' && typoValues.fontWeight != null) ||
            (typoValues.lineHeight !== '' && typoValues.lineHeight != null) ||
            (typoValues.letterSpacing !== '' && typoValues.letterSpacing != null) ||
            (typoValues.textTransform !== '' && typoValues.textTransform != null)
        );
    }, [typoValues]);

    const resetToDefault = () => {
        onChange({});
        if (isOpen) {
            setIsOpen(false);
        }
    };

    return (
      <div className="ffblock-control-field ffblock-control-typography-wrap">
          <Flex align="center" justify="space-between">
              <span className="ffblock-label">{label}</span>
              <div className="ffblock-flex-gap">
                  {isFontChanged && (
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
                        value={typoValues.fontSize}
                        onChange={(value) =>   updateSetting({fontSize: value})}
                        withSlider={true}
                    />
                    <SelectControl
                        label="Font Weight"
                        value={typoValues.fontWeight}
                        options={fontWeightOptions}
                        onChange={(value) => updateSetting({fontWeight: value})}
                    />
                    <RangeControl
                        label="Line Height"
                        value={typoValues.lineHeight}
                        onChange={(value) => updateSetting({lineHeight: value})}
                        min={0.5}
                        max={3}
                        step={0.1}
                    />
                    <RangeControl
                        label="Letter Spacing (px)"
                        value={typoValues.letterSpacing}
                        onChange={(value) => updateSetting({letterSpacing: value})}
                        min={-5}
                        max={10}
                        step={0.1}
                    />
                    <SelectControl
                        label="Text Transform"
                        value={typoValues.textTransform}
                        options={textTransformOptions}
                        onChange={(value) => updateSetting({textTransform: value})}
                    />
                </div>
            </Popover>
          )}
      </div>
    );
};

export default memo(FluentTypography, (prevProps, nextProps) => {
    return arePropsEqual(prevProps, nextProps, ['label', 'typography']);
});