/**
 * Fluent Forms Gutenberg Block Tabs Component
 * Manages the tab panel for the block inspector
 */
const { __ } = wp.i18n;
const { TabPanel } = wp.components;
const { Component } = wp.element;

// Import tab content components
import TabGeneral from './TabGeneral';
import TabStyle from './TabStyle';
import TabAdvanced from './TabAdvanced';

class Tabs extends Component {
    render() {
        const { attributes, setAttributes, state } = this.props;

        return (
            <TabPanel
                className="fluent-form-block-style-tabs"
                activeClass="is-active"
                tabs={[
                    { name: 'general', title: __('General'), key: 'general-tab' },
                    { name: 'style', title: __('Style'), key: 'style-tab' },
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
                                    state={state}
                                    handlePresetChange={state.handlePresetChange}
                                    toggleCustomizePreset={state.toggleCustomizePreset}
                                />
                            </div>
                        );
                    } else if (tab.name === 'style') {
                        return (
                            <div key="style-tab-content">
                                <TabStyle
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

export default Tabs;
