<template>
    <el-form ref="form-layout">
        <div class="ff_block">
            <div class="ff_card">
                <div class="ff_card_head">
                    <h5 class="title">{{ $t('Global Layout Settings') }}</h5>
                </div>
                <div class="ff_card_body">
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title">{{ $t('Label placement') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>
                                        {{ $t('Select the default label placement. Labels can be top aligned above a field, left aligned to the left of a field, or right aligned to the right of a field. This is a global label placement setting.') }}
                                    </p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-select v-model="layout.labelPlacement" class="ff_input_width">
                                <el-option v-for="(label, value) in labelPlacementOptions" :key="value" :label="label" :value="value"></el-option>
                            </el-select>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                    
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title">{{ $t('Help Message Placement') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>{{ $t('Where help message will be shown') }}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-select v-model="layout.helpMessagePlacement" class="ff_input_width">
                                <el-option
                                    v-for="(label, value) in {'with_label': 'Next to Label', 'under_input': 'Below Input Element'}"
                                    :key="value"
                                    :label="label" 
                                    :value="value"
                                ></el-option>
                            </el-select>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                    
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title"> {{ $t('Error Message Placement') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>{{ $t('Where form validation error messages will be shown') }}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-select v-model="layout.errorMessagePlacement" class="ff_input_width">
                                <el-option
                                    v-for="(label, value) in {'stackToBottom': 'Stack to Bottom', 'inline': 'Below Input Element'}"
                                    :key="value"
                                    :label="label" 
                                    :value="value"
                                ></el-option>
                            </el-select>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                </div>
            </div><!-- .ff_card -->

            <div class="ff_card">
                <div class="ff_card_head">
                    <h5 class="title">{{ $t('Email Summaries') }}</h5>
                    <p class="text" style="max-width: 620px;">{{$t('Would you like to receive a weekly report showing how your forms are performing? Enable Email Summaries option and you will get a report every week to the provided email address')}}</p>
                </div>
                <div class="ff_card_body">
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title">{{ $t('Status') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>{{$t('Determine, If you want to enable / disable email reporting.If enabled, you will email summaries')}}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-checkbox true-label="yes" false-label="no" v-model="email_report.status"> {{$t('Enable Email Summaries Weekly Delivery')}}
                            </el-checkbox>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->

                    <template v-if="email_report.status == 'yes'">
                        <div class="ff_block_item">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title"> {{ $t('Send To') }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                    <div slot="content">
                                        <p> {{ $t('Please specify who will get the email summary report') }}</p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <el-radio-group v-model="email_report.send_to_type">
                                    <el-radio label="admin_email">{{ $t('Site Admin') }}</el-radio>
                                    <el-radio label="custom_email">{{ $t('Custom Email') }}</el-radio>
                                </el-radio-group>
                                <div v-if="email_report.send_to_type == 'custom_email'" class="mt-3">
                                    <label class="ff_form_label">{{ $t('Please recipient email address') }}</label>
                                    <el-input 
                                        :placeholder="$t('Recipient Email Address')"
                                        v-model="email_report.custom_recipients"
                                        class="ff_input_width"
                                    ></el-input>
                                    <p class="mt-1">{{ $t('For Multiple please use comma separated values') }}</p>
                                </div>
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->
                        
                        <div class="ff_block_item">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title">{{ $t('Sending Day') }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                    <div slot="content">
                                        <p>{{ $t('Select which day the email report will be sent') }}</p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <el-select :placeholder="$t('Select Day')" v-model="email_report.sending_day" class="ff_input_width">
                                    <el-option v-for="(sendDay,dayKey) in sending_days" :key="dayKey" :value="dayKey" :label="sendDay"></el-option>
                                </el-select>
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->
                        
                        <div class="ff_block_item">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title">{{ $t('Email Subject') }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                    <div slot="content">
                                        <p>{{ $t('Enter the subject of the email summary') }}</p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                 <el-input
                                    :placeholder="$t('Email Subject')"
                                    v-model="email_report.subject"
                                    class="ff_input_width"
                                />
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->
                    </template>
                </div>
            </div><!-- .ff_card -->

            <div class="ff_card">
                <div class="ff_card_head">
                    <h5 class="title">{{ $t('Integration Failure Email Notification') }}</h5>
                    <p class="text" style="max-width: 700px;">{{$t('Receive an instant email notification when any of your integraion is not running.Enable Integration Failure Notification option and you will get an email when any of your integration fails to run')}}
                    </p>
                </div>
                <div class="ff_card_body">
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title"> {{$t('Status')}}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>{{ $t('Enable Integration Failure Notification if you want recieve a email notification each time any of your integration fails to run.') }}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-checkbox 
                                :disabled="!hasPro" 
                                true-label="yes" 
                                false-label="no" 
                                v-model="integration_failure_notification.status"
                            >
                                {{ $t('Enable Integration Failure Notification') }}
                            </el-checkbox>

                            <p v-if="!hasPro" class="mt-1 text-danger">
                                <i class="el-iocn el-icon-lock mr-1"></i> {{ $t('This is a Pro Feature, Please upgrade to pro to unlock this feature.') }}
                            </p>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->

                    <template v-if="integration_failure_notification.status == 'yes' && hasPro" >
                        <div class="ff_block_item">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title">{{ $t('Send To') }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                    <div slot="content">
                                        <p>{{ $t('Please specify who will get the email notification') }}</p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <el-radio-group v-model="integration_failure_notification.send_to_type">
                                    <el-radio label="admin_email">{{ $t('Site Admin') }}</el-radio>
                                    <el-radio label="custom_email">{{ $t('Custom Email') }}</el-radio>
                                </el-radio-group>
                                <div v-if="integration_failure_notification.send_to_type == 'custom_email'" class="mt-3">
                                    <label class="ff_form_label">{{ $t('Please recipient email address') }}</label>
                                    <el-input 
                                        :placeholder="$t('Recipient Email Address')"
                                        v-model="integration_failure_notification.custom_recipients"
                                        class="ff_input_width"
                                    ></el-input>
                                    <p class="mt-1">{{ $t('For Multiple please use comma separated values') }}</p>
                                </div>
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->
                    </template>
                </div>
            </div><!-- .ff_card -->

            <div class="ff_card">
                <div class="ff_card_head">
                    <h5 class="title">{{ $t('Miscellaneous') }}</h5>
                </div>
                <div class="ff_card_body">
                    <div class="ff_block_item ff_block_item_flex">
                        <div class="ff_block_title_group" style="width: 400px">
                            <h6 class="ff_block_title">{{ $t('Disable IP Logging') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>{{ $t('If this option is turned off then the IP address of the user will be saved in the database with form data.') }}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                           <el-switch :width="48" active-color="#00B27F" v-model="misc.isIpLogingDisabled"></el-switch>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                    
                    <div class="ff_block_item ff_block_item_flex">
                        <div class="ff_block_title_group" style="width: 400px">
                            <h6 class="ff_block_title">{{ $t('Disable Form Analytics') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>{{ $t('By Default, Fluent Forms track unique views and submissions to show form metrices.You can disable it here.') }}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                           <el-switch :width="48" active-color="#00B27F" v-model="misc.isAnalyticsDisabled"></el-switch>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                    
                    <div class="ff_block_item ff_block_item_flex">
                        <div style="width: 400px">
                            <div class="ff_block_title_group mb-1">
                                <h6 class="ff_block_title">{{$t('Enable Honeypot Security') }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                    <div slot="content">
                                        <p>{{ $t('If you enable this then Fluent Forms will verify honeypot security.Most of the time, bots will fail this test.') }}</p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <p>{{ $t('Recommended settings: Enabled') }}</p>
                        </div>
                        <div class="ff_block_item_body">
                            <el-switch :width="48" active-color="#00B27F" active-value="yes" inactive-value="no"
                               v-model="misc.honeypotStatus"></el-switch>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->

                    <template v-if="akismet_available">
                        <div class="ff_block_item ff_block_item_flex">
                            <div style="width: 400px">
                                <div class="ff_block_title_group mb-1">
                                    <h6 class="ff_block_title">{{ $t('Enable Akismet Integration') }}</h6>
                                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                        <div slot="content">
                                            <p>{{ $t('If you enable this then Fluent Forms will verify the form submission with Akismet.It will save you from spam form submission.') }}</p>
                                        </div>
                                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                    </el-tooltip>
                                </div><!-- .ff_block_title_group -->
                                <p>{{ $t('Recommended settings: Enabled') }}</p>
                            </div>
                            <div class="ff_block_item_body">
                                <el-switch :width="48" active-color="#00B27F" active-value="yes" inactive-value="no"
                                    v-model="misc.akismet_status"></el-switch>
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->
                        
                        <div class="ff_block_item" v-if="misc.akismet_status == 'yes'">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title"> {{ $t('Spam Validation') }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                    <div slot="content">
                                        <p>{{ $t('Please select what will be happened once a submission marked as spam') }}</p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <el-radio-group v-model="misc.akismet_validation">
                                    <el-radio label="mark_as_spam">{{ $t('Mark as Spam') }}</el-radio>
                                    <el-radio label="validation_failed">{{ $t('Make the form submission as failed') }}</el-radio>
                                </el-radio-group>
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->
                    </template>

                    <div class="ff_block_item ff_block_item_flex">
                        <div class="ff_block_title_group" style="width: 400px">
                            <h6 class="ff_block_title">{{ $t('Classic Editor Button') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>{{ $t('If you enable this then Classic editor will have form inserter button') }}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-switch :width="48" active-color="#00B27F" active-value="yes" inactive-value="no"
                                v-model="misc.classicEditorButton"></el-switch>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                    
                    <div class="ff_block_item ff_block_item_flex">
                        <div style="width: 400px">
                            <div class="ff_block_title_group mb-1">
                                <h6 class="ff_block_title">{{$t('Enable No - Conflict Mode') }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                    <div slot="content">
                                        <p>{{ $t('If you enable this, then fluent forms will try to prevent other plugin scripts from loading and remove the conflicts.') }}</p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <p>{{ $t('Recommended settings: Enabled') }}</p>
                        </div>
                        <div class="ff_block_item_body">
                            <el-switch :width="48" active-color="#00B27F" active-value="yes" inactive-value="no"
                               v-model="misc.noConflictStatus"></el-switch>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                    
                    <div class="ff_block_item ff_block_item_flex">
                        <div class="ff_block_title_group" style="width: 400px">
                            <h6 class="ff_block_title">{{ $t('Enable Auto Tab - Index') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>{{ $t('If you enable this, then fluent forms will tabindex to form fields automatically') }}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-switch :width="48" active-color="#00B27F" active-value="yes" inactive-value="no"
                               v-model="misc.tabIndex"></el-switch>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                    
                    <div class="ff_block_item" v-if="hasPro">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title">{{ $t('Geo-Location provider') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>{{ $t('If you use advanced phone field and enable auto country ditect then may configure this.') }}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-row :gutter="12">
                                <el-col :span="12">
                                    <el-select v-model="misc.geo_provider" class="w-100">
                                        <el-option
                                            v-for="(provider, providerUrl) in geo_providers"
                                            :key="providerUrl" 
                                            :value="providerUrl"
                                            :label="provider.label"
                                        ></el-option>
                                    </el-select>
                                </el-col>
                                <el-col :span="12">
                                    <template v-if="misc.geo_provider && geo_providers[misc.geo_provider].has_token">
                                        <el-input 
                                            type="password" 
                                            :placeholder="$t('GEO API Token')" 
                                            v-model="misc.geo_provider_token"
                                        ></el-input>
                                    </template>
                                </el-col>
                                <el-col :span="24">
                                    <p class="mt-1">{{geo_providers[misc.geo_provider].token_instruction}}</p>
                                </el-col>
                            </el-row>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                    
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title">{{$t('File Upload Location')}}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>{{ $t('Select where to store uploaded files.') }}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-select :disabled="!hasPro" v-model="misc.file_upload_locations" class="ff_input_width">
                                <el-option
                                    v-for="location in file_upload_optoins"
                                    :key="location.value" 
                                    :value="location.value"
                                    :label="location.label"
                                ></el-option>
                            </el-select>
                            <p v-if="!hasPro" class="mt-2 text-danger">
                               <i class="el-iocn el-icon-lock mr-1"></i> {{ $t('The File Upload Location is not available on free version. Please upgrade to pro to unlock this feature.') }}
                            </p>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                    
                    <div class="ff_block_item_wrap">
                        <div class="ff_block_item ff_block_item_flex">
                            <div style="width: 400px">
                                <div class="ff_block_title_group mb-1">
                                    <h6 class="ff_block_title">{{ $t('Autoload Captcha') }}</h6>
                                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                        <div slot="content">
                                            <p>{{ $t('If you enable this then Fluent Forms will insert captcha in all your forms.') }}</p>
                                        </div>
                                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                    </el-tooltip>
                                </div><!-- .ff_block_title_group -->
                                <p v-if="!hasCaptcha">{{$t('For using captcha, you have to enable captcha first.')}}</p>
                            </div>
                            <div class="ff_block_item_body">
                                <el-switch :width="48" :disabled="!hasCaptcha" active-color="#00B27F" v-model="misc.autoload_captcha"></el-switch>
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->

                        <el-radio-group v-model="misc.captcha_type"  v-if="misc.autoload_captcha">
                            <el-radio :disabled="!captcha_status.recaptcha" label="recaptcha">{{ $t('Google ReCaptcha') }}</el-radio>
                            <el-radio :disabled="!captcha_status.hcaptcha"  label="hcaptcha">{{ $t('hCaptcha') }}</el-radio>
                            <el-radio :disabled="!captcha_status.turnstile"  label="turnstile">{{ $t('Turnstile') }}</el-radio>
                        </el-radio-group>
                    </div><!-- .ff_block_item_wrap -->

                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title">{{ $t('Email Footer Text') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>{{ $t('By Default, Fluent Forms add your site title as email footer.You can add email footer text here.(HTML supported)') }}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                           <el-input
                                type="textarea"
                                :rows="3"
                                :placeholder="$t('Email Footer Text')"
                                v-model="misc.email_footer_text"
                            >
                            </el-input>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                </div><!-- .ff_card_body -->
            </div><!-- .ff_card -->
        </div><!-- .ff_block  -->
    </el-form>
</template>

<script type="text/babel">
    export default {
        name: 'FormLayout',
        props: {
            data: {
                required: true
            },
            email_report: {
                required: true
            },
            integration_failure_notification: {
                required: true
            },
            file_upload_optoins: {
                required: true
            },
            captcha_status: {
                required: true
            }
        },
        data() {
            return {
                labelPlacementOptions: {
                    'top': 'Top aligned',
                    'left': 'Left aligned',
                    'right': 'Right aligned'
                },
                helpMessagePlacementOptions: {
                    'with_label': 'Beside Label as Tooltip',
                    'under_input': 'Below Input Box'
                },
                errorMessagesPlacement: {
                    'inline': 'Show error messages after each input',
                    'stackToBottom': 'Show all error messages after submit button as stack'
                },
                akismet_available: window.FluentFormApp.akismet_activated,
                layout: {},
                misc: {},
                sending_days: {
                    Mon: 'Monday',
                    Tue: 'Tuesday',
                    Wed: 'Wednesday',
                    Thu: 'Thursday',
                    Fri: 'Friday',
                    Sat: 'Saturday',
                    Sun: 'Sunday'
                },
                geo_providers: {
                    'ipinfo.io': {
                        label: 'ipinfo.io',
                        has_token: true,
                        token_instruction: 'If you have much more visitor for your phone field form then you may add an API token. It will work even if you do not use a token'
                    }
                },
                hasPro: !!window.FluentFormApp.has_pro
            }
        },
        computed:{
            hasCaptcha(){
                return !!this.captcha_status.hcaptcha || !!this.captcha_status.recaptcha || !!this.captcha_status.turnstile;
            }
        },
        mounted() {
            this.layout = this.data.layout;

            if (!this.data.misc.akismet_validation) {
                this.$set(this.data.misc, 'akismet_validation', 'mark_as_spam');
            }

            if(!this.data.misc.geo_provider) {
                this.$set(this.data.misc, 'geo_provider', 'ipinfo.io');
            }
            if(!this.data.misc.file_upload_locations) {
                this.$set(this.data.misc, 'file_upload_locations', 'default');
            }

            this.misc = this.data.misc;
        }
    }
</script>

