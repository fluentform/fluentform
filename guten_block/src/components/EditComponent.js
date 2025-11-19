/**
 * Fluent Forms Gutenberg Block Edit Component
 * Enhanced with custom UX controls
 */
import FluentSeparator from './controls/FluentSeparator';
import StyleHandler from './utils/StyleHandler';
import Tabs from './tabs/Tabs';

const { __ } = wp.i18n;
const { InspectorControls, BlockControls } = wp.blockEditor;
const { serverSideRender: ServerSideRender } = wp;
const { apiFetch } = wp;
const { memo } = wp.element;
const { SelectControl, PanelBody, Spinner, ToolbarGroup, ToolbarButton } = wp.components;
const { useState, useEffect, useRef, useCallback, useMemo } = wp.element;
const { useRefEffect } = wp.compose;

// Function to get form meta
const getFormMeta = async (formId, metaKey) => {
    if (!formId) {
        return;
    }

    const path = `${window.fluentform_block_vars.rest.namespace}/${window.fluentform_block_vars.rest.version}/settings/${formId}?meta_key=${metaKey}`;
    const response = await apiFetch({ path });

    return (response.length && response[0].value) || false;
};

function EditComponent({ attributes, setAttributes }) {
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    
    const styleHandlerRef = useRef(null);
    const currentStylesRef = useRef(attributes.styles || {});
    useEffect(() => {
        currentStylesRef.current = attributes.styles || {};
    }, [attributes.styles]);

    const blockRef = useRefEffect((element) => {
        if (attributes.formId && element) {
            const { ownerDocument } = element;
            styleHandlerRef.current = new StyleHandler(attributes.formId, ownerDocument);
        }
    }, [attributes.formId]);

    const storeCss = useCallback((css) => {
        if (css === false) {
            return;
        }
        css = JSON.stringify(css);
        if (css !== attributes.customCss) {
            setAttributes({ customCss: css });
        }
    }, [attributes.customCss, setAttributes]);

    const updateStyles = useCallback((styleAttributes) => {
        const currentStyles = currentStylesRef.current;
        const styles = { ...currentStyles, ...styleAttributes };
        currentStylesRef.current = styles;
        setAttributes({ styles });
    }, [setAttributes]);

    const checkIfConversationalForm = useCallback(async (formId) => {
        if (!formId) {
            return;
        }

        setIsPreviewLoading(true);

        const isConversationalForm = await getFormMeta(formId, "is_conversion_form");

        setAttributes({
            isConversationalForm: isConversationalForm === "yes",
        });

        setIsPreviewLoading(false);
    }, [setAttributes]);

    const handleFormChange = useCallback((formId) => {
        setIsPreviewLoading(true);
        setAttributes({ formId });

        if (!formId) {
            setAttributes({
                themeStyle: "",
                isConversationalForm: false,
            });
            setIsPreviewLoading(false);
        } else {
            checkIfConversationalForm(formId);
        }
    }, [setAttributes, checkIfConversationalForm]);

    const handlePresetChange = useCallback((newPreset) => {
        setIsPreviewLoading(true);
        setAttributes({ themeStyle: newPreset});

        setTimeout(() => {
            setIsPreviewLoading(false);
        }, 300);
    }, [setAttributes]);

    const serverAttributes = useMemo(() => {
        return {...attributes, styles: {}, customCss: '' };
    }, [attributes.formId, attributes.themeStyle]);

    // Initial setup effect
    useEffect(() => {
        const maybeSetStyle = !attributes.themeStyle && window.fluentform_block_vars?.theme_style;
        const config = window.fluentform_block_vars || {};

        if (maybeSetStyle) {
            setAttributes({
                themeStyle: config.theme_style,
            });
        }

        if (attributes.formId) {
            let formId = attributes.formId;
            const hasForm = config.forms?.find(form => form.id == formId);
            if (!hasForm) {
                formId = config.forms?.find(form => !!form.id)?.id;
                if (!formId) {
                    formId = ''
                }
                setAttributes({ formId : formId });
            }
            if (formId) {
                checkIfConversationalForm(formId);
            }
        }
    }, []); // Only run on mount

    // Handle form ID changes
    useEffect(() => {
        if (styleHandlerRef.current) {
            const css = styleHandlerRef.current.updateStyles(attributes.styles);
            storeCss(css);
        }
    }, [attributes.formId, attributes.styles]);

    const config = window.fluentform_block_vars || {};

    const inspectorControls = (
        <InspectorControls key="ff-inspector-controls">
            <PanelBody title={__('Form Selection')} initialOpen={!attributes.formId}>
                <SelectControl
                    label={__('Select a Form')}
                    value={attributes.formId || ''}
                    options={config.forms?.map(form => ({
                        value: form.id,
                        label: form.title,
                    })) || []}
                    onChange={handleFormChange}
                />
            </PanelBody>

            {attributes.formId && !attributes.isConversationalForm && (
                <Tabs
                    attributes={attributes}
                    updateStyles={updateStyles}
                    handlePresetChange={handlePresetChange}
                />
            )}
        </InspectorControls>
    );

    let mainContent;
    let loadingOverlay = null;

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
        mainContent = (
            <div className="fluent-form-initial-wrapper">
                <div className="fluent-form-logo">
                    {config.logo && <img src={config.logo} alt={__('Fluent Forms Logo')} className="fluent-form-logo-img" />}
                </div>
                <SelectControl
                    label={__('Select a Form')}
                    value=""
                    options={config.forms?.map(form => ({
                        value: form.id,
                        label: form.title,
                    })) || []}
                    onChange={handleFormChange}
                />
                <p style={{ marginTop: '16px', fontSize: '13px', color: '#666' }}>
                    Select a form to display and customize its appearance.
                </p>
            </div>
        );
    } else if (attributes.isConversationalForm === true) {
        mainContent = (
            <div className="fluent-form-conv-demo">
                {config.conversational_demo_img && (
                    <img
                        src={config.conversational_demo_img}
                        alt={__('Fluent Forms Conversational Form')}
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
        mainContent = (
            <div className="fluent-form-preview-wrapper">
                <ServerSideRender
                    key={`ff-preview`}
                    block="fluentfom/guten-block"
                    attributes={serverAttributes}
                />
            </div>
        );
    }

    return (
        <div ref={blockRef} className="fluentform-guten-wrapper">
            { inspectorControls }
            { attributes.formId && (
                <BlockControls>
                    <ToolbarGroup>
                        <ToolbarButton
                            icon="edit"
                            label={ __('Edit Form') }
                            onClick={ () => window.open(`admin.php?page=fluent_forms&route=editor&form_id=${ attributes.formId }`, '_blank', 'noopener') }
                        />
                    </ToolbarGroup>
                </BlockControls>
            ) }
            { mainContent }
            { loadingOverlay }
        </div>
    );
}

export default memo(EditComponent, (prevProps, nextProps) => {
    return prevProps.attributes === nextProps.attributes;
});
