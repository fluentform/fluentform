<template>
<div>
    <strong>value:</strong> {{ item.attributes.value || 'empty' }} | <strong>name:</strong> {{ item.attributes.name }}
</div>
</template>

<script>
export default {
    name: 'inputHidden',
    props: ['item']
}
</script>