<template>
    <div class="ff_webhook_wrap">
        <card>
            <card-head>
                <card-head-group class="justify-between">
                    <h5 class="title">{{ $t("WebHooks Integration") }}</h5>
                    <btn-group>
                        <btn-group-item>
                            <el-button
                                v-if="show_edit"
                                @click="backToHome()"
                                size="large"
                                type="info"
                                class="el-button--soft"
                            >
                                <template #icon>
                                    <i class="ff-icon ff-icon-arrow-left"></i>
                                </template>
                                {{ $t("Back") }}
                            </el-button>
                            <el-button
                                v-else
                                @click="add"
                                type="info"
                                size="large"
                            >
                                <template #icon>
                                    <i class="ff-icon ff-icon-plus"></i>
                                </template>
                                {{ $t("Add Webhook") }}
                            </el-button>
                        </btn-group-item>
                    </btn-group>
                </card-head-group>
            </card-head>
            <card-body>
                <!-- WebHook Feeds Table: 1 -->
                <div class="ff-table-wrap" v-if="!show_edit">
                    <el-skeleton :loading="loading" animated :rows="6">
                        <el-table class="ff_table_s2" :data="tableData">
                            <template #empty>
                                <p v-html="
                                    $t(
                                        'You don\'t have any feeds configured. Let\'s %sCreate One%s',
                                        `<a href='#' onclick='window.ffAddWebhookFeed()'>`,
                                        '</a>'
                                    )
                                ">
                                </p>
                            </template>

                            <el-table-column width="100">
                                <template #default="scope">
                                    <el-switch active-color="#13ce66" @change="handleActive(scope.row)"
                                               v-model="scope.row.formattedValue.enabled"></el-switch>
                                </template>
                            </el-table-column>

                            <el-table-column
                                prop="formattedValue.name"
                                :label="$t('Name')">
                            </el-table-column>

                            <el-table-column
                                prop="formattedValue.request_url"
                                :label="('WebHook URL')">
                            </el-table-column>

                            <el-table-column width="160" :label="$t('Actions')" class-name="action-buttons">
                                <template #default="scope">
                                    <btn-group>
                                        <btn-group-item>
                                            <el-button
                                                class="el-button--icon"
                                                @click="edit(scope.$index)"
                                                type="primary"
                                                size="small"
                                            >
                                                <template #icon>
                                                    <i class="el-icon-setting"></i>
                                                </template>
                                            </el-button>
                                        </btn-group-item>
                                        <btn-group-item>
                                            <remove @on-confirm="remove(scope.row.id)">
                                                <el-button
                                                    class="el-button--icon"
                                                    size="small"
                                                    type="danger"
                                                >
                                                    <template #icon>
                                                        <i class="el-icon-delete"></i>
                                                    </template>
                                                </el-button>
                                            </remove>
                                        </btn-group-item>
                                    </btn-group>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-skeleton>
                </div>
                <!-- WebHook Feed Editor -->
                <editor
                    v-if="show_edit"
                    :fields="inputs"
                    :form_id="form.id"
                    :has_pro="has_pro"
                    :edit_item="editing_item"
                    :selected_id="selected_id"
                    :ajax_actions="ajaxActions"
                    :setSelectedId="setSelectedId"
                    :selected_index="selectedIndex"
                    :request_headers="request_headers"
                    :editor_Shortcodes="editorShortcodes"
                    @back-to-home="backToHome"
                ></editor>
            </card-body>
        </card>
    </div>
</template>

<script>
import remove from "../../confirmRemove.vue";
import inputPopover from "../../input-popover.vue";
import Editor from "./Editor.vue";
import BtnGroup from "@/admin/components/BtnGroup/BtnGroup.vue";
import BtnGroupItem from "@/admin/components/BtnGroup/BtnGroupItem.vue";
import Card from "@/admin/components/Card/Card.vue";
import CardBody from "@/admin/components/Card/CardBody.vue";
import CardHead from "@/admin/components/Card/CardHead.vue";
import CardHeadGroup from "@/admin/components/Card/CardHeadGroup.vue";

export default {
    name: "WebHook",
    props: ["form", "inputs", "has_pro", "editorShortcodes"],
    components: {
        remove,
        Editor,
        inputPopover,
        Card,
        CardHead,
        CardBody,
        CardHeadGroup,
        BtnGroup,
        BtnGroupItem
    },
    data() {
        return {
            loading: true,
            configure_url: "",
            editing_item: null,
            selected_id: 0,
            selectedIndex: null,
            show_edit: false,
            integrations: [],
            webHook_lists: [],
            request_headers: [],
            webHookCustomFields: null,
            errors: new Errors,
            ajaxActions: {
                saveFeed: "fluentform-save-webhook"
            }
        }
    },
    methods: {
        setSelectedId(id) {
            this.selected_id = id;
        },
        backToHome() {
            this.getFeeds(true);
            this.selected_id = 0;
            this.selectedIndex = 0;
            this.show_edit = false;
        },
        add() {
            this.selectedIndex = this.integrations.length;
            this.selected_id = 0;
            this.editing_item = false;
            this.show_edit = true;
        },
        edit(index) {
            let integration = this.integrations[index];
            this.selectedIndex = 0;
            this.selected_id = integration.id;
            this.editing_item = integration.formattedValue;
            this.show_edit = true;
        },
        discard() {
            this.selected = null;
            this.selectedIndex = null;
            this.errors.clear();
        },
        handleActive(row) {
            let data = {
                form_id: this.form.id,
                notification_id: row.id,
                action: this.ajaxActions.saveFeed,
                notification: JSON.stringify(row.formattedValue)
            };

            FluentFormsGlobal.$post(data)
                .then(response => {
                    this.$success(response.data.message);
                })
                .fail(error => {
                    this.$fail(error.responseJSON.data.message);
                });
        },
        remove(id) {
            let data = {
                action: "fluentform-delete-webhook",
                id: id,
                form_id: this.form.id
            };

            FluentFormsGlobal.$post(data)
                .then(response => {
                    this.integrations = response.data.integrations;
                    this.$success(response.data.message);
                })
                .fail(e => console.log(e));
        },
        getFeeds(onlyFeeds = null) {
            let data = {
                form_id: this.form.id,
                action: "fluentform-get-webhooks"
            };

            FluentFormsGlobal.$get(data)
                .then(response => {
                    this.integrations = response.data.integrations;
                    this.request_headers = response.data.request_headers;
                    this.request_headers.push({
                        "label": "Add Custom Header",
                        "value": "__webhook_custom_header__"
                    });
                })
                .fail(e => console.log(e))
                .always(r => this.loading = false);
        }
    },
    computed: {
        tableData() {
            return this.integrations;
        }
    },
    beforeMount() {
        this.getFeeds();
    },
    mounted() {
        window.ffAddWebhookFeed = () => {
            this.add();
        };
    },
    beforeCreate() {
        jQuery("head title").text("WebHook Settings - Fluent Forms");
    },
    beforeUnmount() {
        delete window.ffAddWebhookFeed;
    }
}
</script>
