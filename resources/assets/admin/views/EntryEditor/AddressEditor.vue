<template>
    <div class="addresss_editor">
        <div v-for="(eachField, fieldKey) in field.raw.fields" class="each_address_field" :key="fieldKey">
            <label>{{getLaebel(eachField)}}</label>
            <el-input type="text" size="small" v-model="model[fieldKey]"></el-input>
        </div>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'AddressEditor',
        props: ['modelValue', 'field'],
	    data() {
		    return {
			    model: this.modelValue
		    }
	    },
	    watch: {
		    model() {
			    this.$emit('update:modelValue', this.model);
		    }
	    },
        methods: {
          getLaebel(field) {
              return field.settings.admin_field_label || field.settings.label || field.attributes.name;
          }
        },
        created() {
            if (!this.model || Array.isArray(this.model)) {
                this.model = {};
            }
        }
    }
</script>