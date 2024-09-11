<template>
    <div class="ff_choose_template_wrap" :class="{'ff_backdrop': visibility}">
        <el-dialog
            :model-value="visibility"
            @update:model-value="$emit('update:visibility', $event)"
            width="70%"
            top= "50px"
            :before-close="close"
        >
            <template slot="title">
                <h3 class="title">{{$t('Create Using ChatGPT')}}</h3>
                <p>{{ $t('Use AI to create the initial structure. The response uses ChatGPT, so please note that there might be some inaccuracy in the output.') }}</p>
            </template>

            <div class="mt-6">
                <el-form class="mt-4" :model="{}" label-position="top" >
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
                additional_query: '',
                creatingForm: false,
                loading: false,
                has_pro: !!window.FluentFormApp.hasPro,
                current: null,
            }
        },
        emits: ['update:visibility'],
        computed: {
        },
        methods: {
            close() {
                this.$emit('update:visibility', false);
            },

            createForm() {
                this.loading = true;
	            FluentFormsGlobal.$post({
			            action: 'fluentform_chat_gpt_create_form',
			            query: this.query,
			            additional_query: this.additional_query,
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
