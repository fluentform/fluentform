class PaystckHandler {
    constructor($form, instance) {
        let formId = instance.settings.id;
        this.$form = $form;
        this.formInstance = instance;
        this.formId = formId;
    }

    init() {
        this.$form.on('fluentform_next_action_paystack', (event, data) => {
            const response = data.response;
            this.$form.parent().find('.ff_paystack_text').remove();

            jQuery('<div/>', {
                'id': 'form_success',
                'class': 'ff-message-success ff_paystck_text'
            })
                .html(response.data.message)
                .insertAfter(this.$form);

            if(response.data.actionName === 'initPaystackModal') {
                this.initPaystackModal(response.data);
            } else {
                alert('No method found');
            }
        });
    }

    initPaystackModal(res) {
        var that = this;
        const options = res.modal_data;
        options.callback = function (response) {
            that.formInstance.hideFormSubmissionProgress(that.$form);
            const data = {
                action: 'fluentform_paystack_confirm_payment',
                form_id: that.formId,
                ...response
            }

            that.$form.parent().find('.ff_paystck_text').remove();

            jQuery('<div/>', {
                'id': that.formId + '_success',
                'class': 'ff-message-success ff_msg_temp ff_razorpay_text'
            })
                .html(res.confirming_text)
                .insertAfter(that.$form);

            that.formInstance.showFormSubmissionProgress(that.$form);
            that.formInstance.sendData(that.$form, data);
        }

        options.onClose = function (error) {
            that.$form.parent().find('.ff_paystck_text').remove();
        }

        let handler = PaystackPop.setup(options);
        handler.openIframe();
    }
}

function initializePaystack($) {
    $.each($('form.fluentform_has_payment'), function () {
        const $form = $(this);
        function paystackInit(event, instance) {
            (new PaystckHandler($form, instance)).init();
        }
        $form.off('fluentform_init_single', '', paystackInit);
        $form.on('fluentform_init_single', paystackInit);
    });
}
initializePaystack(jQuery);
jQuery(document).ready(function ($) {
    initializePaystack($);
});