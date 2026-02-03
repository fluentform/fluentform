<template>
    <div class="ff_card_head" :class="{ 'ff_card_head--collapsible': isCollapsible }" @click="handleClick">
        <div v-if="isCollapsible" class="ff_card_head_content">
            <slot />
        </div>
        <slot v-else />
        <span v-if="isCollapsible" class="ff_card_head_chevron" :class="{ 'ff_card_head_chevron--collapsed': isCollapsed }">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </span>
    </div>
</template>

<script>
    export default {
        name: 'CardHead',
        inject: {
            cardCollapsible: { default: () => () => false },
            cardCollapsed: { default: () => () => false },
            toggleCard: { default: () => () => {} }
        },
        computed: {
            isCollapsible() {
                return this.cardCollapsible();
            },
            isCollapsed() {
                return this.cardCollapsed();
            }
        },
        methods: {
            handleClick(e) {
                if (!this.isCollapsible) return;
                if (e.target.closest('button, a, .el-button, .el-switch, input, select, textarea')) return;
                this.toggleCard();
            }
        }
    }
</script>
