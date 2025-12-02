<script setup lang="ts">
interface Props {
  num: number
}

const props = defineProps<Props>();
import {Bottom, Top} from "@element-plus/icons-vue";
</script>

<template>
  <el-icon v-if="props.num >= 0" color="#92CA6A">
    <Top/>
  </el-icon>
  <el-icon v-else color="#E47471">
    <Bottom/>
  </el-icon>
</template>