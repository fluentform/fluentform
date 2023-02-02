<div class="ff_form_wrap ff_screen_<?php echo esc_attr($route); ?>">
	<?php do_action('fluentform_before_form_screen_wrapper', $form_id, $route); ?>

	<div class="ff_header ff_header_setting">
		<div class="ff_header_col">
			<div title="<?php echo esc_html($form->title); ?>" class="ff_form_name" id="js-ff-nav-title">
				<span><?php echo esc_html($form->title); ?></span>
			</div>
			<ul class="ff_menu">
				<?php foreach ($menu_items as $menu_index => $menu_item): ?>
					<li>
						<a class="menu-link <?php if ($route == $menu_item['slug']) echo "menu-link-active"; ?>" href="<?php echo esc_url($menu_item['url']); ?><?php if (isset($menu_item['hash'])) echo "#". esc_attr($menu_item['hash']); ?>">
							<?php echo esc_html($menu_item['title']); ?>
						</a>
					</li>
				<?php endforeach; ?>
			</ul>
		</div><!-- .ff_header_col -->
		<div class="ff_header_col">
			<div class="ff_editor_action_wrap">
				<?php do_action('fluentform_after_form_navigation', $form_id, $route); ?>
				<?php do_action('fluentform_after_form_navigation_' . $route, $form_id); ?>

				<button id="saveFormData" class="el-button el-button--primary">
					<i class="el-icon-success el-icon"></i> <span id="text">Save Form</span>
				</button><!-- .save-form-button -->
				<span id="switchScreen" class="ff_fullscreen_btn">
					<span class="fullscreen_enter" title="View Fullscreen">
						<svg xmlns="http://www.w3.org/2000/svg" height="48" width="48">
							<path d="M10 38v-9.75h2.25v7.5h7.5V38Zm0-18.25V10h9.75v2.25h-7.5v7.5ZM28.25 38v-2.25h7.5v-7.5H38V38Zm7.5-18.25v-7.5h-7.5V10H38v9.75Z"/>
						</svg>
					</span>
					<span class="fullscreen_exit" title="Exit Fullscreen">
						<svg xmlns="http://www.w3.org/2000/svg" height="48" width="48">
							<path d="M17.5 38v-7.5H10v-2.25h9.75V38Zm10.75 0v-9.75H38v2.25h-7.5V38ZM10 19.75V17.5h7.5V10h2.25v9.75Zm18.25 0V10h2.25v7.5H38v2.25Z"/>
						</svg>
					</span>
				</span><!-- .fullscreen -->
				<div id="moreMenu">
					<more-menu />
				</div><!-- .moreMenu -->
			</div>
		</div><!-- .ff_header_col -->
	</div>

	<div class="ff_form_application_container">
		<?php do_action('ff_fluentform_form_application_view_' . $route, $form_id); ?>
	</div>
	
	<?php do_action('fluentform_after_form_screen_wrapper', $form_id, $route); ?>
</div>
