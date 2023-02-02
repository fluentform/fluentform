<template>
    <div class="ff_advanced_validation_wrapper">
        <el-form :data="settings" v-if="hasPro">
            <div class="ff_block_item">
                <div class="ff_block_title_group mb-3">
                    <h6 class="ff_block_title">{{ $t('Status') }}</h6>
                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                        <div slot="content">
                            <p>
                                {{ $t('Enable / Disable Advanced Form Validation Rules.') }}
                            </p>
                        </div>
                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                    </el-tooltip>
                </div><!-- .ff_block_title_group -->
                <div class="ff_block_item_body">
                    <filter-fields :labels="labels" :conditionals="settings" :fields="inputs"></filter-fields>
                </div><!-- .ff_block_item_body -->
            </div><!-- .ff_block_item -->

            <template v-if="settings.status">
                <div class="ff_block_item">
                    <div class="ff_block_title_group mb-3">
                        <h6 class="ff_block_title">{{ $t('Validation Type') }}</h6>
                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                            <div slot="content">
                                <p>
                                    {{ $t('Please select how the validation will apply.') }}
                                </p>
                            </div>
                            <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                        </el-tooltip>
                    </div><!-- .ff_block_title_group -->
                    <div class="ff_block_item_body">
                        <div class="mb-3">
                            <el-radio-group v-model="settings.validation_type">
                                <el-radio 
                                    v-for="(result_type, typeName) in result_types" 
                                    :key="typeName" 
                                    :label="typeName"
                                >
                                    {{result_type}}
                                </el-radio>
                            </el-radio-group>
                        </div>
                        <p v-if="settings.validation_type == 'fail_on_condition_met'">
                            {{$t('Based on your selection, submission ')}}
                            <b>{{ $t('will be rejected ') }}</b> 
                            {{ $t('if ') }} {{ settings.type }} {{ $t('conditions are met') }}
                        </p>
                        <p v-else>
                            {{ $t('Based on your selection, submission ') }}
                            <b>{{ $t('will be valid ') }}</b> 
                            {{ $t('if ') }} {{settings.type}} {{ $t('conditions are met') }}
                        </p>
                    </div><!-- .ff_block_item_body -->
                </div><!-- .ff_block_item -->
                
                <div class="ff_block_item">
                    <div class="ff_block_title_group mb-3">
                        <h6 class="ff_block_title">{{ $t('Error Message') }}</h6>
                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                            <div slot="content">
                                <p>
                                    {{ $t('Please write the error message if the form submission get invalid.') }}
                                </p>
                            </div>
                            <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                        </el-tooltip>
                    </div><!-- .ff_block_title_group -->
                    <div class="ff_block_item_body">
                        <el-input 
                            :placeholder="$t('Error Message on Failed submission')" 
                            type="textarea" 
                            v-model="settings.error_message"
                        />
                    </div><!-- .ff_block_item_body -->
                </div><!-- .ff_block_item -->
            </template>
        </el-form>
        <Notice type="danger-soft" v-else>
            <el-row class="justify-between items-center" :gutter="10">
                <el-col :span="12">
                    <h6 class="title mb-1">{{$t('Advanced Form Validation is a Pro feature')}}</h6>
                    <p class="text fs-14">{{$t('Please upgrade to PRO to unlock the feature.')}}</p>
                </el-col>
                <el-col :span="12" class="text-right">
                    <a target="_blank" href="https://fluentforms.com/pricing/?utm_source=plugin&amp;utm_medium=wp_install&amp;utm_campaign=ff_upgrade&amp;theme_style=twentytwentythree" class="el-button el-button--danger el-button--small">
                        {{$t('Upgrage to Pro')}}
                    </a>
                </el-col>
            </el-row>
        </Notice>
    </div>
</template>
<script type="text/babel">
    import FilterFields from './FilterFields.vue';

    export default {
        name: 'ExportDefaults',
        components: {
            FilterFields
        },
        props: ['settings', 'inputs'],
        data() {
            return {
                labels: {
                    status_label: 'Enabled Advanced Form Validation',
                    notification_if_start: 'Proceed/Fail form submission if',
                    notification_if_end: 'of the following match:'
                },
                hasPro: !!window.FluentFormApp.hasPro,
                result_types: {
                    fail_on_condition_met: 'Fail the submission if conditions met',
                    success_on_condition_met: 'Let Submit the form if conditions are met'
                }
            }
        }
    }
</script>
