<template>
    <div :class="{'ff_backdrop': visibility}">
        <el-dialog :visible="visibility" :before-close="close">
            <span slot="title" class="el-dialog__title">
                Add a New Form
            </span>
            <el-form :model="{}" label-position="top" @submit.native.prevent="add">
                <el-form-item label="Your Form Name">
                <el-input class="addNewForm" v-model="form_title" type="text" placeholder="Awesome Form"></el-input>
                </el-form-item>
            </el-form>

            <span slot="footer" class="dialog-footer">
                <el-button @click="close">Cancel</el-button>
                <el-button :loading="loading" type="primary" @click="add">
                    <span v-if="loading">Creating Form...</span>
                    <span v-else>Add Form</span>
                </el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
    export default {
        name: 'AddFormModal',
        props: {
            visibility: Boolean
        },
        data() {
            return {
                loading: false,
                status: 'published',
                templates: {
                    blank: 'Blank Form',
                    contact: 'Contact Form',
                    support: 'Support Form',
                    eventRegistration: 'Event Registration',
                },
                template: '',
                form_title: ''
            }
        },
        methods: {
            close() {
                this.$emit('update:visibility', false);
            },
            add() {
                this.loading = true;
                let data = {
                    action: this.$action.saveForm,
                    type: this.template,
                    title: this.form_title,
                    status: this.status
                };

                jQuery.post(ajaxurl, data)
                    .then((response) => {
                        this.$notify.success({
                            title: 'Congratulations!',
                            message: response.data.message,
                            offset: 30
                        });
                        window.location.href = response.data.redirect_url;
                    })
                    .fail(error => {
                        this.$message.error('Please Provide the form name');
                    })
                    .always(() => {
                        this.loading = false;
                    })
            }
        },
        watch: {
            visibility() {
                if (this.visibility)
                    this.$nextTick( _ => jQuery('.addNewForm input').focus());
            }
        }
    }
</script>

<style>
    small {
        font-weight: normal;
        font-size: 13px;
        margin-left: 15px;
    }
</style>