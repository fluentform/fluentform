<template>
    <i class="ff_icon_btn el-icon-plus" :class="[isSize, isType]"></i>
</template>

<script>
export default {
    name: 'ActionBtnAdd',
    props: ['size', 'type'],
    computed: {
        isSize() {
            return this.size ? this.size : 'small';
        },
        isType() {
            return this.type ? this.type : 'info';
        },
    },
};
</script>
