const { memo } = wp.element;
const { __ } = wp.i18n;
const { PanelBody } = wp.components;

import FluentTypography from "../../controls/FluentTypography";
import FluentColorPicker from "../../controls/FluentColorPicker";
import { areStylesEqual } from "../../utils/ComponentUtils";

/**
 * Component for label styling options
 */
const LabelStylesPanel = ({ styles, updateStyles }) => {
    return (
        <PanelBody title={__("Label Styles")} initialOpen={false}>
            <FluentColorPicker
                label="Color"
                value={styles.labelColor}
                onChange={(value) => updateStyles({labelColor: value})}
                defaultColor=""
            />
            <FluentTypography
                label="Typography"
                typography={styles.labelTypography || {}}
                onChange={(typography) => updateStyles({ labelTypography: typography })}
            />
        </PanelBody>
    );
};

export default memo(LabelStylesPanel, (prevProps, nextProps) => {
    return areStylesEqual(prevProps.styles, nextProps.styles, [
        'labelColor', 'labelTypography'
    ]);
});