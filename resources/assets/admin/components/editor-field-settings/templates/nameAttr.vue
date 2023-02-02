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
                class="ff_input_group_append"
            >
                <el-button v-if="(isDisabled === true || this.maybeDisableEdit()) && !this.isCaptcha() " slot="append" icon="el-icon-edit" @click=" isDisabled = !isDisabled"></el-button>
            </el-input>
        </el-form-item>
        <el-form-item>
            <el-alert
                class="items-start"
                v-if="isDisabled === false && this.maybeDisableEdit()"
                type="warning"
                :description="$t('Please note that it is recommended to not change name attributes, doing so will break conditional & integrations field mapping.You will need to recreate these with the new value.')"
                show-icon
                :closable="false"
            >
            </el-alert>
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
            let isCaptcha = this.value == 'g-recaptcha-response' || this.value == 'h-captcha-response' || this.value == 'cf-turnstile-response';
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
