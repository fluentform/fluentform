import each from "lodash/each";
import merge from "lodash/merge";
import StyleEditor from "./StyleEditor";
import {
    BackgroundColor,
    Color,
    Border,
    Boxshadow,
    Padding,
    Typography,
    Margin,
    TabPart,
    BackgroundImage,
    UnitValue, AroundItem
} from './stylerHelper';

export default {
    components: {
        StyleEditor
    },
    props: ['form_vars'],
    data() {
        return {
            loading: false,
            is_multipage: false,
            has_tabular_grid: false,
            has_section_break: false,
            has_range_slider: false,
            has_net_promoter: false,
            has_html_input: false,
            has_payment_summary: false,
            has_payment_coupon: false,
            has_image_or_file_button: false,
            wrapper_selector: '.ff_form_preview .fluentform.fluentform_wrapper_' + window.fluent_styler_vars.form_id,
            custom_selector: `.ff_form_preview .fluentform.fluentform_wrapper_${window.fluent_styler_vars.form_id}`,
            activeName: 'label_styles',
            preset_name: '',
            presets: {},
            existing_form_styles: {},
            selected_import: {},
            saved_custom_styles: {},
            has_stripe_inline_element: false,
            customize_preset: false,
            label_styles: {
                color: new Color(),
                typography: new Typography()
            },
            container_styles: {
                backgroundImage: new BackgroundImage(),
                backgroundColor: new BackgroundColor(),
                color: new Color(),
                padding: new Padding(),
                margin: new Margin(),
                boxshadow: new Boxshadow(),
                border: new Border('border','Form Border Settings','Enable Form Border')
            },
            input_styles: {
                all_tabs: {
                    label: '',
                    element: 'ff_tabs',
                    tabs: {
                        normal: new TabPart('normal', 'Normal', {
                            padding: new Padding(),
                            margin: new Margin(),
                        },{
                            border: new Border('border', '','Use custom Border style', {
                                border_width: {
                                    top: '1',
                                    left: '1',
                                    right: '1',
                                    bottom: '1',
                                    linked: 'yes',
                                    type: 'px'
                                },
                                border_color: 'rgba(79, 75, 75, 1)',
                                status: 'no'
                            })
                        }),
                        focus: new TabPart('focus', 'Focus', {
                            padding: new Padding(),
                            margin: new Margin()
                        },{
                            border: new Border('border', '', 'Use custom Border style', {
                                border_width: {
                                    top: '1',
                                    left: '1',
                                    right: '1',
                                    bottom: '1',
                                    linked: 'yes',
                                    type:'px'
                                },
                                border_color: 'rgba(79, 75, 75, 1)',
                                status: 'no'
                            })
                        })
                    },
                },
            },
            placeholder_styles: {
                color: new Color(),
                typography: new Typography(),
            },
            sectionbreak_styles: {
                all_tabs: {
                    label: '',
                    element: 'ff_tabs',
                    tabs: {
                        LabelStyling: new TabPart('LabelStyling', 'Label Styling', [
                            'color', 'backgroundColor', 'typography', 'boxshadow', 'padding', 'margin', 'border'
                        ]),
                        DescriptionStyling: new TabPart('DescriptionStyling', 'Description Styling', [
                            'color', 'backgroundColor', 'typography', 'boxshadow', 'padding', 'margin', 'border'
                        ])
                    }
                }

            },
            gridtable_style: {
                all_tabs: {
                    label: '',
                    element: 'ff_tabs',
                    tabs: {
                        TableHead: new TabPart('tableHead', 'Table Head', {
                            height: new UnitValue('height', 'Height'),
                            padding: new Padding()
                        },{
                            border: new Border('border', '', 'Enable Border', {
                                border_width : {
                                    type:'px',
                                    top: '1',
                                    left: '1',
                                    right: '1',
                                    bottom: '1',
                                    linked: 'yes'
                                },
                                border_radius : undefined
                            }),
                        }),
                        TableBody: new TabPart('tableBody', 'Table Body', {
                            oddColor: new Color('oddColor', 'Odd Color', '#f1f1f1'),
                            height: new UnitValue('height', 'Height'),
                            padding: new Padding()
                        }, {
                            border: new Border('border', '', 'Enable Border', {
                                border_width : {
                                    type:'px',
                                    top: '1',
                                    left: '1',
                                    right: '1',
                                    bottom: '1',
                                    linked: 'yes'
                                },
                                border_radius : undefined
                            }),
                        }),
                    }
                }

            },
            radio_checkbox_style: {
                color: new Color('color', 'Items Color'),
                size : new UnitValue('size', 'Size', {
                    config: {px_max: 50, em_rem_max: 5},
                }),
                radio_checkbox: {
                    label: '',
                    element: 'ff_radio_checkbox',
                    status_label: 'Enable Smart UI',
                    value: {
                        color: new Color(),
                        active_color: new Color('color', 'Checked Background Colors'),
                        margin: new Margin('margin', 'Smart UI Margin'),
                        border: new Border('border', 'Custom Border', 'Use custom Border style',  {
                            border_width: {
                                type:'px',
                                top: '1',
                                left: '1',
                                right: '1',
                                bottom: '1',
                                linked: 'yes'
                            },
                            border_color: '#404040',
                            radio_border_status : 'no'
                        }),
                    },
                    status: 'no',
                },
            },
            submit_button_style: {
                allignment: {
                    label: 'Alignment',
                    element: 'ff_allignment_item',
                    value: '',
                },
                all_tabs: {
                    label: '',
                    element: 'ff_tabs',
                    tabs: {
                        normal: new TabPart('normal', 'Normal', {
                            height: new UnitValue('height', 'Button Height'),
                            width: {
                                label: 'Button Width',
                                key: 'width',
                                type: 'custom',
                                value: ''
                            },
                            padding: new Padding(),
                            margin: new Margin(),
                        }),
                        hover: new TabPart('hover', 'Hover')                    },
                    status: 'yes'
                },

            },
            asterisk_styles: {
                color_asterisk: new Color()
            },
            inline_error_msg_style: {
                color: new Color(),
                allignment: {
                    label : 'Alignment',
                    value: 'left',
                    element: 'ff_allignment_item'
                },
                padding: new Padding(),
                typography: new Typography(),
            },
            success_msg_style: {
                color: new Color(),
                backgroundColor: new BackgroundColor(),
                allignment: {
                    label : 'Alignment',
                    value: 'left',
                    element: 'ff_allignment_item'
                },
                width: new UnitValue('widht', 'Width', {
                        units: ['%', 'px', 'em', 'ram', 'custom'],
                        type: '%',
                        config: {px_max: 1200, em_rem_max: 100}
                    }
                ),
                padding: new Padding(),
                margin: new Margin(),
                typography: new Typography(),
                boxshadow: new Boxshadow(),
                border: new Border('border', '')
            },
            error_msg_style: {
                color: new Color(),
                backgroundColor: new BackgroundColor(),
                allignment: {
                    label : 'Alignment',
                    value: 'left',
                    element: 'ff_allignment_item'
                },
                width: new UnitValue('widht', 'Width', {
                        units: ['%', 'px', 'em', 'ram', 'custom'],
                        type: '%',
                        config: {px_max: 1200, em_rem_max: 100}
                    }
                ),
                padding: new Padding(),
                margin: new Margin(),
                typography: new Typography(),
                boxshadow: new Boxshadow(),
                border: new Border('border', '')
            },
            range_slider_style: {
                activeColor: new Color('color', 'Active Color'),
                inActiveColor: new Color('color', 'Inactive Color (opposite color)'),
                textColor: new Color('color', 'Text color'),
                height: new UnitValue('height', 'Height'),
                handleSize : new UnitValue('size', 'Handle Size'),
            },
            net_promoter_style: {
                color: new Color('color', 'Active Color'),
                activeColor: new BackgroundColor('activeColor', 'Active Background Color'),
                inActiveColor: new Color('inActiveColor', 'Inactive Color'),
                inActiveBgColor: new BackgroundColor('inActiveBgColor', 'Inactive Background Color'),
                height: new UnitValue('height', 'Height'),
                lineHeight: new UnitValue('lineHeight', 'Line Height'),
                border: new Border()
            },
            step_header_style: {
                activeColor: new Color('activeColor', 'Active Color'),
                inActiveColor: new Color('inActiveColor', 'Inactive Color (opposite color)'),
                textColor: new Color('textColor', 'Text color'),
                textPosition : {
                    label : 'Text Position (fixed)',
                    key : 'textPosition',
                    options : ['%', 'px', 'rem', 'custom'],
                    element: 'ff_around_item',
                    value: {
                        ...new AroundItem(),
                        'type' : '%',
                        linked: 'no'
                    }
                },
                height: new UnitValue('height', 'Height'),
                width: new UnitValue('width', 'Width', {
                    units: ['%', 'px', 'em', 'custom'],
                    type: '%',
                    value: ''
                }),
                margin: new Margin('margin', 'Margin'),
                boxshadow: new Boxshadow(),
                border: new Border('border','','Enable Border')
            },
            next_button_style: {
                all_tabs: {
                    label: '',
                    element: 'ff_tabs',
                    tabs: {
                        normal: new TabPart('normal', 'Normal', {
                            padding: new Padding(),
                            margin: new Margin(),
                        }),
                        hover: new TabPart('hover', 'Hover')
                    },
                    status: 'yes'
                },

            },
            prev_button_style: {
                all_tabs: {
                    label: '',
                    element: 'ff_tabs',
                    tabs: {
                        normal: new TabPart('normal', 'Normal', {
                            padding: new Padding(),
                            margin: new Margin(),
                        }),
                        hover: new TabPart('hover', 'Hover')
                    },
                    status: 'yes'
                },

            },
            stripe_inline_element_style: {
                input: '',
                focusInput: '',
                placeholder: '',
                error_msg: '',
            },
            payment_summary_style: {
                all_tabs: {
                    label: '',
                    element: 'ff_tabs',
                    tabs: {
                        TableHead: new TabPart('tableHead', 'Table Head', {
                            height: new UnitValue('height', 'Height'),
                            padding: new Padding()
                        }, {
                            border: new Border('border', '', 'Enable Border', {
                                border_width : {
                                    type:'px',
                                    top: '1',
                                    left: '1',
                                    right: '1',
                                    bottom: '1',
                                    linked: 'yes'
                                },
                                border_radius : undefined
                            }),
                        }),
                        TableBody: new TabPart('tableBody', 'Table Body', {
                            height: new UnitValue('height', 'Height'),
                            padding: new Padding()
                        }, {
                            border: new Border('border', '', 'Enable Border', {
                                border_width : {
                                    type:'px',
                                    top: '1',
                                    left: '1',
                                    right: '1',
                                    bottom: '1',
                                    linked: 'yes'
                                },
                                border_radius : undefined
                            }),
                        }),
                        TableFooter: new TabPart('tableFooter', 'Table Footer', {
                            height: new UnitValue('height', 'Height'),
                            padding: new Padding()
                        }, {
                            border: new Border('border', '', 'Enable Border', {
                                border_width : {
                                    type:'px',
                                    top: '1',
                                    left: '1',
                                    right: '1',
                                    bottom: '1',
                                    linked: 'yes'
                                },
                                border_radius : undefined
                            }),
                        }),
                    }
                }
            },
            payment_coupon_style: {
                all_tabs: {
                    label: '',
                    element: 'ff_tabs',
                    tabs: {
                        button: new TabPart('button', 'Button'),
                        buttonHover: new TabPart('buttonHover', 'Hover')
                    },
                },
            },
            image_or_file_button_style: {
                all_tabs: {
                    label: '',
                    element: 'ff_tabs',
                    tabs: {
                        button: new TabPart('button', 'Normal', {
                            allignment: {
                                label : 'Alignment',
                                value: 'center',
                                element: 'ff_allignment_item'
                            },
                            width: new UnitValue('width', 'Width', {
                                units: ['%', 'px', 'em', 'custom'],
                                type: '%',
                                value: ''
                            }),
                            padding: new Padding()
                        }),
                        buttonHover:  new TabPart('buttonHover', 'Hover', {
                            allignment: {
                                label : 'Alignment',
                                value: 'center',
                                element: 'ff_allignment_item'
                            },
                            width: new UnitValue('width', 'Width', {
                                units: ['%', 'px', 'em', 'custom'],
                                type: '%',
                                value: ''
                            }),
                            padding: new Padding()
                        })
                    },
                },
            }
        };
    },
    watch: {
        preset_name(newVal, oldVal) {
            if (!newVal || !oldVal) {
                return;
            }
            jQuery(`#fluentform_styler_css_${this.form_vars.form_id}`).remove(); // Remove previous selected preset styles
            jQuery('form.frm-fluent-form').removeClass(Object.keys(this.presets).join(' '));
            if (this.preset_name.trim() === 'ffs_default') {
                this.resetStyle();
                if (this.has_stripe_inline_element) {
                    this.stripe_inline_element_style = {
                        input : '',
                        focusInput: ''
                    };
                }
            }
            const button = document.querySelector('.ff_submit_btn_wrapper button');
            if (this.preset_name.trim() === 'ffs_inherit_theme') {

                button.classList.remove('ff-btn', 'ff-btn-submit', 'ff-btn-md', 'ff_btn_style');
                jQuery('.ff_form_preview .fluentform.ff-default').removeClass('ff-default');
                this.resetStyle();
            } else {
                jQuery('.ff_form_preview .fluentform').addClass('ff-default');
                button.classList.add('ff-btn', 'ff-btn-submit', 'ff-btn-md', 'ff_btn_style');
            }

            jQuery('form.frm-fluent-form').addClass('ffs_custom');
            this.applyStylesWithAutoResolve(oldVal);
        },
        container_styles: {
            deep: true,
            handler() {
                let styles = '';
                each(this.container_styles, (style, styleKey) => {
                    styles += this.extractStyle(style, styleKey, '');
                });
                if (styles) {
                    styles = `${this.wrapper_selector} { ${styles} }`;
                }
                this.pushStyle('#ff_container_styles', styles);
            }
        },
        asterisk_styles: {
            deep: true,
            handler() {
                let styles = '';
                each(this.asterisk_styles, (style, styleKey) => {
                    styles += this.extractStyle(style, styleKey, '');
                });

                if (styles) {
                    styles = `${this.wrapper_selector} .asterisk-right label:after, ${this.wrapper_selector} .asterisk-left label:before { ${styles} }`;
                }
                this.pushStyle('#ff_asterisk_styles', styles);

            }
        },
        error_msg_style: {
            deep: true,
            handler() {
                let styles = '';
                each(this.error_msg_style, (style, styleKey) => {

                    styles += this.extractStyle(style, styleKey, '');

                });

                if (styles) {
                    styles = `${this.wrapper_selector} .ff-errors-in-stack { ${styles} }`;
                }
                this.pushStyle('#ff_error_msg_styles', styles);
            }
        },
        success_msg_style: {
            deep: true,
            handler() {
                let styles = '';
                each(this.success_msg_style, (style, styleKey) => {

                    styles += this.extractStyle(style, styleKey, '');

                });

                if (styles) {
                    styles = `${this.wrapper_selector} .ff-message-success { ${styles} }`;
                }
                this.pushStyle('#ff_success_msg_styles', styles);

            }
        },
        inline_error_msg_style: {
            deep: true,
            handler() {
                let styles = '';
                each(this.inline_error_msg_style, (style, styleKey) => {
                    styles += this.extractStyle(style, styleKey, '');
                });
                if (styles) {
                    if (this.has_stripe_inline_element) {
                        this.stripe_inline_element_style.error_msg = styles;
                    }
                    styles = `${this.wrapper_selector} .ff-el-input--content .error , ${this.wrapper_selector} .error-text{ ${styles} }`;
                }
                this.pushStyle('#ff_inline_error_msg_style', styles);
            }
        },
        label_styles: {
            deep: true,
            handler() {
                let styles = '';
                each(this.label_styles, (style, styleKey) => {
                    styles += this.extractStyle(style, styleKey, '');
                });
                if (styles) {
                    styles = `${this.custom_selector} .ff-el-input--label label  { ${styles} }`;
                }
                this.pushStyle('#ff_label_styles', styles);
            }
        },
        input_styles: {
            deep: true,
            handler() {
                this.input_styles_watch_handler();
            }
        },
        placeholder_styles: {
            deep: true,
            handler() {
                let styles = '';
                each(this.placeholder_styles, (style, styleKey) => {
                    styles += this.extractStyle(style, styleKey, '');
                });
                if (styles) {
                    if (this.has_stripe_inline_element) {
                        this.stripe_inline_element_style.placeholder = styles;
                    }
                    styles = `${this.custom_selector} .ff-el-input--content input::placeholder, ${this.wrapper_selector} .ff-el-input--content textarea::placeholder  { ${styles} }`;
                }
                this.pushStyle('#ff_placeholder_styles', styles);
            }
        },
        sectionbreak_styles: {
            deep: true,
            handler() {
                let styles = '';
                let stylesDes = '';
                let customHtml = '';

                each(this.sectionbreak_styles.all_tabs.tabs, (style, styleKey) => {
                    if (styleKey == 'LabelStyling') {
                        each(style.value, (style1, styleKey1) => {
                            styles += this.extractStyle(style1, styleKey1, '');
                        });
                    } else {
                        each(style.value, (style1, styleKey1) => {
                            let extractStyle = this.extractStyle(style1, styleKey1, '');
                            stylesDes += extractStyle;
                            customHtml += extractStyle;
                        });
                    }

                });

                if (styles) {
                    styles = `${this.custom_selector} .ff-el-section-break .ff-el-section-title { ${styles} }`;
                }
                if (stylesDes) {
                    stylesDes = `${this.custom_selector} .ff-el-section-break div.ff-section_break_desk { ${stylesDes} }`;
                    customHtml = ` ${this.custom_selector} .ff-custom_html { ${customHtml} }`;
                }
                let allStyles = styles + stylesDes + customHtml;
                this.pushStyle('#ff_sectionbreak_styles', allStyles);
            }
        },
        gridtable_style: {
            deep: true,
            handler() {
                let styles = '';
                let stylesDes = '';
                let oddColorStyle = '';

                each(this.gridtable_style.all_tabs.tabs, (style, styleKey) => {
                    if (styleKey == 'TableHead') {
                        each(style.value, (style1, styleKey1) => {
                            styles += this.extractStyle(style1, styleKey1, '');
                        });
                    } else {
                        each(style.value, (style1, styleKey1) => {
                            stylesDes += this.extractStyle(style1, styleKey1, '');
                            if (styleKey1 === 'oddColor' && style1.value) {
                                oddColorStyle = `${this.custom_selector} .ff-checkable-grids tbody > tr:nth-child(2n) > td{background-color:${style1.value}!important}`;
                            }
                        });
                    }

                });

                if (styles) {
                    styles = `${this.custom_selector} .ff-el-input--content table.ff-table.ff-checkable-grids thead tr th { ${styles} }`;
                }
                if (stylesDes) {
                    stylesDes = `${this.custom_selector} .ff-el-input--content table.ff-table.ff-checkable-grids tbody tr td{ ${stylesDes} }`;
                }
                let allStyle = styles + stylesDes + oddColorStyle;
                this.pushStyle('#ff_gridtable_style', allStyle);
            }
        },
        radio_checkbox_style: {
            deep: true,
            handler() {
                let styles = '';
                let itemStyles = '';
                let hasSmartUi = this.radio_checkbox_style.radio_checkbox && this.radio_checkbox_style.radio_checkbox.status == 'yes';
                if (hasSmartUi) {
                    let values = this.radio_checkbox_style.radio_checkbox.value;
                    styles = this.generateCheckableStyles(values.color.value, values.active_color.value, values.border.value, values.margin.value);
                }
                if (this.hasValue(this.radio_checkbox_style.size.value.value, 'strict')) {
                    let value = this.getResolveValue(this.radio_checkbox_style.size.value.value, this.radio_checkbox_style.size.value.type);
                    styles += `
                        ${this.custom_selector} .ff-el-group input[type=checkbox]${hasSmartUi ? ':after' : ''},
                        ${this.custom_selector} .ff-el-group input[type=radio]${hasSmartUi ? ':after' : ''} {
                            height: ${value};
                            width: ${value};
                        }
                    `;
                }

                if (this.radio_checkbox_style.color && this.radio_checkbox_style.color.value) {
                    itemStyles = this.generateChecboxRadioStyles(this.radio_checkbox_style.color.value);
                }

                if (this.radio_checkbox_style.backgroundColor && this.radio_checkbox_style.backgroundColor.value) {
                    let styles = `background-color: ${this.radio_checkbox_style.backgroundColor.value};`;
                    itemStyles += `${this.custom_selector} .ff_list_buttons .ff-el-form-check span{ ${styles} }`;
                }

                let allstyle = styles + itemStyles;
                this.pushStyle('#ff_radio_checkbox', allstyle);
            }
        },
        submit_button_style: {
            deep: true,
            handler() {
                let styles = '';
                let stylesAllignment = '';
                let focusStyle = '';
                each(this.submit_button_style, (style, styleKey) => {
                    if (styleKey !== 'all_tabs') {
                        stylesAllignment += this.extractStyle(style, styleKey, '');
                    }
                });
                each(this.submit_button_style.all_tabs.tabs, (style, styleKey) => {
                    if (styleKey == 'normal') {
                        each(style.value, (style1, styleKey1) => {
                            styles += this.extractStyle(style1, styleKey1, '');
                        });
                    } else if (styleKey == 'hover') {
                        each(style.value, (style1, styleKey1) => {
                            focusStyle += this.extractStyle(style1, styleKey1, '');
                        });
                    }

                });

                if (styles) {
                    styles = `${this.custom_selector} .ff_submit_btn_wrapper .ff-btn-submit, ${this.custom_selector}.ffs_custom_wrap .ff_submit_btn_wrapper .ff-btn-submit  { ${styles} }`;
                }
                if (focusStyle) {
                    focusStyle = `${this.custom_selector} .ff_submit_btn_wrapper .ff-btn-submit:hover, ${this.custom_selector}.ffs_custom_wrap .ff_submit_btn_wrapper .ff-btn-submit:hover  { ${focusStyle} }`;
                }
                if (stylesAllignment) {
                    stylesAllignment = `${this.custom_selector} .ff-el-group.ff_submit_btn_wrapper { ${stylesAllignment} }`;
                }

                let allStyle = styles + stylesAllignment + focusStyle;

                this.pushStyle('#ff_submit_button_style', allStyle);
            }
        },
        next_button_style: {
            deep: true,
            handler() {
                let styles = '';
                let focusStyle = '';
                each(this.next_button_style.all_tabs.tabs, (style, styleKey) => {
                    if (styleKey == 'normal') {
                        each(style.value, (style1, styleKey1) => {
                            styles += this.extractStyle(style1, styleKey1, '');
                        });
                    } else if (styleKey == 'hover') {
                        each(style.value, (style1, styleKey1) => {
                            focusStyle += this.extractStyle(style1, styleKey1, '');
                        });
                    }

                });

                if (styles) {
                    styles = `${this.custom_selector} .step-nav .ff-btn-next  { ${styles} }`;
                }
                if (focusStyle) {
                    focusStyle = `${this.custom_selector} .step-nav .ff-btn-next:hover  { ${focusStyle} }`;
                }

                let allStyle = styles + focusStyle;

                this.pushStyle('#ff_next_button_style', allStyle);
            }
        },
        prev_button_style: {
            deep: true,
            handler() {
                let styles = '';
                let focusStyle = '';
                each(this.prev_button_style.all_tabs.tabs, (style, styleKey) => {
                    if (styleKey == 'normal') {
                        each(style.value, (style1, styleKey1) => {
                            styles += this.extractStyle(style1, styleKey1, '');
                        });
                    } else if (styleKey == 'hover') {
                        each(style.value, (style1, styleKey1) => {
                            focusStyle += this.extractStyle(style1, styleKey1, '');
                        });
                    }

                });

                if (styles) {
                    styles = `${this.custom_selector} .step-nav .ff-btn-prev  { ${styles} }`;
                }
                if (focusStyle) {
                    focusStyle = `${this.custom_selector} .step-nav .ff-btn-prev:hover  { ${focusStyle} }`;
                }

                let allStyle = styles + focusStyle;

                this.pushStyle('#ff_prev_button_style', allStyle);
            }
        },
        step_header_style: {
            deep: true,
            handler(val) {
                let styles = '';
                if (val.activeColor.value) {
                    let activeColor = val.activeColor.value;
                    let inactiveColor = val.inActiveColor.value || '#333';
                    let textColor = val.textColor.value || '#fff';
                    styles = `${this.custom_selector} .ff-step-titles li.ff_active:before, ${this.custom_selector} .ff-step-titles li.ff_completed:before { background: ${activeColor}; color: ${textColor}; } ${this.custom_selector} .ff-step-titles li.ff_active:after, ${this.custom_selector} .ff-step-titles li.ff_completed:after { background: ${activeColor};} ${this.custom_selector} .ff-step-titles li:after { background: ${inactiveColor};} ${this.custom_selector} .ff-step-titles li:before, ${this.custom_selector} .ff-step-titles li { color:  ${inactiveColor}; } ${this.custom_selector} .ff-step-titles li.ff_active, ${this.custom_selector} .ff-step-titles li.ff_completed { color: ${activeColor} }`;
                    styles += `${this.custom_selector} .ff-el-progress-bar { background: ${activeColor}; color: ${textColor}; } ${this.custom_selector} .ff-el-progress { background-color: ${inactiveColor}; }`;
                }
                let otherStyles ='';
                each(val, (style, styleKey) => {
                    if (['height', 'width', 'margin', 'boxshadow',  'border'].includes(styleKey)) {
                        otherStyles += this.extractStyle(style, styleKey);
                    } else if('textPosition' === styleKey) {
                        let positionStyles = this.generateAroundProperty('{replace}', style.value);
                        if (positionStyles) {
                            otherStyles += 'position:relative;';
                            styles += `${this.custom_selector} .ff-el-progress .ff-el-progress-bar span {position:absolute;${positionStyles}}`;
                        }
                    }
                });
                if (otherStyles) {
                    if (otherStyles.includes('height')) {
                        styles += `${this.custom_selector} .ff-el-progress .ff-el-progress-bar {display:flex;align-items:center;justify-content:end;}`;
                    }
                    styles += `${this.custom_selector} .ff-el-progress {${otherStyles}}`;
                }
                if (styles) {
                    this.pushStyle('#ff_step_header_style', styles);
                }
            }
        },
        range_slider_style: {
            deep: true,
            handler(val) {
                let styles = '';
                if (val.activeColor.value) {
                    let activeColor = val.activeColor.value;
                    let inactiveColor = val.inActiveColor.value
                    let textColor = val.textColor.value
                    if (!inactiveColor) {
                        inactiveColor = '#e6e6e6';
                    }
                    if (!textColor) {
                        textColor = '#3a3a3a';
                    }
                    styles = `${this.wrapper_selector} .rangeslider__fill { background: ${activeColor}; } ${this.wrapper_selector} .rangeslider { background: ${inactiveColor}; } ${this.wrapper_selector} .rangeslider__handle { color: ${textColor}; }`;
                }
                if (this.hasValue(val.handleSize.value.value, 'strict')) {
                    let value = this.getResolveValue(val.handleSize.value.value, val.handleSize.value.type);
                    styles += `
                        ${this.wrapper_selector} .rangeslider__handle { height: ${value}; width: ${value};}
                    `;
                }
                if (this.hasValue(val.height.value.value, 'strict')) {
                    let value = this.getResolveValue(val.height.value.value, val.height.value.type);
                    styles += `
                        ${this.wrapper_selector} .rangeslider--horizontal { height: ${value};}
                    `;
                }
                this.pushStyle('#ff_range_slider_style', styles);
            }
        },
        net_promoter_style: {
            deep: true,
            handler(val) {
                let styles = '';
                let activeStyle = '';
                let normalStyle = '';
                if (val.activeColor.value) {
                    let activeBgColor = val.activeColor.value;
                    activeStyle += `background-color: ${activeBgColor};`;
                    styles += `${this.custom_selector} .ff_net_table tbody tr td label:hover:after { border-color: transparent;}`;
                }
                if (val.color.value) {
                    activeStyle += `color: ${val.color.value};`;
                }
                if (activeStyle) {
                    styles += `${this.custom_selector} .ff_net_table tbody tr td input[type=radio]:checked + label { ${activeStyle} }`;
                    styles += `${this.custom_selector} .ff_net_table tbody tr td input[type=radio] + label:hover { ${activeStyle}}`;
                }

                if (val.inActiveColor.value) {
                    normalStyle += `color: ${val.inActiveColor.value};`;
                }
                if (val.inActiveBgColor.value) {
                    normalStyle += `background-color: ${val.inActiveBgColor.value};`;
                }
                if (this.hasValue(val.height.value.value)) {
                    normalStyle += `height:${this.getResolveValue(val.height.value.value, val.height.value.type)};`;
                }
                if (this.hasValue(val.lineHeight.value.value)) {
                    normalStyle += `line-height:${this.getResolveValue(val.lineHeight.value.value, val.lineHeight.value.type)};`;
                }
                if (normalStyle) {
                    styles += `${this.custom_selector} .ff_net_table tbody tr td input[type=radio] + label { ${normalStyle} }`;
                }
                if (val.border.value.status === 'yes') {
                    let borderStyle = this.extractStyle(val.border, 'border', '');
                    if (borderStyle) {
                        borderStyle += 'border-left: 0;border-radius: 0;';
                        styles += `${ this.custom_selector } .ff_net_table  tbody tr td {${ borderStyle }}`;

                        let borderWidth = val.border.value.border_width;
                        let borderRadius = val.border.value.border_radius;
                        let borderColor = val.border.value.border_color;
                        let borderType = val.border.value.border_type;
                        let firstTdStyle = '', lastTdStyle = '';
                        if (borderColor) {
                            firstTdStyle += `border-color: ${borderColor};`;
                        }
                        if (borderType) {
                            firstTdStyle += `border-style: ${ borderType };`;
                        }

                        if (this.hasValue(borderWidth.right)) {
                            styles += `${ this.custom_selector } .ff_net_table tbody tr td:last-of-type {
                                border-right-width: ${ this.getResolveValue(borderWidth.right, borderWidth.type) };
                            }`;
                        }
                        if (this.hasValue(borderWidth.left)) {
                            firstTdStyle += `border-left-width: ${ this.getResolveValue(borderWidth.left, borderWidth.type) };`;
                        }

                        if (this.hasValue(borderRadius.top)) {
                            firstTdStyle += `border-top-left-radius: ${ this.getResolveValue(borderRadius.top, borderRadius.type) };`;
                        }
                        if (this.hasValue(borderRadius.bottom)) {
                            firstTdStyle += `border-bottom-left-radius: ${ this.getResolveValue(borderRadius.bottom, borderRadius.type) };`;
                        }
                        if (this.hasValue(borderRadius.right)) {
                            lastTdStyle += `border-top-right-radius: ${ this.getResolveValue(borderRadius.right, borderRadius.type) };`;
                        }
                        if (this.hasValue(borderRadius.left)) {
                            lastTdStyle += `border-bottom-right-radius: ${ this.getResolveValue(borderRadius.left, borderRadius.type) };`;
                        }
                        if (firstTdStyle) {
                            styles += `${ this.custom_selector } .ff_net_table tbody tr td:first-of-type { overflow:hidden;${firstTdStyle}}`;
                        }
                        if (lastTdStyle) {
                            styles += `${ this.custom_selector } .ff_net_table  tbody tr td:last-child {overflow:hidden;${lastTdStyle}}`;
                        }
                    }
                }

                this.pushStyle('#ff_net_promoter_score', styles);
            }
        },
        payment_summary_style: {
            deep: true,
            handler() {
                let stylesHead = '';
                let stylesBody = '';
                let stylesFooter = '';

                each(this.payment_summary_style.all_tabs.tabs, (style, styleKey) => {
                    if (styleKey == 'TableHead') {
                        each(style.value, (style1, styleKey1) => {
                            stylesHead += this.extractStyle(style1, styleKey1, '');
                        });
                    } else if (styleKey == 'TableBody') {
                        each(style.value, (style1, styleKey1) => {
                            stylesBody += this.extractStyle(style1, styleKey1, '');
                        });
                    } else if (styleKey == 'TableFooter') {
                        each(style.value, (style1, styleKey1) => {
                            stylesFooter += this.extractStyle(style1, styleKey1, '');
                        });
                    }
                });

                if (stylesHead) {
                    stylesHead = `${this.custom_selector} .ff-el-group .ff_payment_summary table thead tr th { ${stylesHead} }`;
                }
                if (stylesBody) {
                    stylesBody = `${this.custom_selector} .ff-el-group .ff_payment_summary table tbody tr td{ ${stylesBody} }`;
                }
                if (stylesFooter) {
                    stylesFooter = `${this.custom_selector} .ff-el-group .ff_payment_summary table tfoot tr th{ ${stylesFooter} }`;
                }
                let allStyle = stylesHead + stylesBody + stylesFooter;
                this.pushStyle('#ff_payment_summary', allStyle);
            }
        },
        stripe_inline_element_style: {
            handler() {
                // fire event for update stripe inline element styles change
                if (this.has_stripe_inline_element) {
                    const $form = jQuery('form.frm-fluent-form');
                    $form.trigger('fluentform_update_stripe_inline_element_style', [this.stripe_inline_element_style])
                }
            },
            deep: true
        },
        payment_coupon_style: {
            deep: true,
            handler() {
                let inputStyle = '';
                let focusStyle = '';
                let buttonStyle = '';
                let hoverStyle = '';
                each(this.payment_coupon_style.all_tabs.tabs, (style, styleKey) => {
                     if (styleKey == 'button') {
                        each(style.value, (style1, styleKey1) => {
                            buttonStyle += this.extractStyle(style1, styleKey1, '');
                        });
                    } else if (styleKey == 'buttonHover') {
                        each(style.value, (style1, styleKey1) => {
                            hoverStyle += this.extractStyle(style1, styleKey1, '');
                        });
                    }
                });

                if (buttonStyle) {
                    buttonStyle = `${this.custom_selector} .ff-el-group .ff-el-input--content .ff_input-group .ff_input-group-append span { ${buttonStyle} }`;
                }

                if (hoverStyle) {
                    hoverStyle = `${this.custom_selector} .ff-el-group .ff-el-input--content .ff_input-group .ff_input-group-append span:hover { ${hoverStyle} }`;
                }

                let allStyles = buttonStyle + hoverStyle;
                this.pushStyle('#ff_payment_coupon', allStyles);
            }
        },
        image_or_file_button_style: {
            deep: true,
            handler() {
                let inputStyle = '';
                let focusStyle = '';
                let buttonStyle = '';
                let hoverStyle = '';
                each(this.image_or_file_button_style.all_tabs.tabs, (style, styleKey) => {
                     if (styleKey == 'button') {
                        each(style.value, (style1, styleKey1) => {
                            buttonStyle += this.extractStyle(style1, styleKey1, '');
                        });
                    } else if (styleKey == 'buttonHover') {
                        each(style.value, (style1, styleKey1) => {
                            hoverStyle += this.extractStyle(style1, styleKey1, '');
                        });
                    }
                });

                if (buttonStyle) {
                    buttonStyle = `${this.custom_selector} .ff-el-group .ff-el-input--content .ff_file_upload_holder span.ff_upload_btn { ${buttonStyle} }`;
                }

                if (hoverStyle) {
                    hoverStyle = `${this.custom_selector} .ff-el-group .ff-el-input--content .ff_file_upload_holder span.ff_upload_btn:hover { ${hoverStyle} }`;
                }

                let allStyles = buttonStyle + hoverStyle;
                this.pushStyle('#image_or_file_button_style', allStyles);
            }
        },
        customize_preset() {
            if (!this.customize_preset && this.preset_name.trim() !== '') {
                this.applyStylesWithAutoResolve();
            }
        }
    },
    methods: {
        changePreset() {
            if (this.preset_name == ''){
                this.customize_preset = false
            }
        },
        pushStyle(selector, styles) {
            jQuery(selector).html('<style type="text/css">' + styles + '</style>');
        },
        extractStyle(style, styleKey, selector) {
            let cssStyle = '';
            if (styleKey == 'backgroundColor') {
                if (style.value) {
                    cssStyle += `background-color: ${style.value};`;
                }
            } else if (styleKey == 'backgroundImage') {
                cssStyle += this.generateBackgroundImage(style.value);
            } else if (styleKey == 'color' || styleKey == 'active_color') {
                if (style.value) {
                    cssStyle += `color: ${style.value};`;
                }
            } else if (styleKey == 'color_asterisk') {
                if (style.value) {
                    cssStyle += `color: ${style.value} !important;`;
                }
            } else if (styleKey == 'margin' || styleKey == 'padding') {
                cssStyle += this.generateAroundDimention(styleKey, style.value);
            } else if (styleKey == 'border' || styleKey == 'hover_border') {
                if (style.value.status != 'yes') {
                    return '';
                }
                cssStyle += `border-style: ${style.value.border_type};`;
                if (style.value.border_color) {
                    cssStyle += `border-color: ${style.value.border_color};`;
                }
                cssStyle += this.generateAroundDimentionBorder(style.value.border_width);
                cssStyle += this.generateAroundDimentionBorderRadius('border', style.value.border_radius);
            } else if (styleKey == 'typography') {
                cssStyle += this.generateTypegraphy(style.value);
            } else if (styleKey == 'des_margin') {
                cssStyle += this.generateAroundDimention('margin', style.value);
            } else if (styleKey == 'des_padding') {
                cssStyle += this.generateAroundDimention('padding', style.value);
            } else if (styleKey == 'boxshadow') {
                cssStyle += this.generateBoxshadow(style.value);
            } else if (styleKey == 'allignment') {
                cssStyle += this.generateAllignment(style.value);
            } else if (styleKey == 'placeholder') {
                cssStyle += this.generatePlaceholder(style.value);
            } else if (styleKey == 'width') {
                let value = style.value, unit = style.type || 'custom';
                if (value && typeof value === 'object') {
                    unit = value.type;
                    value = value.value;
                }
                if (this.hasValue(value)) {
                    cssStyle += `width: ${this.getResolveValue(value, unit)};`;
                }
            } else if (styleKey == 'height') {
               let height = style.value;
               if (this.hasValue(height.value)) {
                   cssStyle += `height: ${this.getResolveValue(height.value, height.type)};`;
               }
            }
            if (cssStyle && selector) {
                return selector + '{ ' + cssStyle + ' } ';
            }
            return cssStyle;
        },
        generateAroundProperty(property, values, isRadius = false) {
            let cssStyle = '';
            if (this.hasValue(values.top)) {
                cssStyle += `${property.replace('{replace}', isRadius ? 'top-left' : 'top')}:${this.getResolveValue(values.top, values.type)};`;
            }
            if (this.hasValue(values.right)) {
                cssStyle += `${property.replace('{replace}', isRadius ? 'top-right' : 'right')}:${this.getResolveValue(values.right, values.type)};`;
            }
            if (this.hasValue(values.left)) {
                cssStyle += `${property.replace('{replace}', isRadius ? 'bottom-right' : 'left')}:${this.getResolveValue(values.left, values.type)};`;
            }
            if (this.hasValue(values.bottom)) {
                cssStyle += `${property.replace('{replace}', isRadius ? 'bottom-left' : 'bottom')}:${this.getResolveValue(values.bottom, values.type)};`;
            }
            return cssStyle;
        },
        generateAroundDimention(styleKey, values) {
            let unit = values.type || 'px';
            if (values.linked == 'yes') {
                if (this.hasValue(values.top)) {
                    return `${styleKey}: ${this.getResolveValue(values.top, unit)};`;
                }
                return '';
            }
            return  this.generateAroundProperty(`${styleKey}-{replace}`, values);
        },
        generateAroundDimentionBorder(values) {
            let unit = values.type || 'px';
            if (values.linked == 'yes') {
                if (this.hasValue(values.top)) {
                    return `border-width: ${this.getResolveValue(values.top, unit)};`;
                }
                return '';
            }
            return  this.generateAroundProperty(`border-{replace}-width`, values);
        },
        generateAroundDimentionBorderRadius(styleKey, values) {
            if (!values) return '';
            let unit = values.type || 'px';
            if (values.linked == 'yes') {
                if (this.hasValue(values.top)) {
                    return `${styleKey}-radius: ${this.getResolveValue(values.top, unit)};`;
                }
                return '';
            }
            return this.generateAroundProperty(`${styleKey}-{replace}-radius`, values, true);
        },
        generateTypegraphy(values) {
            let styles = '';
            if (this.hasValue(values.fontSize.value)) {
                styles += `font-size: ${this.getResolveValue(values.fontSize.value, values.fontSize.type)};`;
            }
            if (values.fontWeight) {
                styles += `font-weight: ${values.fontWeight};`;
            }
            if (values.transform) {
                styles += `text-transform: ${values.transform};`;
            }
            if (values.fontStyle) {
                styles += `font-style: ${values.fontStyle};`;
            }
            if (values.textDecoration) {
                styles += `text-decoration: ${values.textDecoration};`;
            }
            if (this.hasValue(values.lineHeight.value)) {
                styles += `line-height: ${this.getResolveValue(values.lineHeight.value,values.lineHeight.type)};`;
            }
            if (this.hasValue(values.letterSpacing.value)) {
                styles += `letter-spacing: ${this.getResolveValue(values.letterSpacing.value, values.letterSpacing.type)};`;
            }
            if (this.hasValue(values.wordSpacing?.value)) {
                styles += `word-spacing: ${this.getResolveValue(values.wordSpacing.value, values.wordSpacing.type)};`;
            }
            return styles;
        },
        generateBackgroundImage(values) {
            let styles = '';
            if ('classic' === values.type) {
                const img = values.image;
                styles += `background-image: url('${img.url}');`;
                if (img.position.value) {
                    let position = img.position.value;
                    if (position === 'custom') {
                        if (this.hasValue(img.position.valueX.value)) {
                            styles += `background-position-x: ${this.getResolveValue(img.position.valueX.value, img.position.valueX.type)};`;
                        }
                        if (this.hasValue(img.position.valueY.value)) {
                            styles += `background-position-y: ${this.getResolveValue(img.position.valueY.value, img.position.valueY.type)};`;
                        }
                    } else {
                        styles += `background-position: ${position};`;
                    }
                }
                if (img.repeat) {
                    styles += `background-repeat: ${img.repeat};`;
                }
                if (img.attachment) {
                    styles += `background-attachment: ${img.attachment};`;
                }
                if (img.size.value) {
                    let size = img.size.value;
                    if (size === 'custom') {
                        let x, y;
                        if (this.hasValue(img.size.valueX.value)) {
                            x = this.getResolveValue(img.size.valueX.value, img.size.valueX.type);
                        }
                        if (this.hasValue(img.size.valueY.value)) {
                            y = this.getResolveValue(img.size.valueY.value, img.size.valueY.type);
                        }
                        x ||= 'auto';
                        y ||= 'auto';
                        size = x + ' ' + y;
                    }
                    styles += `background-size: ${size};`;
                }
            } else {
                let colorAndLocation = '';
                let primary = values.gradient.primary, secondary = values.gradient.secondary;
                if (primary.color && secondary.color) {
                    colorAndLocation += `${primary.color} ${this.getResolveValue(primary.location.value || 0, primary.location.type)}`;
                    colorAndLocation += `, ${secondary.color} ${this.getResolveValue(secondary.location.value || 0, secondary.location.type)}`;
                    if (values.gradient.type === 'radial') {
                        styles += `background-image: radial-gradient(at ${values.gradient.position}, ${colorAndLocation});`
                    } else {
                        styles += `background-image: linear-gradient(${this.getResolveValue(values.gradient.angle.value || 0, values.gradient.angle.type)}, ${colorAndLocation});`
                    }
                }
            }
            return styles;
        },
        generateBoxshadow(values) {
            let styles = '';
            let horizontal = values.horizontal.value, vertical = values.vertical.value, blur = values.blur.value, spread = values.spread.value;
            if (this.hasValue(horizontal)) {
                horizontal = this.getResolveValue(horizontal, values.horizontal.type);
            }
            if (this.hasValue(vertical)) {
                vertical = this.getResolveValue(vertical, values.vertical.type);
            }
            if (this.hasValue(blur)) {
                blur = this.getResolveValue(blur, values.blur.type);
            }
            if (this.hasValue(spread)) {
                spread = this.getResolveValue(spread, values.spread.type);
            }
            if (horizontal || vertical || blur || spread) {
                styles += `box-shadow: ${horizontal||0} ${vertical||0} ${blur||0} ${spread||0} ${values.color||''}`;
                if (values.position == 'inset') {
                    styles += ' ' + values.position;
                }
                styles += ';';
            }
            return styles;
        },
        generateAllignment(value) {
            let styles = '';
            styles += `text-align: ${value};`;
            return styles;
        },
        generatePlaceholder(value) {
            let styles = '';
            styles += `color: ${value};`;
            return styles;
        },
        generateChecboxRadioStyles(value){
            let styles = '';
            styles += `color: ${value};`;
            return `${this.custom_selector} .ff-el-form-check { ${styles} }`;
        },
        generateCheckableStyles(normalColor, checkedColor, border = {}, margin = {}) {
            if (!checkedColor) {
                checkedColor = 'black';
            }
            let borderColor = (normalColor || 'black'),
                borderWidthStyle = 'border-width:1px;',
                borderRadiusStyle = 'border-radius:1px;',
                borderType = 'solid',
                radioBorderSameAsCheckbox = false;
            let marginStyle = this.generateAroundDimention('margin', margin) || 'margin-left: 3px;';
            if (border.status === 'yes') {
                 borderColor = border.border_color || borderColor;
                 borderWidthStyle = this.generateAroundDimentionBorder(border.border_width);
                 borderRadiusStyle = this.generateAroundDimentionBorderRadius('border', border.border_radius);
                 borderType = border.border_type;
                 if (border.radio_border_status === 'yes') {
                     radioBorderSameAsCheckbox = true;
                 }
            }

            let styles = `${this.custom_selector} .ff-el-group input[type=checkbox],
                    ${this.custom_selector} .ff-el-group input[type=radio] {
                      -webkit-transform: scale(1);
                      transform: scale(1);
                      width: 21px;
                      height: 15px;
                      margin-right: 0px;
                      cursor: pointer;
                      font-size: 12px;
                      position: relative;
                      text-align: left;
                      border: none;
                      box-shadow: none;
                      -moz-appearance: initial;
                    } ${this.custom_selector} .ff-el-group input[type=checkbox]:before,
                    ${this.custom_selector} .ff-el-group input[type=radio]:before {
                      content: none;
                    } ${this.custom_selector} .ff-el-group input[type=checkbox]:after,
                    ${this.custom_selector} .ff-el-group input[type=radio]:after {
                      content: " ";
                      background-color: #fff;
                      display: inline-block;
                      ${marginStyle}
                      padding-bottom: 3px;
                      color: #212529;
                      width: 15px;
                      height: 15px;
                      border-color: ${borderColor};
                      border-style: ${borderType};
                      ${borderWidthStyle}
                      padding-left: 1px;
                      ${borderRadiusStyle}
                      padding-top: 1px;
                      -webkit-transition: all .1s ease;
                      transition: all .1s ease;
                      background-size: 9px;
                      background-repeat: no-repeat;
                      background-position: center center;
                      position: absolute;
                      box-sizing: border-box;
                    } ${this.custom_selector} .ff-el-group input[type=checkbox]:checked:after, ${this.custom_selector} .ff-el-group input[type=radio]:checked:after {
                      ${borderWidthStyle}
                      background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3E%3Cpath fill='%23fff' d='M6.564.75l-3.59 3.612-1.538-1.55L0 4.26 2.974 7.25 8 2.193z'/%3E%3C/svg%3E");
                      background-color: ${checkedColor};
                      -webkit-transition: all 0.3s ease-out;
                      transition: all 0.3s ease-out;
                      color: #fff;
                      border-color: ${checkedColor};
                    } ${this.custom_selector} .ff-el-group input[type=radio]:after {
                      ${radioBorderSameAsCheckbox ? borderRadiusStyle : 'border-radius: 50%;'}
                      font-size: 10px;
                      padding-top: 1px;
                      padding-left: 2px;
                    } ${this.custom_selector} .ff-el-group input[type=radio]:checked:after {
                      background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3E%3Ccircle r='3' fill='%23fff'/%3E%3C/svg%3E");
                    }`;
            return styles;

        },
        generateNetPromoterStyles(borderStyle){
            let styles = '';
            if (borderStyle.value.status == 'yes'){
                //geenerate border style from selected label border
                let borderColor = borderStyle.value.border_color;
                let borderWidth = borderStyle.value.border_width.bottom;
                let borderRadius = borderStyle.value.border_radius.top;
                let borderType = borderStyle.value.border_type;

                let netPromoter = `
                    .ff_net_table  tbody tr td {
                        border: ${borderWidth}px ${borderType} ${borderColor};
                        border-right-width: ${borderWidth}px;
                        border-left: 0;
                    }.ff_net_table  tbody tr td:last-of-type {
                        border-right-width: ${borderWidth}px;
                    };
                    .ff_net_table  tbody tr td:last-child {
                        border-radius: 0 ${borderRadius}px ${borderRadius}px 0;
                    }.ff_net_table  tbody tr td:first-of-type {
                        border-left: ${borderWidth}px ${borderType} ${borderColor};
                    } 
                    .ff_net_table tbody tr td:first-of-type {
                        border-left: ${borderWidth}px ${borderType} ${borderColor};
                        border-radius: ${borderRadius}px 0 0 ${borderRadius}px;
                    }`;
                styles+= `${this.custom_selector} { ${netPromoter} }`;
            }
            return styles;
        },
        generateCheckboxRadio(borderStyle){
            let styles = '';
            if (borderStyle && borderStyle.value.status == 'yes'){
                let borderColor = borderStyle.value.border_color;
                let borderWidth = borderStyle.value.border_width.bottom;
                let borderRadius = borderStyle.value.border_radius.top;
                let borderType = borderStyle.value.border_type;
                let netPromoter = '';

                netPromoter += `.ff_net_table  tbody tr td {
                        border: ${borderWidth}px ${borderType} ${borderColor};
                        border-right-width: ${borderWidth}px;
                        border-left: 0;
                    };`;

                netPromoter += `.ff_net_table  tbody tr td:last-of-type {
                        border-right-width: ${borderWidth}px;
                    };
                    .ff_net_table  tbody tr td:last-child {
                        border-radius: 0 ${borderRadius}px ${borderRadius}px 0;
                    };`;
                netPromoter += `.ff_net_table  tbody tr td:first-of-type {
                            border-left: ${borderWidth}px ${borderType} ${borderColor};
                     };
                         .ff_net_table tbody tr td:first-of-type {
                            border-left: ${borderWidth}px ${borderType} ${borderColor};
                            border-radius: ${borderRadius}px 0 0 ${borderRadius}px;
                        }`;
                styles+= `${this.custom_selector} { ${netPromoter} }`;
            }
            return styles;

        },
        getSettings() {
            this.loading = true;
            FluentFormsGlobal.$get({
                action: 'fluentform_get_form_styler',
                form_id: this.form_vars.form_id,
                with_all_form_styles: 'yes'
            })
                .then(response => {
                    this.preset_name = response.data.preset_style;
                    this.is_multipage = response.data.is_multipage;
                    this.has_section_break = response.data.has_section_break ||response.data.has_html_input;
                    this.has_tabular_grid = response.data.has_tabular_grid;
                    this.has_range_slider = response.data.has_range_slider;
                    this.has_net_promoter = response.data.has_net_promoter;
                    this.has_stripe_inline_element = response.data.has_stripe_inline_element;
                    this.has_payment_summary = response.data.has_payment_summary;
                    this.has_payment_coupon = response.data.has_payment_coupon;
                    this.has_image_or_file_button = response.data.has_image_or_file_button;
                    this.has_custom_style = response.data.styles;
                    let formattedPresets = {};
                    for (const [key, value] of Object.entries(response.data.presets)) {
                        if (value.style){
                            const style = JSON.parse(value.style);
                            each(style, (styleSettings, styleKey) => {
                                if (this[styleKey] !== undefined) {
                                    style[styleKey] = merge(structuredClone(this[styleKey]), styleSettings);
                                }
                            });
                            value.style = style;
                        }
                        formattedPresets[key] = value;

                    }
                    this.presets = formattedPresets;

                    this.preset_name = this.preset_name || 'ffs_default';
                    this.saved_custom_styles = response.data.styles;
                    if (response.data.styles) {
                        each(response.data.styles, (styleSettings, styleKey) => {
                            if (this[styleKey] !== undefined) {
                                response.data.styles[styleKey] = merge(structuredClone(this[styleKey]), styleSettings);
                            }
                        });
                        this.saved_custom_styles = response.data.styles;
                        this.applyStyle(response.data.styles)
                    }
                    if(response.data.existing_form_styles) {
                        this.existing_form_styles = response.data.existing_form_styles;
                    }
                })
                .fail(error => {
                    let message = this.$t('Something went wrong, please try again.');
                    if(error.responseJSON && error.responseJSON.message) {
                        message = error.responseJSON.message;
                    }else if (error.responseJSON.data && error.responseJSON.data.message) {
                        message = error.responseJSON.data.message;
                    }
                    this.$notify.error({
                        title: this.$t('Error'),
                        message: message,
                        offset: 30
                    });
                })
                .always(() => {
                    this.loading = false;
                    jQuery('#fluentform_styler_css_' + this.form_vars.form_id).remove();
                });
        },
        generateStyle(){
            let form_styles = {
                container_styles: this.container_styles,
                asterisk_styles: this.asterisk_styles,
                inline_error_msg_style: this.inline_error_msg_style,
                success_msg_style: this.success_msg_style,
                error_msg_style: this.error_msg_style,
            };

            form_styles.label_styles = this.label_styles;
            form_styles.input_styles = this.input_styles;
            form_styles.placeholder_styles = this.placeholder_styles;
            form_styles.submit_button_style = this.submit_button_style;
            form_styles.radio_checkbox_style = this.radio_checkbox_style;

            if (this.has_stripe_inline_element) {
                // store stripe custom element style
                form_styles.stripe_inline_element_style = this.stripe_inline_element_style;
            }

            if (this.has_section_break) {
                form_styles.sectionbreak_styles = this.sectionbreak_styles;
            }

            if (this.has_tabular_grid) {
                form_styles.gridtable_style = this.gridtable_style;
            }

            if (this.has_range_slider) {
                form_styles.range_slider_style = this.range_slider_style;
            }

            if (this.has_net_promoter) {
                form_styles.net_promoter_style = this.net_promoter_style;
            }

            if (this.has_payment_summary) {
                form_styles.payment_summary_style = this.payment_summary_style;
            }

            if (this.has_payment_coupon) {
                form_styles.payment_coupon_style = this.payment_coupon_style;
            }
            if (this.has_image_or_file_button) {
                form_styles.image_or_file_button_style = this.image_or_file_button_style;
            }
            if (this.is_multipage) {
                form_styles.next_button_style = this.next_button_style;
                form_styles.prev_button_style = this.prev_button_style;
                form_styles.step_header_style = this.step_header_style;
            }
            return form_styles;

        },
        input_styles_watch_handler() {
            let styles = '';
            let focusStyle = '';
            let color = '';
            each(this.input_styles.all_tabs.tabs, (style, styleKey) => {
                if (styleKey == 'normal') {
                    color += this.extractStyle(style.value.color, 'color', '');
                    each(style.value, (style1, styleKey1) => {
                        styles += this.extractStyle(style1, styleKey1, '');
                    });
                } else {
                    each(style.value, (style1, styleKey1) => {
                        focusStyle += this.extractStyle(style1, styleKey1, '');
                    });
                }
            });
            if (styles) {
                if (this.has_stripe_inline_element) {
                    this.stripe_inline_element_style.input = styles;
                }
                styles = `${this.custom_selector} .ff-el-input--content input, ${this.custom_selector} .ff-el-input--content textarea, ${this.custom_selector} .ff-el-input--content select, ${this.custom_selector} .ff-el-form-control.ff_stripe_card_element, ${this.custom_selector} .choices__list--single, ${this.custom_selector} .choices[data-type*='select-multiple'] { ${styles} }`;
            }
            if (color) {
                styles += `${this.custom_selector} .ff-el-input--content .ff_item_price_wrapper { ${color} }`;
            }
            if (focusStyle) {
                if (this.has_stripe_inline_element) {
                    this.stripe_inline_element_style.focusInput = focusStyle;
                }
                focusStyle = `${this.custom_selector} .ff-el-input--content input:focus, ${this.custom_selector} .ff-el-input--content textarea:focus, ${this.custom_selector} .ff-el-form-control.ff_stripe_card_element:focus  { ${focusStyle} }`;
            }
            if (this.has_net_promoter){
                styles += this.generateNetPromoterStyles(this.input_styles.all_tabs.tabs.normal.value.border);
            }
            let allStyles = styles + focusStyle;
            this.pushStyle('#ff_input_styles', allStyles);
        },
        applyStyle(styles){
            each(styles, (styleSettings, styleKey) => {
                this[styleKey] = styleSettings;
            });
        },
        applyStylesWithAutoResolve(oldVal = '') {
            //update style
            let styles = this.presets[this.preset_name]?.style;
            if (this.preset_name.trim() === 'ffs_custom') {
                styles = this.saved_custom_styles;
            }
            if (undefined !== styles) {
                styles = JSON.parse(JSON.stringify( styles ));
            }

            // todo: improve this further
            if (oldVal) {
                jQuery('.fluentform').removeClass(oldVal + '_wrap');
            }

            this.applyStyle(styles)
            this.input_styles_watch_handler();
        },
        resetStyle() {
            const {
                label_styles,
                container_styles,
                input_styles,
                placeholder_styles,
                sectionbreak_styles,
                gridtable_style,
                radio_checkbox_style,
                submit_button_style,
                asterisk_styles,
                inline_error_msg_style,
                success_msg_style,
                error_msg_style,
                range_slider_style,
                net_promoter_style,
                step_header_style,
                next_button_style,
                prev_button_style,
                stripe_inline_element_style,
                payment_summary_style,
                payment_coupon_style,
                image_or_file_button_style
            } = this.$options.data.call(this);

            const initialStyles = {
                label_styles,
                container_styles,
                input_styles,
                placeholder_styles,
                sectionbreak_styles,
                gridtable_style,
                radio_checkbox_style,
                submit_button_style,
                asterisk_styles,
                inline_error_msg_style,
                success_msg_style,
                error_msg_style,
                range_slider_style,
                net_promoter_style,
                step_header_style,
                next_button_style,
                prev_button_style,
                stripe_inline_element_style,
                payment_summary_style,
                payment_coupon_style,
                image_or_file_button_style
            };
            this.applyStyle(initialStyles)
        },
        getResolveValue(value, type) {
            return 'custom' === type ? value : value + type;
        },
        hasValue(value) {
            return  value !== undefined && value !== '';
        }
    },
    computed:{
        maybeEnableCustomization() {
            return this.preset_name != '' && this.preset_name !== 'ffs_inherit_theme' || this.preset_name == 'ffs_custom'
        },
        showCustomizer(){
            return this.customize_preset == true || this.preset_name == 'ffs_custom';
        }
    },
    mounted() {
        this.getSettings();
        window.addEventListener('selectionFired', this.handleElmSelection);
        this.input_styles_watch_handler();

        if (jQuery('.ff-el-group.ff_list_buttons').length && !this.radio_checkbox_style.backgroundColor) {
            this.$set(this.radio_checkbox_style, 'backgroundColor', new BackgroundColor('backgroundColor'));
        }
    }
};
