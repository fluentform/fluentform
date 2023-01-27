<template>
    <div class="ff_settings_form" v-loading="!formSettings" :element-loading-text="$t('Loading Settings...')">
        <template v-if="formSettings">
            <div class="ff_card">
                <div class="ff_card_head">
                    <div class="ff_card_head_title_group justify-between">
                        <h5 class="title">{{ $t('Confirmation Settings') }}</h5>
                        <video-doc btn_size="medium" :btn_text="$t('Learn More')" route_id="formConfirmation"/>
                    </div>
                </div><!-- .ff_card_head -->
                <div class="ff_card_body">
                    <el-form>
                        <add-confirmation
                            :pages="pages"
                            :editorShortcodes="editorShortcodes"
                            :confirmation="formSettings.confirmation"
                            :errors="errors">
                        </add-confirmation>
                    </el-form>
                </div><!--.ff_card_body -->
            </div><!-- .ff_card -->

            <!--Double Opt-in settings v-if="double_optin"-->
            <div  class="ff_card">
                <div class="ff_card_head">
                    <h5 class="title">{{ $t('Double Optin Settings') }}</h5>
                </div><!-- .ff_card_head -->
                <div class="ff_card_body">
                    <div class="ff_block_item">
                        <el-checkbox true-label="yes" false-label="no" model="double_optin.status">
                            {{ $t('Enable Double Optin Confirmation before Form Data Processing')}}
                        </el-checkbox>
                    </div><!-- .ff_block_item -->
                    <div class="ff_block_item">
                        <el-form if="double_optin.status == 'yes'" data="double_optin">
                            <div class="ff_block_item">
                                <div class="ff_block_title_group mb-3">
                                    <h6 class="ff_block_title"> {{ $t('Primary Email Field') }}</h6>
                                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                        <div slot="content">
                                            <p>
                                                {{ $t('Select the primary email field from the form fields. In the selected email field, the double optin email will be sent for verification.') }}
                                            </p>
                                        </div>
                                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                    </el-tooltip>
                                </div><!-- .ff_block_title_group -->
                                <div class="ff_block_item_body">
                                     <el-select 
                                        class="ff_input_width" 
                                        model="double_optin.email_field" 
                                        :placeholder="$t('Select an email field')"
                                     >
                                        <!-- <el-option
                                            v-for="(item, index) in emailFields"
                                            :key="index"
                                            :label="item.admin_label"
                                            :value="item.attributes.name">
                                        </el-option> -->
                                    </el-select>
                                </div><!-- .ff_block_item_body -->
                            </div><!-- .ff_block_item -->

                            <template if="double_optin.email_field">
                                <el-form-item>
                                    <template slot="label">
                                        {{ $t('Initial Success Message') }}
                                        <el-tooltip class="item" placement="bottom-start" effect="light">
                                            <div slot="content">
                                                <h3>{{ $t('Initial Success Message') }}</h3>
                                                <p>
                                                    {{ $t('Enter the text you would like the user to ')}}<br>
                                                    {{ $t('see just after initial form submission.') }}
                                                </p>
                                            </div>

                                            <i class="el-icon-info el-text-info"/>
                                        </el-tooltip>
                                    </template>
                                    <wp-editor :height="75" editor-shortcodes="editorShortcodes"
                                            model="double_optin.confirmation_message"/>
                                    <p>{{ $t('This message will be shown after the intial form submission') }}</p>
                                </el-form-item>

                                <el-form-item :label="$t('Email Type')">
                                    <el-radio-group model="double_optin.email_body_type">
                                        <el-radio label="global">{{ $t('As Per Global Settings') }}</el-radio>
                                        <el-radio label="custom">{{ $t('Customized Double Optin Email') }}</el-radio>
                                    </el-radio-group>
                                </el-form-item>

                                <template if="double_optin.email_body_type == 'custom'">
                                    <el-form-item>
                                        <template slot="label">
                                            {{ $t('Optin Email Subject') }}
                                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                                <div slot="content">
                                                    <p>
                                                        {{ $t('Email Subject for double optin email. ') }}<br/>{{ $t('You can use any smart code in the email subject') }}
                                                    </p>
                                                </div>

                                                <i class="el-icon-info el-text-info"/>
                                            </el-tooltip>
                                        </template>
                                        <el-input :placeholder="$t('Email Subject')"
                                                model="double_optin.email_subject"/>
                                    </el-form-item>
                                    <el-form-item>
                                        <template slot="label">
                                            {{ $t('Optin Email Body') }}
                                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                                <div slot="content">
                                                    <h3>{{ $t('Optin Email Body') }}</h3>
                                                    <p>
                                                        {{ $t('Enter the content you would like the user to ')}}<br>
                                                        {{ $t('send via email for confirmation.') }}
                                                    </p>
                                                </div>

                                                <i class="el-icon-info el-text-info"/>
                                            </el-tooltip>
                                        </template>
                                        <input-popover :rows="10" if="double_optin.asPlainText == 'yes'" fieldType="textarea"
                                                    model="double_optin.email_body"
                                                    :placeholder="$t('Double Opt-in Email Body HTML')"
                                                    data="editorShortcodes"
                                        ></input-popover>
                                        <wp-editor 
                                            else :height="150" 
                                            editor-shortcodes="editorShortcodes"
                                            model="double_optin.email_body"
                                        />
                                        <el-checkbox true-label="yes" false-label="no" model="double_optin.asPlainText">
                                            {{ $t('Send Email as RAW HTML Format') }}
                                        </el-checkbox>

                                        <p>{{ $t('Use #confirmation_url# smartcode for double optin confirmation URL') }}</p>
                                    </el-form-item>
                                </template>

                                <div class="form_item">
                                    <el-checkbox true-label="yes" false-label="no" model="double_optin.skip_if_logged_in">
                                        {{ $t('Disable Double Optin for Logged in users') }}
                                    </el-checkbox>
                                </div>

                                <div v-if="hasFluentCRM" class="form_item">
                                    <el-checkbox true-label="yes" false-label="no" model="double_optin.skip_if_fc_subscribed">
                                        {{ $t('Disable Double Optin if contact email is subscribed in ')}}<b>FluentCRM</b>
                                    </el-checkbox>
                                </div>
                            </template>

                        </el-form>
                    </div><!-- .ff_block_item -->
                </div><!-- .ff_card_body -->
                
                <!-- <el-form class="ff_top_50" v-if="double_optin.status == 'yes'" :data="double_optin" label-width="205px"
                         label-position="left">

                    <el-form-item>
                        <template slot="label">
                            {{ $t('Primary Email Field') }}
                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                <div slot="content">
                                    <p>
                                        {{ $t('\Select the primary email field from the form fields.')}} <br/>
                                        {{  $t('In the selected email field, the double optin email will be sent for verification.')}}
                                    </p>
                                </div>

                                <i class="el-icon-info el-text-info"/>
                            </el-tooltip>
                        </template>

                        <el-select v-model="double_optin.email_field" :placeholder="$t('Select an email field')">
                            <el-option
                                v-for="(item, index) in emailFields"
                                :key="index"
                                :label="item.admin_label"
                                :value="item.attributes.name">
                            </el-option>
                        </el-select>

                    </el-form-item>

                    <template v-if="double_optin.email_field">
                        <el-form-item>
                            <template slot="label">
                                {{ $t('Initial Success Message') }}
                                <el-tooltip class="item" placement="bottom-start" effect="light">
                                    <div slot="content">
                                        <h3>{{ $t('Initial Success Message') }}</h3>
                                        <p>
                                            {{ $t('Enter the text you would like the user to ')}}<br>
                                            {{ $t('see just after initial form submission.') }}
                                        </p>
                                    </div>

                                    <i class="el-icon-info el-text-info"/>
                                </el-tooltip>
                            </template>
                            <wp-editor :height="75" :editor-shortcodes="editorShortcodes"
                                       v-model="double_optin.confirmation_message"/>
                            <p>{{ $t('This message will be shown after the intial form submission') }}</p>
                        </el-form-item>

                        <el-form-item :label="$t('Email Type')">
                            <el-radio-group v-model="double_optin.email_body_type">
                                <el-radio label="global">{{ $t('As Per Global Settings') }}</el-radio>
                                <el-radio label="custom">{{ $t('Customized Double Optin Email') }}</el-radio>
                            </el-radio-group>
                        </el-form-item>

                        <template v-if="double_optin.email_body_type == 'custom'">
                            <el-form-item>
                                <template slot="label">
                                    {{ $t('Optin Email Subject') }}
                                    <el-tooltip class="item" placement="bottom-start" effect="light">
                                        <div slot="content">
                                            <p>
                                                {{ $t('Email Subject for double optin email. ') }}<br/>{{ $t('You can use any smart code in the email subject') }}
                                            </p>
                                        </div>

                                        <i class="el-icon-info el-text-info"/>
                                    </el-tooltip>
                                </template>
                                <el-input size="small" :placeholder="$t('Email Subject')"
                                          v-model="double_optin.email_subject"/>
                            </el-form-item>
                            <el-form-item>
                                <template slot="label">
                                    {{ $t('Optin Email Body') }}
                                    <el-tooltip class="item" placement="bottom-start" effect="light">
                                        <div slot="content">
                                            <h3>{{ $t('Optin Email Body') }}</h3>
                                            <p>
                                                {{ $t('Enter the content you would like the user to ')}}<br>
                                                {{ $t('send via email for confirmation.') }}
                                            </p>
                                        </div>

                                        <i class="el-icon-info el-text-info"/>
                                    </el-tooltip>
                                </template>
                                <input-popover :rows="10" v-if="double_optin.asPlainText == 'yes'" fieldType="textarea"
                                               v-model="double_optin.email_body"
                                               :placeholder="$t('Double Opt-in Email Body HTML')"
                                               :data="editorShortcodes"
                                ></input-popover>
                                <wp-editor v-else :height="150" :editor-shortcodes="editorShortcodes"
                                           v-model="double_optin.email_body"/>
                                <el-checkbox style="margin-bottom: 10px;" true-label="yes" false-label="no" v-model="double_optin.asPlainText">
                                    {{ $t('Send Email as RAW HTML Format') }}
                                </el-checkbox>

                                <p>{{ $t('Use #confirmation_url# smartcode for double optin confirmation URL') }}</p>
                            </el-form-item>
                        </template>

                        <div class="form_item">
                            <el-checkbox true-label="yes" false-label="no" v-model="double_optin.skip_if_logged_in">
                                {{ $t('Disable Double Optin for Logged in users') }}
                            </el-checkbox>
                        </div>

                        <div v-if="hasFluentCRM" class="form_item">
                            <el-checkbox true-label="yes" false-label="no" v-model="double_optin.skip_if_fc_subscribed">
                                {{ $t('Disable Double Optin if contact email is subscribed in ')}}<b>FluentCRM</b>
                            </el-checkbox>
                        </div>
                    </template>

                </el-form> -->
            </div><!-- .ff_card -->

            <div class="ff_card">
                <div class="ff_card_head">
                    <div class="ff_card_head_title_group justify-between">
                        <h5 class="title">{{ $t('Form Layout') }}</h5>
                        <video-doc btn_size="medium" :btn_text="$t('Learn More')" route_id="formErrorMessage"/>
                    </div>
                </div><!-- .ff_card_head -->
                <div class="ff_card_body">
                    <el-form>
                        <!--Label placement-->
                        <div class="ff_block_item">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title">{{ $t('Label Alignment') }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                    <div slot="content">
                                        <p>
                                            {{ $t('Select the default label placement.Labels can be top aligned above a field, left aligned to the left of a field, or right aligned to the right of a field.') }}
                                        </p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <el-radio 
                                    v-for="(labelOption, optionName) in labelPlacementOptions"
                                    v-model="formSettings.layout.labelPlacement" 
                                    :label="optionName"
                                    :key="optionName" 
                                    border
                                >
                                    {{ labelOption }}
                                </el-radio>
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->

                        <!--Help Message placement-->
                        <div class="ff_block_item">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title">{{ $t('Help Message Position') }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                    <div slot="content">
                                        <p>
                                            {{ $t('Select the default help message placement. Help messages can be placed beside label as a tooltip, or below each input.') }}
                                        </p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <el-radio 
                                    v-for="(option, optionName) in helpMessagePlacementOptions"
                                    v-model="formSettings.layout.helpMessagePlacement" 
                                    :label="optionName"
                                    :key="optionName" 
                                    border
                                > 
                                    {{ option }}
                                </el-radio>
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->

                        <!--Error Message placement-->
                        <div class="ff_block_item">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title">{{ $t('Error Message Position') }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                    <div slot="content">
                                        <p>
                                            {{ $t('Select the default error message placement. Error messages can be placed below each input, or stacked after the form submit button.') }}
                                        </p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <el-radio 
                                    v-for="(option, optionName) in errorMessagesPlacement"
                                    v-model="formSettings.layout.errorMessagePlacement" 
                                    :label="optionName"
                                    :key="optionName" 
                                    border
                                >
                                    {{ option }}
                                </el-radio>
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->

                        <!--Required asterisk mark position -->
                        <div class="ff_block_item">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title">{{ $t('Asterisk Position') }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                    <div slot="content">
                                        <p>
                                            {{ $t('The asterisk marker position for the required elements.') }}
                                        </p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <el-radio 
                                    v-for="(option, optionName) in asteriskPlacementMock"
                                    v-model="formSettings.layout.asteriskPlacement" 
                                    :label="optionName"
                                    :key="optionName" 
                                    border
                                >
                                    {{ option }}
                                </el-radio>
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->
                    </el-form>
                </div><!--.ff_card_body -->
            </div><!-- .ff_card -->

            <!-- Form Restrictions -->
            <div class="ff_card">
                <div class="ff_card_head">
                    <div class="ff_card_head_title_group justify-between">
                        <h5 class="title">{{ $t('Scheduling & Restrictions') }}</h5>
                        <video-doc btn_size="medium" :btn_text="$t('Learn More')" route_id="formScheduling"></video-doc>
                    </div>
                </div><!-- .ff_card_head -->
                <div class="ff_card_body">
                    <form-restriction :data="formSettings.restrictions"></form-restriction>
                </div><!--.ff_card_body -->
            </div><!-- .ff_card -->

            <div class="ff_card">
                <div class="ff_card_head">
                    <h5 class="title">{{ $t('Advanced Form Validation') }}</h5>
                    <p class="text">
                        {{
                            $t('You can set rules to the user input and based on the rules you can prevent the form submission. This is very useful feature for preventing spam / bot submissions.')
                        }}
                        <a target="_blank" rel="noopener" href="https://wpmanageninja.com/docs/fluent-form/advanced-features-functionalities-in-wp-fluent-form/advanced-form-validation-in-wp-fluent-forms-wordpress-plugin/">
                            {{ $t('Learn More here.')}}
                        </a>
                    </p>
                </div><!-- .ff_card_head -->
                <div class="ff_card_body">
                    <advanced-validation :inputs="inputs" :settings="advancedValidationSettings"></advanced-validation>
                </div><!--.ff_card_body -->
            </div><!--.ff_card -->

            <!-- Survey Result -->
            <div class="ff_card">
                <div class="ff_card_head">
                    <h5 class="title">{{ $t('Survey Result') }}</h5>
                </div><!-- .ff_card_head -->
                <div class="ff_card_body">
                    <survey-result :hasPro="hasPro" :data="formSettings.appendSurveyResult" />
                </div><!--.ff_card_body -->
            </div><!-- .ff_card -->

            <div class="ff_card">
                <div class="ff_card_head">
                    <div class="ff_card_head_title_group">
                        <h5 class="title">{{ $t('Compliance Settings') }}</h5>
                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                            <div slot="content">
                                <p>
                                    {{ $t('If you enable this settings then your entry data will be deleted from database. It\'s useful for HIPPA/GDPR Compliance for some forms.') }}
                                </p>
                            </div>
                            <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                        </el-tooltip>
                    </div>
                </div><!-- .ff_card_head -->
                <div class="ff_card_body">
                    <template v-if="hasPro">
                        <div class="ff_block_item">
                            <el-checkbox
                                true-label="yes" 
                                false-label="no"
                                v-model="formSettings.delete_entry_on_submission"
                            >
                                {{$t('Delete entry data after form submission')}}
                            </el-checkbox>
                            <p v-if="formSettings.delete_entry_on_submission == 'yes'" class="mt-2">
                                {{$t('Your data will be deleted on form submission so no entry data, analytics and visual reporting will be available for this form')}}
                            </p>
                        </div><!--.ff_block_item -->
                        <div class="ff_block_item" v-if="formSettings.delete_entry_on_submission != 'yes'">
                            <div class="ff_auto_delete_section">
                                <el-checkbox
                                    true-label="yes" 
                                    false-label="no"
                                    v-model="formSettings.delete_after_x_days"
                                >
                                    {{ $t('Enable auto delete old entries') }}
                                </el-checkbox>
                                <div class="conditional-items mt-3" v-if="formSettings.delete_after_x_days == 'yes'">
                                    <div class="ff_block_item">
                                        <div class="ff_block_title_group mb-3">
                                            <h6 class="ff_block_title">
                                                {{ $t('Specify how many days old entries will be deleted for this form') }}
                                            </h6>
                                        </div><!-- .ff_block_title_group -->
                                        <div class="ff_block_item_body">
                                            <el-input-number :min="1" v-model="formSettings.auto_delete_days"/>
                                            <p class="text-danger mt-2" v-if="formSettings.auto_delete_days">
                                                {{ $t('Entries older than ') }}
                                                <b class="text-danger">{{formSettings.auto_delete_days}} {{ $t(' days ') }}</b> 
                                                {{ $t('will be deleted automatically.') }}
                                            </p>
                                        </div><!--.ff_block_item_body -->
                                    </div><!--.ff_block_item -->
                                </div>
                            </div>
                        </div><!--.ff_block_item -->
                    </template>

                    <Notice type="danger-soft" v-else>
                        <el-row class="justify-between items-center" :gutter="10">
                            <el-col :span="12">
                                <h6 class="title mb-1">{{$t('Compliance Settings is a Pro feature')}}</h6>
                                <p class="text fs-14">{{$t('Please upgrade to PRO to unlock the feature.')}}</p>
                            </el-col>
                            <el-col :span="12" class="text-right">
                                <a target="_blank" href="https://fluentforms.com/pricing/?utm_source=plugin&amp;utm_medium=wp_install&amp;utm_campaign=ff_upgrade&amp;theme_style=twentytwentythree" class="el-button el-button--danger el-button--small">
                                    {{$t('Upgrage to Pro')}}
                                </a>
                            </el-col>
                        </el-row>
                    </Notice>
                </div><!--.ff_card_body -->
            </div><!--.ff_card -->

            <div class="ff_card">
                <div class="ff_card_head">
                    <div class="ff_card_head_title_group">
                         <h5 class="title">{{ $t('Other') }}</h5>
                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                            <div slot="content">
                                <p>
                                    {{ $t('If you enable this setting than a extra CSS Class will be add to Form.') }}
                                </p>
                            </div>
                            <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                        </el-tooltip>
                    </div>
                </div><!-- .ff_card_head -->
                <div class="ff_card_body">
                    <div class="ff_blcok_item" v-if="hasPro">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title">
                                 {{ $t('Extra CSS Form Class') }}
                            </h6>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-input
                                :placeholder="$t('extra css class')"
                                v-model="formSettings.form_extra_css_class"
                            />
                        </div>
                    </div><!--.ff_block_item -->

                    <Notice type="danger-soft" v-else>
                        <el-row class="justify-between items-center" :gutter="10">
                            <el-col :span="12">
                                <h6 class="title mb-1">{{$t('Extra CSS Form Class is a Pro feature')}}</h6>
                                <p class="text fs-14">{{$t('Please upgrade to PRO to unlock the feature.')}}</p>
                            </el-col>
                            <el-col :span="12" class="text-right">
                                <a target="_blank" href="https://fluentforms.com/pricing/?utm_source=plugin&amp;utm_medium=wp_install&amp;utm_campaign=ff_upgrade&amp;theme_style=twentytwentythree" class="el-button el-button--danger el-button--small">
                                    {{$t('Upgrage to Pro')}}
                                </a>
                            </el-col>
                        </el-row>
                    </Notice>
                </div><!-- .ff_card_body -->
            </div><!--.ff_card -->
            
            <div class="ff_card" v-if="affiliate_wp">
                <div class="ff_card_head">
                    <h5 class="title">{{ $t('Affiliate') }}</h5>
                </div><!-- .ff_card_head -->
                <div class="ff_card_body">
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title">{{$t('Allow referrals')}}</h6>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-checkbox true-label="yes" false-label="no" v-model="affiliate_wp.status">
                                {{$t('Enable')}}
                            </el-checkbox>
                        </div><!--.ff_block_item_body -->
                    </div><!--.ff_block_item -->
                    
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title">{{$t('Allow referrals')}}</h6>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-select v-model="affiliate_wp.selected_type" :placeholder="$t('Select type')">
                                <el-option
                                    v-for="(item, value) in affiliate_wp.types"
                                    :key="value"
                                    :value="value"
                                    :label="item.label"
                                ></el-option>
                            </el-select>
                        </div><!--.ff_block_item_body -->
                    </div><!--.ff_block_item -->
                </div><!--.ff_card_body -->
            </div><!--.ff_card -->

            <div>
                <el-button
                    :loading="loading"
                    type="primary"
                    icon="el-icon-success"
                    @click="saveSettings"
                >
                    {{loading ? $t('Saving ') : $t('Save ')}} {{ $t('Settings') }}
                </el-button>
            </div>
        </template>
    </div>
</template>

<script type="text/babel">
    import wpEditor from '../../../common/_wp_editor';
    import formRestriction from './FormSettings/Restrictions';
    import SurveyResult from './FormSettings/SurveyResult';
    import errorView from '../../../common/errorView';
    import AddConfirmation from './Includes/AddConfirmation.vue'
    import AdvancedValidation from "./Includes/AdvancedValidation";
    import VideoDoc from '@/common/VideoInstruction.vue';
    import inputPopover from '../input-popover.vue';

    export default {
        name: 'FormSettings',
        props: {
            'form': Object,
            'form_id': [Number, String],
            'editor-shortcodes': {
                type: Array,
                default: []
            },
            'inputs': Object
        },
        components: {
            wpEditor,
            'formRestriction': formRestriction,
            errorView,
            AddConfirmation,
            SurveyResult,
            AdvancedValidation,
            VideoDoc,
            inputPopover
        },
        data() {
            return {
                savingSettings: false,
                loading: false,
                redirectToOptions: {
                    samePage: 'Same Page',
                    customPage: 'To a Page',
                    customUrl: 'To a Custom URL'
                },
                labelPlacementOptions: {
                    'top': 'Top',
                    'left': 'Left',
                    'right': 'Right'
                },
                helpMessagePlacementOptions: {
                    'with_label': 'Beside Label (Tooltip)',
                    'under_input': 'Below Input Fields',
                    'on_focus': 'Focus on Element',
                    'after_label': 'Before input'
                },
                errorMessagesPlacement: {
                    'inline': 'Below Input Fields',
                    'stackToBottom': 'Stacked after Form'
                },
                asteriskPlacementMock: {
                    '': 'None',
                    'asterisk-left': 'Left to Label',
                    'asterisk-right': 'Right to Label'
                },
                advancedValidationSettings: {
                    status: false,
                    type: 'all',
                    conditions: [
                        {
                            field: null,
                            operator: '=',
                            value: null
                        }
                    ],
                    error_message: ''
                },
                pages: [],
                formSettings: false,
                isPageLoading: true,
                errors: new Errors,
                delete_entry_on_submission: 'no',
                hasPro: !!window.FluentFormApp.hasPro,
                hasFluentCRM: !!window.FluentFormApp.hasFluentCRM,
                double_optin: false,
                affiliate_wp: false,
            }
        },
        computed: {
            emailFields() {
                return _ff.filter(this.inputs, (input) => {
                    return input.attributes.type === 'email';
                });
            }
        },
        methods: {
            setDefaultSettings() {
                this.formSettings = {
                    confirmation: {
                        redirectTo: 'samePage',
                        messageToShow: 'Thank you for your message. We will get in touch with you shortly',
                        customPage: null,
                        samePageFormBehavior: 'hide_form',
                        customUrl: null,
                    },
                    restrictions: {
                        limitNumberOfEntries: {
                            enabled: false,
                            numberOfEntries: null,
                            period: 'total',
                            limitReachedMsg: 'Maximum number of entries exceeded.',
                        },
                        scheduleForm: {
                            enabled: false,
                            start: null,
                            end: null,
                            pendingMsg: 'Form submission is not started yet.',
                            expiredMsg: 'Form submission is now closed.',
                        },
                        requireLogin: {
                            enabled: false,
                            requireLoginMsg: 'You must be logged in to submit the form.',
                        },
                        denyEmptySubmission: {
                            enabled: false,
                            message: 'Sorry, you cannot submit an empty form. Let\'s hear what you wanna say.'
                        }
                    },
                    layout: {
                        labelPlacement: 'top',
                        asteriskPlacement: 'asterisk-right',
                        helpMessagePlacement: 'with_label',
                        errorMessagePlacement: 'inline',
                        cssClassName: ''
                    }
                }
            },
            fetchSettings() {
                FluentFormsGlobal.$get({
                    action: 'fluentform-settings-general-formSettings',
                    form_id: this.form_id
                })
                    .done(response => {
                        if (response.data.generalSettings) {
                            let settings = response.data.generalSettings;
                            if (!settings.confirmation)
                                settings.confirmation = {};
                            if (!settings.restrictions)
                                settings.restrictions = {};
                            if (!settings.layout)
                                settings.layout = {};

                            if (!settings.restrictions.limitNumberOfEntries)
                                settings.restrictions.limitNumberOfEntries = {};
                            if (!settings.restrictions.scheduleForm)
                                settings.restrictions.scheduleForm = {};
                            if (!settings.restrictions.requireLogin)
                                settings.restrictions.requireLogin = {};

                            if (!settings.restrictions.denyEmptySubmission)
                                settings.restrictions.denyEmptySubmission = {};

                            if (!settings.appendSurveyResult) {
                                settings.appendSurveyResult = {
                                    enabled: false,
                                    showLabel: false,
                                    showCount: false
                                }
                            }

                            this.formSettings = settings;
                        } else {
                            this.setDefaultSettings();
                        }
                        this.advancedValidationSettings = response.data.advancedValidationSettings;

                        this.double_optin = response.data.double_optin;
                        this.affiliate_wp = response.data.affiliate_wp;

                    })
                    .fail(e => {
                        this.setDefaultSettings();
                    })
                    .always(() => {
                    });
            },
            fetchPages() {
                FluentFormsGlobal.$get({
                    action: 'fluentform-get-pages',
                    form_id: this.form_id
                })
                    .then(response => {
                        this.pages = response.data.pages;
                    })
                    .fail(e => {
                        this.loading = false;
                    })
            },
            saveSettings() {
                this.loading = true;
                let data = {
                    form_id: this.form_id,
                    formSettings: JSON.stringify(this.formSettings),
                    advancedValidationSettings: JSON.stringify(this.advancedValidationSettings),
                    double_optin: JSON.stringify(this.double_optin),
                    affiliate_wp: JSON.stringify(this.affiliate_wp),
                    action: 'fluentform-save-settings-general-formSettings'
                };

                FluentFormsGlobal.$post(data)
                    .then(response => {
                        this.$success(response.data.message);
                    })
                    .fail(error => {
                        this.errors.record(error.responseJSON.data.errors);
                    })
                    .always(() => {
                        this.loading = false;
                    });
            },
        },
        mounted() {
            this.fetchSettings();
            this.fetchPages();
            jQuery('head title').text('Confirmation Settings - Fluent Forms');
        },
        beforeCreate() {
            ffSettingsEvents.$emit('change-title', 'Form Settings');
        }
    };
</script>
