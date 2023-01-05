<template>
    <el-dialog
        width="390px"
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
        <div class="ff_post_type_action_wrap mt-4">
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
            'postTypeSelectionDialogVisibility'
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

