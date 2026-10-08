import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import SectionView from '@/views/SectionView.vue'
import type { DashboardSectionId } from '@/lib/dashboardSections'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    {
      path: '/usage',
      name: 'usage',
      component: SectionView,
      props: { sectionId: 'usage' satisfies DashboardSectionId },
    },
    {
      path: '/tools',
      name: 'tools',
      component: SectionView,
      props: { sectionId: 'tools' satisfies DashboardSectionId },
    },
    {
      path: '/errors',
      name: 'errors',
      component: SectionView,
      props: { sectionId: 'errors' satisfies DashboardSectionId },
    },
    {
      path: '/payment',
      name: 'payment',
      component: SectionView,
      props: { sectionId: 'payment' satisfies DashboardSectionId },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
