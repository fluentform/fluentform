/**
 * AI Chat Service
 * Handles all API calls to the backend AI Chat endpoints
 */
class AiChatService {
    constructor() {
        this.ajaxUrl = window.ajaxurl || '/wp-admin/admin-ajax.php';
        this.nonce = this.getNonce();
    }

    /**
     * Get nonce from global variable
     */
    getNonce() {
        // Try to get from fluent_forms_global_var (full page form)
        if (window.fluent_forms_global_var && window.fluent_forms_global_var.ai_chat_nonce) {
            return window.fluent_forms_global_var.ai_chat_nonce;
        }

        // Try to get from instance variable (inline form)
        // Check all possible instance variables
        for (let key in window) {
            if (key.startsWith('fluent_forms_global_var_') && window[key].ai_chat_nonce) {
                return window[key].ai_chat_nonce;
            }
        }

        // Fallback - empty string
        console.warn('AI Chat nonce not found. AI Chat may not work properly.');
        return '';
    }

    /**
     * Make AJAX request
     * @param {string} action - WordPress AJAX action
     * @param {object} data - Request data
     * @returns {Promise}
     */
    async request(action, data = {}) {
        const formData = new FormData();
        formData.append('action', action);
        formData.append('_wpnonce', this.nonce);

        // Append all data
        Object.keys(data).forEach(key => {
            if (typeof data[key] === 'object') {
                formData.append(key, JSON.stringify(data[key]));
            } else {
                formData.append(key, data[key]);
            }
        });

        try {
            const response = await fetch(this.ajaxUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (!result.success) {
                // Create error object with all available data
                const error = new Error(result.data?.message || 'Request failed');
                // Attach additional error data (like validation errors, progress)
                if (result.data) {
                    Object.assign(error, result.data);
                }
                throw error;
            }

            return result.data;

        } catch (error) {
            console.error('AI Chat API Error:', error);
            throw error;
        }
    }

    /**
     * Start a new conversation
     * @param {number} formId - Form ID
     * @returns {Promise<object>}
     */
    async startConversation(formId) {
        return await this.request('fluentform_ai_start_conversation', {
            form_id: formId
        });
    }

    /**
     * Send a message in the conversation
     * @param {number} submissionId - Submission ID
     * @param {string} message - User message
     * @returns {Promise<object>}
     */
    async sendMessage(submissionId, message) {
        return await this.request('fluentform_ai_send_message', {
            submission_id: submissionId,
            message: message
        });
    }

    /**
     * Complete the submission
     * @param {number} submissionId - Submission ID
     * @returns {Promise<object>}
     */
    async completeSubmission(submissionId) {
        return await this.request('fluentform_ai_complete_submission', {
            submission_id: submissionId
        });
    }

    /**
     * Get conversation history (if needed)
     * @param {number} submissionId - Submission ID
     * @returns {Promise<object>}
     */
    async getConversationHistory(submissionId) {
        return await this.request('fluentform_ai_get_conversation', {
            submission_id: submissionId
        });
    }
}

// Export for use in Vue components
export default AiChatService;

