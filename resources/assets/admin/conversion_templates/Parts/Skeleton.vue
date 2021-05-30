<template>
    <div class="fcc_conversational_design">
        <div class="ffc_design_sidebar">
            <div class="ffc_sidebar_header">
                <ul>
                    <li @click="active_tab = 'design'">Design</li>
                    <li @click="active_tab = 'share'">Share</li>
                    <li @click="active_tab = 'meta'">Meta</li>
                </ul>
            </div>
            <div class="ffc_sidebar_body">
                <pre>{{active_tab}}</pre>
            </div>
        </div>
        <div class="ffc_design_container">
            <pre>{{active_tab}}</pre> SSS
        </div>
    </div>
</template>

<script type="text/babel">
export default {
    name: 'ConversationalDesign',
    data() {
        return {
            active_tab: 'design'
        }
    }
}
</script>
