// Import React components
const { useState, useEffect, useRef } = wp.element;
const { __ } = wp.i18n;

// Import styles
import './border-box-control.css';

// Import WordPress components correctly
const {
    __experimentalBorderBoxControl,  // This is the correct import name
    __experimentalBoxControl,        // Native BoxControl for spacing
    RangeControl,
    Flex,
    Button,
    ButtonGroup,
    ColorPalette,
    SelectControl,
    Panel,
    PanelBody,
    PanelRow,
    TabPanel
} = wp.components;

// If experimental components are not available, they might not exist in your WordPress version
const BorderBoxControl = __experimentalBorderBoxControl;
const BoxControl = __experimentalBoxControl;

/**
 * Dynamic Border Box Control Component
 *
 * @param {Object} props Component props
 * @param {string} props.label Label for the control
 * @param {Object} props.value Current border values for normal state
 * @param {Object} props.hoverValue Current border values for hover state
 * @param {Object} props.spacingValue Current spacing values for normal state
 * @param {Object} props.spacingHoverValue Current spacing values for hover state
 * @param {Function} props.onChange Callback when border values change for normal state
 * @param {Function} props.onHoverChange Callback when border values change for hover state
 * @param {Function} props.onSpacingChange Callback when spacing values change for normal state
 * @param {Function} props.onSpacingHoverChange Callback when spacing values change for hover state
 * @param {Array} props.colors Custom color palette
 * @param {Object} props.defaultBorder Default border settings
 * @param {boolean} props.showRadius Whether to show radius controls
 * @param {boolean} props.showBorderControls Whether to show border controls
 * @param {boolean} props.showSpacingControls Whether to show spacing controls
 * @param {boolean} props.showHoverControls Whether to show hover state controls
 * @param {string} props.className Additional CSS class
 */
const MyBorderBoxControl = ({
    label = __('Borders'),
    value,
    hoverValue,
    spacingValue,
    spacingHoverValue,
    onChange,
    onHoverChange,
    onSpacingChange,
    onSpacingHoverChange,
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
    showBorderControls = true,
    showSpacingControls = true,
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

    // Default spacing structure
    const defaultSpacingStructure = {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
    };

    // Initialize spacing state with provided value or defaults
    const [spacing, setSpacing] = useState(spacingValue || defaultSpacingStructure);

    // Initialize hover spacing state with provided value or defaults
    const [hoverSpacing, setHoverSpacing] = useState(spacingHoverValue || defaultSpacingStructure);

    // Track active tab (normal or hover)
    const [activeTab, setActiveTab] = useState('normal');

    // Track active control tab (border or spacing)
    const [activeControlTab, setActiveControlTab] = useState('border');

    // Border styles options
    const borderStyles = [
        { label: __('Solid'), value: 'solid' },
        { label: __('Dashed'), value: 'dashed' },
        { label: __('Dotted'), value: 'dotted' },
        { label: __('Double'), value: 'double' },
        { label: __('Groove'), value: 'groove' },
        { label: __('Ridge'), value: 'ridge' },
        { label: __('Inset'), value: 'inset' },
        { label: __('Outset'), value: 'outset' },
    ];

    // Using refs to prevent the initial render from triggering onChange
    const isInitialNormalMount = useRef(true);
    const isInitialHoverMount = useRef(true);
    const isInitialSpacingMount = useRef(true);
    const isInitialSpacingHoverMount = useRef(true);

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

    // Update parent component when normal spacing changes
    useEffect(() => {
        // Skip the first render to prevent unnecessary onSpacingChange calls
        if (isInitialSpacingMount.current) {
            isInitialSpacingMount.current = false;
            return;
        }

        // Only call onSpacingChange if it exists and spacing is defined
        if (onSpacingChange && spacing) {
            onSpacingChange(spacing);
        }
    }, [spacing, onSpacingChange]);

    // Update parent component when hover spacing changes
    useEffect(() => {
        // Skip the first render to prevent unnecessary onSpacingHoverChange calls
        if (isInitialSpacingHoverMount.current) {
            isInitialSpacingHoverMount.current = false;
            return;
        }

        // Only call onSpacingHoverChange if it exists and hoverSpacing is defined
        if (onSpacingHoverChange && hoverSpacing) {
            onSpacingHoverChange(hoverSpacing);
        }
    }, [hoverSpacing, onSpacingHoverChange]);

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

    // Get the current spacing based on active tab
    const getCurrentSpacing = () => {
        return activeTab === 'normal' ? spacing : hoverSpacing;
    };

    // Set the current spacing based on active tab
    const setCurrentSpacing = (newSpacing) => {
        if (activeTab === 'normal') {
            setSpacing(newSpacing);
        } else {
            setHoverSpacing(newSpacing);
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

    // Toggle linked borders
    const toggleLinkedBorders = () => {
        const currentBorders = getCurrentBorders();
        setCurrentBorders({
            ...currentBorders,
            linked: !currentBorders.linked
        });
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

    // Update a specific border property
    const updateBorderProperty = (property, value, side = null) => {
        const currentBorders = getCurrentBorders();

        if (currentBorders.linked && !side) {
            // Update all sides if linked
            setCurrentBorders({
                ...currentBorders,
                top: { ...currentBorders.top, [property]: value },
                right: { ...currentBorders.right, [property]: value },
                bottom: { ...currentBorders.bottom, [property]: value },
                left: { ...currentBorders.left, [property]: value }
            });
        } else if (side) {
            // Update specific side
            setCurrentBorders({
                ...currentBorders,
                [side]: { ...currentBorders[side], [property]: value }
            });
        }
    };

    // Handle spacing changes
    const handleSpacingChange = (newSpacing) => {
        setCurrentSpacing(newSpacing);
    };

    // Render the border controls based on the current state
    const renderBorderControls = () => {
        const currentBorders = getCurrentBorders();

        if (BorderBoxControl && showBorderControls) {
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
        }

        // Fallback if BorderBoxControl is not available
        return renderFallbackBorderControls();
    };

    // Render the spacing controls based on the current state

    // Render fallback border controls if BorderBoxControl is not available
    const renderFallbackBorderControls = () => {

        // Fallback if BorderBoxControl is not available
        return (
            <PanelBody title={label} initialOpen={true}>
                <Flex align="flex-start" justify="flex-start" style={{ marginBottom: '8px' }}>
                    <ButtonGroup>
                        <Button
                            isPrimary={currentBorders.linked}
                            isSecondary={!currentBorders.linked}
                            onClick={toggleLinkedBorders}
                        >
                            {__('Linked')}
                        </Button>
                        <Button
                            isPrimary={!currentBorders.linked}
                            isSecondary={currentBorders.linked}
                            onClick={toggleLinkedBorders}
                        >
                            {__('Individual')}
                        </Button>
                    </ButtonGroup>
                </Flex>

                {/* Border Style */}
                <PanelRow>
                    <SelectControl
                        label={__('Border Style')}
                        value={currentBorders.top.style}
                        options={borderStyles}
                        onChange={(value) => updateBorderProperty('style', value)}
                    />
                </PanelRow>

                {/* Border Width */}
                <PanelRow>
                    <RangeControl
                        label={__('Border Width')}
                        value={parseInt(currentBorders.top.width) || 0}
                        onChange={(value) => updateBorderProperty('width', `${value}px`)}
                        min={0}
                        max={20}
                    />
                </PanelRow>

                {/* Border Color */}
                <PanelRow>
                    <p>{__('Border Color')}</p>
                    <ColorPalette
                        colors={colors}
                        value={currentBorders.top.color}
                        onChange={(value) => updateBorderProperty('color', value)}
                    />
                </PanelRow>

                {/* Border Radius */}
                {showRadius && (
                    <>
                        <PanelRow>
                            <p style={{ marginTop: '16px', marginBottom: '8px' }}>{__('Border Radius')}</p>
                        </PanelRow>

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
                    </>
                )}
            </PanelBody>
        );
    };

    // Render the content based on active control tab
    const renderActiveControlContent = () => {
        if (activeControlTab === 'border') {
            return renderBorderControls();
        } else if (activeControlTab === 'spacing') {
            return renderSpacingControls();
        }
        return null;
    };

    // Main component render with collapsible panels
    return (
        <div className={`ffblock-border-box-control ${className}`}>
            <PanelBody
                title={__('Border Controls')}
                initialOpen={false}
                onToggle={() => setActiveControlTab('border')}
                className={`ffblock-control-panel ${activeControlTab === 'border' ? 'is-active' : ''}`}
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
                            {() => activeControlTab === 'border' && renderBorderControls()}
                        </TabPanel>
                    </div>
                ) : (
                    activeControlTab === 'border' && renderBorderControls()
                )}
            </PanelBody>

        </div>
    );
};

export default MyBorderBoxControl;
