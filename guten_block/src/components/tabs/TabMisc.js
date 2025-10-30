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
    const [localBgType, setLocalBgType] = useState(attributes.backgroundType || 'classic');
    // Add local state for background image to ensure immediate UI update
    const [localBgImage, setLocalBgImage] = useState(attributes.backgroundImage || '');

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
        if (attributes.backgroundType !== undefined && attributes.backgroundType !== localBgType) {
            setLocalBgType(attributes.backgroundType);
        }
    }, [attributes.backgroundType]);

    // Sync local background image state with attributes
    useEffect(() => {
        if (attributes.backgroundImage !== localBgImage) {
            setLocalBgImage(attributes.backgroundImage || '');
        }
    }, [attributes.backgroundImage]);

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
    const currentBgImage = localBgImage || attributes.backgroundImage;

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
                            value={attributes.backgroundSize || 'cover'}
                            options={[
                                { label: __("Cover"), value: 'cover' },
                                { label: __("Contain"), value: 'contain' },
                                { label: __("Auto"), value: 'auto' }
                            ]}
                            onChange={(value) => updateStyles({ backgroundSize: value })}
                          />

                          <SelectControl
                            label={__("Background Position")}
                            value={attributes.backgroundPosition || 'center center'}
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
                            value={attributes.backgroundRepeat || 'no-repeat'}
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
                          value={attributes.gradientColor1 || ''}
                          onChange={(value) => updateStyles({ gradientColor1: value })}
                          defaultColor=""
                        />

                        <FluentColorPicker
                          label={__("Secondary Color")}
                          value={attributes.gradientColor2 || ''}
                          onChange={(value) => updateStyles({ gradientColor2: value })}
                          defaultColor=""
                        />

                        <SelectControl
                          label={__("Gradient Type")}
                          value={attributes.gradientType || 'linear'}
                          options={[
                              { label: __("Linear"), value: 'linear' },
                              { label: __("Radial"), value: 'radial' }
                          ]}
                          onChange={(value) => updateStyles({ gradientType: value })}
                        />

                        {attributes.gradientType === 'linear' && (
                          <RangeControl
                            label={__("Gradient Angle (°)")}
                            value={attributes.gradientAngle || 90}
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
                value={attributes.backgroundColor || ''}
                onChange={(value) => updateStyles({ backgroundColor: value })}
                defaultColor=""
              />

              {/* Padding */}
              <FluentSpaceControl
                label={__("Padding")}
                values={attributes.containerPadding}
                onChange={(value) => updateStyles({ containerPadding: value })}
              />

              {/* Margin */}
              <FluentSpaceControl
                label={__("Margin")}
                values={attributes.containerMargin}
                onChange={(value) => updateStyles({ containerMargin: value })}
              />

              {/* Box Shadow Control */}
              <FluentSeparator label={__("Box Shadow")} />

              {/* Box Shadow Checkbox */}
              <FluentBoxShadowControl
                label={__("Box Shadow")}
                enabled={attributes.enableBoxShadow || false}
                onToggle={(value) => {
                    if (value) {
                        updateStyles({
                            enableBoxShadow: value,
                            boxShadowColor: attributes.boxShadowColor || 'rgba(0,0,0,0.5)',
                            boxShadowPosition: attributes.boxShadowPosition || 'outline',
                            boxShadowHorizontal: attributes.boxShadowHorizontal || '0',
                            boxShadowHorizontalUnit: attributes.boxShadowHorizontalUnit || 'px',
                            boxShadowVertical: attributes.boxShadowVertical || '0',
                            boxShadowVerticalUnit: attributes.boxShadowVerticalUnit || 'px',
                            boxShadowBlur: attributes.boxShadowBlur || '5',
                            boxShadowBlurUnit: attributes.boxShadowBlurUnit || 'px',
                            boxShadowSpread: attributes.boxShadowSpread || '0',
                            boxShadowSpreadUnit: attributes.boxShadowSpreadUnit || 'px'
                        });
                    } else {
                        updateStyles({ enableBoxShadow: value });
                    }
                }}
                color={attributes.boxShadowColor}
                onColorChange={(value) => updateStyles({ boxShadowColor: value })}
                position={attributes.boxShadowPosition}
                onPositionChange={(value) => updateStyles({ boxShadowPosition: value })}
                horizontal={attributes.boxShadowHorizontal}
                onHorizontalChange={(value) => updateStyles({ boxShadowHorizontal: value })}
                horizontalUnit={attributes.boxShadowHorizontalUnit}
                onHorizontalUnitChange={(value) => updateStyles({ boxShadowHorizontalUnit: value })}
                vertical={attributes.boxShadowVertical}
                onVerticalChange={(value) => updateStyles({ boxShadowVertical: value })}
                verticalUnit={attributes.boxShadowVerticalUnit}
                onVerticalUnitChange={(value) => updateStyles({ boxShadowVerticalUnit: value })}
                blur={attributes.boxShadowBlur}
                onBlurChange={(value) => updateStyles({ boxShadowBlur: value })}
                blurUnit={attributes.boxShadowBlurUnit}
                onBlurUnitChange={(value) => updateStyles({ boxShadowBlurUnit: value })}
                spread={attributes.boxShadowSpread}
                onSpreadChange={(value) => updateStyles({ boxShadowSpread: value })}
                spreadUnit={attributes.boxShadowSpreadUnit}
                onSpreadUnitChange={(value) => updateStyles({ boxShadowSpreadUnit: value })}
              />

              {/* Form Border Settings */}
              <FluentSeparator label={__("Form Border Settings")} />

              {/* Form Border Checkbox */}
              <FluentBorderControl
                label={__("Form Border")}
                enabled={attributes.enableFormBorder || false}
                onToggle={(value) => updateStyles({ enableFormBorder: value })}
                borderType={attributes.borderType}
                onBorderTypeChange={(value) => updateStyles({ borderType: value })}
                borderColor={attributes.borderColor}
                onBorderColorChange={(value) => updateStyles({ borderColor: value })}
                borderWidth={attributes.borderWidth}
                onBorderWidthChange={(value) => updateStyles({ borderWidth: value })}
                borderRadius={attributes.borderRadius}
                onBorderRadiusChange={(value) => updateStyles({ borderRadius: value })}
              />
          </PanelBody>

          {/* Asterisk Styles Panel */}
          <PanelBody title={__("Asterisk Styles")} initialOpen={false}>
              <FluentColorPicker
                label={__("Asterisk Color")}
                value={attributes.asteriskColor || ''}
                onChange={(value) => updateStyles({ asteriskColor: value })}
                defaultColor="#ff0000"
              />
          </PanelBody>

          {/* Inline Error Message Styles Panel */}
          <PanelBody title={__("Inline Error Message Styles")} initialOpen={false}>
              <FluentColorPicker
                label={__("Error Message Color")}
                value={attributes.errorMessageColor || ''}
                onChange={(value) => updateStyles({ errorMessageColor: value })}
                defaultColor="#ff0000"
              />

              <BaseControl label={__("Error Message Alignment")}>
                  <FluentAlignmentControl
                    value={attributes.errorMessageAlignment || 'left'}
                    onChange={(value) => updateStyles({ errorMessageAlignment: value })}
                    options={[
                        { value: 'left', icon: 'editor-alignleft', title: __('Align Left') },
                        { value: 'center', icon: 'editor-aligncenter', title: __('Align Center') },
                        { value: 'right', icon: 'editor-alignright', title: __('Align Right') }
                    ]}
                  />
              </BaseControl>

              <FluentSpaceControl
                label={__("Padding")}
                values={attributes.errorMessagePadding}
                onChange={(value) => updateStyles({ errorMessagePadding: value })}
              />

              <FontSizePicker
                fontSizes={[
                    { name: 'Small', slug: 'small', size: 12 },
                    { name: 'Medium', slug: 'medium', size: 16 },
                    { name: 'Large', slug: 'large', size: 24 },
                    { name: 'Extra Large', slug: 'x-large', size: 32 }
                ]}
                value={attributes.errorMessageTypography?.size?.lg || 16}
                onChange={(value) => updateStyles({
                    errorMessageTypography: {
                        ...attributes.errorMessageTypography,
                        size: { lg: value }
                    }
                })}
                withSlider={true}
              />
          </PanelBody>

          {/* After Submit Success Message Styles */}
          <PanelBody title={__("After Submit Success Message Styles")} initialOpen={false}>
              <FluentColorPicker
                label={__("Background Color")}
                value={attributes.successMessageBgColor || ''}
                onChange={(value) => updateStyles({ successMessageBgColor: value })}
                defaultColor="#dff0d8"
              />

              <FluentColorPicker
                label={__("Text Color")}
                value={attributes.successMessageColor || ''}
                onChange={(value) => updateStyles({ successMessageColor: value })}
                defaultColor="#3c763d"
              />

              <BaseControl label={__("Alignment")}>
                  <div className="fluent-form-responsive-control-header">
                      <FluentAlignmentControl
                        value={attributes.successMessageAlignment || 'left'}
                        onChange={(value) => updateStyles({ successMessageAlignment: value })}
                        options={[
                            { value: 'left', icon: 'editor-alignleft', title: __('Align Left') },
                            { value: 'center', icon: 'editor-aligncenter', title: __('Align Center') },
                            { value: 'right', icon: 'editor-alignright', title: __('Align Right') }
                        ]}
                      />
                  </div>
              </BaseControl>

              <FluentUnitControl
                label={__("Width")}
                value={attributes.successMessageWidth || ''}
                onChange={(value) => updateStyles({ successMessageWidth: value })}
                unit={attributes.successMessageWidthUnit || '%'}
                onUnitChange={(value) => updateStyles({ successMessageWidthUnit: value })}
                min={0}
                placeholder="100"
                units={[
                    { label: 'px', value: 'px' },
                    { label: 'em', value: 'em' },
                    { label: '%', value: '%' }
                ]}
              />

              <FluentSpaceControl
                label={__("Padding")}
                values={attributes.successMessagePadding}
                onChange={(value) => updateStyles({ successMessagePadding: value })}
              />

              <FluentSpaceControl
                label={__("Margin")}
                values={attributes.successMessageMargin}
                onChange={(value) => updateStyles({ successMessageMargin: value })}
              />

              <FluentTypography
                label={__("Typography")}
                onChange={(changedTypo) => handleTypographyChange(changedTypo, 'successMessageTypography')}
                settings={{
                    fontSize: attributes.successMessageTypography?.size?.lg || '',
                    fontWeight: attributes.successMessageTypography?.weight || '400',
                    lineHeight: attributes.successMessageTypography?.lineHeight || '',
                    letterSpacing: attributes.successMessageTypography?.letterSpacing || '',
                    textTransform: attributes.successMessageTypography?.textTransform || 'none'
                }}
              />

              <FluentBoxShadowControl
                label={__("Box Shadow")}
                enabled={attributes.enableSuccessMessageBoxShadow || false}
                onToggle={(value) => updateStyles({ enableSuccessMessageBoxShadow: value })}
                color={attributes.successMessageBoxShadowColor}
                onColorChange={(value) => updateStyles({ successMessageBoxShadowColor: value })}
                position={attributes.successMessageBoxShadowPosition}
                onPositionChange={(value) => updateStyles({ successMessageBoxShadowPosition: value })}
                horizontal={attributes.successMessageBoxShadowHorizontal}
                onHorizontalChange={(value) => updateStyles({ successMessageBoxShadowHorizontal: value })}
                horizontalUnit={attributes.successMessageBoxShadowHorizontalUnit}
                onHorizontalUnitChange={(value) => updateStyles({ successMessageBoxShadowHorizontalUnit: value })}
                vertical={attributes.successMessageBoxShadowVertical}
                onVerticalChange={(value) => updateStyles({ successMessageBoxShadowVertical: value })}
                verticalUnit={attributes.successMessageBoxShadowVerticalUnit}
                onVerticalUnitChange={(value) => updateStyles({ successMessageBoxShadowVerticalUnit: value })}
                blur={attributes.successMessageBoxShadowBlur}
                onBlurChange={(value) => updateStyles({ successMessageBoxShadowBlur: value })}
                blurUnit={attributes.successMessageBoxShadowBlurUnit}
                onBlurUnitChange={(value) => updateStyles({ successMessageBoxShadowBlurUnit: value })}
                spread={attributes.successMessageBoxShadowSpread}
                onSpreadChange={(value) => updateStyles({ successMessageBoxShadowSpread: value })}
                spreadUnit={attributes.successMessageBoxShadowSpreadUnit}
                onSpreadUnitChange={(value) => updateStyles({ successMessageBoxShadowSpreadUnit: value })}
              />

              <FluentBorderControl
                label={__("Border")}
                enabled={attributes.enableSuccessMessageBorder || false}
                onToggle={(value) => updateStyles({ enableSuccessMessageBorder: value })}
                borderType={attributes.successMessageBorderType}
                onBorderTypeChange={(value) => updateStyles({ successMessageBorderType: value })}
                borderColor={attributes.successMessageBorderColor}
                onBorderColorChange={(value) => updateStyles({ successMessageBorderColor: value })}
                borderWidth={attributes.successMessageBorderWidth}
                onBorderWidthChange={(value) => updateStyles({ successMessageBorderWidth: value })}
                borderRadius={attributes.successMessageBorderRadius}
                onBorderRadiusChange={(value) => updateStyles({ successMessageBorderRadius: value })}
              />
          </PanelBody>

          {/* After Submit Error Message Styles */}
          <PanelBody title={__("After Submit Error Message Styles")} initialOpen={false}>
              <FluentColorPicker
                label={__("Background Color")}
                value={attributes.submitErrorMessageBgColor || ''}
                onChange={(value) => updateStyles({ submitErrorMessageBgColor: value })}
                defaultColor="#f2dede"
              />

              <FluentColorPicker
                label={__("Text Color")}
                value={attributes.submitErrorMessageColor || ''}
                onChange={(value) => updateStyles({ submitErrorMessageColor: value })}
                defaultColor="#a94442"
              />

              <BaseControl label={__("Alignment")}>
                  <FluentAlignmentControl
                    value={attributes.submitErrorMessageAlignment || 'left'}
                    onChange={(value) => updateStyles({ submitErrorMessageAlignment: value })}
                    options={[
                        { value: 'left', icon: 'editor-alignleft', title: __('Align Left') },
                        { value: 'center', icon: 'editor-aligncenter', title: __('Align Center') },
                        { value: 'right', icon: 'editor-alignright', title: __('Align Right') }
                    ]}
                  />
              </BaseControl>

              <FluentUnitControl
                label={__("Width")}
                value={attributes.submitErrorMessageWidth || ''}
                onChange={(value) => updateStyles({ submitErrorMessageWidth: value })}
                unit={attributes.submitErrorMessageWidthUnit || '%'}
                onUnitChange={(value) => updateStyles({ submitErrorMessageWidthUnit: value })}
                min={0}
                placeholder="100"
                units={[
                    { label: 'px', value: 'px' },
                    { label: 'em', value: 'em' },
                    { label: '%', value: '%' }
                ]}
              />

              <FluentSpaceControl
                label={__("Padding")}
                values={attributes.submitErrorMessagePadding}
                onChange={(value) => updateStyles({ submitErrorMessagePadding: value })}
              />

              <FluentSpaceControl
                label={__("Margin")}
                values={attributes.submitErrorMessageMargin}
                onChange={(value) => updateStyles({ submitErrorMessageMargin: value })}
              />

              <FluentTypography
                label={__("Typography")}
                onChange={(changedTypo) => handleTypographyChange(changedTypo, 'submitErrorMessageTypography')}
                settings={{
                    fontSize: attributes.submitErrorMessageTypography?.size?.lg || '',
                    fontWeight: attributes.submitErrorMessageTypography?.weight || '400',
                    lineHeight: attributes.submitErrorMessageTypography?.lineHeight || '',
                    letterSpacing: attributes.submitErrorMessageTypography?.letterSpacing || '',
                    textTransform: attributes.submitErrorMessageTypography?.textTransform || 'none'
                }}
              />

              <FluentBoxShadowControl
                label={__("Box Shadow")}
                enabled={attributes.enableSubmitErrorMessageBoxShadow || false}
                onToggle={(value) => updateStyles({ enableSubmitErrorMessageBoxShadow: value })}
                color={attributes.submitErrorMessageBoxShadowColor}
                onColorChange={(value) => updateStyles({ submitErrorMessageBoxShadowColor: value })}
                position={attributes.submitErrorMessageBoxShadowPosition}
                onPositionChange={(value) => updateStyles({ submitErrorMessageBoxShadowPosition: value })}
                horizontal={attributes.submitErrorMessageBoxShadowHorizontal}
                onHorizontalChange={(value) => updateStyles({ submitErrorMessageBoxShadowHorizontal: value })}
                horizontalUnit={attributes.submitErrorMessageBoxShadowHorizontalUnit}
                onHorizontalUnitChange={(value) => updateStyles({ submitErrorMessageBoxShadowHorizontalUnit: value })}
                vertical={attributes.submitErrorMessageBoxShadowVertical}
                onVerticalChange={(value) => updateStyles({ submitErrorMessageBoxShadowVertical: value })}
                verticalUnit={attributes.submitErrorMessageBoxShadowVerticalUnit}
                onVerticalUnitChange={(value) => updateStyles({ submitErrorMessageBoxShadowVerticalUnit: value })}
                blur={attributes.submitErrorMessageBoxShadowBlur}
                onBlurChange={(value) => updateStyles({ submitErrorMessageBoxShadowBlur: value })}
                blurUnit={attributes.submitErrorMessageBoxShadowBlurUnit}
                onBlurUnitChange={(value) => updateStyles({ submitErrorMessageBoxShadowBlurUnit: value })}
                spread={attributes.submitErrorMessageBoxShadowSpread}
                onSpreadChange={(value) => updateStyles({ submitErrorMessageBoxShadowSpread: value })}
                spreadUnit={attributes.submitErrorMessageBoxShadowSpreadUnit}
                onSpreadUnitChange={(value) => updateStyles({ submitErrorMessageBoxShadowSpreadUnit: value })}
              />

              <FluentBorderControl
                label={__("Border")}
                enabled={attributes.enableSubmitErrorMessageBorder || false}
                onToggle={(value) => updateStyles({ enableSubmitErrorMessageBorder: value })}
                borderType={attributes.submitErrorMessageBorderType}
                onBorderTypeChange={(value) => updateStyles({ submitErrorMessageBorderType: value })}
                borderColor={attributes.submitErrorMessageBorderColor}
                onBorderColorChange={(value) => updateStyles({ submitErrorMessageBorderColor: value })}
                borderWidth={attributes.submitErrorMessageBorderWidth}
                onBorderWidthChange={(value) => updateStyles({ submitErrorMessageBorderWidth: value })}
                borderRadius={attributes.submitErrorMessageBorderRadius}
                onBorderRadiusChange={(value) => updateStyles({ submitErrorMessageBorderRadius: value })}
              />
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
    'errorMessageColor',
    'errorMessageAlignment',
    'errorMessageAlignmentTablet',
    'errorMessageAlignmentMobile',
    'errorMessagePadding',
    'errorMessageTypography',
    'successMessageBgColor',
    'successMessageColor',
    'successMessageAlignment',
    'successMessageWidth',
    'successMessageWidthUnit',
    'successMessagePadding',
    'successMessageMargin',
    'successMessageTypography',
    'enableSuccessMessageBoxShadow',
    'successMessageBoxShadowColor',
    'successMessageBoxShadowPosition',
    'successMessageBoxShadowHorizontal',
    'successMessageBoxShadowHorizontalUnit',
    'successMessageBoxShadowVertical',
    'successMessageBoxShadowVerticalUnit',
    'successMessageBoxShadowBlur',
    'successMessageBoxShadowBlurUnit',
    'successMessageBoxShadowSpread',
    'successMessageBoxShadowSpreadUnit',
    'enableSuccessMessageBorder',
    'successMessageBorderType',
    'successMessageBorderColor',
    'successMessageBorderWidth',
    'successMessageBorderRadius',
    'submitErrorMessageColor',
    'submitErrorMessageBgColor',
    'submitErrorMessageAlignment',
    'submitErrorMessageWidth',
    'submitErrorMessageWidthUnit',
    'submitErrorMessagePadding',
    'submitErrorMessageMargin',
    'submitErrorMessageTypography',
    'enableSubmitErrorMessageBoxShadow',
    'submitErrorMessageBoxShadowColor',
    'submitErrorMessageBoxShadowPosition',
    'submitErrorMessageBoxShadowHorizontal',
    'submitErrorMessageBoxShadowHorizontalUnit',
    'submitErrorMessageBoxShadowVertical',
    'submitErrorMessageBoxShadowVerticalUnit',
    'submitErrorMessageBoxShadowBlur',
    'submitErrorMessageBoxShadowBlurUnit',
    'submitErrorMessageBoxShadowSpread',
    'submitErrorMessageBoxShadowSpreadUnit',
    'enableSubmitErrorMessageBorder',
    'submitErrorMessageBorderType',
    'submitErrorMessageBorderColor',
    'submitErrorMessageBorderWidth',
    'submitErrorMessageBorderRadius'
];

export default memo(TabMisc, (prevProps, nextProps) => {
    return arePropsEqual(prevProps, nextProps, MISC_TAB_ATTRIBUTES, true);
});
