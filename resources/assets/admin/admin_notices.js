const ffNoticeApp = {

    initNagButton() {
        let $btn = jQuery('.ff_nag_cross');
        $btn.on('click', function (e) {
            e.preventDefault();
            let noticeName = jQuery(this).attr('data-notice_name');
            let noticeType = jQuery(this).attr('data-notice_type');
            
            jQuery('#ff_notice_' + noticeName).remove();

            jQuery.post(ajaxurl, {
                action: 'fluentform_notice_action',
                notice_name: noticeName,
                action_type: noticeType
            })
                .then(function (response) {
                    console.log(response);
                })
                .fail(function (error) {
                    console.log(error);
                });
        });

    },

    initTrackYes() {
        let $btn = jQuery('.ff_track_yes');
        $btn.on('click', function (e) {
            e.preventDefault();
            let noticeName = jQuery(this).attr('data-notice_name');
            let emailEnabled = 0;
            if (jQuery('#ff-optin-send-email').attr('checked')) {
                 emailEnabled = 1;
            }

            jQuery('#ff_notice_' + noticeName).remove();

            jQuery.post(ajaxurl, {
                action: 'fluentform_notice_action_track_yes',
                notice_name: noticeName,
                email_enabled: emailEnabled
            })
                .then(function (response) {
                    console.log(response);
                })
                .fail(function (error) {
                    console.log(error);
                });

        });

    },

    initReady() {
        jQuery(document).ready(() => {
            this.initNagButton();
            this.initTrackYes();
        });
    }
};

ffNoticeApp.initReady();