<template>
    <div class="ff-ai-chat-message" :class="messageClasses">
        <div class="ff-ai-chat-message-avatar">
            <!-- FluentForm Icon for AI Assistant -->
            <svg v-if="message.sender === 'assistant'" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 58 58" fill="none">
                <rect width="58" height="58" rx="5.8" fill="#089DFF"/>
                <path d="M7.86621 20.6918C7.86621 16.1281 11.5658 12.4285 16.1295 12.4285L48.8625 12.4285C48.8625 16.9922 45.1629 20.6918 40.5992 20.6918H7.86621Z" fill="white"/>
                <path d="M7.86621 33.5463C7.86621 28.9826 11.5658 25.283 16.1295 25.283H48.8625C48.8625 29.8467 45.1629 33.5463 40.5992 33.5463H7.86621Z" fill="white"/>
                <path d="M14.2441 46.3993C14.2441 41.8356 17.9438 38.136 22.5075 38.136H41.575C41.575 42.6997 37.8754 46.3993 33.3117 46.3993H14.2441Z" fill="white"/>
            </svg>
            <!-- User Icon -->
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
        </div>

        <div class="ff-ai-chat-message-content">
            <div class="ff-ai-chat-message-label">
                {{ message.sender === 'assistant' ? 'AI Assistant' : 'You' }}
            </div>
            <div class="ff-ai-chat-message-bubble">
                {{ message.text }}
            </div>

            <!-- Quick reply buttons for choice fields -->
            <div v-if="message.sender === 'assistant' && message.options && message.options.length > 0" class="ff-ai-chat-quick-replies">
                <button
                    v-for="option in message.options"
                    :key="option.value"
                    class="ff-ai-chat-quick-reply-btn"
                    @click="$emit('select-option', option.label)"
                >
                    {{ option.label }}
                </button>
            </div>

            <!-- Validation error display -->
            <div v-if="message.validationError" class="ff-ai-chat-validation-error">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" x2="12" y1="8" y2="12"></line>
                    <line x1="12" x2="12.01" y1="16" y2="16"></line>
                </svg>
                <span>{{ message.validationError }}</span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'AiChatMessage',
    props: {
        message: {
            type: Object,
            required: true,
            validator: (value) => {
                return value.text && value.sender && value.timestamp;
            }
        }
    },
    computed: {
        messageClasses() {
            return {
                'ff-ai-chat-message-user': this.message.sender === 'user',
                'ff-ai-chat-message-assistant': this.message.sender === 'assistant'
            };
        }
    }
};
</script>



