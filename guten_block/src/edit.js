/**
 * Fluent Forms Gutenberg Block Edit Component
 * Enhanced with custom UX controls
 */
const { __ } = wp.i18n;
const { InspectorControls } = wp.blockEditor;
const { serverSideRender: ServerSideRender } = wp;
const { apiFetch } = wp;
const {
    SelectControl,
    PanelBody,
    ToggleControl,
    Button,
    Flex,
    FlexItem,
    TextControl,
    ColorPalette,
    Panel,
    Popover,
    RangeControl,
    Dropdown,
    ButtonGroup,
    Icon,
    TabPanel,
    Spinner
} = wp.components;
const { Component, Fragment, useState, useEffect, useRef } = wp.element;
const React = wp.element;

// Import components
import Tabs from './components/tabs/Tabs';
import FluentColorPicker from './components/controls/FluentColorPicker';
import FluentTypography from './components/controls/FluentTypography';
import FluentSpaceControl from './components/controls/FluentSpaceControl';
import MyBorderControl from './components/controls/MyBorderBoxControl';

// Add CSS styles for our controls
const addCustomStyles = () => {
    const style = document.createElement('style');
    style.innerHTML = `

    `;
    document.head.appendChild(style);
};

// Function to get form meta
const getFormMeta = async (formId, metaKey) => {
    if (!formId) {
        return;
    }

    const path = `${window.fluentform_block_vars.rest.namespace}/${window.fluentform_block_vars.rest.version}/settings/${formId}?meta_key=${metaKey}`;
    const response = await apiFetch({ path });

    return (response.length && response[0].value) || false;
};

class Edit extends Component {
    constructor() {
        super(...arguments);
        this.state = {
            customizePreset: false,
            selectedPreset: 'default',
            isPreviewLoading: false,
            showSaveNotice: false,
            previewDevice: 'desktop'
        };

        // Add custom styles when component initializes
        addCustomStyles();
    }

    componentDidMount() {
        const { attributes } = this.props;
        const maybeSetStyle = !attributes.themeStyle && window.fluentform_block_vars?.theme_style;
        const config = window.fluentform_block_vars || {};

        if (maybeSetStyle) {
            this.props.setAttributes({
                themeStyle: config.theme_style,
            });
        }

        // Set initial state based on attributes
        if (attributes.formId) {
            this.checkIfConversationalForm(attributes.formId);

            // Set initial state for customization options
            this.setState({
                customizePreset: attributes.customizePreset || false,
                selectedPreset: attributes.selectedPreset || 'default'
            });
        }
    }

    checkIfConversationalForm = async formId => {
        if (!formId) {
            return;
        }

        this.setState({ isPreviewLoading: true });

        const isConversationalForm = await getFormMeta(
            formId,
            "is_conversion_form"
        );

        this.props.setAttributes({
            isConversationalForm: isConversationalForm === "yes",
        });

        this.setState({ isPreviewLoading: false });
    }

    handleFormChange = formId => {
        this.setState({ isPreviewLoading: true });
        this.props.setAttributes({ formId });

        if (!formId) {
            this.props.setAttributes({
                themeStyle: "",
                isThemeChange: false,
                isConversationalForm: false,
                selectedPreset: 'default',
                customizePreset: false
            });
            this.setState({ isPreviewLoading: false });
        } else {
            this.checkIfConversationalForm(formId);
        }
    }

    handlePresetChange = (selectedPreset) => {
        this.setState({
            selectedPreset,
            isPreviewLoading: true
        });
        this.props.setAttributes({ selectedPreset, isThemeChange: true, });

        // Simulate delay for preview update
        setTimeout(() => {
            this.setState({ isPreviewLoading: false });
        }, 300);

    }

    toggleCustomizePreset = () => {
        const customizePreset = !this.state.customizePreset;
        this.setState({ customizePreset });
        this.props.setAttributes({ customizePreset });
    }


    setPreviewDevice = (device) => {
        this.setState({ previewDevice: device });
    }

    // Tab rendering methods have been moved to separate components

    render() {
        const { attributes, setAttributes } = this.props;
        const { isPreviewLoading, showSaveNotice, previewDevice } = this.state;
        const config = window.fluentform_block_vars || {};
        const presets = config.style_presets;
        // Form selection and style controls in inspector controls
        const inspectorControls = (
            <InspectorControls key="ff-inspector-controls">
                <PanelBody title={__('Form Selection')} initialOpen={true}>
                    <SelectControl
                        label={__('Select a Form')}
                        value={attributes.formId || ''}
                        options={config.forms?.map(form => ({
                            value: form.id,
                            label: form.title,
                            key: `form-${form.id}`
                        })) || []}
                        onChange={this.handleFormChange}
                    />
                </PanelBody>

                {attributes.formId && !attributes.isConversationalForm && (

                    <Tabs
                        attributes={attributes}
                        setAttributes={setAttributes}
                        state={{
                            customizePreset: this.state.customizePreset,
                            selectedPreset: this.state.selectedPreset,
                            handlePresetChange: this.handlePresetChange,
                            toggleCustomizePreset: this.toggleCustomizePreset
                        }}
                    />
                )}
            </InspectorControls>
        );

        // Main content based on selection state
        let mainContent;

        if (isPreviewLoading) {
            mainContent = (
                <div className="fluent-form-loading" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px',
                    backgroundColor: '#f7f7f7',
                    borderRadius: '4px'
                }}>
                    <Spinner />
                    <p style={{ marginTop: '16px' }}>Loading form preview...</p>
                </div>
            );
        } else if (!attributes.formId) {
            // No form selected
            mainContent = (
                <div className="fluent-form-initial-wrapper" style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    backgroundColor: '#f7f7f7',
                    borderRadius: '4px'
                }}>
                    <div className="fluent-form-logo" style={{ marginBottom: '20px' }}>
                        {config.logo && <img src={config.logo} alt="Fluent Forms Logo" style={{ maxWidth: '200px' }} />}
                    </div>
                    <SelectControl
                        label={__('Select a Form')}
                        value=""
                        options={config.forms?.map(form => ({
                            value: form.id,
                            label: form.title,
                            key: `form-select-${form.id}`
                        })) || []}
                        onChange={this.handleFormChange}
                    />
                    <p style={{ marginTop: '16px', fontSize: '13px', color: '#666' }}>
                        Select a form to display and customize its appearance.
                    </p>
                </div>
            );
        } else if (attributes.isConversationalForm === true) {
            // Conversational form selected
            mainContent = (
                <div className="fluent-form-conv-demo" style={{
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: '#f7f7f7',
                    borderRadius: '4px'
                }}>
                    {config.conversational_demo_img && (
                        <img
                            src={config.conversational_demo_img}
                            alt="Fluent Forms Conversational Form"
                            style={{ maxWidth: '100%', height: 'auto' }}
                        />
                    )}
                    <p style={{ marginTop: '16px', fontStyle: 'italic' }}>
                        <strong>
                            {__(
                                "This is a demo preview. The actual Conversational Form will appear on your live page."
                            )}
                        </strong>
                    </p>
                </div>
            );
        } else {
            // Regular form selected - show preview only
            const previewWrapperStyle = {};

            // Apply responsive preview styles
            if (previewDevice === 'tablet') {
                previewWrapperStyle.maxWidth = '768px';
                previewWrapperStyle.margin = '0 auto';
            } else if (previewDevice === 'mobile') {
                previewWrapperStyle.maxWidth = '480px';
                previewWrapperStyle.margin = '0 auto';
            }

            mainContent = (
                <div className="fluent-form-preview-wrapper" style={previewWrapperStyle}>
                    {/* Device Preview Controls */}
                    <div className="fluent-form-preview-controls" style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        gap: '8px'
                    }}>
                        {[
                            { device: 'desktop', icon: 'desktop', label: 'Desktop Preview' },
                            { device: 'tablet', icon: 'tablet', label: 'Tablet Preview' },
                            { device: 'mobile', icon: 'smartphone', label: 'Mobile Preview' }
                        ].map(item => (
                            <Button
                                key={item.device}
                                icon={item.icon}
                                isSmall
                                isPrimary={previewDevice === item.device}
                                onClick={() => this.setPreviewDevice(item.device)}
                                label={item.label}
                            />
                        ))}
                    </div>

                    <ServerSideRender
                        key="ff-preview"
                        block="fluentfom/guten-block"
                        attributes={attributes}
                    />
                </div>
            );
        }

        return (
            <div className="fluentform-guten-wrapper">
                {inspectorControls}
                {mainContent}
            </div>
        );
    }
}

export default Edit;
