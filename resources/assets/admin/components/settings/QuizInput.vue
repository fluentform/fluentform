<template>
    <div class="quiz-field-container">
        <div class="quiz-field quiz-field--header">
            <div class="quiz-field-setting quiz-field-setting--switch">
                <el-switch v-model="input.enabled"/>
            </div>
            <div class="quiz-field-setting quiz-field-setting--title">
                {{ original_input.label }}
            </div>
            <div class="quiz-field-setting quiz-field-setting--scoring-toggle"  v-if="input.enabled == true && hasOptions(input) && !is_personality_quiz" >
                <el-checkbox true-label="yes" false-label="no" v-model="input.has_advance_scoring">
                    {{ $t('Advance Scoring') }}
                </el-checkbox>
            </div>
        </div>
        <div v-if="input.enabled == true && is_personality_quiz && isRankingInput(input.element)" class="quiz-field quiz-field--ranking">
            <div class="quiz-field-setting quiz-field-setting--ranking-order">
                <div class="lead-title mb-2">{{ $t('Personality Score By Position') }}</div>
                <div class="ff-ranking-quiz-order">
                    <div
                        v-for="(value, index) in input.correct_answer"
                        :key="index"
                        class="ff-ranking-quiz-order__row"
                    >
                        <span class="ff-ranking-quiz-order__position">{{ index + 1 }}</span>
                        <span class="ff-ranking-quiz-order__item">{{ getRankingLabel(value) }}</span>
                        <el-input-number
                            size="small"
                            v-model="input.personality_points[index]"
                            controls-position="right"
                            :min="0"
                            :max="100"
                        />
                    </div>
                </div>
                <small class="text-muted mt-2">{{ $t('The personality value placed in each rank will receive that position score. Default scores are assigned from highest rank to lowest rank.') }}</small>
            </div>
        </div>
        <transition name="slide-down">
            <div v-if="input.enabled == true && input.has_advance_scoring == 'no' && !is_personality_quiz && isRankingInput(input.element)" class="quiz-field quiz-field--ranking">
                <div class="quiz-field-setting">
                    <div class="lead-title mb-2">{{ $t('Score') }}</div>
                    <el-input-number size="small" v-model="input.points" controls-position="right" :min="1" :max="100"></el-input-number>
                </div>
                <div class="quiz-field-setting quiz-field-setting--ranking-order">
                    <div class="lead-title mb-2">{{ $t('Correct Ranking') }}</div>
                    <div class="ff-ranking-quiz-order">
                        <div
                            v-for="(value, index) in input.correct_answer"
                            :key="index"
                            class="ff-ranking-quiz-order__row"
                        >
                            <span class="ff-ranking-quiz-order__position">{{ index + 1 }}</span>
                            <span class="ff-ranking-quiz-order__item">{{ getRankingLabel(value) }}</span>
                            <div class="ff-ranking-quiz-order__actions">
                                <el-button
                                    size="mini"
                                    icon="el-icon-arrow-up"
                                    :aria-label="$t('Move up')"
                                    :title="$t('Move up')"
                                    @click="moveRankingItem(index, -1)"
                                    :disabled="index === 0"
                                />
                                <el-button
                                    size="mini"
                                    icon="el-icon-arrow-down"
                                    :aria-label="$t('Move down')"
                                    :title="$t('Move down')"
                                    @click="moveRankingItem(index, 1)"
                                    :disabled="index === input.correct_answer.length - 1"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else-if="input.enabled == true && input.has_advance_scoring == 'no' && !is_personality_quiz" class="quiz-field">
                <div class="quiz-field-setting">
                    <div class="lead-title mb-2">{{ $t('Score') }}</div>
                    <el-input-number size="small" v-model="input.points" controls-position="right" :min="1" :max="100"></el-input-number>
                </div>
                <div class="quiz-field-setting" v-if="ifNeedsCondition(input.element) && hasOptions(input)">
                   <div class="lead-title mb-2"> {{ $t('Condition') }}</div>
                    <el-select @change="resetValue(input)"  size="small" style="width: 100%" v-model="input.condition"
                               :placeholder="$t('Select Condition')">
                        <el-option
                            v-for="(label, key) in macthingCondition"
                            :key="key"
                            :label="$t(label)"
                            :value="key">
                        </el-option>
                    </el-select>
                </div>
                <div class="quiz-field-setting"  v-if="ifNeedsCondition(input.element)">
                   <div class="lead-title mb-2"> {{ $t('Correct Answer') }}</div>
                    <el-select
	                    v-if="hasOptions(input)"
                        ref="resetInput"
                        size="small"
                        style="width: 100%"
                        v-model="input.correct_answer"
                        :multiple="isMultiple(input)"
                        filterable
                        allow-create
                        default-first-option
                        :automatic-dropdown=false
                        :placeholder="$t('Type your Answers')">

                        <el-option
                            v-for="(item, key) in original_input.options"
                            :key="key"
                            :label="item"
                            :value="key"> {{ item }}
                        </el-option>

                    </el-select>
	                <el-input v-else v-model="input.correct_answer" size="small" :placeholder="$t('Correct Answer')"></el-input>
                </div>
                <div class="quiz-field-setting" v-else-if="isRadioInput(input.element)">
                   <div class="lead-title mb-2"> {{ $t('Correct Answer') }}</div>
                    <el-select
                        multiple
                        size="small" style="width: 100%" v-model="input.correct_answer" :placeholder="$t('Correct Answer')">
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
        <transition v-if="input.enabled == true && input.has_advance_scoring == 'yes' && !is_personality_quiz">
            <div>
                <div
                    v-if="input.enabled == true && !is_personality_quiz && isRankingInput(input.element)"
                    class="quiz-field quiz-field--ranking"
                >
                    <div class="quiz-field-setting quiz-field-setting--ranking-order">
                        <div class="lead-title mb-2">{{ $t('Scored Ranking') }}</div>
                        <div class="ff-ranking-quiz-order">
                            <div
                                v-for="(value, index) in input.correct_answer"
                                :key="index"
                                class="ff-ranking-quiz-order__row"
                            >
                                <span class="ff-ranking-quiz-order__position">{{ index + 1 }}</span>
                                <span class="ff-ranking-quiz-order__item">{{ getRankingLabel(value) }}</span>
                                <el-input-number
                                    size="small"
                                    v-model="input.advance_points[value]"
                                    controls-position="right"
                                    :min="0"
                                    :max="100"
                                />
                                <div class="ff-ranking-quiz-order__actions">
                                    <el-button
                                        size="mini"
                                        icon="el-icon-arrow-up"
                                        :aria-label="$t('Move up')"
                                        :title="$t('Move up')"
                                        @click="moveRankingItem(index, -1)"
                                        :disabled="index === 0"
                                    />
                                    <el-button
                                        size="mini"
                                        icon="el-icon-arrow-down"
                                        :aria-label="$t('Move down')"
                                        :title="$t('Move down')"
                                        @click="moveRankingItem(index, 1)"
                                        :disabled="index === input.correct_answer.length - 1"
                                    />
                                </div>
                            </div>
                        </div>
                        <small class="text-muted mt-2">{{ $t('Points are awarded when the option is placed in the configured position.') }}</small>
                    </div>
                </div>
                <span v-else v-for="(item, key) in original_input.options" class="quiz-field" :key="key">
                    <div  class="quiz-field-setting">
                       <el-input-number
                            size="small"
                            v-model="input.advance_points[key]"
                            controls-position="right"
                            :min="0" :max="100">
                       </el-input-number>
                    </div>
                    <div class="quiz-field-setting" >
                        {{ item }}
                    </div>
                </span>
            </div>
        </transition>
    </div>
</template>

<script>
const rankingQuizStrings = [
    'Personality Score By Position',
    'The personality value placed in each rank will receive that position score. Default scores are assigned from highest rank to lowest rank.',
    'Correct Ranking',
    'Move up',
    'Move down',
    'Scored Ranking',
    'Points are awarded when the option is placed in the configured position.'
];

export default {
    name: "QuizInput",
    props: {
        input: {
            type: Object,
        },
        original_input :{
            type: Object,
        },
        is_personality_quiz :{
            type: Boolean,
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
    computed: {
        rankingOptions() {
            return this.original_input.options || {};
        }
    },
    methods: {
        isRadioInput(key) {
            let selectAbleFields = ['input_radio'];
            return selectAbleFields.includes(key) ? true : false;
        },
        isRankingInput(key) {
            return key === 'input_ranking';
        },
        ifNeedsCondition(key) {
            let textInput = ['input_text', 'input_date', 'rangeslider', 'input_number', 'select', 'input_checkbox'];
            return textInput.includes(key) ? true : false;
        },
        resetValue(input) {
            if (this.$refs.resetInput && this.$refs.resetInput.selectedLabel !== undefined) {
                this.$refs.resetInput.selectedLabel = '';
            }
            input.correct_answer = null;
        },
        isMultiple(item) {
            return item.condition == 'equal' ? false : true;
        },
        moveRankingItem(index, direction) {
            if (!this.isRankingInput(this.input.element)) {
                return;
            }

            const targetIndex = index + direction;
            if (targetIndex < 0 || targetIndex >= this.input.correct_answer.length) {
                return;
            }

            const correctAnswer = [...this.input.correct_answer];
            const currentValue = correctAnswer[index];
            correctAnswer.splice(index, 1);
            correctAnswer.splice(targetIndex, 0, currentValue);
            this.$set(this.input, 'correct_answer', correctAnswer);
        },
        getRankingLabel(value) {
            return this.rankingOptions[value] || value;
        },
        getRankingOptionKey(value) {
            return String(value);
        },
        setDefaultPoints(){
            const defaultPoints = this.original_input.advance_points || {};
            const currentPoints = this.input.advance_points || {};
            const formattedPoints = {};

            Object.keys(defaultPoints).forEach(key => {
                formattedPoints[key] = currentPoints[key] !== undefined ? currentPoints[key] : defaultPoints[key];
            });

            this.$set(this.input, 'advance_points', formattedPoints);
        },
        setDefaultPersonalityPoints() {
            if (!this.isRankingInput(this.input.element)) {
                return;
            }

            const optionCount = Object.keys(this.rankingOptions).length;
            const currentPoints = this.input.personality_points || {};
            const formattedPoints = {};

            for (let index = 0; index < optionCount; index++) {
                const fallbackScore = Math.max(optionCount - index, 0);
                formattedPoints[index] = currentPoints[index] !== undefined ? currentPoints[index] : fallbackScore;
            }

            this.$set(this.input, 'personality_points', formattedPoints);
        },
        syncRankingAnswer() {
            if (!this.isRankingInput(this.input.element)) {
                return;
            }

            const optionKeys = Object.keys(this.rankingOptions);
            const optionKeySet = new Set(optionKeys);
            const currentAnswer = Array.isArray(this.input.correct_answer)
                ? this.input.correct_answer.map(value => this.getRankingOptionKey(value))
                : [];
            const normalizedAnswer = [];
            const usedValues = new Set();

            currentAnswer.forEach(value => {
                if (!optionKeySet.has(value) || usedValues.has(value)) {
                    return;
                }

                usedValues.add(value);
                normalizedAnswer.push(value);
            });

            optionKeys.forEach(key => {
                if (usedValues.has(key)) {
                    return;
                }

                usedValues.add(key);
                normalizedAnswer.push(key);
            });

            const hasChanged = normalizedAnswer.length !== currentAnswer.length ||
                normalizedAnswer.some((value, index) => currentAnswer[index] !== value);

            if (hasChanged || !Array.isArray(this.input.correct_answer)) {
                this.$set(this.input, 'correct_answer', normalizedAnswer);
            }

            this.$set(this.input, 'condition', 'list_match');
        },
        hasOptions(item){
           return Object.keys(item.options || this.rankingOptions || this.input.advance_points || {}).length !== 0;
        }

    },
    watch: {
        'original_input.options': {
            handler() {
                this.setDefaultPoints();
                this.setDefaultPersonalityPoints();
                this.syncRankingAnswer();
            },
            deep: true
        }
    },
    mounted() {
        if (!this.input.has_advance_scoring){
            this.$set(this.input, 'has_advance_scoring', 'no');
        }
        rankingQuizStrings.forEach(string => this.$t(string));
        this.setDefaultPoints();
        this.setDefaultPersonalityPoints();
        this.syncRankingAnswer();
    }
}
</script>
