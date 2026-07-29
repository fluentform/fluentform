<template>
    <component :is="isType" class="ff_btn_group" :class="isSize">
        <slot/>
    </component>
</template>

<script>
    export default {
        name: 'BtnGroup',
        props: ['size', 'as'],
        computed: {
            isSize(){
                return this.size ? this.size : null;
            },
            isType(){
               return this.as ? this.as : 'ul';
            }
        }
    }
</script>
