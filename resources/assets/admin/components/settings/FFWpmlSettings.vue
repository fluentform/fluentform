<template>
    <div class="ff-wpml-settings">
        <card v-if="ff_wpml" id="ff_wpml">
            <card-head>
                <h5 class="title">{{ $t('Translations using WPML') }}</h5>
                <p class="text">
                    {{ $t('Enable translations using WPML Core and WPML String Translations Plugin.') }}
                </p>
            </card-head>
            <card-body>
                <el-form label-position="top">
                    <el-row :gutter="24">
                        <el-col>
                            <el-checkbox true-label="yes" false-label="no" v-model="ff_wpml.enabled">
                                {{ $t('Update Form Translations')}}
                            </el-checkbox>
                        </el-col>
                        <el-col v-if="ff_wpml.enabled === 'yes'">
                            <el-tabs v-model="activeLanguageTab">
                                <el-tab-pane
                                    v-for="(language, languageCode) in nonDefaultLanguages"
                                    :key="languageCode"
                                    :label="language.display_name"
                                    :name="languageCode"
                                >
                                    <template v-for="(item, index) in ff_wpml.strings">
                                        <div class="el-form-item__content mb-2" :key="index">
                                            <el-row :gutter="24">
                                                <el-col :span="8">
                                                    {{ item.value }}
                                                </el-col>
                                                <el-col :span="16">
                                                    <el-input
                                                        :placeholder="$t('Translate')"
                                                        :value="getTranslationValue(item, languageCode)"
                                                        @input="updateTranslation(item, languageCode, $event)"
                                                    />
                                                    <p class="text">{{item.identifier}}</p>
                                                </el-col>
                                            </el-row>
                                        </div>
                                    </template>
                                </el-tab-pane>
                            </el-tabs>
                        </el-col>
                    </el-row>
                    <div class="mt-4">
                        <el-button
                            :loading="saving"
                            type="primary"
                            icon="el-icon-success"
                            @click="saveSettings">
                            {{saving ? $t('Saving ') : $t('Save ')}} {{ $t('Settings') }}
                        </el-button>
                        <el-tooltip class="item" effect="dark" :content="$t('Click to reset the settings')" placement="top-start" v-if="ff_wpml.enabled">
                            <el-button
                                type="danger"
                                icon="el-icon-delete"
                                :loading="saving"
                                @click="deleteSettings">
                                {{ deleting ? $t('Resetting ') : $t('Reset ') }} {{ $t('WPML Settings') }}
                            </el-button>
                        </el-tooltip>
                    </div>
                </el-form>
            </card-body>
        </card>
    </div>
</template>

<script type="text/babel">
import errorView from '@/common/errorView';
import Card from '@/admin/components/Card/Card.vue';
import CardHead from '@/admin/components/Card/CardHead.vue';
import CardHeadGroup from '@/admin/components/Card/CardHeadGroup.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import Notice from '@/admin/components/Notice/Notice.vue';
import TabItem from "@/admin/components/Tab/TabItem.vue";
import TabLink from "@/admin/components/Tab/TabLink.vue";

export default {
    name: 'QuizSettings',
    props: ['form', 'editorShortcodes', 'inputs'],
    components: {
        TabLink,
        TabItem,
        errorView,
        Card,
        CardHead,
        CardHeadGroup,
        CardBody,
        Notice,
    },
    data() {
        return {
            ff_wpml: false,
            activeLanguageTab: null,
            saving: false,
            deleting: false,
        }
    },
    computed: {
        nonDefaultLanguages() {
            if (!this.ff_wpml || !this.ff_wpml.available_languages) {
                return {};
            }

            const allLanguages = this.ff_wpml.available_languages;
            const defaultLanguageCode = this.ff_wpml.default_language;

            const nonDefaultLanguageEntries = Object.entries(allLanguages)
                .filter(([languageCode, languageInfo]) => languageCode !== defaultLanguageCode);

            return nonDefaultLanguageEntries.reduce((nonDefaultLangs, [languageCode, languageInfo]) => {
                nonDefaultLangs[languageCode] = languageInfo;
                return nonDefaultLangs;
            }, {});
        },
        firstNonDefaultLanguageCode() {
            return Object.keys(this.nonDefaultLanguages)[0] || null;
        }
    },
    watch: {
        'ff_wpml.enabled': {
            immediate: true,
            handler(newValue) {
                if (newValue === 'yes' && this.firstNonDefaultLanguageCode) {
                    this.activeLanguageTab = this.firstNonDefaultLanguageCode;
                }
            }
        }
    },
    methods: {
        getSettings() {
            this.loading = true;
            FluentFormsGlobal.$get({
                action: 'fluentform_get_wpml_settings',
                form_id: this.form.id,
            })
                .then(response => {
                    this.ff_wpml = response;
                })
                .fail(error => {
                })
                .always(() => {
                    this.loading = false;
                });
        },
        saveSettings() {
            this.saving = true;
            FluentFormsGlobal.$post({
                action: 'fluentform_store_wpml_settings',
                form_id: this.form.id,
                ff_wpml: JSON.stringify(this.ff_wpml)
            })
                .then(response => {
                    this.$success(response.data);
                })
                .fail(error => {
                    console.log(error)
                    this.$fail(error.responseJSON.data);
                })
                .always(() => {
                    this.saving = false;
                });
        },
        deleteSettings() {
            this.deleting = true;
            this.$confirm(
                this.$t('This will permanently reset the WPML settings. Continue?'),
                this.$t('Warning'),
                {
                    confirmButtonText: this.$t('Reset'),
                    cancelButtonText: this.$t('Cancel'),
                    confirmButtonClass: 'el-button--soft el-button--danger',
                    cancelButtonClass: 'el-button--soft el-button--success',
                    type: 'warning'
                }).then(() => {
                FluentFormsGlobal.$post({
                    action: 'fluentform_delete_wpml_settings',
                    form_id: this.form.id,
                    ff_wpml: JSON.stringify(this.ff_wpml)
                })
                    .then(response => {
                        this.$success(response.data);
                        this.getSettings();
                    })
                    .fail(error => {
                        this.$fail(error.responseJSON.data);
                    })
                    .always(() => {
                        this.deleting = false;
                    });
            }).catch(() => {
                this.deleting = false;
            })
        },
        getTranslationValue(item, languageCode) {
            if (!item.translations) {
                return '';
            }
            if (typeof item.translations === 'object' && !Array.isArray(item.translations)) {
                return item.translations[languageCode] || '';
            }
            return '';
        },
        updateTranslation(item, languageCode, value) {
            if (!item.translations) {
                this.$set(item, 'translations', {});
            }
            if (typeof item.translations === 'object' && !Array.isArray(item.translations)) {
                this.$set(item.translations, languageCode, value);
            } else {
                this.$set(item, 'translations', { [languageCode]: value });
            }
        }
    },
    mounted() {
        this.getSettings();
        jQuery('head title').text('WPML Translations - Fluent Forms');
    }
}
</script>
