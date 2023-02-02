<template>
    <withLabel :item="item">
        <div class="ff_net_promoter_wrap">
            <div class="ff_net_promoter_tags">
                <p>{{item.settings.start_text}}</p>
                <p>{{item.settings.end_text}}</p>
            </div>
            <div class="ff_net_promoter_group">
                <el-button v-for="option in options" :key="option" class="ff_net_promoter_button">{{option}}</el-button>
            </div>
        </div>
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
