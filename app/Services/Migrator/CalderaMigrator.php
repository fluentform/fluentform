<?php

namespace FluentForm\App\Services\Migrator;

use Caldera_Forms_Forms;
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

        $items = Caldera_Forms_Forms::get_forms();

        foreach ($items as $item) {
            $forms[] = Caldera_Forms_Forms::get_form($item);
        }
        return $forms;
    }

    //todo name
    public function getFields($form)
    {
        $fluentFields = [];
        $fields = Caldera_Forms_Forms::get_fields($form);
        $order = [];
        //set fields index for serial
        $j = 0;
        foreach ($form['layout_grid']['fields'] as $key => $value) {
            $order[$key] = $j++;
        }
        //set fields index for serial
        foreach ($fields as $name => $field) {
            if (ArrayHelper::get($field, 'config.type_override')) {
                $field['type'] = $field['config']['type_override'];
            }

            $args = [
                'uniqElKey'    => $field['ID'],
                'index'        => $order[$field['ID']], // get the order id from order array
                'required'     => isset($field['required']) ? true : false,
                'label'        => $field['label'],
                'name'         => $field['slug'],
                'placeholder'  => ArrayHelper::get($field, 'placeholder'),
                'class'        => $field['config']['custom_class'],
                'value'        => ArrayHelper::get($field, 'config.default'),
                'help_message' => ArrayHelper::get($field, 'caption'),
            ];
            $type = ArrayHelper::get($this->fieldTypes(), $field['type'], '');
            switch ($type) {
                case 'input_text':
                case 'email':
                case 'input_textarea':
                case 'input_url':
                case 'color_picker':
                case 'section_break':
                case 'select':
                case 'input_radio':
                case 'input_checkbox':
                case 'dropdown':
                    $args['options'] = $this->getOptions(ArrayHelper::get($field, 'config.option', []));
                    $args['enable_select_2'] = ArrayHelper::get($field, 'type') == 'filtered_select2' ? 'yes' : 'no';
                    $isBttnType = ArrayHelper::get($field, 'type') == 'toggle_switch' ? true : false;
                    if ($isBttnType) {
                        $args['layout_class'] = 'ff_list_buttons'; //for btn type chkbox
                    }
                    break;
                case 'input_date':
                    $args['format'] = Arrayhelper::get($field, 'config.format');
                    break;
                case 'input_number':
                case 'rangeslider':
                    $args['step'] = $field['config']['step'];
                    $args['min'] = $field['config']['step'];
                    $args['max'] = $field['config']['step'];
                    break;
                case 'input_mask':
                    if ($field['type'] == 'text') {
                        if (!ArrayHelper::isTrue($field,'config.masked')) {
                            break; // if masked turned of for txt input then no mask
                        }
                    }
                    $args['mask'] = str_replace('9', '0', $field['config']['custom']);//replace mask 9 with 0 for numbers
                    break;
                case 'ratings':
                    $number = ArrayHelper::get($field, 'config.number', 5);
                    $args['options'] = array_combine(range(1, $number), range(1, $number));
                    break;
                case 'input_file':
                    $byte = ArrayHelper::get($field, 'config.max_upload', 6000);
                    $kb = round($byte / 1000);
                    $args['help_message'] = $field['caption'];
                    $args['allowed_file_types'] = $this->getFileTypes($field);
                    $args['max_size_unit'] = 'KB';
                    $args['max_file_size'] = $kb;
                    $args['max_file_count'] = ArrayHelper::isTrue($field, 'config.multi_upload') ? 5 : 1; //limit 5 for unlimited files
                    $args['upload_btn_text'] = ArrayHelper::get($field, 'config.multi_upload_text') ?: 'File Upload';
                    break;
                case 'custom_html':
                    $args['html_codes'] = $field['config']['default'];
                    break;

                case 'gdpr_agreement': // ??
                    $args['tnc_html'] = $field['config']['agreement'];
                    break;
                case 'button':
                    if ($field['config']['type'] != 'submit') {
                        break; //other buttons todo
                    }
                    $this->submitBtn = $this->getSubmitBttn([
                        'uniqElKey' => $field['ID'],
                        'label'     => $field['label'],
                        'class'     => $field['config']['custom_class'],
                    ]);
                    break;
            }
            $fluentFields[] = $this->getFluentClassicField($type, $args);
        }
        usort($fluentFields, function ($a, $b) {
            return $a['index'] - $b['index']; //sort usig the order index value
        });
        return [
            'fields'       => array_filter($fluentFields),
            'submitButton' => $this->submitBtn
        ];
    }

    public function fieldTypes()
    {
        //todo pro fields ??
        $fieldTypes = [
            'email'            => 'email',
            'text'             => 'input_mask',
            'hidden'           => 'input_hidden',
            'textarea'         => 'input_textarea',
            'paragraph'        => 'input_textarea',
            'wysiwyg'          => 'input_textarea',
            'url'              => 'input_url',
            'color_picker'     => 'color_picker',
            'phone_better'     => 'phone',
            'phone'            => 'input_mask',
            'select'           => 'select',
            'dropdown'         => 'select',
            'filtered_select2' => 'select',
            'radio'            => 'input_radio',
            'checkbox'         => 'input_checkbox',
            'toggle_switch'    => 'input_checkbox',
            'date_picker'      => 'input_date',
            'range'            => 'input_number',
            'number'           => 'input_number',
            'rangeslider'      => 'rangeslider',
            'star_rating'      => 'ratings',
            'file'             => 'input_file',
            'cf2_file'         => 'input_file',
            'html'             => 'custom_html',
            'section_break'    => 'section_break',
            'gdpr'             => 'gdpr_agreement',
            'button'           => 'button',

        ];

//        if (defined('FLUENTFORMPRO')) {
//
//        }

        return $fieldTypes;
    }

    public function getOptions($options)
    {
        $formattedOptions = [];
        foreach ($options as $key => $option) {
            $formattedOptions[] = [
                'label'      => ArrayHelper::get($option, 'label', 'Item -' . $key),
                'value'      => ArrayHelper::get($option, 'value'),
                'calc_value' => ArrayHelper::get($option, 'calc_value'),
                'id'         => $key
            ];
        }

        return $formattedOptions;
    }

    private function getFileTypes($field)
    {
        //todo more types
        $formattedTypes = explode(',', ArrayHelper::get($field, 'config.allowed', ''));

        $fileTypeOptions = [];
        foreach ($formattedTypes as $format) {
            if (!empty($format) && (strpos('jpg|jpeg|gif|png|bmp', $format) != false)) {
                $fileTypeOptions[] = 'jpg|jpeg|gif|png|bmp';
            }
        }

        return array_unique($fileTypeOptions);
    }

    /**
     * @param $form
     * @return array default parsed form metas
     * @throws \Exception
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
                    'type'      => 'email',
                    'email'     => '{wp.admin_email}',
                    'fromEmail' => '',
                    'field'     => 'email',
                    'routing'   => '',
                ],
                'enabled'     => $form['mailer']['on_insert'] ? true : false,
                'name'        => 'Admin Notification',
                'subject'     => isset($form['mailer']['email_subject']) ? $form['mailer']['email_subject'] : 'Admin Notification',
                'to'          => isset($form['mailer']['recipients']) ? $form['mailer']['recipients'] : '{wp.admin_email}',
                'replyTo'     => '{field:your-email}',
                'message'     => " <p>{all_data}</p>\n
                                    <p>This form submitted at: {embed_post.permalink}</p>",
                'fromName'    => ArrayHelper::get($form, 'mailer.sender_name'),
                'fromAddress' => '',
                'bcc'         => ArrayHelper::get($form, 'mailer.bcc_to'),
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
