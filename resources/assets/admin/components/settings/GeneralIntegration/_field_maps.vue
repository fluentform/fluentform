<template>
    <div class="ff_merge_fields">
        <!-- Auto-Map Banner -->
        <div v-if="showAutoMapBanner && Object.keys(autoMapSuggestions).length > 0" class="ff_auto_map_banner" style="background: #f0f9eb; border: 1px solid #e1f3d8; border-radius: 4px; padding: 10px 15px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
            <span style="color: #67c23a; font-size: 13px;">
                <i class="el-icon-magic-stick"></i>
                {{ $t('Auto-mapping suggestions available') }} ({{ Object.keys(autoMapSuggestions).length }})
            </span>
            <div>
                <el-button type="success" plain size="mini" @click="acceptAllSuggestions">{{ $t('Accept All') }}</el-button>
                <el-button size="mini" @click="dismissAllSuggestions">{{ $t('Dismiss All') }}</el-button>
            </div>
        </div>

        <table v-if="appReady" class="ff_inner_table w-100">
            <thead>
                <tr>
                    <th class="text-left" width="50%" style="padding-bottom: 14px;">{{field.field_label_remote}}</th>
                    <th class="text-left" width="50%" style="padding-bottom: 14px;">{{field.field_label_local}}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(primary_field, primary_index) in field.primary_fileds" :key="primary_index">
                    <td>
                        <div :class="(primary_field.required) ? 'is-required' : ''" class="el-form-item">
                            <label class="el-form-item__label">{{primary_field.label}}
                            <template v-if="primary_field.hasOwnProperty('tips')">
                                <el-tooltip v-if="primary_field.tips" class="item" popper-class="ff_tooltip_wrap" placement="bottom-start">
                                    <div slot="content">
                                        <p v-html="primary_field.tips"></p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                </el-tooltip>
                            </template>
                            </label>
                        </div>
                    </td>
                    <td>
                        <div class="el-form-item">
                            <el-select
                                v-if="primary_field.input_options == 'emails'"
                                v-model="settings[primary_field.key]"
                                :placeholder="$t('Select a Field')"
                                style="width:100%"
                                clearable
                            >
                                <template v-for="(option, index) in inputs">
                                    <el-option
                                        v-if="option.attributes.type === 'email' || option.attributes.type === 'hidden'"
                                        :key="index"
                                        :value="option.attributes.name"
                                        :label="option.admin_label"
                                    ></el-option>
                                </template>
                            </el-select>

                            <el-select
                                v-else-if="primary_field.input_options == 'all'"
                                v-model="settings[primary_field.key]"
                                :placeholder="$t('Select a Field')"
                                style="width:100%"
                                clearable
                            >
                                <el-option
                                    v-for="(option, index) in inputs"
                                    :key="index"
                                    :value="option.attributes.name"
                                    :label="option.admin_label"
                                ></el-option>
                            </el-select>

                            <el-select
                                v-else-if="primary_field.input_options == 'select'"
                                class="w-100"
                                filterable
                                clearable
                                :multiple="primary_field.is_multiple"
                                v-model="settings[primary_field.key]"
                                :placeholder="primary_field.placeholder"
                            >
                                <el-option
                                    v-for="(option, index) in primary_field.options"
                                    :key="index"
                                    :value="index"
                                    :label="option"
                                ></el-option>
                            </el-select>

                            <template v-else>
                                <field-general
                                    :editorShortcodes="editorShortcodes"
                                    v-model="settings[primary_field.key]"
                                ></field-general>
                            </template>

                            <!-- Auto-map suggestion for primary fields -->
                            <div v-if="autoMapSuggestions['primary_' + primary_field.key]" class="ff_auto_map_suggestion" style="margin-top: 4px; padding: 4px 8px; background: #f0f9eb; border-radius: 3px; font-size: 12px; display: flex; align-items: center; justify-content: space-between;">
                                <span style="color: #67c23a;">
                                    <i class="el-icon-magic-stick"></i>
                                    {{ $t('Suggested') }}: <strong>{{ autoMapSuggestions['primary_' + primary_field.key].label }}</strong>
                                    ({{ Math.round(autoMapSuggestions['primary_' + primary_field.key].score * 100) }}% {{ $t('match') }})
                                </span>
                                <span>
                                    <el-button type="success" plain size="mini" @click="acceptSuggestion('primary_' + primary_field.key)">{{ $t('Accept') }}</el-button>
                                    <el-button size="mini" @click="rejectSuggestion('primary_' + primary_field.key)">{{ $t('Dismiss') }}</el-button>
                                </span>
                            </div>

                            <!-- Validation error for primary fields -->
                            <p v-if="validationErrors['primary_' + primary_field.key]" style="color: #f56c6c; font-size: 12px; margin-top: 4px; margin-bottom: 0;">
                                <i class="el-icon-warning"></i> {{ validationErrors['primary_' + primary_field.key] }}
                            </p>
                            <!-- Validation warning for primary fields -->
                            <p v-if="validationWarnings['primary_' + primary_field.key]" style="color: #e6a23c; font-size: 12px; margin-top: 4px; margin-bottom: 0;">
                                <i class="el-icon-warning-outline"></i> {{ validationWarnings['primary_' + primary_field.key] }}
                            </p>

                            <div style="color: #999;font-size: 12px;line-height: 15px;font-style: italic;"
                                class="primary_field_help_text"
                                v-if="primary_field.help_text"
                            >{{ primary_field.help_text }}</div>

                            <error-view field="fieldEmailAddress" :errors="errors"></error-view>
                        </div>
                    </td>
                </tr>
                <template v-for="default_field in field.default_fields">
                    <tr v-if="field.default_fields" :key="default_field.name">
                        <td>
                            <div :class="(default_field.required) ? 'is-required' : ''" class="el-form-item">
                                <label class="el-form-item__label">{{default_field.label}}</label>
                            </div>
                        </td>
                        <td>
                            <div class="el-form-item">
                                <field-general
                                    :editorShortcodes="editorShortcodes"
                                    v-model="settings.default_fields[default_field.name]"
                                ></field-general>

                                <!-- Validation error for default fields -->
                                <p v-if="validationErrors['default_' + default_field.name]" style="color: #f56c6c; font-size: 12px; margin-top: 4px; margin-bottom: 0;">
                                    <i class="el-icon-warning"></i> {{ validationErrors['default_' + default_field.name] }}
                                </p>

                                <error-view field="default_fields" :errors="errors"></error-view>
                            </div>
                        </td>
                    </tr>
                </template>
                <tr v-for="(field_name, field_index) in merge_fields" :key="field_index">
                    <td>
                        <div class="el-form-item">
                            <label class="el-form-item__label">{{ field_name }}</label>
                        </div>
                    </td>
                    <td>
                        <div class="el-form-item">
                            <field-general
                                :editorShortcodes="editorShortcodes"
                                v-model="merge_model[field_index]"
                            ></field-general>

                            <!-- Auto-map suggestion for merge fields -->
                            <div v-if="autoMapSuggestions['merge_' + field_index]" class="ff_auto_map_suggestion" style="margin-top: 4px; padding: 4px 8px; background: #f0f9eb; border-radius: 3px; font-size: 12px; display: flex; align-items: center; justify-content: space-between;">
                                <span style="color: #67c23a;">
                                    <i class="el-icon-magic-stick"></i>
                                    {{ $t('Suggested') }}: <strong>{{ autoMapSuggestions['merge_' + field_index].label }}</strong>
                                    ({{ Math.round(autoMapSuggestions['merge_' + field_index].score * 100) }}% {{ $t('match') }})
                                </span>
                                <span>
                                    <el-button type="success" plain size="mini" @click="acceptSuggestion('merge_' + field_index)">{{ $t('Accept') }}</el-button>
                                    <el-button size="mini" @click="rejectSuggestion('merge_' + field_index)">{{ $t('Dismiss') }}</el-button>
                                </span>
                            </div>
                        </div>
                    </td>
                </tr>
            </tbody>
            <!-- Preview Mapped Data -->
            <tfoot v-if="appReady">
                <tr>
                    <td colspan="2" style="padding-top: 10px;">
                        <el-button size="mini" type="info" plain @click="showPreview = !showPreview">
                            <i :class="showPreview ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
                            {{ $t('Preview Mapped Data') }}
                        </el-button>
                    </td>
                </tr>
                <tr v-if="showPreview">
                    <td colspan="2">
                        <table class="ff_inner_table w-100" style="margin-top: 8px; background: #f5f7fa; border-radius: 4px;">
                            <thead>
                                <tr>
                                    <th class="text-left" style="padding: 8px; font-size: 12px;">{{ $t('Remote Field') }}</th>
                                    <th class="text-left" style="padding: 8px; font-size: 12px;">{{ $t('Mapped Value') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(primary_field, pi) in field.primary_fileds" :key="'preview_p_' + pi">
                                    <td style="padding: 6px 8px; font-size: 12px;">{{ primary_field.label }}</td>
                                    <td style="padding: 6px 8px; font-size: 12px; font-family: monospace;">{{ settings[primary_field.key] || '—' }}</td>
                                </tr>
                                <tr v-for="default_field in field.default_fields" :key="'preview_d_' + default_field.name">
                                    <td style="padding: 6px 8px; font-size: 12px;">{{ default_field.label }}</td>
                                    <td style="padding: 6px 8px; font-size: 12px; font-family: monospace;">{{ (settings.default_fields && settings.default_fields[default_field.name]) || '—' }}</td>
                                </tr>
                                <tr v-for="(field_name, field_index) in merge_fields" :key="'preview_m_' + field_index">
                                    <td style="padding: 6px 8px; font-size: 12px;">{{ field_name }}</td>
                                    <td style="padding: 6px 8px; font-size: 12px; font-family: monospace;">{{ (merge_model && merge_model[field_index]) || '—' }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
            </tfoot>
        </table>
    </div>
</template>

<script type="text/babel">
    import ErrorView from '../../../../common/errorView';
    import FieldGeneral from './_FieldGeneral'

    const SYNONYM_MAP = {
        'email': ['email_address', 'e_mail', 'emailaddress', 'subscriber_email'],
        'first_name': ['fname', 'firstname', 'given_name', 'first'],
        'last_name': ['lname', 'lastname', 'surname', 'family_name', 'last'],
        'phone': ['telephone', 'phone_number', 'mobile', 'cell', 'tel'],
        'address': ['street_address', 'address_line_1', 'street'],
        'city': ['town'],
        'state': ['province', 'region'],
        'zip': ['postal_code', 'zipcode', 'zip_code', 'postcode'],
        'country': ['nation'],
        'company': ['organization', 'organisation', 'company_name', 'business'],
        'website': ['url', 'web', 'site', 'homepage'],
        'name': ['full_name', 'fullname'],
    };

    export default {
        name: 'field_maps',
        components: {
            ErrorView,
            FieldGeneral
        },
        props: ['settings', 'merge_fields', 'field', 'inputs', 'errors', 'merge_model', 'editorShortcodes'],
        data() {
            return {
                appReady: false,
                validationErrors: {},
                validationWarnings: {},
                showPreview: false,
                autoMapSuggestions: {},
                showAutoMapBanner: true
            }
        },
        computed: {
            localFieldsFlat() {
                let fields = [];
                if (this.inputs && Array.isArray(this.inputs)) {
                    this.inputs.forEach(input => {
                        fields.push({
                            code: input.attributes.name,
                            label: input.admin_label || input.attributes.name,
                            type: input.attributes.type || 'text'
                        });
                    });
                }
                if (this.editorShortcodes) {
                    Object.keys(this.editorShortcodes).forEach(group => {
                        let shortcodes = this.editorShortcodes[group];
                        if (typeof shortcodes === 'object') {
                            Object.keys(shortcodes).forEach(code => {
                                if (!fields.find(f => f.code === code)) {
                                    fields.push({
                                        code: code,
                                        label: shortcodes[code] || code,
                                        type: 'text'
                                    });
                                }
                            });
                        }
                    });
                }
                return fields;
            }
        },
        watch: {
            merge_fields: {
                handler() {
                    if (this.appReady) {
                        this.runAutoMap();
                    }
                },
                deep: true
            },
            settings: {
                handler() {
                    if (this.appReady) {
                        this.validateFields();
                    }
                },
                deep: true
            }
        },
        methods: {
            // --- Validation Methods ---
            validate() {
                this.validationErrors = {};
                this.validationWarnings = {};
                let hasErrors = false;

                // Validate primary fields
                if (this.field.primary_fileds) {
                    this.field.primary_fileds.forEach(pf => {
                        if (pf.required && !this.settings[pf.key]) {
                            this.$set(this.validationErrors, 'primary_' + pf.key, pf.label + ' is required');
                            hasErrors = true;
                        }
                        // Type mismatch warning: email field mapped to non-email input
                        if (pf.input_options === 'emails' && this.settings[pf.key]) {
                            let mappedInput = this.inputs && this.inputs.find(i => i.attributes.name === this.settings[pf.key]);
                            if (mappedInput && mappedInput.attributes.type !== 'email' && mappedInput.attributes.type !== 'hidden') {
                                this.$set(this.validationWarnings, 'primary_' + pf.key, 'This field expects an email input but a ' + mappedInput.attributes.type + ' field is mapped');
                            }
                        }
                    });
                }

                // Validate default fields
                if (this.field.default_fields) {
                    this.field.default_fields.forEach(df => {
                        if (df.required && this.settings.default_fields && !this.settings.default_fields[df.name]) {
                            this.$set(this.validationErrors, 'default_' + df.name, df.label + ' is required');
                            hasErrors = true;
                        }
                    });
                }

                return !hasErrors;
            },
            validateFields() {
                this.validationErrors = {};
                this.validationWarnings = {};

                // Validate primary fields
                if (this.field.primary_fileds) {
                    this.field.primary_fileds.forEach(pf => {
                        if (pf.required && !this.settings[pf.key]) {
                            this.$set(this.validationErrors, 'primary_' + pf.key, pf.label + ' is required');
                        }
                        if (pf.input_options === 'emails' && this.settings[pf.key]) {
                            let mappedInput = this.inputs && this.inputs.find(i => i.attributes.name === this.settings[pf.key]);
                            if (mappedInput && mappedInput.attributes.type !== 'email' && mappedInput.attributes.type !== 'hidden') {
                                this.$set(this.validationWarnings, 'primary_' + pf.key, 'This field expects an email input but a ' + mappedInput.attributes.type + ' field is mapped');
                            }
                        }
                    });
                }

                if (this.field.default_fields) {
                    this.field.default_fields.forEach(df => {
                        if (df.required && this.settings.default_fields && !this.settings.default_fields[df.name]) {
                            this.$set(this.validationErrors, 'default_' + df.name, df.label + ' is required');
                        }
                    });
                }
            },

            // --- Auto-Mapping Methods ---
            calculateSimilarity(str1, str2) {
                if (!str1 || !str2) return 0;

                let s1 = str1.toLowerCase().replace(/[_\-]/g, ' ').trim();
                let s2 = str2.toLowerCase().replace(/[_\-]/g, ' ').trim();

                // Exact match
                if (s1 === s2) return 1.0;

                // Synonym match
                for (let canonical in SYNONYM_MAP) {
                    let synonyms = [canonical, ...SYNONYM_MAP[canonical]];
                    let normalizedSynonyms = synonyms.map(s => s.replace(/[_\-]/g, ' '));
                    let s1Match = normalizedSynonyms.includes(s1);
                    let s2Match = normalizedSynonyms.includes(s2);
                    if (s1Match && s2Match) return 0.95;
                }

                // Contains match
                if (s1.includes(s2) || s2.includes(s1)) return 0.70;

                // Word overlap
                let words1 = s1.split(/\s+/);
                let words2 = s2.split(/\s+/);
                let overlap = words1.filter(w => words2.includes(w)).length;
                let maxWords = Math.max(words1.length, words2.length);
                if (maxWords > 0 && overlap > 0) {
                    return 0.65 * (overlap / maxWords);
                }

                return 0;
            },
            runAutoMap() {
                let suggestions = {};
                let localFields = this.localFieldsFlat;
                if (!localFields.length) return;

                // Auto-map primary fields
                if (this.field.primary_fileds) {
                    this.field.primary_fileds.forEach(pf => {
                        if (this.settings[pf.key]) return; // Already mapped
                        let bestMatch = null;
                        let bestScore = 0;

                        localFields.forEach(lf => {
                            let score = Math.max(
                                this.calculateSimilarity(pf.label, lf.label),
                                this.calculateSimilarity(pf.key, lf.code)
                            );
                            if (score > bestScore && score >= 0.65) {
                                bestScore = score;
                                bestMatch = lf;
                            }
                        });

                        if (bestMatch) {
                            suggestions['primary_' + pf.key] = {
                                value: bestMatch.code,
                                label: bestMatch.label,
                                score: bestScore,
                                targetKey: pf.key,
                                targetType: 'primary'
                            };
                        }
                    });
                }

                // Auto-map merge fields
                if (this.merge_fields && typeof this.merge_fields === 'object') {
                    Object.keys(this.merge_fields).forEach(fieldIndex => {
                        let fieldName = this.merge_fields[fieldIndex];
                        if (this.merge_model && this.merge_model[fieldIndex]) return; // Already mapped

                        let bestMatch = null;
                        let bestScore = 0;

                        localFields.forEach(lf => {
                            let score = Math.max(
                                this.calculateSimilarity(fieldName, lf.label),
                                this.calculateSimilarity(fieldIndex, lf.code)
                            );
                            if (score > bestScore && score >= 0.65) {
                                bestScore = score;
                                bestMatch = lf;
                            }
                        });

                        if (bestMatch) {
                            suggestions['merge_' + fieldIndex] = {
                                value: '{inputs.' + bestMatch.code + '}',
                                label: bestMatch.label,
                                score: bestScore,
                                targetKey: fieldIndex,
                                targetType: 'merge'
                            };
                        }
                    });
                }

                this.autoMapSuggestions = suggestions;
                this.showAutoMapBanner = Object.keys(suggestions).length > 0;
            },
            acceptSuggestion(suggestionId) {
                let suggestion = this.autoMapSuggestions[suggestionId];
                if (!suggestion) return;

                if (suggestion.targetType === 'primary') {
                    this.$set(this.settings, suggestion.targetKey, suggestion.value);
                } else if (suggestion.targetType === 'merge') {
                    this.$set(this.merge_model, suggestion.targetKey, suggestion.value);
                }

                this.$delete(this.autoMapSuggestions, suggestionId);
                if (Object.keys(this.autoMapSuggestions).length === 0) {
                    this.showAutoMapBanner = false;
                }
            },
            rejectSuggestion(suggestionId) {
                this.$delete(this.autoMapSuggestions, suggestionId);
                if (Object.keys(this.autoMapSuggestions).length === 0) {
                    this.showAutoMapBanner = false;
                }
            },
            acceptAllSuggestions() {
                let keys = Object.keys(this.autoMapSuggestions);
                keys.forEach(key => {
                    this.acceptSuggestion(key);
                });
            },
            dismissAllSuggestions() {
                this.autoMapSuggestions = {};
                this.showAutoMapBanner = false;
            }
        },
        mounted() {
            if (Array.isArray(this.merge_model) || !this.merge_model) {
                this.$emit('merge-model');
            }
            this.appReady = true;
            this.$nextTick(() => {
                this.runAutoMap();
            });
        }

    };
</script>
