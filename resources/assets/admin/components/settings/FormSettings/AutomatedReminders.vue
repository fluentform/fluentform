<template>
    <card>
        <card-head>
            <h5 class="title">{{ $t("Automated Reminder Emails") }}</h5>
            <p
                class="text"
                v-html="$t('Enable Automated Reminder Emails to inform the users of pending submissions from after a time period using cron jobs.')"
            >
            </p>
        </card-head>
        <card-body>
            <el-form label-position="top">
                <el-row :gutter="24">
                    <el-col>
                        <el-checkbox
                            true-label="yes"
                            false-label="no"
                            v-model="settings.enabled"
                        >
                            {{ $t("Enable Automated Reminder Emails for Partial Entries") }}
                        </el-checkbox>
                    </el-col>

                    <el-col v-if="settings.enabled == 'yes'" :sm="24" :md="24">
                        <el-form-item class="ff-form-item">
                            <template slot="label">
                                {{ $t("Reminder Intervals") }}
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                    <div slot="content">
                                        <p>
                                            {{ $t("Select when to send reminder emails after the last update. Each interval will send one reminder. Add multiple intervals to send multiple reminders. Example: [60, 360, 1440] will send 3 reminders at 1 hour, 6 hours, and 1 day. You can add custom intervals by typing in minutes minimum 5 minutes and maximum 1 year which is 525600 minutes.")
                                            }}</p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled text-primary" />
                                </el-tooltip>
                            </template>
                            <el-select
                                v-model="settings.intervals"
                                allow-create
                                filterable
                                default-first-option
                                multiple
                                :placeholder="$t('Select or enter custom interval in minutes')"
                                class="ff_input_width"
                                @change="validateIntervals"
                            >
                                <el-option
                                    v-for="option in intervalOptions"
                                    :key="option.value"
                                    :label="option.label"
                                    :value="option.value"
                                >
                                </el-option>
                            </el-select>
                            <p v-if="intervalError" class="error" style="color: #f56c6c; font-size: 12px; margin-top: 5px;">
                                {{ intervalError }}
                            </p>
                        </el-form-item>

                        <el-form-item class="ff-form-item">
                            <template slot="label">
                                {{ $t("Send Reminder To") }}
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                    <div slot="content">
                                        <p>
                                            {{ $t("Select which email field to use for sending reminders. Resume Link Email is the email used when user sends resume link to themselves.")
                                            }}</p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled text-primary" />
                                </el-tooltip>
                            </template>
                            <el-select
                                v-model="settings.email_field"
                                class="ff_input_width"
                                :placeholder="$t('Select an email field')"
                            >
                                <el-option
                                    :label="$t('Resume Link Email')"
                                    value="_reminder_email"
                                >
                                </el-option>
                                <el-option
                                    v-for="(item, index) in emailFields"
                                    :key="index"
                                    :label="item.admin_label"
                                    :value="item.attributes.name"
                                >
                                </el-option>
                            </el-select>
                        </el-form-item>

                        <el-form-item class="ff-form-item">
                            <template slot="label">
                                {{ $t("Email Subject") }}
                            </template>
                            <el-input
                                v-model="settings.email_subject"
                                :placeholder="$t('Complete your submission for {form_name}')"
                            />
                        </el-form-item>

                        <el-form-item class="ff-form-item">
                            <template slot="label">
                                {{ $t("Email Body") }}
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                    <div slot="content">
                                        <p>{{ $t("Available shortcodes: {form_name}, {resume_link}, {entry_id}") }}</p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled text-primary" />
                                </el-tooltip>
                            </template>
                            <wp-editor
                                :height="150"
                                v-model="settings.email_body"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
        </card-body>
    </card>
</template>

<script>
import Card from "@/admin/components/Card/Card.vue";
import CardHead from "@/admin/components/Card/CardHead.vue";
import CardBody from "@/admin/components/Card/CardBody.vue";
import wpEditor from '@/common/_wp_editor';

export default {
    name: "AutomatedReminders",
    components: {
        Card,
        CardHead,
        CardBody,
        wpEditor
    },
    props: {
        settings: {
            type: Object,
            required: true
        },
        emailFields: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            intervalOptions: [
                { value: 5, label: "5 minutes" },
                { value: 10, label: "10 minutes" },
                { value: 30, label: "30 minutes" },
                { value: 60, label: "1 hour (60 min)" },
                { value: 360, label: "6 hours (360 min)" },
                { value: 720, label: "12 hours (720 min)" },
                { value: 1440, label: "1 day (1440 min)" },
                { value: 4320, label: "3 days (4320 min)" },
                { value: 10080, label: "1 week (10080 min)" },
                { value: 43200, label: "1 month (43200 min)" }
            ],
            intervalError: ''
        };
    },
    methods: {
        validateIntervals() {
            const minInterval = 5;
            const maxInterval = 525600;

            this.intervalError = '';

            this.settings.intervals = this.settings.intervals.filter(interval => {
                const value = parseInt(interval);

                if (isNaN(value)) {
                    this.intervalError = this.$t('Please enter valid numbers only');
                    return false;
                }

                if (value < minInterval) {
                    this.intervalError = this.$t('Intervals must be at least 5 minutes (cron runs every 5 minutes)');
                    return false;
                }

                if (value > maxInterval) {
                    this.intervalError = this.$t('Intervals cannot exceed 525600 minutes (1 year)');
                    return false;
                }

                return true;
            });

            this.settings.intervals.sort((a, b) => parseInt(a) - parseInt(b));
        }
    }
};
</script>
