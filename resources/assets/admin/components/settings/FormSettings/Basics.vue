<template>
    <el-form ref="form-button" label-width="205px" label-position="left">
        <!--Redirect to-->
        <el-form-item :label="$t('Redirect To')">
            <template #label>
                {{ $t('Redirect To') }}

                <el-tooltip class="item" placement="bottom-start" effect="light">
                    <template #content>
                        <h3>{{ $t('Confirmation Type') }}</h3>

                        <p>
                            {{ $t('After successful submit, where the page will redirect to.') }}
                        </p>
                    </template>

                    <i class="ff-icon ff-icon-info-filled text-primary"></i>
                </el-tooltip>
            </template>

            <el-radio
                v-for="(option, value) in redirectToOptions"
                :key="option"
                :label="option"
                :value="value"
            >
                {{ option }}
            </el-radio>
        </el-form-item>

        <!--Additional fields based on the redirect to selection-->
        <transition name="fade">
            <!--Message to show-->
            <el-form-item :label="$t('Message to show')" v-if="form.redirectTo == 'samePage'">
                <el-input type="textarea" v-model="form.messageToShow"></el-input>
            </el-form-item>

            <!--Custom page-->
            <el-form-item :label="$t('Page')" v-else-if="form.redirectTo == 'customPage'">
                <el-input v-model="form.customPage"></el-input>
            </el-form-item>

            <!--Custom URL-->
            <el-form-item :label="$t('Custom URL')" v-else>
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
