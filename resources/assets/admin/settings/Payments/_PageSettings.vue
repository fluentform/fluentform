<template>
    <div class="ff_pay_page_settings">
        <el-skeleton :loading="loading_pages" animated :rows="10">
            <div class="sub_section_header">
                <p
                    v-html="
                        $t(
                            'FluentForms uses the pages below for handling the display of payment history and payment receipt. Please select the pages and add the instructed shortcodes accordingly. %sPlease read the documentation%s for advanced shortcode usage.',
                            `<a target='_blank' rel='noopener' href='https://wpmanageninja.com/docs/fluent-form/payment-settings/payment-management-settings'>`,
                            '</a>'
                        )
                    "
                >
                </p>
                <p
	                v-if="has_pro"
                    v-html="
                        $t(
                            'Also %splease check the documentation%s to learn how to accept %sRecurring Payments%s',
                            `<a target='_blank' rel='noopener' href='https://wpmanageninja.com/docs/fluent-form/payment-settings/accept-recurring-payments-with-wp-fluent-forms-wordpress-plugin/'>`,
                            '</a>',
                            '<b>',
                            '</b>'
                        )
                    "
                >
                </p>
                <hr class="mt-4 mb-4" />
            </div>
            <el-form-item class="ff-form-item">
                <template slot="label">
                    {{ $t('Payment Management Page') }}
                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                        <div slot="content">
                            <p>
                                {{ $t(`This is where user can view their single payments ${has_pro? 'and subscriptions' : ''}.`) }}
                            </p>
                        </div>
                        <i class="ff-icon ff-icon-info-filled text-primary"></i>
                    </el-tooltip>
                </template>
                <el-select class="w-100" clearable filterable 
                    v-model="settings.all_payments_page_id" :placeholder="$t('Select Page')">
                    <el-option
                        v-for="page in pages"
                        :key="page.ID"
                        :label="page.post_title + ' (' + page.ID+')'"
                        :value="page.ID">
                    </el-option>
                </el-select>
                <p
                    class="mt-2 text-note"
                    v-html="
                        $t(
                            `Add shortcode %s[fluentform_payments]%s in the selected page. This shortcode will show payments ${has_pro? 'and subscriptions ' : ''}to the logged-in user`,
                            '<b>',
                            '</b>'
                        )
                    "
                >
                </p>
            </el-form-item>
            <el-form-item class="ff-form-item">
                <template slot="label">
                    {{ $t('Payment Receipt Page') }}
                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                        <div slot="content">
                            <p>
                                {{ $t(`This is where user can view their payment receipt${ has_pro?' and manage single subscription payment' : '' }.`) }}
                            </p>
                        </div>
                        <i class="ff-icon ff-icon-info-filled text-primary"></i>
                    </el-tooltip>
                </template>
                <el-select class="w-100" clearable filterable 
                    v-model="settings.receipt_page_id" :placeholder="$t('Select Page')">
                    <el-option
                        v-for="page in pages"
                        :key="page.ID"
                        :label="page.post_title + ' (' + page.ID+')'"
                        :value="page.ID">
                    </el-option>
                </el-select>
                <p
                    class="mt-2 text-note"
                    v-html="
                        $t(
                            'Add shortcode %s[fluentform_payment_view]%s in the selected page.',
                            '<b>',
                            '</b>'
                        )
                    "
                >
                </p>
            </el-form-item>
            <el-form-item class="ff-form-item" v-if="has_pro">
                <template slot="label">
                    {{ $t('Subscription Management') }}
                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                        <div slot="content">
                            <p>
                                {{ $t('Please enable this if you enable users to manage their own subscriptions like cancel an active subscription.') }}
                            </p>
                        </div>
                        <i class="ff-icon ff-icon-info-filled text-primary"></i>
                    </el-tooltip>
                </template>
                <el-checkbox true-label="yes" false-label="no" v-model="settings.user_can_manage_subscription">
                    {{ $t('Users can manage their own payment subscriptions (only available on Stripe)') }}
                </el-checkbox>
            </el-form-item>
        </el-skeleton>
    </div>
</template>

<script type="text/babel">
export default {
    name: 'PageSettings',
    props: ['settings', 'has_pro'],
    data() {
        return {
            pages: [],
            loading_pages: false
        }
    },
    methods: {
        fetchPages() {
            this.loading_pages = true;
            FluentFormsGlobal.$get({
                action: 'fluentform_handle_payment_ajax_endpoint',
                route: 'get_pages'
            })
                .then(response => {
                    this.pages = response.data.pages;
                })
                .always(() => {
                    this.loading_pages = false;
                });
        }
    },
    mounted() {
        this.fetchPages();
    }
}
</script>
