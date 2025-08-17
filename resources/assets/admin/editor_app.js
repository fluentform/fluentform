import './helpers';
import {createApp} from 'vue';
import draggable from 'vuedraggable';
import {
    ElButton,
    ElCheckbox,
    ElCheckboxGroup,
    ElCol,
    ElColorPicker,
    ElDialog,
    ElDropdown,
    ElDropdownItem,
    ElDropdownMenu,
    ElForm,
    ElFormItem,
    ElInput,
    ElSlider,
    ElLoading,
    ElMessage,
    ElNotification,
    ElOption,
    ElPopover,
    ElRadio,
    ElRadioButton,
    ElRadioGroup,
    ElRate,
    ElRow,
    ElSelect,
    ElTabPane,
    ElTabs,
    ElTooltip,
    ElUpload,
    ElSwitch,
    ElInputNumber,
    ElCard,
    ElAlert,
    ElSkeleton,
    ElSkeletonItem,
    ElOptionGroup,
    ElLink,
    ElTable,
    ElTableColumn,
    ElDatePicker,
} from 'element-plus';

import en from 'element-plus/es/locale/lang/en';
import mixins from './editor_mixins.js';
import globalSearch from './global_search';
import Errors from '../common/Errors';
import FormEditor from './views/FormEditor.vue';
import MoreMenu from './views/MoreMenu.vue';
import {mapActions} from 'vuex';
import mitt from 'mitt';
import store from './store';
import notifier from "@/admin/notifier";

const emitter = mitt();
const eventBus = mitt();

const app = createApp({
    components: {
        globalSearch,
        ff_form_editor: FormEditor,
    },
    data: {
        form_id: window.FluentFormApp.form_id,
        form: {
            title: "",
            dropzone: [],
            submitButton: {},
            stepsWrapper: {},
            stepStart: {
                element: "step_start",
                attributes: {
                    id: "",
                    class: ""
                },
                settings: {
                    progress_indicator: "progress-bar",
                    step_titles: [],
                    disable_auto_focus: 'no',
                    enable_auto_slider: 'no',
                    enable_step_data_persistency: 'no',
                    enable_step_page_resume: 'no',
                    step_animation: 'slide',
                },
                editor_options: {
                    title: "Start Paging"
                }
            },
            stepEnd: {
                element: "step_end",
                attributes: {
                    id: "",
                    class: ""
                },
                settings: {
                    prev_btn: {
                        type: "default",
                        text: "Previous",
                        img_url: ""
                    }
                },
                editor_options: {
                    title: "End Paging"
                }
            }
        },
        submitButtonMock: {
            uniqElKey: "el_" + Date.now(),
            element: "button",
            attributes: {
                type: "submit",
                class: ""
            },
            settings: {
                align: "left",
                button_style: "default",
                container_class: "",
                help_message: "",
                button_size: "md",
                button_ui: {
                    type: "default",
                    text: "Submit Form",
                    img_url: ""
                },
                conditional_logics: [],
                normal_styles: {
                    'backgroundColor' : '#1a7efb',
                    'borderColor'     : '#1a7efb',
                    'color'           : '#ffffff',
                    'borderRadius'    : '',
                    'minWidth'        : ''
                },
                hover_styles: {
                    'backgroundColor' : '#ffffff',
                    'borderColor'     : '#1a7efb',
                    'color'           : '#1a7efb',
                    'borderRadius'    : '',
                    'minWidth'        : ''
                }
            },
            editor_options: {
                title: "Submit Button"
            }
        },
        loading: false,
        form_saving: false,
        isClicked: false,
        editHistoryIndex: null,
        tempFormData : {}
    },
    methods: {
        ...mapActions(["loadResources"]),

        /**
         * Prepare the form for the dropzone
         * after fetching from the server
         */
        prepareForm() {
            const form = window.FluentFormApp.form;
            let formData = form.form_fields ? JSON.parse(form.form_fields) : {};

            this.form.id = form.id;
            this.form.title = form.title;
            this.form.dropzone = formData.fields || [];
            let button = formData.submitButton || JSON.parse(JSON.stringify(this.submitButtonMock));

            if (!button.settings.conditional_logics) {
                // we will implement later
                //  button.settings.conditional_logics = [];
            }

            this.form.submitButton = button;

            this.form.stepsWrapper = formData.stepsWrapper || this.form.stepsWrapper;

            if (formData.stepsWrapper && formData.stepsWrapper.stepStart) {
                if (!formData.stepsWrapper.stepStart.settings.disable_auto_focus) {
                    formData.stepsWrapper.stepStart.settings.disable_auto_focus = 'no';
                }

                if (!formData.stepsWrapper.stepStart.settings.enable_auto_slider) {
                    formData.stepsWrapper.stepStart.settings.enable_auto_slider = 'no';
                }

                if (!formData.stepsWrapper.stepStart.settings.enable_step_data_persistency) {
                    formData.stepsWrapper.stepStart.settings.enable_step_data_persistency = 'no';
                }

                if (!formData.stepsWrapper.stepStart.settings.enable_step_page_resume) {
                    formData.stepsWrapper.stepStart.settings.enable_step_page_resume = 'no';
                }

                if (!formData.stepsWrapper.stepStart.settings.step_animation) {
                    formData.stepsWrapper.stepStart.settings.step_animation = 'slide';
                }

                this.form.stepStart = formData.stepsWrapper.stepStart;
            }

            if (formData.stepsWrapper && formData.stepsWrapper.stepEnd) {
                this.form.stepEnd = formData.stepsWrapper.stepEnd;
            }

            this.initNotifyUnsaved();
        },

        /**
         * The form data into the server
         */
        saveForm() {
            this.form_saving = true;
            let formFields = {
                fields: this.form.dropzone,
                submitButton: this.form.submitButton
            };

            if (!_ff.isEmpty(this.form.stepsWrapper)) {
                formFields.stepsWrapper = this.form.stepsWrapper;
            }

            let data = {
                title: this.form.title,
                formFields: JSON.stringify(formFields),
                form_id: this.form_id,
                action: 'fluentform-form-update'
            };

            FluentFormsGlobal.$post(data)
                .then(response => {
                    this.$success(response.message);
                    this.form_saving = false;
                    FluentFormApp.isDirty = false;

                    const saveFormBtn = jQuery("#saveFormData");
                    saveFormBtn.html('<i class="el-icon-success"></i>' + saveFormBtn.data("text"));

                    // Update the hash now.
                    this.saveHash();
                })
                .catch(error => {
                    console.log(error);
                    this.$fail(error?.responseJSON.message || 'Saving failed');
                    this.form_saving = false;
                });
        },

        initNotifyUnsaved() {
            // Save the initial save.
            this.saveHash();

            jQuery(window).on('beforeunload', () => {
                if (this.dropzoneHash !== JSON.stringify(this.form.dropzone)) return true;
            });
        },

        /*
        * Show Preview of Form from history
        */
        updateFormFromEditHistory(editHistory) {
            this.form.dropzone = editHistory.fields
            this.form.submitButton = editHistory.submitButton
        },
        /*
        * return to original form from preview
        */
        resetFormToOriginal() {
            if (this.tempFormData) {
                this.form.dropzone = this.tempFormData.dropzone || [];
                this.form.submitButton = this.tempFormData.submitButton || [];
            }
        },

        /**
         * Save a deep copy of the original form data
         */
        saveOriginalForm() {
            this.tempFormData = JSON.parse(JSON.stringify({
                dropzone: this.form.dropzone,
                submitButton: this.form.submitButton
            }));
        },

        saveHash() {
            this.dropzoneHash = JSON.stringify(this.form.dropzone);
        },

        $t(string) {
            let transString = window.FluentFormApp.form_editor_str[string] || string
            return _$t(transString, ...arguments);
        },
        $_n(singular, plural, count) {
            let number = parseInt(count.toString().replace(/,/g, ''), 10);
            if (number > 1) {
                return this.$t(plural, count);
            }
            return this.$t(singular, count);
        },
    },

    beforeCreate() {
        this.$on("change-title", module => {
            jQuery("title").text(`${module} - Fluentform`);
        });
        this.$emit("change-title", "Editor");
    },
    mounted() {
        this.prepareForm();
        this.loadResources(this.form_id);

        if (this.is_conversion_form) {
            jQuery('#wpcontent').addClass('ff_conversion_editor');
        }

        if (window.FluentFormApp.is_conversion_form) {
            document.getElementById('wpcontent').classList.add('ff_conversion_editor');
        }

        FluentFormEditorEvents.$on('editor-history-preview',(editHistory,type,index) =>{
            if (type == 'enter') {
                this.saveOriginalForm();
                this.updateFormFromEditHistory(editHistory);
            } else if (type == 'leave') {
                if (!this.isClicked && this.editHistoryIndex != index) {
                    this.resetFormToOriginal(editHistory);
                }
            } else if (type == 'restore') {
                this.isClicked = true;
                this.editHistoryIndex = index;
                setTimeout(() => {
                    this.isClicked = false;
                }, 1000);
                this.updateFormFromEditHistory(editHistory);
                this.$success('Restored from History! Click Save to Confirm');
            }
        });
    },
});

const components = [
    ElButton,
    ElCheckbox,
    ElCheckboxGroup,
    ElCol,
    ElColorPicker,
    ElDialog,
    ElDropdown,
    ElDropdownItem,
    ElDropdownMenu,
    ElForm,
    ElFormItem,
    ElInput,
    ElSlider,
    ElLoading,
    ElOption,
    ElPopover,
    ElRadio,
    ElRadioButton,
    ElRadioGroup,
    ElRate,
    ElRow,
    ElSelect,
    ElTabPane,
    ElTabs,
    ElTooltip,
    ElUpload,
    ElSwitch,
    ElInputNumber,
    ElCard,
    ElAlert,
    ElSkeleton,
    ElSkeletonItem,
    ElOptionGroup,
    ElLink,
    ElTable,
    ElTableColumn,
    ElDatePicker,
];

components.forEach(component => {
    app.use(component);
});

app.component('draggable', draggable);

app.config.globalProperties.$loading = ElLoading.service;
app.config.globalProperties.$notify = ElNotification;
app.config.globalProperties.$message = ElMessage;
app.config.globalProperties.emitter = emitter;

// configure language
app.config.globalProperties.$ELEMENT = {locale: en};

window.FluentFormEditorEvents = createApp({});

window.Errors = Errors;

window.ffEditorOptionsCustomComponents = window.ffEditorOptionsCustomComponents || {};

app.use(store);
app.mixin(mixins);
app.provide("eventBus", eventBus);

window.fluentFormEditorApp = app;
app.mount('#ff_form_editor_app');

// More menus app
const MoreMenuApp = createApp({
    components: {
        MoreMenu,
    }
});
components.forEach(component => {
    MoreMenuApp.use(component);
});
MoreMenuApp.config.globalProperties.$notify = ElNotification;
MoreMenuApp.config.globalProperties.$message = ElMessage;
MoreMenuApp.config.globalProperties.$ELEMENT = {locale: en};
MoreMenuApp.mount('#more-menu');
