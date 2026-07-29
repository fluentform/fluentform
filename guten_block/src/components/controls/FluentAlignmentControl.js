const { useState, useEffect, memo } = wp.element;
const { __ } = wp.i18n;
const { ButtonGroup, Button, Tooltip } = wp.components;
import { arePropsEqual } from '../utils/ComponentUtils';

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

export default memo(FluentAlignmentControl, (prevProps, nextProps) => {
    return arePropsEqual(prevProps, nextProps, ['label', 'value', 'options']);
});
