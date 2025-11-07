const { BaseControl, ToggleControl, SelectControl } = wp.components;
const { useEffect, memo, useCallback, useRef } = wp.element;
const { __ } = wp.i18n;
import FluentColorPicker from "./FluentColorPicker";
import { arePropsEqual } from '../utils/ComponentUtils';

const FluentBoxShadowControl = ({
    label = __("Box Shadow"),
    shadow = {},
    onChange,
    defaultColor = "rgba(0,0,0,0.5)"
}) => {
    const shadowRef = useRef(shadow || {
        enable: false,
        color: '',
        position: 'outline',
        horizontal: { value: '0', unit: 'px' },
        vertical: { value: '0', unit: 'px' },
        blur: { value: '5', unit: 'px' },
        spread: { value: '0', unit: 'px' },
    });

    useEffect(() => {
        shadowRef.current = shadow || shadowRef.current;
    }, [shadow]);

    const updateShadow = (updates) => {
        const newShadow = { ...shadowRef.current, ...updates };
        shadowRef.current = newShadow;
        if (onChange) {
            onChange(newShadow);
        }
    };

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
                checked={shadow.enable}
                onChange={(value) => {
                    const updates = { enable: value };
                    if (value) {
                        if (!shadow.color) updates.color = defaultColor;
                        if (!shadow.position) updates.position = 'outline';
                        if (!shadow.horizontal?.value) updates.horizontal = { value: '0', unit: 'px' };
                        if (!shadow.vertical?.value) updates.vertical = { value: '0', unit: 'px' };
                        if (!shadow.blur?.value) updates.blur = { value: '5', unit: 'px' };
                        if (!shadow.spread?.value) updates.spread = { value: '0', unit: 'px' };
                    }
                    updateShadow(updates);
                }}
            />

            {shadow.enable && (
                <>
                    <FluentColorPicker
                        label={__("Shadow Color")}
                        value={shadow.color || ''}
                        onChange={(value) => updateShadow({ color: value })}
                        defaultColor={defaultColor}
                    />

                    <SelectControl
                        label={__("Shadow Position")}
                        value={shadow.position || 'outline'}
                        options={positionOptions}
                        onChange={(value) => updateShadow({ position: value })}
                    />

                    {/* Horizontal Offset */}
                    <BaseControl label={__("Horizontal Offset")}>
                        <div className="ffblock-unit-control">
                            <input
                                type="number"
                                className="components-text-control__input"
                                value={shadow.horizontal?.value || ''}
                                onChange={(e) => updateShadow({
                                    horizontal: { ...shadow.horizontal, value: e.target.value }
                                })}
                                min="-50"
                                max="50"
                                placeholder="0"
                            />
                            <SelectControl
                                value={shadow.horizontal?.unit || 'px'}
                                options={unitOptions}
                                onChange={(unit) => updateShadow({
                                    horizontal: { ...shadow.horizontal, unit }
                                })}
                            />
                        </div>
                    </BaseControl>

                    {/* Vertical, Blur, Spread controls follow same pattern */}
                    <BaseControl label={__("Vertical Offset")}>
                        <div className="ffblock-unit-control">
                            <input
                                type="number"
                                className="components-text-control__input"
                                value={shadow.vertical?.value || ''}
                                onChange={(e) => updateShadow({
                                    vertical: { ...shadow.vertical, value: e.target.value }
                                })}
                                min="-50"
                                max="50"
                                placeholder="0"
                            />
                            <SelectControl
                                value={shadow.vertical?.unit || 'px'}
                                options={unitOptions}
                                onChange={(unit) => updateShadow({
                                    vertical: { ...shadow.vertical, unit }
                                })}
                            />
                        </div>
                    </BaseControl>

                    <BaseControl label={__("Blur Radius")}>
                        <div className="ffblock-unit-control">
                            <input
                                type="number"
                                className="components-text-control__input"
                                value={shadow.blur?.value || ''}
                                onChange={(e) => updateShadow({
                                    blur: { ...shadow.blur, value: e.target.value }
                                })}
                                min="0"
                                max="100"
                                placeholder="0"
                            />
                            <SelectControl
                                value={shadow.blur?.unit || 'px'}
                                options={unitOptions}
                                onChange={(unit) => updateShadow({
                                    blur: { ...shadow.blur, unit }
                                })}
                            />
                        </div>
                    </BaseControl>

                    <BaseControl label={__("Spread Radius")}>
                        <div className="ffblock-unit-control">
                            <input
                                type="number"
                                className="components-text-control__input"
                                value={shadow.spread?.value || ''}
                                onChange={(e) => updateShadow({
                                    spread: { ...shadow.spread, value: e.target.value }
                                })}
                                min="-50"
                                max="50"
                                placeholder="0"
                            />
                            <SelectControl
                                value={shadow.spread?.unit || 'px'}
                                options={unitOptions}
                                onChange={(unit) => updateShadow({
                                    spread: { ...shadow.spread, unit }
                                })}
                            />
                        </div>
                    </BaseControl>
                </>
            )}
        </BaseControl>
    );
};

export default memo(FluentBoxShadowControl, (prevProps, nextProps) => {
    return arePropsEqual(prevProps, nextProps, ['label', 'defaultColor', 'shadow']);
});