<?php

namespace FluentForm\App\Services\Migrator;

use FluentForm\App\Modules\Form\Form;
use FluentForm\Framework\Helpers\ArrayHelper;

class CalderaMigrator extends BaseMigrator
{
    public function __construct()
    {
        $this->key = 'caldera';
        $this->title = 'Caldera Forms';
        $this->shortcode = 'caldera_form';
        parent::__construct();
    }

    public function exist()
    {
        return defined('CFCORE_VER');
    }

    public function getForms()
    {
        $forms = [];

        $items = \Caldera_Forms_Forms::get_forms();

        foreach ($items as $item) {
            $forms[] = \Caldera_Forms_Forms::get_form($item);
        }

        return $forms;
    }

    public function getFields($form)
    {
        $fluentFields = [];
        $fields = \Caldera_Forms_Forms::get_fields($form);
        $i = 0;
        foreach ($fields as $name => $field) {
            if (isset($field['config']['type_override']) && $field['config']['type_override']) {
                $field['type'] = $field['config']['type_override'];
            }

            switch ($field['type']) {
                case 'text':
                case 'email':
                case 'textarea':
                case 'url':
                case 'phone_better':
                case 'paragraph':

                    if ($field['type'] == 'phone_better') {
                        $field['type'] = 'text';
                    }

                    if ($field['type'] == 'paragraph') {
                        $field['type'] = 'textarea';
                    }

                    $fluentFields[] = $this->getFluentClassicField($field['type'], [
                        'uniqElKey' => $field['ID'],
                        'index'     => $i++,
                        'required'  => isset($field['required']) ? true : false,
                        'label'     => $field['label'],
                        'name'      => $field['slug'],
                        'css'       => $field['config']['custom_class'],
                    ]);
                    break;

                case 'select':
                case 'radio':
                case 'checkbox':
                case 'dropdown':
                    $fluentFields[] = $this->getFluentClassicField($field['type'], [
                        'uniqElKey' => $field['ID'],
                        'index'     => $i++,
                        'required'  => isset($field['required']) ? true : false,
                        'label'     => $field['label'],
                        'name'      => $field['slug'],
                        'css'       => $field['config']['custom_class'],
                        'options'   => $this->getOptions(ArrayHelper::get($field, 'config.option', [])),
                    ]);
                    break;
                case 'date_picker':
                    $fluentFields[] = $this->getFluentClassicField($field['type'], [
                        'uniqElKey' => $field['ID'],
                        'index'     => $i++,
                        'required'  => isset($field['required']) ? true : false,
                        'label'     => $field['label'],
                        'name'      => $field['slug'],
                        'css'       => $field['config']['custom_class'],
                        'format'    => Arrayhelper::get($field, 'config.format'),
                    ]);
                    break;
                case 'range':
                case 'number':
                    $fluentFields[] = $this->getFluentClassicField($field['type'], [
                        'required'        => isset($field['required']) ? true : false,
                        'label'           => $field['label'],
                        'name'            => $field['slug'],
                        'css'             => $field['config']['custom_class'],
                        'step_text_field' => $field['config']['step'],
                        'min_value_field' => $field['config']['min'],
                        'max_value_field' => $field['config']['max'],
                    ]);

                    break;

                case 'star_rating':

                    if (empty($field['config']['number'])) {
                        $field['config']['number'] = 5;
                    }

                    $fluentFields[] = $this->getFluentClassicField('ratings', [
                        'required' => isset($field['required']) ? true : false,
                        'label'    => $field['label'],
                        'name'     => $field['slug'],
                        'css'      => $field['config']['custom_class'],
                        'options'  => array_combine(range(1, $field['config']['number']), range(1, $field['config']['number'])),
                    ]);

                    break;

                case 'advanced_file':

                    $fluentFields[] = $this->getFluentClassicField('file', [
                        'required'     => isset($field['required']) ? true : false,
                        'label'        => $field['label'],
                        'name'         => $field['slug'],
                        'css'          => $field['config']['custom_class'],
                        'help_message' => $field['caption'],
                    ]);

                    break;

                case 'button':
                    $this->submitBtn = $this->getSubmitBttn([
                        'uniqElKey' => $field['ID'],
                        'index'     => $i++,
                        'label'     => $field['label'],
                        'css'       => $field['config']['custom_class'],
                    ]);
                    break;

            }
        }
        $formattedFields = [
            'fields'       => array_filter($fluentFields),
            'submitButton' => $this->submitBtn
        ];
        return $formattedFields;
    }

    public function getOptions($options = [])
    {
        $formattedOptions = [];

        foreach ($options as $key => $option) {
            $label = !empty($option['label']) ? $option['label'] : 'Item - ' . $key;
            $value = !empty($option['value']) ? $option['value'] : $label;

            $formattedOptions[] = [
                'label'      => $label,
                'value'      => $value,
                'calc_value' => '',
                'id'         => $key
            ];
        }

        return $formattedOptions;
    }

    /**
     * @param $form
     * @return array default parsed form metas
     */
    public function getFormMetas($form)
    {
        $formObject = new Form(wpFluentForm());
        $defaults = $formObject->getFormsDefaultSettings();
        $confirmation = wp_parse_args(
            [
                'messageToShow'        => $form['success'],
                'samePageFormBehavior' => isset($form['hide_form']) ? 'hide_form' : 'reset_form',
            ], $defaults['confirmation']
        );
        $advancedValidation = [
            'status'          => false,
            'type'            => 'all',
            'conditions'      => [
                [
                    'field'    => '',
                    'operator' => '=',
                    'value'    => ''
                ]
            ],
            'error_message'   => '',
            'validation_type' => 'fail_on_condition_met'
        ];
        $notifications =
            [
                'sendTo'      => [
                    'type'    => 'email',
                    'email'   => '{wp.admin_email}',
                    'field'   => 'email',
                    'routing' => '',
                ],
                'enabled'     => $form['mailer']['on_insert'] ? true : false,
                'name'        => 'Admin Notification',
                'subject'     => isset($form['mailer']['email_subject']) ? $form['mailer']['email_subject'] : 'Admin Notification',
                'to'          => isset($form['mailer']['recipients']) ? $form['mailer']['recipients'] : '{wp.admin_email}',
                'replyTo'     => '{field:your-email}',
                'message'     => " <p>{all_data}</p>\n
                                    <p>This form submitted at: {embed_post.permalink}</p>",
                'fromName'    => '',
                'fromAddress' => '',
                'bcc'         => '',
            ];
        return [
            'formSettings'               => [
                'confirmation' => $confirmation,
                'restrictions' => $defaults['restrictions'],
                'layout'       => $defaults['layout'],
            ],
            'advancedValidationSettings' => $advancedValidation,
            'delete_entry_on_submission' => 'no',
            'notifications'              => $notifications
        ];
    }


    protected function getFormId($form)
    {
        return $form['ID'];
    }

    protected function getFormName($form)
    {
        return $form['name'];
    }
}
