<template>
    <div class="ff_block_item" v-if="roles.length">
        <h6 class="ff_block_title mb-1">{{ $t('Role Based') }}</h6>
        <p>{{ $t('Administrators have full access to Fluent Forms.By selecting additional roles bellow, you can give access to other user roles.') }}</p>
        <div class="ff_block_item_body">
            <div class="mb-3">
                <el-checkbox :indeterminate="isIndeterminate" v-model="checkAll" @change="handleCheckAllChange">
                    {{ $t('Check all') }}
                </el-checkbox>
            </div>
            <el-checkbox-group v-model="capability" @change="handleCheckedCapabilitiesChange">
                <el-checkbox v-for="role in roles" :label="role.key" :key="role.key">
                    {{ role.name }}
                </el-checkbox>
            </el-checkbox-group>
        </div>
    </div><!-- .ff_block_item -->
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
                    this.$success(response.data.message);
                })
                .fail(e => {
                    this.$fail(e.responseJSON.data.message);
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
