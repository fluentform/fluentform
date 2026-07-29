<template>
    <el-form-item>
        <elLabel
            slot="label"
            v-if="listItem.label"
            :label="listItem.label"
            :helpText="listItem.help_text"
        ></elLabel>

        <el-checkbox-group class="el-fluid el-checkbox-horizontal" v-model="model">
            <el-checkbox
                v-for="(opt, i) in listItem.options"
                :label="opt.value"
                :key="i"
            >{{ opt.label }}</el-checkbox>
            <p class="ff_tips_warning" v-if="isTermsAndConditionElement && !model">{{ $t('If Terms and Conditions checkbox is hidden (appears unchecked), please avoid marking this field as required. This ensures your forms will submit properly without any issues.') }}</p>
        </el-checkbox-group>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue'

export default {
    name: 'inputCheckbox',
    props: ['listItem', 'value'],
    components: { elLabel },
	computed: {
		model: {
			get() {
				return this.value;
			},
			set(value) {
				this.$emit('input', value)
			}
		},
        isTermsAndConditionElement() {
            return this.$attrs?.editItem?.element === 'terms_and_condition';
        }
	}
};
</script>
