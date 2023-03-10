<template>
    <div class="ff_card" :class="border ? 'ff_card_border' : null">
        <slot />
    </div>
</template>

<script>
    export default {
        name: 'Card',
        props: {
            border: {
                type: Boolean
            }
        }
    }
</script>
