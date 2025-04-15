/**
 * Fluent Forms Custom Space/Margin/Padding Control
 */
const {
    Button,
    ButtonGroup,
    TextControl
} = wp.components;
const { useState, useEffect } = wp.element;

// Custom Space/Margin/Padding Control
const FluentSpaceControl = ({ label, values, onChange, units = [{ value: 'px', key: 'px-unit' }, { value: 'em', key: 'em-unit' }, { value: '%', key: 'percent-unit' }] }) => {
    const [isLinked, setIsLinked] = useState(true);
    const [activeUnit, setActiveUnit] = useState('px');
    const [activeDevice, setActiveDevice] = useState('desktop');

    // Default values structure
    const defaultValues = {
        desktop: { unit: 'px', top: 0, right: 0, bottom: 0, left: 0, linked: true },
        tablet: { unit: 'px', top: 0, right: 0, bottom: 0, left: 0, linked: true },
        mobile: { unit: 'px', top: 0, right: 0, bottom: 0, left: 0, linked: true }
    };

    const currentValues = values || defaultValues;

    // Set initial state from props
    useEffect(() => {
        if (currentValues[activeDevice]) {
            setIsLinked(currentValues[activeDevice].linked !== false);
            setActiveUnit(currentValues[activeDevice].unit || 'px');
        }
    }, [activeDevice]);

    const handleUnitChange = (unit) => {
        setActiveUnit(unit);
        updateValues({
            ...currentValues[activeDevice],
            unit
        });
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
        onChange({
            ...currentValues,
            [activeDevice]: newDeviceValues
        });
    };

    const handleValueChange = (position, value) => {
        const numValue = value === '' ? 0 : parseInt(value);

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

    return (
        <div className="ffblock-control-field ffblock-control-space">
            <div className="ffblock-space-header">
                <span className="ffblock-label">{label}</span>

                <div className="ffblock-space-controls">
                    <div className="ffblock-device-selector">
                        {[
                            { device: 'desktop', icon: 'desktop' },
                            { device: 'tablet', icon: 'tablet' },
                            { device: 'mobile', icon: 'smartphone' }
                        ].map(item => (
                            <Button
                                key={item.device}
                                icon={item.icon}
                                isSmall
                                isPrimary={activeDevice === item.device}
                                onClick={() => setActiveDevice(item.device)}
                            />
                        ))}
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

            <div className="ffblock-space-inputs">
                <div className="ffblock-space-input-row">
                    <TextControl
                        type="number"
                        value={deviceValues.top}
                        onChange={(value) => handleValueChange('top', value)}
                        min={0}
                    />
                    <TextControl
                        type="number"
                        value={deviceValues.right}
                        onChange={(value) => handleValueChange('right', value)}
                        min={0}
                    />
                    <TextControl
                        type="number"
                        value={deviceValues.bottom}
                        onChange={(value) => handleValueChange('bottom', value)}
                        min={0}
                    />
                    <TextControl
                        type="number"
                        value={deviceValues.left}
                        onChange={(value) => handleValueChange('left', value)}
                        min={0}
                    />
                    <Button
                        icon={isLinked ? 'admin-links' : 'editor-unlink'}
                        onClick={toggleLinked}
                        className="ffblock-linked-button"
                    />
                </div>
                <div className="ffblock-space-labels">
                    <span key="label-top">TOP</span>
                    <span key="label-right">RIGHT</span>
                    <span key="label-bottom">BOTTOM</span>
                    <span key="label-left">LEFT</span>
                </div>
            </div>
        </div>
    );
};

export default FluentSpaceControl;
