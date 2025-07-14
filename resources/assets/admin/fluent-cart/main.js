/**
 * Fluent Cart Integration - Form to Cart Integration
 * Integrates Fluent Forms with Fluent Cart's native variation system
 */

(function ($) {
    'use strict';

    // Initialize when DOM is ready
    $(document).ready(function () {
        initFluentCartFormIntegration();

        window.addEventListener("fluent_cart_after_checkout_js_loaded", (e) => {
            window.fluentCartCheckout['afterCheckoutCallbacks'].push(async function (data) {
                // Handle FluentForm submission for checkout forms
                await handleCheckoutFormSubmission(data);
            });
        });
    });

/**
 * Initialize the Fluent Cart form integration
 */
function initFluentCartFormIntegration() {
    $(document.body).on('fluentform_submission_success', handleFormSubmissionSuccess);
}

/**
 * Handle successful form submissions on product pages
 */
function handleFormSubmissionSuccess(event, data) {
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

    addToCartWithFluentCart(selectedVariationId, quantity);
}

/**
 * Handle FluentForm submission for checkout forms
 */
async function handleCheckoutFormSubmission(checkoutData) {
    // Check if there's a FluentForm on the checkout page
    const fluentFormWrapper = document.querySelector('.fluentform');
    if (!fluentFormWrapper) {
        console.log('No FluentForm wrapper found');
        return;
    }

    // Find the actual form div inside the wrapper (it has data-form_id attribute)
    const fluentFormDiv = fluentFormWrapper.querySelector('[data-form_id]');
    if (!fluentFormDiv) {
        console.log('No FluentForm div with data-form_id found');
        return;
    }

    // Get form ID from the data-form_id attribute
    const formId = fluentFormDiv.getAttribute('data-form_id');
    console.log('Found form ID:', formId);

    if (!formId) {
        console.log('No form ID found in data-form_id attribute');
        return;
    }

    // Use the fluentFormDiv we already found
    const $formDiv = $(fluentFormDiv);
    console.log('Found FluentForm div element:', $formDiv);

    // Get the form instance class (e.g., ff_form_instance_1_1)
    const formInstanceMatch = fluentFormDiv.className.match(/ff_form_instance_\d+_\d+/);
    if (!formInstanceMatch) {
        console.log('Could not find form instance class in:', fluentFormDiv.className);
        return;
    }

    const formInstanceClass = formInstanceMatch[0];
    const formSelector = '.' + formInstanceClass;
    console.log('Using form selector:', formSelector);

    // The $form should be the actual form div, not the errors div
    // Use a more specific selector to target only the form div
    const $form = $formDiv; // Use the specific form div we already found
    console.log('$form element found:', $form.length, $form);

    // Also try to get the form using the more specific selector
    const $formBySelector = $(formSelector).not('[id$="_errors"]');
    console.log('$formBySelector found:', $formBySelector.length, $formBySelector);

    try {
        // Populate form fields with checkout data if needed
        populateFormWithCheckoutData($formDiv, checkoutData);
        console.log('Form populated, triggering submit on:', formSelector);

        // Debug: Check if there are any submit event handlers bound
        const events = $._data($form[0], 'events');
        console.log('Events bound to form element:', events);

        // Try multiple approaches to trigger the submission

        // Approach 1: Direct trigger on the form element
        console.log('Approach 1: Triggering submit on form element');
        $form.trigger('submit');

        // Approach 2: Create and dispatch a native submit event
        console.log('Approach 2: Dispatching native submit event');
        if ($form[0]) {
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            $form[0].dispatchEvent(submitEvent);
        }

        // Approach 3: Try triggering on document with the selector
        console.log('Approach 3: Triggering via document delegation');
        $(document).trigger('submit', formSelector);

        // Approach 4: Find and click the submit button if it exists
        const $submitBtn = $form.find('.ff-btn-submit, [type="submit"], button[type="submit"]');
        if ($submitBtn.length) {
            console.log('Approach 4: Clicking submit button');
            $submitBtn.trigger('click');
        }

        // Approach 5: Try to access FluentForm app instance directly
        console.log('Approach 5: Checking for FluentForm app instance');
        console.log('window.fluentFormAppStore:', window.fluentFormAppStore);
        console.log('Looking for key:', formInstanceClass);

        if (window.fluentFormAppStore) {
            console.log('Available app store keys:', Object.keys(window.fluentFormAppStore));

            // Try the exact form instance class
            if (window.fluentFormAppStore[formInstanceClass]) {
                console.log('Found FluentForm app instance, trying direct submission');
                const appInstance = window.fluentFormAppStore[formInstanceClass];
                if (appInstance && appInstance.sendData) {
                    console.log('Calling sendData directly');
                    appInstance.sendData();
                }
            } else {
                // Try alternative keys
                const possibleKeys = [
                    formInstanceClass,
                    'fluentform_' + formId,
                    'ff_form_instance_' + formId + '_1',
                    'form_' + formId
                ];

                for (const key of possibleKeys) {
                    if (window.fluentFormAppStore[key]) {
                        console.log('Found app instance with key:', key);
                        const appInstance = window.fluentFormAppStore[key];
                        if (appInstance && appInstance.sendData) {
                            console.log('Calling sendData with key:', key);
                            appInstance.sendData();
                            break;
                        }
                    }
                }
            }
        }

        // Approach 6: Try triggering form submission via jQuery with proper event object
        console.log('Approach 6: Triggering with proper event object');
        const submitEvent = $.Event('submit');
        $form.trigger(submitEvent);

        // Approach 7: Wait a bit and try to manually trigger the AJAX submission
        setTimeout(() => {
            console.log('Approach 7: Delayed manual AJAX submission');
            if (window.fluentFormAppStore && window.fluentFormAppStore[formInstanceClass]) {
                const appInstance = window.fluentFormAppStore[formInstanceClass];
                if (appInstance && typeof appInstance.sendData === 'function') {
                    console.log('Calling sendData after delay');
                    appInstance.sendData();
                }
            }
        }, 100);

        // Approach 8: Create a submit button if none exists and click it
        setTimeout(() => {
            console.log('Approach 8: Creating and clicking submit button');
            let $submitBtn = $form.find('.ff-btn-submit');
            if (!$submitBtn.length) {
                // Create a temporary submit button
                $submitBtn = $('<button type="submit" class="ff-btn-submit" style="display:none;">Submit</button>');
                $form.append($submitBtn);
            }
            $submitBtn.click();
        }, 200);

        // Approach 9: Try to manually trigger the AJAX submission
        setTimeout(() => {
            console.log('Approach 9: Manual AJAX submission to FluentForm endpoint');

            // Prepare form data
            const formData = new FormData();
            formData.append('action', 'fluentform_submit');
            formData.append('form_id', formId);

            // Get all form field values
            $form.find('input, textarea, select').each(function() {
                const $field = $(this);
                const name = $field.attr('name');
                const value = $field.val();
                if (name && value) {
                    formData.append(name, value);
                }
            });

            // Add required FluentForm fields
            formData.append('_wp_http_referer', window.location.href);
            const nonce = $form.find('[name*="fluentformnonce"]').val();
            if (nonce) {
                formData.append($form.find('[name*="fluentformnonce"]').attr('name'), nonce);
            }

            // Submit via AJAX
            $.ajax({
                url: window.ajaxurl || '/wp-admin/admin-ajax.php',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    console.log('Manual AJAX submission successful:', response);

                    // Trigger the success event manually
                    $(document.body).trigger('fluentform_submission_success', {
                        form: $form,
                        response: response,
                        checkoutData: checkoutData
                    });
                },
                error: function(xhr, status, error) {
                    console.error('Manual AJAX submission failed:', error);
                }
            });
        }, 300);

        console.log('FluentForm submission triggered successfully');

    } catch (error) {
        console.error('Error triggering FluentForm submission:', error);
    }
}

/**
 * Populate form fields with checkout data
 */
function populateFormWithCheckoutData($form, checkoutData) {
    // Get checkout form data
    const checkoutForm = document.querySelector('[data-fluent-cart-checkout-page-form]');
    if (!checkoutForm) {
        console.log('No checkout form found');
        return;
    }

    const checkoutFormData = new FormData(checkoutForm);
    console.log('Checkout form data:', Object.fromEntries(checkoutFormData));

    // Map common fields from checkout to FluentForm based on the actual HTML structure
    const fieldMappings = {
        'billing_first_name': ['names[first_name]'],
        'billing_last_name': ['names[last_name]'],
        'billing_email': ['email'],
        'billing_phone': ['phone'],
        'order_notes': ['message'],
        'subject': ['subject']
    };

    // Populate FluentForm fields with checkout data
    for (const [checkoutField, fluentFormFields] of Object.entries(fieldMappings)) {
        const checkoutValue = checkoutFormData.get(checkoutField);
        if (checkoutValue) {
            for (const fluentFormField of fluentFormFields) {
                const $field = $form.find(`[name="${fluentFormField}"]`);
                if ($field.length) {
                    console.log(`Mapping ${checkoutField} (${checkoutValue}) to ${fluentFormField}`);
                    $field.val(checkoutValue);
                    break; // Use the first matching field
                }
            }
        }
    }

    // Also try to populate with some default values if no checkout data is available
    if (!checkoutFormData.get('billing_first_name')) {
        console.log('No checkout data found, using default values');
        $form.find('[name="names[first_name]"]').val('Test');
        $form.find('[name="names[last_name]"]').val('User');
        $form.find('[name="email"]').val('test@example.com');
        $form.find('[name="subject"]').val('Checkout Form Submission');
        $form.find('[name="message"]').val('This form was submitted during checkout process.');
    }
}

/**
 * Add to cart using Fluent Cart's native API (event-driven approach)
 */
function addToCartWithFluentCart(variationId, quantity = 1) {
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
})
(jQuery);
