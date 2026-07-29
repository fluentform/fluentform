<template>
    <div class="ff_update_card " >
        <div class="ff-update-icon">
            <i class="el-icon-warning"></i>
        </div>

        <div class="ff-update-body">
            <h5>{{UpdateMessage}}</h5>
            <p>{{$t('Upgrade now to access all the advanced features.')}}</p>
        </div>

        <div class="ff-update-action">
            <a
                    target="_blank"
                    :href="upgradeUrl(utmContent)"
                    class="el-button el-button--primary el-button--small"
            >
                {{$t('Upgrade to Pro')}}
            </a>
        </div>
    </div>
</template>
<script>
import upgradeUrl from '@/common/upgradeUrl';

export default {
    name: 'UpdateToProContent',
    props: ['UpdateMessage', 'utmContent'],
    methods: {
        upgradeUrl
    }
}
</script>
