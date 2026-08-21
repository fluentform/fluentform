<template>
    <div class="ff_license_setting">
        <card>
            <card-head>
                <h5 class="title">{{ $t('License') }}</h5>
                <p class="text">{{ $t('Manage updates and support for Fluent Forms Pro.') }}</p>
            </card-head>

            <card-body v-loading="loading || saving">
                <div
                    v-if="alert"
                    class="ff-license-alert"
                    :class="'is-' + alert.type"
                >
                    <div>
                        <strong>{{ alert.title }}</strong>
                        <p v-if="alert.description">{{ alert.description }}</p>
                    </div>
                    <a
                        v-if="alert.url"
                        :href="alert.url"
                        class="ff-license-alert-action"
                        target="_blank"
                        rel="noopener noreferrer"
                    >{{ alert.action }}</a>
                </div>

                <div v-if="showCard" class="ff-license-card">
                    <div class="ff-license-card-head">
                        <div>
                            <h3>{{ licenseData.product_title || $t('Fluent Forms Pro') }}</h3>
                            <p v-if="licenseData.variation_title">{{ licenseData.variation_title }}</p>
                        </div>
                        <span class="ff-license-pill" :class="'is-' + statusMeta.type">
                            {{ statusMeta.label }}
                        </span>
                    </div>

                    <ul v-if="licenseRows.length" class="ff-license-meta">
                        <li v-for="row in licenseRows" :key="row.label">
                            <span class="ff-license-meta-label">{{ row.label }}</span>
                            <span class="ff-license-meta-value">
                                <span
                                    v-if="row.badge"
                                    class="ff-license-pill is-soft"
                                    :class="'is-' + row.badge"
                                >{{ row.value }}</span>
                                <span v-else>{{ row.value }}</span>
                                <small v-if="row.hint">{{ row.hint }}</small>
                            </span>
                        </li>
                    </ul>

                    <div class="ff-license-card-footer">
                        <div class="ff-license-checked">
                            <span v-if="licenseData.last_checked_human">
                                {{ $t('Last checked') }}: {{ licenseData.last_checked_human }}
                            </span>
                            <button type="button" class="ff-license-link" @click="loadLicense(true)">
                                {{ $t('Refresh') }}
                            </button>
                            <a
                                v-if="licenseData.account_url"
                                :href="licenseData.account_url"
                                target="_blank"
                                rel="noopener noreferrer"
                            >{{ $t('Your Account') }}</a>
                            <a
                                v-if="licenseData.support_url"
                                :href="licenseData.support_url"
                                target="_blank"
                                rel="noopener noreferrer"
                            >{{ $t('Get Support') }}</a>
                        </div>
                        <div class="ff-license-card-actions">
                            <a
                                v-if="licenseData.manage_url"
                                :href="licenseData.manage_url"
                                class="el-button el-button--small"
                                target="_blank"
                                rel="noopener noreferrer"
                            >{{ $t('Manage Subscription') }}</a>
                            <el-button size="small" @click="deactivateLicense">
                                {{ $t('Deactivate') }}
                            </el-button>
                        </div>
                    </div>
                </div>

                <div
                    v-if="showForm"
                    class="ff-license-form"
                    :class="{ 'is-swap': showCard }"
                >
                    <div class="ff-license-form-head">
                        <h3>
                            {{ showCard
                                ? $t('Activate a different license key')
                                : $t('Enter your Fluent Forms Pro license key') }}
                        </h3>
                        <button
                            v-if="showCard"
                            type="button"
                            class="ff-license-link"
                            @click="cancelKeyChange"
                        >{{ $t('Cancel') }}</button>
                    </div>
                    <p class="ff-license-form-help">
                        {{ showCard
                            ? $t('The key you enter replaces the one this site currently uses.')
                            : $t('Activate your license to receive automatic updates and premium support.') }}
                    </p>
                    <div class="ff-license-activation-row">
                        <el-input
                            v-model.trim="licenseKey"
                            class="ff-license-key-input"
                            type="password"
                            show-password
                            :placeholder="$t('License Key')"
                            @keyup.enter.native="activateLicense"
                        />
                        <el-button
                            type="primary"
                            class="ff-license-verify-button"
                            :loading="saving"
                            @click="activateLicense"
                        >{{ $t('Verify License') }}</el-button>
                    </div>
                    <p v-if="!showCard" class="ff-license-purchase">
                        {{ $t("Don't have a license key?") }}
                        <a :href="purchaseUrl" target="_blank" rel="noopener noreferrer">
                            {{ $t('Purchase one here') }}
                        </a>
                    </p>
                </div>

                <p v-if="showCard && !showForm" class="ff-license-switch">
                    {{ $t('Have a new license key?') }}
                    <button type="button" class="ff-license-link" @click="showNewLicenseInput = true">
                        {{ $t('Click here') }}
                    </button>
                </p>

                <div v-if="errorLines.length" class="ff-license-errors" role="alert">
                    <p v-for="(line, index) in errorLines" :key="index">{{ line }}</p>
                </div>
            </card-body>
        </card>
    </div>
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardHead from '@/admin/components/Card/CardHead.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';

export default {
    name: 'License',
    components: {
        Card,
        CardHead,
        CardBody
    },
    data() {
        return {
            loading: true,
            saving: false,
            licenseData: {},
            licenseKey: '',
            showNewLicenseInput: false,
            errorMessage: ''
        };
    },
    computed: {
        purchaseUrl() {
            return this.licenseData.purchase_url || window.FluentFormApp.upgrade_url;
        },
        status() {
            return this.licenseData.status || 'unregistered';
        },
        inGracePeriod() {
            return !!this.licenseData.in_grace_period;
        },
        isExpired() {
            if (this.status === 'expired' || this.licenseData.is_expired) {
                return true;
            }

            const days = this.licenseData.days_remaining;
            return !this.licenseData.is_lifetime && !this.inGracePeriod &&
                days !== null && days !== undefined && days < 0;
        },
        showCard() {
            return !!this.licenseData.license_key_masked ||
                ['valid', 'expired', 'disabled'].indexOf(this.status) !== -1;
        },
        showForm() {
            return !this.showCard || this.showNewLicenseInput;
        },
        statusMeta() {
            if (this.inGracePeriod) {
                return {label: this.$t('Grace Period'), type: 'warning'};
            }
            if (this.isExpired) {
                return {label: this.$t('Expired'), type: 'danger'};
            }

            const map = {
                valid: {label: this.$t('Active'), type: 'success'},
                disabled: {label: this.$t('Disabled'), type: 'danger'},
                invalid: {label: this.$t('Invalid'), type: 'danger'},
                error: {label: this.$t('Error'), type: 'danger'},
                pending_verification: {label: this.$t('Needs Verification'), type: 'warning'},
                unregistered: {label: this.$t('Not Activated'), type: 'neutral'}
            };

            return map[this.status] || {label: this.humanize(this.status), type: 'neutral'};
        },
        subscriptionMeta() {
            const status = this.licenseData.subscription_status;
            if (!status) {
                return null;
            }

            const types = {
                active: 'success',
                trialing: 'success',
                trial: 'success',
                paused: 'warning',
                on_hold: 'warning',
                pending: 'warning',
                failing: 'danger',
                cancelled: 'danger',
                canceled: 'danger',
                expired: 'danger'
            };

            return {label: this.humanize(status), type: types[status] || 'neutral'};
        },
        expiryRow() {
            if (this.licenseData.is_lifetime) {
                return {label: this.$t('Expires'), value: this.$t('Lifetime'), badge: 'success'};
            }
            if (!this.licenseData.expires_human) {
                return null;
            }

            const days = this.licenseData.days_remaining;
            let hint = '';
            if (days !== null && days !== undefined) {
                if (days < 0) {
                    hint = this.$t('expired %d days ago', Math.abs(days));
                } else if (days === 0) {
                    hint = this.$t('expires today');
                } else if (days === 1) {
                    hint = this.$t('in 1 day');
                } else {
                    hint = this.$t('in %d days', days);
                }
            }

            return {
                label: this.$t('Expires'),
                value: this.licenseData.expires_human,
                badge: days !== null && days !== undefined && days < 0 ? 'danger' : '',
                hint: hint
            };
        },
        licenseRows() {
            const rows = [];
            if (this.expiryRow) {
                rows.push(this.expiryRow);
            }
            if (this.inGracePeriod) {
                rows.push({label: this.$t('Updates & Support'), value: this.$t('Ending soon'), badge: 'warning'});
            }
            if (this.subscriptionMeta) {
                rows.push({label: this.$t('Subscription'), value: this.subscriptionMeta.label, badge: this.subscriptionMeta.type});
            }
            if (this.licenseData.license_key_masked) {
                rows.push({label: this.$t('License Key'), value: this.licenseData.license_key_masked});
            }
            if (this.licenseData.customer_name || this.licenseData.customer_email_masked) {
                rows.push({
                    label: this.$t('Licensed To'),
                    value: this.licenseData.customer_name || this.licenseData.customer_email_masked,
                    hint: this.licenseData.customer_name ? this.licenseData.customer_email_masked : ''
                });
            }
            return rows;
        },
        alert() {
            const renewUrl = this.licenseData.renew_url || this.licenseData.purchase_url;
            const message = this.licenseData.error_message || this.licenseData.message || '';

            if (this.inGracePeriod) {
                return {
                    type: 'warning',
                    title: this.$t('Your license has expired.'),
                    description: this.$t('Everything keeps working during the grace period. Renew now to keep updates and support.'),
                    action: this.$t('Renew License'),
                    url: renewUrl
                };
            }
            if (this.isExpired) {
                return {
                    type: 'danger',
                    title: this.$t('Your license has expired.'),
                    description: this.$t('Renew your license to keep receiving updates and support.'),
                    action: this.$t('Renew License'),
                    url: renewUrl
                };
            }
            if (['disabled', 'invalid', 'error'].indexOf(this.status) !== -1) {
                return {
                    type: 'danger',
                    title: this.$t('We could not verify this license.'),
                    description: message,
                    action: this.licenseData.support_url ? this.$t('Get Support') : '',
                    url: this.licenseData.support_url
                };
            }
            if (this.status === 'pending_verification') {
                return {
                    type: 'warning',
                    title: this.$t('This saved license needs to be verified.'),
                    description: this.$t('Refresh the status. Your existing key remains saved if the license server is unavailable.')
                };
            }
            return null;
        },
        errorLines() {
            if (!this.errorMessage) {
                return [];
            }
            return String(this.errorMessage).split(/<br\s*\/?>/i).map(line => line.trim()).filter(Boolean);
        }
    },
    methods: {
        humanize(value) {
            const text = String(value || '').replace(/_/g, ' ');
            return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
        },
        errorText(error, fallback) {
            if (typeof error === 'string') {
                return error;
            }
            return (error && error.message) || fallback;
        },
        loadLicense(verify) {
            this.loading = true;
            this.errorMessage = '';
            FluentFormsGlobal.$rest.get('license', {verify: verify ? '1' : '0'})
                .then(response => {
                    this.licenseData = response || {};
                    this.errorMessage = this.licenseData.error_message || '';
                })
                .catch(error => {
                    this.errorMessage = this.errorText(error, this.$t('The license status could not be loaded.'));
                    this.$fail(this.errorMessage);
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        activateLicense() {
            if (!this.licenseKey || this.saving) {
                return;
            }

            this.saving = true;
            this.errorMessage = '';
            FluentFormsGlobal.$rest.post('license', {license_key: this.licenseKey})
                .then(response => {
                    this.licenseData = response.license_data || {};
                    this.licenseKey = '';
                    this.showNewLicenseInput = false;
                    this.$success(response.message || this.$t('Your license was activated successfully.'));
                })
                .catch(error => {
                    this.errorMessage = this.errorText(error, this.$t('The license could not be activated.'));
                    this.$fail(this.errorMessage);
                })
                .finally(() => {
                    this.saving = false;
                });
        },
        deactivateLicense() {
            this.$confirm(
                this.$t('This site will stop receiving plugin updates until a license is activated again.'),
                this.$t('Deactivate this license?'),
                {
                    confirmButtonText: this.$t('Yes, Deactivate'),
                    cancelButtonText: this.$t('Cancel'),
                    type: 'warning'
                }
            ).then(() => {
                this.saving = true;
                this.errorMessage = '';
                return FluentFormsGlobal.$rest.delete('license');
            }).then(response => {
                if (!response) {
                    return;
                }
                this.licenseData = response.license_data || {};
                this.showNewLicenseInput = false;
                this.$success(response.message || this.$t('Your license was deactivated successfully.'));
            }).catch(error => {
                if (!error || error === 'cancel' || error === 'close') {
                    return;
                }
                this.errorMessage = this.errorText(error, this.$t('The license could not be deactivated.'));
                this.$fail(this.errorMessage);
            }).finally(() => {
                this.saving = false;
            });
        },
        cancelKeyChange() {
            this.showNewLicenseInput = false;
            this.licenseKey = '';
            this.errorMessage = '';
        }
    },
    mounted() {
        this.loadLicense(false);
    }
};
</script>
