<template>
    <div>
        <inputText :listItem="listItem" v-model="editItem.settings.hook_name"></inputText>

        <p>
            {{
                $t('An option for developers to add dynamic elements they want. It provides the chance to add whatever input type you want to add in this form. This way, you can bind your own functions to render the form to this action hook.You\'ll be given 1 parameter to play with: $form.')
            }}
        </p>

        <pre style="overflow-x: scroll;">
        add_action('{{ editItem.settings.hook_name || 'HOOK_NAME' }}',
        '{{ editItem.settings.hook_name || 'ff_cutom_callback' }}_callback',
        10, 1 );
        function {{ editItem.settings.hook_name || 'ff_cutom_callback' }}_callback( $form) {
            // do what ever you want
        }</pre>

    </div>
</template>

<script>
import inputText from './inputText.vue'

export default {
    name: 'customHookName',
    props: ['listItem', 'editItem'],
    components: {
        'inputText': inputText
    }
}
</script>