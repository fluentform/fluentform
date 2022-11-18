<template>
    <div v-if="Object.entries(card_data).length>0" class="dashboard-card" trigger="click" height="140px" arrow="never" :autoplay="true" :interval="parseInt(interval)">
        <div  class="dashboard-card-wrapper" v-for="(item,i) in card_data" :key="i">
            <div class="dashboard-card-info">
                <div class="dashboard-card-content">
                    <h1>{{ item.value }}</h1>
                    <h6>{{ item.info }} </h6>
                    <div class="form-link" v-if="maybeAddFormLink(item)" v-html="maybeAddFormLink(item)"></div>
                </div>
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
                    let newTabLink = `<a target="_blank" href="${item.view_url}"><i class="el-icon-edit-outline"></i></a>`;
                    let link = `<a class="form-url" href="${item.view_url}"><div class="elispse">${item.title}</div></a>`
                    return link + newTabLink;
                }
                return false;
            }
        }
    };

</script>
