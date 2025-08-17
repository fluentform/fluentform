<template>
    <div class="ff_more_menu">
        <el-dropdown @command="handle" trigger="click">
            <span class="el-dropdown-link">
                <i class="ff-icon ff-icon-more-vertical"/>
            </span>

            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item command="conversational">
                        {{ convertBtnText }}
                    </el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

        <div :class="{ ff_backdrop: visible }">
            <el-dialog
                v-model="visible"
                :append-to-body="true"
                width="60%"
            >
                <template #header>
                    <h5 class="mb-2">{{ $t('Confirmation') }}</h5>
                    <p>{{ $t('Are you sure you want to convert this form?') }}</p>
                </template>
                <template v-if="!isConversationalForm">
                    <el-alert
                        class="mt-4"
                        :title="$t('Warning')"
                        type="warning"
                        :description="$t('Conversational Forms currently doesn\'t support the following fields: You may also lose data of these fields.')"
                        show-icon
                        :closable="false"
                    >
                    </el-alert>
                    <el-row :gutter="20" class="mt-5">
                        <el-col :span="8" v-for="(field, i) in fields" :key="i">
                            <div class="mb-3">
                                <i class="el-icon el-icon-caret-right"></i>
                                <span>{{ field }}</span>
                            </div>
                        </el-col>
                    </el-row>
                </template>

                <template #footer>
                    <span class="dialog-footer">
                        <el-button @click="visible = false" type="info" class="el-button--soft">
                            {{ $t('Cancel') }}
                        </el-button>
                        <el-button type="primary" icon="el-icon-success" @click="confirm">
                            {{ $t('Convert') }}
                        </el-button>
                    </span>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<script>
import notifier from "@/admin/notifier";

export default {
    name: "MoreMenu",
    data() {
        return {
            form_id: window.FluentFormApp.form_id,
            visible: false,
            fields: [
                "Section Break",
                "Shortcode",
                "Action Hook",
                "Form Step",
                "Custom Submit Button",
                "Net Promoter Score",
                "Chained Select Field",
                "Color Picker Field",
                "Repeat Field",
                "POST/CPT Selection",
                "Containers"
            ],
            isConversationalForm: window.FluentFormApp.is_conversion_form,
        };
    },
    computed: {
        convertBtnText() {
            const text = this.isConversationalForm ? 'Convert to Regular Form' : 'Convert to Conversational Form';
            return this.$t(text);
        }
    },
    methods: {
        ...notifier,
        $t(str) {
            let transString = window.FluentFormApp.form_editor_str[str];
            if (transString) {
                return transString;
            }
            return str;
        },
        handle() {
            this.visible = !this.visible;
        },
        convert() {
            const url = FluentFormsGlobal.$rest.route('convertForm', this.form_id);
            FluentFormsGlobal.$rest.post(url)
                .then(response => {
                    this.$success(response.message);
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                })
                .catch(error => {
                    this.$fail(error.message);
                });
        },
        confirm() {
            this.visible = false;
            this.convert();
        }
    }
};
</script>
