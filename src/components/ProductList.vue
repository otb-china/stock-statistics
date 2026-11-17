<template>
  <el-input
    v-if="showSearch"
    v-model="search"
    class="manage-search"
    placeholder="搜索货品名称"
    aria-label="搜索货品名称"
    :prefix-icon="Search"
    clearable
  />

  <p v-if="!groups.length" class="product-empty">
    {{ query ? "没有匹配的货品" : "还没有货品" }}
  </p>

  <component
    :is="group.inactive ? 'details' : 'div'"
    v-for="group in groups"
    :key="String(group.inactive)"
    class="product-group"
    :open="group.inactive && query ? true : undefined"
  >
    <summary v-if="group.inactive" class="product-group-summary">
      <span>停产货品 · {{ group.items.length }}</span>
      <el-icon class="summary-arrow"><ArrowDown /></el-icon>
    </summary>
    <div class="product-list">
      <SwipeRow
        v-for="product in group.items"
        :key="product.id"
        :label="product.name"
        :actions="[
          group.inactive
            ? { name: '恢复', icon: RefreshLeft, callback: () => emit('toggle-status', product) }
            : { name: '停产', icon: VideoPause, tone: 'warning', callback: () => emit('toggle-status', product) },
          { name: '删除', icon: Delete, tone: 'danger', callback: () => emit('remove', product.id) },
        ]"
      >
      <div class="product-item" :class="{ inactive: group.inactive }">
        <button class="product-main" type="button" :aria-label="`编辑${product.name}`" @click="emit('edit', product)">
          <span class="product-title">{{ product.name }}</span>
          <span class="product-prices">
            <b>¥{{ product.defaultValue ?? 0 }}</b>
            <template v-if="product.defaultCost !== undefined"><i>成本 ¥{{ product.defaultCost }}</i></template>
          </span>
          <small class="product-recipe">{{ recipePreview(product) }}</small>
        </button>
        <div v-if="!group.inactive" class="product-side">
          <span class="product-count" :class="countClass(craftableCountForProduct(product))">
            可制 <strong>{{ craftableCountForProduct(product) }}</strong>
          </span>
          <button class="product-order" type="button" :aria-label="`为${product.name}记单`" @click="emit('order', product)">记单</button>
        </div>
        <span v-else class="product-paused">已停产</span>
      </div>
      </SwipeRow>
    </div>
    <p v-if="!group.inactive && group.items.some(sharedMaterials)" class="product-note">
      可制数量按单款计算，共用备料的货品会消耗同一份库存。
    </p>
  </component>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { ArrowDown, Delete, RefreshLeft, Search, VideoPause } from "@element-plus/icons-vue";
import SwipeRow from "@/components/SwipeRow.vue";
import type { Product } from "@/types/stock";

const props = defineProps<{
  products: Product[];
  craftableCountForProduct: (product: Product) => number;
  recipePreview: (product: Product) => string;
  sharedMaterials: (product: Product) => string;
}>();

const emit = defineEmits<{
  edit: [product: Product];
  order: [product: Product];
  "toggle-status": [product: Product];
  remove: [id: string];
}>();

const search = ref("");
const showSearch = computed(() => props.products.length > 10);

watch(showSearch, (visible) => {
  if (!visible) search.value = "";
});

function countClass(count: number) {
  if (count <= 0) return "is-danger";
  if (count < 2) return "is-warning";
  return "";
}
const query = computed(() => search.value.trim().toLowerCase());
const groups = computed(() => {
  const visible = props.products.filter((product) => product.name.toLowerCase().includes(query.value));
  return [
    { inactive: false, items: visible.filter((product) => product.status === "active") },
    { inactive: true, items: visible.filter((product) => product.status === "inactive") },
  ].filter((group) => group.items.length);
});
</script>

<style lang="scss" scoped>
.manage-search {
  margin-bottom: 10px;
}

.product-group + .product-group {
  margin-top: 12px;
}

.product-group-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 4px;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  list-style: none;
}

.product-group-summary::-webkit-details-marker {
  display: none;
}

.summary-arrow {
  transition: transform 0.2s ease;
}

details[open] .summary-arrow {
  transform: rotate(180deg);
}

.product-list {
  display: grid;
  gap: 8px;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px 12px 14px;
  border-radius: 14px;
  background: var(--surface-soft);
}

.product-item.inactive {
  opacity: 0.72;
}

.product-main {
  display: grid;
  flex: 1;
  gap: 4px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.product-title {
  overflow: hidden;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-prices {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
}

.product-prices b {
  color: var(--accent-strong);
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.product-prices i {
  color: var(--text-muted);
  font-style: normal;
}

.product-recipe {
  overflow: hidden;
  color: var(--text-subtle);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.product-count {
  color: var(--text-muted);
  font-size: 12px;
  white-space: nowrap;
}

.product-count strong {
  color: var(--accent-strong);
  font-size: 16px;
  font-variant-numeric: tabular-nums;
}

.product-count.is-warning strong {
  color: var(--warning-text);
}

.product-count.is-danger strong {
  color: var(--danger-text);
}

.product-order {
  padding: 6px 14px;
  border: 0;
  border-radius: 999px;
  background: var(--surface);
  color: var(--accent-strong);
  box-shadow: 0 0 0 1px var(--accent-border) inset;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.product-order:active {
  transform: scale(0.95);
}

.product-paused {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 11px;
}

.product-note,
.product-empty {
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 12px;
}

.product-empty {
  padding: 8px 0;
  text-align: center;
}
</style>
