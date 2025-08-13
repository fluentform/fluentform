<template>
    <div style="min-height: 300px;" class="ff_method_settings">
        <el-skeleton :loading="loading" animated :rows="10">
            <el-form v-if="settings" label-position="top" rel="test_settings" :model="settings">
                <el-form-item class="ff-form-item" :label="$t('Status')">
                    <el-checkbox true-label="yes" false-label="no" v-model="settings.is_active">
                        {{ $t('Enable Offline/Test Payment Method') }}
                    </el-checkbox>
                </el-form-item>
                <el-form-item v-if="settings.is_active === 'yes'" class="ff-form-item" :label="$t('Payment Mode')">
                    <el-radio-group v-model="settings.payment_mode">
                        <el-radio label="test">{{ $t('Sandbox Mode') }}</el-radio>
                        <el-radio label="live">{{ $t('Live Mode') }}</el-radio>
                    </el-radio-group>
                </el-form-item>

                <div class="mt-4">
                    <el-button @click="saveSettings()" type="primary" size="medium" icon="el-icon-success">
                        {{ $t('Save Settings') }}
                    </el-button>
                </div>
            </el-form>
            <div v-else-if="!loading" class="ff_tips_warning">
                <p>
                    {{ $t('Sorry! No settings found. Maybe your payment module is disabled!') }}
                </p>
            </div>
        </el-skeleton>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'testSettings',
        data() {
            return {
                loading: false,
                settings: false,
                errors: new Errors()
            }
        },
        methods: {
            getSettings() {
                this.loading = true;
                this.errors.clear();
                FluentFormsGlobal.$get({
                    action: 'fluentform_handle_payment_ajax_endpoint',
                    route: 'get_payment_method_settings',
                    method: 'test'
                })
                    .then(response => {
                        this.settings = response.data.settings;
                    })
                    .fail(error => {

                    })
                    .always(() => {
                        this.loading = false;
                    })
            },
            saveSettings() {
                this.errors.clear();
                this.saving = true;
                FluentFormsGlobal.$post({
                    action: 'fluentform_handle_payment_ajax_endpoint',
                    route: 'save_payment_method_settings',
                    method: 'test',
                    settings: this.settings
                })
                    .then((response) => {
                        this.$success(response.data.message);
                    })
                    .fail((error) => {
                        this.$fail(error.responseJSON.data.message);
                        this.errors.record(error.responseJSON.data.errors);
                    })
                    .always(() => {
                        this.saving = false;
                    });
            }
        },
        mounted() {
            this.getSettings();
        }
    }
</script>
