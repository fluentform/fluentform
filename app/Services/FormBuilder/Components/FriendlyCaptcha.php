<?php

namespace FluentForm\App\Services\FormBuilder\Components;

use FluentForm\Framework\Helpers\ArrayHelper;

class FriendlyCaptcha extends BaseComponent
{
    /**
     * Compile and echo the html element
     *
     * @param array     $data [element data]
     * @param \stdClass $form [Form Object]
     *
     * @return void
     */
    public function compile($data, $form)
    {
        $elementName = $data['element'];
        $data = apply_filters('fluentform/rendering_field_data_' . $elementName, $data, $form);

        $friendlyCaptcha = get_option('_fluentform_friendlycaptcha_details');
        $siteKey = ArrayHelper::get($friendlyCaptcha, 'siteKey');

        if (!$siteKey) {
            return false;
        }

        add_filter('fluentform/html_attributes', function ($atts) use ($siteKey) {
            $atts['data-friendlycaptcha_key'] = $siteKey;
            return $atts;
        });

        wp_enqueue_script(
            'friendlycaptcha',
            'https://cdn.jsdelivr.net/npm/@friendlycaptcha/sdk@0.1.13/site.min.js',
            [],
            FLUENTFORM_VERSION,
            true
        );

        // Set module attribute for modern browsers
        wp_script_add_data('friendlycaptcha', 'type', 'module');

        $theme = esc_attr(ArrayHelper::get($friendlyCaptcha, 'theme', 'auto'));
        $startMode = esc_attr(ArrayHelper::get($friendlyCaptcha, 'start_mode', 'focus'));
        $apiEndpoint = esc_attr(ArrayHelper::get($friendlyCaptcha, 'api_endpoint', 'global'));

        $friendlyCaptchaBlock = "<div
			data-sitekey='" . esc_attr($siteKey) . "'
			data-theme='" . $theme . "'
			data-start-mode='" . $startMode . "'
			data-api-endpoint='" . $apiEndpoint . "'
			data-start='focus'
			data-form-field-name='frc-captcha-response'
			id='fluentform-friendlycaptcha-{$form->id}-{$form->instance_index}'
			class='ff-el-friendlycaptcha frc-captcha'></div>";

        $label = '';
        if (! empty($data['settings']['label'])) {
            $label = "<div class='ff-el-input--label'><label>" . fluentform_sanitize_html($data['settings']['label']) . '</label></div>';
        }

        $containerClass = '';
        if (! empty($data['settings']['label_placement'])) {
            $containerClass = 'ff-el-form-' . $data['settings']['label_placement'];
        }

        $hiddenInput = "<input type='hidden' name='frc-captcha-response' value='' />";
        $el = "<div class='ff-el-input--content'><div data-fluent_id='" . $form->id . "' name='frc-captcha-response'>{$friendlyCaptchaBlock}{$hiddenInput}</div></div>";

        $html = "<div class='ff-el-group " . esc_attr($containerClass) . "' >{$label}{$el}</div>";
    
        $this->printContent('fluentform/rendering_field_html_' . $elementName, $html, $data, $form);
    }
}
