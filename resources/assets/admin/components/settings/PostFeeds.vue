<template>
    <div class="post_feeds">
        <card v-if="show_feeds">
            <card-head>
                <card-head-group class="justify-between">
                    <h5 class="title">{{ $t('Post Feeds') }}</h5>
                    <el-button
                        size="medium"
                        type="info"
                        icon="el-icon-plus"
                        @click="addPostFeed"
                    >
                        {{ $t('Add Post Feed') }}
                    </el-button>
                </card-head-group>
            </card-head>
            <card-body>
                <div class="ff-table-container">
                    <el-table :data="feeds" style="width: 100%">
                        <el-table-column width="180" :label="$t('Status')">
                            <template slot-scope="scope">
                                <span class="mr-3" :class="{
                                    green: scope.row.value.feed_status,
                                    red: !scope.row.value.feed_status
                                }">
                                    {{ scope.row.value.feed_status ? $t('Enabled') : $t('Disabled') }}
                                </span>
                                <el-switch
                                    :width="40"
                                    active-color="#00b27f" 
                                    @change="handleActive(scope.$index)" 
                                    v-model="scope.row.value.feed_status"
                                ></el-switch>
                            </template>
                        </el-table-column>

                        <el-table-column :label="$t('Name')">
                            <template slot-scope="scope">{{ scope.row.value.feed_name }}</template>
                        </el-table-column>

                        <el-table-column :label="$t('Actions')" align="right">
                            <template slot-scope="scope">
                                <btn-group size="sm">
                                    <btn-group-item>
                                        <el-button
                                            class="el-button--soft el-button--icon"
                                            size="small"
                                            type="primary"
                                            icon="el-icon-setting"
                                            @click="editPostFeed(scope.row)"
                                        />
                                    </btn-group-item>
                                    <btn-group-item>
                                        <remove @on-confirm="deletePostFeed(scope.$index, scope.row)">
                                            <el-button
                                                class="el-button--soft el-button--icon"
                                                size="small"
                                                type="danger"
                                                icon="el-icon-delete"
                                            />
                                        </remove>
                                    </btn-group-item>
                                </btn-group>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </card-body>
        </card>

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
    import remove from '../confirmRemove.vue';
    import BtnGroup from '@/admin/components/BtnGroup/BtnGroup.vue';
    import BtnGroupItem from '@/admin/components/BtnGroup/BtnGroupItem.vue';
    import Card from '@/admin/components/Card/Card.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';
    import CardHeadGroup from '@/admin/components/Card/CardHeadGroup.vue';

    export default {
        name: 'PostFeeds',
        components: { 
            PostFeed, 
            remove,
            Card,
            CardHead,
            CardBody,
            CardHeadGroup,
            BtnGroup,
            BtnGroupItem
        },
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
                const url = FluentFormsGlobal.$rest.route('getFormSettings', this.form_id);
            
                FluentFormsGlobal.$rest.get(url, {
                    meta_key: 'postFeeds',
                    is_multiple: true
                }).then(response => {
                    this.feeds = response;
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
                const url = FluentFormsGlobal.$rest.route('deleteFormSettings', feed.form_id);

                FluentFormsGlobal.$rest.delete(url, {meta_id: feed.id})
                    .then(response => {
                        this.feeds.splice(index, 1);
                        this.$success(this.$t('Successfully deleted the feed.'));
                    });
            },
            handleActive(index) {
                let feed = this.feeds[index];

                let id = feed.id;

                delete (feed.id);

                let data = {
                    meta_id: id,
                    meta_key: 'postFeeds',
                    value: JSON.stringify(feed.value),
                };

                const url = FluentFormsGlobal.$rest.route('storeFormSettings', this.form_id);
            
                FluentFormsGlobal.$rest.post(url, data)
                    .then(response => {
                        feed.id = response.id;

                        let handle = feed.value.status ? 'enabled' : 'disabled';

                        this.$success(this.$t('Successfully %s the feed.', handle));
                    }).catch(e => {
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
