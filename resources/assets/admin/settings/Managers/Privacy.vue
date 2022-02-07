<template>
    <el-row v-if="roles.length">
        <div class="ninja_header">
            <h2>Managers</h2>
        </div>
        <div v-loading="loading" class="ninja_content">
            <div class="ninja_block">
                <p>
                    Administrators have full access to Fluent Forms. By
                    selecting additional roles bellow, you can give access to
                    other user roles.
                </p>
            </div>
            <hr />

            <div style="margin-bottom: 20px;" class="form-group">
                <el-checkbox
                    :indeterminate="isIndeterminate"
                    v-model="checkAll"
                    @change="handleCheckAllChange"
                >
                    Check all
                </el-checkbox>
            </div>

            <div style="margin-bottom: 20px;" class="form-group">
                <el-checkbox-group
                    v-model="capability"
                    @change="handleCheckedCapabilitiesChange"
                >
                    <el-checkbox
                        v-for="role in roles"
                        :label="role.key"
                        :key="role.key"
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
            roles: [],
            checkAll: false,
            capability: ["administrator"],
            isIndeterminate: false
        };
    },
    methods: {
        get() {
            this.loading = true;
            FluentFormsGlobal.$get({
                action: "fluentform_get_access_roles"
            })
                .then(response => {
                    let capability = response.data.capability;
                    if (!capability || typeof capability != "object") {
                        capability = ["administrator"];
                    }
                    this.capability = capability;
                    this.roles = response.data.roles;
                    this.handleCheckedCapabilitiesChange(this.capability, false);
                })
                .fail(e => {})
                .always(() => {
                    this.loading = false;
                });
        },
        store() {
            if (!this.roles.length) {
                return;
            }
            let data = {
                action: "fluentform_set_access_roles",
                capability: this.capability
            };
            FluentFormsGlobal.$post(data)
                .then(response => {
                    this.$notify.success({
                        title: "Great!",
                        message: response.data.message,
                        offset: 30
                    });
                })
                .fail(e => {
                    this.$notify.error({
                        message: e.responseJSON.data.message,
                        offset: 30
                    });
                });
        },
        handleCheckAllChange(val) {
            this.capability = val ? this.roles.map(item => item.key) : [];
            this.isIndeterminate = false;
            this.store();
        },
        handleCheckedCapabilitiesChange(value, store = true) {
            let checkedCount = value.length;
            this.checkAll = checkedCount === this.roles.length;
            this.isIndeterminate =
                checkedCount > 0 && checkedCount < this.roles.length;
            
            if (store) {
                this.store();
            }
        }
    },
    mounted() {
        this.get();
    }
};
</script>
