const { memo } = wp.element;
const { __ } = wp.i18n;
const { PanelBody, TabPanel } = wp.components;

import FluentTypography from "../../controls/FluentTypography";
import FluentColorPicker from "../../controls/FluentColorPicker";
import FluentSpaceControl from "../../controls/FluentSpaceControl";
import FluentBorderControl from "../../controls/FluentBorderControl";
import FluentBoxShadowControl from "../../controls/FluentBoxShadowControl";
import { areStylesEqual } from '../../utils/ComponentUtils';

/**
 * Component for input and textarea styling options
 */
const InputStylesPanel = ({ styles, updateStyles }) => {
    return (
        <PanelBody title={__("Input & Textarea")} initialOpen={false}>
            <TabPanel
                className="input-styles-tabs"
                activeClass="is-active"
                tabs={[
                    { name: 'normal', title: __('Normal'), className: 'tab-normal' },
                    { name: 'focus', title: __('Focus'), className: 'tab-focus' },
                ]}
            >
                {(tab) => {
                    if (tab.name === 'normal') {
                        return (
                            <>
                                <FluentColorPicker
                                    key="input-text-color-normal"
                                    label="Text Color"
                                    value={styles?.inputTextColor || ''}
                                    onChange={(value) => {
                                        updateStyles({ inputTextColor: value });
                                    }}
                                    defaultColor=""
                                />

                                <FluentColorPicker
                                    key="input-bg-color-normal"
                                    label="Background Color"
                                    value={styles?.inputBackgroundColor || ''}
                                    onChange={(value) => {
                                        updateStyles({ inputBackgroundColor: value });
                                    }}
                                    defaultColor=""
                                />

                                <FluentTypography
                                    label="Typography"
                                    typography={styles.inputTypography || {}}
                                    onChange={(typography) => updateStyles({ inputTypography: typography })}
                                />

                                <FluentSpaceControl
                                    label="Spacing"
                                    values={styles.inputSpacing}
                                    onChange={(value) => updateStyles({ inputSpacing: value })}
                                />

                                <FluentBorderControl
                                    label={__("Border")}
                                    border={styles.inputBorder || {}}
                                    onChange={(borderObj) => updateStyles({ inputBorder: borderObj })}
                                />

                                <FluentBoxShadowControl
                                    label={__("Box Shadow")}
                                    shadow={styles.inputBoxShadow || {}}
                                    onChange={(shadowObj) => updateStyles({ inputBoxShadow: shadowObj })}
                                />
                            </>
                        );
                    } else if (tab.name === 'focus') {
                        return (
                            <>
                                <FluentColorPicker
                                    key="input-text-color-focus"
                                    label="Text Color"
                                    value={styles.inputTextFocusColor || ''}
                                    onChange={(value) => {
                                        updateStyles({ inputTextFocusColor: value });
                                    }}
                                    defaultColor=""
                                />

                                <FluentColorPicker
                                    key="input-bg-color-focus"
                                    label="Background Color"
                                    value={styles?.inputBackgroundFocusColor || ''}
                                    onChange={(value) => {
                                        updateStyles({ inputBackgroundFocusColor: value });
                                    }}
                                    defaultColor=""
                                />

                                <FluentSpaceControl
                                    label="Spacing"
                                    values={styles.inputFocusSpacing}
                                    onChange={(value) => updateStyles({ inputFocusSpacing: value })}
                                />

                                <FluentBorderControl
                                    label={__("Border")}
                                    border={styles.inputBorderFocus || {}}
                                    onChange={(borderObj) => updateStyles({ inputBorderFocus: borderObj })}
                                />

                                <FluentBoxShadowControl
                                    label={__("Box Shadow")}
                                    shadow={styles.inputBoxShadowFocus || {}}
                                    onChange={(shadowObj) => updateStyles({ inputBoxShadowFocus: shadowObj })}
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

export default memo(InputStylesPanel, (prevProps, nextProps) => {
    return areStylesEqual(prevProps.styles, nextProps.styles, [
        'inputTextColor',
        'inputBackgroundColor',
        'inputTypography',
        'inputSpacing',
        'inputBorder',
        'inputBoxShadow',
        'inputTextFocusColor',
        'inputBackgroundFocusColor',
        'inputFocusSpacing',
        'inputBorderFocus',
        'inputBoxShadowFocus'
    ]);
});