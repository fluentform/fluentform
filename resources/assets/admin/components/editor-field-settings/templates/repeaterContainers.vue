<template>
    <div>
        <el-form-item >
            <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
            <el-select v-if="!listItem.disable_labels" filterable
                       id="settings_column_list"
                       v-model="editItem.settings.repeater_columns"
                       :placeholder="$t('None')"
                       @change="updateColumnNumber"
                       class="el-fluid">
                <el-option
                        v-for="value in [1, 2, 3, 4, 5, 6]"
                        :value="value"
                        :key="value">
                    {{ value }}
                </el-option>
            </el-select>
        </el-form-item>

    </div>
</template>

<script>
    import elLabel from '../../includes/el-label.vue';
    import fieldOptionSettings from './fieldOptionSettings.vue';
    import inputText from './inputText.vue'
    import inputDefaultValue from './inputValue.vue'
    import validationRules from './validationRules.vue'

    export default {
        name: 'repeaterContainers',
        props: ['listItem', 'editItem'],
        components: {
            elLabel,
            inputText,
            inputDefaultValue,
            validationRules,
            fieldOptionSettings
        },
        computed: {

        },
        watch: {

        },
        methods: {
            updateColumnNumber(val) {
                console.log(val)
                this.updateColumns(val);
            },
            updateColumns(numColumns) {
                if (!Array.isArray(this.editItem.columns)) {
                    this.editItem.columns = [];
                }
                if (numColumns < 1) numColumns = 1;

                const existingColumns = [...this.editItem.columns];  // Copy the existing columns

                this.editItem.columns = Array.from({length: numColumns}, (_, i) => {
                    return existingColumns[i] || {width: 50, fields: []};
                });
            }
        },
        mounted() {
            console.log(this.editItem)
        }
    }
</script>
