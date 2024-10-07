<template>
    <div :class="{'ff_backdrop': visibility}">
        <el-dialog
            :width="!hasPro ? '40%' : '28%'"
            v-loading="loading"
            @close="cancelSelection"
            custom-class="post-type-selection"
            :model-value="visibility"
            @update:model-value="$emit('update:visibility', $event)"
        >
            <template #title>
                <h4>{{$t('Select Post Type')}}</h4>
            </template>
            <div v-if="hasPro" class="ff_post_type_action_wrap mt-4">
                <el-select v-model="post_type" class="w-100 ff_post_type_option mb-4">
                    <el-option
                        v-for="(type, i) in post_types"
                        :key="i"
                        :value="type"
                        :label="type"
                    />
                </el-select>

                <el-button class="el-button--block" type="primary" @click="visibility = false">
                    {{ $t('Continue') }}
                </el-button>
            </div>
            <notice v-else class="mt-4" type="danger-soft">
                <h6 class="title mb-2">{{ $t('Post type form is a Pro features') }}</h6>
                <p class="text">{{ $t('Please upgrade to PRO to unlock the feature.') }}</p>
                <a target="_blank" href="https://fluentforms.com/pricing/?utm_source=plugin&utm_medium=wp_install&utm_campaign=ff_upgrade" class="el-button el-button--danger el-button--small">{{ $t('Upgrade to Pro') }}</a>
            </notice>
        </el-dialog>
    </div>
</template>

<script>
import Notice from '@/admin/components/Notice/Notice.vue';

export default {
    name: 'PostTypeSelectionModal',
    props: [
        'visibility',
        'hasPro'
    ],
    emits: ['update:visibility'],
    components: {
        Notice
    },
    data() {
        return {
            post_type: null,
            post_types: window.FluentFormApp.post_types || [],
            loading: true,
        };
    },
    methods: {
        cancelSelection() {
            this.post_type = null;
            this.$emit('visibility', undefined);
        }
    }
};
</script>

