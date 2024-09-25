<template>
    <el-button type="primary" :class="item.attributes.class" :id="item.attributes.id"
        >{{ item.settings.btn_text }}
    </el-button>
</template>

<script>
export default {
    name: 'buttonSubmit',
    props: ['item'],
};
</script>
