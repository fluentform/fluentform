/**
 * Fluent Forms Gutenberg Block Advanced Tab Component
 */
const { __ } = wp.i18n;
const {
    PanelBody,
    TextControl,
    ToggleControl,
    Flex,
    FlexItem
} = wp.components;

// Import custom components
import FluentSeparator from "../controls/FluentSeparator";

const TabAdvanced = ({ attributes, setAttributes }) => {
    return (
        <>
            <PanelBody title={__('Animation & Effects')} initialOpen={true}>
                <Flex direction="column" gap={4}>
                    <ToggleControl
                        label={__('Enable Hover Transitions')}
                        checked={attributes.enableTransition !== false}
                        onChange={(value) => setAttributes({ enableTransition: value })}
                        help={__('Add smooth transitions when hovering over form elements')}
                    />
                </Flex>
            </PanelBody>


            <PanelBody title={__('Custom CSS')} initialOpen={true}>
                <p>Add custom CSS to further customize your form appearance.</p>
                <TextControl
                    label="CSS Class"
                    value={attributes.customCssClass || ''}
                    onChange={(value) => setAttributes({ customCssClass: value })}
                    help="Add custom CSS class to the form container"
                />
                <div style={{ marginTop: '16px' }}>
                    <label className="ffblock-label">Custom CSS</label>
                    <textarea
                        className="components-textarea-control__input"
                        value={attributes.customCss || ''}
                        onChange={(e) => setAttributes({ customCss: e.target.value })}
                        rows={8}
                        style={{ width: '100%' }}
                        placeholder=".fluent-form .ff-el-form-control {
    /* Your custom styles */
}"
                    />
                </div>
            </PanelBody>
        </>
    );
};

export default TabAdvanced;
