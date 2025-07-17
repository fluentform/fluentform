/**
 * Fluent Cart Integration - Form to Cart Integration
 * Integrates Fluent Forms with Fluent Cart's native variation system
 */
class FluentCartFormIntegration {
    /**
     * Initialize the integration
     */
    constructor() {
        this.init();
    }

    /**
     * Set up event listeners and initialize functionality
     */
    init() {
        // Initialize the form integration
        this.initFluentCartFormIntegration();

        // Initialize price calculation display
        this.initPriceCalculation();

        // Set up the checkout callbacks
        window.addEventListener("fluent_cart_after_checkout_js_loaded", (e) => {
            window.fluentCartCheckout['beforeCheckoutCallbacks'].push(async (data) => {
                try {
                    return this.validateFluentFormClientSide();
                } catch (error) {
                    return false;
                }
            });

            window.fluentCartCheckout['afterCheckoutCallbacks'].push(async () => {
                try {
                    await this.submitFluentFormViaAjax();
                } catch (error) {
                    console.error('FluentForm submission failed after checkout:', error);
                }
            });
        });
    }

    /**
     * Initialize the Fluent Cart form integration
     */
    initFluentCartFormIntegration() {
        // Bind the event handler with the correct context
        jQuery(document.body).on('fluentform_submission_success',
            (event, data) => this.handleFormSubmissionSuccess(event, data));
    }

    /**
     * Initialize price calculation and display
     */
    initPriceCalculation() {
        // Wait for DOM to be ready
        jQuery(document).ready(() => {
            this.setupPriceCalculation();
        });
    }

    /**
     * Set up price calculation listeners
     */
    setupPriceCalculation() {
        const $formWrapper = jQuery('.fluent-cart-single-product-page');
        if (!$formWrapper.length) {
            return;
        }

        // Create price display element
        this.createPriceDisplay($formWrapper);

        // Listen for variation changes (radio button selection)
        $formWrapper.on('change', 'input[type="radio"][data-cart-id]', () => {
            this.updatePriceDisplay();
        });

        // Listen for quantity field changes
        $formWrapper.on('input change', 'input[name="item-quantity"], input[data-name="item-quantity"], input[data-quantity_item="yes"], .ff_quantity_item', () => {
            this.updatePriceDisplay();
        });

        // Listen for any calculation field changes
        $formWrapper.on('input change', 'input[data-calc_value], .ff_numeric', () => {
            this.updatePriceDisplay();
        });

        // Initial price calculation
        setTimeout(() => {
            this.updatePriceDisplay();
        }, 500);
    }

    /**
     * Handle successful form submissions on product pages
     */
    handleFormSubmissionSuccess(event, data) {
        const {form, response} = data;
        const $formWrapper = form.parents('.fluent-cart-single-product-page');

        // Only handle product page forms, not checkout forms
        if (!$formWrapper.length) {
            return;
        }

        // Hide the default success message for add-to-cart forms
        this.hideDefaultSuccessMessage(form);

        const $selectedVariation = form.find('input[type="radio"]:checked');
        const selectedVariationId = $selectedVariation.data('cart-id');

        if (!selectedVariationId) {
            return;
        }

        let quantity = 1;

        const $quantityField = $formWrapper.find('input[name="item-quantity"], input[data-name="item-quantity"], input[data-quantity_item="yes"], .ff_quantity_item');
        if ($quantityField.length) {
            quantity = parseInt($quantityField.val()) || 1;
        }

        // Pass custom price to cart
        this.addToCartWithFluentCart(selectedVariationId, quantity);
    }

    /**
     * Hide the default Fluent Forms success message for add-to-cart forms
     */
    hideDefaultSuccessMessage(form) {
        const formId = form.attr('data-form_id') || form.find('[data-form_id]').attr('data-form_id');

        if (formId) {
            jQuery('#' + formId + '_success').hide();
            jQuery('#fluentform_' + formId + '_success').hide();
        }

        // Hide generic success message classes
        form.find('.ff-message-success').hide();
        form.parents('.fluent-cart-single-product-page').find('.ff-message-success').hide();

        // Also hide any success messages that might appear after a delay
        setTimeout(() => {
            if (formId) {
                jQuery('#' + formId + '_success').hide();
                jQuery('#fluentform_' + formId + '_success').hide();
            }
            form.find('.ff-message-success').hide();
            form.parents('.fluent-cart-single-product-page').find('.ff-message-success').hide();
        }, 50);
    }

    /**
     * Create price display element
     */
    createPriceDisplay($formWrapper) {
        if ($formWrapper.find('.fluent-cart-price-display').length) {
            return;
        }

        // Find the submit button to place price display before it
        const $submitButtonDiv = $formWrapper.find('.ff-btn-submit, button[type="submit"], input[type="submit"]').parents('.ff-el-group');
        if (!$submitButtonDiv.length) {
            return;
        }

        // Create price display HTML
        const priceDisplayHtml = `
            <div class="ff-el-input--label fluent-cart-price-display" style="margin-bottom: 20px; display: inline-block;">
                <label for="ff_total_calculation" class="price-label" aria-label="Total:">
                    Total:
                </label>
                <div class="ff-el-input--content" style="display: inline-block;">
                    <div class="price-amount" style="font-weight: bold;">
                        00.00
                    </div>
                </div>
            </div>
        `;

        $submitButtonDiv.before(priceDisplayHtml);
    }

    /**
     * Update the price display
     */
    updatePriceDisplay() {
        const $formWrapper = jQuery('.fluent-cart-single-product-page');
        const $priceDisplay = $formWrapper.find('.fluent-cart-price-display');

        if (!$priceDisplay.length) {
            return;
        }

        // Get selected variation and its price
        const $selectedVariation = $formWrapper.find('input[type="radio"][data-cart-id]:checked');

        // Get base price from the selected variation
        const basePrice = parseFloat($selectedVariation.data('payment_value')) || 0;

        // Get quantity (default to 1 if not found or empty)
        let quantity = this.getQuantity($formWrapper);

        // Calculate total price
        const totalPrice = basePrice * quantity;

        // Format price
        const formattedPrice = this.formatPrice(totalPrice);
        const formattedBasePrice = this.formatPrice(basePrice);

        // Update display
        $priceDisplay.find('.price-amount').text(formattedPrice);
    }

    /**
     * Get quantity from form fields
     */
    getQuantity($formWrapper) {
        // Look for quantity fields
        const $quantityField = $formWrapper.find('input[name="item-quantity"], input[data-name="item-quantity"], input[data-quantity_item="yes"], .ff_quantity_item');

        if ($quantityField.length) {
            const quantity = parseInt($quantityField.val()) || 1;
            return Math.max(1, quantity); // Ensure minimum quantity of 1
        }

        // Look for any numeric calculation fields that might represent quantity
        const $calcFields = $formWrapper.find('input[data-calc_value], .ff_numeric');
        if ($calcFields.length) {
            let totalCalc = 0;
            $calcFields.each(function() {
                const value = parseFloat(jQuery(this).val()) || 0;
                totalCalc += value;
            });

            if (totalCalc > 0) {
                return Math.max(1, Math.floor(totalCalc));
            }
        }

        return 1;
    }

    /**
     * Format price for display
     */
    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(price);
    }

    /**
     * Add to cart using Fluent Cart's native API
     */
    addToCartWithFluentCart(variationId, quantity = 1) {
        if (typeof window.fluentCartCart !== 'undefined') {
            window.fluentCartCart.addProduct(variationId, quantity).then(() => {
                if (window.fluentCartCartDrawer) {
                    window.fluentCartCartDrawer?.notifyDataSetChanged();
                }

                // Show cart drawer with native animations
                const cartDrawer = document.querySelector('[data-fluent-cart-cart-drawer]');
                const drawerOverlay = document.querySelector('[data-fluent-cart-cart-drawer-overlay]');

                if (cartDrawer && drawerOverlay) {
                    cartDrawer.classList.add('open');
                    drawerOverlay.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }

                // Dispatch success event (similar to native button behavior)
                const actionName = 'fluent_cart_form_add_to_cart_success';
                document.dispatchEvent(new CustomEvent(actionName, {
                    detail: {variationId, quantity}
                }));
            }).catch((error) => {
                const errorActionName = 'fluent_cart_form_add_to_cart_error';
                document.dispatchEvent(new CustomEvent(errorActionName, {
                    detail: {variationId, quantity, error}
                }));
            });
        }
    }

    /**
     * Validate FluentForm using client-side validation (same as submissionAjaxHandler)
     * Returns true if valid, false if invalid (and shows errors)
     */
    validateFluentFormClientSide() {
        const fluentFormDiv = document.querySelector('[data-form_id]');
        if (!fluentFormDiv) {
            return true;
        }

        const formId = fluentFormDiv.getAttribute('data-form_id');
        const $form = jQuery('#fluentform_' + formId);
        if (!$form.length) {
            return true;
        }
        
        const formInstance = window.fluentFormApp($form);

        try {
            // Get form inputs (same logic as submissionAjaxHandler)
            const $inputs = $form.find(':input').filter(function (i, el) {
                if (jQuery(el).attr('data-type') === 'repeater_container') {
                    if (jQuery(this).closest('.has-conditions').hasClass('ff_excluded')) {
                        jQuery(this).val('');
                    }
                    return true;
                }
                return !jQuery(el).closest('.has-conditions').hasClass('ff_excluded');
            });

            // Clear previous errors
            $inputs.each((i, el) => {
                jQuery(el).closest('.ff-el-group').removeClass('ff-el-is-error').find('.error').remove();
            });

            formInstance.validate($inputs);

            return true;
        } catch (error) {
            if (error instanceof window.ffValidationError) {
                formInstance.showErrorMessages(error.messages);
                formInstance.scrollToFirstError(350);
                return false;
            } else {
                return false;
            }
        }
    }
    
    /**
     * Submit a Fluent Form via AJAX
     */
    submitFluentFormViaAjax() {
        const fluentFormDiv = document.querySelector('[data-form_id]');
        if (!fluentFormDiv) {
            return Promise.resolve();
        }

        const formId = fluentFormDiv.getAttribute('data-form_id');

        const $form = jQuery('#fluentform_' + formId);
        if (!$form.length) {
            console.log('Could not find form element');
            return Promise.resolve();
        }

        const formData = this.prepareFluentFormData($form);

        // Submit to FluentForm's AJAX endpoint
        return new Promise((resolve, reject) => {
            jQuery.ajax({
                url: window.fluentFormVars.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'fluentform_submit',
                    form_id: formId,
                    data: jQuery.param(formData),
                },
                success: (response) => {
                    if (response.success) {
                        jQuery(document.body).trigger('fluentform_submission_success', {
                            form: $form,
                            response: response.data,
                            formData: formData
                        });
                        resolve(response);
                    } else {
                        jQuery(document.body).trigger('fluentform_submission_error', {
                            form: $form,
                            response: response.data,
                            formData: formData
                        });
                        reject(response);
                    }
                },
                error: (xhr, status, error) => {
                    jQuery(document.body).trigger('fluentform_submission_error', {
                        form: $form,
                        response: error,
                        formData: formData
                    });
                    reject({
                        status: xhr.status,
                        statusText: xhr.statusText,
                        error: error,
                        responseText: xhr.responseText
                    });
                }
            });
        });
    }

    /**
     * Prepare form data for submission
     */
    prepareFluentFormData($form) {
        const formData = {};

        // Get all input, textarea, and select fields
        $form.find('input, textarea, select').each(function() {
            const $field = jQuery(this);
            const fieldName = $field.attr('name');
            const fieldType = $field.attr('type');

            if (!fieldName) return;

            let fieldValue = '';

            if (fieldType === 'checkbox') {
                if ($field.is(':checked')) {
                    fieldValue = $field.val();
                }
            } else if (fieldType === 'radio') {
                if ($field.is(':checked')) {
                    fieldValue = $field.val();
                }
            } else if ($field.is('select')) {
                fieldValue = $field.val();
            } else {
                fieldValue = $field.val();
            }

            if (fieldValue) {
                formData[fieldName] = fieldValue;
            }
        });

        if (!formData['_wp_http_referer']) {
            formData['_wp_http_referer'] = window.location.href;
        }

        const $nonceField = $form.find('[name*="fluentformnonce"]');
        if ($nonceField.length && !formData[$nonceField.attr('name')]) {
            const nonceName = $nonceField.attr('name');
            const nonceValue = $nonceField.val();
            formData[nonceName] = nonceValue;
        }

        const $postIdField = $form.find('[name="__fluent_form_embded_post_id"]');
        if ($postIdField.length && !formData['__fluent_form_embded_post_id']) {
            formData['__fluent_form_embded_post_id'] = $postIdField.val();
        }

        return formData;
    }

    /**
     * Static method to initialize the integration
     */
    static initialize() {
        jQuery(document).ready(() => {
            new FluentCartFormIntegration();
        });
    }
}

// Initialize the integration
FluentCartFormIntegration.initialize();