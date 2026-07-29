<template>
<el-form-item v-if="show">
    <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
    <el-radio-group class="el-radio-button-group" size="small" v-model="model">
        <el-radio-button v-for="opt in listItem.options" :key="opt.value" :label="opt.value">{{ opt.label }}</el-radio-button>
    </el-radio-group>
</el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue'

export default {
    name: 'radioButton',
    props: ['listItem', 'value'],
    components: { elLabel },
    watch: {
        "$attrs.editItem.settings.label": function (newVal, oldVal) {
          if (newVal === '') {
            this.show = false;
            this.$emit('input', '');
          } else {
            this.show = true;
            this.$emit('input', this.model);
          }
        }
    },
    data() {
        return {
            show : true,
        }
    },
    mounted() {
        if (this.$attrs.editItem) {
            if ('label' in this.$attrs.editItem.settings && !this.$attrs.editItem.settings.label) {
              this.show = false;
              this.$emit('input', '');
            }
        }
    },
	computed: {
		model: {
			get() {
				return this.value;
			},
			set(value) {
				this.$emit('input', value)
			}
		}
	}
}
</script>
