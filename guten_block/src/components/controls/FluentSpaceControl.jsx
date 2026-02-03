const { Button, ButtonGroup, TextControl, Tooltip, DropdownMenu } = wp.components;
const { useState, useEffect, memo } = wp.element;
const { __ } = wp.i18n;
import { arePropsEqual } from '../utils/ComponentUtils';

const FluentSpaceControl = ({ label, values, onChange, units = [{ value: 'px', key: 'px-unit' }, { value: 'em', key: 'em-unit' }, { value: '%', key: 'percent-unit' }], showPresetsToggle = true, presetType = 'spacing' }) => {
    const [activeDevice, setActiveDevice] = useState('desktop');
    const initialLinkedState = values && values[activeDevice] && values[activeDevice].linked !== undefined ?
        values[activeDevice].linked : true;
    const [isLinked, setIsLinked] = useState(initialLinkedState);
    const [activeUnit, setActiveUnit] = useState('px');
    const [hasModifiedValues, setHasModifiedValues] = useState(false);
    const [currentValues, setCurrentValues] = useState({});
    const [showPresets, setShowPresets] = useState(false);

    const defaultValues = {
        desktop: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
        tablet: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
        mobile: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true }
    };

    useEffect(() => {
        if (values) {
            const structuredValues = {
                desktop: {
                    unit: values.desktop?.unit || values.unit || 'px',
                    top: values.desktop?.top ?? '',
                    right: values.desktop?.right ?? '',
                    bottom: values.desktop?.bottom ?? '',
                    left: values.desktop?.left ?? '',
                    linked: values.desktop?.linked !== undefined ? values.desktop.linked : true
                },
                tablet: {
                    unit: values.tablet?.unit ?? (values.unit || 'px'),
                    top: values.tablet?.top ?? '',
                    right: values.tablet?.right ?? '',
                    bottom: values.tablet?.bottom ?? '',
                    left: values.tablet?.left ?? '',
                    linked: values.tablet?.linked !== undefined ? values.tablet.linked : true
                },
                mobile: {
                    unit: values.mobile?.unit ?? (values.unit || 'px'),
                    top: values.mobile?.top ?? '',
                    right: values.mobile?.right ?? '',
                    bottom: values.mobile?.bottom ?? '',
                    left: values.mobile?.left ?? '',
                    linked: values.mobile?.linked !== undefined ? values.mobile.linked : true
                }
            };

            setCurrentValues(structuredValues);
            // Ensure isLinked is properly set based on the current device's linked property
            setIsLinked(structuredValues[activeDevice].linked !== false);
            setActiveUnit(structuredValues[activeDevice].unit || 'px');
            setHasModifiedValues(checkForModifiedValues(structuredValues));
        }
    }, [values, activeDevice]);

    const checkForModifiedValues = (values) => {
        const devices = ['desktop', 'tablet', 'mobile'];
        for (const device of devices) {
            if (values[device]) {
                const deviceValues = values[device];
                if (deviceValues.top !== '' || deviceValues.right !== '' || deviceValues.bottom !== '' || deviceValues.left !== '') {
                    return true;
                }
            }
        }
        return false;
    };

    useEffect(() => {
        if (currentValues[activeDevice]) {
            setIsLinked(currentValues[activeDevice].linked !== false);
            setActiveUnit(currentValues[activeDevice].unit || 'px');
            setHasModifiedValues(checkForModifiedValues(currentValues));
        }
    }, [activeDevice, currentValues]);

    const handleUnitChange = (unit) => {
        setActiveUnit(unit);

        const updatedValues = {
            ...currentValues,
            [activeDevice]: {
                ...currentValues[activeDevice],
                unit: unit
            }
        };
        onChange(updatedValues);
    };

    const toggleLinked = () => {
        const newLinkedState = !isLinked;
        setIsLinked(newLinkedState);

        const updatedValues = {
            ...currentValues,
            [activeDevice]: {
                ...currentValues[activeDevice],
                linked: newLinkedState
            }
        };

        onChange(updatedValues);
    };

    const handleValueChange = (position, value) => {
        const numValue = value === '' ? '' :
            (activeUnit === 'em' || activeUnit === '%') ? parseFloat(value) : parseInt(value);
        if (value !== '') {
            setHasModifiedValues(true);
        } else {
            const updatedValues = {...currentValues};
            const deviceValues = {...updatedValues[activeDevice]};
            deviceValues[position] = numValue;
            updatedValues[activeDevice] = deviceValues;
            setHasModifiedValues(checkForModifiedValues(updatedValues));
        }

        if (isLinked) {
            const updatedValues = {...currentValues};
            const updatedDeviceValues = {...updatedValues[activeDevice]};

            updatedDeviceValues.top = numValue;
            updatedDeviceValues.right = numValue;
            updatedDeviceValues.bottom = numValue;
            updatedDeviceValues.left = numValue;

            updatedDeviceValues.linked = true;

            updatedValues[activeDevice] = updatedDeviceValues;

            setCurrentValues(updatedValues);

            if (onChange) {
                onChange(updatedValues);
            }
        } else {
            const updatedValues = {...currentValues};
            const updatedDeviceValues = {...updatedValues[activeDevice]};
            updatedDeviceValues[position] = numValue;

            updatedDeviceValues.linked = isLinked;

            updatedValues[activeDevice] = updatedDeviceValues;

            setCurrentValues(updatedValues);

            if (onChange) {
                onChange(updatedValues);
            }
        }
    };

    const deviceValues = currentValues[activeDevice] || defaultValues[activeDevice];

    const handleReset = () => {
        setIsLinked(true);
        setActiveUnit('px');
        setHasModifiedValues(false);

        const emptyValues = {
            desktop: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
            tablet: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
            mobile: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true }
        };

        setCurrentValues(emptyValues);

        if (onChange) {
            onChange(emptyValues);
        }
    };

    // Spacing presets
    const spacePresets = [
        {
            label: __("None"),
            value: {
                desktop: { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', linked: true },
                tablet: { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', linked: true },
                mobile: { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', linked: true }
            }
        },
        {
            label: __("Small"),
            value: {
                desktop: { unit: 'px', top: '10', right: '10', bottom: '10', left: '10', linked: true },
                tablet: { unit: 'px', top: '8', right: '8', bottom: '8', left: '8', linked: true },
                mobile: { unit: 'px', top: '5', right: '5', bottom: '5', left: '5', linked: true }
            }
        },
        {
            label: __("Medium"),
            value: {
                desktop: { unit: 'px', top: '20', right: '20', bottom: '20', left: '20', linked: true },
                tablet: { unit: 'px', top: '15', right: '15', bottom: '15', left: '15', linked: true },
                mobile: { unit: 'px', top: '10', right: '10', bottom: '10', left: '10', linked: true }
            }
        },
        {
            label: __("Large"),
            value: {
                desktop: { unit: 'px', top: '30', right: '30', bottom: '30', left: '30', linked: true },
                tablet: { unit: 'px', top: '25', right: '25', bottom: '25', left: '25', linked: true },
                mobile: { unit: 'px', top: '20', right: '20', bottom: '20', left: '20', linked: true }
            }
        },
        {
            label: __("Custom V"),
            value: {
                desktop: { unit: 'px', top: '20', right: '0', bottom: '20', left: '0', linked: false },
                tablet: { unit: 'px', top: '15', right: '0', bottom: '15', left: '0', linked: false },
                mobile: { unit: 'px', top: '10', right: '0', bottom: '10', left: '0', linked: false }
            }
        },
        {
            label: __("Custom H"),
            value: {
                desktop: { unit: 'px', top: '0', right: '20', bottom: '0', left: '20', linked: false },
                tablet: { unit: 'px', top: '0', right: '15', bottom: '0', left: '15', linked: false },
                mobile: { unit: 'px', top: '0', right: '10', bottom: '0', left: '10', linked: false }
            }
        }
    ];

    // Border Radius presets
    const radiusPresets = [
        {
            label: __("None"),
            value: {
                desktop: { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', linked: true },
                tablet: { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', linked: true },
                mobile: { unit: 'px', top: '0', right: '0', bottom: '0', left: '0', linked: true }
            }
        },
        {
            label: __("Small"),
            value: {
                desktop: { unit: 'px', top: '3', right: '3', bottom: '3', left: '3', linked: true },
                tablet: { unit: 'px', top: '3', right: '3', bottom: '3', left: '3', linked: true },
                mobile: { unit: 'px', top: '3', right: '3', bottom: '3', left: '3', linked: true }
            }
        },
        {
            label: __("Medium"),
            value: {
                desktop: { unit: 'px', top: '5', right: '5', bottom: '5', left: '5', linked: true },
                tablet: { unit: 'px', top: '5', right: '5', bottom: '5', left: '5', linked: true },
                mobile: { unit: 'px', top: '5', right: '5', bottom: '5', left: '5', linked: true }
            }
        },
        {
            label: __("Large"),
            value: {
                desktop: { unit: 'px', top: '10', right: '10', bottom: '10', left: '10', linked: true },
                tablet: { unit: 'px', top: '10', right: '10', bottom: '10', left: '10', linked: true },
                mobile: { unit: 'px', top: '10', right: '10', bottom: '10', left: '10', linked: true }
            }
        },
        {
            label: __("Rounded"),
            value: {
                desktop: { unit: 'px', top: '15', right: '15', bottom: '15', left: '15', linked: true },
                tablet: { unit: 'px', top: '15', right: '15', bottom: '15', left: '15', linked: true },
                mobile: { unit: 'px', top: '15', right: '15', bottom: '15', left: '15', linked: true }
            }
        },
        {
            label: __("Pill"),
            value: {
                desktop: { unit: 'px', top: '50', right: '50', bottom: '50', left: '50', linked: true },
                tablet: { unit: 'px', top: '50', right: '50', bottom: '50', left: '50', linked: true },
                mobile: { unit: 'px', top: '50', right: '50', bottom: '50', left: '50', linked: true }
            }
        }
    ];

    const presets = presetType === 'radius' ? radiusPresets : spacePresets;

    const applyPreset = (preset) => {
        setCurrentValues(preset.value);
        setIsLinked(preset.value[activeDevice].linked);
        setActiveUnit(preset.value[activeDevice].unit);
        setHasModifiedValues(true);
        if (onChange) {
            onChange(preset.value);
        }
        setShowPresets(false);
    };

    const getPresetLabel = () => {
        return presetType === 'radius' ? __("Border Radius Presets") : __("Spacing Presets");
    };

    return (
        <div className="ffblock-control-field ffblock-control-space">
            <div className="ffblock-space-header">
                <div className="ffblock-label-container">
                    <span className="ffblock-label">{label}</span>
                </div>
                <div className="ffblock-header-actions">
                    {showPresetsToggle && (
                        <Button
                            icon="grid-view"
                            isSmall
                            onClick={() => setShowPresets(!showPresets)}
                            className="ffblock-preset-toggle"
                            label={getPresetLabel()}
                        />
                    )}
                    {hasModifiedValues && (
                        <Tooltip text={__('Reset spacing values')}>
                            <Button
                                onClick={handleReset}
                                className="ffblock-reset-button"
                                icon="image-rotate"
                                isSmall
                            />
                        </Tooltip>
                    )}
                </div>
            </div>

            {showPresetsToggle && showPresets && (
                <div className="ffblock-presets-container">
                    <div className="ffblock-presets-grid">
                        {presets.map((preset, index) => (
                            <Button
                                key={index}
                                className={`ffblock-preset-button ${presetType === 'radius' ? '' : 'ffblock-preset-text-only'}`}
                                onClick={() => applyPreset(preset)}
                            >
                                {presetType === 'radius' && (
                                    <div className="ffblock-preset-preview ffblock-radius-preview">
                                        <div
                                            className="ffblock-radius-box"
                                            style={{
                                                border: '2px solid #dddddd',
                                                borderRadius: `${preset.value.desktop.top || 0}px`
                                            }}
                                        />
                                    </div>
                                )}
                                <span className="ffblock-preset-label">{preset.label}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            <div className="ffblock-space-body">
                <div className="ffblock-space-controls">
                   <div className="ffblock-device-selector">
                        <DropdownMenu
                            className="ffblock-device-dropdown"
                            icon={activeDevice === 'desktop' ? 'desktop' :
                                 activeDevice === 'tablet' ? 'tablet' : 'smartphone'}
                            label={__('Select device')}
                            controls={
                                [
                                    { value: 'desktop', label: __('Desktop'), icon: 'desktop' },
                                    { value: 'tablet', label: __('Tablet'), icon: 'tablet' },
                                    { value: 'mobile', label: __('Mobile'), icon: 'smartphone' }
                                ].map(device => ({
                                    title: device.label,
                                    icon: device.icon,
                                    isActive: activeDevice === device.value,
                                    onClick: () => {
                                        setActiveDevice(device.value);
                                        if (currentValues[device.value]) {
                                            setIsLinked(currentValues[device.value].linked !== false);
                                        }
                                    }
                                }))
                            }
                        />
                    </div>

                    <div className="ffblock-unit-selector">
                        <ButtonGroup>
                            {units.map(unit => (
                                <Button
                                    key={unit.key}
                                    isSmall
                                    isPrimary={activeUnit === unit.value}
                                    onClick={() => handleUnitChange(unit.value)}
                                >
                                    {unit.value.toUpperCase()}
                                </Button>
                            ))}
                        </ButtonGroup>
                    </div>
                </div>
            </div>

            <div className={`ffblock-space-inputs device-${activeDevice}`}>

                <div className="ffblock-space-input-row">

                    <div>
                        <TextControl
                            type="number"
                            value={deviceValues.top}
                            onChange={(value) => handleValueChange('top', value)}
                            min={0}
                            step={activeUnit === 'em' || activeUnit === '%' ? 0.1 : 1}
                        />
                        <span key="label-top">TOP</span>

                    </div>

                   <div>
                       <TextControl
                           type="number"
                           value={deviceValues.right}
                           onChange={(value) => handleValueChange('right', value)}
                           min={0}
                           step={activeUnit === 'em' || activeUnit === '%' ? 0.1 : 1}
                       />
                       <span key="label-right">RIGHT</span>

                   </div>
                    <div>
                        <TextControl
                            type="number"
                            value={deviceValues.bottom}
                            onChange={(value) => handleValueChange('bottom', value)}
                            min={0}
                            step={activeUnit === 'em' || activeUnit === '%' ? 0.1 : 1}
                        />
                        <span key="label-bottom">BOTTOM</span>

                    </div>
                    <div>
                        <TextControl
                            type="number"
                            value={deviceValues.left}
                            onChange={(value) => handleValueChange('left', value)}
                            min={0}
                            step={activeUnit === 'em' || activeUnit === '%' ? 0.1 : 1}
                        />
                        <span key="label-left">LEFT</span>

                    </div>
                    <Button
                        icon={isLinked ? 'admin-links' : 'editor-unlink'}
                        onClick={toggleLinked}
                        className="ffblock-linked-button"
                    />
                </div>
            </div>
        </div>
    );
};

export default memo(FluentSpaceControl, (prevProps, nextProps) => {
    return arePropsEqual(prevProps, nextProps, ['label', 'values', 'units']);
});
