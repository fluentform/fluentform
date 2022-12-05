<template>
    <div class="dashboard-card-wrapper top-row"  >
        <div class="dashboard-card" v-if="Object.entries(cardHeaderData).length > 0" >
            <div class="dashboard-card-info">
                <div class="dashboard-card-content">
                    <h1>{{ cardHeaderData.value }}</h1>
                    <h6> {{ cardHeaderData.info }} </h6>
                    <div class="form-link" v-if="viewLink(cardHeaderData)" v-html="viewLink(cardHeaderData)"></div>
                </div>
            </div>
        </div>
        <div class="dashboard-card" v-for="rows in rowsFormatted" v-if="rows.length > 0" >
            <div class="dashboard-card-info ">
                <div class="dashboard-card-content">
                    <ul class="card-content-list">
                        <li v-for="item in rows">
                            <div class="form-link" v-html="viewLink(item)"></div>
                            <div class="content-list-info">{{ item.value }}</div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>


    </div>
</template>
<script>
    export default {
        name: 'DashboardListCard',
        props: ['card_data','visible_cards'],
        data() {
            return {
                rowCount: 0,
                rowsFormatted: [],
            }
        },
        computed: {
            cardHeaderData() {
                let cardHeader = this.formattedCardData.shift();
                this.splitDataInTwoArray();
                if (cardHeader && this.visible_cards.indexOf(cardHeader.info) !== -1){
                    return cardHeader;
                }
                return [];
            },
            formattedCardData(){
                return this.card_data.filter((item) => this.visible_cards.indexOf(item.info) !== -1);
            }
        },
        methods: {
            viewLink(item) {
                if (item.info && item.view_url) {
                    let link = `<a class="form-url" href="${item.view_url}"><div class="elispse">${item.info}</div></a>`
                    let newTablLink = ` <a target="_blank" class="" href="${item.view_url}"><i class="el-icon-edit-outline"></i></a>`;

                    return link + newTablLink;
                }else if (item.info){
                    return  item.info;
                }
                return false;
            },
            splitDataInTwoArray() {
                const visibleCards = this.formattedCardData
                this.rowCount = Math.ceil(visibleCards.length / 4);
                this.rowsFormatted = [];

                if (this.rowCount > 1) {
                    for (let i =0 ; i< this.rowCount ; i ++){
                        let items = visibleCards.splice(0,4);
                        this.rowsFormatted.splice(i,0,items)
                    }
                } else {
                    this.rowsFormatted.push(visibleCards.splice(0,4))
                }

            }
        },
    }
</script>
