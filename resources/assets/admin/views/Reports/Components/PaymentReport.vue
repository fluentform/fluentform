<template>
    <div class="ff-reports-item">

        <div class="ff-reports-item-header">
            <h4>{{ type }}
                <span>({{ data.total.count }})</span>
            </h4>
            <div v-if="type==='subscriptions'">
                <p> {{ $t('Purchase') }} : <span class="btn-success">{{ data.total.paid_count }}</span> {{ $t('out of') }} <span
                    class="btn-info">{{ data.total.pay_count }} </span>{{ $t('times billed') }}</p>
                <p> {{ $t('Payments') }} : <span class="btn-success">{{ data.total.paid }} </span> {{ $t('out of') }} <span
                    class="btn-info">{{ data.total.should_pay }}</span> {{ $t('paid') }}
                </p>
            </div>
            <div class="orders" v-else-if="type==='orders'">
                <p class="" v-if="data.total.quantity"> {{ $t('Quantity') }}: <span class="btn-info">{{
                        data.total.quantity
                    }}</span></p>
                <p>{{ $t('Total') }}: <span class="btn-success">{{ payments }}</span></p>
            </div>
            <p v-else>{{ $t('Total') }}: <span class="btn-success">{{ payments }}</span></p>
        </div>
        <div class="ff-reports-item-body">
            <el-row :gutter="20">
                <el-col :span="12" v-for="(item, i) in data.items" :key="i + item.name">
                    <div
                        class="ff-status-item"
                        :class="'shadow-' + getStatusClassPostfix(item.status)"
                    >
                        <div class="payment-items-header">
                            <h5>{{ item.name }}
                                <span
                                    :class="'text-'+getStatusClassPostfix(item.status)"
                                > ({{ item.count }})</span></h5>
                        </div>
                        <div class="" v-if="type==='orders'">
                            <p v-if="item.price"> Price : <span>{{ item.price }}</span></p>
                            <p v-if="item.quantity"> Quantity : <span>{{ item.quantity }}</span></p>
                            <p v-if="item.payments"> Total : <span class="text-info">{{ item.payments }}</span></p>
                        </div>
                        <div class="" v-else-if="type ==='subscriptions'">
                            <p> {{ $t('Purchase') }} : <span class="text-success">{{ item.paid_count }}</span> {{ $t('out of') }} <span
                                class="text-info">{{ item.pay_count }} </span>{{ $t('times billed') }}</p>
                            <p> Payments : <span class="text-success">{{ item.paid }} </span> {{ $t('out of') }} <span
                                class="text-info">{{ item.should_pay }}</span> {{ $t('paid') }}
                            </p>
                        </div>
                        <div v-else>
                            <div v-if="Array.isArray(item.payments)">
                                <div v-for="(payment, i) in item.payments" :key="'payment_' + i">
                                <span
                                    :class="'text-'+getStatusClassPostfix(item.status)"
                                >{{ payment }}</span>
                                </div>
                            </div>
                            <div v-else>
                                <span class="btn-info">{{ item.payments }}</span>
                            </div>
                        </div>
                    </div>
                </el-col>
            </el-row>
            <div class="subscription-planning-wrapper" v-if="type ==='subscriptions'">
                <el-row :gutter="20">
                    <el-col :span="12" v-for="(item, i) in data.plannings" :key="i + item.name">
                        <div class="ff-status-item">
                            <div class="payment-items-header">
                                <h5>{{ item.name }} <span> ({{ item.count }})</span></h5>
                                <p>{{ $t('Interval') }} : <span class="text-info">{{ item.interval }}</span></p>
                            </div>
                            <div class="">
                                <p v-if="item.price"> Price : <span>{{ item.price }}</span></p>
                                <p> {{ $t('Purchase') }} : <span class="text-success">{{ item.paid_count }}</span> {{ $t('out of') }} <span
                                    class="text-info">{{
                                        item.pay_count
                                    }} </span> {{ $t('times billed') }}</p>
                                <p> {{ $t('Payments') }} : <span class="text-success">{{ item.paid }} </span> {{ $t('out of') }} <span
                                    class="text-info">{{ item.should_pay }}</span>
                                    {{ $t('paid') }}
                                </p>
                            </div>
                        </div>
                    </el-col>
                </el-row>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'PaymentReport',
    props: ['data', 'type'],
    methods: {
        getStatusClassPostfix(status) {
            if (['paid', 'active'].includes(status)) {
                return 'success';
            } else if(['pending', 'processing'].includes(status)) {
                return 'pending';
            } else if (['refunded', 'partially-refunded'].includes(status)) {
                return 'info';
            } else if (['failed', 'cancelled'].includes(status)) {
                return 'danger';
            }
            return '';
        }
    },
    computed: {
        payments() {
            if (typeof this.data?.total?.payments === 'string') {
                return this.data.total.payments;
            } else {
                return this.data?.total?.payments.join(', ');
            }
        }
    }
}
</script>

<style scoped>

</style>