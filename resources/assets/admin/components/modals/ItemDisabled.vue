<template>
    <div :class="{'ff_backdrop': visibility}" class="disabled-info">
        <el-dialog
            :title="!modal ? $t('Field disabled') : ''"
            :visible.sync="isVisible"
            :before-close="close"
            width="70%">
            <template v-if="contentComponent">
                <component :is="contentComponent"></component>
            </template>

            <template v-else-if="modal">
                <el-row :gutter="25">
                    <el-col v-if="modal.video || modal.image"
                            :md="12"
                            :span="24"
                    >
                        <div v-if="modal.video"
                             style="width: 100%; overflow: hidden;"
                        >
                            <iframe
                                style="width: 100%; height: 350px;"
                                :src="modal.video"
                                title="YouTube video player"
                                frameborder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen
                            />
                        </div>
                        <div v-else style="overflow: hidden;">
                            <img :src="modal.image" :alt="modal.title" />
                        </div>
                    </el-col>

                    <el-col :md="modal.video || modal.image ? 12 : 24" :span="24">
                        <i v-show="!modal.hidePro" class="ff-edit-password ff-icon-lock" />

                        <div>
                            <h3>{{ modal.title }}</h3>

                            <p>{{ modal.description }}</p>

                            <a
                                v-show="!modal.hidePro"
                                target="_blank"
                                class="el-button el-button--primary"
                                :href="campaignUrl"
                            >
                                {{ $t('Upgrade to PRO') }}
                            </a>
                        </div>
                    </el-col>
                </el-row>
            </template>

            <div v-else>
                <p style="margin-bottom: 30px; font-size: 18px;">{{ $t('This field is only available on pro add - on') }}</p>
                <a  target="_blank"
                    class="el-button el-button--danger"
                    :href="campaignUrl" >
                    {{ $t('Upgrade to Pro Now') }}
                </a>
            </div>

            <template v-if="false">
                <div style="text-align: center;">
                    <div v-if="modal && modal.is_payment">
                        <h2>{{ $t('Fluent Forms Payment Module') }}</h2>
                        <p>{{ $t('Accept Payment online as part of the Forms submission process.With Fluent Forms Powerful payment integration, you can easily accept and process payments in your Fluent Forms via Stripe / PayPal.Payment Module is available on Pro Version.') }}</p>
                        <a  target="_blank"
                            class="el-button el-button--danger"
                            :href="pay_campaignUrl" >
                            {{ $t('Upgrade to Pro Now') }}
                        </a>
                    </div>
                    <div v-else-if="modal && modal.disable_html">
                        <div v-html="modal.disable_html"></div>
                    </div>
                    <div v-else>
                        <p style="margin-bottom: 30px; font-size: 18px;">{{ $t('This field is only available on pro add - on') }}</p>
                        <a  target="_blank"
                            class="el-button el-button--danger"
                            :href="campaignUrl" >
                            {{ $t('Upgrade to Pro Now') }}
                        </a>
                    </div>

                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script>
    import recaptcha from './Recaptcha.vue';
    import hcaptcha from './Hcaptcha.vue';

    export default {
        name: 'ItemDisabled',
        props: ['visibility', 'modal', 'value'],
        components: { hcaptcha, recaptcha },
        data() {
            return {
                contentComponent: '',
            }
        },
        watch: {
            modal() {
                if (this.modal && this.modal.contentComponent) {
                    this.contentComponent = this.modal.contentComponent
                }
            }
        },
        computed: {
            isVisible() {
                return !!this.visibility || !!this.value;
            },

	        campaignUrl() {
				return this.modal?.is_payment ? (
                        window.FluentFormApp.upgrade_url ||
                        'https://wpmanageninja.com/downloads/fluentform-pro-add-on/?utm_source=fluentform&utm_medium=wp_payment&utm_campaign=wp_plugin&utm_term=upgrade&utm_content=pop'
					) : (
						window.FluentFormApp.upgrade_url ||
                        'https://wpmanageninja.com/downloads/fluentform-pro-add-on/?utm_source=fluentform&utm_medium=wp&utm_campaign=wp_plugin&utm_term=upgrade&utm_content=pop'
				    );
            },

	        hasPro() {
				return !!window.FluentFormApp.hasPro;
            }
        },
        methods: {
            close() {
                this.$emit('update:visibility', false);
                this.$emit('input', false);
                setTimeout(() => {
                    this.contentComponent = '';
                }, 350);
            }
        }
    }
</script>