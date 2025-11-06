const { __ } = wp.i18n;
const { PanelBody, SelectControl } = wp.components;
const { memo } = wp.element;

/**
 * Component for form style template selection
 */
const StyleTemplatePanel = ({ attributes, setAttributes, handlePresetChange }) => {
    const config = window.fluentform_block_vars;
    const presets = config.style_presets;

    return (
      <PanelBody title={__("Form Style Template")} initialOpen={true}>
          <SelectControl
            label={__("Choose a Template")}
            value={attributes.themeStyle}
            options={presets}
            onChange={themeStyle => {
                setAttributes({
                    themeStyle,
                    isThemeChange: true,
                });
                if (handlePresetChange) {
                    handlePresetChange(themeStyle);
                }
            }}
            __next36pxDefaultSize={true}
            __nextHasNoMarginBottom={true}
          />
      </PanelBody>
    );
};

export default memo(StyleTemplatePanel, (prevProps, nextProps) => {
    return prevProps.attributes.themeStyle === nextProps.attributes.themeStyle;
});