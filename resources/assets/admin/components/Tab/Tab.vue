<template>
    <component :is="isType" class="ff_tab">
        <slot/>
    </component>
</template>

<script>
    export default {
        name: "Tab",
        props: ['as'],
        computed: {
            isType(){
               return this.as ? this.as : 'ul';
            }
        }
    }
</script>
