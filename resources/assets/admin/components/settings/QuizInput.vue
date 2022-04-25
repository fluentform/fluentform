<template>
    <div class="quiz-field-container">
        <div class="quiz-field">
            <div class="quiz-field-setting">
                <el-switch v-model="input.enabled"/>
            </div>
            <div>{{ original_input.label }}</div>
        </div>
        <transition name="slide-down">
            <div v-if="input.enabled == true" class="quiz-field">
                <div class="quiz-field-setting" >
                    {{ $t('Score') }}
                    <el-input-number   size="small" v-model="input.points" controls-position="right" :min="1" :max="100"></el-input-number>
                  
                </div>
                <div class="quiz-field-setting" v-if="ifNeedsCondition(input.element)">
                    {{ $t('Condition') }}
                    <el-select @change="resetValue(input)"  size="small" style="width: 100%" v-model="input.condition"
                               placeholder="Select Condition">
                        <el-option
                            v-for="(label, key) in macthingCondition"
                            :key="key"
                            :label="label"
                            :value="key">
                        </el-option>
                    </el-select>
                </div>
                <div class="quiz-field-setting"  v-if="ifNeedsCondition(input.element)">
                    {{ $t('Correct Answer') }}
                    
                    <el-select
                        ref="resetInput"
                        size="small"
                        style="width: 100%"
                        v-model="input.correct_answer"
                        :multiple="isMultiple(input)"
                        filterable
                        allow-create
                        default-first-option
                        :automatic-dropdown=false
                        placeholder="Type your Answers">
                        
                        <el-option
                            v-for="(item, key) in original_input.options"
                            :key="key"
                            :label="item"
                            :value="key"> {{ item }}
                        </el-option>
                    
                    </el-select>
                </div>
                <div class="quiz-field-setting" v-else-if="isRadioInput(input.element)">
                    {{ $t('Correct Answer') }}
                    <el-select
                        multiple
                        size="small" style="width: 100%" v-model="input.correct_answer" placeholder="Correct Answer">
                        <el-option
                            v-for="(item, key) in input.options"
                            :key="key"
                            :label="item"
                            :value="key"> {{ item }}
                        </el-option>
                    </el-select>
                </div>
            </div>
        </transition>
    </div>
</template>

<script>
export default {
    name: "QuizInput",
    props: {
        input: {
            type: Object,
        },
        original_input :{
            type: Object,
        }
    },
    data() {
        return {
            macthingCondition: {
                equal: 'Equal',
                includes_any: 'Includes Any',
                includes_all: 'Includes All',
                not_includes: 'Not Includes',
            },
        }
    },
    methods: {
        isRadioInput(key) {
            let selectAbleFields = ['input_radio'];
            return selectAbleFields.includes(key) ? true : false;
        },
        ifNeedsCondition(key) {
            let textInput = ['input_text', 'input_date', 'rangeslider', 'input_number', 'select', 'input_checkbox'];
            return textInput.includes(key) ? true : false;
        },
        resetValue(input) {
    
            this.$refs.resetInput.selectedLabel = '';
            input.correct_answer = null;
            
        },
        isMultiple(item) {
            return item.condition == 'equal' ? false : true;
        }
    },
    
}
</script>
