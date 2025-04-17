/**
 * Fluent Forms Custom Color Picker Component
 */
const {
    Button,
    Flex,
    Popover
} = wp.components;
const { useState, useRef, useEffect } = wp.element;

// Custom Color Picker Component with direct ColorPicker and conditional reset button
const FluentColorPicker = ({ label, value, onChange, defaultColor = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const buttonRef = useRef(null);
    const popoverRef = useRef(null);

    // Check if current value is different from default
    const isColorChanged = value !== defaultColor && value !== undefined && value !== null;

    const toggleColorPicker = (e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const resetToDefault = () => {
        onChange(defaultColor);
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Reset button */}
                    {isColorChanged && (
                        <Button
                            icon="image-rotate"
                            isSmall
                            onClick={resetToDefault}
                            label="Reset to default"
                            className="ffblock-color-reset-button"
                            style={{ padding: '2px' }}
                        />
                    )}
                    <div
                        className="ffblock-color-button"
                        onClick={toggleColorPicker}
                        ref={buttonRef}
                    >
                        <div
                            style={{
                                backgroundColor: value || 'transparent',
                                backgroundImage: !value || value === 'transparent' || value.includes('rgba') ?
                                    'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGElEQVQYlWNgYGCQwoKxgqGgcJA5h3yFAAs8BRWVSwooAAAAAElFTkSuQmCC")' :
                                    'none',
                                backgroundPosition: '0 0',
                                backgroundSize: '10px 10px',
                                backgroundRepeat: 'repeat',
                                width: '24px',
                                height: '24px',
                                borderRadius: '2px',
                                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.2)',
                                cursor: 'pointer'
                            }}
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
                    >
                        <div
                            style={{ padding: '12px' }}
                            ref={popoverRef}
                        >
                            {/* wp.components.ColorPicker instead of ColorPalette */}
                            <wp.components.ColorPicker
                                color={value}
                                onChangeComplete={(color) => {
                                    onChange(color.hex);
                                }}
                                disableAlpha={false}
                            />
                        </div>
                    </Popover>
                </div>
            )}
        </div>
    );
};

export default FluentColorPicker;
