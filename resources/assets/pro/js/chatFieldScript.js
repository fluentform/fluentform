(($) => {
    const message = window.fluentform_chat.message;
    const loader = `
        <div class="ff-chat-gpt-loader-svg" style="text-align: center">
            <p class="ff-chat-gpt-loading-msg">${message}</p>
            <div>
                <svg version="1.1"
                     id="L4"
                     xmlns="http://www.w3.org/2000/svg"
                     xmlns:xlink="http://www.w3.org/1999/xlink"
                     x="0px"
                     y="0px"
                     viewBox="0 0 100 100"
                     enable-background="new 0 0 0 0"
                     xml:space="preserve"
                     width="50px"
                     height="50px"
                     style="margin: 0px auto;"
                >
                    <circle fill="#000" stroke="none" cx="6" cy="50" r="6">
                        <animate attributeName="opacity" dur="1s" values="0;1;0" repeatCount="indefinite" begin="0.1"/>
                    </circle>
                    <circle fill="#000" stroke="none" cx="26" cy="50" r="6">
                        <animate attributeName="opacity" dur="1s" values="0;1;0" repeatCount="indefinite" begin="0.2"/>
                    </circle>
                    <circle fill="#000" stroke="none" cx="46" cy="50" r="6">
                        <animate attributeName="opacity" dur="1s" values="0;1;0" repeatCount="indefinite" begin="0.3"/>
                    </circle>
                </svg>
            </div>
        </div>
    `;

    $(document.body).on('fluentform_init', function (e, $form) {
        if (!$form.hasClass('ff-has-chat-gpt')) {
            return;
        }

        $form.find('button[type=submit]').on('click', function (e) {
            e.preventDefault();
            $form.toggle();
            $form.parents('.fluentform').append(loader);
            $form.trigger('submit');
        });

        $form.on('fluentform_submission_success', function (e, {form}) {
            form.toggle();
            form.siblings('.ff-chat-gpt-loader-svg').toggle();
        });

        $form.on('fluentform_submission_failed', function (e, {form}) {
            form.toggle();
            form.siblings('.ff-chat-gpt-loader-svg').toggle();
        });
    });

    // ajax request for chat field
    /*let $chatFieldDom = $form.find("[data-ff-chat-field]");

    if (!$chatFieldDom.length) {
        return;
    }

    $.each($chatFieldDom, function (index, singleChatField) {
        index += 1;
        let $singleChatField = $(singleChatField);

        const sendSvgIcon = window.fluentform_chat.send_svg_icon;

        $singleChatField.parents('.ff-el-input--content').addClass(`ff-el-chat-container ff-el-chat-group-${index}`);
        $singleChatField.after(`
        <button class="ff_btn_chat_style ff_btn_chat-${index}">${sendSvgIcon}</button>
    `);

        let $chatFieldDomParent = $singleChatField.parents('.ff-el-group');
        $chatFieldDomParent.before(`
        <div class="ff-el-group ff-chat-reply-container">
            <div class="ff-el-chat-box-${index}"></div>
        </div>
    `);

        const $submitBtnParent = $form.find("button[type=submit]").parent();
        if (!$submitBtnParent.length) {
            return;
        }

        const disable_submit_button = window.fluentform_chat.disable_submit_button;

        if (disable_submit_button) {
            $submitBtnParent.hide();
        } else {
            $submitBtnParent.show();
        }

        const hasDefaultContent = window.fluentform_chat.content;

        if (hasDefaultContent) {
            fetchRequest($, $singleChatField, index, $formId);
        }

        $(`.ff_btn_chat-${index}`).on('click', function (e) {
            e.preventDefault();
            fetchRequest($, $singleChatField, index, $formId);
        });

        $singleChatField.on('keydown', function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                fetchRequest($, $singleChatField, index, $formId);
            }
        });
    });*/
})(jQuery);

// ajax request for chat field
/*async function fetchRequest($, chatField, index, $formId) {
    let {
        self_chat_bg_color,
        reply_chat_bg_color,
        show_chat_limit,
        content
    } = {...window.fluentform_chat};

    if (chatField.val()) {
        content = chatField.val();
    }

    let $chatboxEl = $(`.ff-el-chat-box-${index}`);

    if (content) {
        $chatboxEl.append(`
            <p class="ff-self-chat">${content}</p>
        `);

        $chatboxEl.find('.ff-self-chat').css('background-color', self_chat_bg_color);
    }

    $chatboxEl.append(`
        <p class="skeleton"></p>
    `);

    chatField.attr('disabled', true);
    chatField.siblings(`.ff_btn_chat-${index}`).attr('disabled', true);
    chatField.val('');

    var formData = {
        action: 'fluentform_openai_chat_completion',
        nonce: window.fluentform_chat.nonce,
        form_id: $formId,
        content: content
    };

    jQuery.post(fluentFormVars.ajaxUrl, formData)
        .then(data => {
            chatField.attr('disabled', false);
            let $chatParagraph = $chatboxEl.find('p');
            if ($chatParagraph.length > parseInt(show_chat_limit)) {
                $chatParagraph.slice(0, 2).remove();
            }
            const message = data.data.choices[0].message.content;

            $chatboxEl.find('.skeleton')
                .text(`${message}`)
                .removeClass('skeleton')
                .addClass('ff-reply-chat');

            $chatboxEl.find('.ff-reply-chat').css('background-color', reply_chat_bg_color);

            chatField
                .siblings(`.ff_btn_chat-${index}`)
                .attr('disabled', false);
        })
        .fail(err => {
            chatField.attr('disabled', false);

            $chatboxEl.find('.skeleton')
                .text(`${err.responseJSON.data}`)
                .removeClass('skeleton')
                .addClass('ff-reply-chat');

            $chatboxEl.find('.ff-reply-chat').css('background-color', reply_chat_bg_color);

            chatField
                .siblings(`.ff_btn_chat-${index}`)
                .attr('disabled', false);
        })
        .always(res => {

        });
} */

