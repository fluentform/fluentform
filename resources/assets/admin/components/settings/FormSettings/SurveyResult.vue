<template>
    <el-form ref="form-bottom" label-position="top">
        <!--Append survey result-->
        <el-form-item class="ff-form-item ff-form-item-flex">
            <div slot="label" style="width: 390px;">
                {{ $t('Append') }}

                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                    <div slot="content">
                        <p>
                            {{ $t('Enable this to append survey result to the confirmation message.') }}
                        </p>
                    </div>

                    <i class="ff-icon ff-icon-info-filled text-primary"/>
                </el-tooltip>
            </div>

            <el-switch class="el-switch-lg" active-color="#00b27f" v-model="form.enabled" v-if="hasPro"/>
        </el-form-item>

        <!--Additional fields when append survey result enabled-->
        <transition name="slide-down">
            <div v-if="form.enabled" class="conditional-items">
                <el-form-item class="ff-form-item ff-form-item-flex">
                    <div slot="label" style="width: 370px;">
                        {{ $t('Show Label') }}

                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                            <div slot="content">
                                <p>
                                    {{ $t('Do you want to show form labels when displaying survey result?') }}
                                </p>
                            </div>

                            <i class="ff-icon ff-icon-info-filled text-primary"/>
                        </el-tooltip>
                    </div>

                    <el-switch class="el-switch-lg" active-color="#00b27f" v-model="form.showLabel" v-if="hasPro"/>
                </el-form-item>

                <el-form-item class="ff-form-item ff-form-item-flex">
                    <div slot="label" style="width: 370px;">
                        {{ $t('Show Count') }}

                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                            <div slot="content">
                                <p>
                                    {{ $t('Do you want to show vote count when displaying survey result?') }}
                                </p>
                            </div>

                            <i class="ff-icon ff-icon-info-filled text-primary"/>
                        </el-tooltip>
                    </div>

                    <el-switch class="el-switch-lg" active-color="#00b27f" v-model="form.showCount" v-if="hasPro"/>
                </el-form-item>
            </div>
        </transition>
    </el-form>
</template>

<script>
    export default {
        name: "SurveyResult",
        props: {
            data: {
                required: true
            },
            hasPro: {
                required: true
            }
        },
        computed: {
            form() {
                return this.data;
            }
        }
    }
</script>
