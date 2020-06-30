<template>
    <withLabel :item="item">
        <div style="max-height: 70px;">
            <img :src="item.editor_options.imageUrl" style="max-height: inherit">
        </div>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'imagePlaceholder',
    props: ['item'],
    components: {
        withLabel
    }
}
</script>