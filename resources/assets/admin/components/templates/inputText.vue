<template>
    <withLabel :item="item">
        <el-input
            class="ff-input-text-wrapper"
            :type="item.attributes.type"
            :value="item.attributes.value"
            :disabled="disabled"
            :placeholder="placeholder">
            <template v-if="item.settings.prefix_label" slot="prepend">
                <div v-html="item.settings.prefix_label"></div>
            </template>
            <template v-if="item.settings.suffix_label" slot="append">
                <div v-html="item.settings.suffix_label"></div>
            </template>
        </el-input>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'inputText',
    props: ['item'],
    components: {
        withLabel
    },
            computed: {
                disabled() {
                    return this.item.attributes.type == 'number' &&
                        this.item.settings.calculation_settings &&
                        this.item.settings.calculation_settings.status;
                },
                placeholder() {
                    if (this.disabled) {
                        return this.item.settings.calculation_settings.formula;
                    }
                    return this.item.attributes.placeholder;
                }
            }
        }
        </script>
