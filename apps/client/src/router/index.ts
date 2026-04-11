import { createRouter, createWebHashHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
    },
    {
      path: '/levels',
      name: 'levels',
      component: () => import('@/pages/LevelSelectPage.vue'),
    },
    {
      path: '/play/:levelNum',
      name: 'play',
      component: () => import('@/pages/PlayPage.vue'),
      props: (route) => ({ levelNum: Number(route.params.levelNum) }),
    },
    {
      path: '/shop',
      name: 'shop',
      component: () => import('@/pages/ShopPage.vue'),
    },
    {
      path: '/kingdom',
      name: 'kingdom',
      component: () => import('@/pages/KingdomPage.vue'),
    },
    {
      path: '/referral',
      name: 'referral',
      component: () => import('@/pages/ReferralPage.vue'),
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: () => import('@/pages/LeaderboardPage.vue'),
    },
  ],
});
