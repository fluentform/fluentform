<template>
    <div class="ff-control-content">
        <div class="ff-control-field">
            <label class="ff-control-title">
                {{ $t(item.label) }}
            </label>
            <div class="ff-control-input-wrapper">
                <el-color-picker size="mini" @active-change="handleChange" show-alpha v-model="item.value"></el-color-picker>
            </div>
        </div>
    </div>
</template>
<script type="text/babel">
    export default {
        name: 'ff_color_picker',
        props: ['item'],
        methods: {
            handleChange(val) {
                this.item.value = val;
            }
        }
    }
</script>