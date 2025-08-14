<template>
    <div>
        <el-form-item>
            <template #label>
                <el-label :label="listItem.label" :helpText="listItem.help_text"></el-label>
            </template>

            <el-input
                v-model="model"
                :disabled="isDisabled"
                :type="listItem.type"
                ref="nameAttribute"
                @blur="onBlur"
            >
                <template #append v-if="shouldShowButton">
                    <el-button
                        v-if="shouldShowButton"
                        type="warning"
                        icon="el-icon-edit"
                        @click="isDisabled = !isDisabled"
                    ></el-button>
                </template>
            </el-input>
        </el-form-item>

        <el-form-item v-if="!isDisabled && maybeDisableEdit()">
            <notice type="danger">
                <div class="ff_alert_group">
                    <i class="ff_alert_icon el-icon-warning"></i>
                    <div class="ff_alert_content">
                        <span>
                            {{
                                $t('Please note that it is recommended to not change name attributes, doing so will break conditional & integrations field mapping.You will need to recreate these with the new value.')
                            }}
                        </span>
                    </div>
                </div>
            </notice>
        </el-form-item>
    </div>
</template>

<script>
import elLabel from '../../includes/el-label.vue';
import Notice from '../../Notice/Notice.vue';

export default {
    name: 'nameAttribute',
    props: ['listItem', 'modelValue', 'editItem'],
    data() {
        return {
            isDisabled: false,
            usedNames: window.FluentFormApp.used_name_attributes,
            model: this.modelValue,
        };
    },
    components: {
        elLabel,
        Notice,
    },
    methods: {
        modify(value) {
            const modName = value.replace(/[^a-zA-Z0-9_]/g, '_');
            this.$emit('input', modName);
        },
        onBlur(e) {
            if (!e.target.value.trim()) {
                let item = this.$attrs.editItem;
                item.attributes.name = this.getRandomName(item);
                this.makeUniqueNameAttr(this.$attrs.form_items, item);
            }
        },
        getRandomName(item) {
            let prefix = item.element || 'el_';
            let name = `${prefix}_${Math.random().toString(36).substring(7)}`;

            return name.replace(/[^a-zA-Z0-9_]/g, '_');
        },
        maybeDisableEdit() {
            if (this.isCaptcha()) {
                return true;
            }
            let matched = [];
            if (this.usedNames) {
                matched = this.usedNames.filter(name => name.field_name === this.modelValue);
            }
            return !!matched.length;
        },
        isCaptcha() {
            return (
                this.modelValue === 'g-recaptcha-response' ||
                this.modelValue === 'h-captcha-response' ||
                this.modelValue === 'cf-turnstile-response'
            );
        },
    },
    computed: {
        shouldShowButton() {
            return (this.isDisabled || this.maybeDisableEdit()) && !this.isCaptcha();
        }
    },
    watch: {
        model() {
            this.$emit('update:modelValue', this.model);
        },
    },
    mounted() {
        if (this.maybeDisableEdit()) {
            this.isDisabled = true;
        }
    },
};
</script>
