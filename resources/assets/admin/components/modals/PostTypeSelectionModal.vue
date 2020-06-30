<template>
    <div :class="{'ff_backdrop': visibility}">
        <el-dialog
            width="500px"
            v-loading="loading"
            title="Select Post Type"
            @close="cancelSelection"
            :visible="visibility"
            :close-on-click-modal="false"
            :close-on-press-escape="false"
            custom-class="post-type-selection"
        >
            <el-select v-model="post_type" style="width:100%">
                <el-option
                    :key="i"
                    :value="type"
                    :label="type"
                    v-for="type, i in post_types"
                />
            </el-select>

            <el-button
                type="primary"
                @click="visibility=false"
                style="margin-top:10px; float:right;"
            >Continue
            </el-button>
        </el-dialog>
    </div>

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
            jQuery.get(ajaxurl, {action: 'fluentform_get_post_types'}).done(res => {
                this.post_types = res.data.post_types;
            })
                .fail(res => {
                    console.log(res)
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

<style>
    .el-dialog.el-dialog.post-type-selection {
        height: 165px !important;
    }

    .el-dialog.el-dialog.post-type-selection .el-dialog__body {
        height: 118px !important;
        overflow: hidden;
    }
</style>
