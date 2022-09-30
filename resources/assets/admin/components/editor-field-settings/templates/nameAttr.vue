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
    <el-form-item>
        <div v-if="isDisabled === false && this.maybeDisableEdit()" role="alert"
             class="el-alert el-alert--warning is-light">
            <i class="el-alert__icon el-icon-warning"></i>
            <div class="el-alert__content">
                <span class="el-alert__title">{{ $t('Please note that it is recommended to not change name attributes, doing so will break conditional & integrations field mapping.You will need to recreate these with the new value.') }}</span>
            </div>
        </div>
    </el-form-item>
    </div>
</template>

<script>
import elLabel from '../../includes/el-label.vue'

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
        elLabel
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
            let isCaptcha = this.value == 'g-recaptcha-response' || this.value == 'h-captcha-response';
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
