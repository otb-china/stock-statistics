import { createApp } from 'vue'
// 状态管理
import { createPinia } from "pinia"
import App from './App.vue'
import router from '@/router'
// UI框架
import ElementPlus from "element-plus"
import "element-plus/dist/index.css"
import * as ElementPlusIconsVue from "@element-plus/icons-vue"
// Vant组件样式
import 'vant/lib/index.css';
import Vant from "vant"
// 全局样式
import "otb-toolkit/src/styles/index.scss"
import "@/style.scss"
// 路由守卫
import "@/router/routerGuards"
import {SStorage} from "@/utils/sessionStorage.ts";


const app = createApp(App)
const pinia = createPinia()

const iconKeyList = []
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  iconKeyList.push(key)
  app.component(key, component)
}
SStorage.new("iconKeyList").setter(iconKeyList)

app.use(pinia).use(router).use(ElementPlus).use(Vant)

app.mount('#app')
