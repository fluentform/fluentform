<template>
    <el-form ref="form-bottom" v-if="hasPro">
        <div class="ff_block_item ff_block_item_flex">
            <div class="ff_block_title_group" style="width: 400px">
                <h6 class="ff_block_title">{{ $t('Append') }}</h6>
                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                    <div slot="content">
                        <p>
                            {{ $t('Enable this to append survey result to the confirmation message.') }}
                        </p>
                    </div>
                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                </el-tooltip>
            </div><!-- .ff_block_title_group -->
            <div class="ff_block_item_body">
                <el-switch :width="48" active-color="#13ce66" v-model="form.enabled"/>
            </div><!-- .ff_block_item_body -->
        </div><!-- .ff_block_item -->

        <!--Additional fields when append survey result enabled-->
        <div v-if="form.enabled" class="conditional-items">
            <div class="ff_block_item ff_block_item_flex">
                <div class="ff_block_title_group" style="width: 378px">
                    <h6 class="ff_block_title"> {{ $t('Show Label') }}</h6>
                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                        <div slot="content">
                            <p>
                                {{ $t('Do you want to show form labels when displaying survey result?') }}
                            </p>
                        </div>
                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                    </el-tooltip>
                </div><!-- .ff_block_title_group -->
                <div class="ff_block_item_body">
                    <el-switch :width="48" active-color="#13ce66" v-model="form.showLabel"/>
                </div><!-- .ff_block_item_body -->
            </div><!-- .ff_block_item -->
            
            <div class="ff_block_item ff_block_item_flex">
                <div class="ff_block_title_group" style="width: 378px">
                    <h6 class="ff_block_title">{{ $t('Show Count') }}</h6>
                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                        <div slot="content">
                            <p>
                                {{ $t('Do you want to show vote count when displaying survey result?') }}
                            </p>
                        </div>
                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                    </el-tooltip>
                </div><!-- .ff_block_title_group -->
                <div class="ff_block_item_body">
                    <el-switch :width="48" active-color="#13ce66" v-model="form.showCount"/>
                </div><!-- .ff_block_item_body -->
            </div><!-- .ff_block_item -->
        </div>
    </el-form>
    <Notice type="danger-soft" v-else>
        <el-row class="justify-between items-center" :gutter="10">
            <el-col :span="12">
                <h6 class="title mb-1">{{$t('Survey Result is a Pro feature')}}</h6>
                <p class="text fs-14">{{$t('Please upgrade to PRO to unlock the feature.')}}</p>
            </el-col>
            <el-col :span="12" class="text-right">
                <a target="_blank" href="https://fluentforms.com/pricing/?utm_source=plugin&amp;utm_medium=wp_install&amp;utm_campaign=ff_upgrade&amp;theme_style=twentytwentythree" class="el-button el-button--danger el-button--small">
                    {{$t('Upgrage to Pro')}}
                </a>
            </el-col>
        </el-row>
    </Notice>
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
