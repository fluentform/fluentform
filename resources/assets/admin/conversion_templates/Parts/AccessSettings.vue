<template>
    <div class="ffc_access_settings">
        <card>
            <card-head>
                <h5 class="title">{{ $t('Access Settings') }}</h5>
            </card-head>
            <card-body>
                <p class="mb-4">
                    {{ $t('Control when this conversational form can be viewed and submitted.') }}
                </p>
                <p class="mb-4">
                    {{ $t('These controls reuse the same form restriction settings used in the regular form settings, so changes here apply to this form everywhere it is rendered.') }}
                </p>

                <form-restrictions
                    v-if="restrictions"
                    :data="restrictions"
                    :has-pro="hasPro"
                    :visible-sections="visibleSections"
                    :show-pro-restriction-fields="false"
                />
            </card-body>
        </card>
    </div>
</template>

<script type="text/babel">
    import Card from '@/admin/components/Card/Card.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';
    import FormRestrictions from '@/admin/components/settings/FormSettings/Restrictions.vue';

    export default {
        name: 'ConversationalAccessSettings',
        props: {
            formSettings: {
                type: Object,
                required: true
            },
            hasPro: {
                type: Boolean,
                required: true
            }
        },
        components: {
            Card,
            CardHead,
            CardBody,
            FormRestrictions
        },
        data() {
            return {
                visibleSections: [
                    'limitNumberOfEntries',
                    'scheduleForm',
                    'requireLogin',
                    'denyEmptySubmission'
                ]
            };
        },
        computed: {
            restrictions() {
                return this.formSettings.restrictions;
            }
        }
    }
</script>
