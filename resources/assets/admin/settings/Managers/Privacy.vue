<template>
    <el-row v-if="roles.length">
        <div class="ninja_header">
            <h2>{{ $t('Managers') }}</h2>
        </div>
        <div v-loading="loading" class="ninja_content">
            <div class="ninja_block">
                <p>
                    {{
                        $t('Administrators have full access to Fluent Forms.By selecting additional roles bellow, you can give access to other user roles.')
                    }}
                </p>
            </div>
            <hr/>

            <div style="margin-bottom: 20px;" class="form-group">
                <el-checkbox
                    :indeterminate="isIndeterminate"
                    v-model="checkAll"
                    @change="handleCheckAllChange"
                >
                    {{ $t('Check all') }}
                </el-checkbox>
            </div>

            <div style="margin-bottom: 20px;" class="form-group">
                <el-checkbox-group
                    :value="capability"
                    @change="handleCheckedCapabilitiesChange"
                >
                    <el-checkbox
                        v-for="role in roles"
                        :label="role.key"
                        :key="role.key"
                        @change="handleChange"
                    >
                        {{ role.name }}
                    </el-checkbox>
                </el-checkbox-group>
            </div>
        </div>
    </el-row>
</template>

<script>
export default {
    name: "Privacy",
    data() {
        return {
            loading: false,
            checkAll: false,
            isIndeterminate: false
        };
    },
    props: ['roles', 'capability'],
    methods: {
        handleFetchedData() {
            let capability = this.capability;
            if (!capability || typeof capability != "object") {
                capability = ["administrator"];
            }
            this.handleCheckedCapabilitiesChange(this.capability, false);
        },
        store() {
            if (!this.roles.length) {
                return;
            }

            const url = FluentFormsGlobal.$rest.route('storeRoles');
            let data = {
                capability: this.capability
            };

            FluentFormsGlobal.$rest.post(url, data)
                .then(response => {
                    this.$success(response.message);
                })
                .catch(e => {
                    this.$fail(e.message);
                })
                .finally(() => {

                });
        },
        handleCheckAllChange(val) {
            const filteredCapability = val ? this.roles.map(item => item.key) : [];
            this.isIndeterminate = false;
            this.$emit('filteredCapability', filteredCapability);
            this.$nextTick(function () {
                this.store();
            });
        },
        handleCheckedCapabilitiesChange(value, store = true) {
            let checkedCount = value.length;
            this.checkAll = checkedCount === this.roles.length;
            this.isIndeterminate = checkedCount > 0 && checkedCount < this.roles.length;
            if (store) {
                this.store();
            }
        },
        handleChange(value) {
            let filteredCapability = this.capability;
            const targetValue = event.target.value;

            if (value) {
                if (this.capability.indexOf(targetValue) === -1) {
                    filteredCapability.push(targetValue);
                }
            } else {
                filteredCapability = this.capability.filter(e => e !== targetValue);
            }

            this.$emit('filteredCapability', filteredCapability);
        }
    },
    updated() {
        this.handleFetchedData();
    },
};
</script>
