<template>
    <div>
        <inputText
            v-model="start_year.value"
            :listItem="{type: start_year.type, label: start_year.label, help_text: start_year.help_text}">
        </inputText>

        <inputText 
            v-model="end_year.value"
            :listItem="{type: end_year.type, label: end_year.label, help_text: end_year.help_text}">
        </inputText>
    </div>
</template>

<script type="text/babel">

import inputText from './inputText.vue';

export default {
    name: 'multiDateYearSettings',
    props: {
        start_year: {
            type: Object,
            required: true
        },
        end_year: {
            type: Object,
            required: true
        }
    },
    components: {
        inputText,
    }
}
</script>

