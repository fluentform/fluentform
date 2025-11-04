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
        this.baseSelector = `.fluentform-guten-wrapper .ff_guten_block.ff_guten_block-${formId}`;
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
            this.styleElement.innerHTML = this.generateAllStyles(styles);
        }
    }

    generateAllStyles(styles) {
        let css = '';

        // Container styles
        css += this.generateContainerStyles(styles);
        
        // Label styles
        css += this.generateLabelStyles(styles);
        
        // Input styles
        css += this.generateInputStyles(styles);
        
        // Placeholder styles
        css += this.generatePlaceholderStyles(styles);
        
        // Button styles
        css += this.generateButtonStyles(styles);
        
        // Radio/Checkbox styles
        css += this.generateRadioCheckboxStyles(styles);
        
        // Message styles
        css += this.generateMessageStyles(styles);

        return css;
    }

    generateContainerStyles(styles) {
        let css = '';
        const selector = this.baseSelector;
        let styleRules = [];
        
        if (styles.backgroundColor) {
            styleRules.push(`background-color: ${styles.backgroundColor}`);
        }
        
        if (styles.containerPadding) {
            const padding = this.generateSpacing(styles.containerPadding);
            if (padding) styleRules.push(padding);
        }

        // Container box shadow
        if (styles.containerBoxShadow && styles.containerBoxShadow.enable) {
            const boxShadow = this.generateBoxShadow(styles.containerBoxShadow);
            if (boxShadow) styleRules.push(`box-shadow: ${boxShadow}`);
        }

        if (styleRules.length > 0) {
            css += `${selector} { ${styleRules.join('; ')}; }\n`;
        }
        
        // Container border with responsive support
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

        if (styles.length > 0) {
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
            const spacing = this.generateSpacing(styles.inputSpacing);
            if (spacing) normalStyles.push(spacing);
        }

        // Input box shadow
        if (styles.inputBoxShadow && styles.inputBoxShadow.enable) {
            const boxShadow = this.generateBoxShadow(styles.inputBoxShadow);
            if (boxShadow) normalStyles.push(`box-shadow: ${boxShadow}`);
        }

        if (normalStyles.length > 0) {
            css += `${inputSelector} { ${normalStyles.join('; ')}; }\n`;
        }
        
        // Input border with responsive support
        if (styles.inputBorder) {
            css += this.generateBorder(styles.inputBorder, inputSelector);
        }
        
        // Focus state
        let focusStyles = [];
        const focusSelector = inputSelectors.map(sel => `${sel}:focus`).join(', ');
        
        if (styles.inputTextColorFocus) {
            focusStyles.push(`color: ${styles.inputTextColorFocus}`);
        }
        
        if (styles.inputBackgroundColorFocus) {
            focusStyles.push(`background-color: ${styles.inputBackgroundColorFocus}`);
        }

        // Input box shadow focus
        if (styles.inputBoxShadowFocus && styles.inputBoxShadowFocus.enable) {
            const boxShadowFocus = this.generateBoxShadow(styles.inputBoxShadowFocus);
            if (boxShadowFocus) focusStyles.push(`box-shadow: ${boxShadowFocus}`);
        }

        if (focusStyles.length > 0) {
            css += `${focusSelector} { ${focusStyles.join('; ')}; }\n`;
        }
        
        // Input focus border with responsive support
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
        const buttonSelector = `${this.baseSelector} .ff-btn-submit`;
        
        // Button alignment
        if (styles.buttonAlignment) {
            css += `${this.baseSelector} .ff_submit_btn_wrapper { text-align: ${styles.buttonAlignment}; }\n`;
        }
        
        // Normal state
        let normalStyles = [];
        
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
        
        if (styles.buttonSpacing) {
            const spacing = this.generateSpacing(styles.buttonSpacing);
            if (spacing) normalStyles.push(spacing);
        }

        // Button box shadow
        if (styles.buttonBoxShadow && styles.buttonBoxShadow.enable) {
            const boxShadow = this.generateBoxShadow(styles.buttonBoxShadow);
            if (boxShadow) normalStyles.push(`box-shadow: ${boxShadow}`);
        }

        if (normalStyles.length > 0) {
            css += `${buttonSelector} { ${normalStyles.join('; ')}; }\n`;
        }
        
        // Button border with responsive support
        if (styles.buttonBorder) {
            css += this.generateBorder(styles.buttonBorder, buttonSelector);
        }
        
        // Hover state
        let hoverStyles = [];
        const hoverSelector = `${buttonSelector}:hover`;
        
        if (styles.buttonColorHover) {
            hoverStyles.push(`color: ${styles.buttonColorHover}`);
        }
        
        if (styles.buttonBGColorHover) {
            hoverStyles.push(`background-color: ${styles.buttonBGColorHover}`);
        }

        // Button hover box shadow
        if (styles.buttonHoverBoxShadow && styles.buttonHoverBoxShadow.enable) {
            const boxShadowHover = this.generateBoxShadow(styles.buttonHoverBoxShadow);
            if (boxShadowHover) hoverStyles.push(`box-shadow: ${boxShadowHover}`);
        }

        if (hoverStyles.length > 0) {
            css += `${hoverSelector} { ${hoverStyles.join('; ')}; }\n`;
        }
        
        // Button hover border with responsive support
        if (styles.buttonHoverBorder) {
            css += this.generateBorder(styles.buttonHoverBorder, hoverSelector);
        }

        return css;
    }

    generateRadioCheckboxStyles(styles) {
        let css = '';
        
        if (styles.radioCheckboxItemsColor) {
            css += `${this.baseSelector} .ff-el-form-check { color: ${styles.radioCheckboxItemsColor}; }\n`;
        }
        
        if (styles.radioCheckboxItemsSize) {
            const size = `${styles.radioCheckboxItemsSize}px`;
            css += `${this.baseSelector} input[type="radio"], ${this.baseSelector} input[type="checkbox"] { width: ${size}; height: ${size}; }\n`;
        }

        return css;
    }

    generateMessageStyles(styles) {
        let css = '';
        
        // Success message
        if (styles.successMessageColor) {
            css += `${this.baseSelector} .ff-message-success { color: ${styles.successMessageColor}; }\n`;
        }
        
        // Error message
        if (styles.errorMessageColor) {
            css += `${this.baseSelector} .ff-errors-in-stack, ${this.baseSelector} .error { color: ${styles.errorMessageColor}; }\n`;
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
        
        if (typography.size && typography.size.lg) {
            styles.push(`font-size: ${typography.size.lg}px`);
        }
        
        if (typography.weight) {
            styles.push(`font-weight: ${typography.weight}`);
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
        
        // Border width (desktop values)
        if (border.width && border.width.desktop) {
            const widthStyles = this.generateBorderWidth(border.width.desktop);
            if (widthStyles) desktopStyles.push(widthStyles);
        }
        
        // Border radius (desktop values)
        if (border.radius && border.radius.desktop) {
            const radiusStyles = this.generateBorderRadius(border.radius.desktop);
            if (radiusStyles) desktopStyles.push(radiusStyles);
        }
        
        // If no selector provided, return inline styles (for existing functionality)
        if (!selector) {
            return desktopStyles.join('; ');
        }
        
        // Generate CSS with media queries
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
            // Map to CSS border-radius corners: top=top-left, right=top-right, bottom=bottom-right, left=bottom-left
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

    generateSpacing(spacing, property = 'padding') {
        if (!spacing) return '';
        
        let styles = [];
        
        if (spacing.top) {
            styles.push(`${property}-top: ${spacing.top}px`);
        }
        
        if (spacing.right) {
            styles.push(`${property}-right: ${spacing.right}px`);
        }
        
        if (spacing.bottom) {
            styles.push(`${property}-bottom: ${spacing.bottom}px`);
        }
        
        if (spacing.left) {
            styles.push(`${property}-left: ${spacing.left}px`);
        }
        
        return styles.join('; ');
    }

    generateBoxShadow(boxShadow) {
        if (!boxShadow || !boxShadow.enable || !boxShadow.color) return '';

        // Get position (inset or outline)
        const position = boxShadow.position === 'inset' ? 'inset ' : '';

        // Get values with units
        const horizontal = `${ boxShadow.horizontal?.value || '0' }${ boxShadow.horizontal?.unit || 'px' }`;
        const vertical = `${ boxShadow.vertical?.value || '0' }${ boxShadow.vertical?.unit || 'px' }`;
        const blur = `${ boxShadow.blur?.value || '5' }${ boxShadow.blur?.unit || 'px' }`;
        const spread = `${ boxShadow.spread?.value || '0' }${ boxShadow.spread?.unit || 'px' }`;
        // Build the box-shadow value
        return `${ position }${ horizontal } ${ vertical } ${ blur } ${ spread } ${ boxShadow.color }`;
    }

    areSpacingValuesEqual(values1, values2) {
        if (!values1 && !values2) return true;
        if (!values1 || !values2) return false;
        
        const keys = ['top', 'right', 'bottom', 'left'];
        
        for (const key of keys) {
            const val1 = values1[key] || '';
            const val2 = values2[key] || '';
            
            if ('' !== val2 && val1 !== val2) {
                return false;
            }
        }
        
        return true;
    }
}

export default FluentFormStyleHandler;