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

        jQuery(document).on('submit', '.fluent-cart-checkout-form, [data-fluent-cart-checkout-form="true"]', function(e) {
            e.preventDefault();
            return false;
        });
    }

    /**
     * Handle FluentForm initialization event
     */
    handleFluentFormInit($theForm, form) {
        if ($theForm.hasClass('fluent-cart-checkout-form') || $theForm.closest('.fluent-cart-checkout-form').length) {
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
        if (typeof formInstance.initFormHandlers === 'function') {
            formInstance.initFormHandlers();
        }
        
        if (typeof formInstance.initTriggers === 'function') {
            formInstance.initTriggers();
        }
        
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

        window.fluentCartCheckout['beforeCheckoutCallbacks'].push(async (data) => {
            return true;
        });

        window.fluentCartCheckout['afterCheckoutCallbacks'].push(async () => {
            try {
                await this.submitFluentFormViaAjax();
            } catch (error) {
                console.error('FluentCart: Form submission failed:', error);
            }
        });
    }

    /**
     * Submit a Fluent Form using the native form submission handler
     */
    submitFluentFormViaAjax() {
        let $checkoutForm = jQuery('[data-fluent-cart-checkout-form="true"]');   
        if (!$checkoutForm.length) {
            return Promise.resolve();
        }

        const formId = $checkoutForm.attr('data-form_id');
        if (!formId) {
            console.error('FluentCart: No form ID found, returning resolved promise');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            try {
                // Trigger the form submission event
                jQuery(document).trigger('fluentform_trigger_submission', [formId]);
                
                // Listen for submission results
                jQuery(document.body).one('fluentform_submission_success', (event, data) => {
                    resolve(data);
                });
                
                jQuery(document.body).one('fluentform_submission_failed', (event, data) => {
                    reject(data);
                });
                
                // Add timeout
                setTimeout(() => {
                    console.warn('FluentCart: Form submission timeout - no success/failed event received');
                    reject(new Error('Form submission timeout'));
                }, 5000);
                
            } catch (error) {
                console.error('FluentCart: Error in form submission', error);
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