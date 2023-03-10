<template>
    <div class="entry-repeat-field">
        <table v-if="appReady" class="editor_table">
            <thead>
            <tr>
                <th v-for="(fieldItem, fieldKey) in field.raw.fields" :key="fieldKey">{{fieldItem.settings.label}}</th>
                <th>{{ $t('Action') }}</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(rowValue, rowIndex) in formFields" :key="rowIndex">
                <td v-for="(fieldItem, fieldIndex) in field.raw.fields" :key="fieldIndex">
                    <el-input 
                        v-model="model[fieldIndex][rowIndex]" 
                        size="mini"
                        :placeholder="fieldItem.settings.label" 
                        :type="fieldItem.attributes.type"/>
                </td>
                <td>
                    <el-button @click="removeRow(rowIndex)" size="mini" icon="el-icon-minus"></el-button>
                </td>
            </tr>
            </tbody>
        </table>
        <el-button @click="initNewRow()" type="success" size="mini" icon="el-icon-plus" v-if="!rowLength">{{ $t('Add Item') }}
        </el-button>
        <el-button v-else @click="addRow()" size="mini" type="success" icon="el-icon-plus">{{ $t('Add Row') }}</el-button>
    </div>
</template>

<script type="text/babel">
    import each from 'lodash/each';

    export default {
        name: 'multi-repeat-line',
        props: ['value', 'field'],
        data() {
            return {
                appReady: false,
                model: this.value
            }
        },
        watch: {
            model() {
                this.$emit('input', this.model);
            }
        },
        methods: {
            addRow() {
                if (!this.model) {
                    this.initNewRow();
                }
                this.model[0].push('');
            },
            removeRow(index) {
                each(this.model, (item) => {
                    this.$delete(item, index);
                });
            },
            initNewRow() {
                let valueLength = this.field.raw.fields.length;
                this.model = new Array(valueLength).fill(['']);
            }
        },
        computed: {

            formFields() {
                // find the rows
                var rows = 0;
                if (this.model && this.model[0]) {
                    rows = this.model[0].length;
                }

                var columns = this.field.raw.fields.length;

                var x = new Array(rows);

                for (var i = 0; i < x.length; i++) {
                    x[i] = new Array(columns).fill('');
                }

                return x;
            },

            rowLength() {
                var length = 0;
                if (this.model && this.model[0]) {
                    length = this.model[0].length;
                }
                return new Array(length).fill('');
            }
        },
        mounted() {
            this.appReady = true;
            if (!this.model || typeof this.model != 'object') {
                this.initNewRow();
            } else {
                // value length
                var valueLength = 0;
                if (this.value && this.value[0]) {
                    valueLength = this.value.length;
                }
                let itemLength = this.field.raw.fields.length;

                if (itemLength > valueLength) {
                    let moreItem = itemLength - valueLength;
                    each(new Array(moreItem).fill(''), (item) => {
                        this.value.push([])
                    });
                }
            }

            this.appReady = true;
        }
    }
</script>