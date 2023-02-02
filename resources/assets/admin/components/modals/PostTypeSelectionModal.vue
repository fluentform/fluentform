<template>
    <el-dialog
        :width="!hasPro ? '40%' : '30%'"
        v-loading="loading"
        @close="cancelSelection"
        :visible="visibility"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
        custom-class="post-type-selection"
    >
        <div slot="title">
            <h4>{{$t('Select Post Type')}}</h4>
        </div>
        <div v-if="!hasPro" class="ff_alert danger-soft mt-4">
            <h6 class="title mb-2">Post type form is a Pro features</h6>
            <p class="text">Please upgrade to PRO to unlock the feature.</p>
            <a target="_blank" href="https://fluentforms.com/pricing/?utm_source=plugin&utm_medium=wp_install&utm_campaign=ff_upgrade&theme_style=twentytwentythree" class="el-button el-button--danger el-button--small">Upgrage to Pro</a>
        </div>
        <div v-else class="ff_post_type_action_wrap mt-4">
            <el-radio-group v-model="post_type" class="el-radio-group-column ff_post_type_radios">
                <el-radio  v-for="(type, i) in post_types" :key="i" :label="type">{{type}}</el-radio>    
            </el-radio-group>
            <el-button class="el-button--block" type="primary" @click="visibility = false">
                {{ $t('Continue') }}
            </el-button>
        </div>
    </el-dialog>
</template>

<script>
    export default {
        name: 'PostTypeSelectionModal',
        props: [
            'postTypeSelectionDialogVisibility',
            'hasPro'
        ],
        data() {
            return {
                post_type: null,
                post_types: [],
                loading: true,
            };
        },
        methods: {
            cancelSelection() {
                this.post_type = null;
                this.$emit('on-post-type-selction-end', undefined);
            }
        },
        mounted() {
            if (this.post_types.length) return;

            this.loading = true;
            FluentFormsGlobal.$get({action: 'fluentform_get_post_types'}).done(res => {
                this.post_types = res.data.post_types;
            })
            .fail(res => {
                console.log(res);
            })
            .always(() => {
                this.loading = false;
            })
        },
        computed: {
            visibility: {
                get() {
                    return this.postTypeSelectionDialogVisibility;
                },
                set(value) {
                    this.$emit('on-post-type-selction-end', this.post_type);
                    this.post_type = null;
                }
            }
        }
    };
</script>

