<?php

namespace Tests\Support\Factory;

use FluentForm\App\Models\Form;
use FluentForm\App\Models\FormMeta;

/**
 * Creates a published FluentForm with one required text field — the minimal
 * realistic form. Mirrors the shape of dev/test/fixtures/forms/single-field.json.
 * Add per-entity factories as new files; never edit a shared one (keeps parallel
 * contributors conflict-free).
 */
class FormFactory
{
    public function create(array $overrides = []): Form
    {
        $attributes = array_merge([
            'title'               => 'Test Form',
            'status'              => 'published',
            'has_payment'         => 0,
            'type'                => 'form',
            'form_fields'         => wp_json_encode($this->defaultFields()),
            'conditions'          => '',
            'appearance_settings' => '',
        ], $overrides);

        $form = Form::query()->create($attributes);

        // Real forms always carry formSettings meta (confirmation, restrictions,
        // layout). The submission pipeline reads settings.confirmation, so seed
        // the defaults or every submit warns on a missing key.
        FormMeta::query()->insert([
            'form_id'  => $form->id,
            'meta_key' => 'formSettings',
            'value'    => wp_json_encode(Form::getFormsDefaultSettings()),
        ]);

        return $form;
    }

    private function defaultFields(): array
    {
        return [
            'fields' => [
                [
                    'index'      => 0,
                    'element'    => 'input_text',
                    'attributes' => [
                        'type'        => 'text',
                        'name'        => 'first_name',
                        'value'       => '',
                        'placeholder' => 'First name',
                    ],
                    'settings' => [
                        'label'             => 'First Name',
                        'admin_field_label' => 'First Name',
                        'validation_rules'  => [
                            'required' => [
                                'value'   => true,
                                'message' => 'This field is required',
                            ],
                        ],
                        'conditional_logics' => [],
                    ],
                    'editor_options' => [
                        'title'    => 'Single Line Text',
                        'template' => 'inputText',
                    ],
                    'uniqElKey' => 'factory-first-name',
                ],
            ],
            'submitButton' => [
                'uniqElKey'  => 'factory-submit',
                'element'    => 'button',
                'attributes' => ['type' => 'submit', 'class' => ''],
                'settings'   => ['button_ui' => ['type' => 'default', 'text' => 'Submit']],
            ],
        ];
    }
}
