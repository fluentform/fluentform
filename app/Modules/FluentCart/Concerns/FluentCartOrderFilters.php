<?php

namespace FluentForm\App\Modules\FluentCart\Concerns;

use FluentForm\App\Models\Form;
use FluentForm\Framework\Support\Arr;

trait FluentCartOrderFilters
{
    public function addFluentFormsOrderFilterOptions($options)
    {
        $options['fluent_forms'] = [
            'label'    => __('Fluent Forms', 'fluentform'),
            'value'    => 'fluent_forms',
            'children' => [
                [
                    'label'       => __('Has Fluent Forms Entry', 'fluentform'),
                    'value'       => 'has_entry',
                    'type'        => 'selections',
                    'options'     => [
                        'yes' => __('Yes', 'fluentform'),
                        'no'  => __('No', 'fluentform'),
                    ],
                    'is_multiple' => false,
                    'is_only_in'  => true,
                ],
                [
                    'label'       => __('Created From Form', 'fluentform'),
                    'value'       => 'form_id',
                    'type'        => 'selections',
                    'options'     => $this->getFluentFormsFilterOptions(),
                    'is_multiple' => true,
                    'is_only_in'  => true,
                ],
                [
                    'label' => __('Entry ID', 'fluentform'),
                    'value' => 'entry_id',
                    'type'  => 'numeric',
                ],
            ],
        ];

        return $options;
    }

    public function filterOrdersByFluentForms($query, $filters)
    {
        foreach ($filters as $filter) {
            $property = sanitize_key((string) Arr::get($filter, 'property'));
            $value = Arr::get($filter, 'value');
            $operator = sanitize_text_field((string) Arr::get($filter, 'operator', '='));

            if ($property === 'has_entry') {
                $orderIds = $this->getFluentCartOrderIdsByMeta('fluent_form_submission_id');
                $wantsEntries = $value !== 'no';
                $wantsEntries ? $query->whereIn('id', $orderIds ?: [0]) : $query->whereNotIn('id', $orderIds ?: [0]);
                continue;
            }

            if ($property === 'form_id') {
                $formIds = array_filter(array_map('absint', Arr::wrap($value)));
                $orderIds = [];

                foreach ($formIds as $formId) {
                    $orderIds = array_merge($orderIds, $this->getFluentCartOrderIdsByMeta('fluent_form_id', $formId));
                }

                $operator === 'not_in' || $operator === '!='
                    ? $query->whereNotIn('id', array_values(array_unique($orderIds)) ?: [0])
                    : $query->whereIn('id', array_values(array_unique($orderIds)) ?: [0]);
                continue;
            }

            if ($property === 'entry_id') {
                $entryId = absint($value);
                $orderIds = $entryId ? $this->getFluentCartOrderIdsByMeta('fluent_form_submission_id', $entryId) : [];

                $operator === '!='
                    ? $query->whereNotIn('id', $orderIds ?: [0])
                    : $query->whereIn('id', $orderIds ?: [0]);
            }
        }
    }

    protected function getFluentFormsFilterOptions()
    {
        $forms = Form::select(['id', 'title'])->orderBy('id', 'DESC')->get();
        $options = [];

        foreach ($forms as $form) {
            $options[(string) $form->id] = $form->title ?: ('#' . $form->id);
        }

        return $options;
    }
}
