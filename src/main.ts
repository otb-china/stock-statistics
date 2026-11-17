import { createApp } from 'vue'
// 状态管理
import { createPinia } from "pinia"
import App from './App.vue'
import router from '@/router'
// UI框架
import ElementPlus from "element-plus"
import "element-plus/dist/index.css"
// Vant组件样式
import 'vant/lib/index.css';
import Vant from "vant"
// 全局样式
import "otb-toolkit/src/styles/index.scss"
import "@/style.scss"
// 路由守卫
import "@/router/routerGuards"
import { setupPopupSwipeClose } from "@/utils/popupSwipeClose"

const app = createApp(App)
const pinia = createPinia()

app.use(pinia).use(router).use(ElementPlus).use(Vant)

app.mount('#app')

setupPopupSwipeClose()

const STEPPER_SELECTOR = ".el-input-number__increase, .el-input-number__decrease"

function guardStepperFocus(event: Event) {
  const target = event.target as HTMLElement | null
  const button = target?.closest?.(STEPPER_SELECTOR)
  if (!button) return
  if (event.type === "mousedown") event.preventDefault()
  const active = document.activeElement as HTMLElement | null
  if (active && active !== document.body && button.closest(".el-input-number")?.contains(active)) {
    active.blur()
  }
}

document.addEventListener("pointerdown", guardStepperFocus, true)
document.addEventListener("mousedown", guardStepperFocus, true)
