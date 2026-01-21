<template>
    <div>
        <el-form-item>
            <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
            <el-input
                    :disabled="isDisabled"
                    :value="value"
                    :type="listItem.type"
                    ref="nameAttribute"
                    @input="modify"
                    @blur="onBlur"
            >
                <el-button  v-if="(isDisabled === true || this.maybeDisableEdit()) && !this.isCaptcha() "  slot="append" type="warning" icon="el-icon-edit" @click=" isDisabled = !isDisabled"></el-button>
            </el-input>
        </el-form-item>
        <el-form-item v-if="isDisabled === false && this.maybeDisableEdit()">
            <notice type="danger">
                <div class="ff_alert_group">
                    <i class="ff_alert_icon el-icon-warning"></i>
                    <div class="ff_alert_content">
                        <span>{{ $t('It is not recommended to change the name attribute, as this will break conditional logic and integration field mappings. If you proceed, you will need to recreate these mappings with the updated value. Additionally, the connection with submission values will be lost, meaning existing submissions containing this field will no longer be displayed.') }}</span>
                    </div>
                </div>
            </notice>
        </el-form-item>
    </div>
</template>

<script>
import elLabel from '../../includes/el-label.vue'
import Notice from '../../Notice/Notice.vue';

export default {
    name: 'nameAttribute',
    props: ['listItem', 'value','editItem'],
    data(){
        return {
            isDisabled : false,
            usedNames : window.FluentFormApp.used_name_attributes,
        }
    },
    components: {
        elLabel,
        Notice
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
            if (this.isCaptcha()){
                return  true;
            }
            let matched = [];
            if (this.usedNames) {
                matched = this.usedNames.filter(name => name.field_name === this.value)
            }
            return !!matched.length;
        },
        isCaptcha(){
            let isCaptcha = this.value == 'g-recaptcha-response' || this.value == 'h-captcha-response' || this.value == 'cf-turnstile-response';
            
            if (!isCaptcha && typeof window !== 'undefined' && window.fluentformExternalCaptchaFieldNames) {
                isCaptcha = window.fluentformExternalCaptchaFieldNames.indexOf(this.value) !== -1;
            }
            
            return isCaptcha;
        }

    },
    mounted() {
        if(this.maybeDisableEdit()){
            this.isDisabled = true;
        }
    }
};
</script>
