<template>
    <div class="taxonomy-template">
        <withLabel :item="item">
            <el-form-item>
                <div class="ff_with_arrow">
                    <template v-if="item.taxonomy_settings.hierarchical">
                        <select v-if="isSelectable" class="select el-input__inner">
                            <option>{{item.settings.placeholder || item.attributes.placeholder}}</option>
                        </select>

                        <div v-else>
                            <el-checkbox label="item_1">Item 1</el-checkbox>
                            <el-checkbox label="item_2">Item 2</el-checkbox>
                            <el-checkbox label="item_3">Item 3</el-checkbox>
                        </div>
                    </template>

                    <el-input
                        v-else
                        :type="item.attributes.type"
                        :value="item.attributes.value"
                        :placeholder="item.attributes.placeholder">
                    </el-input>
                </div>
            </el-form-item>
        </withLabel>
    </div>
</template>

<script type="text/babel">

import withLabel from './withLabel.vue';

export default {
    name: 'taxonomy',
    props: ['item', 'value'],
    components: { withLabel },
    data() {
        return {
            // ...
        };
    },
    computed: {
        isSelectable() {
            let type = this.item.settings.field_type;
            return type === 'select_single' || type === 'select_multiple';
        }
    }
};
</script>

