<template>
    <card>
        <card-head>
            <div class="support-header">
                <div class="support-icon">
                    <i class="el-icon-chat-dot-round"></i>
                </div>
                <h4 class="support-title">{{ $t('Fluent Support') }}</h4>
            </div>
        </card-head>

        <card-body>
            <div class="support-form">
            <el-form 
                ref="supportForm" 
                :model="form" 
                :rules="rules" 
                label-position="top"
                @submit.native.prevent="submitTicket"
            >
                <el-form-item class="ff-form-item" :label="$t('Name')" prop="name" required>
                    <el-input
                        v-model="form.name"
                        :placeholder="$t('Your name')"
                        size="medium"
                    />
                </el-form-item>
                
                <el-form-item class="ff-form-item" :label="$t('Email')" prop="email" required>
                    <el-input
                        v-model="form.email"
                        :placeholder="$t('Your mail')"
                        type="email"
                        size="medium"
                    />
                </el-form-item>
                
                <el-form-item class="ff-form-item" :label="$t('Your issue')" prop="message" required>
                    <el-input
                        v-model="form.message"
                        :placeholder="$t('Type here...')"
                        type="textarea"
                        :rows="4"
                        size="medium"
                    />
                </el-form-item>
                
                <el-form-item class="ff-form-item">
                    <el-button 
                        type="primary" 
                        size="medium"
                        :loading="submitting"
                        @click="submitTicket"
                    >
                        {{ $t('Send ticket') }}
                    </el-button>
                </el-form-item>
            </el-form>
        </div>
        </card-body>
    </card>
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";

export default {
    name: 'FluentSupportTicket',
    components: {
        Card,
        CardBody,
        CardHead
    },
    data() {
        return {
            submitting: false,
            form: {
                name: '',
                email: '',
                message: ''
            },
            rules: {
                name: [
                    { required: true, message: this.$t('Please enter your name'), trigger: 'blur' },
                    { min: 2, max: 50, message: this.$t('Name should be 2-50 characters'), trigger: 'blur' }
                ],
                email: [
                    { required: true, message: this.$t('Please enter your email'), trigger: 'blur' },
                    { type: 'email', message: this.$t('Please enter a valid email'), trigger: 'blur' }
                ],
                message: [
                    { required: true, message: this.$t('Please describe your issue'), trigger: 'blur' },
                    { min: 10, max: 1000, message: this.$t('Message should be 10-1000 characters'), trigger: 'blur' }
                ]
            }
        };
    },
    mounted() {
        this.loadUserInfo();
    },
    methods: {
        loadUserInfo() {
            // Pre-fill user information if available
            if (window.FluentFormApp && window.FluentFormApp.user) {
                this.form.name = window.FluentFormApp.user.display_name || '';
                this.form.email = window.FluentFormApp.user.user_email || '';
            }
        },
        
        submitTicket() {
            this.$refs.supportForm.validate((valid) => {
                if (valid) {
                    this.submitting = true;
                    
                    // Simulate API call - replace with actual endpoint
                    this.$http.post('admin/ajax', {
                        action: 'fluentform_submit_support_ticket',
                        data: this.form
                    })
                    .then(response => {
                        this.$message.success(this.$t('Support ticket submitted successfully!'));
                        this.resetForm();
                    })
                    .catch(error => {
                        console.error('Support ticket submission error:', error);
                        this.$message.error(this.$t('Failed to submit support ticket. Please try again.'));
                    })
                    .finally(() => {
                        this.submitting = false;
                    });
                } else {
                    this.$message.error(this.$t('Please fill in all required fields correctly.'));
                }
            });
        },
        
        resetForm() {
            this.$refs.supportForm.resetFields();
            this.loadUserInfo(); // Reload user info after reset
        }
    }
};
</script>
