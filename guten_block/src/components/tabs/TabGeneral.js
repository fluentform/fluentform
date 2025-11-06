const { memo } = wp.element;

import { areStylesEqual } from '../utils/ComponentUtils';
import StyleTemplatePanel from './panels/StyleTemplatePanel';
import LabelStylesPanel from './panels/LabelStylesPanel';
import InputStylesPanel from './panels/InputStylesPanel';
import ButtonStylesPanel from './panels/ButtonStylesPanel';
import PlaceHolderStylesPanel from './panels/PlaceHolderStylesPanel';
import RadioCheckBoxStylesPanel from './panels/RadioCheckBoxStylesPanel';

/**
 * Main TabGeneral component
 */
const TabGeneral = ({attributes, updateStyles, handlePresetChange }) => {
    return (
      <>
          <StyleTemplatePanel
            attributes={attributes}
            handlePresetChange={handlePresetChange}
          />

          <LabelStylesPanel
            styles={attributes.styles}
            updateStyles={updateStyles}
          />

          <InputStylesPanel
            styles={attributes.styles}
            updateStyles={updateStyles}
          />

          <PlaceHolderStylesPanel
            styles={attributes.styles}
            updateStyles={updateStyles}
          />

          <RadioCheckBoxStylesPanel
            styles={attributes.styles}
            updateStyles={updateStyles}
          />

          <ButtonStylesPanel
            styles={attributes.styles}
            updateStyles={updateStyles}
          />
      </>
    );
};

const GENERAL_STYLES = [
    'labelColor',
    'labelTypography',
    'inputTextColor',
    'inputBackgroundColor',
    'inputTypography',
    'inputSpacing',
    'inputBorder',
    'inputBorderHover',
    'inputTextFocusColor',
    'inputBackgroundFocusColor',
    'inputFocusSpacing',
    'inputBoxShadow',
    'inputBoxShadowFocus',
    'placeholderColor',
    'placeholderFocusColor',
    'placeholderTypography',
    'radioCheckboxLabelColor',
    'radioCheckboxTypography',
    'radioCheckboxItemsColor',
    'radioCheckboxItemsSize',
    'checkboxSize',
    'checkboxBorderColor',
    'checkboxBgColor',
    'checkboxCheckedColor',
    'radioSize',
    'radioBorderColor',
    'radioBgColor',
    'radioCheckedColor',
    'buttonWidth',
    'buttonAlignment',
    'buttonColor',
    'buttonBGColor',
    'buttonTypography',
    'buttonPadding',
    'buttonMargin',
    'buttonBoxShadow',
    'buttonBorder',
    'buttonHoverColor',
    'buttonHoverBGColor',
    'buttonHoverTypography',
    'buttonHoverPadding',
    'buttonHoverMargin',
    'buttonHoverBoxShadow',
    'buttonHoverBorder'
];

export default memo(TabGeneral, (prev, next) => {
    if (prev.attributes.themeStyle !== next.attributes.themeStyle) {
        return false;
    }
    return areStylesEqual(prev.attributes.styles, next.attributes.styles, GENERAL_STYLES);
});
