<template>
    <div>
        {{ item.settings.shortcode }}
    </div>
</template>

<script>
export default {
    name: 'shortcode',
    props: ['item'],
};
</script>
