import formatPrice from "./formatPrice";
import { _$t } from "@/admin/helpers";
export class Payment_handler {
    constructor($form, instance) {
        let formId = instance.settings.id;
        this.$form = $form;
        this.formInstance = instance;
        this.formId = formId;
        this.paymentMethod = '';
        this.paymentConfig = window.fluentform_payment_config;
        this.appliedCoupons = {};
        this.totalAmount = 0;
        this.formPaymentConfig = window['fluentform_payment_config_' + formId];
    }

    init() {
        this.boot();
        this.initStripeElement();
        this.handleAccessibility();
    }

    $t(stringKey) {
        let transString = this.paymentConfig.i18n[stringKey] || stringKey;
        return _$t(transString, ...arguments);
    }

    boot() {
        this.initPaymentMethodChange();
        const next_action_namespace = 'next_action_namespace';
        this.$form.off(`fluentform_next_action_payment.${ next_action_namespace }`);

        this.$form.on(`fluentform_next_action_payment.${ next_action_namespace }`, (event, data) => {
            let response = data.response.data;
            if (response.actionName) {
                jQuery('<div/>', {
                    'id': 'form_success',
                    'class': 'ff-message-success'
                })
                    .html(response.message)
                    .insertAfter(this.$form);

                this[response.actionName](response);
            }
        });
        jQuery('.ff_modal_btn').on('click', () => {
            this.calculatePayments();
        });
        this.calculatePayments();
        this.$form.find('.ff_payment_item,.ff_quantity_item').on('change', (event) => {
            if (event.target.min && +event.target.value < +event.target.min) {
                event.target.value = event.target.min;
            }

            if (event.target.max && +event.target.value > +event.target.max) {
                event.target.value = event.target.max;
            }

            this.calculatePayments();

            this.mayBeToggleSubscriptionRelatedThings(event);
        });

        this.$form.on('change', '.ff-custom-user-input', (event) => {
            this.handleCustomUserInputChange(event)
        })

        this.$form.on('do_calculation', () => {
            this.calculatePayments();
        });

        this.initDiscountCode();
    }

    // Payment Calculations
    calculatePayments() {
        let form = this.$form;
        let items = this.getPaymentItems();

        var totalAmount = 0;

        jQuery.each(items, (name, item) => {
            totalAmount += item.line_total;
        });

        this.totalAmount = totalAmount;

        let discounts = this.getDiscounts();
        const validDiscounts = [];

        jQuery.each(discounts, (index, discount) => {
            let discountAmount = discount.amount;

            // If minimum amount isn't purchased before this discount can be used, remove the discount and show error message
            if (discount.min_amount && discount.min_amount > this.totalAmount) {
                delete this.appliedCoupons[discount.code];
                this.$form.find('.__ff_all_applied_coupons').attr('value', JSON.stringify(Object.keys(this.appliedCoupons)));
                this.$form.find(`.ff_resp_item_${discount.code}`).remove();
                this.recordCouponMessage(this.$form.find('.ff_coupon_wrapper'), discount.code, `${discount.code} - ${discount.min_amount_message}`, 'error');
                return;
            }

            if (discount.coupon_type === 'percent') {
                discountAmount = (discount.amount / 100) * this.totalAmount;
            }
            this.totalAmount -= discountAmount;
            validDiscounts.push(discount);
        });

        discounts = validDiscounts;

        form.trigger('payment_amount_change', {
            amount: totalAmount,
            items: items,
            discounts: discounts,
            payment_handler: this
        });

        form.find('.ff_order_total').html(this.getFormattedPrice(this.totalAmount));
        form.data('payment_total', this.totalAmount);
        const hidePaymentSummary = !Object.keys(items).length;
        this.hasPaymentItems = hidePaymentSummary;

        let method = hidePaymentSummary ? 'hide' : 'show';
        const paymentMethods = this.$form.find('.ff_payment_method');

        // if (hidePaymentSummary) {
        //     paymentMethods.map((i, e) => e.checked = false);
        // } else {
        //     paymentMethods.map((i, e) => {
        //         if (e.value == this.paymentMethod) {
        //             e.checked = true;
        //         }
        //     });
        // }

        // skip element if hidden by conditional logic
        paymentMethods.closest('.ff-el-group:not(.ff_excluded)')[method]();

        // Reset all summary closed flags when amounts change
        const $paymentSummaries = this.$form.find('.ff_dynamic_payment_summary');
        $paymentSummaries.each((index, summary) => {
            const name = jQuery(summary).closest('.ff-el-group').data('name') || index;
            this.$form.data('payment_summary_' + name + '_closed', false);
        });

        if ($paymentSummaries.length) {
            this.generateSummaryTable(items, totalAmount, discounts, hidePaymentSummary);
        }
    }

    generateSummaryTable(items, totalAmount, discounts, hide = false) {
        // Find all payment summaries in the form
        const $paymentSummaries = this.$form.find('.ff_dynamic_payment_summary');

        $paymentSummaries.each((index, summary) => {
            const $summary = jQuery(summary);
            const name = $summary.closest('.ff-el-group').data('name');

            // Check if this specific summary is closed
            const isClosed = this.$form.data('payment_summary_' + name + '_closed');

            $summary.find('.ff_payment_summary_fallback').hide();

            // If hide flag is true or this specific summary was closed by user
            if (hide || isClosed) {
                $summary.find('.ff_payment_summary').html('');
                $summary.find('.ff_payment_summary_fallback').show();
                return;
            }

            // Generate the table HTML
            let html = '<div class="ffp_table_wrapper">';

            // Only add close button if enabled for this summary
            const showCloseButton = this.formPaymentConfig?.payment_summary_config?.[name]?.show_close_button || false;
            if (showCloseButton) {
                html += '<div class="ffp_table_close"><span class="ffp_close_icon" data-name="' + name + '">&times;</span></div>';
            }

            html += '<table class="table ffp_table input_items_table">';
            html += `<thead><tr><th>${this.$t("item")}</th><th>${this.$t("price")}</th><th>${this.$t("qty")}</th><th>${this.$t("line_total")}</th></tr></thead>`;
            html += '<tbody>';
            jQuery.each(items, (index, item) => {
                if (item.price === 0 || item.price) {
                    html += '<tr>';
                    html += `<td>${item.label}</td>`;
                    html += `<td>${this.getFormattedPrice(item.price)}</td>`;
                    html += `<td>${item.quantity}</td>`;
                    html += `<td>${this.getFormattedPrice(item.line_total)}</td>`;
                    html += '</tr>';
                }
            });
            html += '</tbody>';

            let footerRows = '';
            if (discounts.length) {
                footerRows += `<tr><th class="item_right" colspan="3">${this.$t("Sub Total")}</th><th>${this.getFormattedPrice(totalAmount)}</th></tr>`;
                jQuery.each(discounts, (index, discount) => {
                    let discountAmount = discount.amount;
                    if (discount.coupon_type === 'percent') {
                        discountAmount = (discount.amount / 100) * totalAmount;
                    }
                    if (discountAmount >= totalAmount) {
                        discountAmount = totalAmount;
                    }
                    footerRows += `<tr><th class="item_right" colspan="3">${this.$t('discount:')} ${discount.title}</th><th>-${this.getFormattedPrice(discountAmount)}</th></tr>`;
                    totalAmount -= discountAmount;
                });
            }

            footerRows += `<tr><th class="item_right" colspan="3">${this.$t("total")}</th><th>${this.getFormattedPrice(totalAmount)}</th></tr>`;

            html += `<tfoot>${footerRows}</tfoot>`;
            html += '</table></div>';

            $summary.find('.ff_payment_summary').html(html);
        });

        this.$form.find('.ffp_close_icon').on('click', (e) => {
            const name = jQuery(e.target).data('name');
            const $paymentSummary = this.$form.find(`.ff-el-group[data-name="${name}"] .ff_dynamic_payment_summary`);

            $paymentSummary.find('.ff_payment_summary').html('');

            // Store a flag that user has manually closed this specific summary
            this.$form.data('payment_summary_' + name + '_closed', true);
        });
    }

    getPaymentItems() {
        let form = this.$form;
        let elements = form.find('.ff-el-group:not(.ff_excluded)').find('.ff_payment_item');

        let itemTotalValue = {};

        var that = this;

        function pushItem(name, label, value) {
            name = name.replace('[', '').replace(']', '');
            var quantity = that.getQuantity(name);
            if (!quantity) {
                return;
            }
            itemTotalValue[name] = {
                label: label,
                price: value,
                quantity: quantity,
                line_total: quantity * value
            };
        }

        elements.each(function (index, elem) {
            let elementType = elem.type;
            let $elem = jQuery(elem);
            if ($elem.closest('.has-conditions.ff_excluded').length) {
                return;
            }
            let elementName = $elem.attr('name');
            let label = $elem.data('payment_label');
            if (!label) {
                label = $elem.closest('.ff-el-group').find('.ff-el-input--label label').text();
            }
            if (elementType === 'radio') {
                let $element = form.find('input[name=' + elementName + ']:checked');
                const planTitle = $element.val();
                that.maybeAddInventoryStockOutFailedValidation($elem, $element.data('quantity_remaining'), !$element.length);
                that.maybeHandleSubscriptionItem(elementName, $element, label, planTitle, pushItem);
            } else if (elementType === 'hidden') {
                that.maybeAddInventoryStockOutFailedValidation($elem, $elem.data('quantity_remaining'), true);
                that.maybeHandleSubscriptionItem(elementName, $elem, label, '', pushItem);
            } else if (elementType == 'number' || elementType == 'text') {
                let itemValue = window.ff_helper.numericVal(jQuery(this));
                if (itemValue != 0) {
                    pushItem(elementName, label, parseFloat(itemValue));
                }
            } else if (elementType == 'checkbox') {
                let groupId = $elem.data('group_id');
                let groups = form.find('input[data-group_id="' + groupId + '"]:checked');
                let groupTotal = 0;
                let childLabels = [];
                let minimum_remaining_qty;
                groups.each((index, group) => {
                    let itemPrice = jQuery(group).data('payment_value');
                    const current_remaining_qty = jQuery(group).data('quantity_remaining');
                    if (current_remaining_qty !== undefined) {
                        if (minimum_remaining_qty === undefined) {
                            minimum_remaining_qty = current_remaining_qty;
                        } else {
                            minimum_remaining_qty = minimum_remaining_qty > current_remaining_qty ? current_remaining_qty : minimum_remaining_qty;
                        }
                    }
                    if (itemPrice) {
                        groupTotal += parseFloat(itemPrice);
                        childLabels.push(jQuery(group).val());
                    }
                });

                if (childLabels.length) {
                    label += ' <ul class="ff_sub_items">';
                    childLabels.forEach(function (subLabel) {
                        label += '<li>' + subLabel + '</li>';
                    });
                    label += ' </ul>';
                }
                if (groupTotal) {
                    pushItem(elementName, label, groupTotal);
                }
                that.maybeAddInventoryStockOutFailedValidation($elem, minimum_remaining_qty, !groupTotal);
            } else if (elementType === 'select-one') {
                let $element = form.find('select[name=' + elementName + '] option:selected');
                const planTitle = $element.val();
                that.maybeAddInventoryStockOutFailedValidation($elem, $element.data('quantity_remaining'), !$element.length);
                that.maybeHandleSubscriptionItem(elementName, $element, label, planTitle, pushItem);
            }
        });

        return itemTotalValue;
    }

    maybeAddInventoryStockOutFailedValidation($element, remaining_qty, reset) {
        const name = $element.attr('name').replace('[', '').replace(']', '');
        if (reset) {
            this.formInstance?.removeFieldValidationRule(name, 'force_failed');
            return;
        }
        if (remaining_qty === undefined) return;
        const quantity = this.getQuantity(name);
        if(!quantity) return;
        if (remaining_qty < quantity) {
            this.formInstance?.addFieldValidationRule(name, 'force_failed', {
                value: true,
                message: 'This Item is Stock Out'
            });
            return;
        }
        this.formInstance?.removeFieldValidationRule(name, 'force_failed');
        $element.closest('.ff-el-group').removeClass('ff-el-is-error');
        $element.closest('.ff-el-group').find('.error').remove();
    }

    maybeHandleSubscriptionItem(elementName, $element, label, planTitle, pushItem) {
        let itemValue = parseFloat($element.attr('data-payment_value'));
        const signupFee = parseFloat($element.attr('data-signup_fee'));
        const hasTrialDays = $element.data('trial_days');
        const initialAmount = parseFloat($element.attr('data-initial_amount'));

        // Replace plan index to plan name
        if (planTitle && !isNaN(planTitle) && $element.data('plan_name')) {
            planTitle = $element.data('plan_name');
        }

        let signupLabel = '';
        if (planTitle) {
            signupLabel = this.$t('Signup Fee for %1s - %2s', label, planTitle);
        } else {
            signupLabel = this.$t('Signup Fee for %s', label);
        }

        if (initialAmount) {
            pushItem(elementName + '_signup_fee', signupLabel, initialAmount);
            itemValue = itemValue - initialAmount;
        }

        if ((hasTrialDays && itemValue === 0) || itemValue) {
            if (planTitle) {
                label += ' - ' + planTitle;
            }

            if (hasTrialDays) {
                label += ' ' + this.$t('(Trial)');
                itemValue = 0;
            }

            pushItem(elementName, label, parseFloat(itemValue));

            if (signupFee) {
                pushItem(elementName + '_signup_fee', signupLabel, signupFee);
            }

        }
    }

    getQuantity(itemName) {
        let $quantityDom = this.$form.find('input[data-target_product="' + itemName + '"]');
        if (!$quantityDom.length) {
            return 1;
        }

        const $quantityElemWithCondition = $quantityDom.closest('.ff-el-group.has-conditions:not(.ff_excluded)');
        if ($quantityElemWithCondition.length) {
            $quantityDom = $quantityElemWithCondition.find('input[data-target_product="' + itemName + '"]');
        }

        if ($quantityDom.closest('.ff-el-group.has-conditions.ff_excluded').length) {
            if ($quantityDom.hasClass('ff_quantity_item_slider')) {
                return 0;
            } else {
                $quantityDom.val('');
            }
        }

        var qty = $quantityDom.val();
        if (!qty || isNaN(qty)) {
            return 0;
        }

        return parseInt(qty);
    }

    replaceWords(sentence, wordsToReplace) {
        return Object.keys(wordsToReplace).reduce(
            (f, s, i) =>
                `${f}`.replace(new RegExp(s, 'ig'), wordsToReplace[s]),
            sentence
        )
    }

    getFormattedPrice(amount) {
        return formatPrice(parseFloat(amount * 100).toFixed(2), window['fluentform_payment_config_' + this.formId].currency_settings);
    }

    stripeRedirectToCheckout(data) {
        const locale = this.formPaymentConfig.stripe.locale;
        const stripe = new Stripe(this.formPaymentConfig.stripe.publishable_key, {
            locale: locale
        });
        stripe.registerAppInfo(this.formPaymentConfig.stripe_app_info);

        stripe.redirectToCheckout({
            sessionId: data.sessionId
        }).then((result) => {
            console.log(result);
        });
    }

    normalRedirect(data) {
        window.location.href = data.redirect_url;
    }

    getDiscounts() {
        return Object.values(this.appliedCoupons);
    }

    initDiscountCode() {
        let couponCodes = this.$form.find('.ff_coupon_wrapper');
        if (!couponCodes.length) {
            return false;
        }

        this.$form.append('<input type="hidden" class="__ff_all_applied_coupons" name="__ff_all_applied_coupons"/>')

        jQuery.each(couponCodes, (index, codeWrapper) => {
            let $codeWrapper = jQuery(codeWrapper);
            let $btn = $codeWrapper.find('.ff_input-group-append');
            $btn.on('click', () => {
                const $input = $codeWrapper.find('input.ff_coupon_item');
                let code = $input.val();
                if (!code) {
                    return '';
                }
                $input.attr('disabled', true);
                let inputName = $input.attr('name');

                jQuery.post(window.fluentFormVars.ajaxUrl, {
                    action: 'fluentform_apply_coupon',
                    form_id: this.formId,
                    total_amount: this.totalAmount,
                    coupon: code,
                    other_coupons: this.$form.find('.__ff_all_applied_coupons').val()
                })
                    .then(response => {
                        const coupon = response.coupon;
                        if (Object.keys(this.appliedCoupons).includes(coupon.code)) {
                            return;
                        }
                        this.appliedCoupons[coupon.code] = coupon;
                        this.$form.find('.__ff_all_applied_coupons').attr('value', JSON.stringify(Object.keys(this.appliedCoupons)));
                        let couponAmount = coupon.amount + '%';
                        if (coupon.coupon_type == 'fixed') {
                            couponAmount = this.getFormattedPrice(coupon.amount);
                        }

                        let discountAmount = coupon.amount;
                        if (coupon.coupon_type === 'percent') {
                            discountAmount = ((coupon.amount / 100) * this.totalAmount).toFixed(2);
                        }
                        const remainAmount = this.totalAmount - discountAmount;

                        const message = coupon.message || "{coupon.code} <span>-{coupon.amount}</span>";
                        const wordsToReplace = {
                            '{coupon.code}': coupon.code,
                            '{coupon.amount}': couponAmount,
                            '{total_amount}': this.totalAmount,
                            '{discount_amount}' : discountAmount,
                            '{remain_amount}': remainAmount
                        }
                        const formattedMessage = this.replaceWords(message, wordsToReplace);

                        this.recordCouponMessage($codeWrapper, code, formattedMessage, 'success');
                        $input.val('');
                    })
                    .fail((errors) => {
                        this.recordCouponMessage($codeWrapper, code, errors.responseJSON.message, 'error');
                    })
                    .always(() => {
                        $input.attr('disabled', false);
                        this.$form.trigger('do_calculation');
                    });

            });
        });
    }

    recordCouponMessage($wrapper, coupon_code, message, type) {
        if (!$wrapper.find('.ff_coupon_responses').length) {
            $wrapper.append('<ul class="ff_coupon_responses"></ul>');
        }

        const $responseDiv = $wrapper.find('.ff_coupon_responses');
        $responseDiv.find('.ff_error, .ff_resp_item_' + coupon_code).remove();

        let errorHtml = jQuery('<li/>', {
            'class': `ff_${type} ff_resp_item_${coupon_code}`
        });

        let cross = jQuery('<span/>', {
            class: 'error-clear',
            html: '&times;',
            click: (e) => {
                $responseDiv.find('.ff_resp_item_' + coupon_code).remove();
                if (coupon_code in this.appliedCoupons) {
                    delete this.appliedCoupons[coupon_code];
                    this.$form.find('.__ff_all_applied_coupons').attr('value', JSON.stringify(Object.keys(this.appliedCoupons)));
                    this.$form.trigger('do_calculation');
                }
            }
        });

        $responseDiv.append(errorHtml.append(cross, message));
    }

    mayBeToggleSubscriptionRelatedThings(event) {
        const element = jQuery(event.target);

        if (element.hasClass('ff_subscription_item')) {
            const value = element.val();
            const parent = element.closest('.ff-el-input--content');

            parent.find('.ff-custom-user-input-wrapper').addClass('hidden_field');
            const $currentItem = parent.find('.ff-custom-user-input-wrapper-' + value);
            $currentItem.removeClass('hidden_field');
            const min = $currentItem.find('input').data('min') || 0;
            $currentItem.find('input').attr('min', min);

            parent.find('.ff_summary_container').addClass('hidden_field');
            parent.find('.ff_summary_container_' + value).removeClass('hidden_field');

            parent.find('.ff-custom-user-input-wrapper.hidden_field input').attr('min', '0');
        }
    }

    handleCustomUserInputChange(event) {
        const $element = jQuery(event.target);
        const customAmount = parseFloat($element.val()) || 0;

        const parentInputName = $element.data('parent_input_name');
        const parentInputType = $element.data('parent_input_type');
        let parentPlanIndex = $element.data('plan_index');

        let $parent;
        if (parentInputType === 'select') {
            $parent = this.$form.find('select[name=' + parentInputName + '] option:selected');
            parentPlanIndex = $parent.val();
        } else if (parentInputType === 'radio') {
            $parent = this.$form.find('input[name=' + parentInputName + ']:checked');
        } else {
            $parent = this.$form.find('input[name=' + parentInputName + ']');
        }

        const initialAmount = parseFloat($parent.data('initial_amount'));
        const paymentValue = customAmount + initialAmount;
        const signupFee = parseFloat($parent.attr('data-signup_fee'));

        $parent.attr('data-payment_value', paymentValue);

        const $paymentSummary = $element.parent().parent().find('.ff_summary_container_' + parentPlanIndex);
        $paymentSummary.find('.ffbs_subscription_amount').html(this.getFormattedPrice(customAmount));
        $paymentSummary.find('.ffbs_first_interval_total').html(this.getFormattedPrice(paymentValue + signupFee));

        this.calculatePayments();
    }

    initStripeElement() {
        if (!this.$form.hasClass('ff_has_stripe_inline')) {
            return;
        }

        // Initialize Stripe object
        this.ensureStripeIsInitialized();

        // Now set up the inline form elements with styles
        let customStyles = this.formPaymentConfig.stripe.custom_style.styles;
        const elements = this.stripe.elements();

        const card = elements.create("card", {
            style: customStyles,
            hidePostalCode: !this.formPaymentConfig.stripe.inlineConfig.verifyZip,
            disableLink: this.formPaymentConfig.stripe.inlineConfig.disable_link,
        });

        // let's find the element
        const inlineElementId = this.$form.find('.ff_stripe_card_element').attr('id');

        if (!inlineElementId) {
            console.log('No Stripe Cart Element Found');
            return;
        }

        // Add an instance of the card Element into the `card-element` <div>.
        card.mount("#" + inlineElementId);

        card.addEventListener('change', (event) => {
            this.toggleStripeInlineCardError(event.error);
        });

        this.stripeCard = card;

        this.$form.on('fluentform_submission_success', () => {
            card.clear();
        });

        this.$form.on('fluentform_submission_failed', () => {
            this.stripeCard.update({disabled: false});
        });

        this.registerStripePaymentToken(inlineElementId);

        // Listener for update stripe input element styles.
        const that = this;
        this.$form.on('fluentform_update_stripe_inline_element_style', function (event, styles) {
            that.handleStripeStyleUpdate(styles, customStyles)
        })

        // get custom inline styles from stripe inline config and update stripe input element styles
        const styles = this.formPaymentConfig.stripe?.inlineConfig?.inline_styles || false;
        this.handleStripeStyleUpdate(styles, customStyles)
    }

    // method for parse string styles to JS Object styles
    getJsStylesFromStringStyle(styles) {
        if (!styles) return null;
        const styleObj = {};
        styles = styles.split(';');
        styles.forEach(style => {
            if (style) {
                style = style.split(':');
                let key = style[0].trim();
                if (key.includes('-')) {
                    key = key.split('-');
                    key = key[0] + key[1][0].toUpperCase() + key[1].slice(1);
                }
                styleObj[key] = style[1].trim();
            }
        })
        return styleObj;
    }

    // handler for customize stripe input element styles
    handleStripeStyleUpdate(styles, defaultStyle) {
        if (styles) {
            const that = this;
            // JS Styles object
            const stylesObj = {
                error_msg: that.getJsStylesFromStringStyle(styles.error_msg),
                input: that.getJsStylesFromStringStyle(styles.input),
                focusInput: that.getJsStylesFromStringStyle(styles.focusInput),
                placeholder: that.getJsStylesFromStringStyle(styles.placeholder),
            };
            const style = {...defaultStyle}

            // css style property not supported for stripe input element in jsStyle format
            const notSupportedByStripe = ['boxShadow', 'border', 'borderStyle', 'borderWidth', 'borderColor', 'borderRadius'];
            if (stylesObj.input) {
                for (const property in stylesObj.input) {
                    if (!defaultStyle.base[property]) {
                        // delete style property from original styleObj that's not support by stripe
                        if (notSupportedByStripe.includes(property)) {
                            delete stylesObj.input[property];
                        }
                    }
                }
                style.base = {...style.base, ...stylesObj.input}
            }
            if (stylesObj.placeholder) {
                // handle placeholder styles
                style.base["::placeholder"] = {...style.base['::placeholder'], ...stylesObj.placeholder}
            }
            if (stylesObj.focusInput) {
                // handle input focus styles
                for (const property in stylesObj.focusInput) {
                    // delete style property from original styleObj that's not support by stripe
                    if (notSupportedByStripe.includes(property)) {
                        delete stylesObj.focusInput[property];
                    }
                }
                style.base[":focus"] = {...style.base[':focus'], ...stylesObj.focusInput}
            }
            if (stylesObj.error_msg) {
                // handle input error styles
                style.invalid = {...style.invalid, ...stylesObj.error_msg}
                jQuery('.ff_card-errors').css(style.invalid) // update inline error message styles
            }
            // Update stripe input element styles on iframe. Stripe render input element inside iframe
            this.stripeCard.update({style})
        }
    }

    initPaymentMethodChange() {
        const $paymentMethods = this.$form.find('.ff_payment_method');
        if ($paymentMethods.length > 1) {
            this.paymentMethod = $paymentMethods.filter((i, e) => e.checked).val();
        } else {
            this.paymentMethod = $paymentMethods.val();
        }

        if ($paymentMethods.length > 1) {
            $paymentMethods.change((event) => {
                this.paymentMethod = event.target.value;

                jQuery(event.target).closest('.ff-el-input--content').find('.ff_pay_inline').css({display: 'none'});

                if (this.paymentMethod === 'stripe') {
                    jQuery(event.target).closest('.ff-el-input--content').find('.stripe-inline-wrapper').css({display: 'block'});
                }

                if (this.paymentMethod === 'square') {
                    jQuery(event.target).closest('.ff-el-input--content').find('.square-inline-wrapper').css({display: 'block'});
                }
            });
        }
    }

    registerStripePaymentToken(inlineElementId) {
        var that = this;
        this.formInstance.addGlobalValidator('stripeInlinePayment', function ($theForm, formData) {
            if (that.paymentMethod === 'stripe' && !that.hasPaymentItems) {
                if (!jQuery('#' + inlineElementId).closest('.ff_excluded').length) {
                    that.formInstance.showFormSubmissionProgress($theForm);
                    jQuery('<div/>', {
                        'id': that.formId + '_success',
                        'class': 'ff-message-success ff_msg_temp'
                    })
                        .html(that.$t('processing_text'))
                        .insertAfter(that.$form);
                    that.toggleStripeInlineCardError();
                    var dfd = jQuery.Deferred();
                    that.stripe.createPaymentMethod(
                        'card',
                        that.stripeCard
                    ).then(result => {
                        //that.formInstance.hideFormSubmissionProgress($theForm);
                        if (result.error) {
                            that.toggleStripeInlineCardError(result.error);
                        } else {
                            that.stripeCard.update({disabled: true});
                            that.formInstance.hideFormSubmissionProgress($theForm);
                            jQuery('<div/>', {
                                'id': that.formId + '_success',
                                'class': 'ff-message-success ff_msg_temp'
                            })
                                .html(that.$t('processing_text'))
                                .insertAfter(that.$form);
                            formData.data += '&' + jQuery.param({
                                '__stripe_payment_method_id': result.paymentMethod.id
                            });
                            dfd.resolve();
                        }
                    });
                    return dfd.promise();
                }
            }
        });
    }

    toggleStripeInlineCardError(error) {
        const $errorDiv = this.$form.find('.ff_card-errors');

        if (error) {
            $errorDiv.html(error.message);
            $errorDiv.closest('.stripe-inline-wrapper').addClass('ff-el-is-error');
            this.formInstance.hideFormSubmissionProgress(this.$form);
            this.stripeCard.update({disabled: false});
        } else {
            $errorDiv.html('');
            $errorDiv.closest('.stripe-inline-wrapper').removeClass('ff-el-is-error');
        }

        setTimeout(() => {
            this.maybeRemoveSubmitError();
        }, 500)
    }

    handleAccessibility() {
        const observer = new MutationObserver(() => {
            document.querySelectorAll("iframe").forEach(iframe => {
                if (!iframe.hasAttribute("title")) {
                    // Stripe iframe
                    if (iframe.name.startsWith("__privateStripeFrame")) {
                        iframe.setAttribute("title", "Secure Stripe Payment Frame");
                    }
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    stripeSetupIntent(data) {
        if (!this.ensureStripeIsInitialized()) {
            console.error('Stripe is not initialized');
            return;
        }

        this.stripe.confirmCardPayment(
            data.client_secret,
            {
                payment_method: data.payment_method_id
            }
        ).then(result => {
            if (result.error) {
                this.toggleStripeInlineCardError(result.error);
            } else {
                this.handleStripePaymentConfirm({
                    action: 'fluentform_sca_inline_confirm_payment_setup_intents',
                    form_id: this.formId,
                    payment_method: result.paymentIntent.payment_method,
                    payemnt_method_id: data.payemnt_method_id,
                    payment_intent_id: result.paymentIntent.id,
                    submission_id: data.submission_id,
                    stripe_subscription_id: data.stripe_subscription_id,
                    type: 'handleCardSetup'
                });
            }
        });
    }

    initStripeSCAModal(data) {
        if (!this.ensureStripeIsInitialized()) {
            console.error('Stripe is not initialized');
            return;
        }

        this.formInstance.showFormSubmissionProgress(this.$form);
        this.stripe.handleCardAction(
            data.client_secret
        ).then(result => {
            if (result.error) {
                this.formInstance.hideFormSubmissionProgress(this.$form);
                this.toggleStripeInlineCardError(result.error)
            } else {
                this.handleStripePaymentConfirm({
                    action: 'fluentform_sca_inline_confirm_payment',
                    form_id: this.formId,
                    payment_method: result.paymentIntent.payment_method,
                    payment_intent_id: result.paymentIntent.id,
                    submission_id: data.submission_id,
                    type: 'handleCardAction'
                });
            }
        });
    }

    handleStripePaymentConfirm(data) {
        this.maybeRemoveSubmitError();

        jQuery('<div/>', {
            'id': this.formId + '_success',
            'class': 'ff-message-success ff_msg_temp'
        })
            .html(this.$t('confirming_text'))
            .insertAfter(this.$form);

        this.formInstance.showFormSubmissionProgress(this.$form);
        window.fluentFormApp(this.$form).sendData(this.$form, data);
    }

    ensureStripeIsInitialized() {
        if (!this.stripe && this.formPaymentConfig && this.formPaymentConfig.stripe) {
            const locale = this.formPaymentConfig.stripe.locale;
            this.stripe = new Stripe(this.formPaymentConfig.stripe.publishable_key, {
                locale: locale
            });
            if (this.formPaymentConfig.stripe_app_info) {
                this.stripe.registerAppInfo(this.formPaymentConfig.stripe_app_info);
            }
            return true;
        }
        return !!this.stripe;
    }

    maybeRemoveSubmitError() {
        jQuery('#form_success').remove();
    }
}
// Register payment handler events only if pro is not installed.
// If pro is installed, payment handler events is registered from payment_handler_pro.js
if (!window.fluentFormVars.pro_payment_script_compatible) {
    (function ($) {
        $.each($('form.fluentform_has_payment'), function () {
            const $form = $(this);
            $form.on('fluentform_init_single', function (event, instance) {
                (new Payment_handler($form, instance)).init();
            });
        });

        $(document).on('ff_reinit', function (e, formItem) {
            var $form = $(formItem);
            $form.attr('data-ff_reinit', 'yes');
            const instance = fluentFormApp($form);
            if (!instance) {
                return false;
            }
            (new Payment_handler($form, instance)).init();
        });
    }(jQuery));
}
