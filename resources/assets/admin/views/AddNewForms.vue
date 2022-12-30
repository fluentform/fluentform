<template>
    <div>
        <div class="ff_section_block">
            <div class="ff_section_head">
                <a :href="goToHomeURL" class="mb-4 ff_link_btn">
                    <i class="el-icon-back el-icon"></i> <span>Back to Homepage</span>
                </a>
                <div class="ff_section_title">Create A New Form</div>
            </div>
            <div class="ff_card_wrap">
                <el-row :gutter="20">
                    <el-col :sm="8" v-for="item in layoutOptions" :key="item.id">
                        <div class="ff_card">
                            <div class="ff_card_img mb-4">
                                <img :src="item.img" :alt="item.title">
                            </div>
                            <div class="ff_card_body">
                                <h5 class="mb-2 ff_card_title">{{item.title}}</h5>
                                <p class="ff_card_text">{{item.desc }}</p>
                            </div>
                        </div><!-- .ff_card -->
                    </el-col>
                </el-row>
            </div>
        </div>
        <div class="ff_section_block">
            <div class="ff_section_head">
                <div class="ff_section_title mb-3">Choose a Template</div>
                <p class="ff_section_desc">Here are some beautiful, fully customizable templates to get you started.</p>
            </div>
            <div class="ff_layout_options">
                <div class="ff_layout_sidebar">
                    <h4 class="ff_layout_title">Categoires</h4>
                    <ul class="ff_list">
                        <li class="ff_list_item"></li>
                    </ul>
                </div>
                <div class="ff_layout_main"></div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        name: "AddNewForms",
        components: {
           
        },
        data() {
            return {
                goToHomeURL: FluentFormsGlobal.fluent_forms_global_var.adminUrl + '?page=fluent_forms',
                layoutOptions: [
                    {
                        id: 'uid01',
                        img:  FluentFormsGlobal.fluent_forms_global_var.plugin_public_url + 'img/blank-form.png',
                        title: 'New Blank Form',
                        desc: 'Create a New Blank form from scratch.'
                    },
                    {
                        id: 'uid02',
                        img:  FluentFormsGlobal.fluent_forms_global_var.plugin_public_url + 'img/create-post-form.png',
                        title: 'Create A Post Form',
                        desc: 'Create a Post type form from scratch.'
                    },
                    {
                        id: 'uid03',
                        img:  FluentFormsGlobal.fluent_forms_global_var.plugin_public_url + 'img/conversational-form.png',
                        title: 'Create Conversational Form',
                        desc: 'Create Smart Form UI.'
                    }
                ]
            }
        },
    }
</script>
