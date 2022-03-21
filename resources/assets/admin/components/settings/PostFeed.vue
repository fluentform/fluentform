<template>
    <div class="post_feed">
        <div class="setting_header el-row">
            <div class="el-col el-col-24 el-col-md-12">
                <h2 v-if="!feed.id">Create New Feed</h2>
                <h2
                        v-else
                        v-html="feedTitleForEdit"
                ></h2>
            </div>

            <div class="action-buttons clearfix mb15 text-right el-col el-col-24 el-col-md-12">
                <el-button
                        size="small"
                        type="success"
                        @click="saveFeed"
                        icon="el-icon-success"
                        style="margin-right:10px;"
                >Save Feed
                </el-button>

                <el-button
                        plain
                        size="small"
                        type="primary"
                        icon="el-icon-arrow-left"
                        @click="$emit('show-post-feeds')"
                >Back
                </el-button>
            </div>
        </div>

        <div class="post_feed">
            <el-form label-width="160px" label-position="right">

                <el-form-item label="Feed Name">
                    <el-input size="small" v-model="feed.value.feed_name"/>
                </el-form-item>

                <el-form-item label="Post Type">
                    <el-input
                            disabled
                            size="small"
                            v-model="post_settings.post_info.value.post_type"
                    />
                </el-form-item>
                <el-form-item label="Submissoin Type">
                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>Create or Update Post</h3>
                            <p>
                                For post update only one feed is avaiable, if you have more then one the first one will work.
                            </p>
                        </div>
                        <i class="el-icon-info el-text-info"></i>
                    </el-tooltip>
                    <el-radio-group v-model="feed.value.post_form_type">
                        <el-radio label="new">New Post</el-radio>
                        <el-radio label="update">Update Post</el-radio>
                        
                    </el-radio-group>
                </el-form-item>

                <el-form-item label="Post Status">
                    <el-select v-model="feed.value.post_status" style="width:100%;">
                        <el-option
                                v-for="status in postStatuses"
                                :key="status"
                                :value="status"
                                :label="status | ucFirst"
                        />
                    </el-select>
                </el-form-item>

                <el-form-item label="Comment Status">
                    <el-select v-model="feed.value.comment_status" style="width:100%;">
                        <el-option
                                v-for="status in commentStatuses"
                                :key="status"
                                :value="status"
                                :label="status | ucFirst"
                        />
                    </el-select>
                </el-form-item>

                <el-form-item v-if="postFormats.length" label="Post Format">
                    <el-select v-model="feed.value.post_format" style="width:100%;">
                        <el-option
                                v-for="format in postFormats"
                                :key="format"
                                :value="format"
                                :label="format | ucFirst"
                        />
                    </el-select>
                </el-form-item>

                <el-form-item v-if="post_settings.post_info.value.post_type == 'post'" label="Default Category">
                    <el-select clearable v-model="feed.value.default_category" style="width:100%;">
                        <el-option
                                v-for="item in categories"
                                :key="item.category_id"
                                :value="item.category_id"
                                :label="item.category_name"
                        />
                    </el-select>
                </el-form-item>

                <!-- Post Fields Mapping -->
                <div class="post_fields_mapping">
                    <strong style="font-size: 18px;">Post Fields Mapping</strong>

                    <hr style="clear:both;margin:20px 0;">

                    <el-table :data="feed.value.post_fields_mapping" size="medium" style="width: 100%">
                        <el-table-column label="#" type="index"/>

                        <el-table-column label="Post Fields">
                            <template slot-scope="scope">
                                {{ scope.row.post_field.replace(/_/, ' ').ucWords() }}
                            </template>
                        </el-table-column>

                        <el-table-column label="Form Fields">
                            <template slot-scope="scope">
                                <inputPopover
                                        fieldType="text"
                                        :data="editorShortcodes"
                                        v-model="scope.row.form_field"
                                />
                            </template>
                        </el-table-column>
                    </el-table>

                    <br />
                    <div class="ff_card_block">
                        <p>Note: All your taxonomies and featured image will be mapped automatically from your form fields</p>
                    </div>
                </div>

                <!-- Meta Fields Mapping -->
                <div class="meta_fields_mapping">
                    <strong style="font-size: 18px;">Meta Fields Mapping</strong>

                    <el-button
                            type="primary"
                            size="mini"
                            icon="el-icon-plus"
                            class="pull-right"
                            @click="addMetaFieldMapping"
                    >Add Meta Field
                    </el-button>

                    <hr style="clear:both;margin:20px 0;">

                    <div v-if="!feed.value.meta_fields_mapping.length" class="no-mapping-alert">
                        There is no mapping of meta fields.
                    </div>

                    <el-row
                            v-else
                            :gutter="20"
                            :key="'meta'+key"
                            v-for="(mapping, key) in feed.value.meta_fields_mapping"
                    >
                        <!-- Meta Key -->
                        <el-col :span="11">
                            <el-form-item label="Meta Key">
                                <el-input
                                        size="small"
                                        v-model="mapping.meta_key"
                                        placeholder="Enter Meta Key..."
                                        @input="validateMetaKey(mapping)"
                                />
                            </el-form-item>
                        </el-col>

                        <!-- Meta Value -->
                        <el-col :span="11">
                            <el-form-item label="Meta Value">
                                <inputPopover
                                        fieldType="text"
                                        :data="editorShortcodes"
                                        v-model="mapping.meta_value"
                                />
                            </el-form-item>
                        </el-col>

                        <!-- Delete Meta Mapping -->
                        <el-col :span="2">
                            <el-button
                                    type="danger"
                                    size="mini"
                                    icon="el-icon-close"
                                    style="margin-top:4px;"
                                    @click="deleteMapping(feed.value.meta_fields_mapping, key)"
                            />
                        </el-col>
                    </el-row>
                </div>

                <template v-if="post_settings.has_acf">
                    <post-meta-plugin-mapping
                        :general_settings="feed.value.acf_mappings"
                        :advanced_settings="feed.value.advanced_acf_mappings"
                        :labels="{
                        section_title: 'ACF Plugin Mapping',
                        remote_label: 'ACF Field',
                        local_label: 'Form Field (Value)'
                    }"
                        :general_fields="post_settings.acf_fields"
                        :advanced_fields="post_settings.acf_fields_advanced"
                        :form_fields="form_fields"
                        :editorShortcodes="editorShortcodes" />
                    <hr style="margin: 20px">
                </template>

                <template v-if="post_settings.has_metabox">
                    <post-meta-plugin-mapping
                        :general_settings="feed.value.metabox_mappings"
                        :advanced_settings="feed.value.advanced_metabox_mappings"
                        :labels="{
                        section_title: 'MetaBox (MB) Plugin Mapping',
                        remote_label: 'MetaBox (MB) Field',
                        local_label: 'Form Field (Value)'
                    }"
                        :general_fields="post_settings.metabox_fields"
                        :advanced_fields="post_settings.metabox_fields_advanced"
                        :form_fields="form_fields"
                        :editorShortcodes="editorShortcodes" />
                    <hr style="margin: 20px">
                </template>

                <filter-fields :fields="form_fields"
                               :conditionals="feed.value.conditionals"
                               :disabled="false"
                />

                <p style="height: 20px"></p>

                <el-form-item class="pull-right">
                    <el-button
                            size="small"
                            type="success"
                            @click="saveFeed"
                            icon="el-icon-success"
                    >Save Feed
                    </el-button>

                    <el-button
                            plain
                            size="small"
                            type="primary"
                            icon="el-icon-arrow-left"
                            @click="$emit('show-post-feeds')"
                    >Back
                    </el-button>
                </el-form-item>
            </el-form>
        </div>
    </div>
</template>

<script type="text/babel">
    import inputPopover from '../input-popover.vue';
    import FilterFields from './Includes/FilterFields.vue';
    import PostMetaPluginMapping from './_PostMetaPluginsMapping';
    import each from 'lodash/each';

    export default {
        name: 'PostFeed',
        components: {
            inputPopover,
            FilterFields,
            PostMetaPluginMapping
        },
        props: [
            'feed',
            'form_id',
            'form_fields',
            'post_settings',
            'editorShortcodes'
        ],
        data() {
            return {
                saving: false
            };
        },
        methods: {
            saveFeed() {
                this.saving = true;

                if (!this.feed.value.feed_name) {
                    return this.$notify({
                        title: 'Error',
                        message: 'Feed name is required.',
                        type: 'error',
                        offset: 32
                    });
                }

                let feed = {
                    meta_key: 'postFeeds',
                    id: this.feed.id,
                    form_id: this.form_id,
                    value: JSON.stringify(this.feed.value),
                    action: 'fluentform-settings-formSettings-store'
                };

                FluentFormsGlobal.$post(feed)
                    .done(response => {
                        this.feed.id = response.data.id;
                        this.feed.form_id = feed.form_id;
                        this.feed.meta_key = feed.meta_key;
                        this.feed.value = response.data.settings;

                        this.$emit('show-post-feeds', this.feed);

                        this.$notify({
                            title: 'Success',
                            message: response.data.message,
                            type: 'success',
                            offset: 32
                        });
                    })
                    .always(() => {
                        this.saving = false;
                    });
            },
            addPostFieldMapping() {
                this.feed.value.post_fields_mapping.push({
                    post_field: null,
                    form_field: null
                });
            },
            addMetaFieldMapping() {
                this.feed.value.meta_fields_mapping.push({
                    meta_key: '',
                    meta_value: ''
                });
            },
            deleteMapping(mappingSource, index) {
                mappingSource.splice(index, 1);
            },
            addAcfMetaFieldMapping() {
                this.feed.value.acf_mappings.push({
                    field_key: '',
                    field_value: ''
                });
            },
            deleteAcfMapping(index) {
                this.feed.value.acf_mappings.splice(index, 1);
            },
            addAcfAdvancedMetaFieldMapping() {
                if(!this.feed.value.advanced_acf_mappings) {
                    this.$set(this.feed.value, 'advanced_acf_mappings', []);
                }
                this.feed.value.advanced_acf_mappings.push({
                    field_key: '',
                    field_value: ''
                });
            },
            deleteAdvancedAcfMapping(index) {
                this.feed.value.advanced_acf_mappings.splice(index, 1);
            },
            validateMetaKey(mapping) {
                mapping.meta_key = mapping.meta_key.replace(/\s/, '_');
            },
            getFilteredFields(fieldKey) {
                let settingFields = this.post_settings.acf_fields_advanced[fieldKey];
                if (!settingFields) {
                    return {};
                }
                const fields = {};
                each(this.form_fields, (item, itemName) => {
                    if (settingFields.acceptable_fields.indexOf(item.element) !== -1) {
                        fields[itemName] = item;
                    }
                });
                return fields;
            }
        },
        computed: {
            feedTitleForEdit() {
                return `Edit <small class='feed_name'>(${this.feed.value.feed_name})</small>`;
            },
            postFields() {
                return this.post_settings.post_fields.filter(f => f !== 'featured_image');
            },
            postStatuses() {
                return this.post_settings.post_statuses;
            },
            commentStatuses() {
                return this.post_settings.comment_statuses;
            },
            postFormats() {
                return this.post_settings.post_formats;
            },
            categories() {
                return this.post_settings.categories;
            }
        },
        mounted() {
            jQuery('head title').text('Edit Post Feed - Fluent Forms');
        }
    };
</script>

