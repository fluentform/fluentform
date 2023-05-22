jQuery(document).ready(function ($) {

    let isPreviewOnly = window.localStorage.getItem('ff_preview_only');
    if(isPreviewOnly){
        $('.ff_preview_body').addClass('ff_preview_only');
        $("#ff_preview_only").attr("checked", true);
    }
    let screenType = window.localStorage.getItem('ff_window_type');
    screenChange(screenType);

    $('.ff_device_control').click(function(){
        let screenType = $(this).data('type');
        screenChange(screenType);
    });

    $('.ff_device_control').on('click', function () {
        let screenType = $(this).data('type');
        window.localStorage.setItem('ff_window_type', screenType);
    });

    $('#ff_preview_only').on('change', function () {
        var isChecked = $(this).is(':checked');
        if(isChecked) {
            $('.ff_preview_body').addClass('ff_preview_only');
            $('.ff_preview_text').html('Preview Mode');
            $('.ff_form_preview_style_toggle').hide();
        } else {
            $('.ff_preview_body').removeClass('ff_preview_only');
            $('.ff_preview_text').html('Design Mode');
            $('.ff_form_preview_style_toggle').show();
        }
        window.localStorage.setItem('ff_preview_only', isChecked);

    });
    // copy to clipboard
    let copyToggle = $("#copy-toggle");
    let copy = $('#copy');
    let body = $("body");
    copyToggle.on('click', function(){
        let copyText = copy.text();
        let temp = $("<input>");
        body.append(temp);
        temp.val(copyText).select();
        document.execCommand("copy");
        temp.remove();
        let alertElem = $('<div role="alert" class="el-notification right" style="bottom: 16px; z-index: 999999;"><i class="el-notification__icon el-icon-success"></i><div class="el-notification__group is-with-icon"><h2 class="el-notification__title">Success</h2><div class="el-notification__content"><p>Copied to Clipboard.</p></div></div></div>');
        body.append(alertElem);
        setTimeout(function(){
            alertElem.remove();
        }, 2000);

    });

    $('.ff_form_preview_wrapper .fluentform ').on('click', function (e) {
        $elm = $( e.target );
        const islabel = $elm.parent().hasClass('ff-el-input--label');
        const isInput = $elm.hasClass('ff-el-form-control');
        const isCheckable = $elm.parent().hasClass('ff-el-form-check-label');
        const isSubmitBtn = $elm.hasClass('ff-btn-submit');
        const isSectionBreak = $elm.parent().hasClass('ff-el-section-break') || $elm.parent().hasClass('ff-custom_html');
        let type = '';
        if(islabel){
            type = 'label';
        }else if(isInput){
            type = 'input';
        }else if(isCheckable){
            type = 'checkable';
        }else if(isSubmitBtn){
            type = 'submitBtn';
        }else if(isSectionBreak){
            type = 'sectionBrk';
        }
        if(type != ''){
            window.dispatchEvent(new CustomEvent("selectionFired", {
                "detail": {
                    'type' : type
                }
            }));
        }
    });


});

function screenChange(screenType){
    let mobile = '375px';
    let tablet = '768px';
    let monitor = '100%';
    let containerElements = [];
    let containerDisplay = 'flex'; // 'flex' is container element default display value
    let $wrapper = jQuery('.ff_form_preview_wrapper');
    $wrapper.addClass(screenType);

    jQuery('.ff_device_control').removeClass('active');
    jQuery(('*[data-type="'+screenType+'"]')).addClass('active');
    let width = mobile;
    if (screenType === 'mobile'){
        width = mobile;
        // check has container elements
        containerElements = jQuery('.frm-fluent-form .ff-t-container');
        if (containerElements.length) {
            //change breakpoint css
            containerDisplay = 'block';
        }
    } else if (screenType === 'tablet'){
        containerDisplay = 'flex';
        width = tablet;
    } else if (screenType === 'monitor'){
        containerDisplay = 'flex';
        width = monitor;
    }
    $wrapper.animate({
        width: width
    })
    //set breakpoint css for container elements
    if (containerElements.length) {
        containerElements.css('display', containerDisplay);
    }
    jQuery('body').find('form').trigger('screen-change', width);
}
