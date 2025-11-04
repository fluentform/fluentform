/**
 * Fluent Forms Gutenberg Block Misc Tab Component
 */
const { useState, useEffect, memo } = wp.element;
const { __ } = wp.i18n;
const { PanelBody, SelectControl, RangeControl, Button, BaseControl, FontSizePicker } = wp.components;

// Import custom components
import FluentColorPicker from "../controls/FluentColorPicker";
import FluentSpaceControl from "../controls/FluentSpaceControl";
import FluentAlignmentControl from "../controls/FluentAlignmentControl";
import FluentTypography from "../controls/FluentTypography";
import FluentSeparator from "../controls/FluentSeparator";
import FluentUnitControl from "../controls/FluentUnitControl";
import FluentBoxShadowControl from "../controls/FluentBoxShadowControl";
import FluentBorderControl from "../controls/FluentBorderControl";
import { getUpdatedTypography } from "../utils/TypographyUtils";
import { arePropsEqual } from '../utils/ComponentUtils';

// Constants
const DEFAULT_COLORS = [
    { name: 'Theme Blue', color: '#72aee6' },
    { name: 'Theme Red', color: '#e65054' },
    { name: 'Theme Green', color: '#68de7c' },
    { name: 'Black', color: '#000000' },
    { name: 'White', color: '#ffffff' },
    { name: 'Gray', color: '#dddddd' }
];

/**
 * Main TabMisc component
 */
const TabMisc = ({ attributes, setAttributes, updateStyles, state }) => {
    // Use local state for background type to ensure UI updates immediately
    const [localBgType, setLocalBgType] = useState(attributes.styles.backgroundType || 'classic');
    // Add local state for background image to ensure immediate UI update
    const [localBgImage, setLocalBgImage] = useState(attributes.styles.backgroundImage || '');

    const handleTypographyChange = (changedTypo, key) => {
        const updatedTypography = getUpdatedTypography(
          changedTypo,
          attributes,
          key
        );

        updateStyles({ [key]: updatedTypography });
    };

    // Update local state when attributes change
    useEffect(() => {
        if (attributes.styles.backgroundType !== undefined && attributes.styles.backgroundType !== localBgType) {
            setLocalBgType(attributes.styles.backgroundType);
        }
    }, [attributes.styles.backgroundType]);

    // Sync local background image state with attributes
    useEffect(() => {
        if (attributes.styles.backgroundImage !== localBgImage) {
            setLocalBgImage(attributes.styles.backgroundImage || '');
        }
    }, [attributes.styles.backgroundImage]);

    // Handle background type change
    const handleBackgroundTypeChange = (value) => {
        setLocalBgType(value);
        updateStyles({ backgroundType: value });
    };

    // Handle media upload
    const uploadBackgroundImage = () => {
        const mediaUploader = wp.media({
            title: __('Select Background Image'),
            button: { text: __('Use this image') },
            multiple: false,
            library: { type: 'image' }
        });

        mediaUploader.on('select', function() {
            const attachment = mediaUploader.state().get('selection').first().toJSON();
            setLocalBgImage(attachment.url);

            if (typeof setAttributes === 'function') {
                setAttributes({
                    backgroundImage: attachment.url,
                    backgroundImageId: attachment.id
                });
            }

            // Also call updateStyles as backup
            updateStyles({
                backgroundImage: attachment.url,
                backgroundImageId: attachment.id
            });

        });

        mediaUploader.open();
    };

    // Handle media removal
    const removeBackgroundImage = () => {
        console.log('Removing background image');

        // Clear local state immediately
        setLocalBgImage('');

        if (typeof setAttributes === 'function') {
            setAttributes({
                backgroundImage: '',
                backgroundImageId: 0
            });
        }

        updateStyles({
            backgroundImage: '',
            backgroundImageId: 0
        });
    };

    // Use local state for conditional rendering
    const currentBgImage = localBgImage || attributes.styles.backgroundImage;

    return (
      <>
          {/* Container Styles Panel */}
          <PanelBody title={__("Container Styles")} initialOpen={false}>
              {/* Background Type Selector */}
              <div className="ffblock-control-field">
                  <strong className="ffblock-label">{__("Background Type")}</strong>
                  <div className="ffblock-radio-options" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <Button
                        isPrimary={localBgType === 'classic'}
                        isSecondary={localBgType !== 'classic'}
                        onClick={() => handleBackgroundTypeChange('classic')}
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                          {__('Classic')}
                      </Button>
                      <Button
                        isPrimary={localBgType === 'gradient'}
                        isSecondary={localBgType !== 'gradient'}
                        onClick={() => handleBackgroundTypeChange('gradient')}
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                          {__('Gradient')}
                      </Button>
                  </div>
              </div>

              {/* Conditional UI based on background type */}
              {localBgType === 'classic' && (
                <div className="ffblock-control-field">
                    <div className="ffblock-media-upload">
                        <span className="ffblock-label">{__('Background Image')}</span>


                        {!currentBgImage ? (
                          <Button
                            className="ffblock-upload-button"
                            icon="upload"
                            onClick={uploadBackgroundImage}
                          >
                              {__('Upload Media')}
                          </Button>
                        ) : (
                          <div className="ffblock-image-preview" style={{ marginTop: '8px' }}>
                              <div
                                style={{
                                    backgroundImage: `url(${currentBgImage})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    height: '120px',
                                    width: '100%',
                                    borderRadius: '4px',
                                    position: 'relative',
                                    marginBottom: '8px',
                                    border: '1px solid #ddd'
                                }}
                              >
                                  <Button
                                    icon="no-alt"
                                    onClick={removeBackgroundImage}
                                    isDestructive
                                    style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        background: 'rgba(0,0,0,0.7)',
                                        color: 'white',
                                        borderRadius: '50%',
                                        padding: '4px',
                                        minWidth: 'auto',
                                        height: '28px',
                                        width: '28px'
                                    }}
                                  />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                  <Button
                                    isSecondary
                                    onClick={uploadBackgroundImage}
                                  >
                                      {__('Replace Image')}
                                  </Button>
                              </div>
                          </div>
                        )}
                    </div>

                    {/* Background Size */}
                    {currentBgImage && (
                      <div style={{ marginTop: '16px' }}>
                          <SelectControl
                            label={__("Background Size")}
                            value={attributes.styles.backgroundSize || 'cover'}
                            options={[
                                { label: __("Cover"), value: 'cover' },
                                { label: __("Contain"), value: 'contain' },
                                { label: __("Auto"), value: 'auto' }
                            ]}
                            onChange={(value) => updateStyles({ backgroundSize: value })}
                          />

                          <SelectControl
                            label={__("Background Position")}
                            value={attributes.styles.backgroundPosition || 'center center'}
                            options={[
                                { label: __("Center Center"), value: 'center center' },
                                { label: __("Center Top"), value: 'center top' },
                                { label: __("Center Bottom"), value: 'center bottom' },
                                { label: __("Left Center"), value: 'left center' },
                                { label: __("Left Top"), value: 'left top' },
                                { label: __("Left Bottom"), value: 'left bottom' },
                                { label: __("Right Center"), value: 'right center' },
                                { label: __("Right Top"), value: 'right top' },
                                { label: __("Right Bottom"), value: 'right bottom' }
                            ]}
                            onChange={(value) => updateStyles({ backgroundPosition: value })}
                          />

                          <SelectControl
                            label={__("Background Repeat")}
                            value={attributes.styles.backgroundRepeat || 'no-repeat'}
                            options={[
                                { label: __("No Repeat"), value: 'no-repeat' },
                                { label: __("Repeat"), value: 'repeat' },
                                { label: __("Repeat X"), value: 'repeat-x' },
                                { label: __("Repeat Y"), value: 'repeat-y' }
                            ]}
                            onChange={(value) => updateStyles({ backgroundRepeat: value })}
                          />
                      </div>
                    )}
                </div>
              )}

              {localBgType === 'gradient' && (
                <div>
                    <span className="ffblock-label">{__('Background Gradient')}</span>
                    <div className="ffblock-bg-gradient">
                        <FluentColorPicker
                          label={__("Primary Color")}
                          value={attributes.styles.gradientColor1 || ''}
                          onChange={(value) => updateStyles({ gradientColor1: value })}
                          defaultColor=""
                        />

                        <FluentColorPicker
                          label={__("Secondary Color")}
                          value={attributes.styles.gradientColor2 || ''}
                          onChange={(value) => updateStyles({ gradientColor2: value })}
                          defaultColor=""
                        />

                        <SelectControl
                          label={__("Gradient Type")}
                          value={attributes.styles.gradientType || 'linear'}
                          options={[
                              { label: __("Linear"), value: 'linear' },
                              { label: __("Radial"), value: 'radial' }
                          ]}
                          onChange={(value) => updateStyles({ gradientType: value })}
                        />

                        {attributes.styles.gradientType === 'linear' && (
                          <RangeControl
                            label={__("Gradient Angle (°)")}
                            value={attributes.styles.gradientAngle || 90}
                            onChange={(value) => updateStyles({ gradientAngle: value })}
                            min={0}
                            max={360}
                          />
                        )}
                    </div>
                </div>
              )}

              {/* Background Color - shown for both modes */}
              <FluentColorPicker
                label={__("Background Color")}
                value={attributes.styles.backgroundColor || ''}
                onChange={(value) => updateStyles({ backgroundColor: value })}
                defaultColor=""
              />

              {/* Padding */}
              <FluentSpaceControl
                label={__("Padding")}
                values={attributes.styles.containerPadding}
                onChange={(value) => updateStyles({ containerPadding: value })}
              />

              {/* Margin */}
              <FluentSpaceControl
                label={__("Margin")}
                values={attributes.styles.containerMargin}
                onChange={(value) => updateStyles({ containerMargin: value })}
              />

              {/* Box Shadow Control */}
              <FluentSeparator label={__("Box Shadow")} />

              {/* Box Shadow Checkbox */}
              <FluentBoxShadowControl
                label={__("Box Shadow")}
                enabled={attributes.styles.enableBoxShadow || false}
                onToggle={(value) => {
                    if (value) {
                        updateStyles({
                            enableBoxShadow: value,
                            boxShadowColor: attributes.styles.boxShadowColor || 'rgba(0,0,0,0.5)',
                            boxShadowPosition: attributes.styles.boxShadowPosition || 'outline',
                            boxShadowHorizontal: attributes.styles.boxShadowHorizontal || '0',
                            boxShadowHorizontalUnit: attributes.styles.boxShadowHorizontalUnit || 'px',
                            boxShadowVertical: attributes.styles.boxShadowVertical || '0',
                            boxShadowVerticalUnit: attributes.styles.boxShadowVerticalUnit || 'px',
                            boxShadowBlur: attributes.styles.boxShadowBlur || '5',
                            boxShadowBlurUnit: attributes.styles.boxShadowBlurUnit || 'px',
                            boxShadowSpread: attributes.styles.boxShadowSpread || '0',
                            boxShadowSpreadUnit: attributes.styles.boxShadowSpreadUnit || 'px'
                        });
                    } else {
                        updateStyles({ containerBoxShadow: value });
                    }
                }}
                color={attributes.styles.containerBoxShadow?.color || ''}
                onColorChange={(value) => updateStyles({ containerBoxShadow: { ...attributes.styles.containerBoxShadow, color: value } })}
                position={attributes.styles.containerBoxShadow?.position || 'outline'}
                onPositionChange={(value) => updateStyles({ containerBoxShadow: { ...attributes.styles.containerBoxShadow, position: value } })}
                horizontal={attributes.styles.containerBoxShadow?.horizontal.value || ''}
                onHorizontalChange={(value) => updateStyles({ containerBoxShadow: { ...attributes.styles.containerBoxShadow, horizontal: { value } } })}
                horizontalUnit={attributes.styles.containerBoxShadow?.horizontal.unit || 'px'}
                onHorizontalUnitChange={(value) => updateStyles({ boxShadowHorizontalUnit: value })}
                vertical={attributes.styles.boxShadowVertical}
                onVerticalChange={(value) => updateStyles({ boxShadowVertical: value })}
                verticalUnit={attributes.styles.boxShadowVerticalUnit}
                onVerticalUnitChange={(value) => updateStyles({ boxShadowVerticalUnit: value })}
                blur={attributes.styles.boxShadowBlur}
                onBlurChange={(value) => updateStyles({ boxShadowBlur: value })}
                blurUnit={attributes.styles.boxShadowBlurUnit}
                onBlurUnitChange={(value) => updateStyles({ boxShadowBlurUnit: value })}
                spread={attributes.styles.boxShadowSpread}
                onSpreadChange={(value) => updateStyles({ boxShadowSpread: value })}
                spreadUnit={attributes.styles.boxShadowSpreadUnit}
                onSpreadUnitChange={(value) => updateStyles({ boxShadowSpreadUnit: value })}
              />

              {/* Form Border Settings */}
              <FluentSeparator label={__("Form Border Settings")} />

              {/* Form Border Checkbox */}
              <FluentBorderControl
                label={__("Form Border")}
                enabled={attributes.styles.enableFormBorder || false}
                onToggle={(value) => updateStyles({ enableFormBorder: value })}
                borderType={attributes.styles.borderType}
                onBorderTypeChange={(value) => updateStyles({ borderType: value })}
                borderColor={attributes.styles.borderColor}
                onBorderColorChange={(value) => updateStyles({ borderColor: value })}
                borderWidth={attributes.styles.borderWidth}
                onBorderWidthChange={(value) => updateStyles({ borderWidth: value })}
                borderRadius={attributes.styles.borderRadius}
                onBorderRadiusChange={(value) => updateStyles({ borderRadius: value })}
              />
          </PanelBody>

          {/* Asterisk Styles Panel */}
          <PanelBody title={__("Asterisk Styles")} initialOpen={false}>
              <FluentColorPicker
                label={__("Asterisk Color")}
                value={attributes.styles.asteriskColor || ''}
                onChange={(value) => updateStyles({ asteriskColor: value })}
                defaultColor="#ff0000"
              />
          </PanelBody>

          {/* Inline Error Message Styles Panel */}
          <PanelBody title={__("Inline Error Message Styles")} initialOpen={false}>
              <FluentColorPicker
                label={__("Background Color")}
                value={attributes.styles.errorMessageBgColor || ''}
                onChange={(value) => updateStyles({ errorMessageBgColor: value })}
                defaultColor=""
              />

              <FluentColorPicker
                label={__("Text Color")}
                value={attributes.styles.errorMessageColor || ''}
                onChange={(value) => updateStyles({ errorMessageColor: value })}
                defaultColor="#ff0000"
              />

              <BaseControl label={__("Alignment")}>
                  <FluentAlignmentControl
                    value={attributes.styles.errorMessageAlignment || 'left'}
                    onChange={(value) => updateStyles({ errorMessageAlignment: value })}
                    options={[
                        { value: 'left', icon: 'editor-alignleft', title: __('Align Left') },
                        { value: 'center', icon: 'editor-aligncenter', title: __('Align Center') },
                        { value: 'right', icon: 'editor-alignright', title: __('Align Right') }
                    ]}
                  />
              </BaseControl>
          </PanelBody>

          {/* After Submit Success Message Styles */}
          <PanelBody title={__("After Submit Success Message Styles")} initialOpen={false}>
              <FluentColorPicker
                label={__("Background Color")}
                value={attributes.styles.successMessageBgColor || ''}
                onChange={(value) => updateStyles({ successMessageBgColor: value })}
                defaultColor="#dff0d8"
              />

              <FluentColorPicker
                label={__("Text Color")}
                value={attributes.styles.successMessageColor || ''}
                onChange={(value) => updateStyles({ successMessageColor: value })}
                defaultColor="#3c763d"
              />

              <BaseControl label={__("Alignment")}>
                  <FluentAlignmentControl
                    value={attributes.styles.successMessageAlignment || 'left'}
                    onChange={(value) => updateStyles({ successMessageAlignment: value })}
                    options={[
                        { value: 'left', icon: 'editor-alignleft', title: __('Align Left') },
                        { value: 'center', icon: 'editor-aligncenter', title: __('Align Center') },
                        { value: 'right', icon: 'editor-alignright', title: __('Align Right') }
                    ]}
                  />
              </BaseControl>
          </PanelBody>

          {/* After Submit Error Message Styles */}
          <PanelBody title={__("After Submit Error Message Styles")} initialOpen={false}>
              <FluentColorPicker
                label={__("Background Color")}
                value={attributes.styles.submitErrorMessageBgColor || ''}
                onChange={(value) => updateStyles({ submitErrorMessageBgColor: value })}
                defaultColor="#f2dede"
              />

              <FluentColorPicker
                label={__("Text Color")}
                value={attributes.styles.submitErrorMessageColor || ''}
                onChange={(value) => updateStyles({ submitErrorMessageColor: value })}
                defaultColor="#a94442"
              />

              <BaseControl label={__("Alignment")}>
                  <FluentAlignmentControl
                    value={attributes.styles.submitErrorMessageAlignment || 'left'}
                    onChange={(value) => updateStyles({ submitErrorMessageAlignment: value })}
                    options={[
                        { value: 'left', icon: 'editor-alignleft', title: __('Align Left') },
                        { value: 'center', icon: 'editor-aligncenter', title: __('Align Center') },
                        { value: 'right', icon: 'editor-alignright', title: __('Align Right') }
                    ]}
                  />
              </BaseControl>
          </PanelBody>
      </>
    );
};

/**
 * Compare function to determine if component should update
 */
const MISC_TAB_ATTRIBUTES = [
    'backgroundType',
    'backgroundImage',
    'backgroundImageId',
    'backgroundColor',
    'textColor',
    'gradientColor1',
    'gradientColor2',
    'containerPadding',
    'containerMargin',
    'containerBoxShadow',
    'containerBoxShadowHover',
    'borderType',
    'borderColor',
    'borderWidth',
    'borderRadius',
    'enableFormBorder',
    'formBorder',
    'formWidth',
    'formAlignment',
    'backgroundSize',
    'backgroundPosition',
    'backgroundRepeat',
    'backgroundAttachment',
    'backgroundOverlayColor',
    'backgroundOverlayOpacity',
    'gradientType',
    'gradientAngle',
    'enableBoxShadow',
    'boxShadowColor',
    'boxShadowPosition',
    'boxShadowHorizontal',
    'boxShadowHorizontalUnit',
    'boxShadowVertical',
    'boxShadowVerticalUnit',
    'boxShadowBlur',
    'boxShadowBlurUnit',
    'boxShadowSpread',
    'boxShadowSpreadUnit',
    'asteriskColor',
    'errorMessageBgColor',
    'errorMessageColor',
    'errorMessageAlignment',
    'successMessageBgColor',
    'successMessageColor',
    'successMessageAlignment',
    'submitErrorMessageBgColor',
    'submitErrorMessageColor',
    'submitErrorMessageAlignment'
];

export default memo(TabMisc, (prevProps, nextProps) => {
    return arePropsEqual(prevProps, nextProps, MISC_TAB_ATTRIBUTES, true);
});
