<template>
    <div class="dashboard-card-wrapper top-row">
        <div class="dashboard-card" v-if="allFormData">
            <div class="dashboard-card-info">
                <div class="dashboard-card-content">
                    <h1>{{ allFormData.value }}</h1>
                    <h6> {{ allFormData.info }} </h6>
                    <div class="form-link" v-if="viewLink(allFormData)" v-html="viewLink(allFormData)"></div>
                </div>
            </div>
        </div>
        <div class="dashboard-card" v-if="Object.entries(firstRow).length > 0">
            <div class="dashboard-card-info ">
                <div class="dashboard-card-content">
                    <ul class="card-content-list">
                        <li v-for="item in firstRow">
                            <div class="form-link" v-html="viewLink(item)"></div>
                            <div class="content-list-info">{{ item.value }}</div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="dashboard-card " v-if="Object.entries(secondRow).length > 0">
            <div class="dashboard-card-info ">
                <div class="dashboard-card-content">
                    <ul class="card-content-list">
                        <li v-for="item in secondRow">
                            <div class="form-link" v-html="viewLink(item)"></div>
                            <span class="content-list-info">{{ item.value }}</span>
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
        props: ['card_data'],
        data() {
            return {
                firstRow: {},
                secondRow: {},
            }
        },
        computed: {
            allFormData() {
                let totalForms = this.card_data.shift();
                this.splitDataInTwoArray();
                return totalForms;
            },
        },
        methods: {
            viewLink(item) {
                if (item.info && item.view_url) {
                    let link = `<a class="form-url" href="${item.view_url}"><div class="elispse">${item.info}</div></a>`
                    let newTablLink = ` <a target="_blank" class="" href="${item.view_url}"><i class="el-icon-edit-outline"></i></a>`;

                    return link + newTablLink;
                }
                return false;
            },
            splitDataInTwoArray() {
                const splitIntoTwo = Math.ceil(Object.entries(this.card_data).length) > 3;
                if (splitIntoTwo) {
                    this.firstRow = this.card_data.splice(0, 3);
                    this.secondRow = this.card_data;
                } else {
                    this.firstRow = this.card_data.splice(0, 3);
                }
            }
        },
    }
</script>
