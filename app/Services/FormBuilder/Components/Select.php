<?php

namespace FluentForm\App\Services\FormBuilder\Components;

use FluentForm\App\Helpers\Helper;
use FluentForm\Framework\Helpers\ArrayHelper;

class Select extends BaseComponent
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

        $data['attributes']['id'] = $this->makeElementId($data, $form);

        $isMulti = 'yes' == ArrayHelper::get($data, 'settings.enable_select_2');

        if (ArrayHelper::get($data['attributes'], 'multiple')) {
            $data['attributes']['name'] = $data['attributes']['name'] . '[]';
            wp_enqueue_script('choices');
            wp_enqueue_style('ff_choices');
            $data['attributes']['class'] .= ' ff_has_multi_select';
        } elseif ($isMulti) {
            wp_enqueue_script('choices');
            wp_enqueue_style('ff_choices');
            $data['attributes']['class'] .= ' ff_has_multi_select';
        }

        if ($maxSelection = ArrayHelper::get($data, 'settings.max_selection')) {
            $data['attributes']['data-max_selected_options'] = $maxSelection;
        }

        $data['attributes']['data-calc_value'] = 0;

        if (! isset($data['attributes']['class'])) {
            $data['attributes']['class'] = '';
        }

        $data['attributes']['class'] = trim('ff-el-form-control ' . $data['attributes']['class']);

        if ($tabIndex = Helper::getNextTabIndex()) {
            $data['attributes']['tabindex'] = $tabIndex;
        }

        $defaultValues = (array) $this->extractValueFromAttributes($data);
        $dynamicValues = $this->extractDynamicValues($data, $form);
        $hasDynamicValues = !empty($dynamicValues);

        if ($hasDynamicValues) {
            $defaultValues = $dynamicValues;
        }

        $atts = $this->buildAttributes($data['attributes']);
        $options = $this->buildOptions($data, $defaultValues, $hasDynamicValues);

        $ariaRequired = 'false';
        if (ArrayHelper::get($data, 'settings.validation_rules.required.value')) {
            $ariaRequired = 'true';
        }

        $ariaLabelledBy = 'label_' . ArrayHelper::get($data, 'attributes.id');

        $elMarkup = '<select ' . $atts . ' aria-invalid="false" aria-required="' . $ariaRequired . '" aria-labelledby="' . $ariaLabelledBy .'"'.'>' . $options . '</select>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $atts, $options are escaped before being passed in.

        $html = $this->buildElementMarkup($elMarkup, $data, $form);

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
     * Build options for select
     *
     * @param array $options
     *
     * @return string/html [compiled options]
     */
    protected function buildOptions($data, $defaultValues, $hasDynamicValues = false)
    {
        if (! $formattedOptions = ArrayHelper::get($data, 'settings.advanced_options')) {
            $options = ArrayHelper::get($data, 'options', []);
            $formattedOptions = [];
            foreach ($options as $value => $label) {
                $formattedOptions[] = [
                    'label'      => $label,
                    'value'      => $value,
                    'calc_value' => '',
                ];
            }
        }

        foreach ($formattedOptions as $index => &$option) {
            $option['_ff_original_index'] = $index;
        }
        unset($option);

        $storedDefaultOptionIds = $hasDynamicValues ? null : $this->getStoredDefaultOptionIds($data, $formattedOptions);
        $storedDefaultOptionIndexes = $hasDynamicValues ? null : $this->getStoredDefaultOptionIndexes($data, count($formattedOptions));
        $hasStoredDefaultOptionIds = is_array($storedDefaultOptionIds);
        $hasStoredDefaultOptionIndexes = is_array($storedDefaultOptionIndexes);

        if ('yes' == ArrayHelper::get($data, 'settings.randomize_options')) {
            shuffle($formattedOptions);
        }

        $opts = '';
        if (! empty($data['settings']['placeholder'])) {
            $opts .= '<option value="">' . wp_strip_all_tags($data['settings']['placeholder']) . '</option>';
        } elseif (! empty($data['attributes']['placeholder'])) {
            $opts .= '<option value="">' . wp_strip_all_tags($data['attributes']['placeholder']) . '</option>';
        }
        $remainingDefaultValues = array_count_values(array_map('strval', $defaultValues));

        foreach ($formattedOptions as $option) {
            list($isDefaultOption, $storedDefaultOptionIds) = $this->consumeStoredDefaultOptionId(
                $storedDefaultOptionIds,
                ArrayHelper::get($option, '_ff_option_id')
            );

            if (!$isDefaultOption && !$hasStoredDefaultOptionIds && $hasStoredDefaultOptionIndexes) {
                list($isDefaultOption, $storedDefaultOptionIndexes) = $this->consumeStoredDefaultOptionIndex(
                    $storedDefaultOptionIndexes,
                    ArrayHelper::get($option, '_ff_original_index')
                );
            }

            if (!$isDefaultOption && !$hasStoredDefaultOptionIds && !$hasStoredDefaultOptionIndexes) {
                $optionValue = (string) ArrayHelper::get($option, 'value');
                $isDefaultOption = !empty($remainingDefaultValues[$optionValue]);

                if ($isDefaultOption) {
                    $remainingDefaultValues[$optionValue]--;
                }
            }

            $selected = $isDefaultOption ? 'selected' : '';
    
            $atts = [
                'data-calc_value'        => ArrayHelper::get($option, 'calc_value'),
                'data-custom-properties' => ArrayHelper::get($option, 'calc_value'),
                'value'                  => ArrayHelper::get($option, 'value'),
                'disabled'               => ArrayHelper::get($option, 'disabled') ? 'disabled' : ''
            ];
            
            $opts .= '<option '. $this->buildAttributes($atts) . " {$selected}>" . wp_strip_all_tags($option['label']) . '</option>';
        }

        return $opts;
    }
}
