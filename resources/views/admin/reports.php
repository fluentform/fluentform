<?php do_action('fluentform_global_menu'); ?>
<div class="ff_reports_wrap">
    <div class="ff_form_wrap_area">
        <?php
        do_action('fluentform_before_reports_render'); ?>
        <div id="ff_reports">
            <ff-reports></ff-reports>
        </div>
        <?php
        do_action('fluentform_after_reports_render'); ?>
    </div>
</div>
<?php
$notices = apply_filters('fluentform_dashboard_notices', []);

if ($notices) {
    echo '<div class="ff_global_notices">';
    foreach ($notices as $noticeKey => $notice) :
        ?>
        <div class="ff_global_notice ff_notice_<?php
        echo esc_attr($notice['type']); ?>">
            <?php
            echo esc_html($notice['message']); ?>
        </div>
    <?php
    endforeach;
    echo '</div>';
}