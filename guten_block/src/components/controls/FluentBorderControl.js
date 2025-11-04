const { BaseControl, ToggleControl, SelectControl } = wp.components;
const { useState, useEffect } = wp.element;
const { __ } = wp.i18n;
import FluentColorPicker from "./FluentColorPicker";
import FluentSpaceControl from "./FluentSpaceControl";

const FluentBorderControl = ({
    label = __("Border"),
    border = {},
    onChange,
    defaultColor = "#dddddd"
}) => {
    // Use internal state to track the border object
    const [localBorder, setLocalBorder] = useState({
        enable: false,
        type: 'solid',
        color: '',
        width: {},
        radius: {},
        ...border
    });

    // Update internal state when props change
    useEffect(() => {
        setLocalBorder(prev => ({
            ...prev,
            ...border
        }));
    }, [border]);

    const updateBorder = (updates) => {
        const newBorder = { ...localBorder, ...updates };
        setLocalBorder(newBorder);
        if (onChange) {
            onChange(newBorder);
        }
    };

    const borderTypeOptions = [
        { label: __("Solid"), value: 'solid' },
        { label: __("Dashed"), value: 'dashed' },
        { label: __("Dotted"), value: 'dotted' },
        { label: __("Double"), value: 'double' }
    ];

    const unitOptions = [
        { label: 'px', value: 'px' },
        { label: 'em', value: 'em' },
        { label: '%', value: '%' }
    ];

    return (
        <BaseControl label={label}>
            <ToggleControl
                label={__("Enable Border")}
                checked={localBorder.enable}
                onChange={(value) => {
                    const updates = { enable: value };
                    
                    // Set defaults when enabling
                    if (value) {
                        if (!localBorder.color) updates.color = defaultColor;
                        if (!localBorder.type) updates.type = 'solid';
                        if (!localBorder.width || Object.keys(localBorder.width).length === 0) {
                            updates.width = {
                                desktop: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
                                tablet: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
                                mobile: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true }
                            };
                        }
                        if (!localBorder.radius || Object.keys(localBorder.radius).length === 0) {
                            updates.radius = {
                                desktop: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
                                tablet: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
                                mobile: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true }
                            };
                        }
                    }
                    
                    updateBorder(updates);
                }}
            />

            {localBorder.enable && (
                <>
                    {/* Border Type */}
                    <SelectControl
                        label={__("Border Type")}
                        value={localBorder.type || 'solid'}
                        options={borderTypeOptions}
                        onChange={(value) => updateBorder({ type: value })}
                    />

                    {/* Border Color */}
                    <FluentColorPicker
                        label={__("Border Color")}
                        value={localBorder.color || ''}
                        onChange={(value) => updateBorder({ color: value })}
                        defaultColor={defaultColor}
                    />

                    {/* Border Width using FluentSpaceControl */}
                    <FluentSpaceControl
                        label={__("Border Width")}
                        values={localBorder.width}
                        onChange={(value) => updateBorder({ width: value })}
                    />

                    {/* Border Radius using FluentSpaceControl */}
                    <FluentSpaceControl
                        label={__("Border Radius")}
                        values={localBorder.radius}
                        onChange={(value) => updateBorder({ radius: value })}
                    />
                </>
            )}
        </BaseControl>
    );
};

export default FluentBorderControl;