<template>
    <el-dialog
        width="40%"
        :visible.sync="visible"
        :before-close="close"
        :append-to-body="true"
    >
        <div slot="title">
            <h4> {{ $t('Rename Form') }}</h4>
        </div>
        <el-form class="mt-3" :model="{}" label-position="top" @submit.native.prevent="rename">
            <el-form-item :label="$t('Your Form Title')">
                <el-input class="rename_form" v-model="model" type="text" :placeholder="$t('Awesome Form')"></el-input>
            </el-form-item>
        </el-form>
        <div class="dialog-footer text-right">
            <el-button @click="close" type="text" class="el-button--text-light">{{ $t('Cancel') }}</el-button>
            <el-button :loading="loading" type="primary" @click="rename">
                <span v-if="loading">{{ $t('Renaming Form...') }}</span>
                <span v-else>{{ $t('Rename') }}</span>
            </el-button>
        </div>
    </el-dialog>
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
                this.$nextTick( _ => jQuery('.rename_form input').focus());
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
