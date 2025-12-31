<?php

namespace FluentForm\App\Services\FormBuilder\Components;

use FluentForm\App\Modules\CalculationSpamProtection\CalculationSpamProtection as CalculationSpamProtectionModule;

class CalculationSpamProtection extends BaseComponent
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

        $settings = get_option('_fluentform_calculation_spam_protection_details', ['enabled' => false, 'difficulty' => 'medium']);
        $difficulty = isset($settings['difficulty']) ? $settings['difficulty'] : 'medium';
        
        $questionData = CalculationSpamProtectionModule::generateQuestion($difficulty);
        
        $fieldName = 'ff-calculation-answer';
        $questionFieldName = 'ff-calculation-question';
        
        $hiddenAnswerField = "<input type='hidden' name='" . esc_attr($questionFieldName) . "' value='" . esc_attr($questionData['answer']) . "'>";
        
        $questionHtml = "<div class='ff-calculation-question'><strong>" . esc_html($questionData['question']) . "</strong></div>";
        
        $inputField = "<input 
            type='text' 
            name='" . esc_attr($fieldName) . "' 
            class='ff-el-form-control ff-calculation-answer' 
            placeholder='" . esc_attr__('Enter your answer', 'fluentform') . "'
            required
            autocomplete='off'
        >";

        $label = '';
        if (! empty($data['settings']['label'])) {
            $label = "<div class='ff-el-input--label'><label>" . $data['settings']['label'] . '</label></div>';
        }

        $containerClass = '';
        if (! empty($data['settings']['label_placement'])) {
            $containerClass = 'ff-el-form-' . $data['settings']['label_placement'];
        }

        $el = "<div class='ff-el-input--content'>{$hiddenAnswerField}{$questionHtml}{$inputField}</div>";

        $html = "<div class='ff-el-group " . esc_attr($containerClass) . "' >" . fluentform_sanitize_html($label) . "{$el}</div>";

        $this->printContent('fluentform/rendering_field_html_' . $elementName, $html, $data, $form);
    }
}

