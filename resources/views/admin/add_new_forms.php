<div class="ff_form_wrap ff_app">
    <div class="ff_form_wrap_area">
        <?php do_action('fluentform_before_add_new_form_render'); ?>
        <div class="ff_add_new_forms" id="ff_add_new_forms_app">
            <ff_add_new_forms></ff_add_new_forms>
        </div>
        <?php do_action('fluentform_after_add_new_form_render'); ?>
    </div>
</div>
<?php
$notices = apply_filters('fluentform_dashboard_notices', []);

if ($notices) {
    echo '<div class="ff_global_notices">';
    foreach ($notices as $noticeKey => $notice) :
        ?>
        <div class="ff_global_notice ff_notice_<?php echo esc_attr($notice['type']); ?>">
            <?php echo esc_html($notice['message']); ?>
        </div>
    <?php
    endforeach;
    echo '</div>';
}