<template>
    <withLabel :item="item">
        <div class="ff_select_wrap">
            <select class="ff_select ff_select_block">
                <option>{{defaultVal || item.settings.placeholder}}</option>
            </select>
        </div>
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
        },
    },
    components: {
        withLabel
    }
}
</script>
