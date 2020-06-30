<template>
    <div class="ff_list_select_filter">
        <el-select clearable v-model="settings[field.key]" :placeholder="field.placeholder">
            <el-option v-for="(item,itemIndex) in listItems"
                       :key="item.label"
                       :label="item.label"
                       :value="item.value"></el-option>
        </el-select>
    </div>
</template>
<script type="text/babel">
    import each from 'lodash/each';
    export default {
        name: 'ListSelectFilter',
        props: ['settings', 'field'],
        computed: {
            listItems() {
                let filterByValue = this.settings[this.field.filter_by];
                if(this.field.parsedType == 'number') {
                    filterByValue = parseInt(filterByValue);
                }
                let formattedLists = [];
                each(this.field.options, (item) => {
                    if(item.lists.indexOf(filterByValue) != -1) {
                        formattedLists.push({
                            label: item.label,
                            value: item.value
                        });
                    }
                });
                return formattedLists;
            }
        }
    }
</script>
