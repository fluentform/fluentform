<template>
    <el-form-item v-if="editItem.settings.progress_indicator !== ''">
        <template #label>
            <b>
                <el-label :label="listItem.label" :helpText="listItem.help_text"></el-label>
            </b>
        </template>
        <hr class="mb-3" />

        <div v-for="(number, index) in formStepsCount" class="el-form-item" :key="index">
            <label class="el-form-item__label">{{ $t('Step %d', number) }}</label>
            <div class="el-form-item__content">
                <el-input size="small" v-model="editItem.settings.step_titles[index]" @input="sanitizeStep(index)" @paste="sanitizeStep(index)"></el-input>
            </div>
        </div>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue';

export default {
    name: 'customStepTitles',
    components: {
        elLabel,
    },
    props: ['listItem', 'editItem', 'form_items'],
    computed: {
        formStepsCount() {
            let count = 1;
            _ff.map(this.form_items, field => {
                if (field.editor_options.template === 'formStep') {
                    count++;
                }
            });
            return count;
        },
    },
    methods: {
        sanitizeInput(input) {
            // Decode HTML entities to their actual characters
            input = input.replace(/&gt;/gi, '>').replace(/&lt;/gi, '<').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&apos;/gi, "'");

            // Remove dangerous tags like <script> and <iframe>
            input = input
                .replace(/<script.*?>.*?<\/script>/gis, '') // Remove <script> tags
                .replace(/<iframe.*?>.*?<\/iframe>/gis, ''); // Remove <iframe> tags

            // Remove event handler attributes (onerror, onclick, etc.) from any tag
            input = input.replace(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*\s+on\w+="[^"]*"[^>]*>/gi, '<$1>'); // Remove inline event handlers

            // Remove all event handler attributes (onerror, onclick, etc.) in the form of on<event>
            input = input.replace(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*\s+on[a-zA-Z]+\s*=\s*[^>]*>/gi, '<$1>'); // Catch all event attributes like onerror, onclick, etc.

            // Block javascript links
            input = input.replace(/javascript:/gi, '');

            // Escape all remaining HTML tags except for <br> tags and allow <br> to be rendered
            input = input.replace(/</g, '&lt;').replace(/>/g, '&gt;');

            // Specifically, allow <br> tags and convert \n to <br>
            input = input.replace(/&lt;br\s*\/?&gt;/gi, '<br/>').replace(/\n/g, '<br/>');

            return input;
        },
        sanitizeStep(index) {
            const sanitizedValue = this.sanitizeInput(this.editItem.settings.step_titles[index]);
            this.$set(this.editItem.settings.step_titles, index, sanitizedValue);
        }
    },
}
</script>
