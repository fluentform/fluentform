<template>
    <el-row class="settings-page" type="flex">
        <el-col :md="6" :sm="8">
            <el-menu
                :default-active="$route.name"
                :router="true"
                theme="dark"
                style="height: 100%;">

                <el-menu-item
                    index="integrations"
                    :route="{ name: 'integrations' }">
                    Slack
                </el-menu-item>
            </el-menu>
        </el-col>

        <el-col :md="18">
            <div class="settings-body">
                <router-view :form="form"></router-view>
            </div>
        </el-col>
    </el-row>
</template>

<script>

export default {
    name: 'Integrations',
    props: ['form'],
    computed: {
        slack() {
            return this.form.integrations.slack;
        }
    },
    data() {
        return {
            activeNames: ['1']
        }
    }
}
</script>