<template>
    <withLabel :item="item">
        <div class="ff-el-net-promoter-tags">
            <p>{{item.settings.start_text}}</p>
            <p>{{item.settings.end_text}}</p>
        </div>
        <span v-for="option in options" :key="option">
            <el-button class="net-promoter-button">{{option}}</el-button>
        </span>
    </withLabel>
</template>

<script type="text/babel">
import withLabel from './withLabel.vue';
import range from 'lodash/range';

export default {
    name: 'net-promoter',
    props: ['item'],
    components: {
        withLabel
    },
    computed: {
        options() {
            return range(this.item.settings.start_number, this.item.settings.end_number + 1, 1);
        }
    }
}
</script>
