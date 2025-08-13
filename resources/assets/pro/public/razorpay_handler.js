class RazorpayHandler {
    constructor($form, instance) {
        let formId = instance.settings.id;
        this.$form = $form;
        this.formInstance = instance;
        this.formId = formId;
    }

    init() {
        this.$form.on('fluentform_next_action_razorpay', (event, data) => {
            const response = data.response;
            this.$form.parent().find('.ff_razorpay_text').remove();

            jQuery('<div/>', {
                'id': 'form_success',
                'class': 'ff-message-success ff_razorpay_text'
            })
                .html(response.data.message)
                .insertAfter(this.$form);

            if(response.data.actionName === 'initRazorPayModal') {
                this.initRazorPayModal(response.data);
            } else {
                alert('No method found');
            }
        });
    }

    initRazorPayModal(res) {
        var that = this;
        const options = res.modal_data;
        options.handler = function (response) {
            that.formInstance.hideFormSubmissionProgress(that.$form);
            const data = {
                action: 'fluentform_razorpay_confirm_payment',
                transaction_hash:  res.transaction_hash,
                form_id: that.formId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
            }

            that.$form.parent().find('.ff_razorpay_text').remove();

            jQuery('<div/>', {
                'id': that.formId + '_success',
                'class': 'ff-message-success ff_msg_temp ff_razorpay_text'
            })
                .html(res.confirming_text)
                .insertAfter(that.$form);

            that.formInstance.showFormSubmissionProgress(that.$form);
            that.formInstance.sendData(that.$form, data);
        }

        options.modal = {
            escape: false,
            ondismiss: function () {
                that.$form.parent().find('.ff_razorpay_text').remove();
                that.formInstance.hideFormSubmissionProgress(that.$form);
            }
        }

        const pay = new Razorpay(options);

        pay.on('payment.failed', function (response){
            console.log(response);
            that.formInstance.hideFormSubmissionProgress(that.$form);
        });

        this.formInstance.showFormSubmissionProgress(this.$form);
        pay.open();

    }
}

function initializeRazorpay($) {
    $.each($('form.fluentform_has_payment'), function () {
        function razorpayInit(event, instance) {
            (new RazorpayHandler($form, instance)).init();
        }
        const $form = $(this);
        $form.off('fluentform_init_single', '', razorpayInit);
        $form.on('fluentform_init_single', razorpayInit);
    });
}
initializeRazorpay(jQuery);
jQuery(document).ready(function ($) {
    initializeRazorpay($);
});