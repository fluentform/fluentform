/**
 * Fluent Cart Checkout Integration
 * Integrates Fluent Forms with Fluent Cart checkout process
 */
class FluentCartCheckoutIntegration {
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
        this.setupCheckoutCallbacks();
    }

    /**
     * Set up the checkout callbacks for form validation and submission
     */
    setupCheckoutCallbacks() {
        window.addEventListener("fluent_cart_after_checkout_js_loaded", () => {
            this.registerCheckoutCallbacks();
            this.interceptCheckoutButtonClick();
            this.ensureFluentFormInitialized();
        });

        // Listen for FluentForm initialization events
        jQuery(document.body).on('fluentform_init', (event, $theForm, form) => {
            this.handleFluentFormInit($theForm, form);
        });
    }

    /**
     * Handle FluentForm initialization event
     */
    handleFluentFormInit($theForm, form) {
        // Check if this is a checkout form
        if ($theForm.hasClass('fluent-cart-checkout-form') || $theForm.closest('.fluent-cart-checkout-form').length) {
            // Store the form instance for later use
            this.checkoutFormInstance = $theForm;
        }
    }

    /**
     * Ensure FluentForm is initialized for checkout form
     */
    ensureFluentFormInitialized() {
        const $checkoutForm = jQuery('.fluent-cart-checkout-form');
        if (!$checkoutForm.length) {
            return;
        }

        const formId = $checkoutForm.attr('data-form_id');
        if (!formId) {
            return;
        }

        const $form = jQuery('#fluentform_' + formId);
        if (!$form.length) {
            return;
        }

        // Check if form is already initialized
        const formInstance = window.fluentFormApp($form);
        if (formInstance) {
            this.checkoutFormInstance = $form;
            
            // Ensure all FluentForm services are initialized
            this.ensureFluentFormServices($form, formInstance);
        }
    }

    /**
     * Ensure all FluentForm services are properly initialized
     */
    ensureFluentFormServices($form, formInstance) {
        // Initialize all form handlers (includes tooltips, validation, etc.)
        if (typeof formInstance.initFormHandlers === 'function') {
            formInstance.initFormHandlers();
        }
        
        // Initialize all triggers (includes tooltips, captchas, etc.)
        if (typeof formInstance.initTriggers === 'function') {
            formInstance.initTriggers();
        }
        
        // Initialize common actions (multi-select, masks, numeric formatting, etc.)
        if (window.fluentFormCommonActions && typeof window.fluentFormCommonActions.init === 'function') {
            window.fluentFormCommonActions.init();
        }
    }

    /**
     * Intercept checkout button click to validate before processing starts
     */
    interceptCheckoutButtonClick() {
        const checkoutButton = document.querySelector('[data-fluent-cart-checkout-page-checkout-button]');
        if (!checkoutButton) {
            return;
        }

        checkoutButton.addEventListener('click', (e) => {
            if (!this.checkoutFormInstance) {
                return;
            }

            const formInstance = window.fluentFormApp(this.checkoutFormInstance);
            if (!formInstance) {
                return;
            }

            try {
                const $inputs = this.checkoutFormInstance.find(':input').filter(function (i, el) {
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
        } catch (error) {
                if (error && error.constructor && error.constructor.name === 'ffValidationError') {
                formInstance.showErrorMessages(error.messages);
                formInstance.scrollToFirstError(350);
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                return false;
                }
            }
        }, true);
    }

    /**
     * Register callbacks with Fluent Cart checkout
     */
    registerCheckoutCallbacks() {
        if (!window.fluentCartCheckout) {
            return;
        }

        // Add form validation before checkout (backup validation)
        window.fluentCartCheckout['beforeCheckoutCallbacks'].push(async (data) => {
            return true;
        });

        // Add form submission after checkout
        window.fluentCartCheckout['afterCheckoutCallbacks'].push(async () => {
            try {
                await this.submitFluentFormViaAjax();
            } catch (error) {
                // Silent fail - form submission is optional
            }
        });
    }

    /**
     * Submit a Fluent Form using the native form submission handler
     */
    submitFluentFormViaAjax() {
        const $checkoutForm = jQuery('.fluent-cart-checkout-form');
        if (!$checkoutForm.length) {
            return Promise.resolve();
        }

        const formId = $checkoutForm.attr('data-form_id');
        if (!formId) {
            return Promise.resolve();
        }

        if (typeof window.fluentFormTriggerSubmission !== 'function') {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            try {
                const success = window.fluentFormTriggerSubmission(formId);
                if (success) {
                    jQuery(document.body).one('fluentform_submission_success', (event, data) => {
                        resolve(data);
                    });
                    
                    jQuery(document.body).one('fluentform_submission_failed', (event, data) => {
                        reject(data);
                    });
                } else {
                    reject(new Error('Failed to trigger form submission'));
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Static method to initialize the integration
     */
    static initialize() {
        jQuery(document).ready(() => {
            new FluentCartCheckoutIntegration();
        });
    }
}

// Initialize the integration
FluentCartCheckoutIntegration.initialize();