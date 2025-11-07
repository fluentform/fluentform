const { BaseControl, ToggleControl, SelectControl } = wp.components;
const { useEffect, memo, useCallback, useRef } = wp.element;
const { __ } = wp.i18n;
import FluentColorPicker from "./FluentColorPicker";
import FluentSpaceControl from "./FluentSpaceControl";
import { arePropsEqual } from "../utils/ComponentUtils";

const FluentBorderControl = ({
    label = __("Border"),
    border = {},
    onChange,
    defaultColor = "#dddddd"
}) => {
    // Use internal state to track the border object
    const currentBorderRef = useRef(border || {
        enable: false,
        type: 'solid',
        color: '',
        width: {},
        radius: {},
    });

    useEffect(() => {
        currentBorderRef.current = border || currentBorderRef.current;
    }, [border]);

    const updateBorder = useCallback((updates) => {
        const newBorder = { ...currentBorderRef.current, ...updates };
        currentBorderRef.current = newBorder;
        if (onChange) {
            onChange(newBorder);
        }
    }, [currentBorderRef, onChange]);

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
                checked={border.enable}
                onChange={(value) => {
                    const updates = { enable: value };

                    if (value) {
                        if (!border.color) updates.color = defaultColor;
                        if (!border.type) updates.type = 'solid';
                        if (!border.width || Object.keys(border.width).length === 0) {
                            updates.width = {
                                desktop: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
                                tablet: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
                                mobile: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true }
                            };
                        }
                        if (!border.radius || Object.keys(border.radius).length === 0) {
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

            {border.enable && (
                <>
                    <SelectControl
                        label={__("Border Type")}
                        value={border.type || 'solid'}
                        options={borderTypeOptions}
                        onChange={(value) => updateBorder({ type: value })}
                    />

                    <FluentColorPicker
                        label={__("Border Color")}
                        value={border.color || ''}
                        onChange={(value) => updateBorder({ color: value })}
                        defaultColor={defaultColor}
                    />

                    <FluentSpaceControl
                        label={__("Border Width")}
                        values={border.width}
                        onChange={(value) => updateBorder({ width: value })}
                    />

                    <FluentSpaceControl
                        label={__("Border Radius")}
                        values={border.radius}
                        onChange={(value) => updateBorder({ radius: value })}
                    />
                </>
            )}
        </BaseControl>
    );
};

export default memo(FluentBorderControl, (prevProps, nextProps) => {
    return arePropsEqual(prevProps, nextProps, ['label', 'defaultColor', 'border']);
});