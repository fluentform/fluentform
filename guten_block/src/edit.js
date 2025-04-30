/**
 * Fluent Forms Gutenberg Block Edit Component
 * Enhanced with custom UX controls
 */
import FluentSeparator from './components/controls/FluentSeparator';
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
import FluentBorderControl from './components/controls/FluentBorderControl';


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
            previewDevice: 'desktop',
            updateTimer: null // Add timer state for debouncing
        };

        this.updateStyles = this.updateStyles.bind(this);
    }

    // Method to update styles with debouncing to prevent excessive requests
    updateStyles(styleAttributes) {
        // Special handling for radioCheckboxItemsSize to ensure it's a number
        if ('radioCheckboxItemsSize' in styleAttributes) {
            styleAttributes.radioCheckboxItemsSize = parseInt(styleAttributes.radioCheckboxItemsSize, 10) || 0;
        }

        // Clear any existing timer
        if (this.state.updateTimer) {
            clearTimeout(this.state.updateTimer);
        }

        // Set a new timer to delay the update
        const timer = setTimeout(() => {
            console.log('Updating styles:', styleAttributes);
            const { setAttributes, attributes } = this.props;

            // Create a new object with only the changed attributes
            const updatedAttributes = {};

            // Compare each attribute to see if it actually changed
            Object.keys(styleAttributes).forEach(key => {
                const currentValue = attributes[key];
                const newValue = styleAttributes[key];

                // Special handling for radioCheckboxItemsSize to ensure numeric comparison
                if (key === 'radioCheckboxItemsSize') {
                    if (currentValue !== newValue) {
                        updatedAttributes[key] = newValue;
                    }
                } else {
                    // For other attributes, use JSON.stringify for deep comparison
                    if (JSON.stringify(currentValue) !== JSON.stringify(newValue)) {
                        updatedAttributes[key] = newValue;
                    }
                }
            });

            // Only update if there are actual changes
            if (Object.keys(updatedAttributes).length > 0) {
                console.log('Applying updates:', updatedAttributes);
                setAttributes(updatedAttributes);

                // Set loading state briefly to show user something is happening
                this.setState({ isPreviewLoading: true });

                // Clear loading state after a short delay
                setTimeout(() => {
                    this.setState({ isPreviewLoading: false });
                }, 300);
            }

            // Clear the timer reference
            this.setState({ updateTimer: null });
        }, 300); // 300ms debounce delay

        // Store the timer reference
        this.setState({ updateTimer: timer });
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

    componentDidUpdate(prevProps) {
        const { attributes } = this.props;

        // Check if form ID changed
        if (prevProps.attributes.formId !== attributes.formId && attributes.formId) {
            this.checkIfConversationalForm(attributes.formId);
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
                <PanelBody title={__('Form Selection')} initialOpen={attributes.formId ? false : true}>
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
                        updateStyles={this.updateStyles}
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
        let loadingOverlay = null;

        // Create loading overlay if needed
        if (isPreviewLoading) {
            loadingOverlay = (
                <div className="fluent-form-loading-overlay">
                    <Spinner />
                    <p>Loading form preview...</p>
                    <FluentSeparator style="dotted" className="fluent-separator-sm" />
                </div>
            );
        }

        if (!attributes.formId) {
            // No form selected
            mainContent = (
                <div className="fluent-form-initial-wrapper">
                    <div className="fluent-form-logo">
                        {config.logo && <img src={config.logo} alt="Fluent Forms Logo" className="fluent-form-logo-img" />}
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
                <div className="fluent-form-conv-demo">
                    {config.conversational_demo_img && (
                        <img
                            src={config.conversational_demo_img}
                            alt="Fluent Forms Conversational Form"
                            className="fluent-form-conv-img"
                        />
                    )}
                    <p className="fluent-form-conv-message">
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
            // Create device-specific class for responsive preview
            const deviceClass = `preview-device-${previewDevice}`;

            mainContent = (
                <div className={`fluent-form-preview-wrapper ${deviceClass}`}>
                    {/* Device Preview Controls */}
                    <div className="fluent-form-preview-controls">
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
                {loadingOverlay}
            </div>
        );
    }
}

export default Edit;
