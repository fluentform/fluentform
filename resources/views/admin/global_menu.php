<?php

use FluentForm\App\Modules\Acl\Acl;

$page = sanitize_text_field($_GET['page']);
?>
<div class="ff_header">
    <span class="plugin-name">
        <img src="<?php echo esc_url($logo); ?>"/>
    </span>
    <ul class="ff_menu">
        <li>
            <a href="<?php echo esc_url(admin_url('admin.php?page=fluent_forms')); ?>" class="menu-link <?php echo ($page == 'fluent_forms') ? 'menu-link-active' : '' ?>">
                <?php _e('All Forms', 'fluentform'); ?>
            </a>
        </li>
        <li>
            <?php if (Acl::hasPermission('fluentform_entries_viewer')): ?>
                <a href="<?php echo esc_url(admin_url('admin.php?page=fluent_forms_all_entries'));?>" class="menu-link <?php echo ($page == 'fluent_forms_all_entries') ? 'menu-link-active' : '' ?>">
                    <?php _e('Entries', 'fluentform'); ?>
                </a>
            <?php endif; ?>
        </li>
        <li>
            <?php if ($show_payment_entries && Acl::hasPermission('fluentform_view_payments')): ?>
                <a href="<?php echo esc_url(admin_url('admin.php?page=fluent_forms_payment_entries')); ?>" class="menu-link <?php echo ($page == 'fluent_forms_payment_entries') ? 'menu-link-active' : '' ?>">
                    <?php _e('Payments', 'fluentform'); ?>
                </a>
            <?php endif; ?>
        </li>
        <?php if (Acl::hasPermission('fluentform_settings_manager')): ?>
            <li>
                <a href="<?php echo esc_url(admin_url('admin.php?page=fluent_forms_settings')); ?>" class="menu-link <?php echo ($page == 'fluent_forms_settings') ? 'menu-link-active' : '' ?>">
                    <?php _e('Global Settings', 'fluentform'); ?>
                </a>
            </li>
            <li>
                <a href="<?php echo esc_url(admin_url('admin.php?page=fluent_forms_transfer')); ?>" class="menu-link <?php echo ($page == 'fluent_forms_transfer') ? 'menu-link-active' : '' ?>">
                    <?php _e('Tools', 'fluentform'); ?>
                </a>
            </li>
            <li>
                <a href="<?php echo esc_url(admin_url('admin.php?page=fluent_forms_add_ons')); ?>" class="menu-link <?php echo ($page == 'fluent_forms_add_ons') ? 'menu-link-active' : '' ?>">
                    <?php _e('Integrations', 'fluentform'); ?>
                </a>
            </li>
        <?php endif; ?>
        <li>
            <?php if ($show_payment && Acl::hasPermission('fluentform_view_payments')): ?>
                <a href="<?php echo esc_url(admin_url('admin.php?page=fluent_forms_settings&component=payment_settings')); ?>" class="menu-link">
                    <?php _e('Payments', 'fluentform'); ?><span class="ff_new_badge">new</span>
                </a>
            <?php endif; ?>
        </li>
        <li>
            <?php if(!defined('FLUENT_MAIL') && !defined('FLUENTFORMPRO')): ?>
                <a class="menu-link <?php echo ($page == 'fluent_forms_smtp') ? 'menu-link-active' : '' ?>" href="<?php echo esc_url(admin_url('admin.php?page=fluent_forms_smtp')); ?>">SMTP</a>
            <?php endif; ?>
        </li>
        <li>
            <a href="<?php echo esc_url(admin_url('admin.php?page=fluent_forms_docs')); ?>" class="menu-link <?php echo ($page == 'fluent_forms_docs') ? 'menu-link-active' : '' ?>">
                <?php _e('Support', 'fluentform'); ?>
            </a>
        </li>
        <li>
            <?php if(!defined('FLUENTFORMPRO')): ?>
                <a target="_blank" rel="noopener" href="<?php echo esc_url(fluentform_upgrade_url()); ?>" class="menu-link buy_pro_tab">
                    <?php _e('Upgrade to Pro', 'fluentform'); ?>
                </a>
            <?php endif; ?>
        </li>
    </ul>

    <?php do_action('fluentform_after_global_menu'); ?>
</div>
