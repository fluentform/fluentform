<div class="ff_form_wrap ff_screen_<?php echo esc_attr($route); ?>">
	<?php do_action('fluentform_before_form_screen_wrapper', $form_id, $route); ?>
	
	<div class="form_internal_menu">
        <?php if (isset($_SERVER['HTTP_REFERER'])): ?>
            <div class="ff_menu_back">
                <a class="ff_menu_link" href="<?php echo sanitize_url($_SERVER['HTTP_REFERER']) ;?>">
                    <i class="el-icon el-icon-back"></i> Back
                </a>
            </div>
        <?php endif; ?>
        <div title="<?php echo esc_html($form->title); ?>" class="ff_form_name" id="js-ff-nav-title">
			<span class="ml-1"><?php echo esc_html($form->title); ?></span>
		</div>
        <?php
            $extra_menu_class = 'normal_form_editor';
            if (\FluentForm\App\Helpers\Helper::isConversionForm($form->id)) $extra_menu_class = "conversion_form_editor";
        ?>

		<ul class="ff_menu <?php echo esc_attr($extra_menu_class)?>">
			<?php foreach ($menu_items as $menu_index => $menu_item): ?>
				<li class="<?php if ($route == $menu_item['slug']) echo "active"; ?>">
                    <a class="ff_menu_link" href="<?php echo esc_url($menu_item['url']); ?><?php if (isset($menu_item['hash'])) echo "#". esc_attr($menu_item['hash']); ?>">
                        <?php echo esc_html($menu_item['title']); ?>
                    </a>
                </li>
			<?php endforeach; ?>
		</ul>
		
		<div class="ff-navigation-right">
			<?php do_action('fluentform_after_form_navigation', $form_id, $route); ?>
			<?php do_action('fluentform_after_form_navigation_' . $route, $form_id); ?>

			<div id="more-menu">
				<more-menu />
			</div>
		</div>
	</div>

	<div class="ff_form_application_container">
		<?php do_action('ff_fluentform_form_application_view_' . $route, $form_id); ?>
	</div>
	
	<?php do_action('fluentform_after_form_screen_wrapper', $form_id, $route); ?>
</div>
