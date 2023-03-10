<template>
    <span class="fluent_form_doc_video" v-if="current_doc">
        <el-button 
            class="el-button--soft" 
            v-if="btn_text" 
            :title="$t('Show Video')" 
            @click="introVisible=true" 
            :size="btn_size" 
            icon="ff-icon ff-icon-play-circle-filled"
            type="primary"
        >
        {{btn_text}}
        </el-button>

        <el-button v-else :title="$t('Show Video')" @click="introVisible=true" :size="btn_size" icon="el-icon-help"></el-button>
        <el-dialog
            :title="current_doc.title"
            :visible.sync="introVisible"
            :append-to-body="true"
            width="60%"
        >
            <div slot="title">
                <h4>{{current_doc.title}}</h4>
            </div>
            <div v-if="introVisible" class="videoWrapper mt-4 mb-4">
                <iframe class="w-100" style="height: 400px; border-radius: 8px;" :src="'https://www.youtube.com/embed/' + current_doc.video_id+'?autoplay=1'" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
            <span slot="footer" class="dialog-footer">
                <el-button @click="introVisible = false" type="text" class="el-button--text-light">{{ $t('Close') }}</el-button>
                <a v-if="current_doc.read_more" class="el-button el-button--primary" target="_blank" rel="noopener" :href="current_doc.read_more">
                    {{ $t('Read More') }}
                </a>
            </span>
    </el-dialog>
    </span>
</template>

<script type="text/babel">
export default {
    name: 'VideoInstruction',
    props: {
        route_id: {
            type: String
        },
        btn_text: {
            default: ''
        },
        btn_size: {
            default: 'small'
        }
    },
    data() {
        return {
            introVisible: false,
            docs: {
                formConfirmation: {
                    video_id: 'E0_xgmiqXoc',
                    title: 'Set up Form Submission Confirmation Message',
                    read_more: 'https://wpmanageninja.com/docs/fluent-form/how-to-use-wp-fluent-form/submission-confirmation-message/'
                },
                formEmailSettings: {
                    video_id: 'pltcvAqE1ww',
                    title: 'How to use Email Notifications',
                    read_more: 'https://wpmanageninja.com/docs/fluent-form/how-to-use-wp-fluent-form/send-users-email-notification-wp-fluent-form/'
                },
                conditionalEmailSettings: {
                    video_id: 'hZuK1OhrdOM',
                    title: 'Conditional Email Notifications Settings',
                    read_more: 'https://wpmanageninja.com/docs/fluent-form/advanced-features-functionalities-in-wp-fluent-form/conditional-email-notification/'
                },
                formScheduling: {
                    video_id: '30YRr8i1fuM',
                    title: 'Form Scheduling',
                    read_more: 'https://wpmanageninja.com/docs/fluent-form/advanced-features-functionalities-in-wp-fluent-form/form-scheduling/'
                },
                otherConfirmationSettings: {
                    video_id: 'IfU4TZzZhD8',
                    title: 'Conditional Confirmation Settings',
                    read_more: 'https://wpmanageninja.com/docs/fluent-form/advanced-features-functionalities-in-wp-fluent-form/conditional-confirmation-wp-fluent-form/'
                },
                formErrorMessage: {
                    video_id: '3N0DMrth1NA',
                    title: 'Form Error Message Customization',
                    read_more: 'https://wpmanageninja.com/docs/fluent-form/miscellaneous/error-message/'
                },
                google_sheet: {
                    video_id: 'ZR4zmlTlZok',
                    title: 'How to connect Google Sheet',
                    read_more: 'https://wpmanageninja.com/docs/fluent-form/integrations-available-in-wp-fluent-form/google-sheet-integration/'
                },
                mailchimp: {
                    video_id: 'v33r-MzQgaQ',
                    title: 'How to connect Mailchimp',
                    read_more: 'https://wpmanageninja.com/docs/fluent-form/integrations-available-in-wp-fluent-form/mailchimp-integration/'
                },
                activecampaign: {
                    video_id: 'F4i2RIyGZbM',
                    title: 'How to connect ActiveCampaign',
                    read_more: 'https://wpmanageninja.com/docs/fluent-form/integrations-available-in-wp-fluent-form/activecampaign-integration/'
                },
                getresponse: {
                    video_id: 'wzQpEkVQifw',
                    title: 'How to connect GetResponse',
                    read_more: 'https://wpmanageninja.com/docs/fluent-form/integrations-available-in-wp-fluent-form/getresponse-integration/'
                }
            },
            current_doc: null
        }
    },
    watch: {
        route_id() {
            this.current_doc = this.docs[this.route_id];
        }
    },
    mounted() {
        this.current_doc = this.docs[this.route_id];
    }
}
</script>
