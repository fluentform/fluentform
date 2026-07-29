<template>
    <div :class="{'ff_backdrop': visible}">
        <el-dialog
            :title="$t('Rename Form')"
            :visible.sync="visible"
            :before-close="close"
        >

            <h5 slot="title" class="el-dialog__title">
                {{ $t('Rename Form') }}
            </h5>
            <el-form class="mt-4" :model="{}" label-position="top" @submit.native.prevent="rename">
                <el-form-item class="ff-form-item" :label="$t('Form Title')">
                    <el-input class="renameForm" v-model="model" type="text" :placeholder="$t('Awesome Form')"></el-input>
                </el-form-item>
            </el-form>

            <span slot="footer" class="dialog-footer">
                <el-button @click="close" type="info" class="el-button--soft">{{ $t('Cancel') }}</el-button>
                <el-button :loading="loading" type="primary" @click="rename">
                    <span v-if="loading">{{ $t('Renaming Form...') }}</span>
                    <span v-else>{{ $t('Rename') }}</span>
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
                    this.$nextTick(_ => jQuery('.renameForm input').focus());
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
                    title: this.model,
                };

                const url = FluentFormsGlobal.$rest.route('updateForm', window.FluentFormApp.form_id);

                FluentFormsGlobal.$rest.post(url, data)
                    .then((response) => {
                        this.$success(response.message);
                        this.close();
                        this.$emit('rename-success', data.title);
                    })
                    .catch(error => {
                        this.$fail(error.message);
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            }
        }

    }
</script>
