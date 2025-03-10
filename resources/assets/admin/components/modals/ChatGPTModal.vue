<template>
    <div class="ff_choose_template_wrap" :class="{'ff_backdrop': visibility}">
        <el-dialog
            :visible.sync="visibility"
            width="70%"
            top= "50px"
            :before-close="close"
        >
            <template slot="title">
                <h3 class="title">{{$t(`Create Using ${ai_model === 'chat_gpt' ? $t('ChatGPT') : $t('Gemini')}`)}}</h3>
                <p>{{ $t(`Use AI to create the initial structure. The response uses ${ ai_model === 'chat_gpt' ? 'ChatGPT' : 'Gemini'}, so please note that there might be some inaccuracy in the output.`) }}</p>
            </template>

            <div class="mt-6">
                <el-form class="mt-4" :model="{}" label-position="top" >
	                <el-form-item v-if="has_chat_gpt" class="ff-form-item" :label="$t('Choose a model')">
		                <el-radio-group v-model="ai_model">
			                <el-radio-button label="default">{{ $t('Fluentform Default (Gemini)') }}</el-radio-button>
			                <el-radio-button label="chat_gpt">{{ $t('OpenAI ChatGPT') }}</el-radio-button>
		                </el-radio-group>
	                </el-form-item>
                    <el-form-item class="ff-form-item" :label="$t('Create a form for')">
                        <el-input :placeholder="$t('Customer Review for product')"  type="textarea" v-model="query">
                        </el-input>
                    </el-form-item>
                    <el-form-item class="ff-form-item" :label="$t('Including these questions')">
                        <el-input :placeholder="$t('User satisfaction level, most liked and disliked features')"  type="textarea" v-model="additional_query">
                        </el-input>
                    </el-form-item>
                    <el-button v-loading="loading" @click="createForm">
                        {{ $t('Create') }}
                    </el-button>
                </el-form>
            </div><!-- .ff_predefined_options -->
        </el-dialog>
    </div>
</template>

<script>

    export default {
        name: 'ChatGPTModal',
        props: {
            visibility: Boolean,
        },
        data() {
            return {
                query: '',
	            ai_model: !!window.FluentFormApp.has_gpt_feature ? 'chat_gpt' : 'default',
	            has_chat_gpt: !!window.FluentFormApp.has_gpt_feature,
                additional_query: '',
                creatingForm: false,
                loading: false,
                has_pro: !!window.FluentFormApp.hasPro,
                current: null,
            }
        },
        computed: {
        },
        methods: {
            close() {
                this.$emit('update:visibility', false);
            },

            createForm() {
                this.loading = true;
	            FluentFormsGlobal.$post({
			            action: 'fluentform_ai_create_form',
			            query: this.query,
			            additional_query: this.additional_query,
			            ai_model: this.ai_model,
		            })
                .then((response) => {
                    this.$notify.success({
	                    title: this.$t('Success'),
	                    message: response.data.message,
	                    position: 'bottom-right'
                    });
                    if (response.data.redirect_url) {
                        window.location.href = response.data.redirect_url;
                    }
                })
                .fail(error => {
                    this.$notify.error({
	                    title: this.$t('Error'),
	                    message: error.responseJSON?.data.message,
	                    position: 'bottom-right'
                    });
                })
                .always(() => {
                    this.loading = false;
                });
            },
        },
        mounted() {
        }
    };
</script>
