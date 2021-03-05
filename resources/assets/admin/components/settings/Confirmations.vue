<template>
    <div>
        <el-row class="setting_header">
            <el-col :md="12">
                <h2>Other Confirmations</h2>
            </el-col>

            <!--Save settings-->
            <el-col :md="12" class="action-buttons clearfix mb15 text-right">
                <el-button v-if="selected" @click="discard"
                           class="pull-right" icon="el-icon-arrow-left" size="small"
                >Back
                </el-button>

                <template v-else>
                    <el-button v-if='has_pro' @click="add" type="primary"
                           size="small" icon="el-icon-plus"
                    >Add Confirmation
                    </el-button>

                    <el-button v-else @click="comingSoonVisibility = true" type="primary"
                           size="small" icon="el-icon-plus"
                    >Add Confirmation
                    </el-button>
                </template>
                <video-doc btn_text="Learn" route_id="otherConfirmationSettings" />
            </el-col>
        </el-row>

        <!-- Confirmation Items Table -->
        <el-table v-loading="confLoading" v-if="! selected" :data="confirmations" stripe class="el-fluid">
            <el-table-column width="100">
                <template slot-scope="scope">
                    <el-switch active-color="#13ce66" @change="handleActive(scope.$index)"
                               v-model="scope.row.active"
                    ></el-switch>
                </template>
            </el-table-column>

            <el-table-column prop="name" label="Name" width="200" class-name="content-ellipsis"></el-table-column>

            <el-table-column label="Content" class-name="content-ellipsis">
                <template slot-scope="scope">
                    <template v-if="scope.row.redirectTo === 'samePage'">
                        <span v-html="scope.row.messageToShow"></span>
                    </template>

                    <template v-else-if="scope.row.redirectTo === 'customUrl'">
                        <span v-html="scope.row.customUrl"></span>
                    </template>

                    <template v-else>
                        <span class="page" v-html="getPageUrl(scope.row.customPage)"></span>
                    </template>
                </template>
            </el-table-column>

            <el-table-column width="160" label="Actions" class-name="action-buttons">
                <template slot-scope="scope">
                    <el-tooltip class="item" effect="light" content="Duplicate notification settings" placement="top">
                        <el-button @click="clone(scope.$index)" type="success"
                                   icon="el-icon-plus" size="mini"
                        ></el-button>
                    </el-tooltip>

                    <el-button @click="edit(scope.$index)" type="primary"
                               icon="el-icon-setting" size="mini"
                    ></el-button>

                    <remove @on-confirm="remove(scope.$index, scope.row.id)"></remove>
                </template>
            </el-table-column>
        </el-table>
        
        <!-- Confirmation Item Editor -->
        <el-form v-if="selected" label-width="205px" label-position="left">
            <el-form-item>
                <template slot="label">
                    Confirmation Name

                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>Confirmation Name</h3>

                            <p>The name to identify each confirmation.</p>
                        </div>

                        <i class="el-icon-info el-text-info"></i>
                    </el-tooltip>
                </template>

                <el-input v-model="selected.name"></el-input>
            </el-form-item>

            <add-confirmation 
                :errors="errors"
                :pages="pages"
                :editorShortcodes="editorShortcodes"
                :confirmation="selected">
            </add-confirmation>

            <el-form-item>
                <template slot="label">
                    Conditional Logic

                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>Conditional Logic</h3>

                            <p>
                                Enable this feed conditionally
                            </p>
                        </div>

                        <i class="el-icon-info el-text-info"></i>
                    </el-tooltip>
                </template>

                <FilterFields :fields="inputs" :conditionals="selected.conditionals" :disabled="!has_pro"></FilterFields>
            </el-form-item>

            <div class="text-right">
                <el-button @click="store" size="medium" type="success" icon="el-icon-success">Save Notification</el-button>
            </div>
        </el-form>

        <coming-soon :visibility.sync="comingSoonVisibility" />
    </div>
</template>

<script type="text/babel">
    import Remove from '../confirmRemove.vue'
    import InputPopover from '../input-popover.vue'
    import FilterFields from './Includes/FilterFields'
    import ErrorView from '../../../common/errorView'
    import AddConfirmation from './Includes/AddConfirmation.vue'
    import ComingSoon from '../modals/ItemDisabled.vue'
    import VideoDoc from '@/common/VideoInstruction.vue';


    export default {
        name: 'Confirmations',
        props: {
            'form': Object,
            'form_id': [Number, String],
            'inputs': {
                type: Object,
                default: {}
            },
            'has_pro': Boolean,
            'editor-shortcodes': {
                type: Array,
                default: []
            }
        },
        components: {
            Remove,
            InputPopover,
            FilterFields,
            ErrorView,
            AddConfirmation,
            ComingSoon,
            VideoDoc
        },
        data() {
            return {
                confLoading: true,
                selected: null,
                selectedIndex: null,
                confirmations: [],
                mock: {
                    name: '',
                    active: true,
                    redirectTo: 'samePage',
                    messageToShow: 'Thank you for your message. We will get in touch with you shortly',
                    customPage: null,
                    samePageFormBehavior: 'hide_form',
                    customUrl: null,
                    conditionals: {
                        status: true,
                        type: 'all',
                        conditions: [
                            {
                                field: null,
                                operator: '=',
                                value: null
                            }
                        ]
                    },
                },
                pages: [],
                errors: new Errors,
                comingSoonVisibility: false,
            }
        },
        methods: {
            add() {
                this.selectedIndex = this.confirmations.length;

                this.selected = _ff.cloneDeep(this.mock);
            },
            clone(index) {
                let freshCopy = _ff.cloneDeep(this.confirmations[index]);

                freshCopy.name = `Copy of ${freshCopy.name}`;
                freshCopy.id = null;

                this.selected = freshCopy;
                this.selectedIndex = this.confirmations.length;
            },
            edit(index) {
                this.selectedIndex = index;

                let confirmation = this.confirmations[index];

                this.selected = _ff.cloneDeep(confirmation);

                this.selected.id = confirmation.id;
            },
            discard() {
                this.selected = null;
                this.selectedIndex = null;
                this.errors.clear();
            },

            handleActive(index) {
                let confirmation = this.confirmations[index];

                let id = confirmation.id;

                delete (confirmation.id);

                let data = {
                    form_id: this.form.id,
                    meta_key: 'confirmations',
                    value: JSON.stringify(confirmation),
                    id,
                    action: 'fluentform-settings-formSettings-store'
                };

                FluentFormsGlobal.$post(data)
                    .done(response => {
                        confirmation.id = response.id;

                        let handle = confirmation.active ? 'enabled' : 'disabled';

                        this.$notify.success({
                            message: 'Successfully ' + handle + ' the confirmation.',
                            offset: 30
                        });
                    })
                    .fail(e => {});
            },
            remove(index, id) {
                FluentFormsGlobal.$post({
                    action: 'fluentform-settings-formSettings-remove',
                    id,
                    form_id: this.form.id
                })
                    .done(response => {

                        this.confirmations.splice(index, 1);

                        this.$notify.success({
                            message: 'Successfully removed the confirmation.',
                            offset: 30
                        });
                    })
                    .fail(e => {});
            },

            getPages() {
                FluentFormsGlobal.$get({
                    action: 'fluentform-get-pages'
                })
                    .done(response => {
                        this.pages = response.data.pages;
                    })
                    .fail(e => {})
            },
            getPageUrl(id) {
                let page = this.pages[id];

                return page ? page.url : null;
            },

            fetch() {
                let data = {
                    form_id: this.form.id,
                    meta_key: 'confirmations',
                    action: 'fluentform-settings-formSettings'
                };

                FluentFormsGlobal.$get(data)
                    .done(response => {
                        this.confirmations = response.data.result.map((item) => {
                            const {value, ...rest} = item;
                            return {...rest, ...value};
                        });
                    })
                    .fail(e => {})
                    .always(_ => this.confLoading = false)
            },
            store() {
                this.errors.clear();

                let id = this.selected.id;

                delete (this.selected.id);

                let data = {
                    form_id: this.form.id,
                    meta_key: 'confirmations',
                    value: JSON.stringify(this.selected),
                    id,
                    action: 'fluentform-settings-formSettings-store'
                };

                FluentFormsGlobal.$post(data)
                    .done(response => {
                        this.selected.id = response.data.id;

                        this.confirmations.splice(this.selectedIndex, 1, this.selected);

                        this.$notify.success({
                            message: 'Successfully saved the confirmation.',
                            offset: 30
                        });

                        this.selected = null;

                        this.selectedIndex = null;
                    })
                    .fail(errors => {
                        this.errors.record(errors.responseJSON.errors);

                        this.selected.id = id;
                    });
            }
        },
        beforeMount() {
            this.fetch();
            this.getPages();

            // Back to all notifications by clicking on menu item
            jQuery('[data-hash="other_confirmations"]').on('click', this.discard);

            jQuery('head title').text('Other Confirmations - Fluent Forms');

        }
    }
</script>

<style lang="scss">
    @import "../../styles/var";
    @import "../../styles/el_customize";

    .content-ellipsis .cell {
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
    }

    .content-ellipsis .page a {
        text-decoration: none;
    }
</style>
