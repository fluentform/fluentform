<template>
    <el-form ref="form-bottom">
        <!--Limit Number of Entries-->
        <div class="ff_block_item_wrap">
            <div class="ff_block_item ff_block_item_flex">
                <div class="ff_block_title_group" style="width: 400px;">
                    <h6 class="ff_block_title">{{ $t('Maximum Number of Entries') }}</h6>
                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                        <div slot="content">
                            <p>
                                {{ $t('Enter a number in the input box below to limit the number of entries allowed for this form. The form will become inactive when that number is reached.') }}
                            </p>
                        </div>
                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                    </el-tooltip>
                </div><!-- .ff_block_title_group -->
                <div class="ff_block_item_body">
                    <el-switch :width="48" active-color="#13ce66" v-model="form.limitNumberOfEntries.enabled"></el-switch>
                </div><!-- .ff_block_item_body -->
            </div><!-- .ff_block_item -->

            <!--Additional fields when limit number of entries enabled-->
            <div v-if="form.limitNumberOfEntries.enabled" class="conditional-items">
                <div class="ff_block_item">
                    <div class="ff_block_title_group mb-3">
                        <h6 class="ff_block_title">{{ $t('Maximum Entries') }}</h6>
                    </div><!-- .ff_block_title_group -->
                    <div class="ff_block_item_body">
                        <el-row :gutter="24">
                            <el-col :span="8">
                                <el-input-number class="w-100" :min="0" v-model="form.limitNumberOfEntries.numberOfEntries"></el-input-number>
                            </el-col>
                            <el-col :span="8">
                                <el-select class="w-100" v-model="form.limitNumberOfEntries.period">
                                    <el-option 
                                        v-for="(label, period) in entryPeriodOptions" 
                                        :key="period"
                                        :label="label" 
                                        :value="period"
                                    ></el-option>
                                </el-select>
                            </el-col>
                        </el-row>
                    </div><!-- .ff_block_item_body -->
                </div><!-- .ff_block_item -->
                
                <div class="ff_block_item">
                    <div class="ff_block_title_group mb-3">
                        <h6 class="ff_block_title">{{ $t('Message Shown on Reaching Max Entries') }}</h6>
                    </div><!-- .ff_block_title_group -->
                    <div class="ff_block_item_body">
                        <el-input 
                            v-model="form.limitNumberOfEntries.limitReachedMsg" 
                            type="textarea"
                            :rows="3"
                        ></el-input>
                    </div><!-- .ff_block_item_body -->
                </div><!-- .ff_block_item -->
            </div>
        </div><!--.ff_block_item_wrap -->

        <!--Schedule Form-->
        <div class="ff_block_item_wrap">
            <div class="ff_block_item ff_block_item_flex">
                <div class="ff_block_title_group" style="width: 400px;">
                    <h6 class="ff_block_title">{{ $t('Form Scheduling') }}</h6>
                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                        <div slot="content">
                            <p>
                                {{ $t('Schedule a time period the form is active.') }}
                            </p>
                        </div>
                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                    </el-tooltip>
                </div><!-- .ff_block_title_group -->
                <div class="ff_block_item_body">
                    <el-switch :width="48" active-color="#13ce66" v-model="form.scheduleForm.enabled"></el-switch>
                </div><!-- .ff_block_item_body -->
            </div><!-- .ff_block_item -->

            <!--Additional fields when form sheduling enabled-->
            <div v-if="form.scheduleForm.enabled" class="conditional-items">
                <div class="ff_block_item" v-if="form.scheduleForm.enabled">
                    <div class="ff_block_title_group mb-3">
                        <h6 class="ff_block_title">{{ $t('Select Weekdays') }}</h6>
                    </div><!-- .ff_block_title_group -->
                    <div class="ff_block_item_body">
                        <div class="mb-3">
                            <el-checkbox 
                                :indeterminate="isIndeterminate" 
                                v-model="checkAllWeekday"  
                                @change="handleCheckAllChange"
                            >
                                {{ $t('Check all') }}
                            </el-checkbox>
                        </div>

                        <el-checkbox-group v-model="selectedDays">
                            <el-checkbox 
                                v-for="weekday in weekdays" 
                                :key="weekday" 
                                @change="handleCheckedDayChange" 
                                :label="weekday"
                            ></el-checkbox>
                        </el-checkbox-group>
                    </div><!-- .ff_block_item_body -->
                </div><!-- .ff_block_item -->
                
                <div class="ff_block_item_wrap">
                    <el-row :gutter="24">
                        <el-col :span="12">
                            <div class="ff_block_item" v-if="form.scheduleForm.enabled">
                                <div class="ff_block_title_group mb-3">
                                    <h6 class="ff_block_title">{{ $t('Submission Starts') }}</h6>
                                </div><!-- .ff_block_title_group -->
                                <div class="ff_block_item_body">
                                    <el-date-picker
                                        class="w-100"
                                        v-model="form.scheduleForm.start"
                                        type="datetime"
                                        :placeholder="$t('Select date and time')"
                                    >
                                    </el-date-picker>
                                </div><!-- .ff_block_item_body -->
                            </div><!-- .ff_block_item -->
                        </el-col>
                        
                        <el-col :span="12">
                            <div class="ff_block_item">
                                <div class="ff_block_title_group mb-3">
                                    <h6 class="ff_block_title">{{ $t('Submission Ends') }}</h6>
                                </div><!-- .ff_block_title_group -->
                                <div class="ff_block_item_body">
                                    <el-form>
                                        <el-date-picker
                                            class="w-100"
                                            v-model="form.scheduleForm.end"
                                            type="datetime"
                                            :placeholder="$t('Select date and time')"
                                            :picker-options="datePickerOptions">
                                        </el-date-picker>
                                    </el-form>
                                </div><!-- .ff_block_item_body -->
                            </div><!-- .ff_block_item -->
                        </el-col>
                    </el-row>
                </div><!-- .ff_block_item_wrap -->

                <div class="ff_block_item">
                    <div class="ff_block_title_group mb-3">
                        <h6 class="ff_block_title">{{ $t('Form Waiting Message') }}</h6>
                    </div><!-- .ff_block_title_group -->
                    <div class="ff_block_item_body">
                        <el-input v-model="form.scheduleForm.pendingMsg" type="textarea"></el-input>
                    </div><!-- .ff_block_item_body -->
                </div><!-- .ff_block_item -->
                
                <div class="ff_block_item">
                    <div class="ff_block_title_group mb-3">
                        <h6 class="ff_block_title">{{ $t('Form Expired Message') }}</h6>
                    </div><!-- .ff_block_title_group -->
                    <div class="ff_block_item_body">
                        <el-input v-model="form.scheduleForm.expiredMsg" type="textarea"></el-input>
                    </div><!-- .ff_block_item_body -->
                </div><!-- .ff_block_item -->
            </div>
        </div><!--.ff_block_item_wrap -->

        <hr class="mb-4">

        <!--Require user to be logged in-->
        <div class="ff_block_item_wrap">
            <h5 class="mb-3">{{ $t('Login Requirement Settings') }}</h5>
            <div class="ff_block_item ff_block_item_flex">
                <div class="ff_block_title_group" style="width: 400px">
                    <h6 class="ff_block_title">{{ $t('Require user to be logged in') }}</h6>
                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                        <div slot="content">
                            <p>
                                {{ $t('Check this option to require a user to be logged in to view this form.') }}
                            </p>
                        </div>
                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                    </el-tooltip>
                </div><!-- .ff_block_title_group -->
                <div class="ff_block_item_body">
                    <el-switch :width="48" active-color="#13ce66" v-model="form.requireLogin.enabled"></el-switch>
                </div><!-- .ff_block_item_body -->
            </div><!-- .ff_block_item -->

            <!--Additional fields when user logged in is enabled-->
            <div v-if="form.requireLogin.enabled" class="conditional-items">
                <div class="ff_block_item">
                    <div class="ff_block_title_group mb-3">
                        <h6 class="ff_block_title">{{ $t('Require Login Message') }}</h6>
                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                            <div slot="content">
                                <p>
                                    {{ $t('Enter a message to be displayed to users who are not logged in (shortcodes and HTML are supported).') }}
                                </p>
                            </div>
                            <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                        </el-tooltip>
                    </div><!-- .ff_block_title_group -->
                    <div class="ff_block_item_body">
                         <el-input type="textarea" v-model="form.requireLogin.requireLoginMsg"></el-input>
                    </div><!-- .ff_block_item_body -->
                </div><!-- .ff_block_item -->
            </div>
        </div><!-- .ff_block_item_wrap -->

        <hr class="mb-4">

        <!--Allow empty form submission-->
        <div class="ff_block_item_wrap">
            <h5 class="mb-3">{{ $t('Empty Submission Blocking') }}</h5>
            <div class="ff_block_item ff_block_item_flex">
                <div class="ff_block_title_group" style="width: 400px">
                    <h6 class="ff_block_title">{{ $t('Deny empty submission') }}</h6>
                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                        <div slot="content">
                            <p>
                                {{ $t('Enabling this won\'t allow users to submit empty forms when there are no required form fields.') }}
                            </p>
                        </div>
                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                    </el-tooltip>
                </div><!-- .ff_block_title_group -->
                <div class="ff_block_item_body">
                    <el-switch :width="48" active-color="#13ce66" v-model="form.denyEmptySubmission.enabled"></el-switch>
                </div><!-- .ff_block_item_body -->
            </div><!-- .ff_block_item -->

            <!--Additional fields when empty form submission is not allowed-->
            <div v-if="form.denyEmptySubmission.enabled" class="conditional-items">
                <div class="ff_block_item">
                    <div class="ff_block_title_group mb-3">
                        <h6 class="ff_block_title">{{ $t('Message Shown Against on Empty Submission') }}</h6>
                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                            <div slot="content">
                                <p>
                                    {{ $t('Enter a message to be displayed to users when they try to submit an empty form.') }}
                                </p>
                            </div>
                            <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                        </el-tooltip>
                    </div><!-- .ff_block_title_group -->
                    <div class="ff_block_item_body">
                        <el-input type="textarea" v-model="form.denyEmptySubmission.message"></el-input>
                    </div><!-- .ff_block_item_body -->
                </div><!-- .ff_block_item -->
            </div>
        </div><!-- .ff_block_item_wrap -->
    </el-form>
</template>

<script>
    export default {
        name: 'FormRestrictions',
        props: {
            data: {
                required: true
            }
        },
        data() {
            return {
                isIndeterminate: false,
                checkAllWeekday:'',
                selectedDays:[],
                weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday','Sunday'],
                entryPeriodOptions: {
                    total: 'Total Entries',
                    day: 'Per Day',
                    week: 'Per Week',
                    month: 'Per Month',
                    year: 'Per Year',
                    per_user_ip: 'Per User (IP Address Based)',
                    per_user_id: 'Per User (Logged in ID based)'
                },
                datePickerOptions: {
                    shortcuts: [
                        {
                            text: 'Today',
                            onClick(picker) {
                                picker.$emit('pick', new Date());
                            }
                        },
                        {
                            text: this.$t('Yesterday'),
                            onClick(picker) {
                                const date = new Date();
                                date.setTime(date.getTime() - 3600 * 1000 * 24);
                                picker.$emit('pick', date);
                            }
                        },
                        {
                            text: this.$t('A week ago'),
                            onClick(picker) {
                                const date = new Date();
                                date.setTime(date.getTime() - 3600 * 1000 * 24 * 7);
                                picker.$emit('pick', date);
                            }
                        }
                    ]
                }
            }
        },
        methods: {
            handleCheckAllChange(val) {
                this.selectedDays = val ? this.weekdays : [];
                this.form.scheduleForm.selectedDays = this.selectedDays;
                this.isIndeterminate = false;
            },
            handleCheckedDayChange(value) {

                let checkedCount = this.selectedDays.length;
                this.checkAllWeekday = checkedCount === this.weekdays.length;
                this.isIndeterminate = checkedCount > 0 && checkedCount < this.weekdays.length;
                this.form.scheduleForm.selectedDays = this.selectedDays;

            }
        },
        mounted() {
            //if weekdays is not set initially select all weekday
            if(!this.form.scheduleForm.selectedDays){
                this.form.scheduleForm.selectedDays = this.weekdays;
            }
            this.selectedDays    = this.form.scheduleForm.selectedDays ;
            this.checkAllWeekday = this.selectedDays.length === this.weekdays.length;

        },
        computed: {
            form() {
                return this.data;
            }
        }
    }
</script>
