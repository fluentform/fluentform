export default [
    {
        path: '/',
        name: 'dashboard',
        component: require('@/modules/dashboard').default,
        meta: {
            active_menu: 'dashboard'
        }
    },
    {
        path: '/posts',
        name: 'posts',
        component: require('@/modules/posts').default,
        meta: {
            active_menu: 'posts'
        },
        children: [
            {
                props: true,
                path: ':id/view',
                name: 'posts.view',
                component: require('@/modules/posts/components/View').default,
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: require('@/components/NotFound').default,
    }
];
