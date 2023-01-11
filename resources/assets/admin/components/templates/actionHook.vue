<template>
<div class="ff_action_hook">
    <h4 class="mb-2">{{ item.editor_options.title }}</h4>
    <p>{{ item.settings.hook_name }}</p>
</div>
</template>

<script>
export default {
    name: 'action_hook',
    props: ['item']
}
</script>