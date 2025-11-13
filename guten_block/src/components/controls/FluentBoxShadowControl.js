const { BaseControl, ToggleControl, SelectControl, Button, ButtonGroup } = wp.components;
const { useEffect, memo, useCallback, useRef, useState } = wp.element;
const { __ } = wp.i18n;
import FluentColorPicker from "./FluentColorPicker";
import { arePropsEqual } from '../utils/ComponentUtils';

const FluentBoxShadowControl = ({
    label = __("Box Shadow"),
    shadow = {},
    onChange,
    defaultColor = "rgba(0,0,0,0.5)"
}) => {
    const [showPresets, setShowPresets] = useState(false);

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

    // Shadow presets
    const shadowPresets = [
        {
            label: __("None"),
            value: {
                enable: false,
                color: '',
                position: 'outline',
                horizontal: { value: '0', unit: 'px' },
                vertical: { value: '0', unit: 'px' },
                blur: { value: '0', unit: 'px' },
                spread: { value: '0', unit: 'px' },
            }
        },
        {
            label: __("Subtle"),
            value: {
                enable: true,
                color: 'rgba(0,0,0,0.1)',
                position: 'outline',
                horizontal: { value: '0', unit: 'px' },
                vertical: { value: '2', unit: 'px' },
                blur: { value: '4', unit: 'px' },
                spread: { value: '0', unit: 'px' },
            }
        },
        {
            label: __("Small"),
            value: {
                enable: true,
                color: 'rgba(0,0,0,0.15)',
                position: 'outline',
                horizontal: { value: '0', unit: 'px' },
                vertical: { value: '4', unit: 'px' },
                blur: { value: '6', unit: 'px' },
                spread: { value: '0', unit: 'px' },
            }
        },
        {
            label: __("Medium"),
            value: {
                enable: true,
                color: 'rgba(0,0,0,0.2)',
                position: 'outline',
                horizontal: { value: '0', unit: 'px' },
                vertical: { value: '6', unit: 'px' },
                blur: { value: '12', unit: 'px' },
                spread: { value: '0', unit: 'px' },
            }
        },
        {
            label: __("Large"),
            value: {
                enable: true,
                color: 'rgba(0,0,0,0.25)',
                position: 'outline',
                horizontal: { value: '0', unit: 'px' },
                vertical: { value: '10', unit: 'px' },
                blur: { value: '20', unit: 'px' },
                spread: { value: '0', unit: 'px' },
            }
        },
        {
            label: __("Inset"),
            value: {
                enable: true,
                color: 'rgba(0,0,0,0.15)',
                position: 'inset',
                horizontal: { value: '0', unit: 'px' },
                vertical: { value: '2', unit: 'px' },
                blur: { value: '4', unit: 'px' },
                spread: { value: '0', unit: 'px' },
            }
        }
    ];

    const applyPreset = (preset) => {
        updateShadow(preset.value);
        setShowPresets(false);
    };

    return (
        <BaseControl label={label} className="ffblock-box-shadow-control">
            <div className="ffblock-control-header">
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
                <Button
                    icon="grid-view"
                    isSmall
                    onClick={() => setShowPresets(!showPresets)}
                    className="ffblock-preset-toggle"
                    label={__("Shadow Presets")}
                />
            </div>

            {showPresets && (
                <div className="ffblock-presets-container">
                    <div className="ffblock-presets-grid">
                        {shadowPresets.map((preset, index) => (
                            <Button
                                key={index}
                                className="ffblock-preset-button"
                                onClick={() => applyPreset(preset)}
                            >
                                <div className="ffblock-preset-preview ffblock-shadow-preview">
                                    <div
                                        className="ffblock-shadow-box"
                                        style={{
                                            boxShadow: preset.value.enable
                                                ? `${preset.value.position === 'inset' ? 'inset ' : ''}${preset.value.horizontal.value}${preset.value.horizontal.unit} ${preset.value.vertical.value}${preset.value.vertical.unit} ${preset.value.blur.value}${preset.value.blur.unit} ${preset.value.spread.value}${preset.value.spread.unit} ${preset.value.color}`
                                                : 'none'
                                        }}
                                    />
                                </div>
                                <span className="ffblock-preset-label">{preset.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

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
