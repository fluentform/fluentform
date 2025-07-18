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
                            <h5 class="title">{{ $t('Edit PDF Feed - %s', selectedId) }}</h5>
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
                <div class="ff-table-container" v-if="!selectedId">
                    <el-table :data="pdf_feeds" stripe>
                        <el-table-column prop="name" :label="$t('Name')"></el-table-column>
                        <el-table-column prop="template_key" :label="$t('Template')">
                            <template slot-scope="scope">
                                <el-tag v-if="scope.row.template_type === 'custom'" type="success">
                                    {{ $t('Custom Builder') }}
                                </el-tag>
                                <span v-else>{{ scope.row.template_key }}</span>
                            </template>
                        </el-table-column>
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
                    :inputs="inputs"
                />
            </card-body>
        </card>

        <!-- Enhanced Template Selection Dialog -->
        <el-dialog
            v-loading="creating"
            :element-loading-text="$t('Creating Feed. Please wait...')"
            :visible.sync="addVisible"
            width="70%"
        >
            <template slot="title">
                <h4>{{$t('Create new PDF Feed')}}</h4>
            </template>
            <div class="ff_modal_container mt-4">
                <h6 class="mb-3">{{ $t('Please Select a Template') }}</h6>
                
                <!-- Template Type Selector -->
                <el-radio-group v-model="templateType" class="template-type-selector mb-4">
                    <el-radio-button label="predefined">{{ $t('Predefined Templates') }}</el-radio-button>
                    <el-radio-button label="custom">{{ $t('Custom Builder') }}</el-radio-button>
                </el-radio-group>

                <!-- Predefined Templates -->
                <div v-if="templateType === 'predefined'">
                    <el-row :gutter="20">
                        <el-col class="ff_each_template" v-for="(template, templateIndex) in templates" :key="templateIndex" :span="6">
                            <div @click="createFeed(templateIndex)" class="ff_card">
                                <img :src="template.preview"/>
                                <div class="ff_template_label">{{template.name}}</div>
                            </div>
                        </el-col>
                    </el-row>
                </div>

                <!-- Custom Builder Option -->
                <div v-else class="custom-builder-option">
                    <div class="custom-builder-card" @click="createCustomFeed">
                        <div class="custom-builder-icon">
                            <i class="el-icon-magic-stick"></i>
                        </div>
                        <h4>{{ $t('Drag & Drop Builder') }}</h4>
                        <p>{{ $t('Create custom PDF layouts with our visual builder') }}</p>
                        <ul class="feature-list">
                            <li>{{ $t('Drag and drop elements') }}</li>
                            <li>{{ $t('Custom positioning') }}</li>
                            <li>{{ $t('Form field integration') }}</li>
                            <li>{{ $t('Real-time preview') }}</li>
                        </ul>
                    </div>
                </div>
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
            templateType: 'predefined',
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
                template: templateName,
                template_type: 'predefined'
            })
                .then(response => {
                    this.selectedId = response.data.feed_id;
                    this.$notify.success({
                        message: response.data.message
                    });
                    this.addVisible = false;
                })
                .always(() => {
                    this.creating = false;
                });
        },

        createCustomFeed() {
            this.creating = true;
            FluentFormsGlobal.$post({
                form_id: this.form_id,
                action: 'fluentform_pdf_admin_ajax_actions',
                route: 'create_feed',
                template: 'custom',
                template_type: 'custom'
            })
                .then(response => {
                    this.selectedId = response.data.feed_id;
                    this.$notify.success({
                        message: response.data.message
                    });
                    this.addVisible = false;
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

<style scoped>
.template-type-selector {
    width: 100%;
    text-align: center;
}

.custom-builder-option {
    display: flex;
    justify-content: center;
    padding: 40px 20px;
}

.custom-builder-card {
    max-width: 400px;
    text-align: center;
    padding: 40px 30px;
    border: 2px dashed #409eff;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
}

.custom-builder-card:hover {
    border-color: #66b1ff;
    background-color: #f0f9ff;
}

.custom-builder-icon {
    font-size: 48px;
    color: #409eff;
    margin-bottom: 20px;
}

.custom-builder-card h4 {
    color: #409eff;
    margin-bottom: 15px;
}

.custom-builder-card p {
    color: #666;
    margin-bottom: 20px;
}

.feature-list {
    list-style: none;
    padding: 0;
    text-align: left;
}

.feature-list li {
    padding: 5px 0;
    color: #666;
}

.feature-list li:before {
    content: "✓";
    color: #67c23a;
    font-weight: bold;
    margin-right: 8px;
}
</style>
