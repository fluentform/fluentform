/**
 * Fluent Forms Custom Color Picker Component
 */
const {
    Button,
    Flex,
    Popover,
    ColorPicker
} = wp.components;
const { useState, useRef, useEffect } = wp.element;

// Custom Color Picker Component with direct ColorPicker and conditional reset button
const FluentColorPicker = ({ label, value, onChange, defaultColor = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentColor, setCurrentColor] = useState(value || '');
    const containerRef = useRef(null);
    const buttonRef = useRef(null);
    const popoverRef = useRef(null);

    // Update currentColor when value changes from outside
    useEffect(() => {
        setCurrentColor(value || '');
    }, [value]);

    // Check if current value is different from default
    const isColorChanged = currentColor !== defaultColor && currentColor !== undefined && currentColor !== null;

    const toggleColorPicker = (e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const resetToDefault = () => {
        setCurrentColor(defaultColor);
        onChange(defaultColor);
    };

    // Determine if we should show the transparent pattern
    const isTransparent = !currentColor ||
                         currentColor === 'transparent' ||
                         (typeof currentColor === 'string' && currentColor.includes('rgba') &&
                          (currentColor.endsWith(',0)') || currentColor.endsWith(', 0)')));

    // Prepare the style for the color swatch
    const swatchStyle = {
        backgroundColor: currentColor || 'transparent'
    };

    // Handle clicks outside to close the color picker
    useEffect(() => {
        if (!isOpen) return;

        const handleOutsideClick = (event) => {
            // Check if the click is outside both the button and popover content
            if (
                buttonRef.current &&
                !buttonRef.current.contains(event.target) &&
                popoverRef.current &&
                !popoverRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isOpen]);

    return (
        <div className="ffblock-control-field ffblock-control-color-wrap" ref={containerRef}>
            <Flex align="center" justify="space-between">
                <span className="ffblock-label">{label}</span>
                <div className="ffblock-flex-gap">
                    {/* Reset button */}
                    {isColorChanged && (
                        <Button
                            icon="image-rotate"
                            isSmall
                            onClick={resetToDefault}
                            label="Reset to default"
                            className="ffblock-reset-button"
                        />
                    )}
                    <div
                        className="ffblock-color-button"
                        onClick={toggleColorPicker}
                        ref={buttonRef}
                    >
                        <div
                            className={`ffblock-color-swatch ${isTransparent ? 'ffblock-color-transparent-pattern' : ''}`}
                            style={swatchStyle}
                            title={currentColor || 'transparent'}
                        />
                    </div>
                </div>
            </Flex>

            {isOpen && (
                <div className="ffblock-color-popover-wrapper" style={{ position: "relative" }}>
                    <Popover
                        onClose={() => {}}  // Remove auto-close functionality
                        anchor={buttonRef.current}
                        focusOnMount={false}
                        noArrow={true}
                        position="bottom right"
                        expandOnMobile={true}
                        className="ffblock-color-popover"
                        onFocusOutside={(e) => {
                            e.close();
                        }}
                    >
                        <div
                            className="ffblock-popover-content"
                            ref={popoverRef}
                        >
                            {/* Close button */}
                            <div className="ffblock-color-picker-header">
                                <span>Select Color</span>
                                <Button
                                    className="ffblock-color-picker-close"
                                    onClick={() => setIsOpen(false)}
                                    icon="no-alt"
                                    isSmall
                                    label="Close"
                                />
                            </div>

                            <ColorPicker
                                color={currentColor}
                                onChange={(color) => {
                                    setCurrentColor(color);
                                    onChange(color);
                                }}
                                enableAlpha={true}
                            />
                        </div>
                    </Popover>
                </div>
            )}
        </div>
    );
};

export default FluentColorPicker;
