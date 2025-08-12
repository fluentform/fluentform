<template>
    <card>
        <card-head>
            <div class="license-header">
                <h4 class="license-title">{{ $t('License Key') }}</h4>

                <!-- Status Badge -->
                <div class="license-badge" :class="getBadgeClass()">
                    <i class="license-badge-icon" :class="getBadgeIcon()"></i>
                    <span class="license-badge-text">{{ getBadgeText() }}</span>
                </div>
            </div>
        </card-head>

        <card-body>
            <div class="license-content">
            <!-- Free Version -->
            <div v-if="!licenseStatus.is_pro" class="license-message">
                <p class="license-text">{{ $t('You are currently using the free version of Fluent Forms.') }}</p>
                <button class="upgrade-button" @click="upgradeNow">
                    <i class="upgrade-icon">👑</i>
                    <span>{{ $t('Upgrade Now') }}</span>
                </button>
            </div>

            <!-- Pro Version - Valid License -->
            <div v-else-if="licenseStatus.status === 'valid'" class="license-message">
                <p class="license-text">{{ $t('The license has been successfully activated') }}</p>
            </div>

            <!-- Pro Version - Expired License -->
            <div v-else-if="licenseStatus.status === 'expired'" class="license-message">
                <p class="license-text">{{ licenseStatus.message }}</p>
                <div class="license-actions">
                    <button class="renew-button" @click="renewLicense">
                        {{ $t('Renew License') }}
                    </button>
                    <button class="manage-button" @click="manageLicense">
                        {{ $t('Manage License') }}
                    </button>
                </div>
            </div>

            <!-- Pro Version - Invalid/Inactive License -->
            <div v-else class="license-message">
                <p class="license-text">{{ licenseStatus.message }}</p>
                <button class="activate-button" @click="manageLicense">
                    {{ $t('Activate License') }}
                </button>
            </div>
            </div>
        </card-body>
    </card>
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";

export default {
    name: 'LifetimeLog',
    components: {
        Card,
        CardBody,
        CardHead
    },
    props: {
        licenseStatus: {
            type: Object,
            default: () => ({
                is_pro: false,
                status: 'free',
                message: 'You are currently using the free version of Fluent Forms.'
            })
        }
    },
    methods: {
        upgradeNow() {
            window.open('https://fluentforms.com/pricing/', '_blank');
        },

        manageLicense() {
            // Navigate to license management page
            this.$router.push({
                name: 'global_settings',
                query: { component: 'license_page' }
            });
        },

        renewLicense() {
            // Open renewal URL - this would typically come from the license data
            window.open('https://wpmanageninja.com/downloads/fluentform-pro-add-on/', '_blank');
        },

        getBadgeClass() {
            if (!this.licenseStatus.is_pro) {
                return 'badge-free';
            }

            switch (this.licenseStatus.status) {
                case 'valid':
                    return 'badge-active';
                case 'expired':
                    return 'badge-expired';
                case 'invalid':
                case 'inactive':
                    return 'badge-inactive';
                default:
                    return 'badge-unknown';
            }
        },

        getBadgeIcon() {
            if (!this.licenseStatus.is_pro) {
                return 'el-icon-info';
            }

            switch (this.licenseStatus.status) {
                case 'valid':
                    return 'el-icon-check';
                case 'expired':
                    return 'el-icon-warning';
                case 'invalid':
                case 'inactive':
                    return 'el-icon-close';
                default:
                    return 'el-icon-question';
            }
        },

        getBadgeText() {
            if (!this.licenseStatus.is_pro) {
                return this.$t('Free');
            }

            switch (this.licenseStatus.status) {
                case 'valid':
                    return this.$t('Active');
                case 'expired':
                    return this.$t('Expired');
                case 'invalid':
                    return this.$t('Invalid');
                case 'inactive':
                    return this.$t('Inactive');
                default:
                    return this.$t('Unknown');
            }
        }
    }
};
</script>