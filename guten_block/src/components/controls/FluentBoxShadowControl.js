const { BaseControl, ToggleControl, SelectControl } = wp.components;
const { useState, useEffect } = wp.element;
const { __ } = wp.i18n;
import FluentColorPicker from "./FluentColorPicker";

const FluentBoxShadowControl = ({
                                    label = __("Box Shadow"),
                                    enabled,
                                    onToggle,
                                    color,
                                    onColorChange,
                                    position,
                                    onPositionChange,
                                    horizontal,
                                    onHorizontalChange,
                                    horizontalUnit,
                                    onHorizontalUnitChange,
                                    vertical,
                                    onVerticalChange,
                                    verticalUnit,
                                    onVerticalUnitChange,
                                    blur,
                                    onBlurChange,
                                    blurUnit,
                                    onBlurUnitChange,
                                    spread,
                                    onSpreadChange,
                                    spreadUnit,
                                    onSpreadUnitChange,
                                    defaultColor = "rgba(0,0,0,0.5)"
                                }) => {
    // Use internal state to track the enabled state and values
    const [isEnabled, setIsEnabled] = useState(!!enabled);
    const [localHorizontal, setLocalHorizontal] = useState(horizontal || '');
    const [localVertical, setLocalVertical] = useState(vertical || '');
    const [localBlur, setLocalBlur] = useState(blur || '');
    const [localSpread, setLocalSpread] = useState(spread || '');

    // Update internal state when props change
    useEffect(() => {
        setIsEnabled(!!enabled);
        setLocalHorizontal(horizontal || '');
        setLocalVertical(vertical || '');
        setLocalBlur(blur || '');
        setLocalSpread(spread || '');
    }, [enabled, horizontal, vertical, blur, spread]);
    const positionOptions = [
        { label: __("Outline"), value: 'outline' },
        { label: __("Inset"), value: 'inset' }
    ];

    const unitOptions = [
        { label: 'px', value: 'px' },
        { label: 'em', value: 'em' },
        { label: '%', value: '%' }
    ];

    return (
        <BaseControl label={label}>
            <ToggleControl
                label={__("Enable Box Shadow")}
                checked={isEnabled}
                onChange={(value) => {
                    // Update internal state first
                    setIsEnabled(!!value);
                    // Then notify parent
                    onToggle(!!value);

                    // If enabling, make sure all values are set with defaults if needed
                    if (value) {
                        // Set color (use provided color or default)
                        onColorChange(color || defaultColor);

                        // Set position if not already set
                        if (!position) onPositionChange('outline');

                        // Set horizontal with default if not set
                        onHorizontalChange(horizontal || '0');
                        if (!horizontalUnit) onHorizontalUnitChange('px');

                        // Set vertical with default if not set
                        onVerticalChange(vertical || '0');
                        if (!verticalUnit) onVerticalUnitChange('px');

                        // Set blur with default if not set
                        onBlurChange(blur || '5');
                        if (!blurUnit) onBlurUnitChange('px');

                        // Set spread with default if not set
                        onSpreadChange(spread || '0');
                        if (!spreadUnit) onSpreadUnitChange('px');
                    }
                }}
            />

            {isEnabled && (
                <>
                    {/* Shadow Color */}
                    <FluentColorPicker
                        label={__("Shadow Color")}
                        value={color || ''}
                        onChange={onColorChange}
                        defaultColor={defaultColor}
                    />

                    {/* Shadow Position */}
                    <SelectControl
                        label={__("Shadow Position")}
                        value={position || 'outline'}
                        options={positionOptions}
                        onChange={onPositionChange}
                    />

                    {/* Horizontal Offset */}
                    <BaseControl label={__("Horizontal Offset")}>
                        <div className="ffblock-unit-control">
                            <input
                                type="number"
                                className="components-text-control__input"
                                value={localHorizontal}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setLocalHorizontal(value);
                                    onHorizontalChange(value);
                                }}
                                min="-50"
                                max="50"
                                placeholder="0"
                            />
                            <SelectControl
                                value={horizontalUnit || 'px'}
                                options={unitOptions}
                                onChange={onHorizontalUnitChange}
                            />
                        </div>
                    </BaseControl>

                    {/* Vertical Offset */}
                    <BaseControl label={__("Vertical Offset")}>
                        <div className="ffblock-unit-control">
                            <input
                                type="number"
                                className="components-text-control__input"
                                value={localVertical}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setLocalVertical(value);
                                    onVerticalChange(value);
                                }}
                                min="-50"
                                max="50"
                                placeholder="0"
                            />
                            <SelectControl
                                value={verticalUnit || 'px'}
                                options={unitOptions}
                                onChange={onVerticalUnitChange}
                            />
                        </div>
                    </BaseControl>

                    {/* Blur Radius */}
                    <BaseControl label={__("Blur Radius")}>
                        <div className="ffblock-unit-control">
                            <input
                                type="number"
                                className="components-text-control__input"
                                value={localBlur}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setLocalBlur(value);
                                    onBlurChange(value);
                                }}
                                min="0"
                                max="100"
                                placeholder="0"
                            />
                            <SelectControl
                                value={blurUnit || 'px'}
                                options={unitOptions}
                                onChange={onBlurUnitChange}
                            />
                        </div>
                    </BaseControl>

                    {/* Spread Radius */}
                    <BaseControl label={__("Spread Radius")}>
                        <div className="ffblock-unit-control">
                            <input
                                type="number"
                                className="components-text-control__input"
                                value={localSpread}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setLocalSpread(value);
                                    onSpreadChange(value);
                                }}
                                min="-50"
                                max="50"
                                placeholder="0"
                            />
                            <SelectControl
                                value={spreadUnit || 'px'}
                                options={unitOptions}
                                onChange={onSpreadUnitChange}
                            />
                        </div>
                    </BaseControl>
                </>
            )}
        </BaseControl>
    );
};

export default FluentBoxShadowControl;