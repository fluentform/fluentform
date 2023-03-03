<template>
    <div class="ff_entry_user_change">
        <el-button @click="showModal()" type="text" size="mini" icon="el-icon-edit"></el-button>
        <el-dialog
            :append-to-body="true"
            v-if="showing_modal"
            :title="$t('Select User for this submission')"
            :visible.sync="showing_modal"
            width="50%">
            <div class="ff_uc_body">
                <p v-if="submission.user">{{ $t('This entry was submitted by') }} <a target="_blank" rel="noopener" :href="submission.user.permalink">{{ submission.user.name }}</a>,
                    {{ $t('You can change the associate user by using the following form') }}</p>
                <p v-else>{{ $t('This entry was submitted by guest user.You can assign a new user for this entry') }}</p>
                <h4>{{ $t('Select corresponding user') }}</h4>
                <el-select style="width: 100%" v-model="selected_id"
                           filterable
                           remote
                           :placeholder="$t('Search User')"
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
                <el-button @click="showing_modal = false">{{ $t('Cancel') }}</el-button>
                <el-button type="primary" :disabled="!selected_id || selected_id == submission.user_id" @click="saveUser()">{{ $t('Change Submitter') }}</el-button>
          </span>
        </el-dialog>
    </div>
</template>

<script type="text/babel">
export default {
    name: 'ChangeSubmissionUser',
    props: ['submission','entry_id'],
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
            const route = FluentFormsGlobal.$rest.route('getSubmissionUsers', this.entry_id);
            FluentFormsGlobal.$rest.get(route, {search: query})
                .then(response => {
                    this.users = response.users;
                })
                .catch(error => {
                    this.$fail(errors.message);
                })
                .finally(() => {
                    this.searching = false;
                });
        },
        showModal() {
            this.showing_modal = true;
        },
        saveUser() {
            if (!this.selected_id) {
                this.$notify.error('Please select a user first');
                return;
            }
            this.saving = true;
            const route = FluentFormsGlobal.$rest.route('updateSubmissionUser', this.entry_id);
            FluentFormsGlobal.$rest.post(route, {
                user_id: this.selected_id,
                submission_id: this.submission.id
            })
                .then(response => {
                    this.$success(response.message);
                    this.submission.user = response.user;
                    this.submission.user_id = response.user_id;
                    this.showing_modal = false;
                })
                .catch((errors) => {
                    this.$fail(errors.message);
                })
                .finally(() => {
                    this.saving = false;
                });
        }
    }
}
</script>
