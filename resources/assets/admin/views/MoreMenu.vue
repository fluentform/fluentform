<template>
    <div :class="{ ff_backdrop: visible }">
        <el-dropdown @command="handle">
            <span class="el-dropdown-link">
                <i 
                    class="el-icon-more" 
                    style="cursor: pointer; transform: rotate(90deg);font-size: 20px;margin-top: 2px;"
                />
            </span>

            <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="conversational">
                    {{ convertBtnText }}
                </el-dropdown-item>
            </el-dropdown-menu>
        </el-dropdown>

        <el-dialog
            :title="$t('Confirmation')"
            :visible.sync="visible"
            :append-to-body="true"
            width="40%"
        >
            <p>
                <b>{{ $t('Are you sure you want to convert this form?') }}</b>
            </p>

            <template v-if="!is_conversion_form">
                <p>
                    {{
                        $t('Conversational Forms currently doesn\'t support the following fields:')
                    }}
                </p>

                <el-row :gutter="20">
                    <el-col :span="8" v-for="(field, i) in fields" :key="i">
                        <i class="el-icon-caret-right"></i> {{ field }}
                    </el-col>
                </el-row>

                <p>
                    {{ $t('You may also lose data of these fields.') }}
                </p>
            </template>

            <span slot="footer" class="text-center dialog-footer">
                <el-button @click="visible = false" size="small">
                    {{ $t('Cancel') }}
                </el-button>

                <el-button type="primary" size="small" icon="el-icon-success" @click="confirm">
                    {{ $t('Convert') }}
                </el-button>
            </span>
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
            let data = {
                form_id: this.form_id,
                action: "fluentform-convert-to-conversational"
            };

            FluentFormsGlobal.$post(data)
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
