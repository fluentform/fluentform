<?php

use FluentForm\App\Helpers\Helper;
use FluentForm\Framework\Helpers\ArrayHelper;

?>
<?php do_action('fluentform_global_menu'); ?>

<div class="ff_form_wrap ff_global_setting_wrap">
    <div class="ff_form_wrap_area">
        <div class="ff_settings_wrapper ff_layout_section">
            <?php do_action('fluentform_before_global_settings_wrapper'); ?>
            <div class="ff_settings_sidebar ff_layout_section_sidebar">
                <ul class="ff_settings_list ff_list_button">
                    <li class="ff_list_button_item">
                        <a 
                            class="ff_list_button_link"
                            data-hash="settings"
                            href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                               'hash' => 'settings'
                            ])); ?>">
                            <?php echo __('Settings'); ?>
                        </a>
                    </li>
                    <li class="<?php echo esc_attr(Helper::getHtmlElementClass('managers', $currentComponent)); ?> ff_list_button_item">
                        <a 
                            class="ff_list_button_link"
                            data-hash="managers"
                            href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                                'hash' => 'managers'
                            ])); ?>">
                            <?php echo __('Managers'); ?>
                        </a>
                    </li>
                    <li class="<?php echo esc_attr(Helper::getHtmlElementClass('double_optin_settings', $currentComponent)); ?> ff_list_button_item">
                        <a 
                            class="ff_list_button_link"
                            data-hash="double_optin_settings"
                            href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                                'hash' => 'double_optin_settings'
                            ])); ?>">
                            <?php echo __('Double Optin Settings', 'fluentform'); ?>
                        </a>
                    </li>

                    <?php if (ArrayHelper::exists($components, 'payment_settings')) : ?>
                        <li class="<?php echo esc_attr(Helper::getHtmlElementClass('payment_settings', $currentComponent)); ?> ff_list_button_item has_sub_menu">
                            <a 
                                class="ff_list_button_link"
                                data-hash="payment_settings"
                                href="#">
                                <?php echo __('Payment Settings', 'fluentform'); ?>
                            </a>
                            <?php if (ArrayHelper::get($components, 'payment_settings.sub_menu')) : ?>
                                <ul class="ff_list_submenu">
                                    <?php
                                    $subMenus = ArrayHelper::get($components, 'payment_settings.sub_menu');
                                    foreach ($subMenus as $subMenu):
                                        $baseUrl = Helper::makeMenuUrl('fluent_forms_settings', $subMenu);
                                        $baseUrl .= ArrayHelper::get($subMenu, 'path');
                                        ?>
                                        <li>
                                            <a data-settings_key="<?php echo esc_attr(ArrayHelper::get($subMenu,
                                                'path')); ?>"
                                               data-component="<?php echo esc_attr(ArrayHelper::get($subMenu, 'path',
                                                   '')); ?>"
                                               data-hash="<?php echo esc_attr(ArrayHelper::get($subMenu, 'path',
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
                    <?php endif ?>

                    <li class="ff_list_button_item has_sub_menu">
                        <a class="ff_list_button_link" href="#">
                            <?php echo __('Security', 'fluentform'); ?>
                        </a>
                        <ul class="ff_list_submenu">
                            <?php foreach ($components as $componentName => $component): ?>
                                <?php if (ArrayHelper::get($component, 'hash') == 're_captcha'
                                    || ArrayHelper::get($component, 'hash') == 'h_captcha'
                                    || ArrayHelper::get($component, 'hash') == 'turnstile'
                                ) : ?>

                                    <li class="<?php echo esc_attr(Helper::getHtmlElementClass($component['hash'],
                                        $currentComponent)); ?> ff_item_<?php echo esc_attr($componentName); ?>">
                                        <a data-settings_key="<?php echo esc_attr(ArrayHelper::get($component,
                                            'settings_key')); ?>"
                                           data-component="<?php echo esc_attr(ArrayHelper::get($component, 'component',
                                               '')); ?>"
                                           data-hash="<?php echo esc_attr(ArrayHelper::get($component, 'hash', '')); ?>"
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

                    <li class="ff_list_button_item has_sub_menu">
                        <a class="ff_list_button_link" href="#">
                            <?php echo __('All Integration Settings', 'fluentform'); ?>
                        </a>
                        <ul class="ff_list_submenu">
                            <?php foreach ($components as $componentName => $component): ?>
                                <?php if (ArrayHelper::get($component, 'hash') != 're_captcha'
                                    && ArrayHelper::get($component, 'hash') != 'h_captcha'
                                    && ArrayHelper::get($component, 'hash') != 'turnstile'
                                    && ArrayHelper::get($component, 'query.component') != 'payment_settings'
                                ) : ?>

                                    <li class="<?php echo esc_attr(Helper::getHtmlElementClass($component['hash'],
                                        $currentComponent)); ?> ff_item_<?php echo esc_attr($componentName); ?>">
                                        <a data-settings_key="<?php echo esc_attr(ArrayHelper::get($component,
                                            'settings_key')); ?>"
                                           data-component="<?php echo esc_attr(ArrayHelper::get($component, 'component',
                                               '')); ?>"
                                           data-hash="<?php echo esc_attr(ArrayHelper::get($component, 'hash', '')); ?>"
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
                    <li class="ff_list_button_item">
                        <a 
                            class="ff_list_button_link"
                            data-hash="license"
                            href="<?php echo admin_url('admin.php?page=fluent_forms_add_ons&sub_page=fluentform-pro-add-on')?>">
                            <?php echo __('License'); ?>
                        </a>
                    </li>
                </ul>
            </div>
            <div class="ff_settings_container ff_layout_section_container" id="ff_settings_container">
                <?php do_action('fluentform_global_settings_component_' . $currentComponent); ?>
            </div>
            <?php do_action('fluentform_after_global_settings_wrapper'); ?>
        </div>
    </div>
</div>
