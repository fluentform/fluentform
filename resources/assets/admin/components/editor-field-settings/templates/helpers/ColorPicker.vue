<template>
    <el-color-picker show-alpha @active-change="changeColor" v-model="color"></el-color-picker>
</template>

<script>
export default {
    name: 'ninja_color_picker',
    props: ['value'],
    data() {
        return {
            color: '',
            previous_color: '',
        };
    },
    watch: {
        color(value) {
            if (value === 'transparent') {
                this.color = '';
            }
            this.previous_color = this.color;
            this.$emit('input', this.color);
        },
    },
    methods: {
        changeColor(color) {
            if (this.previous_color === 'transparent') {
                this.previous_color = color;
                this.color = 'transparent';
            } else {
                this.color = color;
            }
        },
    },
    mounted() {
        this.color = this.value;
    },
};
</script>
