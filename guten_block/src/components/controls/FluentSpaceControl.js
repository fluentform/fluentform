/**
 * Fluent Forms Custom Space/Margin/Padding Control
 */
import './common.css';

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
    const [isLinked, setIsLinked] = useState(true);
    const [activeUnit, setActiveUnit] = useState('px');
    const [activeDevice, setActiveDevice] = useState('desktop');
    const [hasModifiedValues, setHasModifiedValues] = useState(false);

    // Default values structure
    const defaultValues = {
        desktop: { unit: 'px', top: 0, right: 0, bottom: 0, left: 0, linked: true },
        tablet: { unit: 'px', top: 0, right: 0, bottom: 0, left: 0, linked: true },
        mobile: { unit: 'px', top: 0, right: 0, bottom: 0, left: 0, linked: true }
    };

    const currentValues = values || defaultValues;

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

    // Set initial state from props
    useEffect(() => {
        if (currentValues[activeDevice]) {
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
        updateValues({
            ...currentValues[activeDevice],
            linked: newLinkedState
        });
    };

    const updateValues = (newDeviceValues) => {
        // Make sure the unit is always included in the values
        const updatedValues = {
            ...currentValues,
            unit: activeUnit, // Ensure unit is at the top level
            [activeDevice]: {
                ...newDeviceValues,
                unit: activeUnit // Also ensure unit is in the device object
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

        if (isLinked) {
            // If linked, update all sides
            updateValues({
                ...currentValues[activeDevice],
                top: numValue,
                right: numValue,
                bottom: numValue,
                left: numValue
            });
        } else {
            // Otherwise just update the changed side
            updateValues({
                ...currentValues[activeDevice],
                [position]: numValue
            });
        }
    };

    const deviceValues = currentValues[activeDevice] || defaultValues[activeDevice];

    // Handler for reset button
    const handleReset = () => {
        // Create an empty values object with the current unit
        const emptyValues = {
            unit: activeUnit,
            desktop: { top: '', right: '', bottom: '', left: '', linked: isLinked },
            tablet: { top: '', right: '', bottom: '', left: '', linked: isLinked },
            mobile: { top: '', right: '', bottom: '', left: '', linked: isLinked }
        };

        // Reset the modified flag
        setHasModifiedValues(false);

        // Update with empty values
        onChange(emptyValues);
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
                                    onClick: () => setActiveDevice(device.value)
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
