<template>
    <el-form-item>
        <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>

        <el-select v-model="model" size="mini">
            <el-option v-for="(email, emailKey) in available_fields" :key="emailKey" :value="emailKey" :label="email">
            </el-option>
        </el-select>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue'

export default {
    name: 'targetField',
    props: ['listItem', 'value', 'form_items'],
    components: {
        elLabel
    },
    computed: {
        available_fields() {
          let fields = {};
          this.mapElements(this.form_items, (formItem) => {

              if(formItem.element === this.listItem.target_element) {
                    fields[formItem.attributes.name] = formItem.settings.label;
                }
            });
            return fields;
        }
    },
    watch: {
        model() {
            this.$emit('input', this.model);
        }
    },
    data() {
        return {
            model: this.value,
        }
    },
    mounted() {
        if(!this.model || !this.available_fields[this.model]) {
            if(Object.keys(this.available_fields).length) {
                let firstItem = Object.keys(this.available_fields)[0];
                this.$set(this, 'model', firstItem)
            }
        }
    }
}
</script>
