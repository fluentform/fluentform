<template>
    <component :is="isType" class="ff_socials">
        <slot/>
    </component>
</template>

<script>
    export default {
        name: "Social",
        props: ['as'],
        computed: {
            isType(){
               return this.as ? this.as : 'ul';
            }
        }
    }
</script>
