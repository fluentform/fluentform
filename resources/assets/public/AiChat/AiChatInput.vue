<template>
    <div class="ff-ai-chat-input-wrapper">
        <div class="ff-ai-chat-input-container">
            <form @submit.prevent="handleSubmit" class="ff-ai-chat-input-form">
            <div class="ff-ai-chat-input-actions">
                <button
                    type="button"
                    class="ff-ai-chat-input-action-btn"
                    :aria-label="language.attach || 'Attach file'"
                    @click="handleAttach"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                </button>
                <button
                    type="button"
                    class="ff-ai-chat-input-action-btn"
                    :aria-label="language.voice || 'Voice input'"
                    @click="handleVoice"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                        <line x1="12" x2="12" y1="19" y2="22"/>
                    </svg>
                </button>
            </div>
            <textarea
                ref="inputField"
                v-model="inputText"
                class="ff-ai-chat-input-field"
                :placeholder="language.typeYourMessage"
                :disabled="disabled"
                rows="1"
                @keydown.enter.exact.prevent="handleSubmit"
                @input="autoResize"
            ></textarea>
            <button
                type="submit"
                class="ff-ai-chat-send-btn"
                :disabled="disabled || !inputText.trim()"
                :aria-label="language.send"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="m5 12 7-7 7 7"/>
                    <path d="M12 19V5"/>
                </svg>
            </button>
        </form>
        </div>
    </div>
</template>

<script>
export default {
    name: 'AiChatInput',
    props: {
        language: {
            type: Object,
            required: true
        },
        disabled: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            inputText: ''
        };
    },
    watch: {
        disabled(newVal) {
            if (!newVal) {
                this.$nextTick(() => {
                    if (this.$refs.inputField) {
                        this.$refs.inputField.focus();
                    }
                });
            }
        }
    },
    methods: {
        handleSubmit() {
            if (!this.inputText.trim() || this.disabled) {
                return;
            }

            const message = this.inputText.trim();
            this.inputText = '';
            this.$emit('send', message);

            // Reset textarea height
            this.$nextTick(() => {
                if (this.$refs.inputField) {
                    this.$refs.inputField.style.height = 'auto';
                    this.$refs.inputField.focus();
                }
            });
        },
        autoResize() {
            const textarea = this.$refs.inputField;
            if (textarea) {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            }
        },
        handleAttach() {
            // Placeholder for file attachment feature
            console.log('Attach file clicked');
        },
        handleVoice() {
            // Placeholder for voice input feature
            console.log('Voice input clicked');
        }
    }
};
</script>



