<template>
    <component :is="isType" class="ff_tab_item" @click="$emit('click')">
        <slot/>
    </component>
</template>

<script>
    export default {
        name: "TabItem",
        props: ['as'],
        computed: {
            isType(){
               return this.as ? this.as : 'li';
            }
        }
    }
</script>
