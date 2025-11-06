const { Button, Flex, Popover, ColorPalette } = wp.components;
const { useState, useRef, useEffect, memo } = wp.element;
import { arePropsEqual } from "../utils/ComponentUtils";

const FluentColorPicker = ({ label, value, onChange, defaultColor = ''}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentColor, setCurrentColor] = useState(value || defaultColor);
    const [isTransparent, setIsTransparent] = useState(false);
    const [isColorChanged, setIsColorChanged] = useState(false);
    const containerRef = useRef(null);
    const buttonRef = useRef(null);
    const popoverRef = useRef(null);

    useEffect(() => {
        setCurrentColor(value || '');
    }, [value]);

    useEffect(() => {
        setIsColorChanged(currentColor !== defaultColor && currentColor !== undefined && currentColor !== null);
    }, [currentColor, defaultColor]);

    const toggleColorPicker = (e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    const resetToDefault = () => {
        setCurrentColor(defaultColor);
        onChange(defaultColor);
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleOutsideClick = (event) => {
            if (event.target.closest('.components-color-picker, .components-color-palette')) {
                return;
            }

            if (
                buttonRef.current &&
                !buttonRef.current.contains(event.target) &&
                popoverRef.current &&
                !popoverRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick, true);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick, true);
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
                            style={ { backgroundColor: currentColor || "transparent" }}
                            title={currentColor || 'transparent'}
                        />
                    </div>
                </div>
            </Flex>

            {isOpen && (
                <Popover
                    onClose={() => {}}
                    anchor={buttonRef.current}
                    focusOnMount={false}
                    noArrow={false}
                    position="middle right"
                    expandOnMobile={true}
                    className="ffblock-color-popover"
                    offset={16}
                    flip={true}
                    resize={true}
                    __unstableSlotName="ffblock-popover-content"
                >
                    <div className="ffblock-popover-content" ref={popoverRef}>
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

                        <ColorPalette
                            colors={[
                                { name: 'Theme Blue', color: '#72aee6' },
                                { name: 'Theme Red', color: '#e65054' },
                                { name: 'Theme Green', color: '#68de7c' },
                                { name: 'Black', color: '#000000' },
                                { name: 'White', color: '#ffffff' },
                                { name: 'Gray', color: '#dddddd' }
                            ]}
                            value={currentColor}
                            onChange={(color) => {
                                setCurrentColor(color);
                                onChange(color);
                                setTimeout(() => {
                                    setIsOpen(false);
                                }, 100);
                            }}
                            enableAlpha={true}
                            clearable={true}
                        />
                    </div>
                </Popover>
            )}
        </div>
    );
};
export default memo(FluentColorPicker, (prevProps, nextProps) => {
    return arePropsEqual(prevProps, nextProps, ['label', 'value', 'defaultColor']);
});