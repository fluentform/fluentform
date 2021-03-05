<template>
    <div v-loading="loading">
        <el-row class="setting_header">
            <el-col :md="12">
                <template v-if="!selectedId">
                    <h2>PDF Feeds</h2>
                    <p>Create PDF template feed and you can download the PDFs from each submission</p>
                </template>
                <template v-else>
                    <h2>Edit PDF Feed - {{selectedId}}</h2>
                </template>
            </el-col>
            <!--Save selected.value-->
            <el-col :md="12" class="action-buttons clearfix mb15 text-right">
                <el-button
                        v-if="selectedId"
                        @click="discard()"
                        class="pull-right"
                        icon="el-icon-arrow-left"
                        size="small"
                >Back
                </el-button>
                <el-button v-else @click="addVisible = true" type="primary" size="small" icon="el-icon-plus">Add PDF Feed
                </el-button>
            </el-col>
        </el-row>

        <!-- Notification Table: 1 -->
        <el-table
                element-loading-text="Fetching Notifications..."
                v-if="!selectedId"
                :data="pdf_feeds"
                stripe
                class="el-fluid"
        >
            <el-table-column prop="name" label="Name"></el-table-column>

            <el-table-column prop="template_key" label="Template"></el-table-column>

            <el-table-column width="160" label="Actions" class-name="action-buttons">
                <template slot-scope="scope">
                    <el-button
                            @click="edit(scope.row.id)"
                            type="primary"
                            icon="el-icon-setting"
                            size="mini"
                    ></el-button>
                    <remove @on-confirm="remove(scope.row.id)"></remove>
                </template>
            </el-table-column>
        </el-table>

        <feed-editor
                v-else
                :edit_id="selectedId"
                :editorShortcodes="editorShortcodes"
                :form_id="form_id"
        >
        </feed-editor>


        <el-dialog
                v-loading="creating"
                element-loading-text="Creating Feed. Please wait..."
                title="Create new PDF Feed"
                :visible.sync="addVisible"
                width="60%">
            <div class="ff_modal_container">
                <h3>Please Select a Template</h3>
                <el-row :gutter="20">
                    <el-col class="ff_each_template" v-for="(template, templateIndex) in templates" :key="templateIndex"
                            :span="6">
                        <div @click="createFeed(templateIndex)" class="ff_card">
                            <img :src="template.preview"/>
                            <div class="ff_template_label">{{template.name}}</div>
                        </div>
                    </el-col>
                </el-row>
            </div>
            <span slot="footer" class="dialog-footer">
                <el-button @click="addVisible = false">Cancel</el-button>
            </span>
        </el-dialog>

    </div>
</template>

<script>
    import remove from "../confirmRemove.vue";
    import inputPopover from "../input-popover.vue";
    import FilterFields from "./Includes/FilterFields.vue";
    import ErrorView from "../../../common/errorView.vue";
    import FiledGeneral from "../settings/GeneralIntegration/_FieldGeneral";
    import wpeditor from "../../../common/_wp_editor";
    import FeedEditor from './PdfFeed';

    export default {
        name: "PdfSettings",
        props: ["form_id", "inputs", "has_pro", "has_pdf", "editorShortcodes"],
        components: {
            remove,
            FeedEditor
        },
        data() {
            return {
                creating: false,
                loading: true,
                addVisible: false,
                selectedId: null,
                pdf_feeds: [],
                templates: {}
            };
        },
        methods: {
            createFeed(templateName) {
                this.creating = true;
                FluentFormsGlobal.$post({
                    form_id: this.form_id,
                    action: 'fluentform_pdf_admin_ajax_actions',
                    route: 'create_feed',
                    template: templateName
                })
                    .then(response => {
                        this.selectedId = response.data.feed_id;
                        this.$notify.success({
                            message: response.data.message
                        });
                        this.addVisible = false;
                    })
                    .fail(() => {

                    })
                    .always(() => {
                        this.creating = false;
                    });
            },
            edit(selectedId) {
                this.selectedId = selectedId;
            },
            remove(id) {
                FluentFormsGlobal.$post({
                    form_id: this.form_id,
                    action: 'fluentform_pdf_admin_ajax_actions',
                    route: 'delete_feed',
                    feed_id: id
                })
                    .then(response => {
                        this.$notify.success({
                            message: response.data.message
                        });
                        this.fetchPdfFeeds();
                    })
                    .fail(() => {
                        this.fetchPdfFeeds();
                    })
                    .always(() => {

                    });
            },
            discard() {
                this.fetchPdfFeeds();
                this.selectedId = null;
            },
            fetchPdfFeeds() {
                this.loading = true;
                FluentFormsGlobal.$get({
                    form_id: this.form_id,
                    action: 'fluentform_pdf_admin_ajax_actions',
                    route: 'get_feeds'
                })
                    .then(response => {
                        this.pdf_feeds = response.data.pdf_feeds;
                        this.templates = response.data.templates;
                    })
                    .fail(e => {
                        console.log(e);
                    })
                    .always(() => {
                        this.loading = false;
                    });
            }
        },
        mounted() {
            this.fetchPdfFeeds();
            jQuery("title").text("PDF Feeds - Fluent Forms");
        }
    };
</script>

<style lang="scss">
    .ff_each_template {
        margin-bottom: 20px;

        .ff_card {
            border: 1px solid #dddddd;
            cursor: pointer;
            text-align: center;
            padding: 10px;

            .ff_template_label {
                font-weight: bold;
            }

            &:hover {
                opacity: 0.8;
                border: 2px solid #409eff;
            }
        }

        img {
            max-width: 100%;
        }
    }
</style>
