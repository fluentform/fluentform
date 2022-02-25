<template>
    <div :class="{ ff_backdrop: visible }">
        <el-dropdown v-if="!is_conversion_form" @command="handle">
            <span class="el-dropdown-link">
                <i 
                    class="el-icon-more" 
                    style="cursor: pointer; transform: rotate(90deg);font-size: 20px;margin-top: 2px;"
                />
            </span>

            <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="conversational">
                    {{ $t("Convert to Conversational Forms") }}
                </el-dropdown-item>
            </el-dropdown-menu>
        </el-dropdown>

        <el-dialog
            title="Are you sure?"
            :visible.sync="visible"
            :append-to-body="true"
            width="40%"
        >
            <p>
                <b>This process is irreversible.</b>
            </p>

            <p>
                Conversational Forms currently doesn't support the following
                fields:
            </p>

            <el-row :gutter="20">
                <el-col :span="8" v-for="(field, i) in fields" :key="i">
                    <i class="el-icon-caret-right"></i> {{ field }}
                </el-col>
            </el-row>

            <p>
                You may also lose data of these fields.
            </p>

            <span slot="footer" class="text-center dialog-footer">
                <el-button @click="visible = false">
                    Cancel
                </el-button>

                <el-button type="primary" size="small" @click="confirm">
                    Convert
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
                "hCaptcha",
                "Shortcode",
                "Action Hook",
                "Form Step",
                "GDPR Agreement",
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

    methods: {
        handle(command) {
            // this.convert();
            this.visible = !this.visible;
        },

        convert() {
            let data = {
                form_id: this.form_id,
                action: "fluentform-convert-to-conversational"
            };

            FluentFormsGlobal.$post(data)
                .then(response => {
                    this.$notify.success({
                        title: "Success",
                        message: response.data.message,
                        offset: 30
                    });

                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                })
                .fail(error => {
                    if (error.responseJSON.data.message) {
                        this.$notify.error({
                            title: "Error",
                            message: error.responseJSON.data.message,
                            offset: 30
                        });
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
