<template>
    <div>
        <h4>{{ item.editor_options.title }}</h4>
        <p>{{ item.settings.hook_name }}</p>
    </div>
</template>

<script>
export default {
    name: 'action_hook',
    props: ['item'],
};
</script>
