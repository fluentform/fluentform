<template>
    <el-form ref="form-bottom" label-width="220px" label-position="left">
        <!--Append survey result-->
        <el-form-item>
            <div slot="label">
                {{ $t('Append') }}

                <el-tooltip class="item" placement="bottom-start" effect="light">
                    <div slot="content">
                        <h3>{{ $t('Append Survey Result') }}</h3>

                        <p>
                            {{ $t('Enable this to append survey result to the confirmation message.') }}
                        </p>
                    </div>

                    <i class="el-icon-info el-text-info"/>
                </el-tooltip>
            </div>

            <el-switch active-color="#13ce66" v-model="form.enabled" :disabled="!hasPro"/>
        </el-form-item>

        <!--Additional fields when append survey result enabled-->
        <transition name="slide-down">
            <div v-if="form.enabled" class="conditional-items">
                <el-form-item>
                    <div slot="label">
                        {{ $t('Show Label') }}

                        <el-tooltip class="item" placement="bottom-start" effect="light">
                            <div slot="content">
                                <h3>{{ $t('Show Label') }}</h3>

                                <p>
                                    {{ $t('Do you want to show form labels when displaying survey result?') }}
                                </p>
                            </div>

                            <i class="el-icon-info el-text-info"/>
                        </el-tooltip>
                    </div>

                    <el-switch active-color="#13ce66" v-model="form.showLabel" :disabled="!hasPro"/>
                </el-form-item>

                <el-form-item>
                    <div slot="label">
                        {{ $t('Show Count') }}

                        <el-tooltip class="item" placement="bottom-start" effect="light">
                            <div slot="content">
                                <h3>{{ $t('Show Count') }}</h3>

                                <p>
                                    {{ $t('Do you want to show vote count when displaying survey result?') }}
                                </p>
                            </div>

                            <i class="el-icon-info el-text-info"/>
                        </el-tooltip>
                    </div>

                    <el-switch active-color="#13ce66" v-model="form.showCount" :disabled="!hasPro"/>
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
