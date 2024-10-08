<template>
    <div>
        <draggable
            v-model="optionsToRender"
            v-if="optionsToRender.length"
            class="ff-vddl-col_options_wrap"
            item-key="id"
            @end="onEnd"
        >
            <template #item="{element, index}">
                <div v-if="visible_columns.includes(element.value)" class="optionsToRender">
                    <div class="vddl-column-list">
                        <i class="handle"></i>
                        <div class="vddl-column-name">
                            <el-button>{{ element.label }}</el-button>
                        </div>
                    </div>
                </div>
            </template>
        </draggable>

        <div v-else>
            <p>{{ $t('Oops, No selected columns found to display') }}</p>
        </div>

        <div class="mt-5">
            <el-button type="primary" @click="saveColumnOrder()" size="default">
                {{ $t('Save') }}
            </el-button>
            <el-button @click="resetColumnOrder()" type="info" size="default" class="el-button--soft">
                {{ $t('Reset') }}
            </el-button>
        </div>
    </div>
</template>

<script>
export default {
    name: "ColumnDragAndDrop",
    props: ["columns", "columns_order", "form_id", "visible_columns"],
    data() {
        return {
            optionsToRender: [],
        };
    },
    methods: {
        onEnd(event) {
            // This method will be called when dragging ends
            // You can perform any additional logic here if needed
        },
        createOptionsToRender() {
            if (this.columns_order == null || this.columns_order === "") {
                let optionToRender = [];
                let i = 0;
                for (let key in this.columns) {
                    optionToRender.push({
                        id: i,
                        index: i++,
                        value: key,
                        label: this.columns[key],
                    });
                }
                this.optionsToRender = optionToRender;
            } else {
                this.optionsToRender = this.columns_order.map((item, index) => ({
                    ...item,
                    id: index
                }));
            }
        },
        saveColumnOrder(settings) {
            settings = settings === undefined ? this.optionsToRender : settings;

            const data = {
                meta_key: "_columns_order",
                settings: settings ? JSON.stringify(settings) : null,
            };

            const url = FluentFormsGlobal.$rest.route(
                "storeEntryColumns",
                this.form_id
            );

            FluentFormsGlobal.$rest
                .post(url, data)
                .then(response => {
                    this.$success(response.message);
                    this.$emit("save", settings);
                })
                .catch(error => {
                    this.$fail(error.message);
                });
        },
        resetColumnOrder() {
            this.saveColumnOrder(null)
        }
    },
    mounted() {
        this.createOptionsToRender();
    },
};
</script>