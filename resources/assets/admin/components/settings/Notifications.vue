<template>
    <div class="ff_notifications_wrapper">
        <div class="ff_card">
            <div class="ff_card_head">
                <div class="ff_card_head_title_group justify-between">
                    <h5 class="title">{{ $t('Email Notifications') }}</h5>
                    <ul class="ff_btn_group">
                        <template v-if="selected">
                            <li>
                                <el-button @click="discard" type="dark" size="medium" icon="el-icon-arrow-left">
                                    {{ $t('Back') }}
                                </el-button>
                            </li>
                            <li>
                                <video-doc btn_size="medium" :btn_text="$t('Learn More')" route_id="conditionalEmailSettings"></video-doc>
                            </li>
                        </template>
                        <template v-else>
                            <li>
                                <el-button @click="add" type="dark" size="medium" icon="el-icon-plus">
                                    {{ $t('Add Notification') }}
                                </el-button>
                            </li>
                            <li>
                                <video-doc btn_size="medium" :btn_text="$t('Learn More')" route_id="formEmailSettings"></video-doc>
                            </li>
                        </template>
                    </ul>
                </div>
            </div><!-- .ff_card_head -->

            <div class="ff_card_body">
                <template v-if="!selected">
                    <div class="ff_table_wrap">
                        <el-table 
                            v-loading="loading"
                            :element-loading-text="$t('Fetching Notifications...')"
                            :data="notifications"
                            class="ff_table"
                        >
                            <el-table-column width="180" :label="$t('Status')">
                                <template slot-scope="scope">
                                    <span class="mr-3" v-if="scope.row.value.enabled">{{$t('Enabled')}}</span>
                                    <span class="mr-3" v-else style="color:#fa3b3c;">{{ $t('Disabled') }}</span>
                                    <el-switch
                                        :width="44"
                                        active-color="#1a7efb" 
                                        @change="handleActive(scope.$index)" 
                                        v-model="scope.row.value.enabled"
                                    ></el-switch>
                                </template>
                            </el-table-column>

                            <el-table-column prop="value.name" :label="$t('Name')"></el-table-column>

                            <el-table-column prop="value.subject" :label="$t('Subject')"></el-table-column>

                            <el-table-column width="130" :label="$t('Actions')" class-name="action-buttons">
                                <template slot-scope="scope">
                                    <ul class="ff_btn_group sm">
                                        <li>
                                            <el-tooltip :content="$t('Duplicate notification settings')" placement="top">
                                                <el-button 
                                                    class="el-button--icon"
                                                    @click="clone(scope.$index)" 
                                                    type="primary" 
                                                    icon="el-icon-plus" 
                                                    size="mini"
                                                ></el-button>
                                            </el-tooltip>
                                        </li>
                                        <li>
                                            <el-button 
                                                class="el-button--icon"
                                                @click="edit(scope.$index)" 
                                                type="success" 
                                                icon="el-icon-setting" 
                                                size="mini"
                                            ></el-button>
                                        </li>
                                        <li>
                                            <remove @on-confirm="remove(scope.$index, scope.row.id)">
                                                <el-button
                                                    class="el-button--icon"
                                                    size="mini"
                                                    type="danger"
                                                    icon="el-icon-delete"
                                                />
                                            </remove>
                                        </li>
                                    </ul>
                                </template>
                            </el-table-column>
                        </el-table>
                    </div><!-- .ff_table_wrap -->

                    <Notice class="mt-6" v-if="!has_fluentsmtp && !smtp_closed">
                        <p class="fs-15">{{ $t('For better email deliverability, we recommend to use FluentSMTP Plugin(completely free & Opensource). FluentSMTP connects with your Email Service Provider natively and makes sure your emails including form notifications are being delivered ') }} 💯. {{ $t('Built by Fluent Forms devs for you.') }}</p>
                        <ul class="ff_btn_group sm">
                            <li>
                                <a class="el-button el-button--danger el-button--small" :href="smtp_page_url">{{ $t('Setup SMTP') }}</a>
                            </li>
                            <li>
                                <a class="el-button el-button--info el-button--small" @click="closeSmtp()">
                                    Close
                                </a>
                            </li>
                        </ul>
                    </Notice>

                </template>

                <!-- Notification Editor -->
                <el-form v-else-if="selected">
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title"> {{ $t('Name') }}</h6>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-input v-model="selected.value.name"></el-input>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                    
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3 is-required">
                            <h6 class="ff_block_title">{{ $t('Send To') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>
                                        {{ $t('Enter the email address you would like the notification email sent to.') }}
                                    </p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-radio-group v-model="selected.value.sendTo.type">
                                <el-radio label="email">{{ $t('Enter Email') }}</el-radio>
                                <el-radio label="field">{{ $t('Select a Field') }}</el-radio>
                                <el-radio v-if="!!has_pro" label="routing">
                                    {{ $t('Configure Routing') }}
                                    <el-tooltip class="item" placement="bottom-start" effect="light">
                                        <div slot="content">
                                            <h3>{{ $t('Routing') }}</h3>

                                            <p>
                                                {{ $t('Allows notification to be sent to different email ') }}<br>
                                                {{ $t('addresses depending on values selected in the form.') }}
                                            </p>
                                        </div>

                                        <i class="el-icon-info el-text-info"></i>
                                    </el-tooltip>
                                </el-radio>
                            </el-radio-group>
                            <error-view field="sendTo.type" :errors="errors"></error-view>

                            <!--additional field based on the send to selection-->
                            <div v-if="selected.value.sendTo.type === 'email'" class="conditional-items mt-4">
                                <div class="ff_block_item" :class="errors.has('sendTo.email') ? 'is-error' : ''">
                                    <div class="ff_block_title_group mb-3">
                                        <h6 class="ff_block_title"> {{ $t('Send to Email') }}</h6>
                                    </div><!-- .ff_block_title_group -->
                                    <div class="ff_block_item_body">
                                        <el-input v-model="selected.value.sendTo.email"></el-input>
                                        <error-view field="sendTo.email" :errors="errors"></error-view>
                                    </div><!-- .ff_block_item_body -->
                                </div><!-- .ff_block_item -->
                            </div>

                            <div v-else-if="selected.value.sendTo.type ==='field'" class="conditional-items mt-4">
                                <div class="ff_block_item" :class="errors.has('sendTo.field') ? 'is-error' : ''">
                                    <div class="ff_block_title_group mb-3">
                                        <h6 class="ff_block_title"> {{ $t('Send to Field') }}</h6>
                                    </div><!-- .ff_block_title_group -->
                                    <div class="ff_block_item_body">
                                        <el-select class="w-100" v-model="selected.value.sendTo.field" :placeholder="$t('Select an email field')">
                                            <el-option
                                                v-for="(item, index) in emailFields"
                                                :key="index"
                                                :label="item.admin_label"
                                                :value="item.attributes.name"
                                            >
                                            </el-option>
                                        </el-select>
                                        <error-view field="sendTo.field" :errors="errors"></error-view>
                                    </div><!-- .ff_block_item_body -->
                                </div><!-- .ff_block_item -->
                            </div>

                            <div class="conditional-items" v-else-if="selected.value.sendTo.type == 'routing'">
                                <routing-filter-fields :fields="inputs" :routings="selected.value.sendTo.routing"></routing-filter-fields>
                                <error-view field="sendTo.routing" :errors="errors"></error-view>
                            </div>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->


                    <!--Subject-->
                    <div class="ff_block_item is-required" :class="errors.has('subject') ? 'is-error' : ''">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title"> {{ $t('Subject') }}</h6>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <input-popover fieldType="text" v-model="selected.value.subject" :data="editorShortcodes"></input-popover>
                            <error-view field="subject" :errors="errors"></error-view>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->

                    <!--message-->
                    <div class="ff_block_item is-required" :class="errors.has('message') ? 'is-error' : ''">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title"> {{ $t('Email Body') }}</h6>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <input-popover 
                                :rows="10" 
                                v-if="selected.value.asPlainText == 'yes'" fieldType="textarea"
                                v-model="selected.value.message"
                                :placeholder="$t('Email Body HTML')"
                                :data="editorShortcodes"
                            ></input-popover>
                            <wp_editor
                                v-else
                                :editorShortcodes="emailBodyeditorShortcodes"
                                :height="300"
                                v-model="selected.value.message">
                            </wp_editor>
                            <error-view field="message" :errors="errors"></error-view>

                            <el-checkbox class="mt-3" true-label="yes" false-label="no" v-model="selected.value.asPlainText">
                                {{ $t('Send Email as RAW HTML Format') }}
                            </el-checkbox>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->

                    <!-- FilterFields -->
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title">{{ $t('Conditional Logics') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>
                                        {{ $t('Allow this feed conditionally') }}
                                    </p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <FilterFields 
                                :fields="inputs" 
                                :conditionals="selected.value.conditionals"
                                v-if="has_pro">
                            </FilterFields>
                            <Notice type="danger-soft" v-else>
                                <el-row class="justify-between items-center" :gutter="10">
                                    <el-col :span="12">
                                        <h6 class="title mb-1">{{$t('Conditional Logics is a Pro feature')}}</h6>
                                        <p class="text fs-14">{{$t('Please upgrade to PRO to unlock the feature.')}}</p>
                                    </el-col>
                                    <el-col :span="12" class="text-right">
                                        <a target="_blank" href="https://fluentforms.com/pricing/?utm_source=plugin&amp;utm_medium=wp_install&amp;utm_campaign=ff_upgrade&amp;theme_style=twentytwentythree" class="el-button el-button--danger el-button--small">
                                            {{$t('Upgrage to Pro')}}
                                        </a>
                                    </el-col>
                                </el-row>
                            </Notice>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->

                    <div class="ff_block_item" v-if="attachmentFields.length && selected.value.attachments">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title">{{ $t('Email Attachments') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>
                                        {{ $t('Select the field that you want to attach in the email') }}
                                    </p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-checkbox-group v-model="selected.value.attachments">
                                <el-checkbox 
                                    v-for="attachmentField in attachmentFields" 
                                    :key="attachmentField.attributes.name"
                                    :label="attachmentField.attributes.name"
                                >
                                    {{attachmentField.admin_label}}
                                </el-checkbox>
                            </el-checkbox-group>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->

                    <!-- Media Attachments -->
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title">{{ $t('Media File Attachments') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>
                                        {{ $t('Add Additional Media File Attachments for the email') }}
                                    </p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-button type="upload"
                                icon="el-icon el-icon-upload"
                                @click="mediaAttachments()"
                            >
                                {{$t('Upload Media')}}
                            </el-button>
                            <div class="mt-4" v-if="selected.value.media_attachments.length">
                                <div
                                    class="ff_file_upload_result" 
                                    v-for="(attachment, index) in selected.value.media_attachments" 
                                    :key="index"
                                >
                                    <div class="ff_file_upload_preview">
                                        <img :src="attachment.url" :alt="attachment.name" />
                                    </div>
                                    <div class="ff_file_upload_data">
                                        <el-button 
                                            class="el-button--icon"
                                            type="danger"
                                            icon="el-icon-delete"
                                            size="mini"
                                            @click="removeMediaAttachments(index)"
                                        ></el-button>
                                        <div class="ff_file_upload_description">
                                            {{attachment.name}}
                                        </div>
                                        <div class="ff_file_upload_size">
                                            {{attachment.size}}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->

                    <div class="ff_block_item" v-if="pdf_feeds.length">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title">{{ $t('PDF Attachments') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>
                                        {{ $t('You can select PDF attachments from your created PDF templates') }}
                                    </p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-checkbox-group v-model="selected.value.pdf_attachments">
                                <el-checkbox v-for="feed in pdf_feeds" :key="feed.id" :label="feed.id">{{ feed.label }}
                                </el-checkbox>
                            </el-checkbox-group>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->

                    <p v-if="hasAttachment" class="text-warning">{{ $t('You should use SMTP so send attachment via email otherwise, It may go to spam') }}</p>

                    <div class="ff_block_item" v-if="hasPaymentField">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title">{{ $t('Send Email') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>
                                        {{ $t('Please Select when the email will be sent for Payment Forms') }}
                                    </p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-radio-group v-model="selected.value.feed_trigger_event">
                                <el-radio label="payment_success">{{ $t('After Payment Success') }}</el-radio>
                                <el-radio label="payment_form_submit">{{ $t('After Form Submit') }}</el-radio>
                            </el-radio-group>
                            <el-alert
                                class="mt-4"
                                :title="$t('Please Note, for offline payment this settings will not work. Pending offline payment form notifications is sent instantly, we will remove this after our next major release, so this settings will also work for offline payments.')"
                                type="warning"
                                :closable="false"
                            ></el-alert>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->

                    <el-collapse class="el-collapse-settings" v-model="activeNotificationCollapse">
                        <el-collapse-item name="advanced">
                            <template slot="title">
                                {{$t('Advanced')}}<i class="header-icon el-icon-info"></i>
                            </template>
                            <!--from name-->
                            <div class="ff_block_item">
                                <div class="ff_block_title_group mb-3">
                                    <h6 class="ff_block_title"> {{ $t('From Name') }}</h6>
                                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                        <div slot="content">
                                            <p>
                                                {{ $t('Enter the name you would like the notification email ') }}
                                            </p>
                                        </div>
                                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                    </el-tooltip>
                                </div><!-- .ff_block_title_group -->
                                <div class="ff_block_item_body">
                                    <input-popover fieldType="text"
                                            v-model="selected.value.fromName"
                                            :data="editorShortcodes"
                                    ></input-popover>
                                    <p v-if="selected.value.fromName"> 
                                        {{$t('It will only be visible in the email if \"From Email\" value is available')}}
                                    </p>
                                </div><!-- .ff_block_item_body -->
                            </div><!-- .ff_block_item -->
                            
                            <!--from email-->
                            <div class="ff_block_item">
                                <div class="ff_block_title_group mb-3">
                                    <h6 class="ff_block_title"> {{ $t('From Email') }}</h6>
                                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                        <div slot="content">
                                            <p>
                                                {{ $t('Enter the email address you would like the notification email sent from, or select the ') }}
                                            </p>
                                        </div>
                                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                    </el-tooltip>
                                </div><!-- .ff_block_title_group -->
                                <div class="ff_block_item_body">
                                   <input-popover fieldType="text"
                                        v-model="selected.value.fromEmail"
                                        :data="fromEmailShortcodes"
                                    ></input-popover>
                                    <p v-if="selected.value.fromEmail">
                                        {{ $t('It\'s not recommended to change from email. Please use your domain\'s email / SMTP main email. Otherwise email may failed to send.')
                                        }}
                                    </p>
                                </div><!-- .ff_block_item_body -->
                            </div><!-- .ff_block_item -->

                            <!--reply to-->
                            <div class="ff_block_item">
                                <div class="ff_block_title_group mb-3">
                                    <h6 class="ff_block_title">{{ $t('Reply To') }}</h6>
                                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                        <div slot="content">
                                            <p>
                                                {{ $t('Enter the email address you would like to be used as the reply to address for the notification email.') }}
                                            </p>
                                        </div>
                                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                    </el-tooltip>
                                </div><!-- .ff_block_title_group -->
                                <div class="ff_block_item_body">
                                   <input-popover fieldType="text"
                                        v-model="selected.value.replyTo"
                                        :data="emailShortcodes"
                                    ></input-popover>
                                </div><!-- .ff_block_item_body -->
                            </div><!-- .ff_block_item -->

                            <!--BCC-->
                            <div class="ff_block_item">
                                <div class="ff_block_title_group mb-3">
                                    <h6 class="ff_block_title">{{$t('BCC')}}</h6>
                                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                        <div slot="content">
                                            <p>
                                                {{ $t('Enter a comma separated list of email addresses you would like to receive a BCC of the notification email.') }}
                                            </p>
                                        </div>
                                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                    </el-tooltip>
                                </div><!-- .ff_block_title_group -->
                                <div class="ff_block_item_body">
                                   <input-popover fieldType="text"
                                        v-model="selected.value.bcc"
                                        :data="emailShortcodes"
                                    ></input-popover>
                                </div><!-- .ff_block_item_body -->
                            </div><!-- .ff_block_item -->

                            <!--CC-->
                            <div class="ff_block_item">
                                <div class="ff_block_title_group mb-3">
                                    <h6 class="ff_block_title">{{$t('CC')}}</h6>
                                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                        <div slot="content">
                                            <p>
                                                {{ $t('Enter a comma separated list of email addresses you would like to receive a CC of the notification email.') }}
                                            </p>
                                        </div>
                                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                    </el-tooltip>
                                </div><!-- .ff_block_title_group -->
                                <div class="ff_block_item_body">
                                   <input-popover fieldType="text"
                                        v-model="selected.value.cc"
                                        :data="emailShortcodes"
                                    ></input-popover>
                                </div><!-- .ff_block_item_body -->
                            </div><!-- .ff_block_item -->

                        </el-collapse-item>

                    </el-collapse>

                    <div>
                        <el-button
                            :loading="loading"
                            @click="store"
                            size="small"
                            type="primary"
                            icon="el-icon-success">
                            {{loading ? $t('Saving ') : $t('Save ')}} {{ $t('Notification') }}
                        </el-button>
                    </div>
                </el-form>
            </div><!--.ff_card_body -->
        </div><!--.ff_card -->
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
            extra_attachment:[],
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
                    attachments: [],
                    media_attachments: [],
                    feed_trigger_event : 'payment_success'

                }
            },
            errors: new Errors,
            // emailShortcodes: [],
            activeNotificationCollapse: '',
            has_fluentsmtp: !!window.FluentFormApp.has_fluent_smtp,
            smtp_page_url: window.FluentFormApp.fluent_smtp_url,
            smtp_closed: false
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
                '{all_data_without_hidden_fields}' : 'All Data Without Hidden Fields'
            };
            return freshCopy;
        },
        hasAttachment(){
            let pdfAttachment = this.selected.value.pdf_attachments && this.selected.value.pdf_attachments.length
            let inputAttachment = this.selected.value.attachments && this.selected.value.attachments.length;
            let fileAttachment = this.selected.value.media_attachments && this.selected.value.media_attachments.length;
            return !!inputAttachment || !!  fileAttachment || !!pdfAttachment;
        },
        hasPaymentField() {
            let inputs = _ff.filter(this.inputs, (input) => {
                return input.element === 'payment_method';
            });
            return !!inputs.length;
        },
    },
    methods: {
        removeMediaAttachments(index){
            this.selected.value.media_attachments.splice(index, 1);
        },
        mediaAttachments(){
            if ( typeof wp !== 'undefined' && wp.media && wp.media.editor) {
                wp.media.editor.send.attachment  = (props, attachment) =>   {
                    if(attachment.url){
                        this.selected.value.media_attachments.push({
                            name: attachment.filename,
                            url: attachment.url,
                            size: attachment.filesizeHumanReadable
                        })
                    }
                    console.log(attachment)
                };
                wp.media.editor.open();
                return false;
            }
        },
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
            if (!freshCopy.value.media_attachments) {
                freshCopy.value.media_attachments = [];
            }
            if (!freshCopy.value.feed_trigger_event) {
                freshCopy.value.feed_trigger_event = 'payment_success';
            }

            this.selected = freshCopy;
            this.selectedIndex = this.notifications.length + 1;
        },
        edit(index) {
            let notification = this.notifications[index];
            if (!notification.value || !notification.value.name || !notification.value.sendTo) {
                this.selected = _ff.cloneDeep(this.mock);
                this.selectedIndex = index;
                return;
            }

            this.selected = notification;

            if (!this.selected.value.attachments) {
                this.$set(this.selected.value, 'attachments', []);
            }
            if (!this.selected.value.media_attachments) {
                this.$set(this.selected.value, 'media_attachments', []);
            }
            if (!this.selected.value.pdf_attachments) {
                this.$set(this.selected.value, 'pdf_attachments', []);
            }
            if (!this.selected.value.feed_trigger_event) {
                this.$set(this.selected.value, 'feed_trigger_event', 'payment_success');
            }

            this.selectedIndex = index;
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

                    this.$success(this.$t('Successfully ' + handle + ' the notification.'));
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
                    this.$success(this.$t('Successfully removed the notification.'));
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

                    this.$success(this.$t('Successfully saved the notification.'));

                    this.selected = null;

                    this.selectedIndex = null;
                })
                .fail(errors => {
                    this.errors.record(errors.responseJSON.data.errors);

                    this.selected.id = id;
                })
                .always(_ => this.loading = false);
        },
        closeSmtp() {
            this.smtp_closed = true;
            if(localStorage) {
                localStorage.setItem('fluentsmtp_closed', 'yes');
            }

        }
    },

    mounted() {
        // Back to all notifications by clicking on menu item
        jQuery('[data-hash="email_notifications"]').on('click', this.discard);
        jQuery('head title').text('Email Notifications - Fluent Forms');
        if(localStorage) {
            this.smtp_closed = !!localStorage.getItem('fluentsmtp_closed');
        }
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
