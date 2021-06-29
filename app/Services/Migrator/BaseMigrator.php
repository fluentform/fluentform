<?php

namespace FluentForm\App\Services\Migrator;

use FluentForm\App\Modules\Form\Form;
use FluentForm\Framework\Helpers\ArrayHelper;
use FluentForm\Framework\Request\File;
use FluentValidator\Arr;

abstract class BaseMigrator
{
    public $key;
    public $title;
    public $shortcode;
    public $submitBtn;

    public function __construct()
    {

        add_action('ff_import_forms_' . $this->key, [$this, 'import_forms']);
    }

    public static function init()
    {
        new CalderaMigrator();

        $type = sanitize_text_field($_REQUEST['type']);
        $migrators = [
            'caldera'
        ];
        if (!$type || !in_array($type, $migrators)) {
            wp_send_json_error([
                'message' => __("Error. Unsupported migration", 'fluentform')
            ], 422);
            die();
        }
        do_action('ff_import_forms_' . $type);
        return;
    }

    public function import_forms($data)
    {
        // check if installed
        if (!$this->exist()) {
            wp_send_json_error([
                'message' => sprintf(__('%s is not installed.', 'fluentforms'), $this->title),
            ]);
        }

        $imported = 0;
        $refs = [];
        $forms = $this->getForms();

        if (!$forms) {
            wp_send_json_error([
                'message' => __('No forms found!', 'fluentforms'),
            ]);
        }

        if ($forms) {

            $insertedForms = [];
            if ($forms && is_array($forms)) {
                foreach ($forms as $formItem) {


                    // First of all make the form object.
                    $formFields = json_encode([]);
                    if ($fields = $this->getFields($formItem)) {
                        $formFields = json_encode($fields);
                    } else {
                        wp_send_json([
                            'message' => __('Export Error !!', 'fluentform')
                        ], 422);
                    }

                    $form = [
                        'title'       => $this->getFormName($formItem),
                        'form_fields' => $formFields,
                        'status'      => 'published', //todo
                        'has_payment' => 0, //todo
                        'type'        => 'form', //todo
                        'created_by'  => get_current_user_id()
                    ];

                    $form['conditions'] = ''; //todo
                    $form['appearance_settings'] = ''; //todo

                    // Insert the form to the DB.
                    $formId = wpFluent()->table('fluentform_forms')->insert($form);

                    $insertedForms[$formId] = [
                        'title'    => $form['title'],
                        'edit_url' => admin_url('admin.php?page=fluent_forms&route=editor&form_id=' . $formId)
                    ];
                    //get form metas
                    $metas = $this->getFormMetas($formItem);
                    if (isset($metas)) {

                        foreach ($metas as $metaKey => $metaData) {
                            $settings = [
                                'form_id'  => $formId,
                                'meta_key' => $metaKey,
                                'value'    => \json_encode($metaData)
                            ];
                            wpFluent()->table('fluentform_form_meta')->insert($settings);
                        }

                    }

                    do_action('fluentform_form_imported', $formId);

                }

                wp_send_json([
                    'message'        => __('You forms has been successfully imported.', 'fluentform'),
                    'inserted_forms' => $insertedForms
                ], 200);
            }
        }

        wp_send_json([
            'message' => __('Export error, please try again.', 'fluentform')
        ], 422);
    }

    abstract protected function getForms();

    abstract protected function getFields($form);

    abstract protected function getFormName($form);

    abstract protected function getFormMetas($form);

    public function getFluentClassicField($field, $args = [])
    {
        $defaults = [
            'index'              => '',
            'uniqElKey'          => '',
            'required'           => false,
            'label'              => '',
            'label_placement'    => '',
            'admin_field_label'  => '',
            'name'               => '',
            'help_message'       => '',
            'placeholder'        => '',
            'value'              => '',
            'default'            => '',
            'maxlength'          => '',
            'options'            => [],
            'class'              => '',
            'format'             => '',
            'validation_rules'   => [],
            'conditional_logics' => [],
            'container_class'    => '',
            'id'                 => '',
        ];

        $args = wp_parse_args($args, $defaults);
        //common attr //todo refact
        $commonConfig = [
        ];
        if (!ArrayHelper::exists(self::defaultFields($args), $field)) {
            return;
        }
        $fieldConfig = '';
        if ($field == 'text') {
            $fieldConfig = ArrayHelper::get(self::defaultFields($args), 'text');
        } elseif ($field == 'email') {
            $fieldConfig = ArrayHelper::get(self::defaultFields($args), 'email');
        } elseif ($field == 'textarea') {
            $fieldConfig = ArrayHelper::get(self::defaultFields($args), 'textarea');
        } elseif ($field == 'dropdown') {
            $fieldConfig = ArrayHelper::get(self::defaultFields($args), 'dropdown');
        } elseif ($field == 'multiselect') {
        } elseif ($field == 'date_picker' || $field == 'date') {
            $fieldConfig = ArrayHelper::get(self::defaultFields($args), 'date_picker');
        } elseif ($field == 'range' || $field == 'number' || $field == 'url' || $field == 'checkbox' || $field == 'radio' || $field == 'hidden' || $field == 'section_break' || $field == 'html' || $field == 'toc' || $field == 'recaptcha' || $field == 'file' || $field == 'name' || $field == 'ratings' || $field == 'checkbox_grid' || $field == 'payment_method' || $field == 'total') {
        } else {
            return 0;
        }

        return $fieldConfig;
    }

    public static function defaultFields($args)
    {
        return [
            'text'        => [
                'index'          => $args['index'],
                'element'        => 'input_text',
                'attributes'     => [
                    'type'        => 'text',
                    'name'        => $args['name'],
                    'value'       => $args['value'],
                    'class'       => $args['css'],
                    'id'          => $args['id'],
                    'placeholder' => $args['placeholder'],
                    'maxlength'   => $args['maxlength'],
                ],
                'settings'       => [
                    'container_class'           => '',
                    'label'                     => $args['label'],
                    'label_placement'           => '',
                    'admin_field_label'         => '',
                    'help_message'              => $args['help_message'],
                    'conditional_logics'        => '',
                    'validation_rules'          => [
                        'required' => [
                            'value'   => $args['required'],
                            'message' => 'This field is required'
                        ]
                    ],
                    'is_unique'                 => 'no',
                    'unique_validation_message' => 'This value need to be unique.'

                ],
                'editor_options' => [
                    'title'      => 'Simple Text',
                    'icon_class' => 'ff-edit-text',
                    'template'   => 'inputText',
                ],
                'uniqElKey'      => $args['uniqElKey'],
            ],
            'email'       => [
                'index'          => $args['index'],
                'element'        => 'input_email',
                'attributes'     => [
                    'type'        => 'email',
                    'name'        => $args['name'],
                    'value'       => '',
                    'class'       => $args['css'],
                    'id'          => '',
                    'placeholder' => $args['placeholder'],
                ],
                'settings'       => [
                    'container_class'           => '',
                    'label'                     => $args['label'],
                    'label_placement'           => '',
                    'admin_field_label'         => '',
                    'help_message'              => $args['help_message'],
                    'conditional_logics'        => '',
                    'validation_rules'          => [
                        'required' => [
                            'value'   => $args['required'],
                            'message' => 'This field is required'
                        ],
                        'email'    => [
                            'value'   => 1,
                            'message' => 'This field must contain a valid email'
                        ]
                    ],
                    'is_unique'                 => 'no',
                    'unique_validation_message' => 'This value need to be unique.'

                ],
                'editor_options' => [
                    'title'      => 'Email Address',
                    'icon_class' => 'ff-edit-email',
                    'template'   => 'inputText',
                ],
                'uniqElKey'      => $args['uniqElKey'],
            ],
            'textarea'    => [
                'index'          => $args['index'],
                'element'        => 'textarea',
                'attributes'     => [
                    'name'        => $args['name'],
                    'class'       => '',
                    'id'          => '',
                    'placeholder' => '',
                    'rows'        => 3,
                    'cols'        => 2,
                    'maxlength'   => '',
                ],
                'settings'       => [
                    'container_class'    => '',
                    'label'              => $args['label'],
                    'label_placement'    => '',
                    'admin_field_label'  => '',
                    'help_message'       => $args['help_message'],
                    'conditional_logics' => '',
                    'validation_rules'   => [
                        'required' => [
                            'value'   => $args['required'],
                            'message' => 'This field is required'
                        ],
                    ],
                ],
                'editor_options' => [
                    'title'      => 'Text Area',
                    'icon_class' => 'ff-edit-textarea',
                    'template'   => 'inputTextarea',
                ],
                'uniqElKey'      => $args['uniqElKey'],
            ],
            'dropdown'    => [
                'index'          => $args['index'],
                'element'        => 'select',
                'attributes'     => [
                    'name'  => $args['name'],
                    'value' => '',
                    'class' => $args['css'],
                    'id'    => '',
                ],
                'settings'       => [
                    'container_class'    => '',
                    'label_placement'    => '',
                    'label'              => $args['label'],
                    'help_message'       => $args['help_message'],
                    'placeholder'        => $args['placeholder'],
                    'advanced_options'   => $args['options'],
                    'calc_value_status'  => '',
                    'enable_select_2'    => 'no',
                    'validation_rules'   => [
                        'required' => [
                            'value'   => $args['required'],
                            'message' => 'This field is required'
                        ]
                    ],
                    'randomize_options'  => 'no',
                    'conditional_logics' => '',
                ],
                'editor_options' => [
                    'title'      => 'Dropdown',
                    'icon_class' => 'ff-edit-dropdown',
                    'element'    => 'select',
                    'template'   => 'select',
                ],
                'uniqElKey'      => $args['uniqElKey'],
            ],
            'date_picker' => [
                'element'        => 'input_date',
                'index'          => $args['index'],
                'attributes'     => [
                    'name'        => $args['name'],
                    'value'       => '',
                    'type'        => 'text',
                    'class'       => $args['css'],
                    'placeholder' => $args['placeholder'],
                    'id'          => '',
                ],
                'settings'       => [
                    'container_class'   => '',
                    'label_placement'   => '',
                    'admin_field_label' => '',
                    'label'             => $args['label'],
                    'help_message'      => $args['help_message'],
                    'date_format'       => $args['format'],
                    'validation_rules'  => [
                        'required' => [
                            'value'   => $args['required'],
                            'message' => 'This field is required'
                        ]
                    ],
                ],
                'editor_options' => [
                    'title'      => 'Time & Date',
                    'icon_class' => 'ff-edit-date',
                    'template'   => 'inputText',
                ],
                'uniqElKey'      => $args['uniqElKey'],
            ]
        ];
    }

    public function getSubmitBttn($args)
    {
        return [
            'uniqElKey'      => $args['uniqElKey'],
            'element'        => 'button',
            'attributes'     => [
                'type'  => 'submit',
                'class' => $args['css']
            ],
            'settings'       => [
                'container_class'  => '',
                'align'            => 'left',
                'button_style'     => 'default',
                'background_color' => '#409EFF',
                'button_size'      => 'md',
                'color'            => '#ffffff',
                'button_ui'        => [
                    'type'    => 'default',
                    'text'    => $args['label'],
                    'img_url' => ''

                ],
            ],
            'editor_options' => [
                'title' => 'Submit Button',
            ],

        ];

    }

    abstract protected function getFormId($form);


}
