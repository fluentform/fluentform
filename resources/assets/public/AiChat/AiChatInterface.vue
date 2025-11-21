<template>
    <div class="ff-ai-chat-interface" :class="interfaceClasses">
        <!-- Header -->
        <div class="ff-ai-chat-header">
            <div class="ff-ai-chat-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="278" height="58" viewBox="0 0 278 58" fill="none">
                <rect width="58" height="58" rx="5.8" fill="white"/>
                <path d="M7.86621 20.6918C7.86621 16.1281 11.5658 12.4285 16.1295 12.4285L48.8625 12.4285C48.8625 16.9922 45.1629 20.6918 40.5992 20.6918H7.86621Z" fill="#089DFF"/>
                <path d="M7.86621 33.5463C7.86621 28.9826 11.5658 25.283 16.1295 25.283H48.8625C48.8625 29.8467 45.1629 33.5463 40.5992 33.5463H7.86621Z" fill="#089DFF"/>
                <path d="M14.2441 46.3993C14.2441 41.8356 17.9438 38.136 22.5075 38.136H41.575C41.575 42.6997 37.8754 46.3993 33.3117 46.3993H14.2441Z" fill="#089DFF"/>
                <path d="M79.9464 15.0159C80.4726 14.9632 80.8739 15.0356 81.1502 15.2331C81.4264 15.4306 81.5645 15.7401 81.5645 16.1614C81.5645 16.9778 81.1172 17.4256 80.2226 17.5045L79.078 17.5835C77.5781 17.6888 76.4597 18.1431 75.7229 18.9464C74.9862 19.7495 74.5521 20.9544 74.4204 22.5608L74.3415 23.6669H78.6438C79.0648 23.6669 79.3872 23.7788 79.6109 24.0026C79.8345 24.2264 79.9464 24.5228 79.9464 24.8915C79.9464 25.2865 79.8279 25.6024 79.591 25.8395C79.3543 26.0765 79.0122 26.1949 78.5649 26.1949H74.1441L72.9205 41.5613C72.8942 42.0616 72.7232 42.4436 72.4075 42.707C72.0917 42.9702 71.7101 43.102 71.2628 43.102C70.8155 43.102 70.4405 42.9702 70.1379 42.707C69.8353 42.4436 69.6972 42.0616 69.7235 41.5613L70.947 26.1949H68.3025C67.8815 26.1949 67.5591 26.083 67.3355 25.8592C67.1118 25.6353 67 25.3391 67 24.9704C67 24.5754 67.1184 24.2594 67.3552 24.0223C67.5921 23.7854 67.9472 23.6669 68.421 23.6669H71.1444L71.1839 22.9558C71.368 20.4013 72.118 18.4855 73.4337 17.2082C74.7494 15.9309 76.6571 15.2134 79.1569 15.0553L79.9464 15.0159Z" fill="white"/>
                <path d="M83.8527 43.1017C83.4054 43.1017 83.037 42.9699 82.7476 42.7067C82.4581 42.4433 82.3265 42.0483 82.3529 41.5215L84.3658 16.3192C84.3921 15.8188 84.5764 15.4436 84.9185 15.1934C85.2606 14.9431 85.6553 14.8181 86.1026 14.8181C86.5499 14.8181 86.9117 14.9431 87.1879 15.1934C87.4643 15.4436 87.5893 15.8188 87.563 16.3192L85.5499 41.5215C85.5236 42.0483 85.3461 42.4433 85.0171 42.7067C84.6882 42.9699 84.3001 43.1017 83.8527 43.1017Z" fill="white"/>
                <path d="M106.786 23.2725C107.26 23.2725 107.635 23.4107 107.911 23.6872C108.188 23.9637 108.299 24.3522 108.247 24.8525L106.905 41.6409C106.879 42.0886 106.701 42.4442 106.372 42.7076C106.043 42.9708 105.655 43.1026 105.208 43.1026C104.76 43.1026 104.405 42.9774 104.142 42.7273C103.879 42.4771 103.76 42.1281 103.787 41.6805L103.944 39.7844C103.287 40.8641 102.405 41.7002 101.3 42.2927C100.195 42.8852 98.9581 43.1816 97.5897 43.1816C95.4584 43.1816 93.8401 42.622 92.7349 41.5027C91.6297 40.3835 91.0771 38.7442 91.0771 36.5847C91.0771 36.1107 91.0902 35.7551 91.1165 35.5181L91.9455 24.8525C91.9981 24.3522 92.1888 23.9637 92.5178 23.6872C92.8467 23.4107 93.2348 23.2725 93.6822 23.2725C94.1558 23.2725 94.5309 23.4107 94.8071 23.6872C95.0834 23.9637 95.1952 24.3522 95.1426 24.8525L94.3137 35.3206C94.2874 35.5049 94.2743 35.7814 94.2743 36.1501C94.2743 39.047 95.6557 40.4954 98.4186 40.4954C100.129 40.4954 101.497 39.9686 102.524 38.9153C103.55 37.8619 104.129 36.4004 104.26 34.5306L105.05 24.8525C105.102 24.3522 105.293 23.9637 105.622 23.6872C105.951 23.4107 106.339 23.2725 106.786 23.2725Z" fill="white"/>
                <path d="M115.192 33.7781V33.9362C115.192 36.0429 115.712 37.6757 116.751 38.8344C117.791 39.9931 119.297 40.5726 121.271 40.5726C123.349 40.5726 125.178 39.9931 126.757 38.8344C127.02 38.6501 127.283 38.5579 127.547 38.5579C127.862 38.5579 128.119 38.6764 128.316 38.9135C128.514 39.1504 128.612 39.4269 128.612 39.743C128.612 40.2171 128.402 40.6515 127.981 41.0465C127.27 41.6786 126.277 42.1922 125.001 42.5872C123.724 42.9822 122.429 43.1797 121.113 43.1797C118.324 43.1797 116.107 42.337 114.462 40.6515C112.817 38.9662 111.995 36.7014 111.995 33.8571C111.995 31.7504 112.383 29.8939 113.16 28.2873C113.936 26.6809 115.041 25.43 116.475 24.5347C117.909 23.6393 119.573 23.1917 121.468 23.1917C124.047 23.1917 126.02 23.9618 127.389 25.5025C128.757 27.043 129.441 29.275 129.441 32.1981C129.441 32.6984 129.31 33.0869 129.046 33.3634C128.783 33.6399 128.428 33.7781 127.981 33.7781H115.192ZM121.587 25.6803C119.823 25.6803 118.416 26.2003 117.363 27.2405C116.311 28.2808 115.64 29.7753 115.35 31.7241H126.56C126.639 29.749 126.237 28.2479 125.356 27.2208C124.474 26.1937 123.218 25.6803 121.587 25.6803Z" fill="white"/>
                <path d="M144.124 23.1917C146.282 23.1917 147.927 23.7579 149.058 24.8903C150.19 26.0227 150.755 27.6685 150.755 29.828C150.755 30.302 150.742 30.6576 150.716 30.8945L149.887 41.5205C149.835 42.0473 149.65 42.4423 149.335 42.7057C149.019 42.969 148.637 43.1007 148.19 43.1007C147.69 43.1007 147.302 42.969 147.025 42.7057C146.749 42.4423 146.637 42.0473 146.69 41.5205L147.519 31.092C147.545 30.9077 147.558 30.6312 147.558 30.2625C147.558 27.3393 146.151 25.8778 143.335 25.8778C141.546 25.8778 140.125 26.4111 139.072 27.4776C138.02 28.5441 137.415 30.0123 137.257 31.882L136.467 41.5205C136.441 42.0473 136.27 42.4423 135.954 42.7057C135.638 42.969 135.244 43.1007 134.77 43.1007C134.296 43.1007 133.921 42.969 133.645 42.7057C133.369 42.4423 133.244 42.0473 133.27 41.5205L134.651 24.7717C134.678 24.2977 134.855 23.929 135.184 23.6656C135.513 23.4023 135.901 23.2706 136.349 23.2706C136.796 23.2706 137.151 23.4023 137.415 23.6656C137.678 23.929 137.796 24.2845 137.77 24.7322L137.612 26.6283C138.27 25.5485 139.164 24.7058 140.296 24.1002C141.427 23.4945 142.703 23.1917 144.124 23.1917Z" fill="white"/>
                <path d="M160.425 35.9516C160.399 36.136 160.386 36.3994 160.386 36.7416C160.386 38.0058 160.675 38.967 161.254 39.6253C161.833 40.2837 162.649 40.6129 163.701 40.6129C164.043 40.6129 164.372 40.5931 164.688 40.5537C165.004 40.5141 165.241 40.4944 165.398 40.4944C165.662 40.4944 165.879 40.5997 166.05 40.8105C166.221 41.0211 166.306 41.3108 166.306 41.6795C166.306 42.2324 166.076 42.621 165.615 42.8448C165.155 43.0686 164.346 43.1806 163.188 43.1806C161.293 43.1806 159.82 42.6407 158.767 41.5609C157.715 40.4812 157.189 38.9538 157.189 36.9787C157.189 36.61 157.202 36.3203 157.228 36.1097L157.978 26.1945H155.373C154.952 26.1945 154.629 26.0826 154.406 25.8588C154.182 25.635 154.07 25.3388 154.07 24.9701C154.07 24.5487 154.195 24.2261 154.445 24.0022C154.695 23.7784 155.044 23.6665 155.491 23.6665H158.175L158.53 19.1632C158.583 18.7155 158.761 18.3535 159.063 18.077C159.366 17.8004 159.754 17.6621 160.228 17.6621C160.728 17.6621 161.116 17.807 161.392 18.0967C161.668 18.3864 161.78 18.7682 161.728 19.2422L161.372 23.6665H165.714C166.109 23.6665 166.425 23.7784 166.661 24.0022C166.898 24.2261 167.017 24.5224 167.017 24.8911C167.017 25.3124 166.898 25.635 166.661 25.8588C166.425 26.0826 166.083 26.1945 165.635 26.1945H161.175L160.425 35.9516Z" fill="white"/>
                <path d="M266.874 28.2648C266.874 28.9276 267.232 29.4579 267.948 29.8556C268.691 30.2268 269.579 30.5582 270.613 30.8499C271.673 31.115 272.734 31.4332 273.795 31.8044C274.855 32.1756 275.743 32.812 276.459 33.7134C277.202 34.5884 277.573 35.702 277.573 37.0542C277.573 38.9633 276.831 40.4613 275.346 41.5484C273.887 42.6355 272.045 43.1791 269.817 43.1791C267.855 43.1791 266.172 42.7681 264.767 41.9461C263.361 41.1242 262.34 39.9841 261.704 38.5258L265.403 36.3781C266.092 38.2872 267.564 39.2417 269.817 39.2417C272.071 39.2417 273.198 38.4993 273.198 37.0145C273.198 36.3781 272.827 35.8611 272.084 35.4634C271.369 35.0657 270.48 34.7342 269.42 34.4691C268.386 34.1774 267.338 33.846 266.278 33.4748C265.217 33.1036 264.316 32.4938 263.573 31.6453C262.857 30.7704 262.5 29.67 262.5 28.3443C262.5 26.5148 263.189 25.0433 264.568 23.9297C265.973 22.8161 267.71 22.2593 269.778 22.2593C271.422 22.2593 272.88 22.6305 274.153 23.3729C275.452 24.0888 276.446 25.0963 277.135 26.3955L273.516 28.4238C272.827 26.9125 271.581 26.1569 269.778 26.1569C268.956 26.1569 268.266 26.3425 267.71 26.7137C267.153 27.0584 266.874 27.5754 266.874 28.2648Z" fill="white"/>
                <path d="M250.904 22.2593C253.157 22.2593 254.974 22.9884 256.352 24.4467C257.731 25.905 258.42 27.867 258.42 30.3329V42.662H254.125V30.6113C254.125 29.2325 253.78 28.172 253.091 27.4296C252.402 26.6606 251.46 26.2762 250.267 26.2762C248.942 26.2762 247.881 26.7137 247.086 27.5886C246.317 28.4636 245.932 29.7761 245.932 31.526V42.662H241.637V30.6113C241.637 29.2325 241.306 28.172 240.643 27.4296C240.006 26.6606 239.092 26.2762 237.898 26.2762C236.599 26.2762 235.539 26.7269 234.717 27.6284C233.895 28.5034 233.484 29.8026 233.484 31.526V42.662H229.188V22.7763H233.484V25.1626C234.756 23.227 236.652 22.2593 239.171 22.2593C241.716 22.2593 243.599 23.3066 244.819 25.4012C246.144 23.3066 248.173 22.2593 250.904 22.2593Z" fill="white"/>
                <path d="M219.89 26.1162C220.977 23.6504 223.019 22.4175 226.015 22.4175V27.0707C224.371 26.9647 222.939 27.3624 221.72 28.2639C220.5 29.1388 219.89 30.5971 219.89 32.6387V42.6611H215.595V22.7754H219.89V26.1162Z" fill="white"/>
                <path d="M201.211 43.1791C198.294 43.1791 195.815 42.1715 193.773 40.1564C191.732 38.1413 190.711 35.6622 190.711 32.7192C190.711 29.7761 191.732 27.297 193.773 25.2819C195.815 23.2668 198.294 22.2593 201.211 22.2593C204.154 22.2593 206.633 23.2668 208.648 25.2819C210.689 27.297 211.71 29.7761 211.71 32.7192C211.71 35.6622 210.689 38.1413 208.648 40.1564C206.633 42.1715 204.154 43.1791 201.211 43.1791ZM196.796 37.2133C197.989 38.4065 199.461 39.003 201.211 39.003C202.961 39.003 204.432 38.4065 205.625 37.2133C206.818 36.0202 207.415 34.5221 207.415 32.7192C207.415 30.9162 206.818 29.4181 205.625 28.225C204.432 27.0318 202.961 26.4353 201.211 26.4353C199.461 26.4353 197.989 27.0318 196.796 28.225C195.603 29.4181 195.006 30.9162 195.006 32.7192C195.006 34.5221 195.603 36.0202 196.796 37.2133Z" fill="white"/>
                <path d="M187.824 19.1957H176.091V26.9909H187.426V31.3657H176.091V42.6608H171.518V14.8208H187.824V19.1957Z" fill="white"/>
              </svg>
                <span>FluentForms AI Assistant</span>
            </div>
            <div class="ff-ai-chat-actions">
                <button
                    class="ff-ai-chat-action-btn"
                    @click="startNewChat"
                    :aria-label="language.newChat || 'New Chat'"
                >
                    New Chat
                </button>
            </div>
        </div>

        <!-- Messages Container -->
        <div v-if="!isMinimized && !isCompleted" class="ff-ai-chat-messages" :class="{ 'ff-ai-chat-messages-centered': messages.length <= 2 }" ref="messagesContainer">
            <ai-chat-message
                v-for="message in messages"
                :key="message.id"
                :message="message"
                @select-option="handleOptionSelect"
            />

            <!-- Loading indicator as a message -->
            <div v-if="isLoading" class="ff-ai-chat-message ff-ai-chat-message-assistant">
                <div class="ff-ai-chat-message-avatar">
                    <!-- FluentForm Icon -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 58 58" fill="none">
                        <rect width="58" height="58" rx="5.8" fill="#089DFF"/>
                        <path d="M7.86621 20.6918C7.86621 16.1281 11.5658 12.4285 16.1295 12.4285L48.8625 12.4285C48.8625 16.9922 45.1629 20.6918 40.5992 20.6918H7.86621Z" fill="white"/>
                        <path d="M7.86621 33.5463C7.86621 28.9826 11.5658 25.283 16.1295 25.283H48.8625C48.8625 29.8467 45.1629 33.5463 40.5992 33.5463H7.86621Z" fill="white"/>
                        <path d="M14.2441 46.3993C14.2441 41.8356 17.9438 38.136 22.5075 38.136H41.575C41.575 42.6997 37.8754 46.3993 33.3117 46.3993H14.2441Z" fill="white"/>
                    </svg>
                </div>
                <div class="ff-ai-chat-message-content">
                    <div class="ff-ai-chat-message-label">AI Assistant</div>
                    <div class="ff-ai-chat-message-bubble">
                        <div class="ff-ai-chat-loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Error message -->
            <div v-if="errorMessage" class="ff-ai-chat-error">
                <div class="ff-ai-chat-error-content">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>{{ errorMessage }}</span>
                </div>
                <button
                    v-if="isSessionError"
                    class="ff-ai-chat-error-action"
                    @click="startNewChat"
                >
                    Start New Chat
                </button>
            </div>
        </div>

        <!-- Progress indicator -->
        <div v-if="!isMinimized && !isCompleted && totalFields > 0" class="ff-ai-chat-progress">
            <div class="ff-ai-chat-progress-bar">
                <div class="ff-ai-chat-progress-fill" :style="{ width: progressPercentage + '%' }"></div>
            </div>
        </div>

        <!-- Input Area -->
        <ai-chat-input
            v-if="!isMinimized && !isCompleted"
            :language="language"
            :disabled="isLoading"
            @send="sendMessage"
        />

        <!-- Completion message -->
        <div v-if="!isMinimized && isCompleted" class="ff-ai-chat-completed">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <h3>{{ language.thankYou || 'Thank You!' }}</h3>
            <p>{{ language.submissionSuccess || 'Your response has been successfully submitted. We appreciate your time!' }}</p>
            <div class="ff-ai-chat-completed-actions">
                <button class="ff-ai-chat-action-btn-primary" @click="startNewChat">
                    {{ language.startNew || 'Start New Chat' }}
                </button>
                <button class="ff-ai-chat-action-btn-secondary" @click="closeChat">
                    {{ language.close || 'Close' }}
                </button>
            </div>
        </div>

        <!-- Footer -->
        <div v-if="!isMinimized" class="ff-ai-chat-footer">
            <p class="ff-ai-chat-footer-text">
                Powered by <a href="https://fluentforms.com" target="_blank">FluentForm</a>
            </p>
        </div>
    </div>
</template>

<script>
import AiChatMessage from './AiChatMessage.vue';
import AiChatInput from './AiChatInput.vue';
import AiChatService from '../../../../src/form/services/AiChatService';

export default {
    name: 'AiChatInterface',
    components: {
        AiChatMessage,
        AiChatInput
    },
    props: {
        formId: {
            type: Number,
            required: true
        },
        formTitle: {
            type: String,
            default: 'Form'
        },
        displayMode: {
            type: String,
            default: 'overlay'
        },
        language: {
            type: Object,
            required: true
        },
        isOpen: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            aiChatService: null,
            messages: [],
            isLoading: false,
            isMinimized: false,
            isCompleted: false,
            errorMessage: '',
            errorType: null, // 'session', 'network', 'validation', etc.
            conversationId: null,
            completedFields: 0,
            totalFields: 0,
            currentFieldDetails: null // Current field with options for quick replies
        };
    },
    created() {
        this.aiChatService = new AiChatService();
    },
    computed: {
        interfaceClasses() {
            return {
                'ff-ai-chat-overlay-mode': this.displayMode === 'overlay',
                'ff-ai-chat-inline-mode': this.displayMode === 'inline',
                'ff-ai-chat-minimized': this.isMinimized
            };
        },
        progressPercentage() {
            if (this.totalFields === 0) return 0;
            return Math.round((this.completedFields / this.totalFields) * 100);
        },
        isSessionError() {
            return this.errorType === 'session' ||
                   (this.errorMessage && (
                       this.errorMessage.toLowerCase().includes('session') ||
                       this.errorMessage.toLowerCase().includes('not found') ||
                       this.errorMessage.toLowerCase().includes('expired')
                   ));
        }
    },
    watch: {
        messages: {
            handler() {
                this.scrollToBottom();
            },
            deep: true
        }
    },
    mounted() {
        this.startConversation();
    },
    methods: {
        scrollToBottom() {
            this.$nextTick(() => {
                if (this.$refs.messagesContainer) {
                    this.$refs.messagesContainer.scrollTop = this.$refs.messagesContainer.scrollHeight;
                }
            });
        },
        addMessage(text, sender = 'user', options = null, validationError = null) {
            this.messages.push({
                id: Date.now() + Math.random(),
                text,
                sender,
                timestamp: new Date(),
                options,
                validationError
            });
            this.scrollToBottom();
        },
        async startConversation() {
            this.isLoading = true;
            this.errorMessage = '';

            try {
                const data = await this.aiChatService.startConversation(this.formId);

                this.conversationId = data.submission_id;
                this.totalFields = data.total_fields || 0;
                this.completedFields = 0; // Start with 0 completed fields

                if (data.message) {
                    this.addMessage(data.message, 'assistant');
                }
            } catch (error) {
                console.error('Error starting conversation:', error);
                this.errorMessage = error.message || this.language.errorOccurred;
            } finally {
                this.isLoading = false;
            }
        },
        async sendMessage(messageText) {
            if (!messageText.trim() || this.isLoading) return;

            // Add user message
            this.addMessage(messageText, 'user');

            this.isLoading = true;
            this.errorMessage = '';

            try {
                const data = await this.aiChatService.sendMessage(this.conversationId, messageText);

                // Store current field details for quick replies
                this.currentFieldDetails = data.current_field_details || null;

                // Add assistant response with options if available
                if (data.message) {
                    const messageData = {
                        text: data.message,
                        options: null,
                        validationError: null
                    };

                    // Add options for choice fields
                    if (this.currentFieldDetails && this.currentFieldDetails.options && this.currentFieldDetails.options.length > 0) {
                        const fieldType = this.currentFieldDetails.type;
                        if (fieldType === 'input_checkbox' || fieldType === 'input_radio' || fieldType === 'select') {
                            messageData.options = this.currentFieldDetails.options;
                        }
                    }

                    // Add validation errors if any
                    if (data.validation_errors && Object.keys(data.validation_errors).length > 0) {
                        const firstError = Object.values(data.validation_errors)[0];
                        messageData.validationError = firstError.error;
                    }

                    this.addMessage(messageData.text, 'assistant', messageData.options, messageData.validationError);
                }

                // Update progress - update both completed and total
                if (data.progress) {
                    this.completedFields = data.progress.completed;
                    // Update total in case it changed (e.g., conditional fields)
                    if (data.progress.total !== undefined) {
                        this.totalFields = data.progress.total;
                    }
                }

                // Check if all fields are completed
                console.log('AI Chat - all_completed:', data.all_completed, 'progress:', data.progress);
                if (data.all_completed) {
                    console.log('AI Chat - Calling completeSubmission()');
                    // Call completion endpoint to finalize submission
                    await this.completeSubmission();
                }
            } catch (error) {
                console.error('Error sending message:', error);
                this.errorMessage = error.message || this.language.errorOccurred;

                // Detect error type
                if (error.message && (
                    error.message.toLowerCase().includes('session') ||
                    error.message.toLowerCase().includes('not found') ||
                    error.message.toLowerCase().includes('expired')
                )) {
                    this.errorType = 'session';
                } else {
                    this.errorType = 'network';
                }
            } finally {
                this.isLoading = false;
            }
        },

        async completeSubmission() {
            try {
                const data = await this.aiChatService.completeSubmission(this.conversationId);

                // Small delay to let the last message settle before showing completion
                setTimeout(() => {
                    // Mark as completed - this will show the completion screen
                    this.isCompleted = true;

                    // Don't add completion message to chat - show completion screen instead
                    // This provides a clear visual break and avoids confusion

                    this.$emit('chat-completed', {
                        conversation_id: this.conversationId,
                        submission_id: data.submission_id
                    });
                }, 500);
            } catch (error) {
                console.error('Error completing submission:', error);

                // Handle validation errors - allow user to fix them
                if (error.errors) {
                    // Update progress if provided (backend resets completed fields)
                    if (error.progress) {
                        this.completedFields = error.progress.completed;
                        if (error.progress.total !== undefined) {
                            this.totalFields = error.progress.total;
                        }
                    }

                    // Format validation errors for display
                    const errorMessages = [];
                    for (const field in error.errors) {
                        const messages = error.errors[field];
                        if (Array.isArray(messages)) {
                            errorMessages.push(...messages);
                        } else if (typeof messages === 'object') {
                            // Handle nested error objects (e.g., {email: "Invalid email"})
                            errorMessages.push(...Object.values(messages));
                        } else {
                            errorMessages.push(messages);
                        }
                    }
                    const errorText = 'I found some issues with your submission: ' + errorMessages.join(', ') + '. Please provide the correct information.';

                    // Add error message to chat so user can fix it
                    this.addMessage(errorText, 'assistant');

                    // Clear error message after showing in chat
                    this.errorMessage = '';

                    // DO NOT mark as completed - allow user to continue conversation
                    // The input field will remain active and progress bar will show updated count
                } else {
                    this.errorMessage = error.message || this.language.errorOccurred;
                }
            }
        },
        toggleMinimize() {
            this.isMinimized = !this.isMinimized;
        },
        closeChat() {
            this.$emit('close');
        },
        startNewChat() {
            // Reset conversation state
            this.messages = [];
            this.conversationId = null;
            this.completedFields = 0;
            this.isCompleted = false;
            this.errorMessage = '';
            this.currentFieldDetails = null;

            // Start a new conversation
            this.startConversation();
        },
        handleOptionSelect(optionLabel) {
            // Send the selected option as a message
            this.sendMessage(optionLabel);
        }
    }
};
</script>

