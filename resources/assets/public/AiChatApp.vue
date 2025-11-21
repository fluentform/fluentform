<template>
    <div class="ff-ai-chat-app">
        <!-- AI Chat Interface (Standalone) -->
        <ai-chat-interface
            v-if="formId"
            :form-id="formId"
            :form-title="formTitle"
            :language="language"
            :is-fullscreen="true"
            @chat-completed="onChatCompleted"
        />

        <!-- Loading State -->
        <div v-else class="ff-ai-chat-loading">
            <div class="ff-ai-chat-loading__spinner"></div>
            <p>Loading Chat...</p>
        </div>
    </div>
</template>

<script>
import AiChatInterface from './AiChat/AiChatInterface.vue';

export default {
    name: 'AiChatApp',
    components: {
        AiChatInterface
    },
    data() {
        return {
            formId: 0,
            formTitle: '',
            hasjQuery: typeof window.jQuery === "function"
        }
    },
    computed: {
        language() {
            return {
                aiAssistant: 'AI Assistant',
                you: 'You',
                typeYourMessage: 'Ask me anything...',
                send: 'Send',
                newChat: 'New Chat',
                formCompleted: 'Form completed successfully!',
                close: 'Close',
                errorOccurred: 'An error occurred. Please try again.',
                poweredBy: 'Powered by',
                attachFile: 'Attach file',
                voiceInput: 'Voice input',
            };
        }
    },
    mounted() {
        this.initAiChat();
    },
    methods: {
        initAiChat() {
            // Get form ID from global vars
            if (window.fluentFormVars && window.fluentFormVars.form_id) {
                this.formId = parseInt(window.fluentFormVars.form_id);
                this.formTitle = window.fluentFormVars.form?.title || 'Form';
            } else if (window.fluentFormVars && window.fluentFormVars.form) {
                this.formId = parseInt(window.fluentFormVars.form.id);
                this.formTitle = window.fluentFormVars.form.title || 'Form';
            }
        },

        onChatCompleted(data) {
            console.log('AI Chat completed:', data);

            // Trigger any completion hooks
            if (this.hasjQuery) {
                jQuery(document).trigger('fluentform_ai_chat_completed', [data]);
            }

            // Dispatch custom event
            document.dispatchEvent(new CustomEvent('fluentform_ai_chat_completed', {
                detail: data
            }));
        }
    }
}
</script>

<style lang="scss">
// CSS Variables
:root {
    --ff-ai-primary: #1337ec;
    --ff-ai-bg-light: #f6f6f8;
    --ff-ai-bg-dark: #0d0f17;
    --ff-ai-text-dark: #1a1a1a;
    --ff-ai-text-light: #6b7280;
    --ff-ai-border: #e5e7eb;
    --ff-ai-white: #ffffff;
    --ff-ai-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
    --ff-ai-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
    --ff-ai-radius: 0.75rem;
    --ff-ai-radius-sm: 0.5rem;
    --ff-ai-radius-full: 9999px;
}

.ff-ai-chat-app {
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ff-ai-bg-light);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.ff-ai-chat-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: var(--ff-ai-text-light);

    &__spinner {
        width: 3rem;
        height: 3rem;
        border: 3px solid var(--ff-ai-border);
        border-top-color: var(--ff-ai-primary);
        border-radius: var(--ff-ai-radius-full);
        animation: ff-ai-spin 0.8s linear infinite;
    }

    p {
        margin: 0;
        font-size: 0.875rem;
    }
}

@keyframes ff-ai-spin {
    to {
        transform: rotate(360deg);
    }
}
</style>

