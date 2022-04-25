<template>
    <!--confirmation settings form-->
    <div>
        <!--Confirmation Type-->
        <el-form-item>
            <template slot="label">
                Confirmation Type

                <el-tooltip class="item" placement="bottom-start" effect="light">
                    <div slot="content">
                        <h3>Confirmation Type</h3>

                        <p>
                            After submit, where the page will redirect to.
                        </p>
                    </div>

                    <i class="el-icon-info el-text-info" />
                </el-tooltip>
            </template>

            <el-radio v-for="(redirectOption, optionName) in redirectToOptions"
                      v-model="confirmation.redirectTo" :label="optionName" border :key="optionName"
            >
                {{ redirectOption }}
            </el-radio>

            <error-view field="redirectTo" :errors="errors" />
        </el-form-item>

        <!--Additional fields based on the redirect to selection-->
        <!--Same page-->
        <div v-if="confirmation.redirectTo === 'samePage'" class="conditional-items">
            <!--Message to show-->
            <el-form-item>
                <template slot="label">
                    Message to show

                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>Confirmation Message Text</h3>

                            <p>
                                Enter the text you would like the user to <br>
                                see on the confirmation page of this form.
                            </p>
                        </div>

                        <i class="el-icon-info el-text-info" />
                    </el-tooltip>
                </template>

                <wp-editor :height="150" :editor-shortcodes="emailBodyeditorShortcodes" v-model="confirmation.messageToShow" />
            </el-form-item>

            <!--After form submisssion behavior-->
            <el-form-item>
                <template slot="label">
                    After Form Submission

                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>After Form Submission Behavior</h3>

                            <p>
                                Select the behavior after form submission, <br>
                                whether you want to hide or reset the form.
                            </p>
                        </div>

                        <i class="el-icon-info el-text-info"></i>
                    </el-tooltip>
                </template>

                <el-radio v-model="confirmation.samePageFormBehavior"
                            label="hide_form" border>Hide Form
                </el-radio>

                <el-radio v-model="confirmation.samePageFormBehavior"
                            label="reset_form" border>Reset Form
                </el-radio>
            </el-form-item>
        </div>

        <!--Custom page-->
        <el-form-item v-else-if="confirmation.redirectTo === 'customPage'"
                      class="conditional-items" :class="errors.has('customPage') ? 'is-error' : ''"
        >
            <template slot="label">
                Select Page

                <el-tooltip class="item" placement="bottom-start" effect="light">
                    <div slot="content">
                        <h3>Redirect Form to Page</h3>

                        <p>
                            Select the page you would like the user to be <br>
                            redirected to after they have submitted the form.
                        </p>
                    </div>

                    <i class="el-icon-info el-text-info" />
                </el-tooltip>
            </template>

            <el-select v-model="confirmation.customPage" filterable placeholder="Select">
                <el-option
                    v-for="page in pages"
                    :key="page.ID"
                    :label="page.post_title"
                    :value="page.ID"
                />
            </el-select>

            <error-view field="customPage" :errors="errors" />
        </el-form-item>

        <!--Custom URL-->
        <el-form-item class="conditional-items" :class="errors.has('customUrl') ? 'is-error' : ''" v-else-if="confirmation.redirectTo === 'customUrl'">
            <template slot="label">
                Custom URL

                <el-tooltip class="item" placement="bottom-start" effect="light">
                    <div slot="content">
                        <h3>Redirect Form to URL</h3>

                        <p>
                            Enter the URL of the webpage you would <br>
                            like the user to be redirected to after <br>
                            they have submitted the form.
                        </p>
                    </div>

                    <i class="el-icon-info el-text-info" />
                </el-tooltip>
            </template>

            <input-popover fieldType="text"
                            placeholder="Redirect URL"
                            v-model="confirmation.customUrl"
                            :data="inputsFirstShortcodes"
            ></input-popover>

            <error-view field="customUrl" :errors="errors" />
        </el-form-item>


        <!-- Redirection Message to show-->

        <template v-if="confirmation.redirectTo === 'customPage' || confirmation.redirectTo === 'customUrl'">
            <el-form-item label="Redirect Query String" class="conditional-items">
                <el-checkbox v-model="confirmation.enable_query_string" true-label="yes" false-label="no">Pass Field Data Via Query String</el-checkbox>
                <template v-if="confirmation.enable_query_string == 'yes'">
                    <input-popover
                        fieldType="text"
                        placeholder="Redirect Query String"
                        v-model="confirmation.query_strings"
                        :data="inputsFirstShortcodes"
                    ></input-popover>
                    <p><em>Sample: phone={inputs.phone}&email={inputs.email}</em></p>
                </template>
            </el-form-item>

            <el-form-item>
                <template slot="label">
                    Redirection Message
                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>Redirection Confirmation Message Text</h3>
                            <p>
                                Enter the text you would like the user to <br>
                                see on the confirmation page when redirecting.
                            </p>
                        </div>

                        <i class="el-icon-info el-text-info" />
                    </el-tooltip>
                </template>

                <wp-editor :height="100" :editor-shortcodes="emailBodyeditorShortcodes" v-model="confirmation.redirectMessage" />
            </el-form-item>

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
                        '{all_data}': 'All Data',
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
