jQuery(document).ready(function ($) {
    const $responseDom = $('body').find('.ff_paddle_payment_container');
    const $responseTitle = $('body').find('.ff_frameless_header');

    if (!$responseDom.length) {
        return;
    }

    const paddleVars = window.ff_paddle_vars;
    const frameInitialHeight = paddleVars.frame_initial_height || '450';
    const frameStyle = paddleVars.frame_style || 'width: 100%; min-width: 312px; background-color: transparent; border: none;';
    const allowedPaymentMethods =  paddleVars.allowed_payment_methods || ['alipay', 'apple_pay', 'bancontact', 'card', 'google_pay', 'ideal', 'paypal'];
    const environment = paddleVars.payment_mode || 'sandbox';
    const theme = paddleVars.theme || 'light';
    const locale = paddleVars.locale || 'en';
    const clientToken = paddleVars.client_token;
    if (!clientToken) {
        return;
    }

    Paddle.Environment.set(environment);
    Paddle.Initialize({
        token: clientToken,
        checkout: {
            settings: {
                displayMode: "inline",
                allowedPaymentMethods: allowedPaymentMethods,
                theme: theme,
                locale: locale,
                frameTarget: "ff_paddle_payment_container",
                frameInitialHeight: frameInitialHeight,
                frameStyle: frameStyle
            }
        },
        eventCallback: function(res) {
            if (res.name == "checkout.completed") {
                const data = {
                    action: 'fluentform_paddle_confirm_payment',
                    transaction_hash: paddleVars.transaction_hash,
                    submission_id: paddleVars.submission_id,
                    paddle_payment: res.data
                }

                $.post(paddleVars.ajax_url, data)
                    .then(response => {
                        if (response.data && response.data.payment.id == res.data.id) {
                            $responseDom.find('p').text(response.data.success_message);
                            $responseTitle.text(paddleVars.title_message);
                        }
                    })
                    .catch(errors => {
                        let message = 'Request failed. Please try again';
                        if (errors && errors.responseJSON) {
                            message = errors.responseJSON.errors;
                        }
                        $responseDom.find('p').text(message);
                    })
            }

            if (res.name == "checkout.error") {
                let message = 'Paddle payment process failed!'
                if (res.data && res.data.error) {
                    message = res.data.error.detail;
                }
                $responseDom.find('p').text(message);
            }
        }
    });
})