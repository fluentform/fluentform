<template>
    <div class="ff_card_body" v-show="!isCollapsed">
        <slot />
    </div>
</template>

<script>
    export default {
        name: 'CardBody',
        inject: {
            cardCollapsed: { default: () => () => false }
        },
        computed: {
            isCollapsed() {
                return this.cardCollapsed();
            }
        }
    }
</script>
