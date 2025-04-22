/**
 * Fluent Forms Border Control Component
 */
import './common.css';

// Import React components
const { useState, useEffect, useRef } = wp.element;
const { __ } = wp.i18n;

// Import WordPress components
const {
    __experimentalBorderBoxControl,
    RangeControl,
    Flex,
    FlexItem,
    Button,
    ButtonGroup,
    TabPanel,
    ToggleControl,
} = wp.components;

// If experimental components are not available, they might not exist in your WordPress version
const BorderBoxControl = __experimentalBorderBoxControl;

/**
 * Fluent Forms Border Control Component
 *
 * @param {Object} props Component props
 * @param {string} props.label Label for the control
 * @param {Object} props.value Current border values for normal state
 * @param {Object} props.hoverValue Current border values for hover state
 * @param {Function} props.onChange Callback when border values change for normal state
 * @param {Function} props.onHoverChange Callback when border values change for hover state
 * @param {Array} props.colors Custom color palette
 * @param {Object} props.defaultBorder Default border settings
 * @param {boolean} props.showRadius Whether to show radius controls
 * @param {boolean} props.showHoverControls Whether to show hover state controls
 * @param {string} props.className Additional CSS class
 * @param {boolean} props.enableCustomBorder Whether custom border is enabled
 * @param {Function} props.onEnableChange Callback when enable/disable toggle changes
 */
const FluentBorderControl = ({
    label = __('Borders'),
    value,
    hoverValue,
    onChange,
    onHoverChange,
    colors = [
        { name: 'Blue 20', color: '#72aee6' },
        { name: 'Red', color: '#e65054' },
        { name: 'Green', color: '#68de7c' },
        { name: 'Yellow', color: '#f2d675' },
        { name: 'Black', color: '#000000' },
    ],
    defaultBorder,
    showRadius = true,
    showHoverControls = true,
    className = '',
    enableCustomBorder = false,
    onEnableChange
}) => {
    // Use the parent's default border if provided, otherwise use our own default
    const fallbackBorder = {
        color: '#72aee6',
        style: 'solid',
        width: '1px',
    };

    // Create default border structure using the provided or fallback border
    const createDefaultBorderStructure = (border) => ({
        top: border,
        right: border,
        bottom: border,
        left: border,
        linked: true,
        radius: {
            topLeft: 0,
            topRight: 0,
            bottomRight: 0,
            bottomLeft: 0,
            linked: true
        }
    });

    // Initialize with the parent's default border or our fallback
    const defaultBorderStructure = createDefaultBorderStructure(defaultBorder || fallbackBorder);

    // State for the enable/disable toggle
    // Initialize isEnabled based on the custom_border flag in the value or the enableCustomBorder prop
    const [isEnabled, setIsEnabled] = useState(value?.custom_border !== undefined ? value.custom_border : enableCustomBorder);

    // Handle toggle for enabling/disabling custom border
    const handleToggle = () => {
        const newEnabledState = !isEnabled;
        setIsEnabled(newEnabledState);
        handleBorderChange();
        console.log('x');
        // Call the parent's onEnableChange callback if provided
        if (onEnableChange) {
            onEnableChange(newEnabledState);
        }

        // Update both normal and hover borders with the new custom_border flag
        if (onChange) {
            // Get current borders or use default if none exist
            const currentBordersData = borders || defaultBorderStructure;

            // Create updated border structure with new custom_border flag
            const updatedBorderStructure = {
                ...currentBordersData,
                custom_border: newEnabledState
            };

            // Update local state immediately
            setBorders(updatedBorderStructure);

            // Notify parent
            onChange(updatedBorderStructure);

            // Also update hover borders if they exist
            if (hoverBorders && onHoverChange) {
                const updatedHoverBorders = {
                    ...hoverBorders,
                    custom_border: newEnabledState
                };
                setHoverBorders(updatedHoverBorders);
                onHoverChange(updatedHoverBorders);
            }

            // Force an immediate update in the editor
            // This is a workaround to ensure the editor re-renders with the new custom_border value
            const event = new Event('input', { bubbles: true });
            document.activeElement.dispatchEvent(event);
        }
    };


    // Initialize borders with custom_border flag if enabled
    const initialBorders = value || defaultBorderStructure;
    const [borders, setBorders] = useState({
        ...initialBorders,
        custom_border: isEnabled
    });

    // Initialize hover borders with custom_border flag if enabled
    const initialHoverBorders = hoverValue || defaultBorderStructure;
    const [hoverBorders, setHoverBorders] = useState({
        ...initialHoverBorders,
        custom_border: isEnabled
    });

    const [activeTab, setActiveTab] = useState('normal');

    // Using refs to prevent the initial render from triggering onChange
    const isInitialNormalMount = useRef(true);
    const isInitialHoverMount = useRef(true);

    // Update parent component when normal borders change
    useEffect(() => {
        // Skip the first render to prevent unnecessary onChange calls
        if (isInitialNormalMount.current) {
            isInitialNormalMount.current = false;
            return;
        }

        // Only call onChange if it exists and borders is defined
        if (onChange && borders) {
            // Ensure the custom_border flag is set based on isEnabled
            const updatedBorders = {
                ...borders,
                custom_border: isEnabled
            };
            onChange(updatedBorders);
        }
    }, [borders, onChange, isEnabled]);

    useEffect(() => {
        // Skip the first render to prevent unnecessary onHoverChange calls
        if (isInitialHoverMount.current) {
            isInitialHoverMount.current = false;
            return;
        }

        // Only call onHoverChange if it exists and hoverBorders is defined
        if (onHoverChange && hoverBorders) {
            // Ensure the custom_border flag is set based on isEnabled
            const updatedHoverBorders = {
                ...hoverBorders,
                custom_border: isEnabled
            };
            onHoverChange(updatedHoverBorders);
        } else if (onHoverChange && !hoverBorders && isEnabled) {
            // If hoverBorders is not defined but isEnabled is true, create a default hover border
            const defaultHoverBorder = {
                ...defaultBorderStructure,
                custom_border: true
            };
            onHoverChange(defaultHoverBorder);
        }
    }, [hoverBorders, onHoverChange, isEnabled, defaultBorderStructure]);

    const getCurrentBorders = () => {
        return activeTab === 'normal' ? borders : hoverBorders;
    };

    const setCurrentBorders = (newBorders) => {
        if (activeTab === 'normal') {
            setBorders(newBorders);
        } else {
            setHoverBorders(newBorders);
        }
    };

    const handleBorderChange = (newBorders) => {
        console.log('y');
        const currentBorders = getCurrentBorders();
        // Preserve radius and linked properties
        const updatedBorders = {
            ...newBorders,
            radius: currentBorders.radius || { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0, linked: true },
            linked: currentBorders.linked !== undefined ? currentBorders.linked : true,
            custom_border: true // Always set this flag to true when borders are changed
        };

        setCurrentBorders(updatedBorders);
    };

    const handleRadiusChange = (newRadius) => {
        const currentBorders = getCurrentBorders();
        const updatedBorders = {
            ...currentBorders,
            radius: newRadius,
            custom_border: true // Always set this flag to true when radius is changed
        };

        setCurrentBorders(updatedBorders);
    };

    const toggleLinkedRadius = () => {
        const currentBorders = getCurrentBorders();
        const radiusValue = currentBorders.radius?.topLeft || 0;

        setCurrentBorders({
            ...currentBorders,
            radius: {
                ...currentBorders.radius,
                linked: !currentBorders.radius?.linked,
                // If linking, set all values to the first one
                ...(currentBorders.radius?.linked ? {} : {
                    topLeft: radiusValue,
                    topRight: radiusValue,
                    bottomRight: radiusValue,
                    bottomLeft: radiusValue
                })
            },
            custom_border: true // Always set this flag to true when radius linking is toggled
        });
    };

    const renderBorderControls = () => {
        const currentBorders = getCurrentBorders();

        return (
            <>
                <BorderBoxControl
                    style={{ marginTop: '16px' }}
                    colors={colors}
                    onChange={handleBorderChange}
                    value={currentBorders}
                />

                {showRadius && (
                    <div className="ffblock-radius-control" style={{ marginTop: '16px' }}>
                        <Flex align="center" justify="space-between" style={{ marginBottom: '8px' }}>
                            <span className="ffblock-radius-label">{__('Radius Control')}</span>
                            <Button
                                icon={currentBorders.radius?.linked ? 'admin-links' : 'editor-unlink'}
                                onClick={toggleLinkedRadius}
                                label={currentBorders.radius?.linked ? __('Unlink sides') : __('Link sides')}
                                isSmall
                            />
                        </Flex>

                        {currentBorders.radius?.linked ? (
                            <RangeControl
                                label={__('Radius')}
                                value={currentBorders.radius?.topLeft || 0}
                                onChange={(value) => {
                                    handleRadiusChange({
                                        ...currentBorders.radius,
                                        topLeft: value,
                                        topRight: value,
                                        bottomRight: value,
                                        bottomLeft: value
                                    });
                                }}
                                min={0}
                                max={100}
                            />
                        ) : (
                            <>
                                <RangeControl
                                    label={__('Top Left')}
                                    value={currentBorders.radius?.topLeft || 0}
                                    onChange={(value) => {
                                        handleRadiusChange({
                                            ...currentBorders.radius,
                                            topLeft: value
                                        });
                                    }}
                                    min={0}
                                    max={100}
                                />
                                <RangeControl
                                    label={__('Top Right')}
                                    value={currentBorders.radius?.topRight || 0}
                                    onChange={(value) => {
                                        handleRadiusChange({
                                            ...currentBorders.radius,
                                            topRight: value
                                        });
                                    }}
                                    min={0}
                                    max={100}
                                />
                                <RangeControl
                                    label={__('Bottom Right')}
                                    value={currentBorders.radius?.bottomRight || 0}
                                    onChange={(value) => {
                                        handleRadiusChange({
                                            ...currentBorders.radius,
                                            bottomRight: value
                                        });
                                    }}
                                    min={0}
                                    max={100}
                                />
                                <RangeControl
                                    label={__('Bottom Left')}
                                    value={currentBorders.radius?.bottomLeft || 0}
                                    onChange={(value) => {
                                        handleRadiusChange({
                                            ...currentBorders.radius,
                                            bottomLeft: value
                                        });
                                    }}
                                    min={0}
                                    max={100}
                                />
                            </>
                        )}
                    </div>
                )}
            </>
        );
    };

    // Main component render with collapsible panels
    return (
        <div className={`ffblock-border-box-control`}>
            <Flex align="center" justify="space-between" className="ffblock-control-header">
                <FlexItem>
                    <span className="ffblock-label">{label || __('Custom Border')}</span>
                </FlexItem>
                <FlexItem>
                    <ToggleControl
                        checked={isEnabled}
                        onChange={() => handleToggle()}
                        label=""
                    />
                </FlexItem>
            </Flex>

            {isEnabled ? (
                <div className="ffblock-border-controls">
                    {showHoverControls ? (
                        <div className="ffblock-state-tabs-container">
                            <TabPanel
                                className="ffblock-state-tabs"
                                activeClass="is-active"
                                onSelect={(tabName) => setActiveTab(tabName)}
                                tabs={[
                                    { name: "normal", title: __("Normal"), className: "ffblock-tab-normal" },
                                    { name: "hover", title: __("Hover"), className: "ffblock-tab-hover" }
                                ]}
                            >
                                {() => renderBorderControls()}
                            </TabPanel>
                        </div>
                    ) : (
                        renderBorderControls()
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default FluentBorderControl;
