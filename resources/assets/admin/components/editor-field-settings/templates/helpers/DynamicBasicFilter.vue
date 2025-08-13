<template>
    <div>
        <template v-if="isFormSubmission">
            <el-row :gutter="20">
                <el-col :span="24">
                    <el-form-item>
                        <template #label>
                            <ff-label :label="$t('Form')" :help-text="$t('Choose a form from the list.')"></ff-label>
                        </template>
                        <el-select
                            class="el-fluid"
                            :placeholder="$t('Select form')"
                            v-model="model.form_id"
                            filterable
                            @change="getFormFields"
                        >
                            <el-option
                                v-for="(label, value) in formIds"
                                :key="'key_' + value"
                                :label="label"
                                :value="value"
                            ></el-option>
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="24">
                    <el-form-item>
                        <template #label>
                            <ff-label :label="$t('Form Field')" :help-text="$t('Select form field')"></ff-label>
                        </template>
                        <el-select class="el-fluid" :placeholder="$t('Select Field')" v-model="model.form_field">
                            <el-option
                                v-for="(label, value) in formFields"
                                :key="'key_' + value"
                                :label="label"
                                :value="value"
                            ></el-option>
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>
        </template>
        <template v-else-if="isUser">
            <el-row :gutter="20">
                <el-col :span="24">
                    <el-form-item>
                        <template #label>
                            <ff-label :label="$t('User Role')" :help-text="$t('Chose a role')"></ff-label>
                        </template>
                        <el-select class="el-fluid" :placeholder="$t('Select Role')" v-model="model.role_name">
                            <el-option
                                v-for="(label, value) in userRoles"
                                :key="'key_' + value"
                                :label="label"
                                :value="value"
                            ></el-option>
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>
        </template>
    </div>
</template>

<script type="text/babel">
import elLabel from '@/admin/components/includes/el-label.vue';

export default {
    name: 'DynamicBasicFilter',
    props: ['filter_value_options', 'value', 'config'],
    data() {
        return {
            model: this.value || {},
            form_fields: {},
        };
    },
    watch: {
        model: {
            handler() {
                if (this.isFormSubmission) {
                    if (this.model.form_id && this.model.form_field) {
                        this.$emit('input', this.model);
                    }
                } else if (this.isUser) {
                    if (this.model.role_name) {
                        this.$emit('input', this.model);
                    }
                }
            },
            deep: true,
        },
    },
    components: {
        'ff-label': elLabel,
    },
    methods: {
        getFormFields(formId) {
            if (formId) {
                this.form_fields = {};
                FluentFormsGlobal.$get({
                    action: 'fluentform-get-dynamic-filter-form-fields',
                    form_id: formId,
                })
                    .done(res => {
                        if (res.data.options) {
                            this.form_fields = res.data.options;
                        }
                    })
                    .fail(error => {})
                    .always(() => {});
            }
        },
    },
    computed: {
        formIds() {
            return this.filter_value_options['fluentform_submissions.form_id'] || {};
        },

        userRoles() {
            return this.filter_value_options['user_roles'] || {};
        },

        formFields() {
            return this.hasFormFields ? this.form_fields : {};
        },

        hasFormFields() {
            return Object.keys(this.form_fields || {}).length;
        },

        isFormSubmission() {
            return 'fluentform_submission' === this.config.source;
        },
        isUser() {
            return 'user' === this.config.source;
        },
    },
    mounted() {
        if (this.isFormSubmission && this.model.form_id) {
            this.getFormFields(this.model.form_id);
        }
    },
};
</script>
