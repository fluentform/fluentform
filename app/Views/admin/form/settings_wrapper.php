<?php
	use FluentForm\Framework\Helpers\ArrayHelper;
?>

<div class="ff_settings_wrapper ff_layout_section">
	<div class="ff_settings_sidebar ff_layout_section_sidebar">
		<ul class="ff_settings_list ff_list_button">
			<?php
				$settings_base_url = admin_url('admin.php?page=fluent_forms&form_id='.$form_id.'&route=settings&sub_route=form_settings');
			?>
			<li class="ff_list_button_item has_sub_menu">
				<a 
					class="ff_list_button_link"
					href="#">
					<?php echo __('Settings'); ?>
				</a>
				<ul class="ff_list_submenu">
					<li>
						<a href="<?php echo esc_url($settings_base_url).'&sub_route='. esc_attr($settings_menus['form_settings']['slug']); ?>">
							<?php echo esc_html($settings_menus['form_settings']['title']); ?>
						</a>
					</li>
					<li>
						<a class="ff-page-scroll"
							href="#double-optin-confirmation">
							<?php echo __('Double Optin Confirmation'); ?>
						</a>
					</li>
					<li>
						<a class="ff-page-scroll"
							href="#form-layout">
							<?php echo __('Form Layout'); ?>
						</a>
					</li>
					<li>
						<a class="ff-page-scroll"
							href="#scheduling-and-restrictions">
							<?php echo __('Scheduling & Restrictions'); ?>
						</a>
					</li>
					<li>
						<a class="ff-page-scroll"
							href="#advanced-form-validation">
							<?php echo __('Advanced Form Validation'); ?>
						</a>
					</li>
					<li>
						<a class="ff-page-scroll"
							href="#survey-result">
							<?php echo __('Survey Result'); ?>
						</a>
					</li>
					<li>
						<a class="ff-page-scroll"
							href="#compliance-settings">
							<?php echo __('Compliance Settings'); ?>
						</a>
					</li>
					<li>
						<a class="ff-page-scroll"
							href="#other">
							<?php echo __('Other'); ?>
						</a>
					</li>
				</ul>
			</li>
			
			<?php foreach ($settings_menus as $settings_menu): ?>
				<?php if (ArrayHelper::get($settings_menu, 'hash') != 'basic_settings') : ?>

				<li class="ff_list_button_item">
                    <?php if(isset($settings_menu['route'])): ?>
                        <?php
                            $route = $settings_menu['route'];
                        ?>
                        <a class="ff_list_button_link" data-route_key="<?php echo esc_attr($route); ?>" href="<?php echo esc_url($settings_base_url); ?>#<?php echo esc_attr($route); ?>">
                            <?php echo esc_html($settings_menu['title']); ?>
                        </a>
                    <?php else: ?>
                    <a 
						class="ff_list_button_link" <?php if(isset($settings_menu['class'])) { echo 'class="'. esc_attr($settings_menu['class']).'"'; } ?> 
						data-settings_key="<?php echo (isset($settings_menu['settings_key'])) ? esc_attr($settings_menu['settings_key']) : '';?>" 
						data-component="<?php echo (isset($settings_menu['component'])) ? esc_attr($settings_menu['component']) : '';?>" 
						data-hash="<?php echo (isset($settings_menu['hash'])) ? esc_attr($settings_menu['hash']) : '';?>" 
						href="<?php echo esc_url($settings_base_url).'&sub_route='. esc_attr($settings_menu['slug']); ?><?php if(isset($settings_menu['hash'])) { echo '#'. esc_attr($settings_menu['hash']); } ?>">
						<?php echo esc_html($settings_menu['title']); ?>
					</a>
                    <?php endif; ?>
				</li>

				<?php endif;?>
			<?php endforeach; ?>
		</ul>
	</div>
	<div class="ff_settings_container ff_layout_section_container">
		<?php do_action('fluentform_form_settings_container_'.$current_sub_route, $form_id); ?>
	</div>
</div>