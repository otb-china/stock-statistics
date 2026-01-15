<script setup lang="ts">
import {RouterView} from 'vue-router'
import {useRouter, useRoute} from 'vue-router';
import {showConfirmDialog} from "vant";
import {whitelist} from "./utils/config";
import {LStorage} from "@/utils/localStorage.ts";

const route = useRoute()
const router = useRouter()
const loginOut = () => {
  showConfirmDialog({
    title: '提示',
    message: '确认退出吗？',
    width: "250px",
  }).then(() => {
    LStorage.token.remove();
    router.push("/login");
  }).catch(() => {
  });
};
</script>

<template>
  <template v-if="!whitelist.includes(route.path)">
    <van-floating-bubble @click="loginOut" axis="lock">
      <template #default>
        <div class="FS12">
          <div>退出</div>
          <div>登录</div>
        </div>
      </template>
    </van-floating-bubble>
  </template>

  <RouterView/>

  <van-back-top :bottom="90" :right="28"/>
</template>

<style scoped lang="scss">
:deep(.van-nav-bar__title),
:deep(.van-nav-bar__left i),
:deep(.van-nav-bar__left span) {
  color: #ffffff !important;
}
</style>