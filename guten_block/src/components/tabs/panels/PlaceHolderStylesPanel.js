const { memo } = wp.element;
const { __ } = wp.i18n;
const { PanelBody } = wp.components;

import FluentTypography from "../../controls/FluentTypography";
import FluentColorPicker from "../../controls/FluentColorPicker";
import { areStylesEqual } from '../../utils/ComponentUtils';

/**
 * Component for placeholder styling options
 */
const PlaceHolderStylesPanel = ({ styles, updateStyles }) => {
    return (
        <PanelBody title={__('Placeholder Styles')} initialOpen={false}>
            <FluentColorPicker
                label="Text Color"
                value={styles.placeholderColor}
                onChange={(value) => updateStyles({placeholderColor: value})}
                defaultColor=""
            />
            <FluentTypography
                label="Typography"
                typography={styles.placeholderTypography || {}}
                onChange={(typography) => updateStyles({ placeholderTypography: typography })}
            />
        </PanelBody>
    );
};

export default memo(PlaceHolderStylesPanel, (prevProps, nextProps) => {
    return areStylesEqual(prevProps.styles, nextProps.styles, [
        'placeholderColor',
        'placeholderTypography'
    ]);
});