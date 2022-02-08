<template>
    <el-dropdown v-if="!is_conversion_form" @command="handle">
        <span class="el-dropdown-link">
            <i class="el-icon-s-operation"></i>
        </span>

        <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="conversational">
                Convert to Conversational Form
            </el-dropdown-item>
        </el-dropdown-menu>
    </el-dropdown>
</template>

<script>
export default {
    name: "MoreMenu",

    data() {
        return {
            form_id: window.FluentFormApp.form_id
        };
    },

    methods: {
        handle(command) {
            this.convert();
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
                })
        }
    }
};
</script>
