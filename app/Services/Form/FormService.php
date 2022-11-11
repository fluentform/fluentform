<?php

namespace FluentForm\App\Services\Form;

use Exception;
use FluentForm\App\Models\Form;
use FluentForm\App\Models\FormMeta;
use FluentForm\Framework\Support\Arr;
use FluentForm\App\Services\FluentConversational\Classes\Converter\Converter;

class FormService
{
    /**
     * @var \FluentForm\App\Models\Form|\FluentForm\Framework\Database\Query\Builder
     */
    protected $model;

    /**
     * @var \FluentForm\App\Services\Form\Updater
     */
    protected $updater;

    /**
     * @var \FluentForm\App\Services\Form\Duplicator
     */
    protected $duplicator;

    public function __construct(Form $form, Updater $updater, Duplicator $duplicator)
    {
        $this->model = $form;
        $this->updater = $updater;
        $this->duplicator = $duplicator;
    }

    /**
     * Get the paginated forms matching search criteria.
     *
     * @param  array $attributes
     * @return array
     */
    public function get($attributes = [])
    {
        return fluentFormApi('forms')->forms([
            'search'      => Arr::get($attributes, 'search'),
            'status'      => Arr::get($attributes, 'status'),
            'filter_by'   => Arr::get($attributes, 'filter_by', 'all'),
            'date_range'  => Arr::get($attributes, 'date_range', []),
            'sort_column' => Arr::get($attributes, 'sort_column', 'id'),
            'sort_by'     => Arr::get($attributes, 'sort_by', 'DESC'),
            'per_page'    => Arr::get($attributes, 'per_page', 10),
            'page'        => Arr::get($attributes, 'page', 1),
        ]);
    }

    /**
     * Store a form with its associated meta.
     *
     * @param  array                       $attributes
     * @throws Exception
     * @return \FluentForm\App\Models\Form $form
     */
    public function store($attributes = [])
    {
        try {
            $predefinedForm = Form::resolvePredefiendForm($attributes);

            $data = Form::prepare($predefinedForm);

            $form = $this->model->create($data);

            $form->title = $form->title . ' (#' . $form->id . ')';

            $form->save();

            $formMeta = FormMeta::prepare($attributes, $predefinedForm);

            FormMeta::store($form, $formMeta);

            do_action('fluentform_inserted_new_form', $form->id, $data);

            return $form;
        } catch (Exception $e) {
            throw new Exception($e->getMessage());
        }
    }

    /**
     * Duplicate a form with its associated meta.
     *
     * @param  array                       $attributes
     * @throws Exception
     * @return \FluentForm\App\Models\Form $form
     */
    public function duplicate($attributes = [])
    {
        $formId = absint(Arr::get($attributes, 'id'));

        $existingForm = $this->model->with([
            'formMeta' => function ($formMeta) {
                return $formMeta->whereNotIn('meta_key', ['_total_views']);
            },
        ])->find($formId);

        if (!$existingForm) {
            throw new Exception(
                __("The form couldn't be found.", 'fluentform')
            );
        }

        $data = Form::prepare($existingForm->toArray());

        $form = $this->model->create($data);

        // Rename the form name here
        $form->title = $form->title . ' (#' . $form->id . ')';
        $form->save();

        $this->duplicator->duplicateFormMeta($form, $existingForm);

        do_action('flentform_form_duplicated', $form->id);

        return $form;
    }

    public function find($id)
    {
        try {
            return $this->model->with('formMeta')->findOrFail($id);
        } catch (Exception $e) {
            throw new Exception(
                __("The form couldn't be found.", 'fluentform')
            );
        }
    }

    public function delete($id)
    {
        $this->model->where('id', $id)->delete();

        $this->model->submissions()->where('form_id', $id)->delete();
        $this->model->submissionMeta()->where('form_id', $id)->delete();
        $this->model->entryDetails()->where('form_id', $id)->delete();
        $this->model->formMeta()->where('form_id', $id)->delete();
        $this->model->formAnalytics()->where('form_id', $id)->delete();
        $this->model->logs()->where('parent_source_id', $id)
            ->whereIn('source_type', [
                'submission_item', 'form_item', 'draft_submission_meta',
            ])
            ->delete();

        if (defined('FLUENTFORMPRO')) {
            wpFluent()->table('fluentform_order_items')
                ->where('form_id', $id)
                ->delete();

            wpFluent()->table('fluentform_transactions')
                ->where('form_id', $id)
                ->delete();
        }
    }

    /**
     * Duplicate a form with its associated meta.
     *
     * @param  array                       $attributes
     * @throws Exception
     * @return \FluentForm\App\Models\Form $form
     */
    public function update($attributes = [])
    {
        return $this->updater->update($attributes);
    }

    /**
     * Duplicate a form with its associated meta.
     *
     * @param  int                         $id
     * @throws Exception
     * @return \FluentForm\App\Models\Form $form
     */
    public function convert($id)
    {
        try {
            $form = Form::with('conversationalMeta')->findOrFail($id);
        } catch (Exception $e) {
            throw new Exception(
                __("The form couldn't be found.", 'fluentform')
            );
        }

        $isConversationalForm = $form->conversationalMeta && 'yes' === $form->conversationalMeta->value;

        if ($isConversationalForm) {
            $conversationalMetaValue = 'no';
        } else {
            $form->fill([
                'form_fields' => Converter::convertExistingForm($form),
            ])->save();

            $conversationalMetaValue = 'yes';
        }

        FormMeta::updateOrCreate(
            ['form_id' => $form->id, 'meta_key' => 'is_conversion_form'],
            ['value' => $conversationalMetaValue]
        );

        return $form;
    }
}
