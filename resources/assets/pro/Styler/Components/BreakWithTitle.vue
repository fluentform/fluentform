<template>
    <div class="ff-control-content">
        <div class="ff-control-field">
            <div class="ff-control-title-breaker">
                {{ $t(item.label) }}
            </div>
            <p>{{item.value}}</p>
        </div>
    </div>
</template>
<script type="text/babel">
    export default {
        name: 'ff_breakwithtitle',
        props: ['item'],
    }
</script>