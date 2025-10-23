<?php

namespace FluentForm\App\Services\FormBuilder\Components;

use FluentForm\App\Helpers\Helper;
use FluentForm\Framework\Helpers\ArrayHelper;

class TextArea extends BaseComponent
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
        $data = apply_filters_deprecated(
            'fluentform_rendering_field_data_' . $elementName,
            [
                $data,
                $form
            ],
            FLUENTFORM_FRAMEWORK_UPGRADE,
            'fluentform/rendering_field_data_' . $elementName,
            'Use fluentform/rendering_field_data_' . $elementName . ' instead of fluentform_rendering_field_data_' . $elementName
        );
        $data = apply_filters('fluentform/rendering_field_data_' . $elementName, $data, $form);

        $textareaValue = $this->extractValueFromAttributes($data);

        $data['attributes']['class'] = trim('ff-el-form-control ' . $data['attributes']['class']);
        $data['attributes']['id'] = $this->makeElementId($data, $form);

        // Add character counter data attributes
        $maxLength = ArrayHelper::get($data, 'attributes.maxlength');
        $showCounter = ArrayHelper::get($data, 'settings.show_character_counter', false);

        if ($maxLength && $showCounter) {
            $data['attributes']['data-character-counter'] = 'true';
            $data['attributes']['data-counter-format'] = ArrayHelper::get($data, 'settings.character_counter_format', 'count_remaining');
        }

        if ($tabIndex = Helper::getNextTabIndex()) {
            $data['attributes']['tabindex'] = $tabIndex;
        }

        $ariaRequired = 'false';
        if (ArrayHelper::get($data, 'settings.validation_rules.required.value')) {
            $ariaRequired = 'true';
        }

        $elMarkup = '<textarea aria-invalid="false" aria-required='. $ariaRequired .' %s>%s</textarea>';

        $atts = $this->buildAttributes($data['attributes']);

        $elMarkup = sprintf(
            $elMarkup,
            $atts,
            esc_attr($textareaValue)
        ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $atts is escaped before being passed in.

        $html = $this->buildElementMarkup($elMarkup, $data, $form);
        
        // Add character counter if enabled
        $characterCounter = $this->buildCharacterCounter($data);
        if ($characterCounter) {
            $html = str_replace('</div></div>', $characterCounter . '</div></div>', $html);
        }
    
        $html = apply_filters_deprecated(
            'fluentform_rendering_field_html_' . $elementName,
            [
                $html,
                $data,
                $form
            ],
            FLUENTFORM_FRAMEWORK_UPGRADE,
            'fluentform/rendering_field_html_' . $elementName,
            'Use fluentform/rendering_field_html_' . $elementName . ' instead of fluentform_rendering_field_html_' . $elementName
        );

        $this->printContent('fluentform/rendering_field_html_' . $elementName, $html, $data, $form);
    }
    
    /**
     * Build character counter HTML for fields with maxlength
     *
     * @param array $data
     * @return string
     */
    protected function buildCharacterCounter($data)
    {
        $maxLength = ArrayHelper::get($data, 'attributes.maxlength');
        $showCounter = ArrayHelper::get($data, 'settings.show_character_counter');
        
        if (!$maxLength || !$showCounter) {
            return '';
        }
        
        $counterFormat = ArrayHelper::get($data, 'settings.character_counter_format', 'count_remaining');
        $fieldName = ArrayHelper::get($data, 'attributes.name');
        
        $counterClass = 'ff-el-character-counter';
        $counterHTML = sprintf(
            '<div class="%s" data-max-length="%s" data-format="%s" data-field="%s" role="status" aria-live="polite" aria-atomic="true"></div>',
            esc_attr($counterClass),
            esc_attr($maxLength),
            esc_attr($counterFormat),
            esc_attr($fieldName)
        );
        
        return $counterHTML;
    }
}
