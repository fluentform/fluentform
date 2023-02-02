<div class="ff_settings_wrapper ff_layout_section">
	<div class="ff_settings_sidebar ff_layout_section_sidebar">
		<ul class="ff_settings_list ff_data_item_group ff_data_item_group_s2">
			<?php
				$settings_base_url = admin_url('admin.php?page=fluent_forms&form_id='.$form_id.'&route=settings&sub_route=form_settings');
			?>
			<?php foreach ($settings_menus as $settings_menu): ?>

				<li class="ff_data_item <?php if($settings_menu['slug'] == $current_sub_route) { echo "activex"; } ?>">
                    <?php if(isset($settings_menu['route'])): ?>
                        <?php
                            $route = $settings_menu['route'];
                        ?>
                        <a class="ff_data_item_link" data-route_key="<?php echo esc_attr($route); ?>" href="<?php echo esc_url($settings_base_url); ?>#<?php echo esc_attr($route); ?>">
                            <?php echo esc_html($settings_menu['title']); ?>
                        </a>
                    <?php else: ?>
                    <a class="ff_data_item_link" <?php if(isset($settings_menu['class'])) { echo 'class="'. esc_attr($settings_menu['class']).'"'; } ?> data-settings_key="<?php echo (isset($settings_menu['settings_key'])) ? esc_attr($settings_menu['settings_key']) : '';?>" data-component="<?php echo (isset($settings_menu['component'])) ? esc_attr($settings_menu['component']) : '';?>" data-hash="<?php echo (isset($settings_menu['hash'])) ? esc_attr($settings_menu['hash']) : '';?>" href="<?php echo esc_url($settings_base_url).'&sub_route='. esc_attr($settings_menu['slug']); ?><?php if(isset($settings_menu['hash'])) { echo '#'. esc_attr($settings_menu['hash']); } ?>">
						<?php echo esc_html($settings_menu['title']); ?>
					</a>
                    <?php endif; ?>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>
	<div class="ff_settings_container ff_layout_section_container">
		<?php do_action('fluentform_form_settings_container_'.$current_sub_route, $form_id); ?>
	</div>
</div>