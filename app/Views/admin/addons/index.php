<?php do_action('fluentform_global_menu'); ?>
<div class="ff_form_wrap">
    <div class="ff_form_wrap_area">
        <?php if(!$hasPro){ ?>
            <div class="ff_card ff_card_alert mb-4 el-row justify-between items-center">
                <div class="el-col el-col-12">
                    <h5 class='title mb-2'>You are using Fluentform free version.</h5>
                    <p class='text'>
                        Free version has limited features, Please upgrade to pro to control the fluentform and get all the advanced features.
                    </p>
                </div>
                <div class="el-col el-col-12 text-right">
                    <a target="_blank" href="https://fluentforms.com/pricing/?utm_source=plugin&utm_medium=wp_install&utm_campaign=ff_upgrade&theme_style=twentytwentythree" class="el-button el-button--danger">
                        Upgrade to Pro
                    </a>
                </div>
            </div>
        <?php }?>

        <div class="ff_card">
            <ul class="ff_tab mb-5">
                <li class="ff_tab_item <?php echo ($current_menu_item == 'fluentform_add_ons') ? 'active' : ''; ?>">
                    <a class="ff_tab_link" href="<?php echo esc_url($base_url); ?>">
                        Modules
                    </a>
                </li>
                <?php foreach ($menus as $menu_index => $menu_title): ?>
                    <li class="ff_tab_item ff_tab_item_<?php echo esc_attr($menu_index); ?> <?php echo ($current_menu_item == $menu_index) ? 'active' : ''; ?>">
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
        </div>
    </div>
</div>