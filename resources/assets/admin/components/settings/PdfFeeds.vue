<template>
    <div v-loading="loading">
        <card>
            <card-head>
                <card-head-group class="justify-between">
                    <div>
                        <template v-if="!selectedId">
                            <h5 class="title">{{ $t('PDF Feeds') }}</h5>
                            <p class="text">{{ $t('Create PDF template feed and you can download the PDFs from each submission') }}</p>
                        </template>
                        <template v-else>
                            <h5 class="title">{{ $t('Edit PDF Feed ') }} - {{selectedId}}</h5>
                        </template>
                    </div>
                    <btn-group class="action-buttons">
                        <btn-group-item v-if="selectedId">
                            <el-button class="el-button--soft" @click="discard()" type="info" size="medium" icon="ff-icon ff-icon-arrow-left">
                                {{$t('Back')}}
                            </el-button>
                        </btn-group-item>
                        <btn-group-item v-else>
                            <el-button @click="addVisible = true" type="info" size="medium" icon="ff-icon ff-icon-plus">
                                {{ $t('Add PDF Feed') }}
                            </el-button>
                        </btn-group-item>
                    </btn-group>
                </card-head-group>
            </card-head>
            <card-body>
                <!-- Notification Table: 1 -->
                <div class="ff-table-container" v-if="!selectedId">
                    <el-table
                        :element-loading-text="$t('Fetching Notifications...')"
                        :data="pdf_feeds"
                        stripe
                    >
                        <el-table-column prop="name" :label="$t('Name')"></el-table-column>

                        <el-table-column prop="template_key" :label="$t('Template')"></el-table-column>

                        <el-table-column width="160" label="Actions" class-name="action-buttons">
                            <template slot-scope="scope">
                                <el-button
                                    @click="edit(scope.row.id)"
                                    type="primary"
                                    icon="el-icon-setting"
                                    class="el-button--icon"
                                    size="mini"
                                ></el-button>
                                <remove @on-confirm="remove(scope.row.id)">
                                    <el-button
                                        class="el-button--icon"
                                        size="mini"
                                        type="danger"
                                        icon="el-icon-delete"
                                    />
                                </remove>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>

                <feed-editor
                    v-else
                    :edit_id="selectedId"
                    :editorShortcodes="editorShortcodes"
                    :form_id="form_id"
                >
                </feed-editor>
            </card-body>
        </card>

        <el-dialog
            v-loading="creating"
            :element-loading-text="$t('Creating Feed. Please wait...')"
            :visible.sync="addVisible"
            width="60%"
        >
            <template slot="title">
                <h4>{{$t('Create new PDF Feed')}}</h4>
            </template>
            <div class="ff_modal_container mt-4">
                <h6 class="mb-3">{{ $t('Please Select a Template') }}</h6>
                <el-row :gutter="20">
                    <el-col class="ff_each_template" v-for="(template, templateIndex) in templates" :key="templateIndex" :span="6">
                        <div @click="createFeed(templateIndex)" class="ff_card">
                            <img :src="template.preview"/>
                            <div class="ff_template_label">{{template.name}}</div>
                        </div>
                    </el-col>
                </el-row>
            </div>
            <span slot="footer" class="dialog-footer">
                <el-button plain size="medium" @click="addVisible = false">{{ $t('Cancel') }}</el-button>
            </span>
        </el-dialog>

    </div>
</template>

<script>
    import BtnGroup from '@/admin/components/BtnGroup/BtnGroup.vue';
    import BtnGroupItem from '@/admin/components/BtnGroup/BtnGroupItem.vue';
    import Card from '@/admin/components/Card/Card.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';
    import CardHeadGroup from '@/admin/components/Card/CardHeadGroup.vue';
    import remove from "@/admin/components/confirmRemove.vue";
    import FeedEditor from './PdfFeed';

    export default {
        name: "PdfSettings",
        props: ["form_id", "inputs", "has_pro", "has_pdf", "editorShortcodes"],
        components: {
            remove,
            FeedEditor,
            Card,
            CardHead,
            CardBody,
            CardHeadGroup,
            BtnGroup,
            BtnGroupItem
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


