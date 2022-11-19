<template>
    <div v-if="Object.entries(card_data).length>0" class="dashboard-card-wrapper"   >
        <div  class="dashboard-card" v-for="(item,i) in card_data" :key="i">
            <div class="dashboard-card-info">
                <div class="dashboard-card-content">
                    <h1>{{ item.value }}</h1>
                    <h6>{{ item.info }} </h6>
                    <div class="form-link" v-if="maybeAddFormLink(item)" v-html="maybeAddFormLink(item)"></div>
                </div>
<!--                <span class="dashboard-card-icon">-->
<!--                    <i :class="card_icon"></i>-->
<!--                </span>-->
            </div>
        </div>
    </div>


</template>
<script>

    export default {
        name: 'DashboardCard',
        props: ['card_data', 'card_icon', 'interval'],
        methods: {
            maybeAddFormLink(item) {
                if (item.title && item.view_url) {
                    let link = `<a class="form-url" href="${item.view_url}"><div class="elispse">${item.title}</div></a>`
                    let newTablLink =  ` <a target="_blank" class="" href="${item.view_url}"><i class="el-icon-edit-outline"></i></a>`;

                    return link + newTablLink;
                }
                return false;
            },
            maybeAddFormLinkNewTab(item) {

                return false;
            }
        }
    };

</script>
