<template>
    <div :class="{'ff_backdrop': modelValue}" class="disabled-info" v-if="modal">
        <el-dialog
            :model-value="modelValue"
            @update:model-value="$emit('update:modelValue', $event)"
            :before-close="close"
            :width="modal.video || modal.image ? '74%' : '50%'"
        >
            <template #header>
                <h4>{{ !modal ? $t('Field disabled') : '' }}</h4>
            </template>

            <template v-if="contentComponent">
                <component :is="contentComponent"></component>
            </template>

            <template v-else-if="modal && !modal.disable_html">
                <el-row :gutter="25" class="items-center">
                    <el-col v-if="modal.video || modal.image" :span="12">
                        <div v-if="modal.video" class="video-wrapper mr-3">
                            <iframe
                                style="width: 100%; height: 300px; border-radius: 10px;"
                                :src="modal.video"
                                :title="$t('YouTube video player')"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen
                            />
                        </div>
                        <div v-else class="mr-3">
                            <img class="w-100 img-thumb" :src="modal.image" :alt="modal.title"/>
                        </div>
                    </el-col>

                    <el-col :span="modal.video || modal.image ? 12 : 24">
                        <div class="video-content">
                            <div class="ff_icon_btn mb-4" v-if="!modal.hidePro">
                                <i class="ff-edit-password el-icon"/>
                            </div>
                            <h3 class="mb-3 title">{{ modal.title }}</h3>
                            <p class="text">{{ modal.description }}</p>
                            <a class="el-button mt-2 el-button--primary" v-if="!modal.hidePro" target="_blank"
                               :href="campaignUrl">
                                {{ $t('Upgrade to PRO') }}
                            </a>
                        </div>
                    </el-col>
                </el-row>
            </template>

            <div v-else-if="modal && modal.disable_html" v-html="modal.disable_html"></div>

            <div v-else>
                <p>{{ $t('This field is only available on pro add - on') }}</p>
                <a target="_blank"
                   class="el-button el-button--danger"
                   :href="campaignUrl">
                    {{ $t('Upgrade to Pro Now') }}
                </a>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import recaptcha from './Recaptcha.vue';
import hcaptcha from './Hcaptcha.vue';
import turnstile from './Turnstile.vue';

export default {
    name: 'ItemDisabled',
    props: {
        modelValue: {
            type: Boolean,
            required: true
        },
        modal: {
            type: Object,
            required: true
        },
        fieldType: {
            type: String,
            required: true
        }
    },
    emits: ['update:modelValue'],
    components: {hcaptcha, recaptcha, turnstile},
    data() {
        return {
            contentComponent: this.fieldType,
        }
    },
    watch: {
        modal: {
            handler(newModal) {
                if (newModal && newModal.contentComponent) {
                    this.contentComponent = newModal.contentComponent
                }
            },
            immediate: true
        }
    },
    computed: {
        campaignUrl() {
            return this.modal?.is_payment
                ? (window.FluentFormApp.upgrade_url || 'https://wpmanageninja.com/downloads/fluentform-pro-add-on/?utm_source=fluentform&utm_medium=wp_payment&utm_campaign=wp_plugin&utm_term=upgrade&utm_content=pop')
                : (window.FluentFormApp.upgrade_url || 'https://wpmanageninja.com/downloads/fluentform-pro-add-on/?utm_source=fluentform&utm_medium=wp&utm_campaign=wp_plugin&utm_term=upgrade&utm_content=pop');
        },
        hasPro() {
            return !!window.FluentFormApp.hasPro;
        }
    },
    methods: {
        close() {
            this.$emit('update:modelValue', false);
            setTimeout(() => {
                this.contentComponent = '';
            }, 350);
        }
    }
}
</script>