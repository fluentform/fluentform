<?php do_action('fluentform_global_menu'); ?>
<div class="ff_form_wrap ff_app">
    <div class="ff_form_wrap_area">
        <div class="ff_card">
            <ul class="ff_tab mb-4">
                <li class="ff_tab_item <?php echo ($current_menu_item == 'fluentform_add_ons') ? 'active' : ''; ?>">
                    <a class="ff_tab_link" href="<?php echo esc_url($base_url); ?>">
                        Modules
                    </a>
                </li>
                <?php foreach ($menus as $menu_index => $menu_title): ?>
                    <li class="ff_tab_item ff_add_on_item_<?php echo esc_attr($menu_index); ?> <?php echo ($current_menu_item == $menu_index) ? 'active' : ''; ?>">
                        <a class="ff_tab_link" href="<?php echo esc_url($base_url); ?>&sub_page=<?php echo esc_attr($menu_index); ?>">
                            <?php echo esc_html($menu_title); ?>
                        </a>
                    </li>
                <?php endforeach; ?>
            </ul>
            <div class="ff_add_on_body ff_add_on_body_<?php echo esc_attr($current_menu_item); ?>">
                <?php
                do_action('fluentform_addons_page_render_' . $current_menu_item);
                ?>
            </div>
        </div><!--.ff_card -->
    </div>
</div>