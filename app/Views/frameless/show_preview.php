<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" <?php language_attributes(); ?>>
<head>
    <meta http-equiv="Content-type" content="text/html; charset=utf-8"/>
    <meta http-equiv="Imagetoolbar" content="No"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?php esc_html_e('Preview Form', 'fluentform') ?></title>
    <?php
    wp_head();
    ?>
    <style type="text/css">

    </style>
</head>
<body>
<div class="ff_preview_text">
    Design Mode
</div>
<div id="ff_preview_top">
    <div id="ff_preview_header">
        <div class="ff_form_name">
            <?php echo intval($form->id) .' - '. esc_attr($form->title);  ?>
        </div>
        <ul class="ff_preview_menu">
            <li>
                <a class="ff_preview_menu_link" href="<?php echo esc_url(admin_url('admin.php?page=fluent_forms&form_id=' . intval($form_id) . '&route=editor')) ?>">Edit Fields</a>
            </li>
            <li>
                <a class="ff_preview_menu_link" href="<?php echo esc_url(admin_url('admin.php?page=fluent_forms&form_id=' . intval($form_id) . '&route=settings&sub_route=form_settings#/basic_settings' )) ?>">Settings & Integrations</a>
            </li>
            <li>
                <a class="ff_preview_menu_link" href="<?php echo esc_url(admin_url('admin.php?page=fluent_forms&form_id=' . intval($form_id) . '&route=entries#/' )) ?>">Entries</a>
            </li>
        </ul>
        <div class="ff_preview_only_label_wrap">
            <label for="ff_preview_only"><input id="ff_preview_only" type="checkbox" /> Preview Only</label>
        </div>
        <div class="ff_preview_action" id="copy-toggle">
            <i class="el-icon el-icon-document-copy mr-1"></i>
            <span id="copy">
                [fluentform id="<?php echo intval($form_id); ?>"]
            </span>
        </div>
    </div>
    <div class="ff_preview_body">
        <div class="ff_form_preview_wrapper">
            <div class="ff_form_preview_header">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-success"></span>
            </div>
            <div class="ff_form_preview">
                <?php echo do_shortcode('[fluentform id="' . intval($form_id) . '"]'); ?>
            </div>
        </div>
        <div class="ff_form_styler_wrapper">
            <?php if(defined('FLUENTFORMPRO')): ?>
            <?php do_action('fluentform_form_styler', $form_id); ?>
            <?php elseif(apply_filters('fluentform_show_preview_promo', true)): ?>
                <div class="ff_styler_promo">
                    <div class="ff_promo_header">
                        Advanced Form Styler (Pro)
                    </div>
                    <div class="ff_promo_body">
                        <p><a target="_blank" href="https://wpmanageninja.com/docs/fluent-form/fluent-forms-styles/">Advanced Form styler</a> is available in Pro version of Fluent Forms.
                            You can style every element of the forms including input fields, form container, success / error messages and many more.</p>
                        <h5>Other Features</h5>
                        <ul class="ff_feature_list">
                            <li><i class="el-icon el-icon-check"></i> Stripe & PayPal Integration</li>
                            <li><i class="el-icon el-icon-check"></i> Advanced Form Styler</li>
                            <li><i class="el-icon el-icon-check"></i> Advanced Form Fields</li>
                            <li><i class="el-icon el-icon-check"></i> Payment Processing</li>
                            <li><i class="el-icon el-icon-check"></i> 20+ CRM integrations</li>
                            <li><i class="el-icon el-icon-check"></i> Calculated Fields for quotation form</li>
                            <li><i class="el-icon el-icon-check"></i> Multi-Step Forms</li>
                            <li><i class="el-icon el-icon-check"></i> Conditional Logics</li>
                            <li><i class="el-icon el-icon-check"></i> File Upload Feature</li>
                            <li><i class="el-icon el-icon-check"></i> SMS Notifications</li>
                            <li><i class="el-icon el-icon-check"></i> Visual Data Reporting</li>
                        </ul>
                        <div style="text-align: center; margin-top: 40px; margin-bottom: 40px;">
                            <a target="_blank" rel="nofollow" class="ff_upgrade_btn" href="<?php echo esc_url(fluentform_upgrade_url()); ?>">Upgrade to Pro</a>
                        </div>
                        <?php $addOns = (new \FluentForm\App\Modules\AddOnModule())->getPremiumAddOns(); ?>

                        <h5>Integrations available in Fluent Forms Pro</h5>
                        <ul class="ff_addons">
                            <?php foreach ($addOns as $addOn): ?>
                                <li><img title="<?php echo esc_attr($addOn['title']); ?>" src="<?php echo esc_attr($addOn['logo']); ?>" /></li>
                            <?php endforeach; ?>
                        </ul>

                        <div style="text-align: center; margin-top: 40px; margin-bottom: 30px;">
                            <a target="_blank" rel="nofollow" class="ff_upgrade_btn" href="<?php echo esc_url(fluentform_upgrade_url()); ?>">Upgrade to Pro</a>
                        </div>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>
<div class="ff_notice">
    <div class="ff_notice_inner">
        <i class="el-icon el-icon-warning"></i>
        <p>You are seeing preview version of Fluent Forms. This form is only accessible for Admin users. Other users
        may not access this page. To use this for in a page please use the following shortcode: 
        <strong>[fluentform id='<?php echo intval($form_id) ?>']</strong>
        </p>
    </div>
</div>
<?php
wp_footer();
?>

<script type="text/javascript">
    jQuery(document).ready(function ($) {
        $('#ff_preview_only').on('change', function () {
            var isChecked = $(this).is(':checked');
            if(isChecked) {
                $('.ff_preview_body').addClass('ff_preview_only');
                $('.ff_preview_text').html('Preview Mode');
            } else {
                $('.ff_preview_body').removeClass('ff_preview_only');
                $('.ff_preview_text').html('Design Mode');
            }
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

    });
</script>

</body>
</html>
