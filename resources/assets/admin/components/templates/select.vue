<template>
    <withLabel :item="item">
        <div class="ff_with_arrow">
            <select class="select el-input__inner">
                <option>{{item.settings.placeholder || item.attributes.placeholder}}</option>
            </select>
        </div>
    </withLabel>
</template>

<script type="text/babel">
import withLabel from './withLabel.vue';

export default {
    name: 'customSelect',
    props: ['item'],
    components: {
        withLabel
    }
}
</script>

<style>
    .el-form-item .select {
        width: 100%;
        height: 35px !important;
        min-width: 100%;
    }
</style>