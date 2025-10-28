/**
 * Fluent Forms Custom Space/Margin/Padding Control
 */

const {
    Button,
    ButtonGroup,
    TextControl,
    Flex,
    FlexItem,
    FlexBlock,
    Tooltip,
    DropdownMenu
} = wp.components;
const { Icon } = wp.blockEditor || wp.editor;
const { useState, useEffect } = wp.element;
const { __ } = wp.i18n;

// Custom Space/Margin/Padding Control
const FluentSpaceControl = ({ label, values, onChange, units = [{ value: 'px', key: 'px-unit' }, { value: 'em', key: 'em-unit' }, { value: '%', key: 'percent-unit' }] }) => {
    // Initialize state from props or defaults
    const [activeDevice, setActiveDevice] = useState('desktop');
    // Initialize isLinked based on values if available
    const initialLinkedState = values && values[activeDevice] && values[activeDevice].linked !== undefined ?
        values[activeDevice].linked : true;
    const [isLinked, setIsLinked] = useState(initialLinkedState);
    const [activeUnit, setActiveUnit] = useState('px');
    const [hasModifiedValues, setHasModifiedValues] = useState(false);
    const [currentValues, setCurrentValues] = useState({});

    // Default values structure
    const defaultValues = {
        desktop: { unit: 'px', top: 0, right: 0, bottom: 0, left: 0, linked: true },
        tablet: { unit: 'px', top: 0, right: 0, bottom: 0, left: 0, linked: true },
        mobile: { unit: 'px', top: 0, right: 0, bottom: 0, left: 0, linked: true }
    };

    // Initialize values on component mount and when props change
    useEffect(() => {
        if (values) {
            // Create a properly structured object with all required properties
            const structuredValues = {
                desktop: {
                    unit: values.desktop?.unit || values.unit || 'px',
                    top: values.desktop?.top || '',
                    right: values.desktop?.right || '',
                    bottom: values.desktop?.bottom || '',
                    left: values.desktop?.left || '',
                    linked: values.desktop?.linked !== undefined ? values.desktop.linked : true
                },
                tablet: {
                    unit: values.tablet?.unit || values.unit || 'px',
                    top: values.tablet?.top || '',
                    right: values.tablet?.right || '',
                    bottom: values.tablet?.bottom || '',
                    left: values.tablet?.left || '',
                    linked: values.tablet?.linked !== undefined ? values.tablet.linked : true
                },
                mobile: {
                    unit: values.mobile?.unit || values.unit || 'px',
                    top: values.mobile?.top || '',
                    right: values.mobile?.right || '',
                    bottom: values.mobile?.bottom || '',
                    left: values.mobile?.left || '',
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

    // Helper function to check if any spacing values have been set
    const checkForModifiedValues = (values) => {
        // Check all devices for any non-empty, non-zero values
        const devices = ['desktop', 'tablet', 'mobile'];
        for (const device of devices) {
            if (values[device]) {
                const deviceValues = values[device];
                // Check if any value is set and not empty or zero
                if ((deviceValues.top && deviceValues.top !== 0 && deviceValues.top !== '') ||
                    (deviceValues.right && deviceValues.right !== 0 && deviceValues.right !== '') ||
                    (deviceValues.bottom && deviceValues.bottom !== 0 && deviceValues.bottom !== '') ||
                    (deviceValues.left && deviceValues.left !== 0 && deviceValues.left !== '')) {
                    return true;
                }
            }
        }
        return false;
    };

    // Set initial state from props and update when device changes
    useEffect(() => {
        if (currentValues[activeDevice]) {
            // Explicitly set isLinked based on the current device's linked property
            setIsLinked(currentValues[activeDevice].linked !== false);

            // Check for unit at the top level first, then in the device object
            if (currentValues.unit) {
                setActiveUnit(currentValues.unit);
            } else if (currentValues[activeDevice].unit) {
                setActiveUnit(currentValues[activeDevice].unit);
            } else {
                setActiveUnit('px');
            }

            // Check if any values have been modified
            setHasModifiedValues(checkForModifiedValues(currentValues));
        }
    }, [activeDevice, currentValues]);

    const handleUnitChange = (unit) => {
        setActiveUnit(unit);

        // Create a new values object with the updated unit
        const updatedValues = {
            ...currentValues,
            unit: unit, // Set unit at the top level
        };

        // Also update the unit in each device object for backward compatibility
        ['desktop', 'tablet', 'mobile'].forEach(device => {
            if (updatedValues[device]) {
                updatedValues[device] = {
                    ...updatedValues[device],
                    unit: unit
                };
            }
        });

        // Call the onChange callback with the updated values
        onChange(updatedValues);
    };

    const toggleLinked = () => {
        const newLinkedState = !isLinked;
        setIsLinked(newLinkedState);

        // Create a new values object with the updated linked state
        const updatedValues = {
            ...currentValues,
            [activeDevice]: {
                ...currentValues[activeDevice],
                linked: newLinkedState
            }
        };

        // Update the parent component's state
        onChange(updatedValues);
    };

    const updateValues = (newDeviceValues) => {
        // Make sure the unit is always included in the values
        const updatedValues = {
            ...currentValues,
            unit: activeUnit, // Ensure unit is at the top level
            [activeDevice]: {
                ...newDeviceValues,
                unit: activeUnit, // Also ensure unit is in the device object
                linked: isLinked // Explicitly preserve the linked state
            }
        };
        onChange(updatedValues);
    };

    const handleValueChange = (position, value) => {
        const numValue = value === '' ? '' : parseInt(value);

        // Set the modified flag if the value is not empty
        if (value !== '') {
            setHasModifiedValues(true);
        } else {
            // If the value is empty, check if any other values exist
            const updatedValues = {...currentValues};
            const deviceValues = {...updatedValues[activeDevice]};
            deviceValues[position] = numValue;
            updatedValues[activeDevice] = deviceValues;
            setHasModifiedValues(checkForModifiedValues(updatedValues));
        }

        // If linked, update all values
        if (isLinked && position !== 'unit') {
            const updatedValues = {...currentValues};
            const updatedDeviceValues = {...updatedValues[activeDevice]};

            // Update all positions with the same value
            updatedDeviceValues.top = numValue;
            updatedDeviceValues.right = numValue;
            updatedDeviceValues.bottom = numValue;
            updatedDeviceValues.left = numValue;

            // Explicitly preserve the linked state
            updatedDeviceValues.linked = true;

            // Update the device values
            updatedValues[activeDevice] = updatedDeviceValues;

            // Update local state
            setCurrentValues(updatedValues);

            // Call onChange with updated values
            if (onChange) {
                onChange(updatedValues);
            }
        } else {
            // Update just the changed position
            const updatedValues = {...currentValues};
            const updatedDeviceValues = {...updatedValues[activeDevice]};
            updatedDeviceValues[position] = numValue;

            // Explicitly preserve the linked state
            updatedDeviceValues.linked = isLinked;

            updatedValues[activeDevice] = updatedDeviceValues;

            // Update local state
            setCurrentValues(updatedValues);

            // Call onChange with updated values
            if (onChange) {
                onChange(updatedValues);
            }
        }
    };

    const deviceValues = currentValues[activeDevice] || defaultValues[activeDevice];

    // Handler for reset button
    const handleReset = () => {
        // Reset to default values
        setIsLinked(true);
        setActiveUnit('px');
        setHasModifiedValues(false);

        // Create empty values
        const emptyValues = {
            desktop: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
            tablet: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true },
            mobile: { unit: 'px', top: '', right: '', bottom: '', left: '', linked: true }
        };

        // Update local state
        setCurrentValues(emptyValues);

        // Call onChange with empty values
        if (onChange) {
            onChange(emptyValues);
        }
    };

    return (
        <div className="ffblock-control-field ffblock-control-space">
            <div className="ffblock-space-header">
                <div className="ffblock-label-container">
                    <span className="ffblock-label">{label}</span>
                </div>
                <div>
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
                                        // Update isLinked based on the selected device's linked property
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
                        />
                        <span key="label-top">TOP</span>

                    </div>

                   <div>
                       <TextControl
                           type="number"
                           value={deviceValues.right}
                           onChange={(value) => handleValueChange('right', value)}
                           min={0}
                       />
                       <span key="label-right">RIGHT</span>

                   </div>
                    <div>
                        <TextControl
                            type="number"
                            value={deviceValues.bottom}
                            onChange={(value) => handleValueChange('bottom', value)}
                            min={0}
                        />
                        <span key="label-right">BOTTOM</span>

                    </div>
                    <div>
                        <TextControl
                            type="number"
                            value={deviceValues.left}
                            onChange={(value) => handleValueChange('left', value)}
                            min={0}
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

export default FluentSpaceControl;
