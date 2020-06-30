<template>
    <div class="addresss_editor">
        <div v-for="(eachField,fieldKey) in field.raw.fields" class="each_address_field">
            <label>{{getLaebel(eachField)}}</label>
            <el-input type="text" size="mini" v-model="value[fieldKey]"></el-input>
        </div>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'AddressEditor',
        props: ['value', 'field'],
        methods: {
          getLaebel(field) {
              return field.settings.admin_field_label || field.settings.label || field.attributes.name;
          }
        },
        created() {
            if(!this.value) {
                this.value = {};
            }
        }
    }
</script>