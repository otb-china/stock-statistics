import router from '@/router'
import {whitelist} from "@/utils/config.ts";
import {LStorage} from "@/utils/localStorage.ts";

// 监听路由变化
router.beforeEach((to, _from, next) => {
  // 动态设置标题
  if (to.meta.title) document.title = to.meta.title as string;

  if (to.path === "/login") LStorage.token.remove();

  // token登录
  const Token = LStorage.token.getter();
  if (!Token && !whitelist.includes(to.path)) next(`/login?redirect=${to.fullPath}`)
  if (Token) if (to.path === "/login") next('/')

  next()
})