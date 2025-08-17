<?php

use FluentForm\App\Helpers\Helper;
use FluentForm\Framework\Support\Arr;

?>
<?php
    do_action_deprecated(
        'fluentform_global_menu',
        [
        ],
        FLUENTFORM_FRAMEWORK_UPGRADE,
        'fluentform/global_menu',
        'Use fluentform/global_menu instead of fluentform_global_menu.'
    );
    do_action('fluentform/global_menu');
?>

<div class="ff_form_wrap ff_global_setting_wrap">
    <div class="global-overlay" id="global-overlay"></div>
    <div class="ff_form_wrap_area">
        <div class="ff_settings_wrapper ff_layout_section">
            <?php
                do_action_deprecated(
                    'fluentform_before_global_settings_wrapper',
                    [
                    ],
                    FLUENTFORM_FRAMEWORK_UPGRADE,
                    'fluentform/before_global_settings_wrapper',
                    'Use fluentform/before_global_settings_wrapper instead of fluentform_before_global_settings_wrapper.'
                );
                do_action('fluentform/before_global_settings_wrapper');
            ?>
            <div class="ff_settings_sidebar_wrap">
                <span class="ff_sidebar_toggle" title="Toggle Setting">
                    <i class="ff-icon ff-icon-arrow-right"></i>
                </span>
                <div class="ff_settings_sidebar ff_layout_section_sidebar">
                    <ul class="ff_settings_list ff_list_button">
                        <li class="ff_list_button_item has_sub_menu ">
                            <a
                                class="ff_list_button_link"
                                href="#">
                                <?php echo __('General'); ?>
                            </a>
                            <ul class="ff_list_submenu" >
                                <li >
                                    <a class="ff-page-scroll"
                                        data-section-id="#settings"
                                        data-hash="settings"
                                        href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                                        'hash' => 'settings'
                                        ])); ?>">
                                        <?php echo __('Layout'); ?>
                                    </a>
                                </li>
                                <li>
                                    <a class="ff-page-scroll"
                                       data-section-id="#email-summaries"
                                       data-hash="settings"
                                       href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                                           'hash' => 'setting'
                                       ])); ?>">
                                        <?php echo __('Email Summaries'); ?>
                                    </a>
                                </li>
                                <li>
                                    <a class="ff-page-scroll"
                                       data-section-id="#integration-failure-notification"
                                       data-hash="settings"
                                       href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                                           'hash' => 'setting'
                                       ])); ?>">

                                        <?php echo __('Integration Failure'); ?>
                                    </a>
                                </li>
                                <li>
                                    <a class="ff-page-scroll"
                                       data-section-id="#default-messages"
                                       data-hash="settings"
                                       href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                                           'hash' => 'settings'
                                       ])); ?>">
                                        <?php echo __('Validation Messages', 'fluentform'); ?>
                                    </a>
                                </li>
                                <li>
                                    <a class="ff-page-scroll"
                                       data-section-id="#miscellaneous"
                                       data-hash="settings"
                                       href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                                           'hash' => 'setting'
                                       ])); ?>">
                                        <?php echo __('Miscellaneous'); ?>
                                    </a>
                                </li>
                            </ul>
                        </li>

                        <?php if (Arr::exists($components, 'payment_settings')) : ?>
                            <?php if (Helper::isPaymentCompatible()) : ?>
                                <li class="ff_list_button_item has_sub_menu">
                                    <a class="ff_list_button_link" href="#">
                                        <?php echo esc_html(Arr::get($components, 'payment_settings.title', '')); ?>
                                    </a>
                                    <?php if (Arr::get($components, 'payment_settings.sub_menu')) : ?>
                                        <ul class="ff_list_submenu">
                                            <?php $subMenus = Arr::get($components, 'payment_settings.sub_menu');
                                            foreach ($subMenus as $subMenu): ?>
                                                <li class="<?php echo esc_attr(Arr::get($subMenu, 'class','')); ?> ff_list_button_item">
                                                    <a
                                                            data-settings_key="payment_component"
                                                            data-component="payment_component"
                                                            data-hash="<?php echo esc_attr(Arr::get($subMenu, 'hash')) ?>"
                                                            href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                                                                'hash' => esc_attr(Arr::get($subMenu, 'hash')),
                                                            ])); ?>"
                                                    >
                                                        <?php echo esc_attr(Arr::get($subMenu, 'title', '')); ?>
                                                    </a>
                                                </li>
                                            <?php endforeach; ?>
                                        </ul>
                                    <?php endif ?>
                                </li>
                            <?php else : ?>
                                <li class="<?php echo esc_attr(Helper::getHtmlElementClass('payment_settings', $currentComponent)); ?> ff_list_button_item has_sub_menu">
                                    <a
                                            class="ff_list_button_link ff-payment-settings-root"
                                            data-hash="payment_settings"
                                            href="#">
                                        <?php echo __('Payment', 'fluentform'); ?>
                                    </a>
                                    <?php if (Arr::get($components, 'payment_settings.sub_menu')) : ?>
                                        <ul class="ff_list_submenu">
                                            <?php
                                            $subMenus = Arr::get($components, 'payment_settings.sub_menu');
                                            foreach ($subMenus as $subMenu):
                                                $baseUrl = Helper::makeMenuUrl('fluent_forms_settings', $subMenu);
                                                $baseUrl .= Arr::get($subMenu, 'path');
                                                ?>
                                                <li>
                                                    <a data-settings_key="<?php echo esc_attr(Arr::get($subMenu,
                                                        'path')); ?>"
                                                       data-component="<?php echo esc_attr(Arr::get($subMenu, 'path',
                                                           '')); ?>"
                                                       data-hash="<?php echo esc_attr(Arr::get($subMenu, 'path',
                                                           '')); ?>"
                                                       href="<?php echo esc_url($baseUrl); ?>"
                                                    >
                                                        <?php echo esc_attr($subMenu['name']); ?>
                                                    </a>
                                                </li>
                                            <?php endforeach; ?>
                                        </ul>
                                    <?php endif ?>
                                </li>
                            <?php endif; ?>
                        <?php endif; ?>

                        <li class="ff_list_button_item has_sub_menu">
                            <a class="ff_list_button_link" href="#">
                                <?php echo __('Security', 'fluentform'); ?>
                            </a>
                            <ul class="ff_list_submenu">
                                <?php foreach ($components as $componentName => $component): ?>
                                    <?php if (Arr::get($component, 'hash') == 're_captcha'
                                        || Arr::get($component, 'hash') == 'h_captcha'
                                        || Arr::get($component, 'hash') == 'turnstile'
                                        || Arr::get($component, 'hash') == 'cleantalk'
                                    ) : ?>

                                        <li class="<?php echo esc_attr(Helper::getHtmlElementClass($component['hash'],
                                            $currentComponent)); ?> ff_item_<?php echo esc_attr($componentName); ?>">
                                            <a data-settings_key="<?php echo esc_attr(Arr::get($component,
                                                'settings_key')); ?>"
                                               data-component="<?php echo esc_attr(Arr::get($component, 'component',
                                                   '')); ?>"
                                               data-hash="<?php echo esc_attr(Arr::get($component, 'hash', '')); ?>"
                                               href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings',
                                                   $component)); ?>"
                                            >
                                                <?php echo esc_attr($component['title']); ?>
                                            </a>
                                        </li>
                                    <?php endif ?>
                                <?php endforeach; ?>
                            </ul>
                        </li>

                        <li class="<?php echo esc_attr(Helper::getHtmlElementClass('managers', $currentComponent)); ?> ff_list_button_item">
                            <a
                                    class="ff_list_button_link"
                                    data-hash="managers"
                                    href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                                        'hash' => 'permissions'
                                    ])); ?>">
                                <?php echo __('Permissions'); ?>
                            </a>
                        </li>
                        <?php if ( Arr::get($components, 'admin_approval')) :?>

                            <li class="<?php echo esc_attr(Helper::getHtmlElementClass('admin_approval', $currentComponent)); ?> ff_list_button_item">
                                <a
                                        class="ff_list_button_link"
                                        data-hash="admin_approval"
                                        data-settings_key="ff_admin_approval"
                                        data-component="general-integration-settings"
                                        href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                                            'hash' => 'admin_approval'
                                        ])); ?>">
                                    <?php echo __('Admin approval', 'fluentform'); ?>
                                </a>
                            </li>
                        <?php endif; ?>
                        <li class="<?php echo esc_attr(Helper::getHtmlElementClass('double_optin_settings', $currentComponent)); ?> ff_list_button_item">
                            <a
                                    class="ff_list_button_link"
                                    data-hash="double_optin_settings"
                                    href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                                        'hash' => 'double_optin_settings'
                                    ])); ?>">
                                <?php echo __('Double Opt-in', 'fluentform'); ?>
                            </a>
                        </li>
                        <?php
                        if (Arr::exists($components, 'InventoryManager')) { ?>
                            <li class="<?php echo esc_attr(Helper::getHtmlElementClass('inventory', $currentComponent)); ?> ff_list_button_item">
                                <a
                                        class="ff_list_button_link"
                                        data-hash="inventory_manager"
                                        href="<?php
                                        echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                                            'hash' => 'inventory_manager'
                                        ])); ?>">
                                    <?php
                                    echo __('Inventory Manager', 'fluentform'); ?>
                                </a>
                            </li>
                        <?php } ?>

                        <li class="ff_list_button_item has_sub_menu">
                            <a class="ff_list_button_link" href="#">
                                <?php echo __('Configure Integrations', 'fluentform'); ?>
                            </a>
                            <ul class="ff_list_submenu">
                                <?php foreach ($components as $componentName => $component): ?>
                                    <?php
                                        if (Arr::get($component, 'hash') != 're_captcha'
                                            && Arr::get($component, 'hash') != 'h_captcha'
                                            && Arr::get($component, 'hash') != 'turnstile'
                                            && Arr::get($component, 'hash') != 'cleantalk'
                                            && Arr::get($component, 'query.component') != 'payment_settings'
                                            && Arr::get($component, 'query.component') != 'license_page'
                                            && Arr::get($component, 'hash') != 'admin_approval'
                                            && Arr::get($component, 'hash') != 'inventory_manager'
                                        )
                                    : ?>

                                        <li class="<?php echo esc_attr(Helper::getHtmlElementClass(Arr::get($component, 'hash'),
                                            $currentComponent)); ?> ff_item_<?php echo esc_attr($componentName); ?>">
                                            <a data-settings_key="<?php echo esc_attr(Arr::get($component,
                                                'settings_key')); ?>"
                                               data-component="<?php echo esc_attr(Arr::get($component, 'component',
                                                   '')); ?>"
                                               data-hash="<?php echo esc_attr(Arr::get($component, 'hash', '')); ?>"
                                               href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings',
                                                   $component)); ?>"
                                            >
                                                <?php echo esc_attr($component['title']); ?>
                                            </a>
                                        </li>
                                    <?php endif ?>
                                <?php endforeach; ?>
                            </ul>
                        </li>

                        <?php if ($licensePage = Arr::get($components, 'license_page', '')) : ?>
                            <li class="<?php echo esc_attr(Helper::getHtmlElementClass('license_page', $currentComponent)); ?> ff_list_button_item">
                                <a
                                        class="ff_list_button_link"
                                        data-component="<?php echo esc_attr(Arr::get($licensePage, 'query.component', '')); ?>"
                                        href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', $licensePage)); ?>"
                                >
                                    <?php echo esc_attr($licensePage['title']); ?>
                                </a>
                            </li>
                        <?php endif ?>

                        <!-- Render Custom links -->
                        <?php if ($customLinks) : ?>
                            <?php foreach ($customLinks as $customLink): ?>
                                <?php if($subLinks = Arr::get($customLink, 'sub_links')) :?>
                                    <li class="ff_list_button_item has_sub_menu">
                                        <a class="ff_list_button_link" href="#">
                                            <?php echo esc_html(Arr::get($customLink, 'title', '')); ?>
                                        </a>
                                        <ul class="ff_list_submenu">
                                            <?php foreach ($subLinks as $customSubLink): ?>
                                                <li
                                                        class="<?php echo esc_attr(Arr::get($customSubLink, 'class', '')); ?> ff_list_button_item"
                                                >
                                                    <a
                                                            data-hash="<?php echo esc_attr(Arr::get($customSubLink, 'hash', 'custom_component')) ?>"
                                                            data-settings_key="custom_component"
                                                            data-component="custom_component"
                                                            data-component_name="<?php echo esc_attr(Arr::get($customSubLink, 'component', '')); ?>"
                                                            href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                                                                'hash' => esc_attr(Arr::get($customSubLink, 'hash', 'custom_component')),
                                                            ])); ?>"
                                                    >
                                                        <?php echo esc_attr(Arr::get($customSubLink, 'title', '')); ?>
                                                    </a>
                                                </li>
                                            <?php endforeach; ?>
                                        </ul>
                                    </li>
                                <?php else: ?>
                                    <li
                                            class="<?php echo esc_attr(Arr::get($customLink, 'class', '')); ?> ff_list_button_item"
                                    >
                                        <a
                                                class="ff_list_button_link"
                                                data-hash="<?php echo esc_attr(Arr::get($customLink, 'hash', 'custom_component')) ?>"
                                                data-settings_key="custom_component"
                                                data-component="custom_component"
                                                data-component_name="<?php echo esc_attr(Arr::get($customLink, 'component', '')); ?>"
                                                href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                                                    'hash' => esc_attr(Arr::get($customLink, 'hash', 'custom_component')),
                                                ])); ?>"
                                        >
                                            <?php echo esc_attr(Arr::get($customLink, 'title', '')); ?>
                                        </a>
                                    </li>
                                <?php endif ?>
                            <?php endforeach; ?>
                            <?php do_action('fluentform/global_settings_custom_component'); ?>
                        <?php endif ?>

                    </ul>
                </div>
            </div>

            <div class="ff_settings_container ff_layout_section_container" id="ff_settings_container">
                <?php
                do_action('fluentform/global_settings_component_' . $currentComponent);
                ?>
            </div>
            <?php
            do_action_deprecated(
                'fluentform_after_global_settings_wrapper',
                [
                ],
                FLUENTFORM_FRAMEWORK_UPGRADE,
                'fluentform/after_global_settings_wrapper',
                'Use fluentform/after_global_settings_wrapper instead of fluentform_after_global_settings_wrapper.'
            );
            do_action('fluentform/after_global_settings_wrapper');
            ?>
        </div>
    </div>
</div>
