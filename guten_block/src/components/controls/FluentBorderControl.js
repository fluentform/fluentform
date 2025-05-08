const { BaseControl, ToggleControl, SelectControl } = wp.components;
const { useState, useEffect } = wp.element;
const { __ } = wp.i18n;
import FluentColorPicker from "./FluentColorPicker";
import FluentSpaceControl from "./FluentSpaceControl";

const FluentBorderControl = ({
                                 label = __("Border"),
                                 enabled,
                                 onToggle,
                                 borderType,
                                 onBorderTypeChange,
                                 borderColor,
                                 onBorderColorChange,
                                 borderWidth,
                                 onBorderWidthChange,
                                 borderRadius,
                                 onBorderRadiusChange,
                                 defaultColor = "#dddddd"
                             }) => {

    const [isEnabled, setIsEnabled] = useState(!!enabled);

    // Update internal state when prop changes
    useEffect(() => {
        setIsEnabled(!!enabled);
    }, [enabled]);

    const borderTypeOptions = [
        { label: __("Solid"), value: 'solid' },
        { label: __("Dashed"), value: 'dashed' },
        { label: __("Dotted"), value: 'dotted' },
        { label: __("Double"), value: 'double' }
    ];

    return (
        <BaseControl label={label}>
            <ToggleControl
                label={__("Enable Border")}
                checked={isEnabled}
                onChange={(value) => {
                    // Update internal state first
                    setIsEnabled(!!value);
                    // Then notify parent
                    onToggle(!!value);
                }}
            />

            {isEnabled && (
                <>
                    {/* Border Type */}
                    <SelectControl
                        label={__("Border Type")}
                        value={borderType || 'solid'}
                        options={borderTypeOptions}
                        onChange={onBorderTypeChange}
                    />

                    {/* Border Color */}
                    <FluentColorPicker
                        label={__("Border Color")}
                        value={borderColor || ''}
                        onChange={onBorderColorChange}
                        defaultColor={defaultColor}
                    />

                    {/* Border Width */}
                    <FluentSpaceControl
                        label={__("Border Width")}
                        values={borderWidth}
                        onChange={onBorderWidthChange}
                    />

                    {/* Border Radius */}
                    <FluentSpaceControl
                        label={__("Border Radius")}
                        values={borderRadius}
                        onChange={onBorderRadiusChange}
                    />
                </>
            )}
        </BaseControl>
    );
};

export default FluentBorderControl;