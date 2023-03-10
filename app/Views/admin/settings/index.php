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
                    <li class="<?php echo esc_attr(Helper::getHtmlElementClass('managers', $currentComponent)); ?> ff_menu_item_managers ff_list_button_item">
                        <a 
                            class="ff_list_button_link"
                            data-hash="managers"
                            href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                                'hash' => 'managers'
                            ])); ?>">
                            <?php echo __('Managers'); ?>
                        </a>
                    </li>
                    <li class="<?php echo esc_attr(Helper::getHtmlElementClass('double_optin_settings', $currentComponent)); ?> ff_menu_item_double_optin ff_list_button_item">
                        <a 
                            class="ff_list_button_link"
                            data-hash="double_optin_settings"
                            href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', [
                                'hash' => 'double_optin_settings'
                            ])); ?>">
                            <?php echo __('Double Optin Settings', 'fluentform'); ?>
                        </a>
                    </li>
                    <li class="ff_list_button_item has_sub_menu">
                        <a 
                            class="ff_list_button_link"
                            href="#">
                            <?php echo __('Security', 'fluentform'); ?>
                        </a>
                        <ul class="ff_list_submenu">
                            <li>Test 1</li>
                            <li>Test 2</li>
                        </ul>
                    </li>
                    <?php foreach ($components as $componentName => $component): ?>
                        <li class="<?php echo esc_attr(Helper::getHtmlElementClass($component['hash'], $currentComponent)); ?> ff_item_<?php echo esc_attr($componentName); ?> ff_list_button_item">
                            <a class="ff_list_button_link" data-settings_key="<?php echo esc_attr(ArrayHelper::get($component, 'settings_key')); ?>"
                               data-component="<?php echo esc_attr(ArrayHelper::get($component, 'component', '')); ?>"
                               data-hash="<?php echo esc_attr(ArrayHelper::get($component, 'hash', '')); ?>"
                               href="<?php echo esc_url(Helper::makeMenuUrl('fluent_forms_settings', $component)); ?>"
                            >
                                <?php echo esc_attr($component['title']); ?>
                            </a>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>
            <div class="ff_settings_container ff_layout_section_container">
                <?php do_action('fluentform_global_settings_component_' . $currentComponent); ?>
            </div>
            <?php do_action('fluentform_after_global_settings_wrapper'); ?>
        </div>
    </div>
</div>