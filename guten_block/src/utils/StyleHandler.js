/**
 * JavaScript Style Handler for FluentForm Gutenberg Block
 * Converts PHP styling logic to client-side JavaScript
 */

class FluentFormStyleHandler {
    constructor(formId) {
        this.formId = formId;
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

        return css;
    }

    generateLabelStyles(attributes) {
        let css = '';
        const labelSelector = `${this.baseSelector} .ff-el-input--label label`;
        let styles = [];
        
        if (attributes.labelColor) {
            styles.push(`color: ${attributes.labelColor}`);
        }
        
        if (attributes.labelTypography) {
            const typography = this.generateTypography(attributes.labelTypography);
            if (typography) styles.push(typography);
        }

        if (styles.length > 0) {
            css += `${labelSelector} { ${styles.join('; ')}; }\n`;
        }

        return css;
    }

    generateInputStyles(attributes) {
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
        
        if (attributes.inputTextColor) {
            normalStyles.push(`color: ${attributes.inputTextColor}`);
        }
        
        if (attributes.inputBackgroundColor) {
            normalStyles.push(`background-color: ${attributes.inputBackgroundColor}`);
        }
        
        if (attributes.inputTypography) {
            const typography = this.generateTypography(attributes.inputTypography);
            if (typography) normalStyles.push(typography);
        }
        
        if (attributes.inputBorder) {
            const border = this.generateBorder(attributes.inputBorder);
            if (border) normalStyles.push(border);
        }
        
        if (attributes.inputSpacing) {
            const spacing = this.generateSpacing(attributes.inputSpacing);
            if (spacing) normalStyles.push(spacing);
        }

        // Input box shadow
        if (attributes.inputBoxShadow && attributes.inputBoxShadow.enable) {
            const boxShadow = this.generateBoxShadow(attributes.inputBoxShadow);
            if (boxShadow) normalStyles.push(`box-shadow: ${boxShadow}`);
        }

        if (normalStyles.length > 0) {
            css += `${inputSelector} { ${normalStyles.join('; ')}; }\n`;
        }
        
        // Focus state
        let focusStyles = [];
        const focusSelector = inputSelectors.map(sel => `${sel}:focus`).join(', ');
        
        if (attributes.inputTextColorFocus) {
            focusStyles.push(`color: ${attributes.inputTextColorFocus}`);
        }
        
        if (attributes.inputBackgroundColorFocus) {
            focusStyles.push(`background-color: ${attributes.inputBackgroundColorFocus}`);
        }
        
        if (attributes.inputBorderFocus) {
            const borderFocus = this.generateBorder(attributes.inputBorderFocus);
            if (borderFocus) focusStyles.push(borderFocus);
        }

        // Input box shadow focus
        if (attributes.inputBoxShadowFocus && attributes.inputBoxShadowFocus.enable) {
            const boxShadowFocus = this.generateBoxShadow(attributes.inputBoxShadowFocus);
            if (boxShadowFocus) focusStyles.push(`box-shadow: ${boxShadowFocus}`);
        }

        if (focusStyles.length > 0) {
            css += `${focusSelector} { ${focusStyles.join('; ')}; }\n`;
        }

        return css;
    }

    generatePlaceholderStyles(attributes) {
        let css = '';
        
        if (attributes.placeholderColor) {
            const placeholderSelectors = [
                `${this.baseSelector} .ff-el-input--content input::placeholder`,
                `${this.baseSelector} .ff-el-input--content textarea::placeholder`
            ];
            
            css += `${placeholderSelectors.join(', ')} { color: ${attributes.placeholderColor}; }\n`;
        }
        
        if (attributes.placeholderTypography) {
            const typography = this.generateTypography(attributes.placeholderTypography);
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

    generateButtonStyles(attributes) {
        let css = '';
        const buttonSelector = `${this.baseSelector} .ff-btn-submit`;
        
        // Button alignment
        if (attributes.buttonAlignment) {
            css += `${this.baseSelector} .ff_submit_btn_wrapper { text-align: ${attributes.buttonAlignment}; }\n`;
        }
        
        // Normal state
        let normalStyles = [];
        
        if (attributes.buttonColor) {
            normalStyles.push(`color: ${attributes.buttonColor}`);
        }
        
        if (attributes.buttonBGColor) {
            normalStyles.push(`background-color: ${attributes.buttonBGColor}`);
        }
        
        if (attributes.buttonTypography) {
            const typography = this.generateTypography(attributes.buttonTypography);
            if (typography) normalStyles.push(typography);
        }
        
        if (attributes.buttonBorder) {
            const border = this.generateBorder(attributes.buttonBorder);
            if (border) normalStyles.push(border);
        }
        
        if (attributes.buttonSpacing) {
            const spacing = this.generateSpacing(attributes.buttonSpacing);
            if (spacing) normalStyles.push(spacing);
        }

        // Button box shadow
        if (attributes.buttonBoxShadow && attributes.buttonBoxShadow.enable) {
            const boxShadow = this.generateBoxShadow(attributes.buttonBoxShadow);
            if (boxShadow) normalStyles.push(`box-shadow: ${boxShadow}`);
        }

        if (normalStyles.length > 0) {
            css += `${buttonSelector} { ${normalStyles.join('; ')}; }\n`;
        }
        
        // Hover state
        let hoverStyles = [];
        const hoverSelector = `${buttonSelector}:hover`;
        
        if (attributes.buttonColorHover) {
            hoverStyles.push(`color: ${attributes.buttonColorHover}`);
        }
        
        if (attributes.buttonBGColorHover) {
            hoverStyles.push(`background-color: ${attributes.buttonBGColorHover}`);
        }

        // Button hover box shadow
        if (attributes.buttonHoverBoxShadow && attributes.buttonHoverBoxShadow.enable) {
            const boxShadowHover = this.generateBoxShadow(attributes.buttonHoverBoxShadow);
            if (boxShadowHover) hoverStyles.push(`box-shadow: ${boxShadowHover}`);
        }

        if (hoverStyles.length > 0) {
            css += `${hoverSelector} { ${hoverStyles.join('; ')}; }\n`;
        }

        return css;
    }

    generateRadioCheckboxStyles(attributes) {
        let css = '';
        
        if (attributes.radioCheckboxItemsColor) {
            css += `${this.baseSelector} .ff-el-form-check { color: ${attributes.radioCheckboxItemsColor}; }\n`;
        }
        
        if (attributes.radioCheckboxItemsSize) {
            const size = `${attributes.radioCheckboxItemsSize}px`;
            css += `${this.baseSelector} input[type="radio"], ${this.baseSelector} input[type="checkbox"] { width: ${size}; height: ${size}; }\n`;
        }

        return css;
    }

    generateMessageStyles(attributes) {
        let css = '';
        
        // Success message
        if (attributes.successMessageColor) {
            css += `${this.baseSelector} .ff-message-success { color: ${attributes.successMessageColor}; }\n`;
        }
        
        // Error message
        if (attributes.errorMessageColor) {
            css += `${this.baseSelector} .ff-errors-in-stack, ${this.baseSelector} .error { color: ${attributes.errorMessageColor}; }\n`;
        }
        
        // Asterisk
        if (attributes.asteriskColor) {
            css += `${this.baseSelector} .asterisk-right label:after, ${this.baseSelector} .asterisk-left label:before { color: ${attributes.asteriskColor}; }\n`;
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

    generateBorder(border) {
        if (!border) return '';
        
        let styles = [];
        
        if (border.width) {
            styles.push(`border-width: ${border.width}px`);
        }
        
        if (border.style) {
            styles.push(`border-style: ${border.style}`);
        }
        
        if (border.color) {
            styles.push(`border-color: ${border.color}`);
        }
        
        if (border.radius) {
            styles.push(`border-radius: ${border.radius}px`);
        }
        
        return styles.join('; ');
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
}

export default FluentFormStyleHandler;