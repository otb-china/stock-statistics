<template>
  <button class="stat-card" :class="variant" type="button" @click="$emit('click')">
    <span class="stat-head">
      <span class="stat-title">{{ title }}</span>
      <span v-if="alert" class="stat-alert" :class="alert && `is-${alert}`" aria-hidden="true"></span>
      <el-icon class="stat-arrow"><ArrowRight /></el-icon>
    </span>
    <strong>{{ value }}<small v-if="unit">{{ unit }}</small></strong>
    <span class="stat-footer" :class="alert && `is-${alert}`">{{ footer }}</span>
  </button>
</template>

<script lang="ts" setup>
import { ArrowRight } from "@element-plus/icons-vue";

defineProps<{
  title: string;
  value: string | number;
  unit?: string;
  footer?: string;
  alert?: "warning" | "danger";
  variant: "materials" | "goods";
}>();

defineEmits<{
  click: [];
}>();
</script>

<style lang="scss" scoped>
.stat-card {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  min-width: 0;
  padding: 14px;
  border: 0;
  border-radius: 18px;
  background: var(--surface);
  color: var(--text-strong);
  font: inherit;
  text-align: left;
  line-height: 1.2;
  cursor: pointer;
  box-shadow: var(--shadow);
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s ease;
}

.stat-card:active {
  transform: scale(0.97);
}

.stat-card:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.stat-head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 13px;
}

.stat-title::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 3px;
  background: var(--stat-materials-text);
}

.goods .stat-title::before {
  background: var(--stat-goods-text);
}

.stat-alert {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--warning-text);
  box-shadow: 0 0 0 3px var(--warning-bg);
}

.stat-alert.is-danger {
  background: var(--danger-text);
  box-shadow: 0 0 0 3px var(--danger-bg);
}

.stat-arrow {
  margin-left: auto;
  color: var(--text-subtle);
  font-size: 13px;
}

.stat-card strong {
  margin-top: 12px;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-card strong small {
  margin-left: 3px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
}

.stat-footer {
  margin-top: 10px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-footer.is-warning {
  color: var(--warning-text);
}

.stat-footer.is-danger {
  color: var(--danger-text);
}
</style>
