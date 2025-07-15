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

        // Set up the checkout callback
        window.addEventListener("fluent_cart_after_checkout_js_loaded", (e) => {
            window.fluentCartCheckout['afterCheckoutCallbacks'].push(async () => {
                await this.submitFluentFormViaAjax();
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
     * Handle successful form submissions on product pages
     */
    handleFormSubmissionSuccess(event, data) {
        const {form, response} = data;
        const $formWrapper = form.parents('.fluent-cart-single-product-page');

        // Only handle product page forms, not checkout forms
        if (!$formWrapper.length) {
            return;
        }

        const selectedVariationId = form.find('input[type="radio"]:checked').data('cart-id');
        if (!selectedVariationId) {
            return;
        }

        let quantity = 1;

        const $quantityField = $formWrapper.find('input[name="item-quantity"], input[data-name="item-quantity"], input[data-quantity_item="yes"], .ff_quantity_item');
        if ($quantityField.length) {
            quantity = parseInt($quantityField.val());
        }

        this.addToCartWithFluentCart(selectedVariationId, quantity);
    }

    /**
     * Add to cart using Fluent Cart's native API (event-driven approach)
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
                    reject(error);
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