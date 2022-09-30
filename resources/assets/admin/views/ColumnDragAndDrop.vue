<template>
        <div>
            <vddl-list :drop="handleDrop" v-if="optionsToRender.length" class="ff-vddl-col_options_wrap"
                       :list="this.optionsToRender" :horizontal="false">
                <vddl-draggable :moved="handleMoved" class="optionsToRender"  v-for="(option, index) in optionsToRender" v-if="visible_columns.includes(option.value)"  :key="option.id"
                                :draggable="option"
                                :index="index"
                                :wrapper="optionsToRender"
                                effect-allowed="move">

                    <div class="vddl-column-list">

                        <vddl-handle :handle-left="20" :handle-top="20" class="handle"></vddl-handle>
                        <div class="vddl-column-name">
                            <el-button>{{option.label}}</el-button>
                        </div>

                    </div>

                </vddl-draggable>
            </vddl-list>

            <div v-else>
                <p> {{ $t('Opps, No selected columns found to display') }}</p>
            </div>

            <span slot="footer" class="dialog-footer">
                <el-button size="mini"  @click="resetColumnOrder">
                    {{ $t('Reset') }}
                </el-button>

                <el-button size="mini" type="primary" @click="saveColumnOrder">
                     {{ $t('Save') }}
                </el-button>
            </span>

        </div>
</template>

<script>
    export default {
        name: 'ColumnDragAndDrop',
        props: ['columns','columns_order','form_id','visible_columns'],
        data() {
            return {
                list : [],
                optionsToRender : [],
            }
        },
        methods: {
            handleDrop(data) {
                const {index, list, item} = data;
                item.id = new Date().getTime();
                list.splice(index, 0, item);
            },
            handleMoved(item) {
                const { index, list } = item;
                list.splice(index, 1);
            },
            createOptionsToRender() {
                //if column display order is not set initially, set default column order by formatting the original columns
                if (this.columns_order == null) {
                    let optionToRender = [];
                    let i = 0;
                    for (let key in this.columns) {
                        optionToRender.push({
                            index : i++,
                            value : key,
                            label : this.columns[key],
                        });
                    }
                    this.optionsToRender = optionToRender;
                    return;
                }
                //column display order is set
                this.optionsToRender = this.columns_order;
            },
            saveColumnOrder(){
                let data = {
                    form_id : this.form_id,
                    action : 'fluentform-save-form-entry_column_order_settings',
                    columns_order : JSON.stringify(this.optionsToRender)
                };
                FluentFormsGlobal.$post(data)
                    .then(response=>{
                        if(response.success){
                            location.reload();
                        }else{
                            this.$notify.error({
                                   title: this.$t('Oops!'),
                                   message: this.$t('Something went wrong, please try again') ,
                               offset: 30
                            });
                        }
                    })
                    .fail((error) => {
                        console.log(error)
                    });
            },
            resetColumnOrder(){
                let data = {
                    form_id: this.form_id,
                    action:'fluentform-reset-form-entry_column_order_settings',
                };
                FluentFormsGlobal.$post( data )
                    .then( response =>{
                        if(response.success){
                            location.reload();
                        }else{
                            this.$notify.error({
                                   title: this.$t('Oops!'),
                                   message: this.$t('Something went wrong, please try again') ,
                                   offset: 30
                            });
                        }
                    })
                    .fail((error) => {
                        console.log(error)
                    });
            }
        },
        mounted() {
            this.createOptionsToRender();
        }
    }
</script>

