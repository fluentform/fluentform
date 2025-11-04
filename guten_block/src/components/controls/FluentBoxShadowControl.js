const { BaseControl, ToggleControl, SelectControl } = wp.components;
const { useState, useEffect } = wp.element;
const { __ } = wp.i18n;
import FluentColorPicker from "./FluentColorPicker";

const FluentBoxShadowControl = ({
    label = __("Box Shadow"),
    shadow = {},
    onChange,
    defaultColor = "rgba(0,0,0,0.5)"
}) => {
    // Use internal state to track the shadow object
    const [localShadow, setLocalShadow] = useState({
        enable: false,
        color: '',
        position: 'outline',
        horizontal: { value: '0', unit: 'px' },
        vertical: { value: '0', unit: 'px' },
        blur: { value: '5', unit: 'px' },
        spread: { value: '0', unit: 'px' },
        ...shadow
    });

    // Update internal state when props change
    useEffect(() => {
        setLocalShadow(prev => ({
            ...prev,
            ...shadow
        }));
    }, [shadow]);

    const updateShadow = (updates) => {
        const newShadow = { ...localShadow, ...updates };
        setLocalShadow(newShadow);
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
                checked={localShadow.enable}
                onChange={(value) => {
                    const updates = { enable: value };
                    
                    // Set defaults when enabling
                    if (value) {
                        if (!localShadow.color) updates.color = defaultColor;
                        if (!localShadow.position) updates.position = 'outline';
                        if (!localShadow.horizontal?.value) updates.horizontal = { value: '0', unit: 'px' };
                        if (!localShadow.vertical?.value) updates.vertical = { value: '0', unit: 'px' };
                        if (!localShadow.blur?.value) updates.blur = { value: '5', unit: 'px' };
                        if (!localShadow.spread?.value) updates.spread = { value: '0', unit: 'px' };
                    }
                    
                    updateShadow(updates);
                }}
            />

            {localShadow.enable && (
                <>
                    <FluentColorPicker
                        label={__("Shadow Color")}
                        value={localShadow.color || ''}
                        onChange={(value) => updateShadow({ color: value })}
                        defaultColor={defaultColor}
                    />

                    <SelectControl
                        label={__("Shadow Position")}
                        value={localShadow.position || 'outline'}
                        options={positionOptions}
                        onChange={(value) => updateShadow({ position: value })}
                    />

                    {/* Horizontal Offset */}
                    <BaseControl label={__("Horizontal Offset")}>
                        <div className="ffblock-unit-control">
                            <input
                                type="number"
                                className="components-text-control__input"
                                value={localShadow.horizontal?.value || ''}
                                onChange={(e) => updateShadow({
                                    horizontal: { ...localShadow.horizontal, value: e.target.value }
                                })}
                                min="-50"
                                max="50"
                                placeholder="0"
                            />
                            <SelectControl
                                value={localShadow.horizontal?.unit || 'px'}
                                options={unitOptions}
                                onChange={(unit) => updateShadow({
                                    horizontal: { ...localShadow.horizontal, unit }
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
                                value={localShadow.vertical?.value || ''}
                                onChange={(e) => updateShadow({
                                    vertical: { ...localShadow.vertical, value: e.target.value }
                                })}
                                min="-50"
                                max="50"
                                placeholder="0"
                            />
                            <SelectControl
                                value={localShadow.vertical?.unit || 'px'}
                                options={unitOptions}
                                onChange={(unit) => updateShadow({
                                    vertical: { ...localShadow.vertical, unit }
                                })}
                            />
                        </div>
                    </BaseControl>

                    <BaseControl label={__("Blur Radius")}>
                        <div className="ffblock-unit-control">
                            <input
                                type="number"
                                className="components-text-control__input"
                                value={localShadow.blur?.value || ''}
                                onChange={(e) => updateShadow({
                                    blur: { ...localShadow.blur, value: e.target.value }
                                })}
                                min="0"
                                max="100"
                                placeholder="0"
                            />
                            <SelectControl
                                value={localShadow.blur?.unit || 'px'}
                                options={unitOptions}
                                onChange={(unit) => updateShadow({
                                    blur: { ...localShadow.blur, unit }
                                })}
                            />
                        </div>
                    </BaseControl>

                    <BaseControl label={__("Spread Radius")}>
                        <div className="ffblock-unit-control">
                            <input
                                type="number"
                                className="components-text-control__input"
                                value={localShadow.spread?.value || ''}
                                onChange={(e) => updateShadow({
                                    spread: { ...localShadow.spread, value: e.target.value }
                                })}
                                min="-50"
                                max="50"
                                placeholder="0"
                            />
                            <SelectControl
                                value={localShadow.spread?.unit || 'px'}
                                options={unitOptions}
                                onChange={(unit) => updateShadow({
                                    spread: { ...localShadow.spread, unit }
                                })}
                            />
                        </div>
                    </BaseControl>
                </>
            )}
        </BaseControl>
    );
};

export default FluentBoxShadowControl;