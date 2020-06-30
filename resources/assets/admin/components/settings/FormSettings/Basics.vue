<template>
    <el-form ref="form-button" label-width="205px" label-position="left">
        <!--Redirect to-->
        <el-form-item label="Redirect To">
            <template slot="label">
                Redirect To

                <el-tooltip class="item" placement="bottom-start" effect="light">
                    <div slot="content">
                        <h3>Confirmation Type</h3>

                        <p>
                            After successful submit, where the page will redirect to.
                        </p>
                    </div>

                    <i class="el-icon-info el-text-info"></i>
                </el-tooltip>
            </template>

                <el-radio
                        v-for="(option, value) in redirectToOptions"
                        :key="option"
                        :label="option"
                        :value="value">
                </el-radio>
        </el-form-item>

        <!--Additional fields based on the redirect to selection-->
        <transition name="fade">
            <!--Message to show-->
            <el-form-item label="Message to show" v-if="form.redirectTo == 'samePage'">
                <el-input type="textarea" v-model="form.messageToShow"></el-input>
            </el-form-item>

            <!--Custom page-->
            <el-form-item label="Page" v-else-if="form.redirectTo == 'customPage'">
                <el-input v-model="form.customPage"></el-input>
            </el-form-item>

            <!--Custom URL-->
            <el-form-item label="Custom URL" v-else>
                <el-input v-model="form.customUrl"></el-input>
            </el-form-item>
        </transition>
    </el-form>
</template>

<script>
    export default {
        name: 'FormBasics',
        props: {
            data: {
                required: true
            }
        },
        computed: {
            form() {
                return this.data;
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
    };
</script>
