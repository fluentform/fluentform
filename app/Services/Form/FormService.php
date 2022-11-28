<?php

namespace FluentForm\App\Services\Form;

use Exception;
use FluentForm\App\Models\Form;
use FluentForm\App\Models\FormMeta;
use FluentForm\Framework\Support\Arr;
use FluentForm\Framework\Foundation\Application;
use FluentForm\App\Modules\Form\FormFieldsParser;
use FluentForm\App\Services\FluentConversational\Classes\Converter\Converter;

class FormService
{
    /**
     * @var \FluentForm\Framework\Foundation\Application
     */
    protected $app;

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

    /**
     * @var \FluentForm\App\Services\Form\Fields
     */
    protected $fields;

    public function __construct(
        Application $application,
        Form $form,
        Updater $updater,
        Duplicator $duplicator,
        Fields $fields
    ) {
        $this->model = $form;
        $this->fields = $fields;
        $this->app = $application;
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
        $formId = Arr::get($attributes, 'form_id');

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
     * Update a form with its relevant fields.
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

        FormMeta::persist($form->id, 'is_conversion_form', $conversationalMetaValue);

        return $form;
    }

    public function templates()
    {
        $forms = [
            'Basic' => [],
        ];

        $predefinedForms = $this->model::getPredefinedForms();

        foreach ($predefinedForms as $key => $item) {
            if (!$item['category']) {
                $item['category'] = 'Other';
            }

            if (!isset($forms[$item['category']])) {
                $forms[$item['category']] = [];
            }

            $itemClass = 'item_' . str_replace([' ', '&', '/'], '_', strtolower($item['category']));

            if (empty($item['screenshot'])) {
                $itemClass .= ' item_no_image';
            } else {
                $itemClass .= ' item_has_image';
            }

            $forms[$item['category']][$key] = [
                'class'      => $itemClass,
                'tags'       => Arr::get($item, 'tag', ''),
                'title'      => $item['title'],
                'brief'      => $item['brief'],
                'category'   => $item['category'],
                'screenshot' => $item['screenshot'],
                'createable' => $item['createable'],
                'is_pro'     => Arr::get($item, 'is_pro'),
                'type'       => isset($item['type']) ? $item['type'] : 'form',
            ];
        }

        return [
            'forms'                     => $forms,
            'categories'                => array_keys($forms),
            'predefined_dropDown_forms' => apply_filters('fluentform-predefined-dropDown-forms', [
                'post' => [
                    'title' => 'Post Form',
                ],
            ]),
        ];
    }

    public function components($formId)
    {
        /**
         * @var \FluentForm\App\Services\FormBuilder\Components
         */
        $components = $this->app->make('components');

        $this->app->doAction('fluent_editor_init', $components);

        $editorComponents = $components->sort()->toArray();

        return apply_filters('fluent_editor_components', $editorComponents, $formId);
    }

    public function getDisabledComponents()
    {
        $isReCaptchaDisabled = !get_option('_fluentform_reCaptcha_keys_status', false);
        $isHCaptchaDisabled = !get_option('_fluentform_hCaptcha_keys_status', false);
        $isTurnstileDisabled = !get_option('_fluentform_turnstile_keys_status', false);

        $disabled = [
            'recaptcha' => [
                'disabled'    => $isReCaptchaDisabled,
                'title'       => __('reCaptcha', 'fluentform'),
                'description' => __('Please enter a valid API key on FluentForms->Settings->reCaptcha', 'fluentform'),
                'hidePro'     => true,
            ],
            'hcaptcha' => [
                'disabled'    => $isHCaptchaDisabled,
                'title'       => __('hCaptcha', 'fluentform'),
                'description' => __('Please enter a valid API key on FluentForms->Settings->hCaptcha', 'fluentform'),
                'hidePro'     => true,
            ],
            'turnstile' => [
                'disabled'    => $isTurnstileDisabled,
                'title'       => __('Turnstile', 'fluentform'),
                'description' => __('Please enter a valid API key on FluentForms->Settings->Turnstile', 'fluentform'),
                'hidePro'     => true,
            ],
            'input_image' => [
                'disabled'    => true,
                'title'       => __('Image Upload', 'fluentform'),
                'description' => __('Image Upload is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => '',
                'video'       => 'https://www.youtube.com/embed/Yb3FSoZl9Zg',
            ],
            'input_file' => [
                'disabled'    => true,
                'title'       => __('File Upload', 'fluentform'),
                'description' => __('File Upload is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => '',
                'video'       => 'https://www.youtube.com/embed/bXbTbNPM_4k',
            ],
            'shortcode' => [
                'disabled'    => true,
                'title'       => __('Shortcode', 'fluentform'),
                'description' => __('Shortcode is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => '',
                'video'       => 'https://www.youtube.com/embed/op3mEQxX1MM',
            ],
            'action_hook' => [
                'disabled'    => true,
                'title'       => __('Action Hook', 'fluentform'),
                'description' => __('Action Hook is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => fluentformMix('img/pro-fields/Action Hook.png'),
                'video'       => '',
            ],
            'form_step' => [
                'disabled'    => true,
                'title'       => __('Form Step', 'fluentform'),
                'description' => __('Form Step is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => '',
                'video'       => 'https://www.youtube.com/embed/VQTWnM6BbRU',
            ],
        ];

        if (!defined('FLUENTFORMPRO')) {
            $disabled['ratings'] = [
                'disabled'    => true,
                'title'       => __('Ratings', 'fluentform'),
                'description' => __('Ratings is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => '',
                'video'       => 'https://www.youtube.com/embed/YGdkNspMaEs',
            ];
            $disabled['tabular_grid'] = [
                'disabled'    => true,
                'title'       => __('Checkable Grid', 'fluentform'),
                'description' => __('Checkable Grid is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => '',
                'video'       => 'https://www.youtube.com/embed/ayI3TzXXANA',
            ];
            $disabled['chained_select'] = [
                'disabled'    => true,
                'title'       => __('Chained Select Field', 'fluentform'),
                'description' => __('Chained Select Field is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => fluentformMix('img/pro-fields/Chained Select Field.png'),
                'video'       => '',
            ];
            $disabled['phone'] = [
                'disabled'    => true,
                'title'       => 'Phone Field',
                'description' => __('Phone Field is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => fluentformMix('img/pro-fields/Phone Field.png'),
                'video'       => '',
            ];
            $disabled['rich_text_input'] = [
                'disabled'    => true,
                'title'       => __('Rich Text Input', 'fluentform'),
                'description' => __('Rich Text Input is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => fluentformMix('img/pro-fields/Rich Text Input.png'),
                'video'       => '',
            ];
            $disabled['save_progress_button'] = [
                'disabled'    => true,
                'title'       => __('Save & Resume', 'fluentform'),
                'description' => __('Save & Resume is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => fluentformMix('img/pro-fields/Save Progress Button.png'),
                'video'       => '',
            ];
            $disabled['cpt_selection'] = [
                'disabled'    => true,
                'title'       => __('Post/CPT Selection', 'fluentform'),
                'description' => __('Post/CPT Selection is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => fluentformMix('img/pro-fields/Post_CPT Selection.png'),
                'video'       => '',
            ];
            $disabled['quiz_score'] = [
                'disabled'    => true,
                'title'       => __('Quiz Score', 'fluentform'),
                'description' => __('Quiz Score is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => '',
                'video'       => 'https://www.youtube.com/embed/bPjDXR0y_Oo',
            ];
            $disabled['net_promoter_score'] = [
                'disabled'    => true,
                'title'       => __('Net Promoter Score', 'fluentform'),
                'description' => __('Net Promoter Score is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => fluentformMix('img/pro-fields/Net Promoter Score.png'),
                'video'       => '',
            ];
            $disabled['repeater_field'] = [
                'disabled'    => true,
                'title'       => __('Repeat Field', 'fluentform'),
                'description' => __('Repeat Field is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => '',
                'video'       => 'https://www.youtube.com/embed/BXo9Sk-OLnQ',
            ];
            $disabled['rangeslider'] = [
                'disabled'    => true,
                'title'       => __('Range Slider', 'fluentform'),
                'description' => __('Range Slider is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => '',
                'video'       => 'https://www.youtube.com/embed/RaY2VcPWk6I',
            ];
            $disabled['color-picker'] = [
                'disabled'    => true,
                'title'       => __('Color Picker', 'fluentform'),
                'description' => __('Color Picker is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => fluentformMix('img/pro-fields/Color Picker.png'),
                'video'       => '',
            ];
            $disabled['multi_payment_component'] = [
                'disabled'    => true,
                'is_payment'  => true,
                'title'       => __('Payment Field', 'fluentform'),
                'description' => __('Payment Field is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => fluentformMix('img/pro-fields/Payment Field.png'),
                'video'       => '',
            ];
            $disabled['custom_payment_component'] = [
                'disabled'    => true,
                'is_payment'  => true,
                'title'       => 'Custom Payment Amount',
                'description' => __('Custom Payment Amount is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => fluentformMix('img/pro-fields/Custom Payment Amount.png'),
                'video'       => '',
            ];
            $disabled['subscription_payment_component'] = [
                'disabled'    => true,
                'is_payment'  => true,
                'title'       => __('Subscription Field', 'fluentform'),
                'description' => __('Subscription Field is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => fluentformMix('img/pro-fields/Subscription Field.png'),
                'video'       => '',
            ];
            $disabled['item_quantity_component'] = [
                'disabled'    => true,
                'is_payment'  => true,
                'title'       => __('Item Quantity', 'fluentform'),
                'description' => __('Item Quantity is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => fluentformMix('img/pro-fields/Item Quantity.png'),
                'video'       => '',
            ];
            $disabled['payment_method'] = [
                'disabled'    => true,
                'is_payment'  => true,
                'title'       => __('Payment Method', 'fluentform'),
                'description' => __('Payment Method is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => fluentformMix('img/pro-fields/Payment Method.png'),
                'video'       => '',
            ];
            $disabled['payment_summary_component'] = [
                'disabled'    => true,
                'is_payment'  => true,
                'title'       => __('Payment Summary', 'fluentform'),
                'description' => __('Payment Summary is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => fluentformMix('img/pro-fields/Payment Summary.png'),
                'video'       => '',
            ];
            $disabled['payment_coupon'] = [
                'disabled'    => true,
                'title'       => __('Coupon', 'fluentform'),
                'description' => __('Coupon is not available with the free version. Please upgrade to pro to get all the advanced features.', 'fluentform'),
                'image'       => fluentformMix('img/pro-fields/Coupon.png'),
                'video'       => '',
            ];
        }

        return $this->app->applyFilters('fluentform_disabled_components', $disabled);
    }

    public function fields($id)
    {
        return $this->fields->get($id);
    }

    public function shortcodes($id)
    {
        return fluentFormGetAllEditorShortCodes($id);
    }

    public function pages()
    {
        return fluentformGetPages();
    }

    public function getInputsAndLabels($formId, $with = ['admin_label', 'raw'])
    {
        try {
            $form = $this->model->findOrFail($formId);

            $inputs = FormFieldsParser::getEntryInputs($form, $with);
            $labels = FormFieldsParser::getAdminLabels($form, $inputs);

            $labels = apply_filters('fluentfoform_entry_lists_labels', $labels, $form);
            $labels = apply_filters('fluentform_all_entry_labels', $labels, $formId);

            if ($form->has_payment) {
                $labels = apply_filters('fluentform_all_entry_labels_with_payment', $labels, false, $form);
            }

            return [
                'inputs' => $inputs,
                'labels' => $labels,
            ];
        } catch (Exception $e) {
            throw new Exception(
                __("The form couldn't be found.", 'fluentform')
            );
        }
    }
}
