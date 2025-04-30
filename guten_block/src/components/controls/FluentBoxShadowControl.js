/**
 * Fluent Forms Box Shadow Control Component
 */
import './common.css';
import './FluentBoxShadowControl.css';

// Import custom components
import FluentColorPicker from './FluentColorPicker';

// Import React components
const { useState, useEffect } = wp.element;
const { __ } = wp.i18n;

// Import WordPress components
const {
    RangeControl,
    Flex,
    FlexItem,
    Button,
    TabPanel,
    ToggleControl,
    Popover
} = wp.components;

/**
 * Fluent Forms Box Shadow Control Component
 *
 * @param {Object} props Component props
 * @param {string} props.label Label for the control
 * @param {Object} props.value Current box shadow values for normal state
 * @param {Object} props.hoverValue Current box shadow values for hover state
 * @param {Function} props.onChange Callback when box shadow values change for normal state
 * @param {Function} props.onHoverChange Callback when box shadow values change for hover state
 * @param {Array} props.colors Custom color palette
 * @param {boolean} props.showHoverControls Whether to show hover state controls
 */
const FluentBoxShadowControl = ({
    label = __('Box Shadow'),
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
        { name: 'White', color: '#ffffff' },
    ],
    showHoverControls = true
}) => {
    // Default box shadow structure
    const defaultBoxShadow = {
        horizontal: 0,
        vertical: 0,
        blur: 0,
        spread: 0,
        color: 'rgba(0,0,0,0.5)',
        inset: false,
        enable: false
    };

    // Log the initial values for debugging
    console.log('FluentBoxShadowControl initial values:', { value, hoverValue, colors });

    // Initialize with provided values or defaults
    const [boxShadow, setBoxShadow] = useState(value || defaultBoxShadow);
    const [hoverBoxShadow, setHoverBoxShadow] = useState(hoverValue || defaultBoxShadow);
    const [activeTab, setActiveTab] = useState('normal');

    // Update parent component when box shadow changes
    useEffect(() => {
        if (onChange && boxShadow) {
            console.log('Box shadow updated:', boxShadow);
            onChange(boxShadow);
        }
    }, [boxShadow, onChange]);

    useEffect(() => {
        if (onHoverChange && hoverBoxShadow) {
            console.log('Box shadow hover updated:', hoverBoxShadow);
            onHoverChange(hoverBoxShadow);
        }
    }, [hoverBoxShadow, onHoverChange]);

    // Update local state when props change
    useEffect(() => {
        if (value) {
            // Ensure color is properly set
            const updatedValue = {
                ...defaultBoxShadow,
                ...value,
                color: value.color || defaultBoxShadow.color
            };
            setBoxShadow(updatedValue);
        }
    }, [value]);

    useEffect(() => {
        if (hoverValue) {
            // Ensure color is properly set
            const updatedValue = {
                ...defaultBoxShadow,
                ...hoverValue,
                color: hoverValue.color || defaultBoxShadow.color
            };
            setHoverBoxShadow(updatedValue);
        }
    }, [hoverValue]);

    // No need for event listeners as FluentColorPicker handles its own state

    const getCurrentShadow = () => {
        return activeTab === 'normal' ? boxShadow : hoverBoxShadow;
    };

    const setCurrentShadow = (newShadow) => {
        if (activeTab === 'normal') {
            setBoxShadow(newShadow);
        } else {
            setHoverBoxShadow(newShadow);
        }
    };

    const handleToggleEnable = () => {
        const currentShadow = getCurrentShadow();
        setCurrentShadow({
            ...currentShadow,
            enable: !currentShadow.enable
        });
    };

    const handleToggleInset = () => {
        const currentShadow = getCurrentShadow();
        setCurrentShadow({
            ...currentShadow,
            inset: !currentShadow.inset
        });
    };

    const handleValueChange = (property, value) => {
        const currentShadow = getCurrentShadow();
        setCurrentShadow({
            ...currentShadow,
            [property]: value
        });
    };

    const handleColorChange = (color) => {
        // The FluentColorPicker now returns either a hex color or rgba string
        // We can directly use this value for the shadow color
        handleValueChange('color', color);
    };

    const renderShadowControls = () => {
        const currentShadow = getCurrentShadow();

        return (
            <>
                <div className="ffblock-shadow-controls">
                    <RangeControl
                        label={__('Horizontal Offset (px)')}
                        value={currentShadow.horizontal}
                        onChange={(value) => handleValueChange('horizontal', value)}
                        min={-50}
                        max={50}
                    />
                    <RangeControl
                        label={__('Vertical Offset (px)')}
                        value={currentShadow.vertical}
                        onChange={(value) => handleValueChange('vertical', value)}
                        min={-50}
                        max={50}
                    />
                    <RangeControl
                        label={__('Blur Radius (px)')}
                        value={currentShadow.blur}
                        onChange={(value) => handleValueChange('blur', value)}
                        min={0}
                        max={100}
                    />
                    <RangeControl
                        label={__('Spread Radius (px)')}
                        value={currentShadow.spread}
                        onChange={(value) => handleValueChange('spread', value)}
                        min={-50}
                        max={50}
                    />

                    <FluentColorPicker
                        label={__('Shadow Color')}
                        value={currentShadow.color || 'rgba(0,0,0,0.5)'}
                        onChange={handleColorChange}
                        defaultColor="rgba(0,0,0,0.5)"
                        colors={colors}
                    />

                    <ToggleControl
                        label={__('Inset Shadow')}
                        checked={currentShadow.inset}
                        onChange={handleToggleInset}
                    />
                </div>

                <div className="ffblock-shadow-preview" style={{ marginTop: '16px' }}>
                    <label className="ffblock-label">{__('Preview')}</label>
                    <div
                        style={{
                            height: '60px',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '4px',
                            boxShadow: currentShadow.enable
                                ? `${currentShadow.inset ? 'inset ' : ''}${currentShadow.horizontal}px ${currentShadow.vertical}px ${currentShadow.blur}px ${currentShadow.spread}px ${currentShadow.color}`
                                : 'none'
                        }}
                    />
                </div>
            </>
        );
    };

    // Main component render
    return (
        <div className="ffblock-box-shadow-control">
            <Flex align="center" justify="space-between" className="ffblock-control-header">
                <FlexItem>
                    <span className="ffblock-label">{label}</span>
                </FlexItem>
                <FlexItem>
                    <ToggleControl
                        checked={getCurrentShadow().enable}
                        onChange={handleToggleEnable}
                        label=""
                    />
                </FlexItem>
            </Flex>

            {getCurrentShadow().enable && (
                <div className="ffblock-shadow-content">
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
                                {() => renderShadowControls()}
                            </TabPanel>
                        </div>
                    ) : (
                        renderShadowControls()
                    )}
                </div>
            )}
        </div>
    );
};

export default FluentBoxShadowControl;
