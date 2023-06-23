<template>
    <component :is="isType" class="ff_btn_group_item">
        <slot />
    </component>
</template>

<script>
    export default {
        name: 'BtnGroupItem',
        props: ['as'],
        computed: {
            isType(){
               return this.as ? this.as : 'li';
            }
        }
    }
</script>
