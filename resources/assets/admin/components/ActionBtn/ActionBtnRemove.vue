<template>
    <i class="ff_icon_btn el-icon-minus" :class="[isSize, isType]" @click="$emit('click')"></i>
</template>

<script>
    export default {
        name: 'ActionBtnRemove',
        props: ['size', 'type'],
        computed: {
            isSize(){
                return this.size ? this.size : 'small';
            },
            isType(){
                return this.type ? this.type : 'info';
            }
        }
    }
</script>
