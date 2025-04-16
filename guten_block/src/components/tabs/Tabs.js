/**
 * Fluent Forms Gutenberg Block Tabs Component
 * Manages the tab panel for the block inspector
 */
const { __ } = wp.i18n;
const { TabPanel } = wp.components;
const { Component, memo, PureComponent } = wp.element;

// Import tab content components
import TabGeneral from './TabGeneral';
import TabMisc from './TabMisc';
import TabAdvanced from './TabAdvanced';

// Use PureComponent to automatically implement shouldComponentUpdate
class Tabs extends PureComponent {
    render() {
        const { attributes, setAttributes, updateStyles, state } = this.props;

        return (
            <TabPanel
                className="fluent-form-block-style-tabs"
                activeClass="is-active"
                tabs={[
                    { name: 'general', title: __('General'), key: 'general-tab' },
                    { name: 'misc', title: __('Misc'), key: 'misc-tab' },
                    { name: 'advanced', title: __('Advanced'), key: 'advanced-tab' }
                ]}
            >
                {(tab) => {
                    if (tab.name === 'general') {
                        return (
                            <div key="general-tab-content">
                                <TabGeneral
                                    attributes={attributes}
                                    setAttributes={setAttributes}
                                    updateStyles={updateStyles}
                                    state={state}
                                    handlePresetChange={state.handlePresetChange}
                                    toggleCustomizePreset={state.toggleCustomizePreset}
                                />
                            </div>
                        );
                    } else if (tab.name === 'misc') {
                        return (
                            <div key="style-tab-content">
                                <TabMisc
                                    attributes={attributes}
                                    setAttributes={setAttributes}
                                />
                            </div>
                        );
                    } else if (tab.name === 'advanced') {
                        return (
                            <div key="advanced-tab-content">
                                <TabAdvanced
                                    attributes={attributes}
                                    setAttributes={setAttributes}
                                />
                            </div>
                        );
                    }
                    return null;
                }}
            </TabPanel>
        );
    }
}

// Use memo to prevent unnecessary re-renders
export default memo(Tabs, (prevProps, nextProps) => {
    // Only re-render if specific props have changed
    const { attributes: prevAttrs, state: prevState } = prevProps;
    const { attributes: nextAttrs, state: nextState } = nextProps;

    // Check if state props have changed
    if (prevState.customizePreset !== nextState.customizePreset ||
        prevState.selectedPreset !== nextState.selectedPreset) {
        return false; // Props are not equal, should update
    }

    // List of attributes to check for changes
    const attrsToCheck = [
        'formId', 'themeStyle', 'labelColor', 'inputTAColor', 'inputTABGColor',
        'buttonColor', 'buttonBGColor', 'buttonHoverColor', 'buttonHoverBGColor',
        'labelTypo', 'inputTATypo', 'inputSpacing', 'inputBorder', 'inputBorderHover'
    ];

    // Check if any of these attributes have changed
    for (const attr of attrsToCheck) {
        if (JSON.stringify(prevAttrs[attr]) !== JSON.stringify(nextAttrs[attr])) {
            return false; // Props are not equal, should update
        }
    }

    return true; // Props are equal, no need to update
});
