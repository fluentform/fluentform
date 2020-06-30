<template>
    <div>
        <el-row class="settings-page" type="flex">
            <el-col :md="4" :sm="8">
                <el-menu
                    :default-active="$route.name"
                    :router="true"
                    theme="light"
                    style="height: 100%;">

                    <el-menu-item
                        index="form-settings"
                        :route="{ name: 'form-settings' }"
                    >Form Settings</el-menu-item>

                    <el-menu-item
                        index="form-confirmations"
                        :route="{ name: 'form-confirmations' }"
                    >Confirmations</el-menu-item>

                    <el-menu-item
                        index="form-notifications"
                        :route="{ name: 'form-notifications' }"
                    >Notifications</el-menu-item>

                    <el-menu-item
                        index="mailchimp"
                        :route="{ name: 'mailchimp' }"
                    >MailChimp</el-menu-item>

                    <el-menu-item
                        index="google-api-settings"
                        :route="{ name: 'google-api-settings' }"
                    >API Settings</el-menu-item>
                    
                    <template v-for="extra_nav in extra_navs">
                        <el-menu-item
                            :index="extra_nav.name"
                            :route="{ name: 'extra', query: { module: extra_nav.name } }"
                        >{{ extra_nav.label }}</el-menu-item>
                    </template>
                </el-menu>
            </el-col>

            <el-col :md="20">
                <div class="settings-body">
                    <router-view :form="form" :inputs="inputs"></router-view>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script>
    export default {
        name: 'settings',
        props: ['form'],
        data() {
            return {
                inputs: null,
                extra_navs: [],
                form_id: this.$route.params.form_id
            }
        },
        methods: {
            fetchInputs() {
                let data = {
                    action: this.$action.getFormInputs,
                    formId: this.form.id
                };

                jQuery.get(ajaxurl, data)
                    .done(response => {
                        console.log(response);
                    })
                    .fail(e => {});
            },
            loadExtraSettings() {
                let data = {
                    action: 'fluentform-get-extra-form-settings',
                    form_id: this.form_id
                };

                jQuery.get(ajaxurl, data)
                    .then(response => {
                        this.extra_navs = response.data.setting_navs;
                        this.app_ready = true;
                    })
                    .fail(error => {
                        console.log(error);
                    })
                    .always(() => {
                        // ...
                    });
            }
        },
        mounted() {
            this.fetchInputs();
            jQuery('head title').text('Confirmation Settings - Fluent Forms');
        },
        created() {
            this.loadExtraSettings();
        }
    };
</script>

<style>
    .fade-enter-active, .fade-leave-active {
        transition: opacity .5s;
    }

    .fade-enter, .fade-leave-to {
        opacity: 0;
        transition: opacity .5s;
    }

    .el-form-item__label {
        font-size: 13px;
    }

    input[type=checkbox] {
        display: none;
    }
</style>