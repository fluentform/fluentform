<template>
    <div>
        <h2 class="nav-tab-wrapper">
            <span style="float: left; padding: 8px 0;" class="plugin-name">{{ $t('Fluent Forms') }}</span>

            <router-link active-class="nav-tab-active" exact :class="['nav-tab']"
                         :to="{ name: 'home' }"
            >
                {{ $t('Home') }}
            </router-link>
        </h2>

        <router-view></router-view>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'Home',
    }
</script>
