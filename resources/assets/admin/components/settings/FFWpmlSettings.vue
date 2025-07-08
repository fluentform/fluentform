<template>
    <div class="ff-wpml-settings">
        <card>
            <card-head>
                <h5 class="title">{{ $t('Translations using WPML') }}</h5>
                <p class="text">
                    {{ $t('Enable translations using WPML Core and WPML String Translations Plugin.') }}
                </p>
            </card-head>
            <card-body>
                    <div class="el-form-item ff-form-item ff-form-item-flex">
                        <label class="el-form-item__label">
                            {{ $t('Enable Translation for this form') }}
                        </label>
                        <div class="el-form-item__content">
                            <el-switch class="el-switch-lg" v-model="is_ff_wpml_enabled"/>
                        </div>
                    </div>
                    <div class="mt-4">
                        <el-button
                            :loading="saving"
                            type="primary"
                            icon="el-icon-success"
                            @click="saveSettings">
                            {{saving ? $t('Saving ') : $t('Save ')}} {{ $t('Settings') }}
                        </el-button>
                        <el-tooltip class="item" effect="dark" :content="$t('Click to reset the settings')" placement="top-start" v-if="is_ff_wpml_enabled">
                            <el-button
                                type="danger"
                                icon="el-icon-delete"
                                :loading="saving"
                                @click="deleteSettings">
                                {{ deleting ? $t('Resetting ') : $t('Reset ') }} {{ $t('WPML Translation') }}
                            </el-button>
                        </el-tooltip>
                    </div>
            </card-body>
        </card>
    </div>
</template>

<script type="text/babel">
import errorView from '@/common/errorView';
import Card from '@/admin/components/Card/Card.vue';
import CardHead from '@/admin/components/Card/CardHead.vue';
import CardHeadGroup from '@/admin/components/Card/CardHeadGroup.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import Notice from '@/admin/components/Notice/Notice.vue';

export default {
    name: 'QuizSettings',
    props: ['form', 'editorShortcodes', 'inputs'],
    components: {
        errorView,
        Card,
        CardHead,
        CardHeadGroup,
        CardBody,
        Notice,
    },
    data() {
        return {
            is_ff_wpml_enabled: false,
            saving: false,
            deleting: false,
        }
    },
    methods: {
        getSettings() {
            this.loading = true;
            FluentFormsGlobal.$get({
                action: 'fluentform_get_wpml_settings',
                form_id: this.form.id,
            })
                .then(response => {
                    this.is_ff_wpml_enabled = !!response.data;
                })
                .fail(error => {
                })
                .always(() => {
                    this.loading = false;
                });
        },
        saveSettings() {
            this.saving = true;
            FluentFormsGlobal.$post({
                action: 'fluentform_store_wpml_settings',
                form_id: this.form.id,
                is_ff_wpml_enabled: this.is_ff_wpml_enabled
            })
                .then(response => {
                    this.$success(response.data);
                })
                .fail(error => {
                    this.$fail(error.responseJSON);
                })
                .always(() => {
                    this.saving = false;
                });
        },
        deleteSettings() {
            this.deleting = true;
            this.$confirm(
                this.$t('This will permanently reset the WPML settings. Continue?'),
                this.$t('Warning'),
                {
                    confirmButtonText: this.$t('Reset'),
                    cancelButtonText: this.$t('Cancel'),
                    confirmButtonClass: 'el-button--soft el-button--danger',
                    cancelButtonClass: 'el-button--soft el-button--success',
                    type: 'warning'
                }).then(() => {
                FluentFormsGlobal.$post({
                    action: 'fluentform_delete_wpml_settings',
                    form_id: this.form.id,
                    is_ff_wpml_enabled: this.is_ff_wpml_enabled
                })
                    .then(response => {
                        this.$success(response.data);
                        this.getSettings();
                    })
                    .fail(error => {
                        this.$fail(error.responseJSON.data);
                    })
                    .always(() => {
                        this.deleting = false;
                    });
            }).catch(() => {
                this.deleting = false;
            })
        },
    },
    mounted() {
        this.getSettings();
        jQuery('head title').text('WPML Translations - Fluent Forms');
    }
}
</script>
