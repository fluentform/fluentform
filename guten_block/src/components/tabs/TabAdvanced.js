/**
 * Fluent Forms Gutenberg Block Advanced Tab Component
 */
const { __ } = wp.i18n;
const {
    PanelBody,
    TextControl,
} = wp.components;

const TabAdvanced = ({ attributes, setAttributes }) => {
    return (
        <>
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
