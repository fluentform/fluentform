<template>
    <div class="lifetime-log">
        <div class="log-header">
            <h3 class="log-title">{{ $t('Lifetime Log') }}</h3>
        </div>
        
        <div class="log-content">
            <div class="log-message">
                <p>{{ $t('You are currently using the free version of Fluent Forms.') }}</p>
                <el-button 
                    type="primary" 
                    size="small"
                    @click="upgradeNow"
                >
                    {{ $t('Upgrade Now') }}
                </el-button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LifetimeLog',
    methods: {
        upgradeNow() {
            window.open('https://fluentforms.com/pricing/', '_blank');
        }
    }
};
</script>


