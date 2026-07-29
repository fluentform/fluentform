<template>
    <withLabel :item="item">
        <table class="checkable-grids el-fluid">
            <thead>
                <tr>
                    <th></th>
                    <th v-for="(tableHeader, i) in tableHeaders" :key="i">
                        {{ tableHeader }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(row, i) in tabluarData" :key="i">
                    <td>{{ row.label }}</td>
                    <td v-for="(col, i) in row.columns" :key="i">
                        <input :type="fieldType" :checked="isChecked(col, row)">
                    </td>
                </tr>
            </tbody>
        </table>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'checkableGrids',
    props: ['item'],
    components: {
        withLabel
    },
    computed: {
        fieldType() {
            return this.item.settings.tabular_field_type;
        },

        tableHeaders() {
            return Object.values(this.item.settings.grid_columns);
        },

        defaultChecked() {
            return this.item.settings.selected_grids;
        },

        tabluarData() {
            const table = [];
            const rows = this.item.settings.grid_rows;
		    const columns = this.item.settings.grid_columns;
            
            _ff.each(rows, (rowValue, rowKey) => {
                const row = {
                    name: rowKey,
                    label: rowValue,
                    columns: []
                };
                _ff.each(columns, (columnValue, columnKey) => {
                    row.columns.push({
                        name: columnKey,
                        label: columnValue
                    });
                });
                table.push(row);
            });

            return table;
        }
    },
    methods: {
        isChecked(column, row) {
            const rowChecked = this.defaultChecked.includes(row.name);
            const colChecked = this.defaultChecked.includes(column.name);

            return rowChecked ? rowChecked : colChecked;
        }
    }
}
</script>
