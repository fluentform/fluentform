<template>
    <div class="ff_advanced_validation_wrapper">
        <el-form :data="settings" label-position="top">
            <el-form-item class="ff-form-item">
                <template #label>
                    {{ $t("Status") }}
                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                        <template #content>
                            <p>
                                {{ $t("Enable / Disable Advanced Form Validation Rules.") }}
                            </p>
                        </template>
                        <i class="ff-icon ff-icon-info-filled text-primary" />
                    </el-tooltip>
                </template>
                <filter-fields :hasPro="hasPro" :labels="labels" :conditionals="settings"
                               :fields="inputs"></filter-fields>
            </el-form-item>
            <template v-if="settings.status">
                <el-form-item class="ff-form-item">
                    <template #label>
                        {{ $t("Validation Type") }}
                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                            <template #content>
                                <p>
                                    {{ $t("Please select how the validation will apply.") }}
                                </p>
                            </template>
                            <i class="ff-icon ff-icon-info-filled text-primary" />
                        </el-tooltip>
                    </template>

                    <el-radio-group class="mb-3" v-model="settings.validation_type">
                        <el-radio v-for="(result_type, typeName) in result_types" :key="typeName" :value="typeName">
                            {{ result_type }}
                        </el-radio>
                    </el-radio-group>

                    <p
                        v-if="settings.validation_type == 'fail_on_condition_met'"
                        v-html="
                            $t(
                                'Based on your selection, submission %swill be rejected%s if %s conditions are met',
                                '<b>',
                                '</b>',
                                settings.type
                            )
                        "
                    >
                    </p>
                    <p
                        v-else
                        v-html="
                            $t(
                                'Based on your selection, submission %swill be valid%s if %s conditions are met',
                                '<b>',
                                '</b>',
                                settings.type
                            )
                        "
                    >
                    </p>
                </el-form-item>
                <el-form-item class="ff-form-item">
                    <template #label>
                        {{ $t("Error Message") }}
                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                            <template #content>
                                <p>
                                    {{ $t("Please write the error message if the form submission get invalid.") }}
                                </p>
                            </template>
                            <i class="ff-icon ff-icon-info-filled text-primary" />
                        </el-tooltip>
                    </template>
                    <el-input :placeholder="$t('Error Message on Failed submission')" type="textarea"
                              v-model="settings.error_message" />
                </el-form-item>
            </template>
        </el-form>
    </div>
</template>
<script type="text/babel">
import FilterFields from "./FilterFields.vue";

export default {
    name: "ExportDefaults",
    components: {
        FilterFields
    },
    props: ["settings", "inputs", "hasPro"],
    data() {
        return {
            labels: {
                status_label: "Enable Advanced Form Validation",
                notification_if_start: "Proceed/Fail form submission if",
                notification_if_end: "of the following match:"
            },
            result_types: {
                fail_on_condition_met: "Fail the submission if conditions met",
                success_on_condition_met: "Let Submit the form if conditions are met"
            }
        };
    }
};
</script>
