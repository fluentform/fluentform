<template>
    <div class="ff_alert" :class="[isType, isSize]">
        <slot />
    </div>
</template>

<script>
    export default {
        name: "Notice",
        props: ['type', 'size'],
        computed: {
            isType(){
                return this.type ? this.type : null;
            },
            isSize(){
                return this.size ? 'ff_alert_' + this.size : null;
            }
        }
    }
</script>
