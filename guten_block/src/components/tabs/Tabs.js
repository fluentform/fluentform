/**
 * Fluent Forms Gutenberg Block Tabs Component
 * Manages the tab panel for the block inspector
 */
const { __ } = wp.i18n;
const { TabPanel } = wp.components;
const { Component, memo, PureComponent } = wp.element;

// Import tab content components
import TabGeneral from './TabGeneral';
import TabAdvanced from './TabAdvanced';
import TabMisc from './TabMisc';
import { arePropsEqual } from '../utils/ComponentUtils';

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
                    { name: 'advanced', title: __('Advanced'), key: 'advanced-tab' },
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
                    } else if (tab.name === 'advanced') {
                        return (
                            <div key="advanced-tab-content">
                                <TabAdvanced
                                    attributes={attributes}
                                    setAttributes={setAttributes}
                                />
                            </div>
                        );
                    }  else if (tab.name === 'misc') {
                        return (
                            <div key="misc-tab-content">
                                <TabMisc
                                    attributes={attributes}
                                    setAttributes={setAttributes}
                                    updateStyles={updateStyles}
                                    state={state}
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

export default memo(Tabs, (prevProps, nextProps) => {
    return arePropsEqual(prevProps, nextProps, [], true);
});
