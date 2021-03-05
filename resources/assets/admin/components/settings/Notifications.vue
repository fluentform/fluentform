<template>
    <div>
        <el-row class="setting_header">
            <el-col :md="12">
                <h2>Email Notifications</h2>
            </el-col>

            <!--Save settings-->
            <el-col :md="12" class="action-buttons clearfix mb15 text-right">
                <template v-if="selected">
                    <el-button @click="discard"
                               icon="el-icon-arrow-left"
                               size="small"
                    >
                        Back
                    </el-button>
                    <video-doc route_id="conditionalEmailSettings"></video-doc>
                </template>
                <template v-else>
                    <el-button @click="add" type="primary"
                               size="small" icon="el-icon-plus"
                    >Add Notification
                    </el-button>
                    <video-doc route_id="formEmailSettings"></video-doc>
                </template>
            </el-col>
        </el-row>

        <!-- Notification Table: 1 -->
        <el-table v-loading="loading"
                  element-loading-text="Fetching Notifications..."
                  v-if="!selected"
                  :data="notifications"
                  stripe
                  class="el-fluid">

            <el-table-column width="80">
                <template slot-scope="scope">
                    <el-switch active-color="#13ce66" @change="handleActive(scope.$index)"
                               v-model="scope.row.value.enabled"
                    ></el-switch>
                </template>
            </el-table-column>

            <el-table-column width="100" label="Status">
                <template slot-scope="scope">
                    <span v-if="scope.row.value.enabled">Enabled</span>
                    <span v-else style="color:#fa3b3c;">Disabled</span>
                </template>
            </el-table-column>

            <el-table-column prop="value.name" label="Name"></el-table-column>

            <el-table-column prop="value.subject" label="Subject"></el-table-column>

            <el-table-column width="160" label="Actions" class-name="action-buttons">
                <template slot-scope="scope">
                    <el-tooltip class="item" effect="light" content="Duplicate notification settings" placement="top">
                        <el-button @click="clone(scope.$index)" type="success"
                                   icon="el-icon-plus" size="mini"
                        ></el-button>
                    </el-tooltip>

                    <el-button @click="edit(scope.$index)" type="primary"
                               icon="el-icon-setting" size="mini"
                    ></el-button>

                    <remove @on-confirm="remove(scope.$index, scope.row.id)"></remove>
                </template>
            </el-table-column>
        </el-table>

        <!-- Notification Editor -->
        <el-form v-else-if="selected" label-width="205px" label-position="left">

            <!--Notification name-->
            <el-form-item label="Name">
                <el-input v-model="selected.value.name"></el-input>
            </el-form-item>

            <!--send to-->
            <el-form-item class="is-required" :class="errors.has('sendTo.type') ? 'is-error' : ''">
                <template slot="label">
                    Send To

                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>Send To Email Address</h3>

                            <p>
                                Enter the email address you would like <br>
                                the notification email sent to.
                            </p>
                        </div>

                        <i class="el-icon-info el-text-info"></i>
                    </el-tooltip>
                </template>

                <el-radio-group v-model="selected.value.sendTo.type">
                    <el-radio label="email">Enter Email</el-radio>
                    <el-radio label="field">Select a Field</el-radio>
                    <el-radio v-if="!!has_pro" label="routing">
                        Configure Routing
                        <el-tooltip class="item" placement="bottom-start" effect="light">
                            <div slot="content">
                                <h3>Routing</h3>

                                <p>
                                    Allows notification to be sent to different email <br>
                                    addresses depending on values selected in the form.
                                </p>
                            </div>

                            <i class="el-icon-info el-text-info"></i>
                        </el-tooltip>
                    </el-radio>
                </el-radio-group>

                <error-view field="sendTo.type" :errors="errors"></error-view>
            </el-form-item>

            <!--additional field based on the send to selection-->
            <template v-if="selected.value.sendTo.type === 'email'">
                <el-form-item label="Send to Email" class="conditional-items"
                              :class="errors.has('sendTo.email') ? 'is-error' : ''"
                >
                    <el-input v-model="selected.value.sendTo.email"></el-input>

                    <error-view field="sendTo.email" :errors="errors"></error-view>
                </el-form-item>
            </template>

            <template v-else-if="selected.value.sendTo.type ==='field'">
                <el-form-item label="Send to Field" class="conditional-items"
                              :class="errors.has('sendTo.field') ? 'is-error' : ''"
                >
                    <el-select v-model="selected.value.sendTo.field" placeholder="Select an email field">
                        <el-option
                            v-for="(item, index) in emailFields"
                            :key="index"
                            :label="item.admin_label"
                            :value="item.attributes.name">
                        </el-option>
                    </el-select>

                    <error-view field="sendTo.field" :errors="errors"></error-view>
                </el-form-item>
            </template>

            <div class="conditional-items" v-else-if="selected.value.sendTo.type == 'routing'">
                <routing-filter-fields :fields="inputs"
                                       :routings="selected.value.sendTo.routing"></routing-filter-fields>
                <error-view field="sendTo.routing" :errors="errors"></error-view>
            </div>

            <!--Subject-->
            <el-form-item label="Subject" class="is-required" :class="errors.has('subject') ? 'is-error' : ''">

                <input-popover fieldType="text"
                               v-model="selected.value.subject"
                               :data="editorShortcodes"
                ></input-popover>

                <error-view field="subject" :errors="errors"></error-view>
            </el-form-item>

            <!--message-->
            <el-form-item label="Email Body" class="is-required" :class="errors.has('message') ? 'is-error' : ''">
                <wp_editor
                    :editorShortcodes="emailBodyeditorShortcodes"
                    :height="300"
                    v-model="selected.value.message">
                </wp_editor>
                <error-view field="message" :errors="errors"></error-view>
            </el-form-item>

            <!-- FilterFields -->
            <el-form-item>
                <template slot="label">
                    Conditional Logics

                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>Conditional Logic</h3>
                            <p>
                                Allow this feed conditionally
                            </p>
                        </div>

                        <i class="el-icon-info el-text-info"></i>
                    </el-tooltip>
                </template>
                <FilterFields :fields="inputs" :conditionals="selected.value.conditionals"
                              :disabled="!has_pro"></FilterFields>
            </el-form-item>

            <el-form-item v-if="attachmentFields.length">
                <template slot="label">
                    Email Attachments
                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>Email Attachments</h3>
                            <p>
                                Select the field that you want to attach in the email
                            </p>
                        </div>
                        <i class="el-icon-info el-text-info"></i>
                    </el-tooltip>
                </template>

                <el-checkbox-group v-model="selected.value.attachments">
                    <el-checkbox v-for="attachmentField in attachmentFields" :key="attachmentField.attributes.name"
                                 :label="attachmentField.attributes.name">{{ attachmentField.admin_label }}
                    </el-checkbox>
                </el-checkbox-group>

                <p v-if="selected.value.attachments && selected.value.attachments.length">You should use SMTP so send
                    attachment via email otherwise, It may go to spam</p>
            </el-form-item>

            <el-form-item v-if="pdf_feeds.length">
                <template slot="label">
                    PDF Attachments
                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>PDF Attachments</h3>
                            <p>
                                You can select PDF attachments from your created PDF templates
                            </p>
                        </div>
                        <i class="el-icon-info el-text-info"></i>
                    </el-tooltip>
                </template>

                <el-checkbox-group v-model="selected.value.pdf_attachments">
                    <el-checkbox v-for="feed in pdf_feeds" :key="feed.id" :label="feed.id">{{ feed.label }}
                    </el-checkbox>
                </el-checkbox-group>

                <p v-if="selected.value.pdf_attachments && selected.value.pdf_attachments.length">You should use SMTP so
                    send attachment via email otherwise, It may go to spam</p>
            </el-form-item>

            <el-checkbox true-label="yes" false-label="no" v-model="selected.value.asPlainText">Send Email as Classic Template
            </el-checkbox>

            <p><br/></p>
            <el-collapse class="el-collapse-settings" v-model="activeNotificationCollapse">
                <el-collapse-item title="Advanced" name="advanced">
                    <!--from name-->
                    <el-form-item>
                        <template slot="label">
                            From Name

                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                <div slot="content">
                                    <h3>From Name</h3>

                                    <p>
                                        Enter the name you would like the notification email <br>
                                        sent from, or select the name from available name fields.
                                    </p>
                                </div>

                                <i class="el-icon-info el-text-info"></i>
                            </el-tooltip>
                        </template>

                        <input-popover fieldType="text"
                                       v-model="selected.value.fromName"
                                       :data="editorShortcodes"
                        ></input-popover>
                        <p v-if="selected.value.fromName">It will only be visible in the email if "From Email" value is
                            available </p>
                    </el-form-item>

                    <!--from email-->
                    <el-form-item>
                        <template slot="label">
                            From Email

                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                <div slot="content">
                                    <h3>From Email Address</h3>
                                    <p>
                                        Enter the email address you would like the <br>
                                        notification email sent from, or select the <br>
                                        email from available email form fields.
                                    </p>
                                </div>
                                <i class="el-icon-info el-text-info"></i>
                            </el-tooltip>
                        </template>

                        <input-popover fieldType="text"
                                       v-model="selected.value.fromEmail"
                                       :data="fromEmailShortcodes"
                        ></input-popover>
                        <p v-if="selected.value.fromEmail">It's not recommended to change from email. Please use your
                            domain's email / SMTP main email. Otherwise email may failed to send.</p>
                    </el-form-item>

                    <!--reply to-->
                    <el-form-item>
                        <template slot="label">
                            Reply To

                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                <div slot="content">
                                    <h3>Reply To</h3>

                                    <p>
                                        Enter the email address you would like to be <br>
                                        used as the reply to address for the notification email.
                                    </p>
                                </div>

                                <i class="el-icon-info el-text-info"></i>
                            </el-tooltip>
                        </template>

                        <input-popover fieldType="text"
                                       v-model="selected.value.replyTo"
                                       :data="emailShortcodes"
                        ></input-popover>
                    </el-form-item>

                    <!--BCC-->
                    <el-form-item>
                        <template slot="label">
                            BCC

                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                <div slot="content">
                                    <h3>Blind Carbon Copy Addresses</h3>

                                    <p>
                                        Enter a comma separated list of email addresses <br>
                                        you would like to receive a BCC of the notification email.
                                    </p>
                                </div>

                                <i class="el-icon-info el-text-info"></i>
                            </el-tooltip>
                        </template>
                        <input-popover fieldType="text"
                                       v-model="selected.value.bcc"
                                       :data="emailShortcodes"
                        ></input-popover>
                    </el-form-item>
                    <!--CC-->
                    <el-form-item>
                        <template slot="label">
                            CC

                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                <div slot="content">
                                    <h3>Carbon Copy Addresses</h3>

                                    <p>
                                        Enter a comma separated list of email addresses <br>
                                        you would like to receive a CC of the notification email.
                                    </p>
                                </div>

                                <i class="el-icon-info el-text-info"></i>
                            </el-tooltip>
                        </template>

                        <input-popover fieldType="text"
                                       v-model="selected.value.cc"
                                       :data="emailShortcodes"
                        ></input-popover>
                    </el-form-item>
                </el-collapse-item>

            </el-collapse>


            <div class="text-right">
                <el-button
                    :loading="loading"
                    @click="store"
                    size="medium"
                    type="success"
                    icon="el-icon-success">
                    {{ loading ? 'Saving' : 'Save' }} Notification
                </el-button>
            </div>

        </el-form>
    </div>
</template>

<script type="text/babel">
import remove from '../confirmRemove.vue';
import inputPopover from '../input-popover.vue';
import wpEditor from '../../../common/_wp_editor';
import FilterFields from './Includes/FilterFields.vue';
import RoutingFilterFields from './Includes/RoutingFilterFields';
import ErrorView from '../../../common/errorView.vue';
import VideoDoc from '@/common/VideoInstruction.vue';

export default {
    name: 'EmailNotifications',
    props: ['form_id', 'inputs', 'has_pro', 'has_pdf', 'editorShortcodes'],
    components: {
        remove,
        inputPopover,
        FilterFields,
        ErrorView,
        'wp_editor': wpEditor,
        RoutingFilterFields,
        VideoDoc
    },
    data() {
        return {
            loading: true,
            selected: null,
            selectedIndex: null,
            notifications: [],
            pdf_feeds: [],
            mock: {
                value: {
                    name: 'New Notification',
                    sendTo: {
                        type: 'email',
                        email: null,
                        field: null,
                        routing: [
                            {
                                input_value: '',
                                field: null,
                                operator: '=',
                                value: null
                            }
                        ],
                    },
                    fromName: '',
                    fromEmail: '',
                    replyTo: '',
                    bcc: '',
                    subject: '',
                    message: '',
                    conditionals: {
                        status: false,
                        type: 'all',
                        conditions: [
                            {
                                field: null,
                                operator: '=',
                                value: null
                            }
                        ]
                    },
                    enabled: true,
                    pdf_attachments: [],
                    attachments: []
                }
            },
            errors: new Errors,
            // emailShortcodes: [],
            activeNotificationCollapse: ''
        }
    },
    computed: {
        emailFields() {
            return _ff.filter(this.inputs, (input) => {
                return input.attributes.type === 'email';
            });
        },

        attachmentFields() {
            return _ff.filter(this.inputs, (input) => {
                return input.attributes && input.attributes.type === 'file';
            });
        },

        emailShortcodes() {
            const inputEmails = {
                title: 'Input Emails',
                shortcodes: {}
            };
            _ff.each(this.inputs, (input, key) => {
                const code = `{inputs.${key}}`;
                if (input.attributes.type === 'email') {
                    inputEmails.shortcodes[code] = input.admin_label;
                }
            });

            return [inputEmails];
        },

        fromEmailShortcodes() {
            const freshCopy = _ff.cloneDeep(this.emailShortcodes);
            freshCopy[0].shortcodes = {
                '{admin_email}': 'Admin Email',
                ...freshCopy[0].shortcodes
            };
            return freshCopy;
        },
        emailBodyeditorShortcodes() {
            const freshCopy = _ff.cloneDeep(this.editorShortcodes);
            freshCopy[0].shortcodes = {
                ...freshCopy[0].shortcodes,
                '{all_data}': 'All Data',
            };
            return freshCopy;
        }
    },
    methods: {
        add() {
            this.selectedIndex = this.notifications.length;
            this.selected = _ff.cloneDeep(this.mock);
        },
        clone(index) {
            let freshCopy = _ff.cloneDeep(this.notifications[index]);

            freshCopy.value.name = null;
            freshCopy.id = null;

            if (!freshCopy.value.conditionals
                || !freshCopy.value.conditionals.conditions
                || !freshCopy.value.conditionals.conditions.length
            ) {
                freshCopy.value.conditionals = this.mock.value.conditionals;
            }

            if (!freshCopy.value.pdf_attachments) {
                freshCopy.value.pdf_attachments = [];
            }

            if (!freshCopy.value.attachments) {
                freshCopy.value.attachments = [];
            }

            this.selected = freshCopy;
            this.selectedIndex = index + 1;
        },
        edit(index) {
            this.selectedIndex = index;

            let notification = this.notifications[index];

            if (!notification.value || !notification.value.name || !notification.value.sendTo) {
                this.selected = _ff.cloneDeep(this.mock);
                return;
            }

            if (!notification.value.attachments) {
                notification.value.attachments = [];
            }

            if (!notification.value.pdf_attachments) {
                notification.value.pdf_attachments = [];
            }

            this.selected = notification;
        },
        discard() {
            this.selected = null;
            this.selectedIndex = null;
            this.errors.clear();
        },
        handleActive(index) {
            let notification = this.notifications[index];

            let id = notification.id;

            delete (notification.id);

            let data = {
                form_id: this.form_id,
                meta_key: 'notifications',
                value: JSON.stringify(notification.value),
                id,
                action: 'fluentform-settings-formSettings-store'
            };

            FluentFormsGlobal.$post(data)
                .done(response => {
                    notification.id = response.data.id;

                    let handle = notification.value.enabled ? 'enabled' : 'disabled';

                    this.$notify.success({
                        title: 'Success',
                        message: 'Successfully ' + handle + ' the notification.',
                        offset: 30
                    });
                })
                .fail(e => {
                    notification.id = id;
                });
        },
        remove(index, id) {
            FluentFormsGlobal.$post({
                action: 'fluentform-settings-formSettings-remove',
                id,
                form_id: this.form_id
            })
                .done(response => {
                    this.notifications.splice(index, 1);
                    this.$notify.success({
                        title: 'Success',
                        message: 'Successfully removed the notification.',
                        offset: 30
                    });
                })
                .fail(e => {
                });
        },
        fetchNotifications() {
            let data = {
                form_id: this.form_id,
                meta_key: 'notifications',
                is_multiple: true,
                action: 'fluentform-settings-formSettings'
            };

            FluentFormsGlobal.$get(data)
                .then(response => {
                    this.notifications = response.data.result;
                })
                .fail(e => {
                })
                .always(_ => {
                    this.loading = false;
                });
        },
        fetchEmailTemplates() {
            FluentFormsGlobal.$get({
                action: 'fluentform_pdf_admin_ajax_actions',
                form_id: window.FluentFormApp.form_id,
                route: 'feed_lists'
            })
                .then(response => {
                    this.pdf_feeds = response.data.pdf_feeds;
                })
                .fail(error => console.log(error));
        },
        store() {
            this.loading = true;
            this.errors.clear();

            let id = this.selected.id;

            delete (this.selected.id);

            let data = {
                form_id: this.form_id,
                meta_key: 'notifications',
                value: JSON.stringify(this.selected.value),
                id,
                action: 'fluentform-settings-formSettings-store'
            };

            FluentFormsGlobal.$post(data)
                .done(response => {
                    this.selected.id = response.data.id;

                    this.notifications.splice(this.selectedIndex, 1, this.selected);

                    this.$notify.success({
                        title: 'Success',
                        message: 'Successfully saved the notification.',
                        offset: 30
                    });

                    this.selected = null;

                    this.selectedIndex = null;
                })
                .fail(errors => {
                    this.errors.record(errors.responseJSON.data.errors);

                    this.selected.id = id;
                })
                .always(_ => this.loading = false);
        },
    },

    mounted() {
        // Back to all notifications by clicking on menu item
        jQuery('[data-hash="email_notifications"]').on('click', this.discard);
        jQuery('head title').text('Email Notifications - Fluent Forms');
    },
    beforeMount() {
        this.fetchNotifications();
        this.has_pdf && this.fetchEmailTemplates();
    },
    beforeCreate() {
        ffSettingsEvents.$emit('change-title', 'Email Notification Settings');
    }
};
</script>
