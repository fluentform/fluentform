<template>
    <el-form label-width="205px" label-position="left" v-loading="loading" :element-loading-text="$t('Loading Settings...')">
        <el-row class="setting_header">
            <el-col :md="12">
                <h2>{{ $t('Slack Integration') }}</h2>
            </el-col>
            <el-col :md="12" class="action-buttons clearfix mb15">
                <el-button class="pull-right" size="small" type="primary" icon="el-icon-success" @click="save" :loading="saving"
                > {{loading ? $t('Saving ') : $t('Save ')}} {{ $t('Settings') }}
                </el-button>
            </el-col>
        </el-row>
        <el-form-item :label="$t('Integrate Slack')">
            <el-switch active-color="#13ce66" v-model="slack.enabled"></el-switch>
        </el-form-item>

        <template v-if="slack.enabled">
            <el-form-item style="margin-left: 17px;" :label="$t('Slack Title')">
                <el-input placeholder="optional" v-model="slack.textTitle"></el-input>
            </el-form-item>

            <el-form-item class="conditional-items">
                <div slot="label">
                    {{ $t('Webhook URL') }}

                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>{{ ('Webhook URL') }}</h3>

                            <p>
                                The <a href="https://api.slack.com/incoming-webhooks" target="_blank">{{ $t('slack webhook URL') }}</a> {{ $t(' where Fluent Forms will send JSON payload.') }}
                            </p>
                        </div>

                        <i class="el-icon-info el-text-info"></i>
                    </el-tooltip>
                </div>

                <el-input placeholder="https://hooks.slack.com/services/..." v-model="slack.webhook"></el-input>
            </el-form-item>

            <el-form-item v-if="formattedFields"  class="conditional-items" >
                <div slot="label">
                    {{$t('Select Fields')}}
                </div>
                <el-checkbox  :disabled="!hasPro"  :indeterminate="isIndeterminate" v-model="slack.checkAll"  @change="handleCheckAllChange">{{ $t('Check all') }}</el-checkbox>
                <br>
                <el-checkbox-group v-model="slack.fields">
                    <el-checkbox
                        v-for="(value, i) in formattedFields"
                        :label="value"
                        :key="value + i"
                        @change="handleCheckedChange"
                        :disabled="!hasPro"
                    ></el-checkbox>
                </el-checkbox-group>
                <div v-show="!hasPro">
                    {{ $t('Field Selection is a pro feature.') }}
                </div>
            </el-form-item>

            <el-form-item style="margin-left: 17px;" :label="$t('Slack Footer message')">
                <el-input placeholder="Default is 'fluentform'" v-model="slack.footerText"></el-input>
            </el-form-item>
        </template>

        <el-form-item v-if="slack.enabled">
            <el-button class="pull-right" size="small" type="primary" icon="el-icon-success" @click="save" :loading="saving">
                {{loading ? $t('Saving ') : $t('Save ')}} {{ $t('Settings') }}
            </el-button>
        </el-form-item>
    </el-form>
</template>

<script>
    export default {
        name: "Slack",
        props: ['form_id','inputs'],
        data() {
            return {
                loading: false,
                saving: false,
                slack: {
                    enabled: false,
                    webhook: null,
                    textTitle:'',
                    footerText:'',
                    fields:[],
                    checkAll:'',
                },
                formattedFields:[],
                hasPro : window.FluentFormApp.hasPro,
                isIndeterminate: false,
                errors: new Errors
            }
        },
        methods: {
            handleCheckAllChange(val) {
                this.slack.fields = val ? this.formattedFields : [];
                this.isIndeterminate = false;
            },
            handleCheckedChange(value) {
                let checkedCount = this.slack.fields.length;
                this.slack.checkAll = checkedCount === this.formattedFields.length;
                this.isIndeterminate = checkedCount > 0 && checkedCount < this.formattedFields.length;
            },
            fetch() {
                this.loading = true;

                const url = 'forms/' + this.form_id + '/settings';
            
                FluentFormsGlobal.$rest.get(url, {meta_key: 'slack'})
                    .then(response => {
                        if (response[0]) {
                            this.slack = response[0].value;
                            this.slack.id = response[0].id;
                            if(!this.slack.fields){
                                this.$set(this.slack , 'fields', []);
                            }
                            if(!this.slack.checkAll){
                                this.$set(this.slack , 'checkAll', '');
                            }
                        }
                        this.formattedFields = response.formattedFields ? response.formattedFields : [];
    
                    })
                    .catch(e => {
                    })
                    .finally(() => {
                        this.loading = false;
                    })
            },
            save() {
                this.saving = true;

                let data = {
                    meta_key: 'slack',
                    value: JSON.stringify(this.slack),
                    meta_id: this.slack.id,
                };

                const url = 'forms/' + this.form_id + '/settings';
            
                FluentFormsGlobal.$rest.post(url, data)
                    .then(response => {
                        this.slack.id = response.id;

                        this.$success(response.message);
                    })
                    .catch(error => {
                        this.errors.record(error);
                    })
                    .finally(() => {
                        this.saving = false;
                    });
            }
        },
        mounted() {
            this.fetch();
        },
        beforeCreate() {
            jQuery('head title').text('Slack Settings - Fluent Forms');
            ffSettingsEvents.$emit('change-title', 'Slack Settings');
        }
    }
</script>
