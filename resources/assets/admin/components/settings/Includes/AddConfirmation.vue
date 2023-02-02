<template>
    <div class="ff_add_confirmation_form_elements">
        <div class="ff_block_item">
            <div class="ff_block_title_group mb-3">
                <h6 class="ff_block_title">{{ $t('Confirmation Type') }}</h6>
                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                    <div slot="content">
                        <p>
                            {{ $t('After submit, where the page will redirect to.') }}
                        </p>
                    </div>
                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                </el-tooltip>
            </div><!-- .ff_block_title_group -->
            <div class="ff_block_item_body">
                <el-radio 
                    v-for="(redirectOption, optionName) in redirectToOptions" 
                    v-model="confirmation.redirectTo" 
                    :label="optionName" 
                    border 
                    :key="optionName"
                >
                    {{ redirectOption }}
                </el-radio>

                <error-view field="redirectTo" :errors="errors" />
            </div><!-- .ff_block_item_body -->
        </div><!-- .ff_block_item -->

        <!--Same page-->
        <template v-if="confirmation.redirectTo === 'samePage'">
            <div class="ff_block_item">
                <div class="ff_block_title_group mb-3">
                    <h6 class="ff_block_title">{{ $t('Message to show') }}</h6>
                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                        <div slot="content">
                            <p>
                                {{ $t('Enter the text you would like the user to see on the confirmation page of this form.') }}
                            </p>
                        </div>
                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                    </el-tooltip>
                </div><!-- .ff_block_title_group -->
                <div class="ff_block_item_body">
                    <wp-editor :height="150" :editor-shortcodes="emailBodyeditorShortcodes" v-model="confirmation.messageToShow" />
                </div><!-- .ff_block_item_body -->
            </div><!-- .ff_block_item -->
            
            <div class="ff_block_item">
                <div class="ff_block_title_group mb-3">
                    <h6 class="ff_block_title">{{ $t('After Form Submission') }}</h6>
                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                        <div slot="content">
                            <p>
                                {{ $t('Select the behavior after form submission, whether you want to hide or reset the form.') }}
                            </p>
                        </div>
                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                    </el-tooltip>
                </div><!-- .ff_block_title_group -->
                <div class="ff_block_item_body">
                    <el-radio  v-model="confirmation.samePageFormBehavior" label="hide_form" border>
                        {{ $t('Hide Form') }}
                    </el-radio>
                    <el-radio v-model="confirmation.samePageFormBehavior" label="reset_form" border>
                        {{ $t('Reset Form') }}
                    </el-radio>
                </div><!-- .ff_block_item_body -->
            </div><!-- .ff_block_item -->
        </template>

        <!--Custom page-->
        <div class="ff_block_item" v-else-if="confirmation.redirectTo === 'customPage'" :class="errors.has('customPage') ? 'is-error' : ''">
            <div class="ff_block_title_group mb-3">
                <h6 class="ff_block_title"> {{ $t('Select Page') }}</h6>
                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                    <div slot="content">
                        <p>
                            {{ $t('Select the page you would like the user to be redirected to after they have submitted the form.') }}
                        </p>
                    </div>
                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                </el-tooltip>
            </div><!-- .ff_block_title_group -->
            <div class="ff_block_item_body">
                <el-select class="w-100" v-model="confirmation.customPage" filterable placeholder="Select">
                    <el-option
                        v-for="page in pages"
                        :key="page.ID"
                        :label="page.post_title"
                        :value="page.ID"
                    />
                </el-select>
                <error-view field="customPage" :errors="errors" />
            </div><!-- .ff_block_item_body -->
        </div><!-- .ff_block_item -->

        <!--Custom URL-->
        <div class="ff_block_item" :class="errors.has('customUrl') ? 'is-error' : ''" v-else-if="confirmation.redirectTo === 'customUrl'">
            <div class="ff_block_title_group mb-3">
                <h6 class="ff_block_title">{{ $t('Custom URL') }}</h6>
                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                    <div slot="content">
                        <p>
                            {{ $t('Enter the URL of the webpage you would like the user to be redirected to after they have submitted the form.') }}
                        </p>
                    </div>
                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                </el-tooltip>
            </div><!-- .ff_block_title_group -->
            <div class="ff_block_item_body">
                <input-popover fieldType="text"
                    :placeholder="$t('Redirect URL')"
                    v-model="confirmation.customUrl"
                    :data="inputsFirstShortcodes"
                ></input-popover>
                <error-view field="customUrl" :errors="errors" />
            </div><!-- .ff_block_item_body -->
        </div><!-- .ff_block_item -->


        <!-- Redirection Message to show-->
        <template v-if="confirmation.redirectTo === 'customPage' || confirmation.redirectTo === 'customUrl'">
            <div class="ff_block_item">
                <div class="ff_block_title_group mb-3">
                    <h6 class="ff_block_title">  {{ $t('Redirect Query String') }}</h6>
                </div><!-- .ff_block_title_group -->
                <div class="ff_block_item_body">
                    <el-checkbox v-model="confirmation.enable_query_string" true-label="yes" false-label="no">
                        {{ $t('Pass Field Data Via Query String') }}
                    </el-checkbox>
                    <div v-if="confirmation.enable_query_string == 'yes'" class="mt-3">
                        <input-popover
                            fieldType="text"
                            :placeholder="$t('Redirect Query String')"
                            v-model="confirmation.query_strings"
                            :data="inputsFirstShortcodes"
                        ></input-popover>
                        <p class="mt-1 fs-14"><em>Sample: phone={inputs.phone}&amp;email={inputs.email}</em></p>
                    </div>
                </div><!-- .ff_block_item_body -->
            </div><!-- .ff_block_item -->

            <div class="ff_block_item">
                <div class="ff_block_title_group mb-3">
                    <h6 class="ff_block_title">{{ $t('Redirection Message') }}</h6>
                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                        <div slot="content">
                            <p>
                                {{ $t('Enter the text you would like the user to see on the confirmation page when redirecting.') }}
                            </p>
                        </div>
                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                    </el-tooltip>
                </div><!-- .ff_block_title_group -->
                <div class="ff_block_item_body">
                    <wp-editor :height="100" :editor-shortcodes="emailBodyeditorShortcodes" v-model="confirmation.redirectMessage" />
                </div><!-- .ff_block_item_body -->
            </div><!-- .ff_block_item -->
        </template>

    </div>
</template>

<script type="text/babel">
    import wpEditor from '../../../../common/_wp_editor.vue';
    import errorView from '../../../../common/errorView.vue';
    import inputPopover from '../../input-popover.vue';

    export default {
        name: 'AddConfirmation',
        components: {
            wpEditor,
            errorView,
            inputPopover
        },
        props: ['pages', 'editorShortcodes', 'confirmation', 'errors'],
        computed: {
            inputsFirstShortcodes() {
                return _ff.cloneDeep( this.editorShortcodes );
            },
            emailBodyeditorShortcodes() {
                const freshCopy = _ff.cloneDeep(this.editorShortcodes);
                if (freshCopy && freshCopy.length) {
                    freshCopy[0].shortcodes = {
                        ...freshCopy[0].shortcodes,
                        '{all_data}':'All Data',
                        '{all_data_without_hidden_fields}' : 'All Data Without Hidden Fields'
                    };
                }
                return freshCopy;
            }
        },
        data() {
            return {
                redirectToOptions: {
                    samePage: 'Same Page',
                    customPage: 'To a Page',
                    customUrl: 'To a Custom URL'
                },
            }
        }
    }
</script>
