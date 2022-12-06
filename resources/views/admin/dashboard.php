<?php

use FluentForm\App\Helpers\Helper;
?>
<?php do_action('fluentform_global_menu'); ?>

<div class="ff_form_wrap">
    <div class="ff_admin_menu_wrapper">
        <?php do_action('fluentform_before_admin_dashboard_wrapper'); ?>
        
        <div class="ff_dashboard_wrap">
            <div id="ff_admin_dashboard">
                <ff-admin-dashboard></ff-admin-dashboard>
            </div>
        </div>
        <?php do_action('fluentform_after_admin_dashboard_wrapper'); ?>
    </div>
</div>
