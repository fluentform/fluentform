<template>
    <component :is="isType">
        <a :href="href" target="_blank" rel="nofollow">
            <span :class="`dashicons dashicons-${icon}`"></span>
        </a>
    </component>
</template>

<script>
    export default {
        name: "SocialItem",
        props: ['as', 'href', 'icon'],
        computed: {
            isType(){
               return this.as ? this.as : 'li';
            }
        }
    }
</script>
