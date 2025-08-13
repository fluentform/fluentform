<template>
    <div class="ff_inventory_list_wrap">
        <section-head size="sm">
            <h1 class="ff_section_title">{{$t('Inventory')}}</h1>
        </section-head>

        <div class="separator mb-4"></div>

        <div class="list_container">
            <el-collapse v-model="activeItems" v-if="Object.entries(items).length">
                <el-collapse-item :title="item.label" :name="index" v-for="(item,index) in items" :key="index">
                    <el-table
                            border
                            v-if="item.options.length"
                            :data="item.options"
                            style="width: 100%">
                        <el-table-column
                                prop="label"
                                :label="$t('Name')"
                               >
                        </el-table-column>
                        <el-table-column
                                prop="quantity"
                                :label="$t('Total')"
                               >
                        </el-table-column>
                        <el-table-column
                            prop="remaining"
                            :label="$t('Stock')"
                            >
                            <template #default="scope">
                                <label v-html="scope.row.remaining"></label>
                            </template>
                        </el-table-column>
                    </el-table>
                    <span v-else>
                        {{empty_text}}
                    </span>
                </el-collapse-item>
            </el-collapse>
            <div v-else>
                <el-collapse v-model="activeEmptyItems" v-if="Object.entries(inventory_fields).length">
                    <el-collapse-item :title="item.label" :name="index" v-for="(item,index) in inventory_fields" :key="index">
                        {{empty_text}}
                    </el-collapse-item>
                </el-collapse>

            </div>
        </div>
    </div>

</template>

<script>
    import SectionHead from '@fluentform/admin/components/SectionHead/SectionHead.vue';
    import SectionHeadContent from '@fluentform/admin/components/SectionHead/SectionHeadContent.vue';
    export default {
        data() {
            return {
                counter : 0,
                activeItems: [''],
                activeEmptyItems: [''],
                items : window.fluentform_inventory_list_vars.submissions,
                inventory_fields : window.fluentform_inventory_list_vars.inventory_fields,
                empty_text : window.fluentform_inventory_list_vars.no_found_text,
            };
        },
        components: {
            SectionHead,
            SectionHeadContent
        },
        methods: {
            getActiveName(){
                    if (this.items){
                        return Object.keys(this.items)[0];
                    }
            }
        },
        mounted() {
            if (this.items){
                this.activeItems =  Object.keys(this.items)[0];
            }
            if (this.inventory_fields){
                this.activeEmptyItems =  Object.keys(this.inventory_fields)[0];
            }
        },
	    beforeCreate() {
		    jQuery('title').text('Inventory - Fluentform');
	    },
    }
</script>

