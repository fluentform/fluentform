<template>
    <withLabel :item="item">
        <div :class="item.editor_options.container_class" style="max-height: 70px;">
            <img :class="item.editor_options.image_class" :src="item.editor_options.imageUrl"
                 style="max-height: inherit">
        </div>
    </withLabel>
</template>

<script>
import withLabel from "./withLabel.vue";

export default {
    name: "imagePlaceholder",
    props: ["item"],
    components: {
        withLabel
    }
};
</script>
