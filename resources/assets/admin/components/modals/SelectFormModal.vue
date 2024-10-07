<template>
    <div :class="{'ff_backdrop': visibility}">
        <el-dialog width="60%" :modal-append-to-body="true" :visible="visibility" :title="$t('Select a Form')" :before-close="close">
            <el-form v-loading="loading" class="text-center" label-position="top" @submit.native.prevent="select">
                <el-form-item :label="$t('Select a form to view it\'s entries')">
                    <template #label>
                        <label>{{ $t('Select a form to view it\'s entries') }}</label>
                    </template>
                    <el-select v-model="formId" :placeholder="$t('Select form')" @change="select">
                        <el-option
                                v-for="form in forms"
                                :key="form.id"
                                :label="'#'+form.id +' - '+ form.title"
                                :value="form.id">
                        </el-option>
                    </el-select>
                </el-form-item>
            </el-form>
        </el-dialog>
    </div>
</template>

<script>
    export default {
        name: 'SelectFormModal',
        props: {
            visibility: Boolean,
            app: Object
        },
        data() {
            return {
                loading: false,
                forms: [],
                formId: null
            }
        },
        methods: {
            close() {
                this.$emit('update:visibility', false);
            },
            select() {
                if (this.formId) {
                    let link = this.app.adminUrl + '&route=entries&form_id=' + this.formId;
                    location.href = link;
                }
            }
        },
        mounted() {
            this.loading = true;
            FluentFormsGlobal.$get({
                action: 'fluentform-get-all-forms',
                fields: ['id', 'title']
            })
                .done(response => {
                    this.forms = response;
                })
                .fail(error => {

                })
                .always(() => {
                    this.loading = false;
                });
        }
    }
</script>
