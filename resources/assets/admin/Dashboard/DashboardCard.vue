<template>
    <div v-if="Object.entries(formattedCardData).length>0" class="dashboard-card-wrapper"   >
        <div  class="dashboard-card" v-for="(item,i) in formattedCardData" :key="i" v-if="visible_cards.indexOf(item.info) !== -1">
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
<!--            <span class="dashboard-card-settings">-->
<!--                <el-button plain> <span class="dashicons dashicons-ellipsis dashboard-card-settings"></span></el-button>-->

<!--            </span>-->
        </div>
    </div>


</template>
<script>

    export default {
        name: 'DashboardCard',
        props: ['card_data', 'visible_cards'],
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
        },
        computed:{
            formattedCardData(){
                if (this.visible_cards && this.card_data){
                    let cards= this.card_data.filter((item) => this.visible_cards.indexOf(item.info) !== -1);
                    return cards;
                }

            }
        }

    };

</script>
