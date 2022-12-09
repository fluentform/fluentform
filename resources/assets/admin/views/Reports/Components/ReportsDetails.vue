<template>
    <div class="reports-details" v-if="data">
        <div class="reports-details-header">
            <div class="reports-details-title">
                <span class="text-info"><i :class="icon"></i></span>
                <h3>{{ data.label }}</h3>
            </div>
            <div v-if="data.url" class="reports-details-url">
                <a :href="data.url"><span class="text-info">{{ data.label }} <i class="el-icon-right"></i></span></a>
            </div>
        </div>
        <div class="reports-details-body">
            <p class="reports-description">{{ data.description }}</p>

            <div v-if="isPayments || isIntegrations">
                <div class="" v-if="data.data">
                    <div v-if="isIntegrations" class="ff-integrations-reports">
                        <div class="ff-reports-item-wrapper" v-for="(item, i) in data.data"
                             :key="item.provider + i">
                            <div class="ff-reports-item">
                                <div class="ff-reports-item-header">
                                    <h4>{{ item.name }} <span :class="item.enable ? 'text-success' :'text-danger'">({{ item.enable?'enable': 'disable'}})</span></h4>
                                    <span>{{ item.provider }}</span>
                                </div>
                                <div class="ff-reports-item-body">
                                    <el-row :gutter="20">
                                        <el-col  :span="12" v-for="status in item.statuses" :key="status.status">
                                            <div
                                                class="ff-status-item"
                                                :class="{'border-success': status.status === 'success', 'border-danger': status.status === 'failed'}"
                                            >
                                                <h5>{{ status.status }}</h5>
                                                <span :class="{'text-success': status.status === 'success', 'text-danger': status.status === 'failed'}">{{
                                                        status.total
                                                    }}</span>
                                            </div>
                                        </el-col>
                                    </el-row>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="ff-payments-reports" v-if="isPayments">
                        <div class="ff-reports-item-wrapper" v-for="(item, key) in data.data"
                             :key="key">
                             <payment-report
                                 v-if="item"
                                 :data="item"
                                 :type="key"
                             />
                        </div>
                    </div>
                </div>
                <div class="data-not-found" v-else>
                    <p v-if="isIntegrations">{{ $t('No integrations connected. Connect a') }} <a
                        :href="data.url"><span class="text-info">{{ $t('integrations') }}</span></a>
                        {{ $t('to view data in report.') }}</p>
                    <p v-else>{{ $t('Payment not implemented. Add') }} <a
                        href="https://fluentforms.com/wp-fluent-forms-payment-integration/"
                        target="_blank"><span class="text-info">{{$t('payment')}}</span></a>
                        {{ $t('to your form to start collecting payments.') }}</p>
                </div>
            </div>

            <el-row class="reports-count-area" v-else>
                <el-col :span="12" class="">
                    <h3>{{ data.label }}</h3>
                    <span>{{ data.total }} <span v-if="type==='conversion'">%</span></span>
                </el-col>
                <el-col :span="12" class="">
                    <h3>{{ data.ip_label }}</h3>
                    <span>{{ data.ip_total }} <span v-if="type==='conversion'">%</span></span>
                </el-col>
            </el-row>

        </div>
    </div>
</template>

<script>
import paymentReport from './PaymentReport';

export default {
    name: 'ReportsDetails',
    components: {
        paymentReport
    },

    props: ['data', 'icon', 'type'],
    computed: {
        isPayments() {
            return this.type === 'payments';
        },
        isIntegrations() {
            return this.type === 'integrations';
        }
    }
}
</script>

<style scoped>

</style>