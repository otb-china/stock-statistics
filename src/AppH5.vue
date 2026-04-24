<script setup lang="ts">
import {RouterView} from 'vue-router'
</script>

<template>
  <RouterView/>
</template>

<style scoped lang="scss">
:deep(.van-nav-bar__title),
:deep(.van-nav-bar__left i),
:deep(.van-nav-bar__left span) {
  color: #ffffff !important;
}
</style>
