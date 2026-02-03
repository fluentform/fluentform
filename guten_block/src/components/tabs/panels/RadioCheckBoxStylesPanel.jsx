const { useState, useEffect, memo } = wp.element;
const { __ } = wp.i18n;
const { PanelBody, RangeControl } = wp.components;

import { areStylesEqual } from "../../utils/ComponentUtils";
import FluentColorPicker from "../../controls/FluentColorPicker";

const RadioCheckBoxStylesPanel = ({ styles, updateStyles }) => {
    const [localSize, setLocalSize] = useState(styles.radioCheckboxItemsSize || 15);

    useEffect(() => {
        if (styles.radioCheckboxItemsSize !== undefined && styles.radioCheckboxItemsSize !== localSize) {
            setLocalSize(styles.radioCheckboxItemsSize);
        }
    }, [styles.radioCheckboxItemsSize]);

    const handleSizeChange = (value) => {
        setLocalSize(value);
        updateStyles({radioCheckboxItemsSize: value});
    };

    return (
        <PanelBody title={__('Radio & Checkbox Styles')} initialOpen={false}>
            <FluentColorPicker
                label="Items Color"
                value={styles.radioCheckboxItemsColor}
                onChange={(value) => updateStyles({radioCheckboxItemsColor: value})}
                defaultColor=""
            />
            <div className="ffblock-control-field">
                <span className="ffblock-label">Size (px)</span>
                <RangeControl
                    value={localSize}
                    min={1}
                    max={30}
                    step={1}
                    onChange={handleSizeChange}
                />
            </div>
        </PanelBody>
    );
};

export default memo(RadioCheckBoxStylesPanel, (prevProps, nextProps) => {
    return areStylesEqual(prevProps.styles, nextProps.styles, [
        'radioCheckboxItemsColor',
        'radioCheckboxItemsSize'
    ]);
});