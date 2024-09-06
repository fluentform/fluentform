import { createRouter, createWebHashHistory } from 'vue-router';
import routes from '@/router/routes';

const router = createRouter({
    history: createWebHashHistory(),
    strict: true,
    routes,
});

router.afterEach((to, from) => {
    const slug = fluentFrameworkAdmin.slug;
    const activeMenu = to.meta.active_menu;

    jQuery('.fframe_menu li').removeClass('active_item');
    jQuery(`.fframe_menu li.fframe_item_${activeMenu}`).addClass('active_item');

    jQuery(`.toplevel_page_${slug} li`).removeClass('current');
    jQuery(`.toplevel_page_${slug} li.${slug}_activeMenu`).addClass('current');

    if (to.meta.title) {
        jQuery('head title').text(`${to.meta.title} - Fluent Framework`);
    }
});

export default router;
