<template>
    <div :class="{'ff_backdrop': visible}">
        <el-dialog
            title="Rename Form"
            :visible.sync="visible"
            :before-close="close">

            <span slot="title" class="el-dialog__title">
                Rename Form
            </span>
            <el-form :model="{}" style="margin: -20px 0;" label-position="top" @submit.native.prevent="rename">
                <el-form-item label="Your Form Title">
                <el-input class="renameForm" v-model="model" type="text" placeholder="Awesome Form"></el-input>
                </el-form-item>
            </el-form>

            <span slot="footer" class="dialog-footer">
                <el-button size="small" @click="close">Cancel</el-button>
                <el-button size="small" :loading="loading" type="primary" @click="rename">
                    <span v-if="loading">Renaming Form...</span>
                    <span v-else>Rename</span>
                </el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
export default {
    name: 'RenameModal',
    props: ['visible', 'formTitle'],
    data() {
        return {
            loading: false,
            model: this.formTitle
        }
    },
    watch: {
        visible() {
            if (this.visible) {
                this.model = this.formTitle;
                this.$nextTick( _ => jQuery('.renameForm input').focus());
            }
        }
    },
    methods: {
        close() {
            this.$emit('update:visible', false);
        },

        rename() {
            this.loading = true;
            
            let data = {
                action: 'fluentform-form-update',
                title: this.model,
                formId: window.FluentFormApp.form_id
            };

            FluentFormsGlobal.$post(data)
                .then((response) => {
                    this.$notify.success({
                        title: 'Success!',
                        message: response.message,
                        offset: 30
                    });
                    this.close();
                    this.$emit('rename-success', data.title);
                })
                .fail(error => {
                    this.$message.error('Please Provide the form name');
                })
                .always(() => {
                    this.loading = false;
                });
        }
    }

}
</script>
