<template>
    <div>
        <el-dropdown @command="handle">
            <span class="el-dropdown-link">
                <i class="el-icon-more el-icon"/>
            </span>

            <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="conversational">
                    {{ convertBtnText }}
                </el-dropdown-item>
            </el-dropdown-menu>
        </el-dropdown>

        <el-dialog
            :visible.sync="visible"
            :append-to-body="true"
            width="54%"
        >
            <div slot="title">
                <h4 class="mb-2">{{$t('Confirmation')}}</h4>
                <p>{{ $t('Are you sure you want to convert this form?') }}</p>
            </div>

            <template v-if="!is_conversion_form">
                <el-alert
                    class="mt-4"
                    type="warning"
                    title="Warning"
                    :description="$t('Conversational Forms currently doesn\'t support the following fields: You may also lose data of these fields.')"
                    show-icon
                    :closable="false"
                >
                </el-alert>
                <el-row :gutter="20" class="mt-5 ff_data_row">
                    <el-col :span="8" v-for="(field, i) in fields" :key="i">
                        <div class="ff_data_item mb-3">
                            <i class="el-icon-caret-right el-icon"></i> <span>{{ field }}</span>
                        </div>
                    </el-col>
                </el-row>
            </template>

            <div class="dialog-footer mt-2 text-right">
                <el-button @click="visible = false" type="text" class="el-button--text-light">
                    {{ $t('Cancel') }}
                </el-button>
                <el-button type="primary" icon="el-icon-success" @click="confirm">
                    {{ $t('Convert') }}
                </el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
export default {
    name: "MoreMenu",
    data() {
        return {
            form_id: window.FluentFormApp.form_id,
            visible: false,
            fields: [
                "Name Fields",
                "Address Fields",
                "Section Break",
                "Shortcode",
                "Action Hook",
                "Form Step",
                "Custom Submit Button",
                "Range Slider Field",
                "Net Promoter Score",
                "Chained Select Field",
                "Color Picker Field",
                "Repeat Field",
                "POST/CPT Selection",
                "Containers"
            ]
        };
    },
    computed: {
        convertBtnText() {
            const text = this.is_conversion_form ? 'Convert to Regular Form' : 'Convert to Conversational Form';

            return this.$t(text);
        }
    },
    methods: {
        handle() {
            this.visible = !this.visible;
        },

        convert() {
            const url = FluentFormsGlobal.$rest.route('convertForm', this.form_id);

            FluentFormsGlobal.$rest.post(url)
                .then(response => {
                    this.$success(response.data.message);

                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                })
                .fail(error => {
                    if (error.responseJSON.data.message) {
                        this.$fail(error.responseJSON.data.message);
                    }
                });
        },

        confirm() {
            this.visible = false;
            this.convert();
        }
    }
};
</script>
