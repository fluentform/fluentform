<template>
    <div class="ff_card" :class="cardClasses" v-on:click="$emit('click')">
        <div v-if="img" class="ff_card_img" :class="imgClass">
            <img :src="img" alt="">
        </div>
        <slot />
    </div>
</template>

<script>
    export default {
        name: 'Card',
        props: {
            border: {
                type: Boolean
            },
            img: {
                type: String
            },
            imgClass: {
                type: String
            },
            collapsible: {
                type: Boolean,
                default: false
            },
            defaultCollapsed: {
                type: Boolean,
                default: false
            }
        },
        data() {
            return {
                isCollapsed: this.defaultCollapsed
            }
        },
        computed: {
            cardClasses() {
                return {
                    'ff_card_border': this.border,
                    'ff_card--collapsible': this.collapsible,
                    'ff_card--collapsed': this.collapsible && this.isCollapsed
                }
            }
        },
        provide() {
            return {
                cardCollapsible: () => this.collapsible,
                cardCollapsed: () => this.isCollapsed,
                toggleCard: this.toggle
            }
        },
        methods: {
            toggle() {
                if (this.collapsible) {
                    this.isCollapsed = !this.isCollapsed;
                }
            }
        }
    }
</script>
