// Import React components
const { useState, useEffect, useRef } = wp.element;
const { __ } = wp.i18n;

// Import WordPress components
const {
    __experimentalBorderBoxControl,
    RangeControl,
    Flex,
    Button,
    ButtonGroup,
    PanelBody,
    TabPanel
} = wp.components;

// If experimental components are not available, they might not exist in your WordPress version
const BorderBoxControl = __experimentalBorderBoxControl;

/**
 * Dynamic Border Box Control Component
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
 */
const MyBorderBoxControl = ({
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
    defaultBorder = {
        color: '#72aee6',
        style: 'solid',
        width: '1px',
    },
    showRadius = true,
    showHoverControls = true,
    className = ''
}) => {
    // Default border structure
    const defaultBorderStructure = {
        top: defaultBorder,
        right: defaultBorder,
        bottom: defaultBorder,
        left: defaultBorder,
        linked: true,
        radius: {
            topLeft: 0,
            topRight: 0,
            bottomRight: 0,
            bottomLeft: 0,
            linked: true
        }
    };

    // Initialize borders state with provided value or defaults
    const [borders, setBorders] = useState(value || defaultBorderStructure);

    // Initialize hover borders state with provided value or defaults
    const [hoverBorders, setHoverBorders] = useState(hoverValue || defaultBorderStructure);

    // Track active tab (normal or hover)
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
            onChange(borders);
        }
    }, [borders, onChange]);

    // Update parent component when hover borders change
    useEffect(() => {
        // Skip the first render to prevent unnecessary onHoverChange calls
        if (isInitialHoverMount.current) {
            isInitialHoverMount.current = false;
            return;
        }

        // Only call onHoverChange if it exists and hoverBorders is defined
        if (onHoverChange && hoverBorders) {
            onHoverChange(hoverBorders);
        }
    }, [hoverBorders, onHoverChange]);

    // Get the current borders based on active tab
    const getCurrentBorders = () => {
        return activeTab === 'normal' ? borders : hoverBorders;
    };

    // Set the current borders based on active tab
    const setCurrentBorders = (newBorders) => {
        if (activeTab === 'normal') {
            setBorders(newBorders);
        } else {
            setHoverBorders(newBorders);
        }
    };

    // Handle border changes
    const handleBorderChange = (newBorders) => {
        const currentBorders = getCurrentBorders();
        // Preserve radius and linked properties
        const updatedBorders = {
            ...newBorders,
            radius: currentBorders.radius || { topLeft: 0, topRight: 0, bottomRight: 0, bottomLeft: 0, linked: true },
            linked: currentBorders.linked !== undefined ? currentBorders.linked : true
        };

        setCurrentBorders(updatedBorders);
    };

    // Handle radius changes
    const handleRadiusChange = (newRadius) => {
        const currentBorders = getCurrentBorders();
        const updatedBorders = {
            ...currentBorders,
            radius: newRadius
        };

        setCurrentBorders(updatedBorders);
    };

    // Toggle linked radius
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
            }
        });
    };

    // Render the border controls based on the current state
    const renderBorderControls = () => {
        const currentBorders = getCurrentBorders();

        return (
            <>
                <BorderBoxControl
                    colors={colors}
                    label={label}
                    onChange={handleBorderChange}
                    value={currentBorders}
                />

                {showRadius && (
                    <div className="ffblock-radius-control" style={{ marginTop: '16px' }}>
                        <PanelBody title={__('Border Radius')} initialOpen={false}>
                            <Flex align="flex-start" justify="flex-start" style={{ marginBottom: '8px' }}>
                                <ButtonGroup>
                                    <Button
                                        isPrimary={currentBorders.radius?.linked}
                                        isSecondary={!currentBorders.radius?.linked}
                                        onClick={toggleLinkedRadius}
                                    >
                                        {__('Linked')}
                                    </Button>
                                    <Button
                                        isPrimary={!currentBorders.radius?.linked}
                                        isSecondary={currentBorders.radius?.linked}
                                        onClick={toggleLinkedRadius}
                                    >
                                        {__('Individual')}
                                    </Button>
                                </ButtonGroup>
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
                        </PanelBody>
                    </div>
                )}
            </>
        );
    };

    // Main component render with collapsible panels
    return (
        <div className={`ffblock-border-box-control ${className}`}>
            <PanelBody
                title={__('Border Controls')}
                initialOpen={false}
                className="ffblock-control-panel is-active"
            >
                {showHoverControls ? (
                    <div className="ffblock-state-tabs-container">
                        <TabPanel
                            className="ffblock-state-tabs"
                            activeClass="is-active"
                            onSelect={(tabName) => setActiveTab(tabName)}
                            tabs={[
                                { name: 'normal', title: __('Normal'), className: 'ffblock-tab-normal' },
                                { name: 'hover', title: __('Hover'), className: 'ffblock-tab-hover' }
                            ]}
                        >
                            {() => renderBorderControls()}
                        </TabPanel>
                    </div>
                ) : (
                    renderBorderControls()
                )}
            </PanelBody>
        </div>
    );
};

export default MyBorderBoxControl;
