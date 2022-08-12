<template>
    <div>
        <el-form-item>
            <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
        </el-form-item>

        <template v-for="(column, i) in columns">
            <el-form-item :label="'Column ' + (i + 1)">
                <el-input
                    type="number"
                    :min="5"
                    :max="100"
                    v-model.number="column.width"
                    disabled
                    readonly
                />
            </el-form-item>
        </template>

<!--        <p>{{ listItem.width_limitation_msg }}</p>-->
    </div>
</template>

<script>
    import elLabel from "../../includes/el-label";

    export default {
        name: "containerWidth",
        props: ['listItem', 'editItem', 'value', 'item'],
        components: {
            elLabel
        },

        data() {
            return {
                columns: JSON.parse(JSON.stringify(this.editItem.columns))
            }
        },

        watch: {
            'editItem.columns': {
                handler (val) {
                    this.columns = JSON.parse(JSON.stringify(val));
                },
                deep: true
            }
        },

        methods: {
            set(value, index) {
                value = this.getNumber(value);
                if (value < 5) {
                    return;
                }

                let total = value;

                this.editItem.columns.forEach((column, i) => {
                    if (i !== index) {
                        total += this.getNumber(column.width);
                    }
                })

                //ne
                let targetColumn = index ? this.editItem.columns[index - 1] : this.editItem.columns[1];

                if (total > 100) {
                    const difference = total - 100;

                    console.log('diff', difference, (targetColumn.width - difference));

                    if ((targetColumn.width - difference) < 5) {
                        // targetColumn.width = 5;
                        return;
                    }

                    targetColumn.width = this.getNumber(targetColumn.width - difference);
                } else {
                    const difference = 100 - total;

                    targetColumn.width = this.getNumber(targetColumn.width + difference);
                }

                this.editItem.columns[index].width = value;
                this.columns[index].width = value;
                //ne

                // let lastColumn = this.editItem.columns[this.editItem.columns.length - 1];
                //
                // if (total > 100) {
                //     const difference = total - 100;
                //
                //     if ((lastColumn.width - difference) <= 5) {
                //         return;
                //     }
                //
                //     lastColumn.width = this.getNumber(lastColumn.width - difference);
                // } else {
                //     const difference = 100 - total;
                //     lastColumn.width = this.getNumber(lastColumn.width + difference);
                // }
                //
                // this.editItem.columns[index].width = value;
            },

            getNumber(value) {
                value = value || 0;

                return parseFloat(parseFloat(value).toFixed(2));
            }
        }
    }
</script>

<style scoped>

</style>
