/**
 * Fluent Forms Gutenberg Block Tabs Component
 * Manages the tab panel for the block inspector
 */
const { __ } = wp.i18n;
const { TabPanel } = wp.components;
const { memo } = wp.element;

// Import tab content components
import TabGeneral from './TabGeneral';
import TabMisc from './TabMisc';
function Tabs({ attributes, setAttributes, updateStyles, handlePresetChange}) {
    return (
        <TabPanel
            className="fluent-form-block-style-tabs"
            activeClass="is-active"
            tabs={[
                { name: 'general', title: __('General'), key: 'general-tab' },
                { name: 'misc', title: __('Misc'), key: 'misc-tab' },
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
                                handlePresetChange={handlePresetChange}
                            />
                        </div>
                    );
                } else if (tab.name === 'misc') {
                    return (
                        <div key="misc-tab-content">
                            <TabMisc
                                attributes={attributes}
                                setAttributes={setAttributes}
                                updateStyles={updateStyles}
                            />
                        </div>
                    );
                }
                return null;
            }}
        </TabPanel>
    );
}

export default memo(Tabs);
