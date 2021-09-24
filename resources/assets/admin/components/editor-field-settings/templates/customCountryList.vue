<template>
    <div>
        <el-form-item label="Default Country">
            <el-select v-if="!listItem.disable_labels" filterable clearable
                       id="settings_country_list"
                       v-model="editItem.attributes.value"
                       placeholder="None"
                       class="el-fluid">
                <el-option value="" :selected="!editItem.attributes.value">None</el-option>
                <el-option v-for="(name, key, i) in countries" :value="key" :label="name" :key="key"></el-option>
            </el-select>
            <el-select v-else filterable clearable
                       id="settings_country_list"
                       v-model="editItem.settings.default_country"
                       placeholder="None"
                       class="el-fluid">
                <el-option value="" :selected="!editItem.settings.default_country">None</el-option>
                <el-option v-for="(name, key, i) in countries" :value="key" :label="name" :key="key"></el-option>
            </el-select>
        </el-form-item>

        <el-form-item label="Country List">
            <el-radio-group size="small" v-model="settings['country_list'].active_list">
                <el-radio-button label="all">Show all</el-radio-button>
                <el-radio-button label="hidden_list">Hide these</el-radio-button>
                <el-radio-button label="visible_list">Only show these</el-radio-button>
                <el-radio-button label="priority_based">Priority Based</el-radio-button>
            </el-radio-group>
            <el-select
                clearable
                filterable
                style="margin-top: 15px;"
                v-if="settings['country_list'].active_list != 'all'"
                v-model="settings['country_list'][settings['country_list'].active_list]"
                multiple placeholder="Select"
                class="el-fluid">
                <el-option
                    v-for="(name, key, i) in countries"
                    :key="key"
                    :label="name"
                    :value="key">
                </el-option>
            </el-select>
        </el-form-item>
        <template v-if="settings['country_list'].active_list == 'priority_based' && !listItem.disable_labels">
            <el-form-item label="Primary Countries Label">
                <el-input v-model="settings.primary_label"></el-input>
            </el-form-item>
            <el-form-item label="Other Countries Label">
                <el-input v-model="settings.other_label"></el-input>
            </el-form-item>
        </template>
    </div>
</template>

<script>
export default {
    name: 'customCountryList',
    props: ['listItem', 'editItem'],
    computed: {
        settings() {
            return this.editItem.settings;
        },
        countries() {
            return window.FluentFormApp.countries;
        }
    }
}
</script>
