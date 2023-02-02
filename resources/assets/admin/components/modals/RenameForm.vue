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

    }
}
</script>
