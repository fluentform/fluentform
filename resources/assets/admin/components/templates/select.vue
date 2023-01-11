<template>
    <withLabel :item="item">
        <el-select class="el-select-block" :placeholder="item.settings.placeholder">
            <el-option :value="defaultVal"></el-option>
        </el-select>
    </withLabel>
</template>

<script type="text/babel">
import withLabel from './withLabel.vue';
import find from 'lodash/find';

export default {
    name: 'customSelect',
    props: ['item'],
    computed :{
        defaultVal() {
            let option = find(this.item.settings.advanced_options, { value: this.item.attributes.value });

            return option ? option.label : null;
        }
    },
    components: {
        withLabel
    }
}
</script>
