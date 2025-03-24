jQuery(document).ready(function ($) {
    const $btn = $('.ff_show_payments');
    $btn.on('click', function (e) {
        e.preventDefault();
        $('.ff_sub_cancel_confirmation').hide();
        const $this = $(this);
        const subId = $this.data('subscription_id');
        const $payWrapBody = $this.closest('.ff_subscription').find('.ff_subscription_payments');
        if ($this.attr('data-got_payments')) {
            $this.attr('data-got_payments', '');
            $payWrapBody.removeClass('ff_has_payments')
                .html('');
            return;
        }

        $payWrapBody.html('Fetching Payments...');

        fetchPayments(subId, $this, (response_html, status) => {
            if (status) {
                $this.attr('data-got_payments', 'yes');
            } else {
                $this.attr('data-got_payments', '');
            }
            $payWrapBody
                .addClass('ff_has_payments')
                .html(response_html);
        });
    });

    function fetchPayments(subId, $btn, callback) {

        $btn.addClass('ff_payments_fetching').prop("disabled", true);

        jQuery.get(window.ff_transactions_vars.ajax_url, {
            subscription_id: subId,
            action: 'fluentform_user_payment_endpoints',
            route: 'get_subscription_transactions',
            _nonce: window.ff_transactions_vars.nonce
        })
            .then(response => {
                callback(response.data.html, 'success');
            })
            .catch(errors => {
                if (!errors.responseJSON) {
                    callback(errors.responseText);
                } else if (errors.responseJSON.data) {
                    callback(errors.responseJSON.data.message);
                } else {
                    callback('Could not fetch the payments. Please try again');
                }
            })
            .always(() => {
                $btn.removeClass('ff_payments_fetching').prop("disabled", false);
            });
    }

    // Subscription cancels
    const $cancelBtn = $('.ff_cancel_subscription');
    $cancelBtn.on('click', function (e) {
        e.preventDefault();
        $('.ff_subscription_payments').html('').removeClass('ff_has_payments');
        const $this = $(this);
        const subId = $this.data('subscription_id');
        const $payWrapBody = $this.closest('.ff_subscription').find('.ff_sub_cancel_confirmation');
        $payWrapBody.find('.ff_confirm_subscription_cancel').attr('data-subscription_id', subId);
        $payWrapBody.show();
    });

    $('.ff_confirm_subscription_cancel').on('click', function () {
        const $this = $(this);
        const subId = $this.data('subscription_id');
        $this.prop('disabled', true);
        const $responseDom = $this.closest('.ff_sub_cancel_confirmation').find('.ff_sub_message_notices');

        $responseDom.html('Sending Request Please wait...');

        jQuery.post(window.ff_transactions_vars.ajax_url, {
            subscription_id: subId,
            action: 'fluentform_user_payment_endpoints',
            route: 'cancel_transaction',
            _nonce: window.ff_transactions_vars.nonce
        })
            .then(response => {
                $responseDom.html(response.message);
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            })
            .catch(errors => {
                let message = 'Request failed. Please try again';
                if (!errors.responseJSON) {
                    message = errors.responseText;
                } else if (errors.responseJSON.data) {
                    message = errors.responseJSON.data.message;
                }
                $responseDom.html(message);
            })
            .always(() => {
                $this.prop('disabled', false);
            });

    });

    $('.ff_cancel_close').on('click', function () {
        $('.ff_sub_cancel_confirmation').hide();
    });

}(jQuery));