<template>
    <el-form-item>
        <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
        <el-input type="number" v-model.number="sizeInput" class="input-with-select">
            <el-select v-model="max_file_size._valueFrom" slot="prepend" placeholder="Select">
                <el-option v-for="(_, unit) in byteOptions"
                           :label="unit"
                           :value="unit"
                           :key="unit">
                </el-option>
            </el-select>
        </el-input>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue'

export default {
    name: 'maxFileSize',
    props: ['listItem', 'editItem'],
    components: {
        elLabel
    },
    data() {
        return {
            sizeInput: 0,
            byteOptions: {
                KB: 1024,
                MB: Math.pow(1024, 2)
            }
        }
    },
    computed: {
        max_file_size() {
            return this.editItem.settings.validation_rules.max_file_size;
        }
    },
    watch: {
        sizeInput() {
            this.setByUnit();
        },
        'max_file_size._valueFrom'() {
            this.setByUnit();
        }
    },
    methods: {
        setByUnit() {
            this.max_file_size.value = this.sizeInput * this.byteOptions[this.max_file_size._valueFrom]
        },
        getByUnit() {
            this.sizeInput = this.max_file_size.value / this.byteOptions[this.max_file_size._valueFrom];
        }
    },
    mounted() {
        this.getByUnit();
    }
}
</script>
