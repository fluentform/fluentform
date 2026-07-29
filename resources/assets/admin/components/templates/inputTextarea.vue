<template>
    <withLabel :item="item">
        <div class="ff-textarea-wrapper">
            <div v-if="item.settings.prefix_label" class="ff-textarea-prefix" v-html="item.settings.prefix_label"></div>
            <el-input
                class="ff-textarea-input"
                type="textarea"
                :rows="parseInt(item.attributes.rows)"
                :cols="parseInt(item.attributes.cols)"
                :value="item.attributes.value"
                :placeholder="item.attributes.placeholder">
            </el-input>
            <div v-if="item.settings.suffix_label" class="ff-textarea-suffix" v-html="item.settings.suffix_label"></div>
        </div>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'inputTextarea',
    props: ['item'],
    components: {
        withLabel
    }
}
</script>