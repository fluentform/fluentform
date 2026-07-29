<template>
    <div>
        <el-row class="setting_header">
            <el-col :md="24">
                <h2>{{ $t('Connect your form with more integrations with Pro') }}</h2>
            </el-col>
        </el-row>

        <div class="ff-feature-lists">
            <ul>
                <li><span class="dashicons dashicons-yes"></span> Campaign Monitor</li>
                <li><span class="dashicons dashicons-yes"></span> GetResponse</li>
                <li><span class="dashicons dashicons-yes"></span> Active Campaign</li>
                <li><span class="dashicons dashicons-yes"></span> iContact</li>
                <li><span class="dashicons dashicons-yes"></span> Zapier</li>
                <li><span class="dashicons dashicons-yes"></span> WebHooks</li>
                <li><span class="dashicons dashicons-yes"></span> {{ $t('Conditional Email Broadcast') }}</li>
                <li><span class="dashicons dashicons-yes"></span> {{ $t('Conditional Integration Broadcast') }}</li>
                <li><span class="dashicons dashicons-plus"></span> {{ $t('More coming soon...') }}</li>
            </ul>
            <img class="ff-integration"
                 src="https://wpmanageninja.com/wp-content/uploads/2018/10/ff-intragrations.png">
        </div>
        <div class="promo_section">
            <p class="ff-add-on-description">{{ $t('Unlock all type of premium input fields by using this add on') }}</p>
            <a target="_blank" :href="upgradeUrl('settings_integrations', 'https://wpmanageninja.com/downloads/fluentform-pro-add-on/')" class="button button-primary">{{ $t('Purchase Pro Add - On Now') }}</a>
        </div>
    </div>
</template>

<script type="text/babel">
    import upgradeUrl from '@/common/upgradeUrl';

    export default {
        name: 'integration_promo',
        methods: {
            upgradeUrl
        }
    }
</script>
