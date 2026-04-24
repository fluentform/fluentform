<template>
    <div v-if="showSearch" class="global-search-wrapper" @click="reset">
        <div class="global-search-container" v-loading="loading" @click.stop>
            <div ref="searchBody" class="global-search-body">
                <div class="el-input el-input--prefix">
                    <input
                        ref="searchInput"
                        :placeholder="$t(placeholder)"
                        autocomplete="off"
                        name="search"
                        prefix-icon="el-icon-search"
                        type="text"
                        @input="search($event.target.value)"
                    />
                    <span class="el-input__prefix"><i class="el-input__icon el-icon-search"></i></span>
                </div>

                <ul class="search-result">
                    <template v-if="filteredLinks.length">
                        <li
                            v-for="(link, index) in filteredLinks"
                            ref="links"
                            :key="'link_' + index"
                            :class="{ 'active-search-link': linkFocusIndex === index }"
                            tabindex="1"
                            @click="goToSlug(link.item || link)"
                        >
                            <span>{{ link.item?.title || link.title }}</span>
                        </li>
                    </template>
                    <li v-else>
                        <span>{{ $t('Search not match. Try a different query.') }}</span>
                    </li>
                </ul>
            </div>

            <div>
                <ul class="search-commands">
                    <li>{{ $t('Esc to close') }}</li>
                    <li>
                        {{ $t('Navigate') }}
                        <i class="el-icon-bottom"></i>
                        <i class="el-icon-top"></i>
                    </li>
                    <li>{{ $t('Tab to focus search') }}</li>
                    <li>{{ $t('Enter to Select') }}</li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import Fuse from 'fuse.js';

export default {
    name: 'GlobalSearch',
    data() {
        return {
            showSearch: false,
            placeholder: 'Search anything',
            links: [],
            filteredLinks: [],
            adminUrl: '',
            siteUrl: '',
            linkFocusIndex: 0,
            loading: true,
            fuse: null,
        };
    },
    created() {
        if (window.fluent_forms_global_var?.global_search_active === 'yes') {
            document.addEventListener('keydown', this.listener);
            document.addEventListener('global-search-menu-button-click', this.handleGlobalSearchButtonClick);
        }
    },
    beforeUnmount() {
        document.removeEventListener('keydown', this.listener);
        document.removeEventListener('global-search-menu-button-click', this.handleGlobalSearchButtonClick);
    },
    methods: {
        handleGlobalSearchButtonClick() {
            this.listener({ ctrlKey: true, metaKey: true, keyCode: 75 });
        },
        getSearchData() {
            const url = this.$api.route('globalSearch');

            this.$api.get(url)
                .then((response) => {
                    this.adminUrl = response.admin_url;
                    this.siteUrl = response.site_url;
                    this.links = response.links;
                    this.fuse = new Fuse(this.links, {
                        minMatchCharLength: 2,
                        threshold: 0.4,
                        keys: ['title', 'tags'],
                    });
                    this.filteredLinks = this.links.slice(0, 7);
                })
                .catch((error) => {
                    // Keep the current behavior soft-failing on search bootstrap errors.
                    // eslint-disable-next-line no-console
                    console.error(error);
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        search(value) {
            this.linkFocusIndex = 0;

            if (!value) {
                this.filteredLinks = this.links.slice(0, 7);
                return;
            }

            this.filteredLinks = this.fuse?.search(value, { limit: 50 }) || this.links.slice(0, 7);
        },
        reset() {
            if (this.showSearch) {
                this.showSearch = false;
            }
            this.linkFocusIndex = 0;
        },
        goToSlug(link) {
            const oldUrl = new URL(window.location.href);

            if (link.type === 'preview') {
                window.location.href = `${this.siteUrl}/${link.path}`;
                return;
            }

            window.location.href = this.adminUrl + link.path;

            if (this.shouldReload(link, oldUrl)) {
                window.location.reload();
            }
        },
        shouldReload(link, oldUrl) {
            const url = new URL(link.path, this.adminUrl);
            const oldPage = oldUrl.searchParams.get('page');
            const newPage = url.searchParams.get('page');
            const oldComponent = oldUrl.searchParams.get('component');
            const newComponent = url.searchParams.get('component');
            const oldFormId = oldUrl.searchParams.get('form_id');
            const newFormId = url.searchParams.get('form_id');
            const oldRoute = oldUrl.searchParams.get('route');
            const newRoute = url.searchParams.get('route');

            if (newPage !== oldPage) {
                return false;
            }

            if ((oldFormId || newFormId) && oldFormId !== newFormId) {
                return false;
            }

            if ((oldRoute || newRoute) && oldRoute === newRoute) {
                return true;
            }

            if ((oldComponent || newComponent) && oldComponent === newComponent) {
                return true;
            }

            if (!oldComponent && !newComponent && oldUrl.hash !== url.hash) {
                return true;
            }

            return false;
        },
        listener(event) {
            const isMac = window.navigator.userAgent?.toUpperCase().includes('MAC');

            if ((isMac ? event.metaKey : event.ctrlKey) && event.keyCode === 75) {
                event.preventDefault?.();

                if (!this.showSearch) {
                    this.showSearch = true;
                } else {
                    this.reset();
                    return;
                }

                setTimeout(() => {
                    this.$refs.searchInput?.focus();
                }, 200);

                if (!this.links.length) {
                    this.getSearchData();
                }
            }

            if (!this.showSearch) {
                return;
            }

            if (event.keyCode === 27) {
                event.preventDefault?.();
                this.reset();
            } else if (event.keyCode === 38 || event.keyCode === 40) {
                event.preventDefault?.();
                this.handleUpDownArrow(event);
            } else if (event.keyCode === 9) {
                event.preventDefault?.();
                this.$refs.searchInput?.focus();
                this.linkFocusIndex = 0;
            } else if (event.keyCode === 13 && this.filteredLinks.length) {
                const link = this.filteredLinks[this.linkFocusIndex];

                if (link) {
                    this.goToSlug(link.item || link);
                }
            }
        },
        handleUpDownArrow(event) {
            const links = this.$refs.links || [];

            if (!Array.isArray(links) || !links.length) {
                return;
            }

            this.linkFocusIndex += event.keyCode === 38 ? -1 : 1;

            if (this.linkFocusIndex >= this.filteredLinks.length || this.linkFocusIndex <= 0) {
                this.$refs.searchInput?.focus();
                this.$refs.searchBody?.scroll?.({ top: 0 });
                this.linkFocusIndex = 0;
                return;
            }

            const link = links[this.linkFocusIndex - 1];

            if (link) {
                this.$nextTick(() => {
                    link.focus();
                });
            }
        },
    },
};
</script>
