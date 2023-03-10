<template>
    <div class="ff_section_head" :class="isSize">
        <slot/>
    </div>
</template>

<script>
    export default {
        name: "SectionHead",
        props: ['size'],
        computed: {
            isSize(){
                return this.size ? this.size : null;
            }
        }
    }
</script>
