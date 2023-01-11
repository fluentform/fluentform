<template>
    <div class="ff_form_note_wrap">
        <el-checkbox v-if="item.settings.has_checkbox">
            <span v-html="item.settings.tnc_html"></span>
        </el-checkbox>
        <div v-else class="ff_form_note" v-html="item.settings.tnc_html"></div>
    </div>
</template>

<script>
export default {
    name: 'TNC_Checkbox',
    props: ['item']
}
</script>
