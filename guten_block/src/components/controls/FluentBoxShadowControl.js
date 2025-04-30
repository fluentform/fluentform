/**
 * Fluent Forms Box Shadow Control Component
 */

// Import custom components
import FluentColorPicker from './FluentColorPicker';

// Import React components
const { useState, useEffect, useMemo } = wp.element;
const { __ } = wp.i18n;

// Import WordPress components
const {
    RangeControl,
    ToggleControl
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

    // Initialize with provided values or defaults
    const [boxShadow, setBoxShadow] = useState(value || defaultBoxShadow);
    const [hoverBoxShadow, setHoverBoxShadow] = useState(hoverValue || defaultBoxShadow);
    const [activeTab, setActiveTab] = useState('normal');

    // Update parent component when box shadow changes
    useEffect(() => {
        if (onChange && boxShadow) {
            onChange(boxShadow);
        }
    }, [boxShadow, onChange]);

    useEffect(() => {
        if (onHoverChange && hoverBoxShadow) {
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

    // Preset shadow options - memoized to prevent recreation on each render
    const shadowPresets = useMemo(() => [
        {
            name: __('Soft'),
            value: {
                horizontal: 0,
                vertical: 4,
                blur: 8,
                spread: 0,
                color: 'rgba(0,0,0,0.1)',
                inset: false,
                enable: true
            }
        },
        {
            name: __('Medium'),
            value: {
                horizontal: 0,
                vertical: 6,
                blur: 12,
                spread: 0,
                color: 'rgba(0,0,0,0.2)',
                inset: false,
                enable: true
            }
        },
        {
            name: __('Hard'),
            value: {
                horizontal: 0,
                vertical: 8,
                blur: 16,
                spread: 0,
                color: 'rgba(0,0,0,0.3)',
                inset: false,
                enable: true
            }
        },
        {
            name: __('Inset'),
            value: {
                horizontal: 0,
                vertical: 4,
                blur: 8,
                spread: 0,
                color: 'rgba(0,0,0,0.2)',
                inset: true,
                enable: true
            }
        }
    ], []);

    const applyPreset = (preset) => {
        setCurrentShadow({
            ...getCurrentShadow(),
            ...preset.value
        });
    };

    const renderShadowControls = () => {
        const currentShadow = getCurrentShadow();

        return (
            <>
                <div className="ffblock-shadow-presets" style={{ marginBottom: '16px' }}>
                    <label className="ffblock-label" style={{ marginBottom: '8px' }}>{__('Presets')}</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {shadowPresets.map((preset, index) => {
                            // Define icon based on preset type


                            return (
                                <button
                                    key={index}
                                    className="components-button is-secondary is-small"
                                    onClick={() => applyPreset(preset)}
                                    style={{
                                        flex: '1 0 auto',
                                        minWidth: '60px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <span style={{ fontSize: '14px', width: '14px', height: '14px' }}></span>
                                    {preset.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="ffblock-shadow-controls">
                    <div >
                        <RangeControl
                            label={__('Horizontal Offset (px)')}
                            value={currentShadow.horizontal}
                            onChange={(value) => handleValueChange('horizontal', value)}
                            min={-50}
                            max={50}
                            step={1}
                            withInputField={true}
                        />
                        <RangeControl
                            label={__('Vertical Offset (px)')}
                            value={currentShadow.vertical}
                            onChange={(value) => handleValueChange('vertical', value)}
                            min={-50}
                            max={50}
                            step={1}
                            withInputField={true}
                        />
                    </div>
                    <div >
                        <RangeControl
                            label={__('Blur Radius (px)')}
                            value={currentShadow.blur}
                            onChange={(value) => handleValueChange('blur', value)}
                            min={0}
                            max={100}
                            step={1}
                            withInputField={true}
                        />
                        <RangeControl
                            label={__('Spread Radius (px)')}
                            value={currentShadow.spread}
                            onChange={(value) => handleValueChange('spread', value)}
                            min={-50}
                            max={50}
                            step={1}
                            withInputField={true}
                        />
                    </div>

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

                <div className="ffblock-shadow-preview" style={{ marginTop: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label className="ffblock-label">{__('Preview')}</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                className="components-button is-small is-secondary"
                                onClick={() => setCurrentShadow({
                                    ...defaultBoxShadow,
                                    enable: currentShadow.enable
                                })}
                                style={{ padding: '2px 8px', fontSize: '11px' }}
                            >
                                {__('Reset')}
                            </button>
                        </div>
                    </div>
                    <div
                        style={{
                            height: '60px',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '4px',
                            boxShadow: currentShadow.enable
                                ? `${currentShadow.inset ? 'inset ' : ''}${currentShadow.horizontal}px ${currentShadow.vertical}px ${currentShadow.blur}px ${currentShadow.spread}px ${currentShadow.color}`
                                : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span style={{ fontSize: '12px', color: '#666' }}>
                            {currentShadow.enable ? __('Shadow Applied') : __('No Shadow')}
                        </span>
                    </div>
                </div>
            </>
        );
    };

    // Main component render
    return (
        <div className="ffblock-box-shadow-control">
            <div className="ffblock-control-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="ffblock-label">{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                        {getCurrentShadow().enable ? __('Enabled') : __('Disabled')}
                    </span>
                    <ToggleControl
                        checked={getCurrentShadow().enable}
                        onChange={handleToggleEnable}
                        label=""
                    />
                </div>
            </div>

            {getCurrentShadow().enable && (
                <div className="ffblock-shadow-content">
                    {showHoverControls ? (
                        <div className="ffblock-state-tabs-container" style={{ marginBottom: '16px' }}>
                            <div className="ffblock-state-tabs" style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', marginBottom: '16px' }}>
                                <button
                                    className={`components-button ${activeTab === 'normal' ? 'is-primary' : ''}`}
                                    onClick={() => setActiveTab('normal')}
                                    style={{
                                        flex: 1,
                                        justifyContent: 'center',
                                        borderBottom: activeTab === 'normal' ? '2px solid #007cba' : '2px solid transparent',
                                        margin: 0,
                                        borderRadius: 0
                                    }}
                                >
                                    {__('Normal')}
                                </button>
                                <button
                                    className={`components-button ${activeTab === 'hover' ? 'is-primary' : ''}`}
                                    onClick={() => setActiveTab('hover')}
                                    style={{
                                        flex: 1,
                                        justifyContent: 'center',
                                        borderBottom: activeTab === 'hover' ? '2px solid #007cba' : '2px solid transparent',
                                        margin: 0,
                                        borderRadius: 0
                                    }}
                                >
                                    {__('Hover')}
                                </button>
                            </div>
                            {renderShadowControls()}
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
