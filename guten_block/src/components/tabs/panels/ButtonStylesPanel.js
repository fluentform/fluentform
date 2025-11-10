const { memo } = wp.element;
const { __ } = wp.i18n;
const { PanelBody, TabPanel, RangeControl } = wp.components;

import FluentTypography from "../../controls/FluentTypography";
import FluentColorPicker from "../../controls/FluentColorPicker";
import FluentSpaceControl from "../../controls/FluentSpaceControl";
import FluentBorderControl from "../../controls/FluentBorderControl";
import FluentBoxShadowControl from "../../controls/FluentBoxShadowControl";
import FluentAlignmentControl from "../../controls/FluentAlignmentControl";
import { areStylesEqual } from "../../utils/ComponentUtils";

/**
 * Component for button styling options
 */
const ButtonStylesPanel = ({ styles, updateStyles }) => {
    return (
        <PanelBody title={__('Button Styles')} initialOpen={false}>
            <div>
                <span className="ffblock-label">{__('Alignment')}</span>
                <FluentAlignmentControl
                    value={styles.buttonAlignment}
                    onChange={(value) => updateStyles({buttonAlignment: value})}
                    options={[
                        { value: 'left', icon: 'editor-alignleft', label: __('Left') },
                        { value: 'center', icon: 'editor-aligncenter', label: __('Center') },
                        { value: 'right', icon: 'editor-alignright', label: __('Right') }
                    ]}
                />
            </div>

            <RangeControl
                label={__('Width (%)')}
                value={styles.buttonWidth}
                onChange={(value) => updateStyles({buttonWidth: value})}
                min={0}
                max={100}
                allowReset
                initialPosition={0}
                help={__('Set to 0 for auto width')}
            />

            <TabPanel
                className="button-styles-tabs"
                activeClass="is-active"
                tabs={[
                    { name: 'normal', title: __('Normal'), className: 'tab-normal' },
                    { name: 'hover', title: __('Hover'), className: 'tab-hover' },
                ]}
            >
                {(tab) => {
                    if (tab.name === 'normal') {
                        return (
                            <>
                                <FluentColorPicker
                                    label="Text Color"
                                    value={styles.buttonColor}
                                    onChange={(value) => updateStyles({buttonColor: value})}
                                    defaultColor="#ffffff"
                                />

                                <FluentColorPicker
                                    label="Background Color"
                                    value={styles.buttonBGColor}
                                    onChange={(value) => updateStyles({buttonBGColor: value})}
                                    defaultColor="#409EFF"
                                />

                                <FluentTypography
                                    label="Typography"
                                    typography={styles.buttonTypography || {}}
                                    onChange={(typography) => updateStyles({ buttonTypography: typography })}
                                />

                                <FluentSpaceControl
                                    label="Padding"
                                    values={styles.buttonPadding}
                                    onChange={(value) => updateStyles({ buttonPadding: value })}
                                />

                                <FluentSpaceControl
                                    label="Margin"
                                    values={styles.buttonMargin}
                                    onChange={(value) => updateStyles({ buttonMargin: value })}
                                />

                                <FluentBoxShadowControl
                                    label={__("Box Shadow")}
                                    shadow={styles.buttonBoxShadow || {}}
                                    onChange={(shadowObj) => updateStyles({ buttonBoxShadow: shadowObj })}
                                />

                                <FluentBorderControl
                                    label={__("Border")}
                                    border={styles.buttonBorder || {}}
                                    onChange={(borderObj) => updateStyles({ buttonBorder: borderObj })}
                                />
                            </>
                        );
                    } else if (tab.name === 'hover') {
                        return (
                            <>
                                <FluentColorPicker
                                    label="Text Color"
                                    value={styles.buttonHoverColor}
                                    onChange={(value) => updateStyles({buttonHoverColor: value})}
                                    defaultColor="#ffffff"
                                />

                                <FluentColorPicker
                                    label="Background Color"
                                    value={styles.buttonHoverBGColor}
                                    onChange={(value) => updateStyles({buttonHoverBGColor: value})}
                                    defaultColor="#66b1ff"
                                />

                                <FluentTypography
                                    label="Typography"
                                    typography={styles.buttonHoverTypography || {}}
                                    onChange={(typography) => updateStyles({ buttonHoverTypography: typography })}
                                />

                                <FluentSpaceControl
                                    label="Padding"
                                    values={styles.buttonHoverPadding}
                                    onChange={(value) => updateStyles({ buttonHoverPadding: value })}
                                />

                                <FluentSpaceControl
                                    label="Margin"
                                    values={styles.buttonHoverMargin}
                                    onChange={(value) => updateStyles({ buttonHoverMargin: value })}
                                />

                                <FluentBoxShadowControl
                                    label={__("Box Shadow")}
                                    shadow={styles.buttonHoverBoxShadow || {}}
                                    onChange={(shadowObj) => updateStyles({ buttonHoverBoxShadow: shadowObj })}
                                />

                                <FluentBorderControl
                                    label={__("Border")}
                                    border={styles.buttonHoverBorder || {}}
                                    onChange={(borderObj) => updateStyles({ buttonHoverBorder: borderObj })}
                                />
                            </>
                        );
                    }
                    return null;
                }}
            </TabPanel>
        </PanelBody>
    );
};

export default memo(ButtonStylesPanel, (prevProps, nextProps) => {
    return areStylesEqual(prevProps.styles, nextProps.styles, [
        'buttonWidth',
        'buttonAlignment',
        'buttonColor',
        'buttonBGColor',
        'buttonTypography',
        'buttonPadding',
        'buttonMargin',
        'buttonBoxShadow',
        'buttonBorder',
        'buttonHoverColor',
        'buttonHoverBGColor',
        'buttonHoverTypography',
        'buttonHoverPadding',
        'buttonHoverMargin',
        'buttonHoverBoxShadow',
        'buttonHoverBorder'
    ]);
});