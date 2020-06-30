<template>
    <div>
        <el-checkbox v-if="item.settings.has_checkbox">
            <span v-html="item.settings.tnc_html"></span>
        </el-checkbox>
        <div v-else class="el-checkbox">
            <div class="el-checkbox__label" v-html="item.settings.tnc_html"></div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'TNC_Checkbox',
    props: ['item']
}
</script>