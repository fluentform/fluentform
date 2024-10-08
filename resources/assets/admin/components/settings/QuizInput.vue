<template>
    <div class="quiz-field-container">
        <div class="quiz-field">
            <div class="quiz-field-setting">
                <el-switch v-model="input.enabled" />
            </div>
            <div class="quiz-field-setting">
                {{ original_input.label }}
            </div>
            <div class="quiz-field-setting" v-if="input.enabled === true && hasOptions(input) && !is_personality_quiz">
                <el-checkbox v-model="input.has_advance_scoring" true-value="yes" false-value="no">
                    {{ $t('Advance Scoring') }}
                </el-checkbox>
            </div>
        </div>
        <el-collapse-transition>
            <div v-if="input.enabled === true && input.has_advance_scoring === 'no' && !is_personality_quiz" class="quiz-field">
                <div class="quiz-field-setting">
                    <div class="lead-title mb-2">{{ $t('Score') }}</div>
                    <el-input-number v-model="input.points" :min="1" :max="100" controls-position="right" size="small" />
                </div>
                <div class="quiz-field-setting" v-if="ifNeedsCondition(input.element) && hasOptions(input)">
                    <div class="lead-title mb-2">{{ $t('Condition') }}</div>
                    <el-select v-model="input.condition" @change="resetValue(input)" style="width: 100%" size="small" :placeholder="$t('Select Condition')">
                        <el-option v-for="(label, key) in matchingCondition" :key="key" :label="$t(label)" :value="key" />
                    </el-select>
                </div>
                <div class="quiz-field-setting" v-if="ifNeedsCondition(input.element)">
                    <div class="lead-title mb-2">{{ $t('Correct Answer') }}</div>
                    <el-select
                        v-if="hasOptions(input)"
                        ref="resetInput"
                        v-model="input.correct_answer"
                        style="width: 100%"
                        size="small"
                        :multiple="isMultiple(input)"
                        filterable
                        allow-create
                        default-first-option
                        :automatic-dropdown="false"
                        :placeholder="$t('Type your Answers')"
                    >
                        <el-option v-for="(item, key) in original_input.options" :key="key" :label="item" :value="key">
                            {{ item }}
                        </el-option>
                    </el-select>
                    <el-input v-else v-model="input.correct_answer" size="small" :placeholder="$t('Correct Answer')" />
                </div>
                <div class="quiz-field-setting" v-else-if="isRadioInput(input.element)">
                    <div class="lead-title mb-2">{{ $t('Correct Answer') }}</div>
                    <el-select v-model="input.correct_answer" multiple style="width: 100%" size="small" :placeholder="$t('Correct Answer')">
                        <el-option v-for="(item, key) in input.options" :key="key" :label="item" :value="key">
                            {{ item }}
                        </el-option>
                    </el-select>
                </div>
            </div>
        </el-collapse-transition>
        <el-collapse-transition v-if="input.has_advance_scoring === 'yes'">
            <div>
                <div v-for="(item, key) in original_input.options" :key="key" class="quiz-field">
                    <div class="quiz-field-setting">
                        <el-input-number v-model="input.advance_points[key]" :min="0" :max="100" controls-position="right" size="small" />
                    </div>
                    <div class="quiz-field-setting">
                        {{ item }}
                    </div>
                </div>
            </div>
        </el-collapse-transition>
    </div>
</template>

<script>
export default {
    name: 'QuizInput',
    props: {
        input: {
            type: Object,
            required: true
        },
        original_input: {
            type: Object,
            required: true
        },
        is_personality_quiz: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            matchingCondition: {
                equal: 'Equal',
                includes_any: 'Includes Any',
                includes_all: 'Includes All',
                not_includes: 'Not Includes'
            }
        }
    },
    methods: {
        isRadioInput(key) {
            const selectAbleFields = ['input_radio']
            return selectAbleFields.includes(key)
        },
        ifNeedsCondition(key) {
            const textInput = ['input_text', 'input_date', 'rangeslider', 'input_number', 'select', 'input_checkbox']
            return textInput.includes(key)
        },
        resetValue(input) {
            if (this.$refs.resetInput) {
                this.$refs.resetInput.selectedLabel = ''
            }
            input.correct_answer = null
        },
        isMultiple(item) {
            return item.condition !== 'equal'
        },
        setDefaultPoints() {
            const isEmpty = Object.keys(this.input.advance_points).length === 0
            if (isEmpty) {
                this.input.advance_points = this.original_input.advance_points
            }
        },
        hasOptions(item) {
            return Object.keys(item.advance_points).length !== 0
        }
    },
    mounted() {
        if (!this.input.has_advance_scoring) {
            this.input.has_advance_scoring = 'no'
        }
        this.setDefaultPoints()
    }
}
</script>