jQuery(document).ready(function ($) {
    const $responseDom = $('body').find('.ff_paypal_delay_loader_check');
    if (!$responseDom.length) {
        return;
    }

    sendTimeOutRequest();

    let iteration = 0;

    function sendTimeOutRequest() {
        iteration++;
        setTimeout(sendRequest, window.ff_paypal_vars.timeout)
    }

    function sendRequest() {
        $.post(window.ff_paypal_vars.ajax_url, {
            submission_id: window.ff_paypal_vars.submission_id,
            action: 'fluentform_paypal_delayed_check',
        })
            .then(response => {
                if (response.data.nextAction && response.data.nextAction == 'reload') {
                    window.location.reload();
                } else {
                    if (iteration <= 5) {
                        sendTimeOutRequest();
                    } else {
                        $('.ff_paypal_loader_svg').remove();
                        $responseDom.html(window.ff_paypal_vars.onFailedMessage);
                    }
                }

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
    }

});
