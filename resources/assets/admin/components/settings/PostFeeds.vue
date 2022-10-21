<template>
    <div class="post_feeds">
        <div v-if="show_feeds">
            <div class="setting_header el-row">
                <div class="el-col el-col-24 el-col-md-12">
                    <h2>{{ $t('Post Feeds') }}</h2>
                </div>

                <div class="action-buttons clearfix mb15 text-right el-col el-col-24 el-col-md-12">
                    <el-button
                        size="small"
                        type="primary"
                        icon="el-icon-plus"
                        @click="addPostFeed"
                    >{{ $t('Add Post Feed') }}</el-button>
                </div>
            </div>

            <el-table :data="feeds" style="width: 100%">
                <el-table-column width="180">
                    <template slot-scope="scope">
                        <el-switch
                            v-model="scope.row.value.feed_status"
                            active-color="#13ce66"
                            inactive-color="#ff4949"
                            @change="handleActive(scope.$index)"
                        />
                    </template>
                </el-table-column>

                <el-table-column :label="$t('Status')">
                    <template slot-scope="scope">
                        <span :class="{
                            green: scope.row.value.feed_status,
                            red: !scope.row.value.feed_status
                        }">
                            {{ scope.row.value.feed_status ? $t('Enabled') : $t('Disabled') }}
                        </span>
                    </template>
                </el-table-column>

                <el-table-column :label="$t('Name')">
                    <template slot-scope="scope">{{ scope.row.value.feed_name }}</template>
                </el-table-column>

                <el-table-column :label="$t('Actions')" align="right">
                    <template slot-scope="scope">
                        <el-button
                            size="mini"
                            type="primary"
                            icon="el-icon-setting"
                            @click="editPostFeed(scope.row)"
                        />
                        
                        <remove @on-confirm="deletePostFeed(scope.$index, scope.row)"></remove>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <PostFeed
            v-else
            :feed="feed"
            :form_id="form_id"
            :form_fields="$attrs.inputs"
            :post_settings="post_settings"
            :editorShortcodes="$attrs.editorShortcodes"
            @show-post-feeds="showPostFeeds"
        />
    </div>
</template>

<script type="text/babel">
    import PostFeed from './PostFeed';
    import remove from '../confirmRemove.vue'

    export default {
        name: 'PostFeeds',
        components: { PostFeed, remove },
        data() {
            return {
                feed: null,
                feeds: [],
                show_feeds: true,
                post_settings: null,
                show_popover: false
            };
        },
        methods: {
            getPostSettings() {
                FluentFormsGlobal.$get({
                    action: 'fluentform_get_post_settings',
                    form_id: this.form_id
                }).done(response => {
                    this.post_settings = response.data;
                });
            },
            fetchPostFeeds() {
                FluentFormsGlobal.$get({
                    action: 'fluentform-settings-formSettings',
                    form_id: this.form_id,
                    meta_key: 'postFeeds',
                    is_multiple: true
                }).done(response => {
                    this.feeds = response.data.result;
                });
            },
            addPostFeed() {
                let feed = { ...this.post_settings.default_feed };

                feed.meta_fields_mapping = [];

                jQuery.each(feed.post_fields_mapping, (i, v) => {
                    feed.post_fields_mapping[i].form_field = null;
                });

                this.feed = { value: { ...feed } };

                this.show_feeds = false;
            },
            editPostFeed(feed) {
                feed.value = {
                    ...this.post_settings.default_feed,
                    ...feed.value
                };

                this.feed = feed;

                this.show_feeds = false;
            },
            deletePostFeed(index, feed) {
                FluentFormsGlobal.$post({
                    action: 'fluentform-settings-formSettings-remove',
                    id: feed.id,
                    form_id: feed.form_id
                })
                .done(response => {

                    this.feeds.splice(index, 1);

                    this.$success(this.$t('Successfully deleted the feed.'));
                });
            },
            handleActive(index) {
                let feed = this.feeds[index];

                let id = feed.id;

                delete (feed.id);

                let data = {
                    id,
                    form_id: this.form_id,
                    meta_key: 'postFeeds',
                    value: JSON.stringify(feed.value),
                    action: 'fluentform-settings-formSettings-store'
                };

                FluentFormsGlobal.$post(data).done(response => {
                    feed.id = response.data.id;

                    let handle = feed.value.status ? 'enabled' : 'disabled';

                    this.$success(this.$t('Successfully ' + handle + ' the feed.'));
                }).fail(e => {
                    feed.id = id;
                });
            },
            showPostFeeds(feed) {
                if (!feed) {
                    this.feed = null;
                    this.show_feeds = true;
                    return;
                }

                let index = this.feeds.findIndex(item => item.id === feed.id);

                if (index > -1) {
                    this.feeds.splice(index, 1, feed);
                } else {
                    this.feeds.push(feed);
                }
            }
        },
        created() {
            this.form_id = window.FluentFormApp.form_id;
            this.fetchPostFeeds();
            this.getPostSettings();
            jQuery('head title').text('Post Feeds - Fluent Forms');
        }
    };    
</script>
