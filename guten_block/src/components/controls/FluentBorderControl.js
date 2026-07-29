const { BaseControl, ToggleControl, SelectControl, Button } = wp.components;
const { useEffect, memo, useCallback, useRef, useState } = wp.element;
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
    const [showPresets, setShowPresets] = useState(false);

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

    // Border presets
    const borderPresets = [
        {
            label: __("None"),
            value: {
                enable: false,
                type: 'solid',
                color: '',
                width: {
                    desktop: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
                    tablet: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
                    mobile: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true }
                },
                radius: {
                    desktop: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
                    tablet: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
                    mobile: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true }
                }
            }
        },
        {
            label: __("Thin"),
            value: {
                enable: true,
                type: 'solid',
                color: '#dddddd',
                width: {
                    desktop: { unit: 'px', top: '1', right: '1', bottom: '1', left: '1', linked: true },
                    tablet: { unit: 'px', top: '1', right: '1', bottom: '1', left: '1', linked: true },
                    mobile: { unit: 'px', top: '1', right: '1', bottom: '1', left: '1', linked: true }
                },
                radius: {
                    desktop: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
                    tablet: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
                    mobile: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true }
                }
            }
        },
        {
            label: __("Medium"),
            value: {
                enable: true,
                type: 'solid',
                color: '#dddddd',
                width: {
                    desktop: { unit: 'px', top: '2', right: '2', bottom: '2', left: '2', linked: true },
                    tablet: { unit: 'px', top: '2', right: '2', bottom: '2', left: '2', linked: true },
                    mobile: { unit: 'px', top: '2', right: '2', bottom: '2', left: '2', linked: true }
                },
                radius: {
                    desktop: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
                    tablet: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
                    mobile: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true }
                }
            }
        },
        {
            label: __("Rounded"),
            value: {
                enable: true,
                type: 'solid',
                color: '#dddddd',
                width: {
                    desktop: { unit: 'px', top: '1', right: '1', bottom: '1', left: '1', linked: true },
                    tablet: { unit: 'px', top: '1', right: '1', bottom: '1', left: '1', linked: true },
                    mobile: { unit: 'px', top: '1', right: '1', bottom: '1', left: '1', linked: true }
                },
                radius: {
                    desktop: { unit: 'px', top: '5', right: '5', bottom: '5', left: '5', linked: true },
                    tablet: { unit: 'px', top: '5', right: '5', bottom: '5', left: '5', linked: true },
                    mobile: { unit: 'px', top: '5', right: '5', bottom: '5', left: '5', linked: true }
                }
            }
        },
        {
            label: __("Pill"),
            value: {
                enable: true,
                type: 'solid',
                color: '#dddddd',
                width: {
                    desktop: { unit: 'px', top: '1', right: '1', bottom: '1', left: '1', linked: true },
                    tablet: { unit: 'px', top: '1', right: '1', bottom: '1', left: '1', linked: true },
                    mobile: { unit: 'px', top: '1', right: '1', bottom: '1', left: '1', linked: true }
                },
                radius: {
                    desktop: { unit: 'px', top: '50', right: '50', bottom: '50', left: '50', linked: true },
                    tablet: { unit: 'px', top: '50', right: '50', bottom: '50', left: '50', linked: true },
                    mobile: { unit: 'px', top: '50', right: '50', bottom: '50', left: '50', linked: true }
                }
            }
        },
        {
            label: __("Dashed"),
            value: {
                enable: true,
                type: 'dashed',
                color: '#dddddd',
                width: {
                    desktop: { unit: 'px', top: '2', right: '2', bottom: '2', left: '2', linked: true },
                    tablet: { unit: 'px', top: '2', right: '2', bottom: '2', left: '2', linked: true },
                    mobile: { unit: 'px', top: '2', right: '2', bottom: '2', left: '2', linked: true }
                },
                radius: {
                    desktop: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
                    tablet: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
                    mobile: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true }
                }
            }
        }
    ];

    const applyPreset = (preset) => {
        updateBorder(preset.value);
        setShowPresets(false);
    };

    return (
        <BaseControl label={label} className="ffblock-border-control">
            <div className="ffblock-control-header">
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
                <Button
                    icon="grid-view"
                    isSmall
                    onClick={() => setShowPresets(!showPresets)}
                    className="ffblock-preset-toggle"
                    label={__("Border Presets")}
                />
            </div>

            {showPresets && (
                <div className="ffblock-presets-container">
                    <div className="ffblock-presets-grid">
                        {borderPresets.map((preset, index) => (
                            <Button
                                key={index}
                                className="ffblock-preset-button"
                                onClick={() => applyPreset(preset)}
                            >
                                <div className="ffblock-preset-preview ffblock-border-preview">
                                    <div
                                        className="ffblock-border-box"
                                        style={{
                                            border: preset.value.enable
                                                ? `${preset.value.width.desktop.top || 0}px ${preset.value.type} ${preset.value.color}`
                                                : 'none',
                                            borderRadius: preset.value.enable && preset.value.radius.desktop.top
                                                ? `${preset.value.radius.desktop.top}px`
                                                : '0'
                                        }}
                                    />
                                </div>
                                <span className="ffblock-preset-label">{preset.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

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
                        showPresetsToggle={false}
                    />

                    <FluentSpaceControl
                        label={__("Border Radius")}
                        values={border.radius}
                        onChange={(value) => updateBorder({ radius: value })}
                        showPresetsToggle={true}
                        presetType="radius"
                    />
                </>
            )}
        </BaseControl>
    );
};

export default memo(FluentBorderControl, (prevProps, nextProps) => {
    return arePropsEqual(prevProps, nextProps, ['label', 'defaultColor', 'border']);
});
