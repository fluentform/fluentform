<template>
    <withLabel :item="item">
        <el-radio-group class="el-radio-horizontal" v-model="item.settings.default_method">
            <el-radio v-for="(paymentMethod, methodKey) in enabledMethods" :value="methodKey" :key="methodKey">
                {{ paymentMethod.settings.option_label.value }}
            </el-radio>
        </el-radio-group>
    </withLabel>
</template>

<script type="text/babel">
import withLabel from './withLabel.vue';
import filter from 'lodash/filter';

export default {
    name: 'paymentMethodHolder',
    props: ['item'],
    components: {
        withLabel,
    },
    computed: {
        enabledMethods() {
            return filter(this.item.settings.payment_methods, function (item) {
                return item.enabled === 'yes';
            });
        },
    },
};
</script>
