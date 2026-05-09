<template>
  <button class="stat-card" :class="variant" type="button" @click="$emit('click')">
    <span class="stat-title">{{ title }}</span>
    <strong>{{ value }}</strong>
    <small :class="{ 'stat-empty-footer': !footer }">{{ footer || "占位" }}</small>
  </button>
</template>

<script lang="ts" setup>
defineProps<{
  title: string;
  value: string | number;
  footer?: string;
  variant: "income" | "materials" | "goods";
}>();

defineEmits<{
  click: [];
}>();
</script>

<style lang="scss" scoped>
.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-sizing: border-box;
  min-height: 92px;
  padding: 10px;
  border: 0;
  border-radius: 10px;
  color: #ffffff;
  text-align: left;
  line-height: 1.2;
  -webkit-tap-highlight-color: transparent;
  transition: none;
}

.stat-card:active,
.stat-card:focus,
.stat-card:focus-visible {
  outline: none;
}

.stat-card.income {
  background: linear-gradient(135deg, #1b6c78 0%, #2f8d6f 100%);
}

.stat-card.materials {
  background: linear-gradient(135deg, #f0f5fb 0%, #e7eef9 100%);
  color: #1f4763;
}

.stat-card.goods {
  background: linear-gradient(135deg, #fff5e9 0%, #fff0d8 100%);
  color: #8a5c07;
}

.stat-card.income:active,
.stat-card.income:focus,
.stat-card.income:focus-visible {
  background: linear-gradient(135deg, #1b6c78 0%, #2f8d6f 100%);
  color: #ffffff;
}

.stat-card.materials:active,
.stat-card.materials:focus,
.stat-card.materials:focus-visible {
  background: linear-gradient(135deg, #f0f5fb 0%, #e7eef9 100%);
  color: #1f4763;
}

.stat-card.goods:active,
.stat-card.goods:focus,
.stat-card.goods:focus-visible {
  background: linear-gradient(135deg, #fff5e9 0%, #fff0d8 100%);
  color: #8a5c07;
}

.stat-title,
.stat-card strong,
.stat-card small {
  display: block;
}

.stat-title {
  margin-bottom: 8px;
  font-size: 12px;
  opacity: 0.82;
}

.stat-card strong {
  margin-top: 6px;
  font-size: 24px;
  line-height: 1;
}

.stat-card small {
  margin-top: 8px;
  font-size: 12px;
  text-align: right;
  opacity: 0.82;
}

.stat-empty-footer {
  visibility: hidden;
}
</style>
