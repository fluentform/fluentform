/**
 * JavaScript Style Handler for FluentForm Gutenberg Block
 * Converts PHP styling logic to client-side JavaScript
 */

class FluentFormStyleHandler {
    constructor(formId) {
        this.formId = formId;
        this.TABLET_BREAKPOINT = '768px';
        this.MOBILE_BREAKPOINT = '480px';
        this.styleElementId = `fluentform-block-custom-styles-${formId}`;
        this.baseSelector = `.fluentform.fluentform_wrapper_${formId}.ff_guten_block.ff_guten_block-${formId}`;
        this.setStyleElement();
    }

    setStyleElement() {
        const styleElement = document.getElementById(this.styleElementId);
        if (styleElement) {
            this.styleElement = styleElement;
        } else {
            const style = document.createElement('style');
            style.id = this.styleElementId;
            document.head.appendChild(style);
            this.styleElement = style;
        }
    }

    updateStyles(styles) {
        if (!styles) return;
        if (!this.styleElement) {
            this.setStyleElement();
        }
        if (this.styleElement) {
            const css = this.generateAllStyles(styles);
            this.styleElement.innerHTML = css;
            return css;
        }
        return false;
    }

    generateAllStyles(styles) {
        if (!styles || Object.keys(styles).length === 0) {
            return '';
        }

        let css = '';

        css += this.generateContainerStyles(styles);

        css += this.generateLabelStyles(styles);

        css += this.generateInputStyles(styles);

        css += this.generatePlaceholderStyles(styles);

        css += this.generateButtonStyles(styles);

        css += this.generateRadioCheckboxStyles(styles);

        css += this.generateMessageStyles(styles);

        return css;
    }

    generateContainerStyles(styles) {
        let css = '';
        const selector = this.baseSelector;
        let rules = [];
        // Background handling
        if (styles.backgroundType === 'gradient' && styles.gradientColor1 && styles.gradientColor2) {
            const gradientType = styles.gradientType || 'linear';
            const gradientAngle = styles.gradientAngle || 90;
            
            if (gradientType === 'linear') {
                rules.push(`background: linear-gradient(${gradientAngle}deg, ${styles.gradientColor1}, ${styles.gradientColor2})`);
            } else {
                rules.push(`background: radial-gradient(circle, ${styles.gradientColor1}, ${styles.gradientColor2})`);
            }
        } else if (styles.backgroundColor) {
            rules.push(`background-color: ${styles.backgroundColor}`);
        }
        if (styles.backgroundType === 'classic' && styles.backgroundImage) {
            rules.push(`background-image: url(${styles.backgroundImage})`);
            
            if (styles.backgroundSize) {
                rules.push(`background-size: ${styles.backgroundSize}`);
            }
            
            if (styles.backgroundPosition) {
                rules.push(`background-position: ${styles.backgroundPosition}`);
            }
            
            if (styles.backgroundRepeat) {
                rules.push(`background-repeat: ${styles.backgroundRepeat}`);
            }
        }
        
        if (styles.containerPadding) {
            css += this.generateSpacingWithResponsive(styles.containerPadding, 'padding', selector);
        }
        if (styles.containerMargin) {
            css += this.generateSpacingWithResponsive(styles.containerMargin, 'margin', selector);
        }

        if (styles.containerBoxShadow && styles.containerBoxShadow.enable) {
            const boxShadow = this.generateBoxShadow(styles.containerBoxShadow);
            if (boxShadow) rules.push(`box-shadow: ${boxShadow}`);
        }

        if (rules.length > 0) {
            css += `${selector} { ${rules.join('; ')}; }\n`;
        }

        if (styles.formBorder) {
            css += this.generateBorder(styles.formBorder, selector);
        }

        return css;
    }

    generateLabelStyles(styles) {
        let css = '';
        const labelSelector = `${this.baseSelector} .ff-el-input--label label`;
        let rules = [];
        
        if (styles.labelColor) {
            rules.push(`color: ${styles.labelColor}`);
        }
        
        if (styles.labelTypography) {
            const typography = this.generateTypography(styles.labelTypography);
            if (typography) rules.push(typography);
        }

        if (rules.length > 0) {
            css += `${labelSelector} { ${rules.join('; ')}; }\n`;
        }

        return css;
    }

    generateInputStyles(styles) {
        let css = '';
        const inputSelectors = [
            `${this.baseSelector} .ff-el-form-control`,
            `${this.baseSelector} .ff-el-input--content input`,
            `${this.baseSelector} .ff-el-input--content textarea`,
            `${this.baseSelector} .ff-el-input--content select`
        ];
        const inputSelector = inputSelectors.join(', ');
        
        // Normal state
        let normalStyles = [];
        
        if (styles.inputTextColor) {
            normalStyles.push(`color: ${styles.inputTextColor}`);
        }
        
        if (styles.inputBackgroundColor) {
            normalStyles.push(`background-color: ${styles.inputBackgroundColor}`);
        }
        
        if (styles.inputTypography) {
            const typography = this.generateTypography(styles.inputTypography);
            if (typography) normalStyles.push(typography);
        }
        
        if (styles.inputSpacing) {
            css += this.generateSpacingWithResponsive(styles.inputSpacing, 'padding', inputSelector);
        }

        if (styles.inputBoxShadow && styles.inputBoxShadow.enable) {
            const boxShadow = this.generateBoxShadow(styles.inputBoxShadow);
            if (boxShadow) normalStyles.push(`box-shadow: ${boxShadow}`);
        }

        if (normalStyles.length > 0) {
            css += `${inputSelector} { ${normalStyles.join('; ')}; }\n`;
        }

        if (styles.inputBorder) {
            css += this.generateBorder(styles.inputBorder, inputSelector);
        }
        
        // Focus state
        let focusStyles = [];
        const focusSelector = inputSelectors.map(sel => `${sel}:focus`).join(', ');
        
        if (styles.inputTextFocusColor) {
            focusStyles.push(`color: ${styles.inputTextFocusColor}`);
        }
        
        if (styles.inputBackgroundFocusColor) {
            focusStyles.push(`background-color: ${styles.inputBackgroundFocusColor}`);
        }

        if (styles.inputFocusSpacing) {
            css += this.generateSpacingWithResponsive(styles.inputFocusSpacing, 'padding', focusSelector);
        }

        if (styles.inputBoxShadowFocus && styles.inputBoxShadowFocus.enable) {
            const boxShadowFocus = this.generateBoxShadow(styles.inputBoxShadowFocus);
            if (boxShadowFocus) focusStyles.push(`box-shadow: ${boxShadowFocus}`);
        }

        if (focusStyles.length > 0) {
            css += `${focusSelector} { ${focusStyles.join('; ')}; }\n`;
        }

        if (styles.inputBorderFocus) {
            css += this.generateBorder(styles.inputBorderFocus, focusSelector);
        }

        return css;
    }

    generatePlaceholderStyles(styles) {
        let css = '';
        
        if (styles.placeholderColor) {
            const placeholderSelectors = [
                `${this.baseSelector} .ff-el-input--content input::placeholder`,
                `${this.baseSelector} .ff-el-input--content textarea::placeholder`
            ];
            
            css += `${placeholderSelectors.join(', ')} { color: ${styles.placeholderColor}; }\n`;
        }
        
        if (styles.placeholderTypography) {
            const typography = this.generateTypography(styles.placeholderTypography);
            if (typography) {
                const placeholderSelectors = [
                    `${this.baseSelector} .ff-el-input--content input::placeholder`,
                    `${this.baseSelector} .ff-el-input--content textarea::placeholder`
                ];
                css += `${placeholderSelectors.join(', ')} { ${typography}; }\n`;
            }
        }

        return css;
    }

    generateButtonStyles(styles) {
        let css = '';
        const buttonSelector = `${this.baseSelector} .ff_submit_btn_wrapper .ff-btn-submit`;
        
        // Button alignment
        if (styles.buttonAlignment && styles.buttonAlignment !== 'left') {
            css += `${this.baseSelector} .ff_submit_btn_wrapper { text-align: ${styles.buttonAlignment}; }\n`;
        }
        
        // Normal state
        let normalStyles = [];

        if (styles.buttonWidth) {
            normalStyles.push(`width: ${styles.buttonWidth}%`);
        }
        
        if (styles.buttonColor) {
            normalStyles.push(`color: ${styles.buttonColor}`);
        }
        
        if (styles.buttonBGColor) {
            normalStyles.push(`background-color: ${styles.buttonBGColor}`);
        }
        
        if (styles.buttonTypography) {
            const typography = this.generateTypography(styles.buttonTypography);
            if (typography) normalStyles.push(typography);
        }
        
        if (styles.buttonPadding) {
            css += this.generateSpacingWithResponsive(styles.buttonPadding, 'padding', buttonSelector);
        }

        if (styles.buttonMargin) {
            css += this.generateSpacingWithResponsive(styles.buttonMargin, 'margin', buttonSelector);
        }

        if (styles.buttonBoxShadow && styles.buttonBoxShadow.enable) {
            const boxShadow = this.generateBoxShadow(styles.buttonBoxShadow);
            if (boxShadow) normalStyles.push(`box-shadow: ${boxShadow}`);
        }

        if (normalStyles.length > 0) {
            css += `${buttonSelector} { ${normalStyles.join('; ')}; }\n`;
        }

        if (styles.buttonBorder) {
            css += this.generateBorder(styles.buttonBorder, buttonSelector);
        }
        
        // Hover state
        let hoverStyles = [];
        const hoverSelector = `${buttonSelector}:hover`;
        
        if (styles.buttonHoverColor) {
            hoverStyles.push(`color: ${styles.buttonHoverColor}`);
        }
        
        if (styles.buttonHoverBGColor) {
            hoverStyles.push(`background-color: ${styles.buttonHoverBGColor}`);
        }

        if (styles.buttonHoverTypography) {
            const typographyHover = this.generateTypography(styles.buttonHoverTypography);
            if (typographyHover) hoverStyles.push(typographyHover);
        }

        if (styles.buttonHoverPadding) {
            css += this.generateSpacingWithResponsive(styles.buttonHoverPadding, 'padding', hoverSelector);
        }

        if (styles.buttonHoverMargin) {
            css += this.generateSpacingWithResponsive(styles.buttonHoverMargin, 'margin', hoverSelector);
        }

        if (styles.buttonHoverBoxShadow && styles.buttonHoverBoxShadow.enable) {
            const boxShadowHover = this.generateBoxShadow(styles.buttonHoverBoxShadow);
            if (boxShadowHover) hoverStyles.push(`box-shadow: ${boxShadowHover}`);
        }

        if (hoverStyles.length > 0) {
            css += `${hoverSelector} { ${hoverStyles.join('; ')}; }\n`;
        }

        if (styles.buttonHoverBorder) {
            css += this.generateBorder(styles.buttonHoverBorder, hoverSelector);
        }

        return css;
    }

    generateRadioCheckboxStyles(styles) {
        let css = '';
        const rules = [];

        if (styles.radioCheckboxItemsColor) {
            rules.push(`color: ${styles.radioCheckboxItemsColor}`);
        }
        if (styles.radioCheckboxItemsSize) {
            rules.push(`font-size: ${styles.radioCheckboxItemsSize}px;`);
        }
        
        if (rules.length > 0) {
            css += `${this.baseSelector} .ff-el-form-check label { ${rules.join('; ')}; }\n`;
        }

        return css;
    }

    generateMessageStyles(styles) {
        let css = '';
        
        // Success message
        if (styles.successMessageColor) {
            css += `${this.baseSelector} .ff-message-success { color: ${styles.successMessageColor}; }\n`;
        }
        
        if (styles.successMessageBgColor) {
            css += `${this.baseSelector} .ff-message-success { background-color: ${styles.successMessageBgColor}; }\n`;
        }
        
        if (styles.successMessageAlignment && styles.successMessageAlignment !== 'left') {
            css += `${this.baseSelector} .ff-message-success { text-align: ${styles.successMessageAlignment}; }\n`;
        }
        
        // Error message
        if (styles.errorMessageColor) {
            css += `${this.baseSelector} .ff-errors-in-stack, ${this.baseSelector} .error { color: ${styles.errorMessageColor}; }\n`;
        }
        
        if (styles.errorMessageBgColor) {
            css += `${this.baseSelector} .ff-errors-in-stack, ${this.baseSelector} .error { background-color: ${styles.errorMessageBgColor}; }\n`;
        }
        
        if (styles.errorMessageAlignment && styles.errorMessageAlignment !== 'left') {
            css += `${this.baseSelector} .ff-errors-in-stack, ${this.baseSelector} .error { text-align: ${styles.errorMessageAlignment}; }\n`;
        }
        
        // Submit error message
        if (styles.submitErrorMessageColor) {
            css += `${this.baseSelector} .ff-submit-error { color: ${styles.submitErrorMessageColor}; }\n`;
        }
        
        if (styles.submitErrorMessageBgColor) {
            css += `${this.baseSelector} .ff-submit-error { background-color: ${styles.submitErrorMessageBgColor}; }\n`;
        }
        
        if (styles.submitErrorMessageAlignment && styles.submitErrorMessageAlignment !== 'left') {
            css += `${this.baseSelector} .ff-submit-error { text-align: ${styles.submitErrorMessageAlignment}; }\n`;
        }
        
        // Asterisk
        if (styles.asteriskColor) {
            css += `${this.baseSelector} .asterisk-right label:after, ${this.baseSelector} .asterisk-left label:before { color: ${styles.asteriskColor}; }\n`;
        }

        return css;
    }

    generateTypography(typography) {
        if (!typography) return '';
        
        let styles = [];
        
        if (typography.fontSize) {
            styles.push(`font-size: ${typography.fontSize}px`);
        }
        
        if (typography.fontWeight) {
            styles.push(`font-weight: ${typography.fontWeight}`);
        }
        
        if (typography.lineHeight) {
            styles.push(`line-height: ${typography.lineHeight}`);
        }
        
        if (typography.letterSpacing) {
            styles.push(`letter-spacing: ${typography.letterSpacing}px`);
        }
        
        if (typography.textTransform) {
            styles.push(`text-transform: ${typography.textTransform}`);
        }
        
        return styles.join('; ');
    }

    generateBorder(border, selector = '') {
        if (!border || !border.enable || !border.color) return '';
        
        let css = '';
        let desktopStyles = [];
        
        // Border type and color (apply to all devices)
        if (border.type) {
            desktopStyles.push(`border-style: ${border.type}`);
        }
        
        if (border.color) {
            desktopStyles.push(`border-color: ${border.color}`);
        }

        // Desktop styles
        if (border.width && border.width.desktop) {
            const widthStyles = this.generateBorderWidth(border.width.desktop);
            if (widthStyles) desktopStyles.push(widthStyles);
        }
        if (border.radius && border.radius.desktop) {
            const radiusStyles = this.generateBorderRadius(border.radius.desktop);
            if (radiusStyles) desktopStyles.push(radiusStyles);
        }
        if (!selector) {
            return desktopStyles.join('; ');
        }
        if (desktopStyles.length > 0) {
            css += `${selector} { ${desktopStyles.join('; ')}; }\n`;
        }
        
        // Handle tablet styles (only if different from desktop)
        if (border.width && border.width.tablet && border.width.desktop) {
            if (!this.areSpacingValuesEqual(border.width.desktop, border.width.tablet)) {
                const tabletWidthStyles = this.generateBorderWidth(border.width.tablet);
                if (tabletWidthStyles) {
                    css += `@media (max-width: ${this.TABLET_BREAKPOINT}) { ${selector} { ${tabletWidthStyles}; } }\n`;
                }
            }
        }
        
        if (border.radius && border.radius.tablet && border.radius.desktop) {
            if (!this.areSpacingValuesEqual(border.radius.desktop, border.radius.tablet)) {
                const tabletRadiusStyles = this.generateBorderRadius(border.radius.tablet);
                if (tabletRadiusStyles) {
                    css += `@media (max-width: ${this.TABLET_BREAKPOINT}) { ${selector} { ${tabletRadiusStyles}; } }\n`;
                }
            }
        }
        
        // Handle mobile styles (only if different from desktop)
        if (border.width && border.width.mobile && border.width.desktop) {
            if (!this.areSpacingValuesEqual(border.width.desktop, border.width.mobile)) {
                const mobileWidthStyles = this.generateBorderWidth(border.width.mobile);
                if (mobileWidthStyles) {
                    css += `@media (max-width: ${this.MOBILE_BREAKPOINT}) { ${selector} { ${mobileWidthStyles}; } }\n`;
                }
            }
        }
        
        if (border.radius && border.radius.mobile && border.radius.desktop) {
            if (!this.areSpacingValuesEqual(border.radius.desktop, border.radius.mobile)) {
                const mobileRadiusStyles = this.generateBorderRadius(border.radius.mobile);
                if (mobileRadiusStyles) {
                    css += `@media (max-width: ${this.MOBILE_BREAKPOINT}) { ${selector} { ${mobileRadiusStyles}; } }\n`;
                }
            }
        }
        
        return css;
    }

    generateBorderWidth(widthValues) {
        if (!widthValues) return '';
        
        const unit = widthValues.unit || 'px';
        const linked = !!widthValues.linked;
        
        if (linked && widthValues.top !== undefined && widthValues.top !== '') {
            return `border-width: ${widthValues.top}${unit}`;
        } else {
            let styles = [];
            if (widthValues.top !== undefined && widthValues.top !== '') {
                styles.push(`border-top-width: ${widthValues.top}${unit}`);
            }
            if (widthValues.right !== undefined && widthValues.right !== '') {
                styles.push(`border-right-width: ${widthValues.right}${unit}`);
            }
            if (widthValues.bottom !== undefined && widthValues.bottom !== '') {
                styles.push(`border-bottom-width: ${widthValues.bottom}${unit}`);
            }
            if (widthValues.left !== undefined && widthValues.left !== '') {
                styles.push(`border-left-width: ${widthValues.left}${unit}`);
            }
            return styles.join('; ');
        }
    }

    generateBorderRadius(radiusValues) {
        if (!radiusValues) return '';
        
        const unit = radiusValues.unit || 'px';
        const linked = !!radiusValues.linked;
        
        if (linked && radiusValues.top !== undefined && radiusValues.top !== '') {
            return `border-radius: ${radiusValues.top}${unit}`;
        } else {
            let styles = [];
            if (radiusValues.top !== undefined && radiusValues.top !== '') {
                styles.push(`border-top-left-radius: ${radiusValues.top}${unit}`);
            }
            if (radiusValues.right !== undefined && radiusValues.right !== '') {
                styles.push(`border-top-right-radius: ${radiusValues.right}${unit}`);
            }
            if (radiusValues.bottom !== undefined && radiusValues.bottom !== '') {
                styles.push(`border-bottom-right-radius: ${radiusValues.bottom}${unit}`);
            }
            if (radiusValues.left !== undefined && radiusValues.left !== '') {
                styles.push(`border-bottom-left-radius: ${radiusValues.left}${unit}`);
            }
            return styles.join('; ');
        }
    }

    generateSpacingWithResponsive(spacing, property = 'padding', selector) {
        if (!spacing || !selector ||
            (Array.isArray(spacing) && spacing.length === 0) ||
            (typeof spacing === 'object' && Object.keys(spacing).length === 0)
        ) {
            return '';
        }
        
        let css = '';
        
        // Desktop styles (default)
        if (spacing.desktop) {
            const desktopRules = this.getSpacingRules(spacing.desktop, property);
            if (desktopRules.length > 0) {
                css += `${selector} { ${desktopRules.join('; ')}; }\n`;
            }
        }
        
        // Tablet styles (only if different from desktop)
        if (spacing.tablet && spacing.desktop) {
            if (!this.areSpacingValuesEqual(spacing.desktop, spacing.tablet)) {
                const tabletRules = this.getSpacingRules(spacing.tablet, property);
                if (tabletRules.length > 0) {
                    css += `@media (max-width: ${this.TABLET_BREAKPOINT}) { ${selector} { ${tabletRules.join('; ')}; } }\n`;
                }
            }
        }
        
        // Mobile styles (only if different from desktop)
        if (spacing.mobile && spacing.desktop) {
            if (!this.areSpacingValuesEqual(spacing.desktop, spacing.mobile)) {
                const mobileRules = this.getSpacingRules(spacing.mobile, property);
                if (mobileRules.length > 0) {
                    css += `@media (max-width: ${this.MOBILE_BREAKPOINT}) { ${selector} { ${mobileRules.join('; ')}; } }\n`;
                }
            }
        }
        
        return css;
    }

    getSpacingRules(values, property, unit = null) {
        if (!values) return [];
        
        const spacingUnit = unit || values.unit || 'px';
        const linked = !!values.linked;
        let rules = [];
        
        if (linked && values.top !== undefined && values.top !== '') {
            rules.push(`${property}: ${values.top}${spacingUnit}`);
        } else {
            if (values.top !== undefined && values.top !== '') {
                rules.push(`${property}-top: ${values.top}${spacingUnit}`);
            }
            if (values.right !== undefined && values.right !== '') {
                rules.push(`${property}-right: ${values.right}${spacingUnit}`);
            }
            if (values.bottom !== undefined && values.bottom !== '') {
                rules.push(`${property}-bottom: ${values.bottom}${spacingUnit}`);
            }
            if (values.left !== undefined && values.left !== '') {
                rules.push(`${property}-left: ${values.left}${spacingUnit}`);
            }
        }
        
        return rules;
    }

    generateBoxShadow(boxShadow) {
        if (!boxShadow || !boxShadow.enable || !boxShadow.color) return '';
        const position = boxShadow.position === 'inset' ? 'inset ' : '';
        const horizontal = `${ boxShadow.horizontal?.value || '0' }${ boxShadow.horizontal?.unit || 'px' }`;
        const vertical = `${ boxShadow.vertical?.value || '0' }${ boxShadow.vertical?.unit || 'px' }`;
        const blur = `${ boxShadow.blur?.value || '5' }${ boxShadow.blur?.unit || 'px' }`;
        const spread = `${ boxShadow.spread?.value || '0' }${ boxShadow.spread?.unit || 'px' }`;
        return `${ position }${ horizontal } ${ vertical } ${ blur } ${ spread } ${ boxShadow.color }`;
    }

    areSpacingValuesEqual(values1, values2) {
        if (!values1 && !values2) return true;
        if (!values1 || !values2) return false;

        if (values1.unit !== values2.unit) {
            return false;
        }

        if (values2.linked) {
            const val2 = values2.top || '';
            // If values2 has no value, consider it equal (no change)
            if (val2 === '') {
                return true;
            }
            // If values1 is also linked, compare top values only
            if (values1.linked) {
                const val1 = values1.top || '';
                return val1 === val2;
            } else {
                // values1 is not linked, so check if values2.top matches any of values1's sides
                const keys = ['top', 'right', 'bottom', 'left'];
                for (const key of keys) {
                    const val1 = values1[key] || '';
                    if (val1 !== '' && val1 !== val2) {
                        return false;
                    }
                }
                return true;
            }
        } else {
            const keys = ['top', 'right', 'bottom', 'left'];
            for (const key of keys) {
                const val1 = values1.linked ? (values1.top || '') : (values1[key] || '');
                const val2 = values2[key] || '';
                if (val2 !== '' && val1 !== val2) {
                    return false;
                }
            }
        }
        
        return true;
    }
}

export default FluentFormStyleHandler;