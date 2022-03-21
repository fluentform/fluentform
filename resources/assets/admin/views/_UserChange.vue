<template>
    <div class="ff_entry_user_change">
        <el-button @click="showModal()" type="text" size="mini" icon="el-icon-edit"></el-button>
        <el-dialog
            :append-to-body="true"
            v-if="showing_modal"
            title="Select User for this submission"
            :visible.sync="showing_modal"
            width="50%">
            <div class="ff_uc_body">
                <p v-if="submission.user">This entry was submitted by <a target="_blank" rel="noopener" :href="submission.user.permalink">{{ submission.user.name }}</a>, You can change the associate user by using the following form</p>
                <p v-else>This entry was submitted by guest user. You can assign a new user for this entry</p>
                <h4>Select corresponding user</h4>
                <el-select style="width: 100%" v-model="selected_id"
                           filterable
                           remote
                           placeholder="Search User"
                           :remote-method="fetchUsers"
                           :loading="searching"
                >
                    <el-option
                        v-for="item in users"
                        :key="item.ID"
                        :label="item.label"
                        :value="item.ID">
                    </el-option>
                </el-select>
            </div>
            <span slot="footer" class="dialog-footer">
                <el-button @click="showing_modal = false">Cancel</el-button>
                <el-button type="primary" :disabled="!selected_id || selected_id == submission.user_id" @click="saveUser()">Change Submitter</el-button>
          </span>
        </el-dialog>
    </div>
</template>

<script type="text/babel">
export default {
    name: 'ChangeSubmissionUser',
    props: ['submission'],
    data() {
        return {
            saving: false,
            users: [],
            searching: false,
            selected_id: '',
            showing_modal: false
        }
    },
    methods: {
        fetchUsers(query) {
            if (!query) {
                return;
            }

            this.searching = true;
            const data = {
                action: 'fluentform-get-users',
                search: query
            };
            FluentFormsGlobal.$get(data)
                .then(response => {
                    this.users = response.data.users;
                })
                .catch((errors) => {
                    this.$notify.error(errors.responseJSON.data.message);
                 })
                .always(() => {
                    this.searching = false;
                });
          },
        showModal() {
            this.showing_modal = true;
        },
        saveUser() {
            if(!this.selected_id) {
                this.$notify.error('Please select a user first');
                return;
            }

            this.saving = true;
            let data = {
                action: 'fluentform-update-entry-user',
                user_id: this.selected_id,
                submission_id: this.submission.id
            };
            FluentFormsGlobal.$post(data)
                .then(response => {
                    this.$notify.success(response.data.message);
                    this.submission.user = response.data.user;
                    this.submission.user_id = response.data.user_id;
                    this.showing_modal = false;
                })
                .catch((errors) => {
                    this.$notify.error(errors.responseJSON.data.message);
                })
                .always(() => {
                    this.saving = false;
                });

        }
    }
}
</script>