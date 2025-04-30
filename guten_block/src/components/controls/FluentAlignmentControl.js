/**
 * Fluent Forms Alignment Control Component
 */

// Import React components
const { useState, useEffect } = wp.element;
const { __ } = wp.i18n;

// Import WordPress components
const {
    ButtonGroup,
    Button,
    Tooltip
} = wp.components;

/**
 * Fluent Forms Alignment Control Component
 *
 * @param {Object} props Component props
 * @param {string} props.label Label for the control
 * @param {string} props.value Current alignment value
 * @param {Function} props.onChange Callback when alignment changes
 * @param {Array} props.options Alignment options to display
 */
const FluentAlignmentControl = ({
    label = __('Alignment'),
    value = 'left',
    onChange,
    options = [
        { value: 'left', icon: 'editor-alignleft', label: __('Left') },
        { value: 'center', icon: 'editor-aligncenter', label: __('Center') },
        { value: 'right', icon: 'editor-alignright', label: __('Right') }
    ]
}) => {
    const [alignment, setAlignment] = useState(value);

    // Update local state when props change
    useEffect(() => {
        if (value !== alignment) {
            setAlignment(value);
        }
    }, [value]);

    const handleAlignmentChange = (newAlignment) => {
        setAlignment(newAlignment);
        if (onChange) {
            onChange(newAlignment);
        }
    };

    return (
        <div className="ffblock-alignment-control">
            <div className="ffblock-alignment-buttons">
                <ButtonGroup>
                    {options.map((option) => (
                        <Tooltip key={option.value} text={option.label}>
                            <Button
                                icon={option.icon}
                                isPrimary={alignment === option.value}
                                isSecondary={alignment !== option.value}
                                onClick={() => handleAlignmentChange(option.value)}
                                aria-label={option.label}
                            />
                        </Tooltip>
                    ))}
                </ButtonGroup>
            </div>
        </div>
    );
};

export default FluentAlignmentControl;
