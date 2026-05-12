/**
 * Fluent Cart Checkout Integration
 * Integrates Fluent Forms with Fluent Cart checkout process
 */
class FluentCartCheckoutIntegration {
    /**
     * Initialize the integration
     */
    constructor() {
        this.hasRegisteredCheckoutCallbacks = false;
        this.hasBoundCheckoutButton = false;
        this.checkoutFormSelector = '[data-fluent-cart-checkout-form="true"]';
        this.init();
    }

    /**
     * Set up event listeners and initialize functionality
     */
    init() {
        this.setupAdminIntegrationLabels();
        this.setupCheckoutCallbacks();
    }

    setupAdminIntegrationLabels() {
        if (!this.isFluentCartAdminPage()) {
            return;
        }

        const applyLabelFix = () => {
            document.querySelectorAll('.el-breadcrumb__inner, .fct-feed-header .capitalize').forEach((node) => {
                const text = (node.textContent || '').trim();
                if (text === 'fluent_forms') {
                    node.textContent = 'Fluent Forms';
                }
            });
        };

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyLabelFix, {once: true});
        } else {
            applyLabelFix();
        }

        if (document.body) {
            const observer = new MutationObserver(() => {
                applyLabelFix();
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        window.addEventListener('hashchange', applyLabelFix);
        window.setTimeout(applyLabelFix, 250);
    }

    isFluentCartAdminPage() {
        const params = new URLSearchParams(window.location.search);
        return document.body?.classList.contains('wp-admin') && params.get('page') === 'fluent-cart';
    }

    /**
     * Set up the checkout callbacks for form validation and submission
     */
    setupCheckoutCallbacks() {
        const initializeCheckout = () => {
            this.registerCheckoutCallbacks();
            this.interceptCheckoutButtonClick();
            this.ensureFluentFormInitialized();
        };

        window.addEventListener("fluent_cart_after_checkout_js_loaded", initializeCheckout);

        if (window.fluentCartCheckout) {
            initializeCheckout();
        }

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
        const $checkoutForm = jQuery(this.checkoutFormSelector);
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
        if (this.hasBoundCheckoutButton) {
            return;
        }

        const checkoutButton = document.querySelector('[data-fluent-cart-checkout-page-checkout-button]');
        if (!checkoutButton) {
            return;
        }

        this.hasBoundCheckoutButton = true;
        checkoutButton.addEventListener('click', (e) => {
            if (!this.validateCheckoutForm()) {
                this.resetCheckoutProcessingState();
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            }
        }, true);
    }

    getCheckoutFormInputs() {
        if (!this.checkoutFormInstance) {
            return null;
        }

        return this.checkoutFormInstance.find(':input').filter(function (i, el) {
            if (jQuery(el).attr('data-type') === 'repeater_container') {
                if (jQuery(this).closest('.has-conditions').hasClass('ff_excluded')) {
                    jQuery(this).val('');
                }
                return true;
            }

            return !jQuery(el).closest('.has-conditions').hasClass('ff_excluded');
        });
    }

    validateCheckoutForm() {
        if (!this.checkoutFormInstance) {
            return true;
        }

        const formInstance = window.fluentFormApp(this.checkoutFormInstance);
        if (!formInstance) {
            return true;
        }

        try {
            const $inputs = this.getCheckoutFormInputs();

            if (!$inputs) {
                return true;
            }

            $inputs.each((i, el) => {
                jQuery(el).closest('.ff-el-group').removeClass('ff-el-is-error').find('.error').remove();
            });

            formInstance.validate($inputs);

            return true;
        } catch (error) {
            if (error && error.messages) {
                formInstance.showErrorMessages(error.messages);
                formInstance.scrollToFirstError(350);
                return false;
            }

            throw error;
        }
    }

    /**
     * Register callbacks with Fluent Cart checkout
     */
    registerCheckoutCallbacks() {
        if (!window.fluentCartCheckout || this.hasRegisteredCheckoutCallbacks) {
            return;
        }

        this.hasRegisteredCheckoutCallbacks = true;

        window.fluentCartCheckout['beforeCheckoutCallbacks'].push(async (context = {}) => {
            const isValid = this.validateCheckoutForm();

            if (!isValid) {
                this.resetCheckoutProcessingState(context);
            }

            return isValid;
        });

        window.fluentCartCheckout['afterCheckoutCallbacks'].push(async (checkoutResponse) => {
            try {
                const submissionResult = await this.submitFluentFormViaAjax();
                await this.attachSubmissionToOrder(submissionResult, checkoutResponse);
            } catch (error) {
                this.handleCheckoutIntegrationFailure(error, checkoutResponse);
                throw error;
            }
        });
    }

    /**
     * Submit a Fluent Form using the native form submission handler
     */
    submitFluentFormViaAjax() {
        let $checkoutForm = jQuery(this.checkoutFormSelector);
        if (!$checkoutForm.length) {
            return Promise.resolve(null);
        }

        const formId = $checkoutForm.attr('data-form_id');
        if (!formId) {
            console.error('FluentCart: No form ID found, returning resolved promise');
            return Promise.resolve(null);
        }

        return new Promise((resolve, reject) => {
            let timeoutId = null;

            const getSubmittedFormId = (data) => {
                if (!data) {
                    return null;
                }

                if (data.config && data.config.id) {
                    return String(data.config.id);
                }

                if (data.form && typeof data.form.attr === 'function') {
                    return String(data.form.attr('data-form_id'));
                }

                return null;
            };

            const cleanup = () => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }

                jQuery(document.body).off('fluentform_submission_success', successHandler);
                jQuery(document.body).off('fluentform_submission_failed', failedHandler);
            };

            const successHandler = (event, data) => {
                if (getSubmittedFormId(data) !== String(formId)) {
                    return;
                }

                cleanup();
                resolve({
                    formId: Number(formId),
                    response: data?.response || null,
                    submissionId: Number(data?.response?.data?.insert_id || 0)
                });
            };

            const failedHandler = (event, data) => {
                if (getSubmittedFormId(data) !== String(formId)) {
                    return;
                }

                cleanup();
                reject(data);
            };

            try {
                jQuery(document.body).on('fluentform_submission_success', successHandler);
                jQuery(document.body).on('fluentform_submission_failed', failedHandler);

                timeoutId = setTimeout(() => {
                    cleanup();
                    console.warn('FluentCart: Form submission timeout - no success/failed event received');
                    reject(new Error('Form submission timeout'));
                }, 5000);

                this.ensureCheckoutContextInput($checkoutForm);
                jQuery(document).trigger('fluentform_trigger_submission', [formId]);
            } catch (error) {
                cleanup();
                console.error('FluentCart: Error in form submission', error);
                reject(error);
            }
        });
    }

    ensureCheckoutContextInput($checkoutForm) {
        if (!$checkoutForm || !$checkoutForm.length) {
            return;
        }

        let $input = $checkoutForm.find('input[name="__ff_fluent_cart_checkout_context"]');
        if (!$input.length) {
            $input = jQuery('<input />', {
                type: 'hidden',
                name: '__ff_fluent_cart_checkout_context',
                value: '1'
            });
            $checkoutForm.append($input);
            return;
        }

        $input.val('1');
    }

    resetCheckoutProcessingState(context = {}) {
        const processingDiv = document.querySelector('.fct-order-processing');
        if (processingDiv) {
            processingDiv.classList.add('fct-loader-hidden');
        }

        const paymentLoader = context?.paymentLoader;
        if (paymentLoader && typeof paymentLoader.enableCheckoutButton === 'function') {
            paymentLoader.enableCheckoutButton('Place Order');
        }

        const checkoutButton = document.querySelector('[data-fluent-cart-checkout-page-checkout-button]');
        if (checkoutButton) {
            checkoutButton.disabled = false;
            checkoutButton.textContent = 'Place Order';
            checkoutButton.style.display = 'block';
        }
    }

    async attachSubmissionToOrder(submissionResult, checkoutResponse) {
        if (!submissionResult?.submissionId || !submissionResult?.formId) {
            return;
        }

        const orderContext = this.resolveCheckoutOrderContext(checkoutResponse);
        if (!orderContext.orderId && !orderContext.transactionHash) {
            throw new Error('Fluent Cart order context is missing from checkout response');
        }

        const ajaxUrl = window.fluentFormFluentCart?.ajaxUrl || window.fluentFormVars?.ajaxUrl || window.ajaxurl;
        if (!ajaxUrl) {
            throw new Error('Fluent Forms AJAX URL is unavailable');
        }

        const payload = {
            action: 'fluentform_fluentcart_attach_submission',
            _ajax_nonce: window.fluentFormFluentCart?.ajaxNonce || '',
            submission_id: submissionResult.submissionId,
            form_id: submissionResult.formId,
            checkout_hash: orderContext.checkoutHash || ''
        };

        if (orderContext.orderId) {
            payload.order_id = orderContext.orderId;
        }

        if (orderContext.transactionHash) {
            payload.transaction_hash = orderContext.transactionHash;
        }

        const response = await jQuery.post(ajaxUrl, payload);

        if (!response || response.success !== true) {
            throw new Error(response?.data?.message || 'Unable to attach Fluent Forms submission to order');
        }
    }

    resolveCheckoutOrderContext(checkoutResponse = {}) {
        const orderIdCandidates = [
            checkoutResponse?.order_id,
            checkoutResponse?.order?.id,
            checkoutResponse?.data?.order_id,
            checkoutResponse?.data?.order?.id
        ];

        const redirectCandidates = [
            checkoutResponse?.redirect_to,
            checkoutResponse?.data?.redirect_to,
            checkoutResponse?.redirectUrl
        ];

        let transactionHash = '';
        redirectCandidates.some((redirectUrl) => {
            transactionHash = this.extractTransactionHash(redirectUrl);
            return !!transactionHash;
        });

        return {
            orderId: this.normalizeOrderId(orderIdCandidates),
            transactionHash,
            checkoutHash: this.getCheckoutHash()
        };
    }

    normalizeOrderId(orderIdCandidates = []) {
        for (const candidate of orderIdCandidates) {
            const value = Number(candidate || 0);
            if (value > 0) {
                return value;
            }
        }

        return 0;
    }

    extractTransactionHash(redirectUrl) {
        if (!redirectUrl) {
            return '';
        }

        try {
            const url = new URL(redirectUrl, window.location.origin);
            return url.searchParams.get('trx_hash') || '';
        } catch (error) {
            return '';
        }
    }

    getCheckoutHash() {
        return window.fluentFormFluentCart?.checkoutHash || new URLSearchParams(window.location.search).get('fct_cart_hash') || '';
    }

    handleCheckoutIntegrationFailure(error, checkoutResponse = {}) {
        const orderContext = this.resolveCheckoutOrderContext(checkoutResponse);
        const orderLabel = orderContext.orderId ? ` #${orderContext.orderId}` : '';
        const message = `Order${orderLabel} was created, but Fluent Forms data could not be saved. Please contact support before continuing.`;

        console.error('FluentCart: Form submission failed:', error);

        const processingDiv = document.querySelector('.fct-order-processing');
        if (processingDiv) {
            processingDiv.classList.add('fct-loader-hidden');
        }

        const checkoutButton = document.querySelector('[data-fluent-cart-checkout-page-checkout-button]');
        if (checkoutButton) {
            checkoutButton.disabled = true;
            checkoutButton.textContent = 'Order Created';
        }

        if (window.Toastify) {
            new Toastify({
                text: message,
                className: 'warning',
                duration: 6000
            }).showToast();
            return;
        }

        window.alert(message);
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
