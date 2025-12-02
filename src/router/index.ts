import {createRouter, createWebHashHistory, type RouteRecordRaw} from 'vue-router'
import type {RSA} from "otb-toolkit/src/types/index.ts";

export const fixRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '备料',
      header: true,
      icon: "House",
    }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      hidden: true,
    },
  },
];

const router = createRouter({
  history: createWebHashHistory((import.meta as RSA).env.BASE_URL),
  routes: fixRoutes
})
export default router
